import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../common/Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pt-20 px-4 sm:px-6 lg:px-8"
      >
        {children || <Outlet />}
      </motion.main>
    </div>
  );
}