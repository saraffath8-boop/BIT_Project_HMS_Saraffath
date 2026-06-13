import { Navigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
    const { user } = useAuth();
    return <Navigate to={getDashboardPath(user?.role)} replace />;
};

export default DashboardRedirect;
