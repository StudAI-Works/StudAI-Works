// file: src/pages/GeneratePage.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "next-themes";
import { Send, Sparkles, Code, Eye, Copy, Download, ImageIcon, FileText, Calculator, User, Layout, Database, Globe, Smartphone, Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react";
import { Header } from "@/components/header";
import { ChatWidget } from "@/components/chat-widget";
import { Navigate } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useAuth } from "../context/authContext";
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import Editor from "@monaco-editor/react";

// Interfaces
interface Message {
  id: string;
  type: "user" | "assistant" | "error" | "system";
  content: string;
  timestamp: Date;
}
interface GeneratedFile {
  path: string;
  content: string;
}
interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

// Constant Arrays
const quickActions = [
  { icon: ImageIcon, label: "Clone a Screenshot", description: "Upload an image to recreate" },
  { icon: FileText, label: "Landing Page", description: "Create a marketing landing page" },
  { icon: User, label: "Sign Up Form", description: "Build authentication forms" },
  { icon: Calculator, label: "Calculate Factorial", description: "Math and utility functions" },
  { icon: Layout, label: "Dashboard", description: "Admin or user dashboard" },
  { icon: Database, label: "CRUD App", description: "Full-stack data management" },
  { icon: Globe, label: "Portfolio Site", description: "Personal or business portfolio" },
  { icon: Smartphone, label: "Mobile App UI", description: "Responsive mobile interface" },
];
const starterTemplates = [
  { name: "Next.js", description: "Build full-stack React apps", icon: "⚡", color: "bg-black text-white" },
  { name: "Supabase", description: "Spin up Postgres with auth", icon: "🟢", color: "bg-green-600 text-white" },
  { name: "Neon", description: "Start with Serverless Postgres", icon: "🔵", color: "bg-blue-600 text-white" },
  { name: "Upstash", description: "Get started with Serverless Redis", icon: "🔴", color: "bg-red-600 text-white" },
];

// Boilerplate HTML
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Generated React Application" />
  <title>React Preview - StudAI Builder</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Ensure fonts load properly */
    body { font-family: 'Inter', system-ui, sans-serif; }
    /* Loading state */
    #root:empty::before {
      content: "Loading...";
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Inter', system-ui, sans-serif;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>`;

// Dynamically created index.js content
// const createIndexJs = (mainFilePath: string) => `import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from '${mainFilePath}';
// import './styles.css';

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<React.StrictMode><App /></React.StrictMode>);`;

const defaultStylesCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base styles */
body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
  color: #1f2937;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

/* Ensure the app takes full height */
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Container utilities */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Button component styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-decoration: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* Card component styles */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

/* Form component styles */
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

/* Navigation styles */
.nav {
  display: flex;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.nav-item {
  padding: 1rem 1.5rem;
  color: #6b7280;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease-in-out;
}

.nav-item:hover, .nav-item.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Utility classes */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.text-center { text-align: center; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-gray-600 { color: #6b7280; }
.text-gray-800 { color: #1f2937; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.border { border-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
.min-h-screen { min-height: 100vh; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
.max-w-lg { max-width: 32rem; }
.max-w-xl { max-width: 36rem; }
.max-w-2xl { max-width: 42rem; }
.max-w-4xl { max-width: 56rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Responsive grid */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

@media (min-width: 768px) {
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

/* Ensure images are responsive */
img {
  max-width: 100%;
  height: auto;
}

/* Link styles */
a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Focus styles for accessibility */
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
`;

export default function GeneratePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState("code");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, token, logout } = useAuth();
  const { theme } = useTheme();

  const BASE_URL = "http://localhost:8080";

  const sandpackConfig = useMemo(() => {
    if (generatedFiles.length === 0) {
      return { files: {}, main: undefined, entry: undefined };
    }

    // Find the main component file
    const mainFile =
      generatedFiles.find(f => f.path.toLowerCase().includes('app.tsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().includes('app.jsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().includes('index.tsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().includes('index.jsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().endsWith('.tsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().endsWith('.jsx'));

    if (!mainFile) {
      return { files: {}, main: undefined, entry: undefined };
    }

    // Create a proper relative path for the main file
    let mainFileImportPath = mainFile.path;

    // Normalize the path
    if (mainFileImportPath.startsWith('frontend/src/')) {
      mainFileImportPath = mainFileImportPath.slice('frontend/src/'.length);
    } else if (mainFileImportPath.startsWith('src/')) {
      mainFileImportPath = mainFileImportPath.slice('src/'.length);
    }

    // Remove file extension and add './' prefix for relative import
    const importPath = `./${mainFileImportPath.replace(/\.(tsx|ts|js|jsx)$/, '')}`;

    const files: SandpackFiles = {
      '/public/index.html': { code: indexHtml, hidden: true },
      // '/src/index.tsx': { code: createIndexJs(`./${mainFile.path.replace(/\.(tsx|ts|js|jsx)$/, '')}`), hidden: true },
      '/package.json': {
        code: JSON.stringify({
          name: "generated-app",
          version: "1.0.0",
          private: true,
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1",
            "react-router-dom": "^6.22.3",
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            "typescript": "^5.0.0",
            "zustand": "^4.4.0",
            "@supabase/supabase-js": "^2.38.0",
            "axios": "^1.6.0",
            "lucide-react": "^0.294.0",
            "@radix-ui/react-dialog": "^1.0.5",
            "@radix-ui/react-dropdown-menu": "^2.0.6",
            "@radix-ui/react-toast": "^1.1.5",
            "class-variance-authority": "^0.7.0",
            "clsx": "^2.0.0",
            "tailwind-merge": "^2.0.0",
            "tailwindcss": "^3.4.1",
            "autoprefixer": "^10.4.16",
            "postcss": "^8.4.32"
          },
          devDependencies: {
            "@types/node": "^20.0.0",
            "postcss": "^8.4.32",
            "tailwindcss": "^3.4.1",
            "autoprefixer": "^10.4.16"
          },
          scripts: {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
          },
          main: "/src/index.tsx",
          browserslist: {
            "production": [
              ">0.2%",
              "not dead",
              "not op_mini all"
            ],
            "development": [
              "last 1 chrome version",
              "last 1 firefox version",
              "last 1 safari version"
            ]
          }
        }, null, 2),
        hidden: true,
      },
      '/src/setupEnv.ts': {
        code: `// Environment setup for preview - executed first
console.log('[Preview] Setting up environment variables...');

// Create process object if it doesn't exist
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  const env = (window as any).process.env;
  
  // Set environment variables with fallback values
  env.REACT_APP_SUPABASE_URL = env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
  env.REACT_APP_SUPABASE_ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
  env.REACT_APP_API_URL = env.REACT_APP_API_URL || 'http://localhost:3001';
  
  console.log('[Preview] Environment variables set:', {
    SUPABASE_URL: env.REACT_APP_SUPABASE_URL,
    API_URL: env.REACT_APP_API_URL,
    SUPABASE_KEY_SET: !!env.REACT_APP_SUPABASE_ANON_KEY
  });
}

// Also set up global variables
if (typeof globalThis !== 'undefined') {
  globalThis.process = globalThis.process || { env: {} };
  const env = globalThis.process.env;
  
  env.REACT_APP_SUPABASE_URL = env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
  env.REACT_APP_SUPABASE_ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
  env.REACT_APP_API_URL = env.REACT_APP_API_URL || 'http://localhost:3001';
}

export {};`,
        hidden: true,
      },
      '/src/index.css': {
        code: `/* Additional Tailwind imports */
@import 'tailwindcss/base';
@import 'tailwindcss/components'; 
@import 'tailwindcss/utilities';

/* Ensure proper styling inheritance */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
        hidden: true,
      },
      '/src/api/supabaseClient.ts': {
        code: `import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for preview
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;`,
        hidden: true,
      },
      '/src/lib/supabase.ts': {
        code: `import { createClient } from '@supabase/supabase-js';

// Alternative path for supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;`,
        hidden: true,
      },
      '/src/utils/supabase.ts': {
        code: `import { createClient } from '@supabase/supabase-js';

// Another common path for supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;`,
        hidden: true,
      },
      '/src/stores/index.ts': {
        code: `// Store exports
export * from './authStore';`,
        hidden: true,
      },
      '/src/stores/authStore.ts': {
        code: `import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        set({ user: profile, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      set({ user: profile });
    }
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      set({ user: profile });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));`,
        hidden: true,
      },
      '/src/hooks/index.ts': {
        code: `// Hook exports  
export * from './useAuth';`,
        hidden: true,
      },
      '/src/types/index.ts': {
        code: `// Type definitions
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}`,
        hidden: true,
      },
    };

    // Process generated files
    generatedFiles.forEach(file => {
      let cleanPath = file.path;
      if (cleanPath.startsWith('frontend/src/')) {
        cleanPath = `/src/${cleanPath.slice('frontend/src/'.length)}`;
      } else if (cleanPath.startsWith('frontend/public/')) {
        cleanPath = `/public/${cleanPath.slice('frontend/public/'.length)}`;
      } else if (cleanPath.startsWith('src/')) {
        cleanPath = `/${cleanPath}`;
      } else if (cleanPath.startsWith('public/')) {
        cleanPath = `/${cleanPath}`;
      } else {
        // Default to src/ for unknown paths
        cleanPath = `/src/${cleanPath}`;
      }
      files[cleanPath] = { code: file.content };
    });

    // Enhanced missing modules detection system
    const missingModules = new Set<string>();
    
    // Helper function to extract all import paths from code
    const extractImportPaths = (code: string): string[] => {
      const imports = [];
      
      // Multiple regex patterns to catch different import styles
      const patterns = [
        // import ... from '...'
        /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"`]([^'"`]+)['"`]/g,
        // import('...')
        /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // require('...')
        /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // const ... = require('...')
        /const\s+[^=]+\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          const importPath = match[1];
          // Only process relative imports that start with . or /
          if (importPath.startsWith('./') || importPath.startsWith('../') || importPath.startsWith('/')) {
            imports.push(importPath);
          }
        }
      });
      
      return imports;
    };

    // Helper function to resolve relative imports to absolute paths
    const resolveImportPath = (importPath: string, fromFile: string): string => {
      let resolvedPath = importPath;
      
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Resolve relative path
        const currentDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
        const parts = currentDir.split('/').filter(p => p);
        const importParts = importPath.split('/').filter(p => p);
        
        for (const part of importParts) {
          if (part === '..') {
            parts.pop();
          } else if (part !== '.') {
            parts.push(part);
          }
        }
        
        resolvedPath = '/' + parts.join('/');
      } else if (importPath.startsWith('/src/')) {
        resolvedPath = importPath;
      } else if (importPath.startsWith('/')) {
        resolvedPath = importPath.startsWith('/src/') ? importPath : `/src${importPath}`;
      }
      
      return resolvedPath;
    };

    // Helper function to check if a module exists with any common extension
    const moduleExists = (basePath: string, files: SandpackFiles): boolean => {
      const possiblePaths = [
        basePath,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        `${basePath}.js`,
        `${basePath}.jsx`,
        `${basePath}/index.ts`,
        `${basePath}/index.tsx`,
        `${basePath}/index.js`,
        `${basePath}/index.jsx`
      ];
      
      return possiblePaths.some(path => files[path]);
    };

    // Scan all files for missing imports
    Object.keys(files).forEach(filePath => {
      const fileContent = files[filePath]?.code || '';
      const importPaths = extractImportPaths(fileContent);
      
      importPaths.forEach(importPath => {
        const resolvedPath = resolveImportPath(importPath, filePath);
        
        if (!moduleExists(resolvedPath, files)) {
          // Determine the best file extension based on the path
          let finalPath = resolvedPath;
          if (!finalPath.includes('.')) {
            if (finalPath.includes('/components/') || finalPath.toLowerCase().includes('component')) {
              finalPath += '.tsx';
            } else if (finalPath.includes('/pages/') || finalPath.includes('/views/')) {
              finalPath += '.tsx';
            } else {
              finalPath += '.ts';
            }
          }
          missingModules.add(finalPath);
        }
      });
    });

    // Generate fallback files for missing modules
    missingModules.forEach(modulePath => {
      if (files[modulePath]) return; // Skip if already exists
      
      const fileName = modulePath.split('/').pop() || '';
      const isComponent = modulePath.endsWith('.tsx') || modulePath.includes('/components/');
      
      let fallbackContent = '';
      
      if (modulePath.includes('/api/')) {
        // Generate API fallback
        const apiName = fileName.replace(/\.tsx?$/, '').replace(/Api$/, '');
        fallbackContent = `// Auto-generated fallback for ${modulePath}
export interface ${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data {
  id: string;
  [key: string]: any;
}

export const fetch${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data = async (): Promise<${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data[]> => {
  console.warn('[Preview] Using fallback API for ${modulePath}');
  return [];
};

export const create${apiName.charAt(0).toUpperCase() + apiName.slice(1)} = async (data: Partial<${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data>): Promise<${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data> => {
  console.warn('[Preview] Using fallback API for ${modulePath}');
  return { id: 'preview-id', ...data } as ${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data;
};

export const update${apiName.charAt(0).toUpperCase() + apiName.slice(1)} = async (id: string, data: Partial<${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data>): Promise<${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data> => {
  console.warn('[Preview] Using fallback API for ${modulePath}');
  return { id, ...data } as ${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data;
};

export const delete${apiName.charAt(0).toUpperCase() + apiName.slice(1)} = async (id: string): Promise<void> => {
  console.warn('[Preview] Using fallback API for ${modulePath}');
};

export default {
  fetch${apiName.charAt(0).toUpperCase() + apiName.slice(1)}Data,
  create${apiName.charAt(0).toUpperCase() + apiName.slice(1)},
  update${apiName.charAt(0).toUpperCase() + apiName.slice(1)},
  delete${apiName.charAt(0).toUpperCase() + apiName.slice(1)}
};`;
      } else if (modulePath.includes('/stores/')) {
        // Generate Store fallback
        const storeName = fileName.replace(/\.tsx?$/, '').replace(/Store$/, '');
        fallbackContent = `// Auto-generated fallback for ${modulePath}
import { create } from 'zustand';

export interface ${storeName.charAt(0).toUpperCase() + storeName.slice(1)}State {
  data: any[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  addItem: (item: any) => void;
  updateItem: (id: string, item: any) => void;
  removeItem: (id: string) => void;
}

export const use${storeName.charAt(0).toUpperCase() + storeName.slice(1)}Store = create<${storeName.charAt(0).toUpperCase() + storeName.slice(1)}State>((set, get) => ({
  data: [],
  loading: false,
  error: null,

  fetchData: async () => {
    console.warn('[Preview] Using fallback store for ${modulePath}');
    set({ loading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ data: [], loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch data', loading: false });
    }
  },

  addItem: (item: any) => {
    set(state => ({
      data: [...state.data, { id: Date.now().toString(), ...item }]
    }));
  },

  updateItem: (id: string, item: any) => {
    set(state => ({
      data: state.data.map(d => d.id === id ? { ...d, ...item } : d)
    }));
  },

  removeItem: (id: string) => {
    set(state => ({
      data: state.data.filter(d => d.id !== id)
    }));
  }
}));

export default use${storeName.charAt(0).toUpperCase() + storeName.slice(1)}Store;`;
      } else if (modulePath.includes('/hooks/')) {
        // Generate Hook fallback
        const hookName = fileName.replace(/\.tsx?$/, '');
        fallbackContent = `// Auto-generated fallback for ${modulePath}
import { useState, useEffect } from 'react';

export const ${hookName} = () => {
  console.warn('[Preview] Using fallback hook for ${modulePath}');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fallback hook implementation
    setLoading(false);
  }, []);

  return { data, loading, error, setData };
};

export default ${hookName};`;
      } else if (modulePath.includes('/types/')) {
        // Generate Types fallback
        fallbackContent = `// Auto-generated fallback for ${modulePath}
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Generic fallback type
export type FallbackType = Record<string, any>;

export default {};`;
      } else if (modulePath.includes('/utils/')) {
        // Generate Utils fallback
        const utilName = fileName.replace(/\.tsx?$/, '');
        fallbackContent = `// Auto-generated fallback for ${modulePath}
export const ${utilName} = (...args: any[]): any => {
  console.warn('[Preview] Using fallback utility for ${modulePath}');
  return args[0] || null;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default {
  ${utilName},
  formatDate,
  formatCurrency,
  capitalize
};`;
      } else if (isComponent) {
        // Generate Component fallback
        const componentName = fileName.replace(/\.tsx?$/, '');
        const displayName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        fallbackContent = `// Auto-generated fallback for ${modulePath}
import React from 'react';

interface ${displayName}Props {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const ${displayName}: React.FC<${displayName}Props> = ({ children, className, ...props }) => {
  console.warn('[Preview] Using fallback component for ${modulePath}');
  
  return (
    <div 
      className={\`p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 \${className || ''}\`}
      {...props}
    >
      <div className="text-sm text-gray-500 mb-2">
        Preview: ${displayName} Component
      </div>
      {children}
    </div>
  );
};

export default ${displayName};`;
      } else {
        // Generic fallback
        fallbackContent = `// Auto-generated fallback for ${modulePath}
console.warn('[Preview] Using generic fallback for ${modulePath}');

export const fallbackFunction = (...args: any[]): any => {
  return args[0] || null;
};

export const fallbackObject = {};

export const fallbackArray: any[] = [];

export default fallbackFunction;`;
      }
      
      files[modulePath] = {
        code: fallbackContent,
        hidden: true
      };
    });

    // Determine the active file path
    let activeFilePath = `/src/${mainFileImportPath}`;

    // Ensure the active file exists in our files object
    if (!files[activeFilePath]) {
      const possiblePaths = Object.keys(files).filter(path =>
        path.includes(mainFile.path.split('/').pop()?.replace(/\.(tsx|ts|js|jsx)$/, '') || '')
      );
      activeFilePath = possiblePaths[0] || Object.keys(files).find(path => path.startsWith('/src/') && path.endsWith('.tsx')) || '/src/App.tsx';
    }

    return {
      files,
      entry: '/src/index.tsx',
      main: activeFilePath
    };
  }, [generatedFiles]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fixPath = (path: string): string => {
    // Fix common frontend root-level files
    if (/^(vite\.config\.ts|vite\.config\.js|tsconfig\.json|tailwind\.config\.(js|cjs|ts)|postcss\.config\.(js|cjs)|package\.json|package-lock\.json|index\.html)$/i.test(path)) {
      return `frontend/${path}`;
    }

    // Fix common backend root-level files
    if (/^(requirements\.txt|pyproject\.toml|main\.py|server\.(ts|js))$/i.test(path)) {
      return `backend/${path}`;
    }

    return path;
  };

  const parseAIResponse = (response: string): GeneratedFile[] => {
    const files: GeneratedFile[] = [];
    const regex = /####\s*(.*?)\s*\n```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      const path = match[1].trim().replace(/^'|'$/g, '');
      const content = match[3].trim();
      if (path && content) {
        const fixedPath = fixPath(path);
        files.push({ path: fixedPath, content });
      }
    }

    // Save non-code markdown sections like "Project Overview", "Folder Structure", etc.
    const sections = response.split('\n\n---\n').map(section => section.trim());
    sections.forEach(section => {
      if (!section.startsWith('## 🔹')) return;
      const lines = section.split('\n');
      const title = lines[0].replace('## 🔹 ', '').trim();
      const content = lines.slice(1).join('\n').trim();
      if (title !== 'Code Files' && content) {
        files.push({ path: `${title.toLowerCase().replace(/\s+/g, '-')}.md`, content });
      }
    });

    if (files.length === 0) {
      files.push({ path: "response.md", content: response });
    }

    return files;
  };

  const buildFileTree = (files: GeneratedFile[]): FileTreeNode[] => {
    const root: FileTreeNode = { name: 'root', path: '', type: 'folder', children: [] };
    files.forEach(file => {
      let currentLevel = root;
      file.path.split('/').forEach((part, index, arr) => {
        if (!currentLevel.children) return;
        const isLast = index === arr.length - 1;
        let existing = currentLevel.children.find(c => c.name === part);
        if (existing) {
          currentLevel = existing;
        } else {
          const newNode: FileTreeNode = {
            name: part,
            path: arr.slice(0, index + 1).join('/'),
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : []
          };
          currentLevel.children.push(newNode);
          currentLevel = newNode;
        }
      });
    });
    return root.children || [];
  };

  const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

  const startConversation = async () => {
    const loadingToastId = toast.loading("Starting conversation...");
    try {
      const res = await fetch(`${BASE_URL}/api/start-conversation`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log(data)
      setSessionId(data.session_id);
      setMessages([{ id: Date.now().toString(), type: 'assistant', content: data.message, timestamp: new Date() }]);
      toast.update(loadingToastId, { render: "Conversation started!", type: "success", isLoading: false, autoClose: 2000 });
      return data.session_id;
    } catch (err: any) {
      toast.update(loadingToastId, { render: `Error: ${err.message}`, type: "error", isLoading: false, autoClose: 4000 });
    }
  };

  const handleSend = async (prompt?: string) => {
    const messageContent = prompt || input;
    

    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: messageContent, timestamp: new Date() }]);
    setInput("");

    const loadingToastId = toast.loading("Processing your prompt...");
    try {
      let sessionid;
    
      if (!sessionId) {
        sessionid = await startConversation();
        localStorage.setItem("sessionid", sessionid)
      }
      console.log(sessionid)
      const res = await fetch(`${BASE_URL}/refine`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: localStorage.getItem("sessionid"), message: messageContent }),
      });
    
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: data.reply, timestamp: new Date() }]);
      toast.update(loadingToastId, { render: "Response received!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'error', content: `Error: ${err.message}`, timestamp: new Date() }]);
      toast.update(loadingToastId, { render: `Error: ${err.message}`, type: "error", isLoading: false, autoClose: 4000 });
    }
  };

  const handleGenerateCode = async () => {
    const sessionid = localStorage.getItem("sessionid");
    if (!sessionid) {
      toast.error("No active conversation session");
      return;
    }

    setIsGenerating(true);
    setGeneratedFiles([]);
    setFileTree([]);
    setSelectedFile(null);

    const loadingToastId = toast.loading("Generating code...");

    try {
      const response = await fetch(`http://localhost:8000/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionid }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let responseText = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;

        const files = parseAIResponse(responseText);
        if (files.length > 0) {
          setGeneratedFiles(files);
          const tree = buildFileTree(files);
          setFileTree(tree);
          if (!selectedFile) setSelectedFile(files[0]);
          const rootFolders = new Set(tree.filter(n => n.type === 'folder').map(n => n.path));
          setExpandedFolders(rootFolders);
        }
      }

      toast.update(loadingToastId, { render: "Code generated!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'error', content: `Error: ${err.message}`, timestamp: new Date() }]);
      toast.update(loadingToastId, { render: `Error: ${err.message}`, type: "error", isLoading: false, autoClose: 4000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCodeEdit = (newCode: string | undefined) => {
    if (selectedFile && newCode !== undefined) {
      const updatedFiles = generatedFiles.map(file => file.path === selectedFile.path ? { ...file, content: newCode } : file);
      setGeneratedFiles(updatedFiles);
      setSelectedFile(prev => prev ? { ...prev, content: newCode } : null);
    }
  };

  const handleQuickAction = (action: string) => {
    startConversation().then(() => handleSend(`Create a ${action}`));
  };

  const copyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content).then(() => toast.success("Copied!"));
    }
  };

  const downloadZip = async () => {
    if (generatedFiles.length === 0) return;
    const zip = new JSZip();
    generatedFiles.forEach(f => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, "studai-project.zip");
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openInCodeSandbox = () => {
    if (!sandpackConfig.files || Object.keys(sandpackConfig.files).length === 0) return;
    
    try {
      // Create the CodeSandbox parameters
      const files = sandpackConfig.files as SandpackFiles;
      const parameters = {
        files: Object.keys(files).reduce((acc, filePath) => {
          const file = files[filePath];
          if (file && typeof file === 'object' && 'code' in file && !file.hidden) {
            acc[filePath] = {
              content: file.code
            };
          }
          return acc;
        }, {} as Record<string, { content: string }>)
      };
      
      // Use form submission to avoid URL length limits
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
      form.target = '_blank';
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'parameters';
      input.value = JSON.stringify(parameters);
      
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error('Failed to open in CodeSandbox:', error);
      toast.error('Failed to open in CodeSandbox. Please try downloading the ZIP instead.');
    }
  };

  const FileTreeItem = ({ node, level = 0 }: { node: FileTreeNode; level?: number }) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile?.path === node.path;
    const handleNodeClick = () => {
      if (node.type === 'folder') toggleFolder(node.path);
      else setSelectedFile(generatedFiles.find(f => f.path === node.path) || null);
    };
    return (
      <div>
        <div
          onClick={handleNodeClick}
          className={`flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 cursor-pointer rounded text-sm ${isSelected ? "bg-primary/10 text-primary" : ""}`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {node.type === "folder" ? (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <div className="w-4" />}
          {node.type === "folder" ? (isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />) : <FileIcon className="h-4 w-4 text-muted-foreground" />}
          <span>{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div>{node.children.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(child => <FileTreeItem key={child.path} node={child} level={level + 1} />)}</div>
        )}
      </div>
    );
  };

  const headerUser = user ? { name: user.fullName, email: user.email, avatar: "/placeholder.svg?height=32&width=32" } : null;
  const getLanguage = (filePath: string) => {
    const extension = filePath.split('.').pop();
    switch (extension) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <ToastContainer position="bottom-right" theme="dark" />
        <Header user={headerUser} onLogout={logout} />
        {/* <ChatWidget /> */}
      </div>

      <main className="flex-1 min-h-0">
        {messages.length === 0 ? (
          <ScrollArea className="h-full">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold mb-6">What can I help you build?</h1>
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="relative">
                      <Textarea
                        placeholder="Ask to build a React component with a file structure..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[120px] text-lg resize-none pr-12"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="absolute bottom-3 right-3"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isGenerating}
                      >
                        {isGenerating ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start text-left space-y-2 hover:bg-muted/50 bg-transparent"
                        onClick={() => handleQuickAction(action.label)}
                      >
                        <action.icon className="h-5 w-5 mb-2" />
                        <div>
                          <div className="font-medium text-sm">{action.label}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">Starter Templates</h2>
                  <div className="grid md:grid-cols-4 gap-4">
                    {starterTemplates.map((template) => (
                      <Card key={template.name} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center text-2xl mb-4`}>
                            {template.icon}
                          </div>
                          <h3 className="font-semibold mb-2">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col">
                <div className="border-b p-4 flex-shrink-0">
                  <h2 className="font-semibold flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />AI Assistant
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleGenerateCode}
                    disabled={isGenerating || !sessionId}
                  >
                    Generate Code
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 ${message.type === "user" ? "bg-primary text-primary-foreground" : message.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Generating...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
                <div className="border-t p-4 flex-shrink-0">
                  <div className="relative">
                    <Textarea
                      placeholder="Describe what to build or modify..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="min-h-[60px] resize-none pr-12"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="absolute bottom-3 right-3"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isGenerating}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full flex flex-col">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col min-h-0">
                  <div className="border-b p-2 flex items-center justify-between flex-shrink-0">
                    <TabsList>
                      <TabsTrigger value="code"><Code className="mr-2 h-4 w-4" />Code</TabsTrigger>
                      <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" />Preview</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={copyCode} disabled={!selectedFile}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                      <Button variant="outline" size="sm" onClick={downloadZip} disabled={generatedFiles.length === 0}><Download className="mr-2 h-4 w-4" />Download ZIP</Button>
                      {selectedTab === 'preview' && sandpackConfig.files && Object.keys(sandpackConfig.files).length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openInCodeSandbox}
                        >
                          <Globe className="mr-2 h-4 w-4" />Open in CodeSandbox
                        </Button>
                      )}
                    </div>
                  </div>

                  <TabsContent value="code" className="flex-1 flex flex-col min-h-0">
                    <ResizablePanelGroup direction="horizontal" className="flex-1">
                      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                        <div className="h-full border-r bg-muted/20 flex flex-col">
                          <div className="p-2 border-b flex-shrink-0"><h3 className="font-semibold text-sm">File Explorer</h3></div>
                          <ScrollArea className="flex-1 p-2">
                            {fileTree.length > 0 ? (
                              <div className="space-y-1">{fileTree.map((node) => (<FileTreeItem key={node.path} node={node} />))}</div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Awaiting generation...</p>
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </ResizablePanel>
                      <ResizableHandle />
                      <ResizablePanel defaultSize={75}>
                        <div className="h-full">
                          <Editor
                            height="100%"
                            language={selectedFile ? getLanguage(selectedFile.path) : 'plaintext'}
                            value={selectedFile?.content ?? "// Select a file to view and edit its content"}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            onChange={handleCodeEdit}
                            options={{ minimap: { enabled: false }, wordWrap: "on", fontSize: 14, scrollBeyondLastLine: false }}
                          />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </TabsContent>

                  <TabsContent value="preview" className="flex-1 p-0 m-0">
                    {selectedTab === 'preview' && (
                      <SandpackProvider
                        files={sandpackConfig.files}
                        template="react-ts"
                        customSetup={{
                          entry: sandpackConfig.entry,
                          dependencies: {
                            'react': "^18.2.0",
                            "react-dom": "^18.2.0",
                            "react-router-dom": "^6.22.3",
                            'tailwindcss': "^3.4.1",
                            'axios': "^1.11.0",
                            "react-icons": "^5.5.0",
                            "zustand": "^5.0.0",
                            "date-fns":"^1.0.0"
                          }
                        }}
                      >
                        <SandpackLayout style={{height:"800px"}}>
                            <SandpackCodeEditor style={{ height: "800px" }} />
                            <SandpackPreview style={{ height: "800px" }} />
                        </SandpackLayout>
                      </SandpackProvider>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>
    </div>
  );
}