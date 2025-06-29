"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  Play,
  Square,
  Share,
  Save,
  Settings,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Terminal,
  Package,
  Code,
  Eye,
} from "lucide-react"
import { Header } from "@/components/header"

const mockFiles = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "Header.tsx", type: "file" },
          { name: "Sidebar.tsx", type: "file" },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          { name: "index.tsx", type: "file" },
          { name: "about.tsx", type: "file" },
        ],
      },
      { name: "App.tsx", type: "file" },
      { name: "main.tsx", type: "file" },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.ico", type: "file" },
      { name: "logo.svg", type: "file" },
    ],
  },
  { name: "package.json", type: "file" },
  { name: "README.md", type: "file" },
]

const mockCode = `import React from 'react'
import { Button } from './components/ui/button'

function App() {
  const [count, setCount] = React.useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Nexus</h1>
        <p className="text-muted-foreground">
          You clicked {count} times
        </p>
        <Button onClick={() => setCount(count + 1)}>
          Click me
        </Button>
      </div>
    </div>
  )
}

export default App`

export default function EditorPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [projectName, setProjectName] = useState("My Awesome Project")
  const [saveStatus, setSaveStatus] = useState("saved")

  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  const handleRun = () => {
    setIsRunning(!isRunning)
  }

  const handleSave = () => {
    setSaveStatus("saving")
    setTimeout(() => setSaveStatus("saved"), 1000)
  }

  const FileTreeItem = ({ item, level = 0 }: { item: any; level?: number }) => {
    const [isOpen, setIsOpen] = useState(level === 0)

    return (
      <div>
        <div
          className="flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 cursor-pointer rounded text-sm"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => item.type === "folder" && setIsOpen(!isOpen)}
        >
          {item.type === "folder" ? (
            isOpen ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{item.name}</span>
        </div>
        {item.type === "folder" && isOpen && item.children && (
          <div>
            {item.children.map((child: any, index: number) => (
              <FileTreeItem key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      {/* Top Bar */}
      <div className="border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-semibold bg-transparent border-none shadow-none text-lg p-0 h-auto focus-visible:ring-0"
            />
            <Badge variant={saveStatus === "saved" ? "secondary" : "outline"}>
              {saveStatus === "saving" ? "Saving..." : "Saved"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant={isRunning ? "destructive" : "default"} size="sm" onClick={handleRun}>
              {isRunning ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r bg-muted/20">
              <Tabs defaultValue="files" className="h-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                  <TabsTrigger value="files" className="text-xs">
                    <FileText className="mr-1 h-3 w-3" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="packages" className="text-xs">
                    <Package className="mr-1 h-3 w-3" />
                    Packages
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="files" className="p-2 h-full">
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                      <Plus className="mr-2 h-3 w-3" />
                      New File
                    </Button>
                    <Separator />
                    {mockFiles.map((file, index) => (
                      <FileTreeItem key={index} item={file} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="packages" className="p-2">
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">Dependencies</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>react: ^18.2.0</div>
                      <div>react-dom: ^18.2.0</div>
                      <div>typescript: ^5.0.0</div>
                      <div>tailwindcss: ^3.3.0</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Code Editor */}
          <ResizablePanel defaultSize={50}>
            <div className="h-full">
              <Tabs defaultValue="code" className="h-full">
                <TabsList className="rounded-none border-b w-full justify-start">
                  <TabsTrigger value="code" className="text-xs">
                    <Code className="mr-1 h-3 w-3" />
                    App.tsx
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs">
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="p-0 h-full">
                  <div className="h-full bg-muted/10 p-4 font-mono text-sm overflow-auto">
                    <pre className="whitespace-pre-wrap">{mockCode}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="p-0 h-full">
                  <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome to Nexus</h1>
                      <p className="text-gray-600 dark:text-gray-400">You clicked 0 times</p>
                      <Button>Click me</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Console/Output */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full border-l">
              <Tabs defaultValue="console" className="h-full">
                <TabsList className="rounded-none border-b w-full justify-start">
                  <TabsTrigger value="console" className="text-xs">
                    <Terminal className="mr-1 h-3 w-3" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger value="output" className="text-xs">
                    Output
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="console" className="p-4 h-full">
                  <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-full overflow-auto">
                    <div>$ npm run dev</div>
                    <div className="text-blue-400">
                      {isRunning ? (
                        <>
                          <div>✓ Local: http://localhost:3000</div>
                          <div>✓ Ready in 1.2s</div>
                          <div className="text-green-400">Server running...</div>
                        </>
                      ) : (
                        <div className="text-gray-500">Press Run to start development server</div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="output" className="p-4 h-full">
                  <div className="text-sm text-muted-foreground">Build output will appear here...</div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
