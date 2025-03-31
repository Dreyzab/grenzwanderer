import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from 'effector-react';
import { $currentUser } from '../../entities/user/model';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const user = useStore($currentUser);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};