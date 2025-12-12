
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userController = {
  registerUser: async (req, res) => { 
    const { username, password } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { username: username }
      });

      if (existingUser) {  
        return res.status(400).send('Username already exists');
      }

      await prisma.user.create({
        data: {
          username,
          password 
        }   
      });

      res.redirect('/users/login');
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).send('Internal Server Error');
    }
  },

  loginUser: async (req, res) => { 
    const { username, password } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: {
          username: username,
          password: password 
        }
      });

      if (user) {
        res.send('Login successful');
      } else {
        res.status(400).send('Invalid credentials');
      }
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).send('Internal Server Error');
    }
  }
};

module.exports = userController;
