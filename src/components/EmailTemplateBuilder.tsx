// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { EmailTemplateBuilderIcon } from './icons.tsx';

interface Component {
    id: number;
    type: 'header' | 'text' | 'button';
    content: string;
}

const generateHtml = (components: Component[], title: string) => `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
  body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; }
  .header { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
  .text { font-size: 16px; line-height: 1.5; color: #555; margin-bottom: 20px; }
  .button { display: inline-block; background-color: #0047AB; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
</style>
</head>
<body>
  <div class="container">
    ${components.map(c => {
        if (c.type === 'header') return `<div class="header">${c.content}</div>`;
        if (c.type === 'text') return `<div class="text">${c.content.replace(/\n/g, '<br/>')}</div>`;
        if (c.type === 'button') return `<a href="#" class="button">${c.content}</a>`;
        return '';
    }).join('\n')}
  </div>
</body>
</html>`;

export const EmailTemplateBuilder: React.FC = () => {
    const [title, setTitle] = useState('Welcome!');
    const [components, setComponents] = useState<Component[]>([
        { id: 1, type: 'header', content: 'Welcome to Our Service!' },
        { id: 2, type: 'text', content: 'We are excited to have you on board. Here is some important information for you to get started.' },
        { id: 3, type: 'button', content: 'Get Started' },
    ]);

    const addComponent = (type: 'header' | 'text' | 'button') => {
        setComponents([...components, { id: Date.now(), type, content: `New ${type}` }]);
    };
    
    const updateComponent = (id: number, content: string) => {
        setComponents(components.map(c => c.id === id ? { ...c, content } : c));
    };

    const emailHtml = generateHtml(components, title);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <EmailTemplateBuilderIcon />
                    <span className="ml-3">HTML Email Template Builder</span>
                </h1>
                <p className="text-text-secondary mt-1">Visually build a responsive HTML email template.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-surface p-4 border border-border rounded-lg">
                        <label className="text-sm font-medium">Email Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 mt-1 bg-background border border-border rounded-md" />
                    </div>
                    <div className="flex-grow bg-surface p-4 border border-border rounded-lg space-y-3 overflow-y-auto">
                        {components.map(c => (
                            <div key={c.id}>
                                <label className="text-xs font-bold capitalize">{c.type}</label>
                                <textarea value={c.content} onChange={e => updateComponent(c.id, e.target.value)} className="w-full p-2 mt-1 bg-background border border-border rounded-md resize-y" rows={c.type === 'text' ? 4 : 1}/>
                            </div>
                        ))}
                    </div>
                    <div className="flex-shrink-0 flex gap-2 p-2 bg-surface border border-border rounded-lg">
                        <button onClick={() => addComponent('header')} className="btn-primary flex-1 text-sm py-2">Add Header</button>
                        <button onClick={() => addComponent('text')} className="btn-primary flex-1 text-sm py-2">Add Text</button>
                        <button onClick={() => addComponent('button')} className="btn-primary flex-1 text-sm py-2">Add Button</button>
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Live Preview</label>
                        <button onClick={() => navigator.clipboard.writeText(emailHtml)} className="px-3 py-1 bg-gray-100 text-xs rounded-md hover:bg-gray-200">Copy HTML</button>
                    </div>
                    <div className="flex-grow bg-white border-2 border-border rounded-md overflow-hidden">
                        <iframe srcDoc={emailHtml} title="Email Preview" className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};