import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  // Add debug logs
  console.log('AdminRoute check:', {
    user,
    isAdmin: user?.isAdmin,
    hasAdminToken: !!localStorage.getItem('adminToken')
  });

  // Check if user is logged in and is an admin
  if (!user || !user.isAdmin) {
    // Redirect to admin login instead of regular login
    return <Navigate to="/admin/login" />;
  }

  return children;
};

export default AdminRoute; 