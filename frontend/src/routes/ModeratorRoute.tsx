import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ModeratorRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Moderator/Admin route wrapper - requires moderator or admin role
 */
export function ModeratorRoute({ children, redirectTo = '/' }: ModeratorRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for moderator or admin role
  const role = user?.role;
  if (role !== 'MODERATOR' && role !== 'ADMIN') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
