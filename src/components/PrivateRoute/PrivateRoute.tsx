import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const user = useUnit($currentUser);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};