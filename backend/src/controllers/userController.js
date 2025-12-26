require('dotenv').config();
// import supabase from '../../config/supabase';
const prisma = require('../../prisma');

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
      const { message } = req.body;
      await prisma.messages.update({
        where: {
          id: message.id,
        },
        data: {
          content: message.content,
        },
      });
      res.json(message);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error", error });
    }
  },

  deleteMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { URL } = req.query;
      await prisma.messages.delete({
        where: {
          id,
        },
      });
      // if (URL) {
      //   await supabase
      //     .from('images')
      //     .delete()
      //     .eq('id', URL)
      // }
      res.json({ id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error", error });
    }
  },
};

module.exports = userController;
