// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { GitBranchingModelVisualizerIcon } from './icons.tsx';

const models = {
    'git-flow': {
        name: 'Git Flow',
        description: 'A robust framework for managing larger projects, with separate branches for features, releases, and hotfixes.',
        graph: () => (
            <svg viewBox="0 0 400 200" className="w-full h-auto">
                <line x1="20" y1="50" x2="380" y2="50" stroke="#2563eb" strokeWidth="2" />
                <text x="385" y="50" dy=".3em" fill="#2563eb" fontSize="10">main</text>
                
                <line x1="20" y1="100" x2="380" y2="100" stroke="#f59e0b" strokeWidth="2" />
                <text x="385" y="100" dy=".3em" fill="#f59e0b" fontSize="10">develop</text>
                
                <path d="M 80 100 C 80 120, 120 120, 120 140 V 160" stroke="#16a34a" strokeWidth="2" fill="none" />
                <path d="M 120 160 C 120 180, 160 180, 160 100" stroke="#16a34a" strokeWidth="2" fill="none" />
                <text x="125" y="170" fill="#16a34a" fontSize="10">feature</text>

                 <path d="M 220 100 C 220 80, 260 80, 260 50" stroke="#dc2626" strokeWidth="2" fill="none" />
                 <text x="235" y="70" fill="#dc2626" fontSize="10">release</text>
            </svg>
        )
    },
    'github-flow': {
        name: 'GitHub Flow',
        description: 'A lightweight workflow where main is always deployable. New work is done in feature branches and merged directly into main.',
         graph: () => (
            <svg viewBox="0 0 400 200" className="w-full h-auto">
                <line x1="20" y1="100" x2="380" y2="100" stroke="#2563eb" strokeWidth="2" />
                <text x="385" y="100" dy=".3em" fill="#2563eb" fontSize="10">main</text>
                
                <path d="M 80 100 C 80 60, 160 60, 160 100" stroke="#16a34a" strokeWidth="2" fill="none" />
                <text x="110" y="60" fill="#16a34a" fontSize="10">feature</text>
                
                <path d="M 220 100 C 220 140, 300 140, 300 100" stroke="#16a34a" strokeWidth="2" fill="none" />
                 <text x="250" y="150" fill="#16a34a" fontSize="10">another-feature</text>
            </svg>
        )
    }
};

type ModelKey = keyof typeof models;

export const GitBranchingModelVisualizer: React.FC = () => {
    const [selectedModel, setSelectedModel] = useState<ModelKey>('git-flow');

    const model = models[selectedModel];

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <GitBranchingModelVisualizerIcon />
                    <span className="ml-3">Git Branching Model Visualizer</span>
                </h1>
                <p className="text-text-secondary mt-1">An educational tool to visualize and understand common Git workflows.</p>
            </header>
            <div className="flex justify-center gap-2 mb-6">
                {Object.keys(models).map(key => (
                    <button
                        key={key}
                        onClick={() => setSelectedModel(key as ModelKey)}
                        className={`px-4 py-2 rounded-md font-semibold text-sm ${selectedModel === key ? 'bg-primary text-text-on-primary' : 'bg-surface border border-border'}`}
                    >
                        {models[key as ModelKey].name}
                    </button>
                ))}
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-surface p-6 rounded-lg border border-border">
                    <h2 className="text-2xl font-bold mb-2">{model.name}</h2>
                    <p className="text-text-secondary">{model.description}</p>
                </div>
                <div className="lg:col-span-2 flex items-center justify-center p-6 bg-background rounded-lg border border-border">
                    {model.graph()}
                </div>
            </div>
        </div>
    );
};