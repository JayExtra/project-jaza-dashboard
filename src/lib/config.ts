const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const landingUrl = import.meta.env.VITE_PUBLIC_LANDING_URL;

if (!apiBaseUrl) {
    throw new Error(
        'VITE_API_BASE_URL is not defined in your .env files. ' +
        'Please check .env.local for development or .env.production for production.'
    );
}

export const config = {
    apiBaseUrl: apiBaseUrl.endsWith('/')
        ? apiBaseUrl.slice(0, -1)   // remove trailing slash if present
        : apiBaseUrl,
    landingUrl: landingUrl 
        ? (landingUrl.endsWith('/') ? landingUrl.slice(0, -1) : landingUrl) 
        : 'http://localhost:3000',

    // You can add more config later
    // timeout: 15000,
    // version: 'v1',
} as const;


export default config;