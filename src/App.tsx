import React, { Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { useGlobalState } from './contexts/GlobalStateContext.tsx';
import { logEvent } from './services/telemetryService.ts';
import { ALL_FEATURES, FEATURES_MAP } from './components/index.ts';
import type { ViewType, FeatureId, SidebarItem } from './types.ts';
import { DownloadManager } from './components/DownloadManager.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { StatusBar } from './components/StatusBar.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { Cog6ToothIcon, HomeIcon } from './components/icons.tsx';
import { AiCommandCenter } from './components/AiCommandCenter.tsx';
import { LoadingIndicator } from './components/shared/index.tsx';


interface LocalStorageConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const LocalStorageConsentModal: React.FC<LocalStorageConsentModalProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
      <div 
        className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md m-4 p-8 text-center animate-pop-in"
      >
        <h2 className="text-2xl mb-4">Store Data Locally?</h2>
        <p className="text-text-secondary mb-6">
          This application uses your browser's local storage to save your settings and remember your progress between sessions. This data stays on your computer and is not shared.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onDecline}
            className="px-6 py-2 bg-surface border border-border text-text-primary font-bold rounded-md hover:bg-gray-100 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="btn-primary px-6 py-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { state, dispatch } = useGlobalState();
  const { activeView, viewProps, hiddenFeatures } = state;
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    try {
        const consent = localStorage.getItem('gemini_toolkit_ls_consent');
        if (!consent) {
            setShowConsentModal(true);
        }
    } catch (e) {
        console.warn("Could not access localStorage.", e);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setCommandPaletteOpen(isOpen => !isOpen);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAcceptConsent = () => {
    try {
        localStorage.setItem('gemini_toolkit_ls_consent', 'granted');
        window.location.reload();
    } catch (e) {
        console.error("Could not write to localStorage.", e);
        setShowConsentModal(false);
    }
  };

  const handleDeclineConsent = () => {
    try {
        localStorage.setItem('gemini_toolkit_ls_consent', 'denied');
    } catch (e) {
        console.error("Could not write to localStorage.", e);
    }
    setShowConsentModal(false);
  };

  const handleViewChange = useCallback((view: ViewType, props: any = {}) => {
    dispatch({ type: 'SET_VIEW', payload: { view, props } });
    logEvent('view_changed', { view });
    setCommandPaletteOpen(false);
  }, [dispatch]);

  const sidebarItems: SidebarItem[] = useMemo(() => [
    { id: 'ai-command-center', label: 'Command Center', icon: <HomeIcon />, view: 'ai-command-center' },
    ...ALL_FEATURES
        .filter(feature => !hiddenFeatures.includes(feature.id) && !['ai-command-center'].includes(feature.id))
        .map(feature => ({
            id: feature.id,
            label: feature.name,
            icon: feature.icon,
            view: feature.id as ViewType,
        })),
    { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon />, view: 'settings' },
  ], [hiddenFeatures]);

  const ActiveComponent = useMemo(() => {
      if (activeView === 'settings') return SettingsView;
      // Fallback to command center if no view is matched.
      return FEATURES_MAP.get(activeView as string)?.component ?? AiCommandCenter;
  }, [activeView]);
  
  return (
    <div className="h-screen w-screen font-sans overflow-hidden bg-background">
        {showConsentModal && <LocalStorageConsentModal onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />}
        <div className="relative flex h-full w-full">
            <LeftSidebar items={sidebarItems} activeView={state.activeView} onNavigate={handleViewChange} />
            <div className="flex-1 flex min-w-0">
                <div className="flex-1 flex flex-col min-w-0">
                    <main className="relative flex-1 min-w-0 bg-surface/50 overflow-y-auto">
                        <ErrorBoundary>
                            <Suspense fallback={<LoadingIndicator />}>
                                <div key={activeView} className="fade-in w-full h-full">
                                    <ActiveComponent {...viewProps} />
                                </div>
                            </Suspense>
                        </ErrorBoundary>
                        <DownloadManager />
                    </main>
                    <StatusBar bgImageStatus="loaded" />
                </div>
            </div>
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onSelect={handleViewChange} />
        </div>
    </div>
  );
};

export default App;