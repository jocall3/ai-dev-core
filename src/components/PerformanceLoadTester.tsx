import React, { useState, useEffect, useRef } from 'react';
import { PerformanceLoadTesterIcon } from './icons.tsx';

// Simple chart drawing function
const drawChart = (canvas: HTMLCanvasElement, data: number[], maxVal: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 71, 171, 0.5)';
    ctx.fillStyle = 'rgba(0, 71, 171, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / maxVal) * height;
        ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
};

export const PerformanceLoadTester: React.FC = () => {
    const [url, setUrl] = useState('https://api.example.com/health');
    const [users, setUsers] = useState(50);
    const [duration, setDuration] = useState(30);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{rps: number[], latency: number[], errors: number}>({rps: [], latency: [], errors: 0});
    const chartRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if(chartRef.current && results.rps.length > 0) {
            drawChart(chartRef.current, results.rps, 200); // Assume max 200 RPS for charting
        }
    }, [results.rps]);

    const startTest = () => {
        setIsRunning(true);
        setResults({rps: [], latency: [], errors: 0});
        let seconds = 0;

        intervalRef.current = window.setInterval(() => {
            seconds++;
            if (seconds > duration) {
                stopTest();
                return;
            }
            setResults(prev => {
                const newRps = prev.rps.concat(users * (0.8 + Math.random() * 0.4)); // Simulate some variance
                const newLatency = prev.latency.concat(50 + Math.random() * 100);
                const newErrors = prev.errors + (Math.random() > 0.98 ? 1 : 0);
                return { rps: newRps, latency: newLatency, errors: newErrors };
            });
        }, 1000);
    };
    
    const stopTest = () => {
        if(intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
    };

    const avgLatency = results.latency.length > 0 ? (results.latency.reduce((a,b) => a+b, 0) / results.latency.length).toFixed(0) : 0;
    const peakRps = Math.max(0, ...results.rps).toFixed(1);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <PerformanceLoadTesterIcon />
                    <span className="ml-3">Performance Load Tester (Simulated)</span>
                </h1>
                <p className="text-text-secondary mt-1">Configure and run a simulated load test to visualize performance metrics.</p>
            </header>
            <div className="bg-surface p-4 rounded-lg border border-border flex flex-wrap items-end gap-4">
                <div className="flex-grow"><label className="text-xs">Target URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 bg-background border border-border rounded-md"/></div>
                <div><label className="text-xs">Virtual Users</label><input type="number" value={users} onChange={e => setUsers(Number(e.target.value))} className="w-24 p-2 bg-background border border-border rounded-md"/></div>
                <div><label className="text-xs">Duration (s)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-24 p-2 bg-background border border-border rounded-md"/></div>
                <button onClick={isRunning ? stopTest : startTest} className={`btn-primary px-6 py-2 ${isRunning ? 'bg-red-500' : ''}`}>{isRunning ? 'Stop Test' : 'Start Test'}</button>
            </div>
            
            <div className="flex-grow mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 bg-surface p-4 rounded-lg border border-border">
                    <h3 className="font-bold mb-2">Requests Per Second (RPS)</h3>
                    <div className="h-64 bg-background rounded">
                        <canvas ref={chartRef} className="w-full h-full"></canvas>
                    </div>
                </div>
                 <div className="bg-surface p-6 rounded-lg border border-border flex flex-col justify-center gap-4">
                    <h3 className="font-bold text-lg mb-2">Summary</h3>
                    <div className="text-center"><p className="text-xs text-text-secondary">Peak RPS</p><p className="text-2xl font-bold text-primary">{peakRps}</p></div>
                    <div className="text-center"><p className="text-xs text-text-secondary">Avg. Latency</p><p className="text-2xl font-bold text-primary">{avgLatency} ms</p></div>
                    <div className="text-center"><p className="text-xs text-text-secondary">Errors</p><p className="text-2xl font-bold text-red-500">{results.errors}</p></div>
                </div>
            </div>
        </div>
    );
};