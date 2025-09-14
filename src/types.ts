import type React from 'react';
import { CHROME_VIEW_IDS } from './constants.ts';

export type ChromeViewType = typeof CHROME_VIEW_IDS[number];
export type FeatureId = string;

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  component: React.FC<any>;
  aiConfig?: {
    model: string;
    systemInstruction?: string;
  };
}

export type ViewType = FeatureId | ChromeViewType;

export interface GeneratedFile {
  filePath: string;
  content: string;
  description: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: ViewType;
  props?: any;
  action?: () => void;
}

export interface StructuredPrSummary {
    title: string;
    summary: string;
    changes: string[];
}

export type Theme = 'light' | 'dark';

export interface StructuredExplanation {
    summary: string;
    lineByLine: { lines: string; explanation: string }[];
    complexity: { time: string; space: string };
    suggestions: string[];
}

export interface CertificateDetails {
    subject: { commonName: string; organization?: string; country?: string; };
    issuer: { commonName: string; organization?: string; country?: string; };
    validFrom: string;
    validTo: string;
    serialNumber: string;
}

export interface ColorTheme {
    primary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
}

export interface RepoTemplate {
    name: string;
    description: string;
}

export interface User {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    name: string | null;
}

export interface Repo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    owner: User;
    language: string | null;
    pushed_at: string;
    default_branch: string;
}

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

export interface GetReposOptions {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: string;
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

export interface CreateRepoOptions {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
    has_issues?: boolean;
    has_projects?: boolean;
    has_wiki?: boolean;
    is_template?: boolean;
    allow_squash_merge?: boolean;
    allow_merge_commit?: boolean;
    allow_rebase_merge?: boolean;
    delete_branch_on_merge?: boolean;
}