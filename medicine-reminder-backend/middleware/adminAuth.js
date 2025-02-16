export const adminAuth = async (req, res, next) => {
  try {
    if (req.user.isAdmin !== true) {
      console.log('Admin access denied:', {
        userId: req.user._id,
        isAdmin: req.user.isAdmin
      });
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 