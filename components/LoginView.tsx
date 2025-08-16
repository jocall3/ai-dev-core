import React from 'react';

// Replace with your GitHub OAuth app client ID
const CLIENT_ID = 'Ov23li6nSMUkwPE2HTBX'; 
// The Redirect URI should point back to your app's main page to handle the callback
const REDIRECT_URI = window.location.origin;

export const LoginView: React.FC = () => {
    const handleLogin = () => {
        // We request 'repo' scope for full repository access and 'read:user' for profile info
        const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo,read:user`;
        window.location.href = githubAuthURL;
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background text-text-primary font-sans">
            <div className="bg-surface p-8 sm:p-12 rounded-2xl shadow-2xl text-center border border-border animate-pop-in max-w-lg m-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary mx-auto mb-4">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome to DevCore AI</h1>
                <p className="text-text-secondary mb-8">Sign in with GitHub to continue to your AI-powered toolkit.</p>
                <button
                    onClick={handleLogin}
                    className="bg-[#24292e] text-white border-none px-6 py-3 font-semibold text-lg rounded-lg cursor-pointer flex items-center justify-center gap-3 w-full hover:bg-[#333] transition-colors"
                    aria-label="Login with GitHub"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="fill-white w-6 h-6">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.372 0 0 5.372 0 12c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.997.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.335-5.466-5.93 0-1.31.47-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3-.404c1.02.005 2.045.138 3 .404 2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.24 2.873.12 3.176.77.84 1.232 1.91 1.232 3.22 0 4.61-2.807 5.625-5.48 5.92.43.372.823 1.103.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .32.218.694.825.576C20.565 21.795 24 17.298 24 12c0-6.628-5.372-12-12-12z"/>
                    </svg>
                    Login with GitHub
                </button>
            </div>
        </div>
    );
};