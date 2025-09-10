import React from 'react';
import type { ViewType, SidebarItem } from '../types.ts';
import { SparklesIcon } from './icons.tsx';

interface LeftSidebarProps {
  items: SidebarItem[];
  activeView: ViewType;
  onNavigate: (view: ViewType, props?: any) => void;
}

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex justify-center">
      {children}
      <span className="absolute left-14 p-2 scale-0 transition-all rounded bg-gray-800 border border-gray-900 text-xs text-white group-hover:scale-100 whitespace-nowrap z-50">
        {text}
      </span>
    </div>
  );
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ items, activeView, onNavigate }) => {
  return (
    <nav className="w-20 h-full bg-surface border-r border-border flex flex-col py-4 px-2">
      <div className="flex-shrink-0 flex justify-center p-2 mb-4">
        <div className="w-8 h-8 text-primary">
            <SparklesIcon />
        </div>
      </div>
       <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-2 pt-4">
        {items.map((item) => {
          const isActive = activeView === item.view;

          return (
            <Tooltip key={item.id} text={item.label}>
              <button
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onNavigate(item.view, item.props);
                  }
                }}
                className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-gray-100'}`
                }
              >
                {item.icon}
              </button>
            </Tooltip>
          );
        })}
      </div>

       <div className="mt-auto flex-shrink-0 flex flex-col items-center gap-2">
         {/* User avatar and logout removed */}
      </div>
    </nav>
  );
};