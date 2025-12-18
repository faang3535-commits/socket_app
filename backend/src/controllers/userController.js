require('dotenv').config();
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
      const users = await prisma.users.findMany({
        where: {
          id: { not: req.user.id },
        },
        select: {
          id: true,
          username: true,
        },
      });

      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const messages = await prisma.messages.findMany({
        where: { roomId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { sentAt: "asc" },
      });
      const lastSeen = await prisma.rooms.findMany({
        where: {
          roomId: roomId,
        },
        select: {
          userId: true,
          lastSeen: true,
        },
      });
      res.json({ messages, lastSeen });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  },
};

module.exports = userController;
