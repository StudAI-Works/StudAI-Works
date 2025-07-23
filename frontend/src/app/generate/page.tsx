"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import axios from "axios"
import { useTheme } from "next-themes"
import { Send, Sparkles, Code, Eye, Copy, Download, ImageIcon, FileText, Calculator, User, Layout, Database, Globe, Smartphone, Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react"
import { Header } from "@/components/header"
import { ChatWidget } from "@/components/chat-widget"
import { Link, Navigate } from "react-router-dom"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useAuth } from "../context/authContext";
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, SandpackFileExplorer } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import Editor from "@monaco-editor/react";

// Interfaces
interface Message { id: string; type: "user" | "assistant" | "error"; content: string; timestamp: Date; }
interface GeneratedFile { path: string; content: string; }
interface FileTreeNode { name: string; path: string; type: "file" | "folder"; children?: FileTreeNode[]; }

// Constant Arrays
const quickActions = [{ icon: ImageIcon, label: "Clone a Screenshot", description: "Upload an image to recreate" }, { icon: FileText, label: "Landing Page", description: "Create a marketing landing page" }, { icon: User, label: "Sign Up Form", description: "Build authentication forms" }, { icon: Calculator, label: "Calculate Factorial", description: "Math and utility functions" }, { icon: Layout, label: "Dashboard", description: "Admin or user dashboard" }, { icon: Database, label: "CRUD App", description: "Full-stack data management" }, { icon: Globe, label: "Portfolio Site", description: "Personal or business portfolio" }, { icon: Smartphone, label: "Mobile App UI", description: "Responsive mobile interface" },];
const starterTemplates = [{ name: "Next.js", description: "Build full-stack React apps", icon: "⚡", color: "bg-black text-white" }, { name: "Supabase", description: "Spin up Postgres with auth", icon: "🟢", color: "bg-green-600 text-white" }, { name: "Neon", description: "Start with Serverless Postgres", icon: "🔵", color: "bg-blue-600 text-white" }, { name: "Upstash", description: "Get started with Serverless Redis", icon: "🔴", color: "bg-red-600 text-white" },];

// Boilerplate HTML
const indexHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>React Preview</title></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`;

// Dynamically created index.js content
const createIndexJs = (mainFilePath: string) => `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '${mainFilePath}'; // Use the correct relative path
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<React.StrictMode><App /></React.StrictMode>);`;

const defaultStylesCss = `body { font-family: sans-serif; }`;

export default function GeneratePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTab, setSelectedTab] = useState("code")
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const sandpackConfig = useMemo(() => {
    if (generatedFiles.length === 0) {
      return { files: {}, main: undefined, entry: undefined };
    }

    const mainFile =
      generatedFiles.find(f => f.path.toLowerCase().includes('app.tsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().includes('index.tsx')) ||
      generatedFiles.find(f => f.path.toLowerCase().endsWith('.tsx'));

    if (!mainFile) {
      return { files: {}, main: undefined, entry: undefined };
    }

    const files: SandpackFiles = {
      '/public/index.html': {
        code: indexHtml,
        hidden: true,
      },
      '/src/index.tsx': {
        code: createIndexJs(`./${mainFile.path.replace(/\.(tsx|ts|js|jsx)$/, '')}`),
        hidden: true,
      },
      '/package.json': {
        code: JSON.stringify({
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1",
            "tailwindcss": "3.4.1",
            "react-router-dom": "^6.22.3"
          },
          main: "/src/index.tsx"
        }, null, 2),
        hidden: true,
      },
    };

    generatedFiles.forEach(file => {
      let cleanPath = file.path;

      // Normalize for Sandpack's virtual file system
      if (cleanPath.startsWith('frontend/src/')) {
        cleanPath = `/src/${cleanPath.slice('frontend/src/'.length)}`;
      } else if (cleanPath.startsWith('frontend/public/')) {
        cleanPath = `/public/${cleanPath.slice('frontend/public/'.length)}`;
      } else {
        cleanPath = `/${cleanPath}`;
      }

      files[cleanPath] = { code: file.content };
    });

    const activeFilePath = `/src/${mainFile.path}`;
    if (files[activeFilePath] && typeof files[activeFilePath] === "object" && files[activeFilePath] !== null) {
      (files[activeFilePath] as any).active = true;
    }

    return {
      files,
      entry: '/src/index.tsx',
      main: activeFilePath
    };
  }, [generatedFiles]);


  if (!user) { return <Navigate to="/auth" replace />; }

  const BASE_URL = "http://localhost:8080";

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages]);
  function parseAIResponse(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const regex = /```(\w+)?\n(?:\/\/|#|<!--)\s*path:\s*(.*?)\s*\n([\s\S]*?)```/g;

    let match;
    while ((match = regex.exec(response)) !== null) {
      const [_, lang, path, content] = match;
      if (path && content) {
        files.push({ path: path.trim(), content: content.trim() });
      }
    }

    return files;
  }
  const buildFileTree = (files: GeneratedFile[]): FileTreeNode[] => { const root: FileTreeNode = { name: 'root', path: '', type: 'folder', children: [] }; files.forEach(file => { let currentLevel = root; file.path.split('/').forEach((part, index, arr) => { if (!currentLevel.children) return; const isLast = index === arr.length - 1; let existing = currentLevel.children.find(c => c.name === part); if (existing) { currentLevel = existing; } else { const newNode: FileTreeNode = { name: part, path: arr.slice(0, index + 1).join('/'), type: isLast ? 'file' : 'folder', children: isLast ? undefined : [] }; currentLevel.children.push(newNode); currentLevel = newNode; } }); }); return root.children || []; };

const handleSend = async (prompt?: string) => {
  const messageContent = prompt || input;
  if (messageContent.trim().length < 10) return toast.error("Prompt must be at least 10 characters long");

  // Add user message to chat
  setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: messageContent, timestamp: new Date() }]);
  setInput("");
  setIsGenerating(true);
  setGeneratedFiles([]);
  setFileTree([]);
  setSelectedFile(null);
  
  const loadingToastId = toast.loading("Generating your project...");

  try {
    const res = await axios.post(`${BASE_URL}/userpromt`, { Promt: messageContent });
    console.log("Response from server:", res.data);

    if (res.status === 200) {
      const gotInformation = res.data.gotInformation;
      const serverMessage = res.data.data; // The follow-up prompt or generated code string

      if (gotInformation === false) {
        // Show the follow-up prompt/message from server (res.data.data)
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: serverMessage,
            timestamp: new Date(),
          }
        ]);
        toast.update(loadingToastId, { render: serverMessage, type: "info", isLoading: false, autoClose: 4000 });
        setIsGenerating(false);
        return;
      } 
      
      if (gotInformation === true) {
        // Proceed to parse and display generated code/files as before
        const files = parseAIResponse(serverMessage);
        if (files.length === 0) {
          const fallbackFile = { path: "response.md", content: serverMessage };
          setGeneratedFiles([fallbackFile]);
          setFileTree([{ name: "response.md", path: "response.md", type: 'file', children: undefined }]);
          setSelectedFile(fallbackFile);
        } else {
          setGeneratedFiles(files);
          const tree = buildFileTree(files);
          setFileTree(tree);
          setSelectedFile(files[0]);
          const rootFolders = new Set(tree.filter(n => n.type === 'folder').map(n => n.path));
          setExpandedFolders(rootFolders);
        }
        toast.update(loadingToastId, { render: "Success!", type: "success", isLoading: false, autoClose: 2000 });
      } else {
        throw new Error("Invalid gotInformation flag from server.");
      }
    } else { 
      throw new Error("Invalid response from server"); 
    }
  } catch (err: any) {
    const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'error', content: `Error: ${errorMessage}`, timestamp: new Date() }]);
    toast.update(loadingToastId, { render: `Error: ${errorMessage}`, type: "error", isLoading: false, autoClose: 4000 });
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

  const handleQuickAction = (action: string) => { handleSend(`Create a ${action}`) };
  const copyCode = () => { if (selectedFile) navigator.clipboard.writeText(selectedFile.content).then(() => toast.success("Copied!")) };
  const downloadZip = async () => { if (generatedFiles.length === 0) return; const zip = new JSZip(); generatedFiles.forEach(f => zip.file(f.path, f.content)); const blob = await zip.generateAsync({ type: 'blob' }); saveAs(blob, "studai-project.zip") };
  const toggleFolder = (path: string) => { setExpandedFolders(prev => { const next = new Set(prev); if (next.has(path)) next.delete(path); else next.add(path); return next }) };

  const FileTreeItem = ({ node, level = 0 }: { node: FileTreeNode; level?: number }) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile?.path === node.path
    const handleNodeClick = () => { if (node.type === 'folder') toggleFolder(node.path); else setSelectedFile(generatedFiles.find(f => f.path === node.path) || null) }
    return (
      <div>
        <div onClick={handleNodeClick} className={`flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 cursor-pointer rounded text-sm ${isSelected ? "bg-primary/10 text-primary" : ""}`} style={{ paddingLeft: `${level * 12 + 8}px` }}>
          {node.type === "folder" ? (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <div className="w-4" />}
          {node.type === "folder" ? (isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />) : <FileIcon className="h-4 w-4 text-muted-foreground" />}
          <span>{node.name}</span>
        </div>
        {isExpanded && node.children && (<div>{node.children.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(child => <FileTreeItem key={child.path} node={child} level={level + 1} />)}</div>)}
      </div>
    )
  }

  const headerUser = user ? { name: user.fullName, email: user.email, avatar: "/placeholder.svg?height=32&width=32", } : null;
  const getLanguage = (filePath: string) => {
    const extension = filePath.split('.').pop();
    switch (extension) { case 'js': case 'jsx': return 'javascript'; case 'ts': case 'tsx': return 'typescript'; case 'css': return 'css'; case 'html': return 'html'; case 'json': return 'json'; case 'md': return 'markdown'; default: return 'plaintext'; }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <ToastContainer position="bottom-right" theme="dark" />
        <Header user={headerUser} onLogout={logout} />
        <ChatWidget />
      </div>

      <main className="flex-1 min-h-0">
        {messages.length === 0 ? (
          <ScrollArea className="h-full">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12"><h1 className="text-4xl md:text-5xl font-bold mb-6">What can I help you build?</h1><div className="max-w-2xl mx-auto mb-8"><div className="relative"><Textarea placeholder="Ask to build a React component with a file structure..." value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[120px] text-lg resize-none pr-12" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} /><Button size="icon" className="absolute bottom-3 right-3" onClick={() => handleSend()} disabled={!input.trim() || isGenerating}>{isGenerating ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">{quickActions.map((action) => (<Button key={action.label} variant="outline" className="h-auto p-4 flex flex-col items-start text-left space-y-2 hover:bg-muted/50 bg-transparent" onClick={() => handleQuickAction(action.label)}><action.icon className="h-5 w-5 mb-2" /><div><div className="font-medium text-sm">{action.label}</div><div className="text-xs text-muted-foreground">{action.description}</div></div></Button>))}</div></div>
                <div className="mb-12"><h2 className="text-2xl font-bold mb-4">Starter Templates</h2><div className="grid md:grid-cols-4 gap-4">{starterTemplates.map((template) => (<Card key={template.name} className="cursor-pointer hover:shadow-lg transition-shadow"><CardContent className="p-6"><div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center text-2xl mb-4`}>{template.icon}</div><h3 className="font-semibold mb-2">{template.name}</h3><p className="text-sm text-muted-foreground">{template.description}</p></CardContent></Card>))}</div></div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col">
                <div className="border-b p-4 flex-shrink-0"><h2 className="font-semibold flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />AI Assistant</h2></div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">{messages.map((message) => (<div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-lg p-4 ${message.type === "user" ? "bg-primary text-primary-foreground" : message.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}><p className="whitespace-pre-wrap">{message.content}</p><div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div></div></div>))}{isGenerating && (<div className="flex justify-start"><div className="bg-muted text-muted-foreground rounded-lg p-4"><div className="flex items-center space-x-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div><span>Generating...</span></div></div></div>)}</div><div ref={messagesEndRef} />
                </ScrollArea>
                <div className="border-t p-4 flex-shrink-0"><div className="relative"><Textarea placeholder="Describe what to build or modify..." value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[60px] resize-none pr-12" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} /><Button size="icon" className="absolute bottom-3 right-3" onClick={() => handleSend()} disabled={!input.trim() || isGenerating}><Send className="h-4 w-4" /></Button></div></div>
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
                    </div>
                  </div>

                  <TabsContent value="code" className="flex-1 flex flex-col min-h-0">
                    <ResizablePanelGroup direction="horizontal" className="flex-1">
                      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                        <div className="h-full border-r bg-muted/20 flex flex-col">
                          <div className="p-2 border-b flex-shrink-0"><h3 className="font-semibold text-sm">File Explorer</h3></div>
                          <ScrollArea className="flex-1 p-2">
                            {fileTree.length > 0 ? (<div className="space-y-1">{fileTree.map((node) => (<FileTreeItem key={node.path} node={node} />))}</div>) : (<div className="text-center py-8 text-muted-foreground text-sm"><Folder className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Awaiting generation...</p></div>)}
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
                            options={{ minimap: { enabled: false }, wordWrap: "on", fontSize: 14, scrollBeyondLastLine: false, }}
                          />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </TabsContent>

                  <TabsContent value="preview" className="flex-1 p-0 m-0">
                    {selectedTab === 'preview' && (
                      <SandpackProvider
                        files={sandpackConfig.files}
                        template="react-ts" // important for TS support
                        customSetup={{
                          entry: sandpackConfig.entry,
                          dependencies: {
                            'react': "^18.2.0",
                            "react-dom": "^18.2.0",
                            "react-router-dom": "^6.22.3",
                            'tailwindcss': "^3.4.1"
                          }
                        }}
                      >
                        <SandpackLayout>
                          <SandpackCodeEditor />
                          <SandpackPreview />
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
  )
} 