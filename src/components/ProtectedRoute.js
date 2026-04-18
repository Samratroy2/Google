import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function ProtectedRoute({ children }) {
  const { user } = useApp();

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;