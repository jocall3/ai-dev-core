import React, { useState, useCallback } from 'react';
import { SslCertificateInspectorIcon } from './icons.tsx';
import { parseCertificateDetails } from '../services/index.ts';
import type { CertificateDetails } from '../types.ts';
import { LoadingSpinner } from './shared/index.tsx';

const exampleCert = `-----BEGIN CERTIFICATE-----
MIIDdTCCAl2gAwIBAgILBAAAAAABFUtaw5QwDQYJKoZIhvcNAQEFBQAwVzELMAkG
A1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jv
... (certificate content truncated) ...
bSjUR0pDty9iSU2S0AnIqAldSdi1ecLATtqUB1VoE4ABhGNgf37/G3si5q2eXTHl
6KO06/SQIQxY2bYYLKO35pMAAMOCMliQugA=
-----END CERTIFICATE-----`;

const DetailRow: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    value ? <div><strong className="block text-text-secondary">{label}:</strong><span className="font-mono">{value}</span></div> : null
);

export const SslCertificateInspector: React.FC = () => {
    const [cert, setCert] = useState(exampleCert);
    const [details, setDetails] = useState<CertificateDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInspect = useCallback(async () => {
        if (!cert.trim()) {
            setError('Please paste a PEM certificate to inspect.');
            return;
        }
        setIsLoading(true);
        setError('');
        setDetails(null);
        try {
            const result = await parseCertificateDetails(cert);
            setDetails(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse certificate.');
        } finally {
            setIsLoading(false);
        }
    }, [cert]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <SslCertificateInspectorIcon />
                    <span className="ml-3">SSL Certificate Inspector</span>
                </h1>
                <p className="text-text-secondary mt-1">Paste a PEM-encoded certificate to inspect its details.</p>
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
                     <button
                        onClick={handleInspect}
                        disabled={isLoading}
                        className="btn-primary mt-4 w-full flex items-center justify-center px-6 py-3"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Inspect Certificate'}
                    </button>
                </div>
                <div className="flex flex-col h-full">
                     <label className="text-sm font-medium text-text-secondary mb-2">Certificate Details</label>
                    <div className="flex-grow p-4 bg-background border border-border rounded-md">
                        {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {details && !isLoading && (
                            <div className="space-y-3 text-sm">
                                <DetailRow label="Subject Common Name" value={details.subject.commonName} />
                                <DetailRow label="Subject Organization" value={details.subject.organization} />
                                <DetailRow label="Subject Country" value={details.subject.country} />
                                <hr className="border-border my-3" />
                                <DetailRow label="Issuer Common Name" value={details.issuer.commonName} />
                                <DetailRow label="Issuer Organization" value={details.issuer.organization} />
                                <DetailRow label="Issuer Country" value={details.issuer.country} />
                                <hr className="border-border my-3" />
                                <DetailRow label="Valid From" value={details.validFrom} />
                                <DetailRow label="Valid To" value={details.validTo} />
                                <DetailRow label="Serial Number" value={details.serialNumber} />
                            </div>
                        )}
                        {!isLoading && !details && !error && <div className="text-text-secondary h-full flex items-center justify-center">Details will appear here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};