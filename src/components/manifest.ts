import React from 'react';
import {
    CommandCenterIcon, CodeExplainerIcon, FeatureBuilderIcon, CodeMigratorIcon, ThemeDesignerIcon, SnippetVaultIcon,
    UnitTestGeneratorIcon, ConcurrencyAnalyzerIcon, RegexSandboxIcon,
    PromptCraftPadIcon, CodeFormatterIcon, JsonTreeIcon, CssGridEditorIcon, SchemaDesignerIcon, PwaManifestEditorIcon,
    MarkdownSlidesIcon, ScreenshotToComponentIcon, SvgPathEditorIcon, StyleTransferIcon, CodingChallengeIcon,
    CodeReviewBotIcon, CronJobBuilderIcon,
    AsyncCallTreeIcon, AudioToCodeIcon, CodeSpellCheckerIcon, ColorPaletteGeneratorIcon, LogicFlowBuilderIcon,
    MetaTagEditorIcon, NetworkVisualizerIcon, ResponsiveTesterIcon, SassCompilerIcon, ImageGeneratorIcon, XbrlConverterIcon,
    DigitalWhiteboardIcon, TypographyLabIcon
} from './icons.tsx';
import type { FeatureCategory } from '../constants.ts';

interface RawFeature {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: FeatureCategory;
}

// This is the raw data, to be "compiled" by features/index.ts
export const RAW_FEATURES: RawFeature[] = [
    { id: "ai-command-center", name: "AI Command Center", description: "Use natural language to navigate and control the toolkit.", icon: React.createElement(CommandCenterIcon, null), category: "Core" },
    { id: "ai-image-generator", name: "AI Image Generator", description: "Generate high-quality images from a text prompt.", icon: React.createElement(ImageGeneratorIcon, null), category: "AI Tools" },
    { id: "ai-code-explainer", name: "AI Code Explainer", description: "Get a structured analysis of code, including complexity.", icon: React.createElement(CodeExplainerIcon, null), category: "AI Tools" },
    { id: "ai-feature-builder", name: "AI Feature Builder", description: "Generate code, tests, and commit messages.", icon: React.createElement(FeatureBuilderIcon, null), category: "AI Tools" },
    { id: "ai-code-migrator", name: "AI Code Migrator", description: "Translate code between languages & frameworks.", icon: React.createElement(CodeMigratorIcon, null), category: "AI Tools" },
    { id: "theme-designer", name: "AI Theme Designer", description: "Generate, fine-tune, and export UI color themes from a text description.", icon: React.createElement(ThemeDesignerIcon, null), category: "AI Tools" },
    { id: "portable-snippet-vault", name: "Snippet Vault", description: "Store, search, tag, and enhance reusable code snippets with AI.", icon: React.createElement(SnippetVaultIcon, null), category: "Productivity" },
    { id: "digital-whiteboard", name: "Digital Whiteboard", description: "Organize ideas with interactive sticky notes and get AI-powered summaries.", icon: React.createElement(DigitalWhiteboardIcon, null), category: "Productivity" },
    { id: "ai-unit-test-generator", name: "AI Unit Test Generator", description: "Generate unit tests from source code.", icon: React.createElement(UnitTestGeneratorIcon, null), category: "AI Tools" },
    { id: "worker-thread-debugger", name: "AI Concurrency Analyzer", description: "Analyze JS for Web Worker issues like race conditions.", icon: React.createElement(ConcurrencyAnalyzerIcon, null), category: "Testing" },
    { id: "regex-sandbox", name: "RegEx Sandbox", description: "Visually test regular expressions, generate them with AI, and inspect match groups.", icon: React.createElement(RegexSandboxIcon, null), category: "Testing" },
    { id: "prompt-craft-pad", name: "Prompt Craft Pad", description: "Save, edit, and manage your custom AI prompts with variable testing.", icon: React.createElement(PromptCraftPadIcon, null), category: "AI Tools" },
    { id: "linter-formatter", name: "AI Code Formatter", description: "AI-powered, real-time code formatting.", icon: React.createElement(CodeFormatterIcon, null), category: "Core" },
    { id: "json-tree-navigator", name: "JSON Tree Navigator", description: "Navigate large JSON objects as a collapsible tree.", icon: React.createElement(JsonTreeIcon, null), category: "Core" },
    { id: "xbrl-converter", name: "XBRL Converter", description: "Convert JSON data to a simplified XBRL-like XML format using AI.", icon: React.createElement(XbrlConverterIcon, null), category: "Data" },
    { id: "css-grid-editor", name: "CSS Grid Visual Editor", description: "Drag-based layout builder for CSS Grid.", icon: React.createElement(CssGridEditorIcon, null), category: "Frontend" },
    { id: "schema-designer", name: "Schema Designer", description: "Visually design a database schema with a drag-and-drop interface and SQL export.", icon: React.createElement(SchemaDesignerIcon, null), category: "Database" },
    { id: "pwa-manifest-editor", name: "PWA Manifest Editor", description: "Configure and preview Progressive Web App manifests with a home screen simulator.", icon: React.createElement(PwaManifestEditorIcon, null), category: "Frontend" },
    { id: "markdown-slides-generator", name: "Markdown Slides", description: "Turn markdown into a fullscreen presentation with an interactive overlay.", icon: React.createElement(MarkdownSlidesIcon, null), category: "Productivity" },
    { id: "screenshot-to-component", name: "Screenshot-to-Component", description: "Turn UI screenshots into functional code via paste or upload.", icon: React.createElement(ScreenshotToComponentIcon, null), category: "AI Tools" },
    { id: "typography-lab", name: "Typography Lab", description: "Preview font pairings and get CSS import rules.", icon: React.createElement(TypographyLabIcon, null), category: "Frontend" },
    { id: "svg-path-editor", name: "SVG Path Editor", description: "Visually create and manipulate SVG path data with an interactive canvas.", icon: React.createElement(SvgPathEditorIcon, null), category: "Frontend" },
    { id: "ai-style-transfer", name: "AI Code Style Transfer", description: "Rewrite code to match a specific style guide.", icon: React.createElement(StyleTransferIcon, null), category: "AI Tools" },
    { id: "ai-coding-challenge", name: "AI Coding Challenge Generator", description: "Generate unique coding exercises.", icon: React.createElement(CodingChallengeIcon, null), category: "AI Tools" },
    { id: "code-review-bot", name: "AI Code Review Bot", description: "Get an automated code review from an AI.", icon: React.createElement(CodeReviewBotIcon, null), category: "AI Tools" },
    { id: "cron-job-builder", name: "AI Cron Job Builder", description: "Visually tool to configure cron jobs, with AI.", icon: React.createElement(CronJobBuilderIcon, null), category: "Deployment" },
    { id: "async-call-tree-viewer", name: "Async Call Tree Viewer", description: "Visualize a tree of asynchronous function calls from JSON data.", icon: React.createElement(AsyncCallTreeIcon, null), category: "Testing" },
    { id: "audio-to-code", name: "AI Audio-to-Code", description: "Speak your programming ideas and watch them turn into code.", icon: React.createElement(AudioToCodeIcon, null), category: "AI Tools" },
    { id: "code-spell-checker", name: "Code Spell Checker", description: "A spell checker that finds common typos in code.", icon: React.createElement(CodeSpellCheckerIcon, null), category: "Testing" },
    { id: "color-palette-generator", name: "AI Color Palette Generator", description: "Pick a base color and let Gemini design a beautiful palette.", icon: React.createElement(ColorPaletteGeneratorIcon, null), category: "Frontend" },
    { id: "logic-flow-builder", name: "Logic Flow Builder", description: "A visual tool for building application logic flows.", icon: React.createElement(LogicFlowBuilderIcon, null), category: "Workflow" },
    { id: "meta-tag-editor", name: "Meta Tag Editor", description: "Generate SEO/social media meta tags with a live social card preview.", icon: React.createElement(MetaTagEditorIcon, null), category: "Frontend" },
    { id: "network-visualizer", name: "Network Visualizer", description: "Inspect network resources with a summary and visual waterfall chart.", icon: React.createElement(NetworkVisualizerIcon, null), category: "Testing" },
    { id: "responsive-tester", name: "Responsive Tester", description: "Preview your web pages at different screen sizes and custom resolutions.", icon: React.createElement(ResponsiveTesterIcon, null), category: "Frontend" },
    { id: "sass-scss-compiler", name: "SASS/SCSS Compiler", description: "A real-time SASS/SCSS to CSS compiler.", icon: React.createElement(SassCompilerIcon, null), category: "Frontend" },
];

export const ALL_FEATURE_IDS = RAW_FEATURES.map(f => f.id);