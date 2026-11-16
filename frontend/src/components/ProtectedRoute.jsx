
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Loading from './Loading';

export function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}

export function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (isAuthenticated) {
        return <Navigate to='/dashboard' replace />;
    }

    return children;
}
