import React from 'react';
import type { Feature } from '../../types.ts';
import { RAW_FEATURES } from '../../constants.ts';
import { lazyWithRetry } from '../../services/index.ts';

// Map feature IDs to their components using lazy loading with retry logic
const componentMap: Record<string, React.FC<any>> = {
    'ai-command-center': lazyWithRetry(() => import('./AiCommandCenter.tsx'), 'AiCommandCenter'),
    'project-explorer': lazyWithRetry(() => import('./ProjectExplorer.tsx'), 'ProjectExplorer'),
    'connections': lazyWithRetry(() => import('./Connections.tsx'), 'Connections'),
    'ai-code-explainer': lazyWithRetry(() => import('./AiCodeExplainer.tsx'), 'AiCodeExplainer'),
    'ai-feature-builder': lazyWithRetry(() => import('./AiFeatureBuilder.tsx'), 'AiFeatureBuilder'),
    'regex-sandbox': lazyWithRetry(() => import('./RegexSandbox.tsx'), 'RegexSandbox'),
    'portable-snippet-vault': lazyWithRetry(() => import('./SnippetVault.tsx'), 'SnippetVault'),
    'css-grid-editor': lazyWithRetry(() => import('./CssGridEditor.tsx'), 'CssGridEditor'),
    'ai-commit-generator': lazyWithRetry(() => import('./AiCommitGenerator.tsx'), 'AiCommitGenerator'),
    'json-tree-navigator': lazyWithRetry(() => import('./JsonTreeNavigator.tsx'), 'JsonTreeNavigator'),
    'xbrl-converter': lazyWithRetry(() => import('./XbrlConverter.tsx'), 'XbrlConverter'),
    'ai-unit-test-generator': lazyWithRetry(() => import('./AiUnitTestGenerator.tsx'), 'AiUnitTestGenerator'),
    'prompt-craft-pad': lazyWithRetry(() => import('./PromptCraftPad.tsx'), 'PromptCraftPad'),
    'linter-formatter': lazyWithRetry(() => import('./CodeFormatter.tsx'), 'CodeFormatter'),
    'schema-designer': lazyWithRetry(() => import('./SchemaDesigner.tsx'), 'SchemaDesigner'),
    'pwa-manifest-editor': lazyWithRetry(() => import('./PwaManifestEditor.tsx'), 'PwaManifestEditor'),
    'markdown-slides-generator': lazyWithRetry(() => import('./MarkdownSlides.tsx'), 'MarkdownSlides'),
    'screenshot-to-component': lazyWithRetry(() => import('./ScreenshotToComponent.tsx'), 'ScreenshotToComponent'),
    'digital-whiteboard': lazyWithRetry(() => import('./DigitalWhiteboard.tsx'), 'DigitalWhiteboard'),
    'theme-designer': lazyWithRetry(() => import('./ThemeDesigner.tsx'), 'ThemeDesigner'),
    'svg-path-editor': lazyWithRetry(() => import('./SvgPathEditor.tsx'), 'SvgPathEditor'),
    'ai-style-transfer': lazyWithRetry(() => import('./AiStyleTransfer.tsx'), 'AiStyleTransfer'),
    'ai-coding-challenge': lazyWithRetry(() => import('./AiCodingChallenge.tsx'), 'AiCodingChallenge'),
    'typography-lab': lazyWithRetry(() => import('./TypographyLab.tsx'), 'TypographyLab'),
    'code-review-bot': lazyWithRetry(() => import('./CodeReviewBot.tsx'), 'CodeReviewBot'),
    'ai-pull-request-assistant': lazyWithRetry(() => import('./AiPullRequestAssistant.tsx'), 'AiPullRequestAssistant'),
    'changelog-generator': lazyWithRetry(() => import('./ChangelogGenerator.tsx'), 'ChangelogGenerator'),
    'cron-job-builder': lazyWithRetry(() => import('./CronJobBuilder.tsx'), 'CronJobBuilder'),
    'ai-code-migrator': lazyWithRetry(() => import('./AiCodeMigrator.tsx'), 'AiCodeMigrator'),
    'visual-git-tree': lazyWithRetry(() => import('./VisualGitTree.tsx'), 'VisualGitTree'),
    'worker-thread-debugger': lazyWithRetry(() => import('./WorkerThreadDebugger.tsx'), 'WorkerThreadDebugger'),
    'ai-image-generator': lazyWithRetry(() => import('./AiImageGenerator.tsx'), 'AiImageGenerator'),
    'async-call-tree-viewer': lazyWithRetry(() => import('./AsyncCallTreeViewer.tsx'), 'AsyncCallTreeViewer'),
    'audio-to-code': lazyWithRetry(() => import('./AudioToCode.tsx'), 'AudioToCode'),
    'code-diff-ghost': lazyWithRetry(() => import('./CodeDiffGhost.tsx'), 'CodeDiffGhost'),
    'code-spell-checker': lazyWithRetry(() => import('./CodeSpellChecker.tsx'), 'CodeSpellChecker'),
    'color-palette-generator': lazyWithRetry(() => import('./ColorPaletteGenerator.tsx'), 'ColorPaletteGenerator'),
    'logic-flow-builder': lazyWithRetry(() => import('./LogicFlowBuilder.tsx'), 'LogicFlowBuilder'),
    'meta-tag-editor': lazyWithRetry(() => import('./MetaTagEditor.tsx'), 'MetaTagEditor'),
    'network-visualizer': lazyWithRetry(() => import('./NetworkVisualizer.tsx'), 'NetworkVisualizer'),
    'responsive-tester': lazyWithRetry(() => import('./ResponsiveTester.tsx'), 'ResponsiveTester'),
    'sass-scss-compiler': lazyWithRetry(() => import('./SassScssCompiler.tsx'), 'SassScssCompiler'),
};

// Map feature IDs to specific AI configurations
const aiConfigMap: Record<string, Feature['aiConfig']> = {
    'ai-code-explainer': { model: 'gemini-2.5-flash' },
    'ai-feature-builder': { model: 'gemini-2.5-flash' },
    'ai-commit-generator': { model: 'gemini-2.5-flash' },
    'ai-unit-test-generator': { model: 'gemini-2.5-flash' },
    'regex-sandbox': { model: 'gemini-2.5-flash' },
    'screenshot-to-component': { model: 'gemini-2.5-flash' },
    'theme-designer': { model: 'gemini-2.5-flash' },
    'ai-style-transfer': { model: 'gemini-2.5-flash' },
    'ai-coding-challenge': { model: 'gemini-2.5-flash' },
    'code-review-bot': { model: 'gemini-2.5-flash' },
    'ai-pull-request-assistant': { model: 'gemini-2.5-flash' },
    'ai-code-migrator': { model: 'gemini-2.5-flash' },
    'visual-git-tree': { model: 'gemini-2.5-flash' },
    'worker-thread-debugger': { model: 'gemini-2.5-flash' },
    'ai-command-center': { model: 'gemini-2.5-flash' },
    'ai-image-generator': { model: 'imagen-3.0-generate-002' },
    'audio-to-code': { model: 'gemini-2.5-flash' },
    'color-palette-generator': { model: 'gemini-2.5-flash' },
    'xbrl-converter': { model: 'gemini-2.5-flash' },
    'digital-whiteboard': { model: 'gemini-2.5-flash' },
    'project-explorer': { model: 'gemini-2.5-flash' },
};

export const ALL_FEATURES: Feature[] = RAW_FEATURES.map(feature => ({
    ...feature,
    component: componentMap[feature.id],
    aiConfig: aiConfigMap[feature.id],
}));

export const FEATURES_MAP = new Map(ALL_FEATURES.map(f => [f.id, f]));