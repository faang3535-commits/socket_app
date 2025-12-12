
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userController = {
  registerUser: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { username: username }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword
        }
      });

      // Create token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username
        }
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  loginUser: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { username: username }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Get current user profile (protected route example)
  getProfile: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true } // Exclude password
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
};

module.exports = userController;
