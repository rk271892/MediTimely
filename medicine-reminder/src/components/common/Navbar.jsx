import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  PlusIcon, 
  UserIcon, 
  BellIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Add Medication', path: '/add-medication', icon: PlusIcon },
    { name: 'Symptom Analyzer', path: '/symptom-analyzer', icon: HeartIcon },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-gray-800">Medi</span>
              <span className="text-2xl font-bold text-blue-600">Timely</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <BellIcon className="h-6 w-6" />
            </button>

            <div className="relative ml-3">
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600"
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 