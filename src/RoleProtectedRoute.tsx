import { Navigate } from 'react-router-dom';

export default function RoleProtectedRoute({ children, requiredRole, userData }: any) {
    
    if (!userData) {
      return null; // Or a loading spinner
    }
    if (userData.user.role !== requiredRole) {
      return <Navigate to="/" replace />; 
    }
    return children;
  };