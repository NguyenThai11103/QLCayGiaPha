const USER_TOKEN_KEY = 'user_auth_token';
const ADMIN_TOKEN_KEY = 'admin_auth_token';
const LEGACY_TOKEN_KEY = 'auth_token';

export type AuthTokenScope = 'user' | 'admin';

function currentScope(): AuthTokenScope {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        return 'admin';
    }

    return 'user';
}

function keyForScope(scope: AuthTokenScope = currentScope()): string {
    return scope === 'admin' ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY;
}

export const tokenStorage = {
    /**
     * Get token from localStorage
     */
    getToken(scope?: AuthTokenScope): string | null {
        const token = localStorage.getItem(keyForScope(scope));

        if (token) {
            return token;
        }

        return localStorage.getItem(LEGACY_TOKEN_KEY);
    },

    /**
     * Save token to localStorage
     */
    setToken(token: string, scope?: AuthTokenScope): void {
        localStorage.setItem(keyForScope(scope), token);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    },

    /**
     * Remove token from localStorage
     */
    removeToken(scope?: AuthTokenScope): void {
        localStorage.removeItem(keyForScope(scope));
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    },

    /**
     * Check if token exists
     */
    isTokenValid(scope?: AuthTokenScope): boolean {
        return !!this.getToken(scope);
    },
};
