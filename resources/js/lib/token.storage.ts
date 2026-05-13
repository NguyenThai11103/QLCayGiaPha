const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
    /**
     * Get token from localStorage
     */
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Save token to localStorage
     */
    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    },

    /**
     * Remove token from localStorage
     */
    removeToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    },

    /**
     * Check if token exists
     */
    isTokenValid(): boolean {
        return !!this.getToken();
    },
};
