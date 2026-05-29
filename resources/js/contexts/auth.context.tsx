import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../lib/api.client';
import type { AuthTokenScope } from '../lib/token.storage';
import { tokenStorage } from '../lib/token.storage';
import type { AuthContextType, AuthResponse, LoginCredentials, NhanVien } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<NhanVien | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && !!token;

    const isAdminPath = () => window.location.pathname.startsWith('/admin');
    const tokenScope = (): AuthTokenScope => (isAdminPath() ? 'admin' : 'user');
    const tokenCookieName = () => (isAdminPath() ? 'admin_auth_token' : 'user_auth_token');
    const clearTokenCookie = (name: string) => {
        document.cookie = `${name}=; path=/; max-age=0`;
    };
    const saveTokenCookie = (name: string, value: string) => {
        const isHttps = window.location.protocol === 'https:';
        const secureFlag = isHttps ? '; secure' : '';
        document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secureFlag}`;
    };

    /**
     * Check authentication status on mount
     */
    useEffect(() => {
        checkAuth();
    }, []);

    /**
     * Verify token and load user data
     */
    const checkAuth = async () => {
        setIsLoading(true);
        const scope = tokenScope();
        const savedToken = tokenStorage.getToken(scope);

        if (!savedToken) {
            setIsLoading(false);
            return;
        }

        try {
            setToken(savedToken);
            const endpoint = scope === 'admin' ? '/admin/auth/me' : '/auth/me';

            const response = await apiClient.get(endpoint);
            if (response.data.success) {
                // API returns user data directly in data field
                setUser(response.data.data);
            }
        } catch (error) {
            // Token is invalid
            tokenStorage.removeToken(scope);
            clearTokenCookie(tokenCookieName());
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Login user
     */
    const login = async (credentials: LoginCredentials) => {
        try {
            const isAdminPath = window.location.pathname.startsWith('/admin');
            const endpoint = isAdminPath ? '/admin/auth/login' : '/auth/login';
            const response = await apiClient.post<AuthResponse>(endpoint, credentials);

            console.log('🔐 Login response:', response.data);

            if (response.data.success) {
                const { token: newToken, user: newUser } = response.data.data;

                console.log('🔑 Token received:', newToken);
                console.log('👤 User:', newUser);

                // Save to localStorage (for API calls)
                const scope = tokenScope();
                tokenStorage.setToken(newToken, scope);
                console.log('✅ Token saved to localStorage');

                // IMPORTANT: Save to cookie (for backend middleware verification)
                saveTokenCookie(tokenCookieName(), newToken);
                clearTokenCookie('auth_token');
                console.log('🍪 Cookie set:', document.cookie);

                setToken(newToken);
                setUser(newUser);
                console.log('✅ Login complete!');
            }
        } catch (error) {
            throw error;
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            const isAdminPath = window.location.pathname.startsWith('/admin');
            const endpoint = isAdminPath ? '/admin/auth/logout' : '/auth/logout';
            await apiClient.post(endpoint);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear localStorage token
            tokenStorage.removeToken(tokenScope());

            // Clear cookie
            clearTokenCookie(tokenCookieName());
            clearTokenCookie('auth_token');

            setToken(null);
            setUser(null);

            const isAdminPath = window.location.pathname.startsWith('/admin');
            window.location.href = isAdminPath ? '/admin/login' : '/login';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isLoading,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
