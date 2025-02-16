import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      phone
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    console.log('Admin registration attempt:', { email });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create admin user
    const user = new User({
      name,
      email,
      password,
      phone,
      isAdmin: true  // Set this user as admin
    });

    await user.save();
    console.log('Admin user created:', {
      email: user.email,
      isAdmin: user.isAdmin
    });

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ 
      message: 'Failed to register admin',
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    logger.info('Login attempt', { email: req.body.email });
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email format
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('Login successful', { userId: user._id });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    logger.error('Login failed', { 
      error: error.message,
      email: req.body.email 
    });
    res.status(500).json({ message: 'Login failed' });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt:', email);

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password +isAdmin');
    
    const isAdmin = await User.findOne(
      { _id: user._id },
      { isAdmin: 1 }
    ).lean();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      whatsappNumber: user.whatsappNumber,
      telegramChatId: user.telegramChatId,
      isAdmin: isAdmin?.isAdmin === true,
      createdAt: user.createdAt
    };

    console.log('GetMe response:', { 
      user: userResponse,
      rawIsAdmin: isAdmin?.isAdmin,
      type: typeof userResponse.isAdmin
    });

    res.json({
      user: userResponse
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify the user exists and is still an admin
    const user = await User.findById(decoded.userId).select('+isAdmin');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export default {
  register,
  registerAdmin,
  login,
  adminLogin,
  getMe,
  verifyAdminToken
}; 