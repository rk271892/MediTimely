export const adminMiddleware = async (req, res, next) => {
  try {
    console.log('Admin middleware check');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    if (!req.user || !req.user.isAdmin) {
      console.log('Admin check failed:', {
        hasUser: !!req.user,
        isAdmin: req.user?.isAdmin
      });
      return res.status(403).json({ 
        message: 'Not authorized as admin',
        debug: {
          hasUser: !!req.user,
          isAdmin: req.user?.isAdmin
        }
      });
    }
    
    console.log('Admin check passed');
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error in admin check' });
  }
}; 