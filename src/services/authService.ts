// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import { Octokit } from 'octokit';
import type { User } from '../types.ts';
import { logEvent, logError, measurePerformance } from './telemetryService.ts';

const TOKEN_EXCHANGE_PROXY_URL = 'https://citibankdemobusiness.dev/oauth/callback.php';

export interface AuthResult {
    user: User;
    token: string;
}

let octokitInstance: Octokit | null = null;

const getAccessToken = async (code: string): Promise<string> => {
    logEvent('auth_token_exchange_start');
    const response = await fetch(`${TOKEN_EXCHANGE_PROXY_URL}?code=${code}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) {
        const errorBody = await response.text();
        logError(new Error(`Token exchange failed: ${response.status}`), { context: 'getAccessToken', errorBody });
        throw new Error(`Token exchange failed with status ${response.status}. Please check the proxy endpoint.`);
    }
    const data = await response.json();
    if (data.error || !data.access_token) {
        logError(new Error('Invalid token response from proxy'), { context: 'getAccessToken', responseData: data });
        throw new Error(data.error_description || 'Backend proxy failed to retrieve a valid access token.');
    }
    logEvent('auth_token_exchange_success');
    return data.access_token;
};

const initializeOctokit = (token: string): void => {
    octokitInstance = new Octokit({ auth: token, request: { headers: { 'X-GitHub-Api-Version': '2022-11-28' } } });
    logEvent('octokit_initialized');
};

export const getOctokit = (): Octokit => {
    if (!octokitInstance) { throw new Error("Octokit has not been initialized. Please authenticate first."); }
    return octokitInstance;
};

export const handleGitHubCallback = async (code: string): Promise<AuthResult> => {
    return measurePerformance('handleGitHubCallback', async () => {
        try {
            const token = await getAccessToken(code);
            initializeOctokit(token);
            const octokit = getOctokit();
            logEvent('fetch_user_profile_start');
            const { data: user } = await octokit.request('GET /user');
            logEvent('fetch_user_profile_success', { username: user.login });
            return { user: user as unknown as User, token };
        } catch (error) {
            logError(error as Error, { context: 'handleGitHubCallback', code });
            throw new Error(`Authentication failed: ${(error as Error).message}`);
        }
    });
};

export const checkSession = async (token: string | null): Promise<AuthResult | null> => {
    if (!token) return null;
    return measurePerformance('checkSession', async () => {
        logEvent('session_check_start');
        try {
            initializeOctokit(token);
            const octokit = getOctokit();
            const { data: user } = await octokit.request('GET /user');
            logEvent('session_check_success', { username: user.login });
            return { user: user as unknown as User, token };
        } catch (error) {
            logError(error as Error, { context: 'checkSession', message: "Token validation failed, session is invalid." });
            octokitInstance = null;
            return null;
        }
    });
};

export const logout = async (): Promise<void> => {
    logEvent('logout');
    octokitInstance = null;
    return Promise.resolve();
};
