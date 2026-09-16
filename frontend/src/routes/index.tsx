import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Public pages
import LandingPage from '../pages/landing/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Protected pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import HairstylesPage from '../pages/hairstyles/HairstylesPage';
import SalonsPage from '../pages/salons/SalonsPage';
import BarbersPage from '../pages/barbers/BarbersPage';
import FaceAnalysisPage from '../pages/face-analysis/FaceAnalysisPage';
import BookingsPage from '../pages/bookings/BookingsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SubscriptionsPage from '../pages/subscriptions/SubscriptionsPage';
import InvoicesPage from '../pages/invoices/InvoicesPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import AdminPage from '../pages/admin/AdminPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/hairstyles" 
        element={
          <ProtectedRoute>
            <HairstylesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/salons" 
        element={
          <ProtectedRoute>
            <SalonsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/barbers" 
        element={
          <ProtectedRoute>
            <BarbersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analyse-visage" 
        element={
          <ProtectedRoute>
            <FaceAnalysisPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bookings" 
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscriptions" 
        element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invoices" 
        element={
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};
