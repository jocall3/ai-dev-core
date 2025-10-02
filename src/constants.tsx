// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

export const CHROME_VIEW_IDS = ['features-list'] as const;

export const SLOTS = ['Core', 'AI Tools', 'Frontend', 'Testing', 'Database', 'Productivity'] as const;
export type SlotCategory = typeof SLOTS[number];

export const FEATURE_CATEGORIES = ['Core', 'AI Tools', 'Frontend', 'Testing', 'Database', 'Data', 'Productivity', 'Deployment', 'Security', 'Workflow'] as const;
export type FeatureCategory = typeof FEATURE_CATEGORIES[number];