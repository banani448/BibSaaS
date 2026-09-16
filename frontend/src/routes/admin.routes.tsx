import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

import AdminPage from '../pages/admin/AdminPage';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
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
