import React, { useState, useMemo } from 'react';
import { SshKeyGeneratorIcon } from './icons.tsx';

type KeyType = 'rsa' | 'ed25519' | 'ecdsa';

export const SshKeyGenerator: React.FC = () => {
    const [keyType, setKeyType] = useState<KeyType>('ed25519');
    const [bits, setBits] = useState(4096);
    const [email, setEmail] = useState('your_email@example.com');
    
    const command = useMemo(() => {
        let cmd = `ssh-keygen -t ${keyType}`;
        if (keyType === 'rsa') {
            cmd += ` -b ${bits}`;
        }
        cmd += ` -C "${email}"`;
        return cmd;
    }, [keyType, bits, email]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center">
                    <SshKeyGeneratorIcon />
                    <span className="ml-3">SSH Key Generator Helper</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate a secure `ssh-keygen` command to run on your own machine.</p>
            </header>

            <div className="w-full max-w-2xl mx-auto bg-surface p-6 rounded-lg border border-border">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Key Type</label>
                        <select value={keyType} onChange={e => setKeyType(e.target.value as KeyType)} className="w-full p-2 mt-1 bg-background border border-border rounded-md">
                            <option value="ed25519">ED25519 (Recommended)</option>
                            <option value="rsa">RSA</option>
                            <option value="ecdsa">ECDSA</option>
                        </select>
                    </div>
                     {keyType === 'rsa' && (
                        <div>
                            <label className="block text-sm font-medium">Bits</label>
                            <select value={bits} onChange={e => setBits(Number(e.target.value))} className="w-full p-2 mt-1 bg-background border border-border rounded-md">
                                <option value={2048}>2048</option>
                                <option value={3072}>3072</option>
                                <option value={4096}>4096 (Recommended)</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium">Email / Comment</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mt-1 bg-background border border-border rounded-md" />
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-sm font-medium text-text-secondary">Run this command in your terminal:</p>
                    <div className="relative mt-2">
                        <pre className="p-4 bg-background rounded-md text-primary font-mono text-sm overflow-x-auto">
                            <code>{command}</code>
                        </pre>
                        <button onClick={() => navigator.clipboard.writeText(command)} className="absolute top-2 right-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-xs">Copy</button>
                    </div>
                </div>
                 <p className="text-xs text-text-secondary mt-4 text-center">
                    Note: For security reasons, private keys are never generated or handled in the browser.
                </p>
            </div>
        </div>
    );
};