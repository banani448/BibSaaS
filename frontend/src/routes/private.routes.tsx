import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

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

export const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
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
    </Routes>
  );
};
