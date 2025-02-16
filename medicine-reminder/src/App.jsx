import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { requestNotificationPermission } from './config/firebase';
import { notificationService } from './services/notification';
import MedicationList from './components/medication/MedicationList';
import AddMedication from './pages/AddMedication';
import SymptomAnalyzer from './components/symptoms/SymptomAnalyzer';
import Home from './pages/Home';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminRoute from './components/routes/AdminRoute';
import AdminPanel from './components/admin/AdminPanel';
import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/AdminOverview';
import ManageUsers from './pages/admin/ManageUsers';
import ManageMedications from './pages/admin/ManageMedications';
import ManageNotifications from './pages/admin/ManageNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import BroadcastMessage from './pages/admin/BroadcastMessage';

// Protected Route Component
const ProtectedRouteComponent = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  return children;
};

function App() {
  useEffect(() => {
    const registerNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await requestNotificationPermission();
          if (token) {
            await notificationService.registerFCMToken();
          }
        }
      } catch (error) {
        console.error('Failed to register notifications:', error);
      }
    };

    registerNotifications();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Protected routes with Layout */}
          <Route element={
            <ProtectedRouteComponent>
              <Layout />
            </ProtectedRouteComponent>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/medications" element={<MedicationList />} />
            <Route path="/add-medication" element={<AddMedication />} />
            <Route path="/symptom-analyzer" element={<SymptomAnalyzer />} />
          </Route>

          {/* Protected admin routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="manage-medications" element={<ManageMedications />} />
            <Route path="manage-notifications" element={<ManageNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="broadcast" element={<BroadcastMessage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;