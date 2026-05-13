import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../lib/api.client';
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
        const savedToken = tokenStorage.getToken();

        if (!savedToken) {
            setIsLoading(false);
            return;
        }

        try {
            setToken(savedToken);
            const response = await apiClient.get('/auth/me');
            if (response.data.success) {
                // API /auth/me returns user data directly in data field
                setUser(response.data.data);
            }
        } catch (error) {
            // Token is invalid
            tokenStorage.removeToken();
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
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
            
            console.log('🔐 Login response:', response.data);

            if (response.data.success) {
                const { token: newToken, user: newUser } = response.data.data;
                
                console.log('🔑 Token received:', newToken);
                console.log('👤 User:', newUser);
                
                // Save to localStorage (for API calls)
                tokenStorage.setToken(newToken);
                console.log('✅ Token saved to localStorage');
                
                // IMPORTANT: Save to cookie (for backend middleware verification)
                // Only use 'secure' flag on HTTPS (production)
                // Use 'lax' instead of 'strict' to allow cookie in navigation
                const isHttps = window.location.protocol === 'https:';
                const secureFlag = isHttps ? '; secure' : '';
                document.cookie = `auth_token=${newToken}; path=/; max-age=${60*60*24*30}; samesite=lax${secureFlag}`;
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
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear localStorage token
            tokenStorage.removeToken();
            
            // Clear cookie
            document.cookie = 'auth_token=; path=/; max-age=0';
            
            setToken(null);
            setUser(null);
            window.location.href = '/login';
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
