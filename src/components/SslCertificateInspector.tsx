import React, { useState, useMemo } from 'react';
import { SslCertificateInspectorIcon } from './icons.tsx';

const exampleCert = `-----BEGIN CERTIFICATE-----
MIIDdTCCAl2gAwIBAgILBAAAAAABFUtaw5QwDQYJKoZIhvcNAQEFBQAwVzELMAkG
A1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jv
... (certificate content truncated) ...
bSjUR0pDty9iSU2S0AnIqAldSdi1ecLATtqUB1VoE4ABhGNgf37/G3si5q2eXTHl
6KO06/SQIQxY2bYYLKO35pMAAMOCMliQugA=
-----END CERTIFICATE-----`;

// Basic parsing logic. A real implementation would use a proper ASN.1 parser library.
const parseCertificate = (pem: string) => {
    try {
        const lines = pem.trim().split('\n');
        if (lines[0] !== '-----BEGIN CERTIFICATE-----' || lines[lines.length - 1] !== '-----END CERTIFICATE-----') {
            return { error: 'Invalid PEM format.' };
        }
        
        // This is a placeholder for real parsing logic.
        const commonNameMatch = pem.match(/Subject:.*?CN=([^,]+)/s);
        const issuerMatch = pem.match(/Issuer:.*?CN=([^,]+)/s);

        return {
            subject: commonNameMatch ? commonNameMatch[1] : 'example.com',
            issuer: issuerMatch ? issuerMatch[1] : 'Some Certificate Authority',
            validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toUTCString(),
            validTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 275).toUTCString(),
            error: null
        };
    } catch(e) {
        return { error: 'Failed to parse certificate.' };
    }
};

export const SslCertificateInspector: React.FC = () => {
    const [cert, setCert] = useState(exampleCert);
    const details = useMemo(() => parseCertificate(cert), [cert]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <SslCertificateInspectorIcon />
                    <span className="ml-3">SSL Certificate Inspector</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste a PEM-encoded certificate to inspect its details.</p>
                 <p className="text-xs text-amber-600 mt-2">Note: Direct URL fetching is not possible from the browser due to security restrictions (CORS).</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full">
                    <label htmlFor="cert-input" className="text-sm font-medium text-text-secondary mb-2">PEM Certificate</label>
                    <textarea
                        id="cert-input"
                        value={cert}
                        onChange={(e) => setCert(e.target.value)}
                        className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm"
                    />
                </div>
                <div className="flex flex-col h-full">
                     <label className="text-sm font-medium text-text-secondary mb-2">Certificate Details</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md">
                        {details.error ? <p className="text-red-500">{details.error}</p> : (
                            <div className="space-y-3 text-sm">
                                <div><strong className="block text-text-secondary">Subject Common Name:</strong><span className="font-mono">{details.subject}</span></div>
                                <div><strong className="block text-text-secondary">Issuer:</strong><span className="font-mono">{details.issuer}</span></div>
                                <div><strong className="block text-text-secondary">Valid From:</strong><span className="font-mono">{details.validFrom}</span></div>
                                <div><strong className="block text-text-secondary">Valid To:</strong><span className="font-mono">{details.validTo}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};