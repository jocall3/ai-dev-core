import React, { useState, useMemo } from 'react';
import { JwtDebuggerIcon } from './icons.tsx';

const exampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const decodeJwtPart = (part: string): object | null => {
    try {
        return JSON.parse(atob(part.replace(/_/g, '/').replace(/-/g, '+')));
    } catch (e) {
        return null;
    }
};

const DecodedPart: React.FC<{ title: string, data: object | null, color: string }> = ({ title, data, color }) => (
    <div>
        <h3 className={`text-lg font-bold ${color}`}>{title}</h3>
        <pre className="mt-1 p-4 bg-background border border-border rounded-md overflow-x-auto text-sm">
            {data ? JSON.stringify(data, null, 2) : 'Invalid Part'}
        </pre>
    </div>
);


export const JwtDebugger: React.FC = () => {
    const [token, setToken] = useState(exampleToken);

    const { header, payload, signature, error } = useMemo(() => {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { header: null, payload: null, signature: null, error: 'Invalid JWT structure. It must have three parts separated by dots.' };
        }
        return {
            header: decodeJwtPart(parts[0]),
            payload: decodeJwtPart(parts[1]),
            signature: parts[2],
            error: null
        };
    }, [token]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <JwtDebuggerIcon />
                    <span className="ml-3">JWT Debugger</span>
                </h1>
                <p className="text-text-secondary mt-1">Decode and inspect JSON Web Tokens.</p>
            </header>
            <div className="flex flex-col gap-4">
                <div>
                    <label htmlFor="jwt-input" className="text-sm font-medium text-text-secondary">Encoded Token</label>
                    <textarea
                        id="jwt-input"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full mt-1 p-2 bg-surface border border-border rounded-md resize-y font-mono text-sm h-24"
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DecodedPart title="Header" data={header} color="text-red-500" />
                    <DecodedPart title="Payload" data={payload} color="text-purple-500" />
                </div>
                 <div>
                    <h3 className="text-lg font-bold text-blue-500">Signature</h3>
                    <pre className="mt-1 p-4 bg-background border border-border rounded-md overflow-x-auto text-sm truncate">{signature}</pre>
                </div>
            </div>
        </div>
    );
};