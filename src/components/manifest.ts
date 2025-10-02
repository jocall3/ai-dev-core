// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import type { Feature } from '../types.ts';
import { RAW_FEATURES } from './manifest.data.ts';
import { lazyWithRetry } from '../services/index.ts';

// Map feature IDs to their components using lazy loading with retry logic
const componentMap: Record<string, React.FC<any>> = {
    'ai-command-center': lazyWithRetry(() => import('./AiCommandCenter.tsx'), 'AiCommandCenter'),
    'ai-code-explainer': lazyWithRetry(() => import('./AiCodeExplainer.tsx'), 'AiCodeExplainer'),
    'ai-feature-builder': lazyWithRetry(() => import('./AiFeatureBuilder.tsx'), 'AiFeatureBuilder'),
    'regex-sandbox': lazyWithRetry(() => import('./RegexSandbox.tsx'), 'RegexSandbox'),
    'portable-snippet-vault': lazyWithRetry(() => import('./SnippetVault.tsx'), 'SnippetVault'),
    'css-grid-editor': lazyWithRetry(() => import('./CssGridEditor.tsx'), 'CssGridEditor'),
    'json-tree-navigator': lazyWithRetry(() => import('./JsonTreeNavigator.tsx'), 'JsonTreeNavigator'),
    'xbrl-converter': lazyWithRetry(() => import('./XbrlConverter.tsx'), 'XbrlConverter'),
    'ai-unit-test-generator': lazyWithRetry(() => import('./AiUnitTestGenerator.tsx'), 'AiUnitTestGenerator'),
    'prompt-craft-pad': lazyWithRetry(() => import('./PromptCraftPad.tsx'), 'PromptCraftPad'),
    'linter-formatter': lazyWithRetry(() => import('./CodeFormatter.tsx'), 'CodeFormatter'),
    'schema-designer': lazyWithRetry(() => import('./SchemaDesigner.tsx'), 'SchemaDesigner'),
    'pwa-manifest-editor': lazyWithRetry(() => import('./PwaManifestEditor.tsx'), 'PwaManifestEditor'),
    'markdown-slideshow-generator': lazyWithRetry(() => import('./MarkdownSlides.tsx'), 'MarkdownSlides'),
    'screenshot-to-component': lazyWithRetry(() => import('./ScreenshotToComponent.tsx'), 'ScreenshotToComponent'),
    'typography-lab': lazyWithRetry(() => import('./TypographyLab.tsx'), 'TypographyLab'),
    'svg-path-editor': lazyWithRetry(() => import('./SvgPathEditor.tsx'), 'SvgPathEditor'),
    'ai-style-transfer': lazyWithRetry(() => import('./AiStyleTransfer.tsx'), 'AiStyleTransfer'),
    'ai-coding-challenge-generator': lazyWithRetry(() => import('./AiCodingChallenge.tsx'), 'AiCodingChallenge'),
    'code-review-bot': lazyWithRetry(() => import('./CodeReviewBot.tsx'), 'CodeReviewBot'),
    'ai-pr-assistant': lazyWithRetry(() => import('./AiPullRequestAssistant.tsx'), 'AiPullRequestAssistant'),
    'ai-changelog-generator': lazyWithRetry(() => import('./ChangelogGenerator.tsx'), 'ChangelogGenerator'),
    'cron-job-builder': lazyWithRetry(() => import('./CronJobBuilder.tsx'), 'CronJobBuilder'),
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
    'ai-image-generator': lazyWithRetry(() => import('./AiImageGenerator.tsx'), 'AiImageGenerator'),
    'ai-commit-generator': lazyWithRetry(() => import('./AiCommitGenerator.tsx'), 'AiCommitGenerator'),
    'connections': lazyWithRetry(() => import('./Connections.tsx'), 'Connections'),
    'project-explorer': lazyWithRetry(() => import('./ProjectExplorer.tsx'), 'ProjectExplorer'),
    'ai-code-migrator': lazyWithRetry(() => import('./AiCodeMigrator.tsx'), 'AiCodeMigrator'),
    'theme-designer': lazyWithRetry(() => import('./ThemeDesigner.tsx'), 'ThemeDesigner'),
    'visual-git-tree': lazyWithRetry(() => import('./VisualGitTree.tsx'), 'VisualGitTree'),
    'worker-thread-debugger': lazyWithRetry(() => import('./WorkerThreadDebugger.tsx'), 'WorkerThreadDebugger'),
    'web-scraper': lazyWithRetry(() => import('./WebScraper.tsx'), 'WebScraper'),
    'user-story-generator': lazyWithRetry(() => import('./UserStoryGenerator.tsx'), 'UserStoryGenerator'),
    'url-encoder': lazyWithRetry(() => import('./UrlEncoder.tsx'), 'UrlEncoder'),
    'uml-diagram-generator': lazyWithRetry(() => import('./UmlDiagramGenerator.tsx'), 'UmlDiagramGenerator'),
    'terraform-config-generator': lazyWithRetry(() => import('./TerraformConfigGenerator.tsx'), 'TerraformConfigGenerator'),
    'system-design-planner': lazyWithRetry(() => import('./SystemDesignPlanner.tsx'), 'SystemDesignPlanner'),
    'ssl-certificate-inspector': lazyWithRetry(() => import('./SslCertificateInspector.tsx'), 'SslCertificateInspector'),
    'ssh-key-generator': lazyWithRetry(() => import('./SshKeyGenerator.tsx'), 'SshKeyGenerator'),
    'sql-formatter': lazyWithRetry(() => import('./SqlFormatter.tsx'), 'SqlFormatter'),
    'security-vulnerability-scanner': lazyWithRetry(() => import('./SecurityVulnerabilityScanner.tsx'), 'SecurityVulnerabilityScanner'),
    'release-notes-generator': lazyWithRetry(() => import('./ReleaseNotesGenerator.tsx'), 'ReleaseNotesGenerator'),
    'project-timeline-generator': lazyWithRetry(() => import('./ProjectTimelineGenerator.tsx'), 'ProjectTimelineGenerator'),
    'project-moodboard': lazyWithRetry(() => import('./ProjectMoodboard.tsx'), 'ProjectMoodboard'),
    'pr-generator': lazyWithRetry(() => import('./PrGenerator.tsx'), 'PrGenerator'),
    'performance-load-tester': lazyWithRetry(() => import('./PerformanceLoadTester.tsx'), 'PerformanceLoadTester'),
    'mock-data-generator': lazyWithRetry(() => import('./MockDataGenerator.tsx'), 'MockDataGenerator'),
    'logo-generator': lazyWithRetry(() => import('./LogoGenerator.tsx'), 'LogoGenerator'),
    'kubernetes-manifest-generator': lazyWithRetry(() => import('./KubernetesManifestGenerator.tsx'), 'KubernetesManifestGenerator'),
    'jwt-debugger': lazyWithRetry(() => import('./JwtDebugger.tsx'), 'JwtDebugger'),
    'json-schema-generator': lazyWithRetry(() => import('./JsonSchemaGenerator.tsx'), 'JsonSchemaGenerator'),
    'json-csv-converter': lazyWithRetry(() => import('./JsonCsvConverter.tsx'), 'JsonCsvConverter'),
    'interview-prep-kit': lazyWithRetry(() => import('./InterviewPrepKit.tsx'), 'InterviewPrepKit'),
    'html-table-generator': lazyWithRetry(() => import('./HtmlTableGenerator.tsx'), 'HtmlTableGenerator'),
    'github-repo-explorer': lazyWithRetry(() => import('./GitHubRepoExplorer.tsx'), 'GitHubRepoExplorer'),
    'github-profile-readme-generator': lazyWithRetry(() => import('./GithubProfileReadmeGenerator.tsx'), 'GithubProfileReadmeGenerator'),
    'git-branching-model-visualizer': lazyWithRetry(() => import('./GitBranchingModelVisualizer.tsx'), 'GitBranchingModelVisualizer'),
    'font-preview-picker': lazyWithRetry(() => import('./FontPreviewPicker.tsx'), 'FontPreviewPicker'),
    'font-pairing-tool': lazyWithRetry(() => import('./FontPairingTool.tsx'), 'FontPairingTool'),
    'error-message-explainer': lazyWithRetry(() => import('./ErrorMessageExplainer.tsx'), 'ErrorMessageExplainer'),
    'environment-variable-manager': lazyWithRetry(() => import('./EnvironmentVariableManager.tsx'), 'EnvironmentVariableManager'),
    'email-template-builder': lazyWithRetry(() => import('./EmailTemplateBuilder.tsx'), 'EmailTemplateBuilder'),
    'dockerfile-generator': lazyWithRetry(() => import('./DockerfileGenerator.tsx'), 'DockerfileGenerator'),
    'digital-whiteboard': lazyWithRetry(() => import('./DigitalWhiteboard.tsx'), 'DigitalWhiteboard'),
    'dev-notes-sticky-panel': lazyWithRetry(() => import('./DevNotesStickyPanel.tsx'), 'DevNotesStickyPanel'),
    'design-pattern-suggester': lazyWithRetry(() => import('./DesignPatternSuggester.tsx'), 'DesignPatternSuggester'),
    'dependency-update-suggester': lazyWithRetry(() => import('./DependencyUpdateSuggester.tsx'), 'DependencyUpdateSuggester'),
    'data-structure-visualizer': lazyWithRetry(() => import('./DataStructureVisualizer.tsx'), 'DataStructureVisualizer'),
    'database-query-generator': lazyWithRetry(() => import('./DatabaseQueryGenerator.tsx'), 'DatabaseQueryGenerator'),
    'customer-support-bot-builder': lazyWithRetry(() => import('./CustomerSupportBotBuilder.tsx'), 'CustomerSupportBotBuilder'),
    'color-contrast-checker': lazyWithRetry(() => import('./ColorContrastChecker.tsx'), 'ColorContrastChecker'),
    'code-to-flowchart': lazyWithRetry(() => import('./CodeToFlowchart.tsx'), 'CodeToFlowchart'),
    'code-snippet-to-api': lazyWithRetry(() => import('./CodeSnippetToApi.tsx'), 'CodeSnippetToApi'),
    'code-performance-analyzer': lazyWithRetry(() => import('./CodePerformanceAnalyzer.tsx'), 'CodePerformanceAnalyzer'),
    'code-obfuscator': lazyWithRetry(() => import('./CodeObfuscator.tsx'), 'CodeObfuscator'),
    'code-documentation-generator': lazyWithRetry(() => import('./CodeDocumentationGenerator.tsx'), 'CodeDocumentationGenerator'),
    'code-dependency-visualizer': lazyWithRetry(() => import('./CodeDependencyVisualizer.tsx'), 'CodeDependencyVisualizer'),
    'code-comment-generator': lazyWithRetry(() => import('./CodeCommentGenerator.tsx'), 'CodeCommentGenerator'),
    'cloud-cost-estimator': lazyWithRetry(() => import('./CloudCostEstimator.tsx'), 'CloudCostEstimator'),
    'ci-cd-generator': lazyWithRetry(() => import('./CiCdGenerator.tsx'), 'CiCdGenerator'),
    'base64-encoder': lazyWithRetry(() => import('./Base64Encoder.tsx'), 'Base64Encoder'),
    'api-sdk-generator': lazyWithRetry(() => import('./ApiSdkGenerator.tsx'), 'ApiSdkGenerator'),
    'api-docs-generator': lazyWithRetry(() => import('./ApiDocsGenerator.tsx'), 'ApiDocsGenerator'),
    'api-client': lazyWithRetry(() => import('./ApiClient.tsx'), 'ApiClient'),
    'ai-tech-blog-writer': lazyWithRetry(() => import('./AiTechBlogWriter.tsx'), 'AiTechBlogWriter'),
    'accessibility-checker': lazyWithRetry(() => import('./AccessibilityChecker.tsx'), 'AccessibilityChecker'),
    'ai-repo-creator': lazyWithRetry(() => import('./AiRepoCreator.tsx'), 'AiRepoCreator'),
    'google-drive-labeler': lazyWithRetry(() => import('./GoogleDriveLabeler.tsx'), 'GoogleDriveLabeler'),
};

/**
 * Hydrates the raw feature definitions with their lazy-loaded components.
 */
export const ALL_FEATURES: Feature[] = RAW_FEATURES.map(feature => {
    const component = componentMap[feature.id];
    if (!component) {
        console.warn(`No component found for feature ID: ${feature.id}`);
        // Fallback component
        return {
            ...feature,
            component: () => React.createElement('div', null, `Component for ${feature.name} not found.`)
        };
    }
    return { ...feature, component };
});

/**
 * A map of feature IDs to their full feature definition for quick lookups.
 */
export const FEATURES_MAP = new Map<string, Feature>(ALL_FEATURES.map(f => [f.id, f]));

/**
 * An array of all feature IDs, primarily for use in function calling schemas.
 */
export const ALL_FEATURE_IDS = ALL_FEATURES.map(f => f.id);