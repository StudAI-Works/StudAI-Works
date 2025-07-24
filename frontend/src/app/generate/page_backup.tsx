"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
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
import { Navigate } from "react-router-dom"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useAuth } from "../context/authContext";
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import Editor from "@monaco-editor/react";
import React from "react";

// Interfaces
interface Message {
  id: string;
  type: "user" | "assistant" | "error";
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

  // Simplified sandpack config with minimal dependencies
  const sandpackConfig = useMemo(() => {
    if (generatedFiles.length === 0) {
      return null;
    }

    // Find the main component file
    const mainFile = generatedFiles.find(f => 
      f.path.toLowerCase().includes('app.tsx') ||
      f.path.toLowerCase().includes('app.jsx') ||
      f.path.toLowerCase().includes('index.tsx') ||
      f.path.toLowerCase().includes('index.jsx')
    ) || generatedFiles[0];

    const importPath = mainFile ? `./${mainFile.path.replace(/^\/+/, '')}` : './App';

    const files: SandpackFiles = {
      '/public/index.html': {
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
        hidden: true,
      },
      '/src/index.tsx': {
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '${importPath}';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);`,
        hidden: true,
      },
      '/src/styles.css': {
        code: `/* Basic styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`,
        hidden: true,
      },
      '/package.json': {
        code: JSON.stringify({
          name: "generated-app",
          version: "1.0.0",
          private: true,
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
            'react-scripts': '5.0.1'
          },
          scripts: {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
          },
          main: "/src/index.tsx"
        }, null, 2),
        hidden: true,
      }
    };

    // Add generated files
    generatedFiles.forEach(file => {
      const cleanPath = `/src/${file.path.replace(/^\/+/, '')}`;
      files[cleanPath] = { 
        code: file.content.replace(/import\.meta\.env\.VITE_/g, 'process.env.REACT_APP_')
      };
    });

    return {
      files,
      template: "react-ts" as const,
      theme: theme === 'dark' ? 'dark' : 'light',
      options: {
        showNavigator: false,
        showTabs: false,
        showLineNumbers: true,
        showInlineErrors: true,
        wrapContent: true,
        editorHeight: 350,
        editorWidthPercentage: 60,
        autorun: true,
        autoReload: true,
        recompileMode: "immediate",
        recompileDelay: 500
      }
    };
  }, [generatedFiles, theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  function parseAIResponse(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const regex = /```(\w+)?\s*(?:\/\/\s*)?(.+?)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      const [, , pathComment, content] = match;
      let filePath = pathComment || 'App.tsx';
      
      // Clean up file path
      filePath = filePath.replace(/^(File:|Path:|\s)+/i, '').trim();
      if (!filePath.includes('.')) {
        filePath += '.tsx';
      }

      files.push({
        path: filePath,
        content: content.trim()
      });
    }

    return files;
  }

  const buildFileTree = (files: GeneratedFile[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const folders = new Map<string, FileTreeNode>();

    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (isFile) {
          const folderPath = parts.slice(0, -1).join('/');
          const parent = folderPath ? folders.get(folderPath) : null;
          const fileNode: FileTreeNode = {
            name: part,
            path: file.path,
            type: 'file'
          };

          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(fileNode);
          } else {
            tree.push(fileNode);
          }
        } else {
          if (!folders.has(currentPath)) {
            const folderNode: FileTreeNode = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: []
            };

            const parentPath = parts.slice(0, index).join('/');
            const parent = parentPath ? folders.get(parentPath) : null;

            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(folderNode);
            } else {
              tree.push(folderNode);
            }

            folders.set(currentPath, folderNode);
          }
        }
      });
    });

    return tree;
  };

  const handleSend = async (prompt?: string) => {
    const messageContent = prompt || input.trim();
    if (!messageContent || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const response = await axios.post(`http://localhost:8080/generate`, {
        prompt: messageContent,
        userId: user.id
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Parse and set generated files
      const files = parseAIResponse(response.data.response);
      if (files.length > 0) {
        setGeneratedFiles(files);
        setFileTree(buildFileTree(files));
        setSelectedFile(files[0]);
        setSelectedTab("preview");
      }

    } catch (error) {
      console.error('Error generating code:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: "Sorry, there was an error generating your code. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header user={user} onLogout={logout} />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Chat with AI</h2>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.type === "error"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Generating...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what you want to build..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button 
                    onClick={() => handleSend()} 
                    disabled={isGenerating || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <TabsList>
                    <TabsTrigger value="code">
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  
                  {generatedFiles.length > 0 && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(generatedFiles, null, 2));
                        toast.success("Code copied to clipboard!");
                      }}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        const zip = new JSZip();
                        generatedFiles.forEach(file => {
                          zip.file(file.path, file.content);
                        });
                        const content = await zip.generateAsync({ type: "blob" });
                        saveAs(content, "generated-project.zip");
                      }}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                <TabsContent value="code" className="flex-1 m-0">
                  {generatedFiles.length > 0 ? (
                    <ResizablePanelGroup direction="horizontal" className="h-full">
                      <ResizablePanel defaultSize={25} minSize={20}>
                        <div className="h-full border-r">
                          <div className="p-3 border-b bg-muted/50">
                            <h3 className="text-sm font-medium">Files</h3>
                          </div>
                          <ScrollArea className="h-[calc(100%-40px)]">
                            <div className="p-2">
                              {fileTree.map((node) => (
                                <FileTreeItem key={node.path} node={node} />
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </ResizablePanel>
                      
                      <ResizableHandle />
                      
                      <ResizablePanel defaultSize={75}>
                        <div className="h-full">
                          {selectedFile && (
                            <Editor
                              height="100%"
                              language={getLanguage(selectedFile.path)}
                              value={selectedFile.content}
                              onChange={(value) => {
                                if (value !== undefined) {
                                  setGeneratedFiles(prev =>
                                    prev.map(file =>
                                      file.path === selectedFile.path
                                        ? { ...file, content: value }
                                        : file
                                    )
                                  );
                                  setSelectedFile({ ...selectedFile, content: value });
                                }
                              }}
                              theme={theme === 'dark' ? 'vs-dark' : 'light'}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                              }}
                            />
                          )}
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No code generated yet</p>
                        <p className="text-sm">Start a conversation to generate code</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="flex-1 m-0">
                  {sandpackConfig ? (
                    <SandpackProvider
                      template={sandpackConfig.template}
                      files={sandpackConfig.files}
                      theme={sandpackConfig.theme}
                      options={sandpackConfig.options}
                    >
                      <SandpackLayout>
                        <SandpackPreview 
                          style={{ height: "100%" }}
                          showOpenInCodeSandbox={true}
                          showRefreshButton={true}
                        />
                      </SandpackLayout>
                    </SandpackProvider>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No preview available</p>
                        <p className="text-sm">Generate some code to see the preview</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );

  function FileTreeItem({ node, level = 0 }: { node: FileTreeNode; level?: number }) {
    const isExpanded = expandedFolders.has(node.path);
    
    return (
      <div>
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-muted/50 ${
            selectedFile?.path === node.path ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              const newExpanded = new Set(expandedFolders);
              if (isExpanded) {
                newExpanded.delete(node.path);
              } else {
                newExpanded.add(node.path);
              }
              setExpandedFolders(newExpanded);
            } else {
              const file = generatedFiles.find(f => f.path === node.path);
              if (file) setSelectedFile(file);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 mr-2 text-blue-500" />
              )}
            </>
          ) : (
            <FileIcon className="h-4 w-4 mr-2 ml-5 text-gray-500" />
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  function getLanguage(filePath: string) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
        return 'typescript';
      case 'jsx':
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'javascript';
    }
  }
}
