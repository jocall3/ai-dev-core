import React, { useState, useCallback } from 'react';
import { Type, FunctionDeclaration } from "@google/genai";
import { getInferenceFunction, CommandResponse, FEATURE_TAXONOMY, logError } from '../services/index.ts';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';
import { CodeExplainerIcon, FeatureBuilderIcon, ThemeDesignerIcon, CodeReviewBotIcon, ConnectionsIcon, GoogleDriveIcon } from './icons.tsx';
import { LoadingSpinner } from './shared/index.tsx';
import { ALL_FEATURE_IDS } from './index.ts';

const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'navigateTo',
        description: 'Navigates to a specific feature page.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                featureId: { 
                    type: Type.STRING, 
                    description: 'The ID of the feature to navigate to.',
                    enum: ALL_FEATURE_IDS
                },
            },
            required: ['featureId'],
        },
    },
    {
        name: 'runFeatureWithInput',
        description: 'Navigates to a feature and passes initial data to it.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                 featureId: { 
                    type: Type.STRING, 
                    description: 'The ID of the feature to run.',
                    enum: ALL_FEATURE_IDS
                },
                props: {
                    type: Type.OBJECT,
                    description: 'An object containing the initial properties for the feature, based on its required inputs.',
                    properties: {
                        initialCode: { type: Type.STRING },
                        initialPrompt: { type: Type.STRING },
                        beforeCode: { type: Type.STRING },
                        afterCode: { type: Type.STRING },
                        logInput: { type: Type.STRING },
                        diff: { type: Type.STRING },
                        codeInput: { type: Type.STRING },
                        jsonInput: { type: Type.STRING },
                    }
                }
            },
            required: ['featureId', 'props']
        }
    }
];

const knowledgeBase = FEATURE_TAXONOMY.map(f => `- ${f.name} (${f.id}): ${f.description} Inputs: ${f.inputs}`).join('\n');

const QuickActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-surface p-4 rounded-lg border border-border flex flex-col items-start text-left transition-all duration-200 hover:bg-gray-100 hover:border-primary hover:shadow-lg"
    >
        <div className="w-8 h-8 text-primary mb-3">{icon}</div>
        <h3 className="font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
    </button>
);

export const AiCommandCenter: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState('');

    const handleCommand = useCallback(async (commandPrompt: string) => {
        if (!commandPrompt.trim()) return;

        setIsLoading(true);
        setLastResponse('');

        try {
            const response: CommandResponse = await getInferenceFunction(commandPrompt, functionDeclarations, knowledgeBase);
            
            if (response.functionCalls && response.functionCalls.length > 0) {
                const call = response.functionCalls[0];
                const { name, args } = call;

                setLastResponse(`Understood! Executing command: ${name}`);

                switch (name) {
                    case 'navigateTo':
                        dispatch({ type: 'SET_VIEW', payload: { view: args.featureId as string }});
                        break;
                    case 'runFeatureWithInput':
                         dispatch({ type: 'SET_VIEW', payload: { view: args.featureId as string, props: args.props } });
                        break;
                    default:
                        setLastResponse(`Unknown command: ${name}`);
                }
                 setPrompt('');
            } else {
                 setLastResponse(response.text);
            }

        } catch (err) {
            logError(err as Error, { prompt: commandPrompt });
            setLastResponse(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);
    
    const handlePromptSubmit = () => handleCommand(prompt);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePromptSubmit();
        }
    };
    
    const quickActions = [
        { icon: <CodeExplainerIcon />, title: "Explain Code", description: "Get a detailed breakdown of a code snippet.", action: () => dispatch({ type: 'SET_VIEW', payload: { view: 'ai-code-explainer' } }) },
        { icon: <FeatureBuilderIcon />, title: "Build a Feature", description: "Generate all the files for a new component or feature.", action: () => dispatch({ type: 'SET_VIEW', payload: { view: 'ai-feature-builder' } }) },
        { icon: <ThemeDesignerIcon />, title: "Design a Theme", description: "Create a new color theme from a text description.", action: () => dispatch({ type: 'SET_VIEW', payload: { view: 'theme-designer' } }) },
        !state.isGithubConnected 
            ? { icon: <ConnectionsIcon />, title: "Connect to GitHub", description: "Login to manage repos, explore code, and commit files.", action: () => dispatch({ type: 'SET_VIEW', payload: { view: 'connections' } }) }
            : { icon: <CodeReviewBotIcon />, title: "Review My Code", description: "Get an instant, AI-powered code review.", action: () => dispatch({ type: 'SET_VIEW', payload: { view: 'code-review-bot' } }) }
    ];
    
     const secondaryActions = [
        { icon: <GoogleDriveIcon />, title: "Label Google Drive File", description: "Use AI to apply structured labels to your Drive files.", action: () => dispatch({ type: 'SET_VIEW', payload: { view: 'google-drive-labeler' } }) },
    ];


    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight">AI Command Center</h1>
                <p className="mt-2 text-lg text-text-secondary">Welcome to your AI-powered development toolkit.</p>
            </header>
            
            <div className="flex-grow max-w-4xl w-full mx-auto">
                <h2 className="text-sm font-semibold text-text-secondary mb-3">QUICK ACTIONS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {quickActions.map(action => (
                        <QuickActionCard key={action.title} {...action} onClick={action.action} />
                    ))}
                </div>
                 <h2 className="text-sm font-semibold text-text-secondary mb-3">INTEGRATIONS</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {secondaryActions.map(action => (
                        <QuickActionCard key={action.title} {...action} onClick={action.action} />
                    ))}
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-end max-w-3xl w-full mx-auto">
                {lastResponse && (
                    <div className="mb-4 p-4 bg-surface rounded-lg text-text-primary border border-border">
                        <p><strong>AI:</strong> {lastResponse}</p>
                    </div>
                )}
                 <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder='Or, type a command... try "Create a regex for email validation"'
                        className="w-full p-4 pr-28 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary focus:outline-none resize-none shadow-sm"
                        rows={2}
                    />
                    <button
                        onClick={handlePromptSubmit}
                        disabled={isLoading}
                        className="btn-primary absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2"
                    >
                       {isLoading ? <LoadingSpinner/> : 'Send'}
                    </button>
                </div>
                 <p className="text-xs text-text-secondary text-center mt-2">Press Enter to send, Shift+Enter for new line.</p>
            </div>
        </div>
    );
};