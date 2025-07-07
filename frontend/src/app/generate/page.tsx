"use client"

import { useState, useRef, useEffect } from "react"
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
import {
  Send,
  Sparkles,
  Code,
  Eye,
  Copy,
  Download,
  ImageIcon,
  FileText,
  Calculator,
  User,
  Layout,
  Database,
  Globe,
  Smartphone,
  Folder,
  FolderOpen,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Header } from "@/components/header"
import { ChatWidget } from "@/components/chat-widget"
import { Link } from "react-router-dom"
import JSZip from "jszip"
import { saveAs } from "file-saver"
// --- IMPORT THE useAuth HOOK ---
import { useAuth } from "../context/authContext";

interface Message {
  id: string
  type: "user" | "assistant" | "error"
  content: string
  timestamp: Date
}
interface GeneratedFile {
  path: string
  content: string
}
interface FileTreeNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
}


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

  // --- GET THE REAL USER FROM THE CONTEXT ---
  const { user , logout } = useAuth();
  if (!user) {
  return <Navigate to="/auth" replace />;
}
  
  const BASE_URL = "http://localhost:8080"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const parseAIResponse = (response: string): GeneratedFile[] => {
    const files: GeneratedFile[] = []
    const regex = /```(?:\w*\n)?(?:\/\/|#) path: (.*?)\n([\s\S]*?)```/g
    let match
    while ((match = regex.exec(response)) !== null) {
      files.push({ path: match[1].trim(), content: match[2].trim() })
    }
    return files
  }

  const buildFileTree = (files: GeneratedFile[]): FileTreeNode[] => {
    const root: FileTreeNode = { name: 'root', path: '', type: 'folder', children: [] }
    files.forEach(file => {
      let currentLevel = root
      file.path.split('/').forEach((part, index, arr) => {
        if (!currentLevel.children) return
        const isLast = index === arr.length - 1
        let existing = currentLevel.children.find(c => c.name === part)
        if (existing) {
          currentLevel = existing
        } else {
          const newNode: FileTreeNode = { name: part, path: arr.slice(0, index + 1).join('/'), type: isLast ? 'file' : 'folder', children: isLast ? undefined : [] }
          currentLevel.children.push(newNode)
          currentLevel = newNode
        }
      })
    })
    return root.children || []
  }

  const handleSend = async (prompt?: string) => {
    const messageContent = prompt || input
    if (messageContent.trim().length < 10) return toast.error("Prompt must be at least 10 characters long")
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: messageContent, timestamp: new Date() }])
    setInput("")
    setIsGenerating(true)
    setGeneratedFiles([])
    setFileTree([])
    setSelectedFile(null)
    const loadingToastId = toast.loading("Generating your project...")
    try {
      const res = await axios.post(`${BASE_URL}/userpromt`, { Promt: messageContent })
      if (res.status === 200 && res.data.generatedCode) {
        const rawCode = res.data.generatedCode
        const files = parseAIResponse(rawCode)
        if (files.length === 0) {
          toast.warn("Could not parse file structure.")
          const rawFile = { path: "raw_output.md", content: rawCode }
          setGeneratedFiles([rawFile])
          setFileTree([{ name: "raw_output.md", path: "raw_output.md", type: 'file' }])
          setSelectedFile(rawFile)
          setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: "Generated a response, but couldn't parse it.", timestamp: new Date() }])
        } else {
          setGeneratedFiles(files)
          const tree = buildFileTree(files)
          setFileTree(tree)
          setSelectedFile(files[0])
          const rootFolders = new Set(tree.filter(n => n.type === 'folder').map(n => n.path))
          setExpandedFolders(rootFolders)
          setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: "I've built the project for you.", timestamp: new Date() }])
        }
        toast.update(loadingToastId, { render: "Success!", type: "success", isLoading: false, autoClose: 2000 })
      } else { throw new Error("Invalid response from server") }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred."
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'error', content: `Error: ${errorMessage}`, timestamp: new Date() }])
      toast.update(loadingToastId, { render: `Error: ${errorMessage}`, type: "error", isLoading: false, autoClose: 4000 })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleQuickAction = (action: string) => { handleSend(`Create a ${action}`) }
  const copyCode = () => { if (selectedFile) navigator.clipboard.writeText(selectedFile.content).then(() => toast.success("Copied!")) }
  const downloadZip = async () => { if (generatedFiles.length === 0) return; const zip = new JSZip(); generatedFiles.forEach(f => zip.file(f.path, f.content)); const blob = await zip.generateAsync({type:'blob'}); saveAs(blob, "studai-project.zip") }
  const toggleFolder = (path: string) => { setExpandedFolders(prev => { const next = new Set(prev); if (next.has(path)) next.delete(path); else next.add(path); return next }) }
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
        {isExpanded && node.children && (<div>{node.children.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(child => <FileTreeItem key={child.path} node={child} level={level+1} />)}</div>)}
      </div>
    )
  }

  // Pass the real user to the Header
  const headerUser = user ? {
    name: user.fullName,
    email: user.email,
    avatar: "/placeholder.svg?height=32&width=32",
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer position="bottom-right" theme="dark" />
      <Header user={headerUser} onLogout={logout} />
      <ChatWidget />
      {messages.length === 0 ? (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">What can I help you build?</h1>
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Textarea placeholder="Ask to build a React component with a file structure..." value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[120px] text-lg resize-none pr-12" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                  <Button size="icon" className="absolute bottom-3 right-3" onClick={() => handleSend()} disabled={!input.trim() || isGenerating}>{isGenerating ? <Sparkles className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                {quickActions.map((action) => (
                  <Button key={action.label} variant="outline" className="h-auto p-4 flex flex-col items-start text-left space-y-2 hover:bg-muted/50 bg-transparent" onClick={() => handleQuickAction(action.label)}>
                    <action.icon className="h-5 w-5 mb-2" /><div><div className="font-medium text-sm">{action.label}</div><div className="text-xs text-muted-foreground">{action.description}</div></div>
                  </Button>
                ))}
              </div>
            </div>
            {/* THIS JSX SECTION IS NOW RESTORED */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Starter Templates</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {starterTemplates.map((template) => (
                  <Card key={template.name} className="cursor-pointer hover:shadow-lg transition-shadow"><CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center text-2xl mb-4`}>{template.icon}</div>
                      <h3 className="font-semibold mb-2">{template.name}</h3><p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100vh-4rem)]">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col">
                <div className="border-b p-4"><h2 className="font-semibold flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />AI Assistant</h2></div>
                <ScrollArea className="flex-1 p-4"><div className="space-y-6">{messages.map((message) => (<div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-lg p-4 ${ message.type === "user" ? "bg-primary text-primary-foreground" : message.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground" }`}><p className="whitespace-pre-wrap">{message.content}</p><div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div></div></div>))}{isGenerating && ( <div className="flex justify-start"><div className="bg-muted text-muted-foreground rounded-lg p-4"><div className="flex items-center space-x-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div><span>Generating...</span></div></div></div> )}</div><div ref={messagesEndRef} /></ScrollArea>
                <div className="border-t p-4"><div className="relative"><Textarea placeholder="Describe what to build or modify..." value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[60px] resize-none pr-12" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} /><Button size="icon" className="absolute bottom-3 right-3" onClick={() => handleSend()} disabled={!input.trim() || isGenerating}><Send className="h-4 w-4" /></Button></div></div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full flex flex-col">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-1 flex-col">
                  <div className="border-b p-2 flex items-center justify-between">
                    <TabsList><TabsTrigger value="code"><Code className="h-4 w-4 mr-2" />Code</TabsTrigger><TabsTrigger value="preview"><Eye className="h-4 w-4 mr-2" />Preview</TabsTrigger></TabsList>
                    <div className="flex items-center space-x-2"><Button variant="outline" size="sm" onClick={copyCode} disabled={!selectedFile}><Copy className="h-4 w-4 mr-2" />Copy</Button><Button variant="outline" size="sm" onClick={downloadZip} disabled={generatedFiles.length === 0}><Download className="h-4 w-4 mr-2" />Download ZIP</Button></div>
                  </div>
                  <TabsContent value="code" className="flex-1 flex m-0">
                    <ResizablePanelGroup direction="horizontal" className="h-full">
                      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}><div className="h-full border-r bg-muted/20 flex flex-col"><div className="p-2 border-b"><h3 className="font-semibold text-sm">File Explorer</h3></div><ScrollArea className="flex-1 p-2">{fileTree.length > 0 ? (<div className="space-y-1">{fileTree.map((node) => (<FileTreeItem key={node.path} node={node} />))}</div>) : (<div className="text-center py-8 text-muted-foreground text-sm"><Folder className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Awaiting generation...</p></div>)}</ScrollArea></div></ResizablePanel>
                      <ResizableHandle />
                      <ResizablePanel defaultSize={75}>
                        <div className="h-full flex flex-col">
                          <div className="p-2 border-b flex-shrink-0"><h3 className="font-semibold text-sm text-muted-foreground">{selectedFile?.path || "Select a file"}</h3></div>
                          <div className="flex-1 min-h-0 overflow-auto"><pre className="text-sm font-mono p-4 whitespace-pre"><code>{selectedFile?.content || "// Your code will appear here..."}</code></pre></div>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </TabsContent>
                  <TabsContent value="preview" className="flex-1 m-0"><div className="p-8">Preview will be implemented here.</div></TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  )
}