import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ProtectedRoute for standard authenticated users
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// AdminRoute for admin-only pages
export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/admin&tab=admin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard?adminDenied=true" replace />;
  }

  return children;
};
