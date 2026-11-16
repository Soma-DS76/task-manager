
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser
} from '../api/authApi';

import { clearAuthTokens } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Save authentication tokens
    const saveTokens = (data) => {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
    };

    // Login
    const login = async (credentials) => {
        const data = await loginUser(credentials);

        saveTokens(data);
        setUser(data.user);

        return data;
    };

    // Register
    const register = async (userData) => {
        const data = await registerUser(userData);

        saveTokens(data);
        setUser(data.user);

        return data;
    };

    // Logout
    const logout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        try {
            if (refreshToken) {
                await logoutUser(refreshToken);
            }
        } finally {
            clearAuthTokens();
            setUser(null);
        }
    };

    // Restore login after refreshing the browser
    useEffect(() => {
        const restoreUser = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (!accessToken && !refreshToken) {
                setLoading(false);
                return;
            }

            try {
                const data = await getCurrentUser();
                setUser(data.user);
            } catch (error) {
                clearAuthTokens();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreUser();
    }, []);

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider.');
    }

    return context;
}
