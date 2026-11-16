
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(
        () => localStorage.getItem('theme') === 'dark'
    );

    useEffect(() => {
        document.body.dataset.theme = darkMode ? 'dark' : 'light';
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Unable to blacklist refresh token:', error);
            window.alert(
                'You were signed out locally, but the refresh token could not be revoked.'
            );
        }
        navigate('/login', { replace: true });
    };

    const displayName = user?.first_name
        ? user.first_name
        : user?.username || user?.email;

    return (
        <nav className='navbar'>
            <Link to='/dashboard' className='navbar-brand'>
                Task Manager
            </Link>

            <div className='navbar-links'>
                <Link to='/dashboard'>Dashboard</Link>
                <Link to='/tasks'>Tasks</Link>
                <Link to='/categories'>Categories</Link>
                <Link to='/profile'>Profile</Link>
            </div>

            <div className='navbar-user'>
                <span>Welcome, {displayName}</span>

                <button
                    type='button'
                    onClick={() => setDarkMode((previous) => !previous)}
                    className='theme-toggle'
                    aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                >
                    {darkMode ? 'Light mode' : 'Dark mode'}
                </button>

                <button
                    type='button'
                    onClick={handleLogout}
                    className='logout-button'
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
