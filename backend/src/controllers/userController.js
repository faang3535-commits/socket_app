require('dotenv').config();
const prisma = require('../../prisma');
const { deleteFilesFromS3 } = require("../config/s3.js");
const chatBuffer = require('../services/chatBuffer');

const userController = {

  profile: async (req, res) => {
    try {
      const { username } = req.body;

      const user = await prisma.users.upsert({
        where: { id: req.user.id },
        update: { username },
        create: {
          id: req.user.id,
          username,
        },
      });

      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  getalluser: async (req, res) => {
    try {
      const { search, limit = 20, skip = 0 } = req.query;
      const whereClause = {
        id: { not: req.user.id },
      }
      if (search) {
        whereClause.username = {
          contains: search,
          mode: 'insensitive',
        }
      }

      const [users, totleCount] = await Promise.all([
        prisma.users.findMany({
          where: whereClause,
          select: {
            id: true,
            username: true,
          },
          orderBy: { username: "asc" },
          take: parseInt(limit),
          skip: parseInt(skip),
        }),
        prisma.users.count({
          where: whereClause,
        })
      ]);

      res.json({ users, pagination: { total: totleCount, limit: parseInt(limit), skip: parseInt(skip), hasmore: parseInt(skip) + parseInt(limit) < totleCount } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { cursor, limit = 50 } = req.query;
      const queryOptioons = {
        where: { roomId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { sentAt: "desc" },
        take: parseInt(limit),
      };

      if (cursor) {
        queryOptioons.cursor = {
          id: cursor,
        };
        queryOptioons.skip = 1;
      }
      const [messages, lastSeen] = await Promise.all([
        prisma.messages.findMany(queryOptioons),
        prisma.rooms.findMany({
          where: {
            roomId: roomId,
          },
          select: {
            userId: true,
            lastSeen: true,
          },
        })
      ]);
      const orderedMessages = messages.reverse();
      res.json({ messages: orderedMessages, lastSeen, nextCursor: messages.length === parseInt(limit) ? messages[messages.length - 1]?.id : null });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  editMessage: async (req, res) => {
      try {
        const { message, emoji } = req.body;
        await prisma.messages.update({
          where: {
            id: message.id,
          },
          data: {
            content: message.content,
            reaction: emoji,
          },
        });
        res.json(message);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error });
      }
  },

  deleteMessage: async (req, res) => {
    const { id } = req.params;

    try {
      const message = await prisma.messages.findUnique({
        where: { id }
      });

      if (!message) return res.status(404).json({ error: "Message not found" });

      if (message.file && message.file.length > 0) {
        await deleteFilesFromS3(message.file);
      }
      await prisma.messages.delete({
        where: { id }
      });

      res.status(200).json({ success: true, message: "Deleted everything" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  deleteMessageFromBuffer: (req, res) => {
    try {
      const { roomId, tempId } = req.body;
      if (!roomId || !tempId) {
        return res.status(400).json({ message: "roomId and tempId are required." });
      }

      chatBuffer.removeMessage(roomId, tempId);

      res.status(200).json({ success: true, message: "Message removed from buffer." });
    } catch (error) {
      console.error('Error removing message from buffer:', error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  editMessageFromBuffer: (req, res) => {
    try {
      const payload = req.body.data || req.body;
      const { roomId, tempId, content, emoji } = payload;
      
      if (!roomId || !tempId) {
        return res.status(400).json({ message: "roomId and tempId are required." });
      }

      const updates = {};
      if (content !== undefined) updates.content = content;
      if (emoji !== undefined) updates.reaction = emoji;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "Nothing to update." });
      }

      const update = chatBuffer.updateMessage(roomId, tempId, updates);

      if (!update) {
        return res.status(404).json({ message: "Message not found in buffer." });
      } else {
        res.status(200).json({ success: true, message: "Message updated in buffer." });
      }

    } catch (error) {
      console.error('Error updating message in buffer:', error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  getNotification: async (req, res) => {
    try {
      const id = req.user.id;

      const userLastseen = await prisma.users.findUnique({
        where: { id },
        select: {
          lastSeen: true,
        }
      });

      const unreadMessagesFromDB = await prisma.messages.findMany({
        where: {
          roomId: {
            contains: id,
          },
          senderId: {
            not: id,
          },
          sentAt: {
            gt: userLastseen.lastSeen,
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      const unreadMessagesFromBuffer = chatBuffer.getUnreadBufferedMessages(id);

      const allUnreadMessages = [
        ...unreadMessagesFromDB,
        ...unreadMessagesFromBuffer,
      ];
      allUnreadMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

      res.json(allUnreadMessages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },
};

module.exports = userController;
