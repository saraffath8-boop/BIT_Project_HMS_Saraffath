import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles, children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const normalizedRole = typeof user?.role === 'string' ? user.role.trim().toLowerCase() : '';
    if (!user || !allowedRoles.includes(normalizedRole)) {
        return <Navigate to="/unauthorized" replace state={{ blockedPath: location.pathname }} />;
    }
    return children;
};

export default RoleRoute;
