// This file contains the dashboard redirect interface.

import { Navigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '../context/AuthContext';

// Show the dashboard redirect interface.
const DashboardRedirect = () => {
    const { user } = useAuth();
    return <Navigate to={getDashboardPath(user?.role)} replace />;
};

export default DashboardRedirect;
