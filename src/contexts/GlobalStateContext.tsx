import React, { createContext, useReducer, useContext, useEffect } from 'react';
import type { ViewType, Theme, User, FileNode } from '../types.ts';

// State shape
interface GlobalState {
  activeView: ViewType;
  viewProps: any;
  theme: Theme;
  hiddenFeatures: string[];
  isGithubConnected: boolean;
  user: User | null;
  token: string | null;
  selectedRepo: { owner: string; repo: string } | null;
  projectFiles: FileNode | null;
}

// Action types
type Action =
  | { type: 'SET_VIEW'; payload: { view: ViewType, props?: any } }
  | { type: 'TOGGLE_FEATURE_VISIBILITY'; payload: { featureId: string } }
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_SELECTED_REPO'; payload: { owner: string; repo: string } | null }
  | { type: 'LOAD_PROJECT_FILES'; payload: FileNode | null };


const initialState: GlobalState = {
  activeView: 'ai-command-center',
  viewProps: {},
  theme: 'light',
  hiddenFeatures: [],
  isGithubConnected: false,
  user: null,
  token: null,
  selectedRepo: null,
  projectFiles: null,
};

const reducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.payload.view, viewProps: action.payload.props || {} };
    case 'TOGGLE_FEATURE_VISIBILITY': {
        const { featureId } = action.payload;
        const isHidden = state.hiddenFeatures.includes(featureId);
        const newHiddenFeatures = isHidden
            ? state.hiddenFeatures.filter(id => id !== featureId)
            : [...state.hiddenFeatures, featureId];
        return { ...state, hiddenFeatures: newHiddenFeatures };
    }
    case 'LOGIN':
        return { ...state, isGithubConnected: true, user: action.payload.user, token: action.payload.token };
    case 'LOGOUT':
        return { ...state, isGithubConnected: false, user: null, token: null, selectedRepo: null, projectFiles: null };
    case 'SET_SELECTED_REPO':
        return { ...state, selectedRepo: action.payload, projectFiles: null }; // Reset project files on repo change
    case 'LOAD_PROJECT_FILES':
        return { ...state, projectFiles: action.payload };
    default:
      return state;
  }
};

const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

const LOCAL_STORAGE_KEY = 'gemini_toolkit_snapshot';
const CONSENT_KEY = 'gemini_toolkit_ls_consent';

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const canPersist = (() => {
        try {
            return localStorage.getItem(CONSENT_KEY) === 'granted';
        } catch (e) {
            return false;
        }
    })();

    const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
        if (!canPersist) return initial;
        
        try {
            const storedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!storedStateJSON) return initial;
            
            const storedState = JSON.parse(storedStateJSON);
            const hydratedState = { ...initial };

            // Hydrate state from local storage
            if (storedState.activeView) hydratedState.activeView = storedState.activeView;
            if (storedState.hiddenFeatures) hydratedState.hiddenFeatures = storedState.hiddenFeatures;
            if (storedState.isGithubConnected) hydratedState.isGithubConnected = storedState.isGithubConnected;
            if (storedState.user) hydratedState.user = storedState.user;
            if (storedState.selectedRepo) hydratedState.selectedRepo = storedState.selectedRepo;
            if (storedState.token) hydratedState.token = storedState.token;
            
            return hydratedState;
        } catch (error) {
            console.error("Failed to parse state from localStorage", error);
            return initial;
        }
    });

    useEffect(() => {
        if (!canPersist) return;

        const handler = setTimeout(() => {
            try {
                const stateToSave = { 
                    activeView: state.activeView,
                    hiddenFeatures: state.hiddenFeatures,
                    isGithubConnected: state.isGithubConnected,
                    user: state.user,
                    selectedRepo: state.selectedRepo,
                    token: state.token,
                };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Failed to save state to localStorage", error);
            }
        }, 500);
        
        return () => clearTimeout(handler);
    }, [state, canPersist]);


    return (
        <GlobalStateContext.Provider value={{ state, dispatch }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => useContext(GlobalStateContext);