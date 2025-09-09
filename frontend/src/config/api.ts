// API configuration for different environments
const API_URL = import.meta.env.VITE_API_URL || '';
const isDevelopment = import.meta.env.DEV;

// Helper to build API URLs
export const buildApiUrl = (path: string): string => {
    if (isDevelopment) {
        // In development, use relative paths with Vite proxy
        return path;
    }
    // In production, use full URL from environment
    return `${API_URL}${path}`;
};

// Get auth headers for API requests
export const getAuthHeaders = () => {
    const sessionData = localStorage.getItem('StudAI-Builder');
    if (!sessionData) {
        return {};
    }

    try {
        const parsed = JSON.parse(sessionData);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parsed.token}`
        };
    } catch {
        return {};
    }
};

// Export for backward compatibility
export const API_CONFIG = {
    baseUrl: API_URL,
    isDevelopment,
    buildUrl: buildApiUrl,
    getHeaders: getAuthHeaders
};

export default API_CONFIG;
