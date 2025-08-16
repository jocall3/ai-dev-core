import { Octokit } from 'octokit';
import type { User } from './types.ts';
import { logError, logEvent, measurePerformance } from './services/index.ts';

// The URL for your backend endpoint that securely exchanges the code for a token.
// This endpoint must handle the logic of adding the client_secret and calling GitHub.
const TOKEN_EXCHANGE_PROXY_URL = 'https://www.citibankdemobusiness.dev/oauth/callback.php';

interface AuthResult {
    user: User;
    token: string;
    octokit: Octokit;
}

let octokitInstance: Octokit | null = null;

/**
 * Exchanges the OAuth authorization code for an access token by calling our secure backend proxy.
 * @param code The authorization code from GitHub's redirect.
 * @returns A promise that resolves to the access token.
 */
const getAccessToken = async (code: string): Promise<string> => {
    logEvent('auth_token_exchange_start');

    const response = await fetch(`${TOKEN_EXCHANGE_PROXY_URL}?code=${code}`, {
        method: 'GET', // Or POST, depending on your PHP script implementation
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Token exchange failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (data.error || !data.access_token) {
        throw new Error(data.error_description || 'Backend failed to retrieve a valid access token.');
    }

    logEvent('auth_token_exchange_success');
    return data.access_token;
};


/**
 * Initializes the Octokit client instance with a token.
 * @param token The GitHub access token.
 * @returns An authenticated Octokit instance.
 */
const initializeOctokit = (token: string): Octokit => {
    if (!octokitInstance || (octokitInstance.auth as any)() !== `token ${token}`) {
        octokitInstance = new Octokit({
            auth: token,
            // Add custom headers as per GitHub's recommendation
            request: {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            },
        });
        logEvent('octokit_initialized');
    }
    return octokitInstance;
};

/**
 * Returns the currently active Octokit instance.
 * @returns The Octokit instance.
 * @throws If Octokit has not been initialized.
 */
export const getOctokit = (): Octokit => {
    if (!octokitInstance) {
        throw new Error("Octokit has not been initialized. Please authenticate first.");
    }
    return octokitInstance;
}

/**
 * Handles the GitHub OAuth callback. It exchanges the provided code for an access token,
 * initializes the Octokit client, and fetches the authenticated user's profile.
 * @param code The authorization code from the URL after GitHub redirect.
 * @returns A promise resolving to the user, their token, and the initialized Octokit instance.
 */
export const handleGitHubCallback = async (code: string): Promise<AuthResult> => {
    return measurePerformance('handleGitHubCallback', async () => {
        try {
            const token = await getAccessToken(code);
            const octokit = initializeOctokit(token);

            logEvent('fetch_user_profile_start');
            const { data: user } = await octokit.request('GET /user');
            logEvent('fetch_user_profile_success', { username: user.login });

            return { user: user as unknown as User, token, octokit };
        } catch (error) {
            logError(error as Error, { context: 'handleGitHubCallback', code });
            throw new Error(`Authentication failed: ${(error as Error).message}`);
        }
    });
};

/**
 * Checks if a stored token is still valid by fetching the user's profile.
 * If valid, it returns the user data and the initialized Octokit instance.
 * @param token The stored access token from a previous session.
 * @returns A promise resolving to the user data or null if the session is invalid.
 */
export const checkSession = async (token: string | null): Promise<AuthResult | null> => {
    if (!token) {
        return null;
    }

    return measurePerformance('checkSession', async () => {
        logEvent('session_check_start');
        try {
            const octokit = initializeOctokit(token);
            const { data: user } = await octokit.request('GET /user');
            logEvent('session_check_success', { username: user.login });
            return { user: user as unknown as User, token, octokit };
        } catch (error) {
            logError(error as Error, { context: 'checkSession', message: "Token validation failed, session is invalid." });
            octokitInstance = null; // Clear invalid instance
            return null;
        }
    });
};

/**
 * Logs the user out. In a real application with server-side sessions, this would
 * also call a backend endpoint to invalidate the session/token. For this client-side
 * demo, it resets the local state.
 */
export const logout = async (): Promise<void> => {
    logEvent('logout');
    octokitInstance = null;
    // In a real app with HttpOnly cookies, this would involve a call to a
    // backend endpoint like `/api/logout` to clear the cookie.
    return Promise.resolve();
};