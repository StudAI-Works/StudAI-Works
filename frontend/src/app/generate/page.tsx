"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  Send,
  Sparkles,
  Code,
  Eye,
  Copy,
  Download,
  Share,
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
  File,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Header } from "@/components/header"
import { ChatWidget } from "@/components/chat-widget"
import Link from "next/link"
import JSZip from "jszip"
import { saveAs } from "file-saver"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  blueprint?: {
    title: string
    description: string
    features: string[]
    techStack: string[]
  }
  code?: {
    files: { name: string; content: string; language: string; path: string }[]
  }
}

interface FileNode {
  name: string
  type: "file" | "folder"
  path: string
  content?: string
  children?: FileNode[]
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
]

const starterTemplates = [
  {
    name: "Next.js",
    description: "Build full-stack React apps",
    icon: "⚡",
    color: "bg-black text-white",
  },
  {
    name: "Supabase",
    description: "Spin up Postgres with auth",
    icon: "🟢",
    color: "bg-green-600 text-white",
  },
  {
    name: "Neon",
    description: "Start with Serverless Postgres",
    icon: "🔵",
    color: "bg-blue-600 text-white",
  },
  {
    name: "Upstash",
    description: "Get started with Serverless Redis",
    icon: "🔴",
    color: "bg-red-600 text-white",
  },
]

export default function GeneratePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentCode, setCurrentCode] = useState("")
  const [selectedTab, setSelectedTab] = useState("code")
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [fileStructure, setFileStructure] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateFileStructure = (prompt: string): FileNode[] => {
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes("landing page") || lowerPrompt.includes("homepage")) {
      return [
        {
          name: "src",
          type: "folder",
          path: "src",
          children: [
            {
              name: "components",
              type: "folder",
              path: "src/components",
              children: [
                { name: "Hero.tsx", type: "file", path: "src/components/Hero.tsx" },
                { name: "Features.tsx", type: "file", path: "src/components/Features.tsx" },
                { name: "CTA.tsx", type: "file", path: "src/components/CTA.tsx" },
              ],
            },
            { name: "App.tsx", type: "file", path: "src/App.tsx" },
            { name: "index.tsx", type: "file", path: "src/index.tsx" },
          ],
        },
        {
          name: "public",
          type: "folder",
          path: "public",
          children: [
            { name: "index.html", type: "file", path: "public/index.html" },
            { name: "favicon.ico", type: "file", path: "public/favicon.ico" },
          ],
        },
        { name: "package.json", type: "file", path: "package.json" },
        { name: "tailwind.config.js", type: "file", path: "tailwind.config.js" },
        { name: "README.md", type: "file", path: "README.md" },
      ]
    } else if (lowerPrompt.includes("dashboard") || lowerPrompt.includes("admin")) {
      return [
        {
          name: "src",
          type: "folder",
          path: "src",
          children: [
            {
              name: "components",
              type: "folder",
              path: "src/components",
              children: [
                { name: "Sidebar.tsx", type: "file", path: "src/components/Sidebar.tsx" },
                { name: "Header.tsx", type: "file", path: "src/components/Header.tsx" },
                { name: "StatsCard.tsx", type: "file", path: "src/components/StatsCard.tsx" },
                { name: "Chart.tsx", type: "file", path: "src/components/Chart.tsx" },
              ],
            },
            {
              name: "pages",
              type: "folder",
              path: "src/pages",
              children: [
                { name: "Dashboard.tsx", type: "file", path: "src/pages/Dashboard.tsx" },
                { name: "Analytics.tsx", type: "file", path: "src/pages/Analytics.tsx" },
                { name: "Users.tsx", type: "file", path: "src/pages/Users.tsx" },
              ],
            },
            { name: "App.tsx", type: "file", path: "src/App.tsx" },
            { name: "index.tsx", type: "file", path: "src/index.tsx" },
          ],
        },
        { name: "package.json", type: "file", path: "package.json" },
        { name: "tailwind.config.js", type: "file", path: "tailwind.config.js" },
        { name: "README.md", type: "file", path: "README.md" },
      ]
    } else if (lowerPrompt.includes("form") || lowerPrompt.includes("signup") || lowerPrompt.includes("login")) {
      return [
        {
          name: "src",
          type: "folder",
          path: "src",
          children: [
            {
              name: "components",
              type: "folder",
              path: "src/components",
              children: [
                { name: "AuthForm.tsx", type: "file", path: "src/components/AuthForm.tsx" },
                { name: "Input.tsx", type: "file", path: "src/components/Input.tsx" },
                { name: "Button.tsx", type: "file", path: "src/components/Button.tsx" },
              ],
            },
            {
              name: "utils",
              type: "folder",
              path: "src/utils",
              children: [
                { name: "validation.ts", type: "file", path: "src/utils/validation.ts" },
                { name: "auth.ts", type: "file", path: "src/utils/auth.ts" },
              ],
            },
            { name: "App.tsx", type: "file", path: "src/App.tsx" },
            { name: "index.tsx", type: "file", path: "src/index.tsx" },
          ],
        },
        { name: "package.json", type: "file", path: "package.json" },
        { name: "README.md", type: "file", path: "README.md" },
      ]
    } else {
      return [
        {
          name: "src",
          type: "folder",
          path: "src",
          children: [
            {
              name: "components",
              type: "folder",
              path: "src/components",
              children: [
                { name: "App.tsx", type: "file", path: "src/components/App.tsx" },
                { name: "Card.tsx", type: "file", path: "src/components/Card.tsx" },
              ],
            },
            { name: "index.tsx", type: "file", path: "src/index.tsx" },
          ],
        },
        { name: "package.json", type: "file", path: "package.json" },
        { name: "README.md", type: "file", path: "README.md" },
      ]
    }
  }

  const handleSend = async (prompt?: string) => {
    const messageContent = prompt || input
    if (!messageContent.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsGenerating(true)

    // Generate file structure
    const structure = generateFileStructure(messageContent)
    setFileStructure(structure)
    setExpandedFolders(new Set(["src", "src/components"]))

    // Simulate AI response with better code generation
    setTimeout(() => {
      let generatedCode = ""
      let blueprintTitle = ""
      let blueprintDescription = ""
      let features: string[] = []
      const techStack = ["React", "TypeScript", "Tailwind CSS", "Next.js"]

      // Generate different code based on the prompt
      const lowerPrompt = messageContent.toLowerCase()

      if (lowerPrompt.includes("landing page") || lowerPrompt.includes("homepage")) {
        blueprintTitle = "Modern Landing Page"
        blueprintDescription = "A responsive landing page with hero section, features, and call-to-action"
        features = ["Hero section with CTA", "Features showcase", "Testimonials", "Contact form", "Responsive design"]
        generatedCode = `import React from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Star, ArrowRight, Check } from 'lucide-react'

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Build Amazing Products Faster
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            The ultimate platform for developers to create, deploy, and scale applications with ease.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Fast Development", description: "Build 10x faster with our AI-powered tools" },
              { title: "Easy Deployment", description: "Deploy with one click to any platform" },
              { title: "Scalable Infrastructure", description: "Scale from zero to millions of users" }
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-500 mr-2" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of developers building the future</p>
          <Button size="lg">Start Building Today</Button>
        </div>
      </section>
    </div>
  )
}

export default LandingPage`
      } else if (lowerPrompt.includes("dashboard") || lowerPrompt.includes("admin")) {
        blueprintTitle = "Admin Dashboard"
        blueprintDescription = "A comprehensive admin dashboard with charts, tables, and analytics"
        features = ["Analytics overview", "Data tables", "Charts and graphs", "User management", "Settings panel"]
        generatedCode = `import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { BarChart3, Users, DollarSign, Activity, TrendingUp } from 'lucide-react'

function Dashboard() {
  const stats = [
    { title: "Total Revenue", value: "$45,231.89", change: "+20.1%", icon: DollarSign },
    { title: "Active Users", value: "2,350", change: "+180.1%", icon: Users },
    { title: "Sales", value: "12,234", change: "+19%", icon: BarChart3 },
    { title: "Active Now", value: "573", change: "+201", icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Chart Component Here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "New user registered",
                  "Payment received",
                  "Order completed",
                  "Support ticket created"
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{activity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard`
      } else if (lowerPrompt.includes("form") || lowerPrompt.includes("signup") || lowerPrompt.includes("login")) {
        blueprintTitle = "Authentication Form"
        blueprintDescription = "A modern signup/login form with validation and social auth options"
        features = [
          "Email/password authentication",
          "Social login options",
          "Form validation",
          "Responsive design",
          "Password strength indicator",
        ]
        generatedCode = `import React, { useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-600 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthForm`
      } else {
        // Default generic component
        blueprintTitle = `${messageContent} Application`
        blueprintDescription = `A modern, responsive application for ${messageContent.toLowerCase()}`
        features = [
          "Responsive design",
          "Modern UI components",
          "Interactive features",
          "Optimized performance",
          "Accessible design",
        ]
        generatedCode = `import React, { useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Sparkles, Heart, Star } from 'lucide-react'

function ${messageContent.replace(/\s+/g, "")}App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900">
              ${messageContent}
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Built with Nexus Cloud Platform - Your AI Code Companion
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                Interactive Counter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-4">{count}</div>
                <Button onClick={() => setCount(count + 1)} className="w-full">
                  Click me! ({count} clicks)
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                Feature 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Amazing functionality that enhances user experience.
              </p>
              <Button variant="outline" className="w-full bg-transparent">Explore</Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Feature 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Powerful tools to boost productivity and efficiency.
              </p>
              <Button variant="outline" className="w-full bg-transparent">Learn More</Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <Card className="inline-block p-6">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Ready to customize?</h3>
              <p className="text-gray-600 mb-4">Tell me what you'd like to change or add!</p>
              <Button>Continue Building</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ${messageContent.replace(/\s+/g, "")}App`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Perfect! I've created a ${blueprintTitle.toLowerCase()} for you. Here's what I've built:`,
        timestamp: new Date(),
        blueprint: {
          title: blueprintTitle,
          description: blueprintDescription,
          features: features,
          techStack: techStack,
        },
        code: {
          files: [
            {
              name: "App.tsx",
              language: "tsx",
              content: generatedCode,
              path: "src/App.tsx",
            },
          ],
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
      setCurrentCode(assistantMessage.code?.files[0]?.content || "")
      setSelectedFile("src/App.tsx")
      setIsGenerating(false)
    }, 2000)
  }

  const handleQuickAction = (action: string) => {
    handleSend(`Create a ${action}`)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode)
  }

  const downloadZip = async () => {
    if (!fileStructure.length) return
    const zip = new JSZip()

    // Helper to recursively add files/folders
    const addToZip = (node: any, folder: any) => {
      if (node.type === "folder" && node.children) {
        const subFolder = folder.folder(node.name)
        node.children.forEach((child: any) => addToZip(child, subFolder))
      } else if (node.type === "file") {
        folder.file(node.name, node.content || "// No content available")
      }
    }

    // Add all top-level nodes
    fileStructure.forEach(node => addToZip(node, zip))

    // Use the blueprint/project name if available, otherwise 'project'
    let projectName = "project"
    const lastAssistantMsg = [...messages].reverse().find(m => m.type === "assistant" && m.blueprint?.title)
    if (lastAssistantMsg && lastAssistantMsg.blueprint?.title) {
      projectName = lastAssistantMsg.blueprint.title.replace(/\s+/g, "-").toLowerCase()
    }

    const blob = await zip.generateAsync({ type: "blob" })
    saveAs(blob, `${projectName}.zip`)
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const FileTreeItem = ({ node, level = 0 }: { node: FileNode; level?: number }) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile === node.path

    return (
      <div>
        <div
          className={`flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 cursor-pointer rounded text-sm ${
            isSelected ? "bg-primary/10 text-primary" : ""
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.path)
            } else {
              setSelectedFile(node.path)
              // In a real app, you'd load the file content here
              if (node.path === "src/App.tsx") {
                setCurrentCode(currentCode)
              }
            }
          }}
        >
          {node.type === "folder" ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span>{node.name}</span>
        </div>
        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map((child, index) => (
              <FileTreeItem key={index} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const openPreviewInNewTab = () => {
    // TODO: Implement logic to open preview in a new tab
  }

  const copyPreviewUrl = () => {
    // TODO: Implement logic to copy preview URL
  }

  // Enhance extractStaticHtml to handle the specific features .map() pattern
  const extractStaticHtml = (code: string): string | null => {
    // Try to find the return ( ... ) block in the main function
    const match = code.match(/return \(([^]*)\)/)
    if (match && match[1]) {
      let html = match[1]
        .replace(/\{\s*\/\*[^]*?\*\/\s*\}/g, "") // Remove {/* ... */} comments
        .replace(/export default [^;]+;/g, "")
        .replace(/className=/g, "class=") // Convert className to class for HTML
        .replace(/<([A-Z][A-Za-z0-9]*)[^>]*>(.*?)<\/[A-Z][A-Za-z0-9]*>/gs, "") // Remove custom components
        .replace(/<([A-Z][A-Za-z0-9]*)[^>]*/g, "") // Remove opening custom component tags
        .replace(/<\/[A-Z][A-Za-z0-9]*>/g, "") // Remove closing custom component tags

      // Special handling for the features .map() pattern
      if (html.includes('Fast Development') && html.includes('Easy Deployment') && html.includes('Scalable Infrastructure')) {
        const featuresHtml = `
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div>
                <div class="flex items-center justify-center">
                  <svg class="h-6 w-6 text-green-500 mr-2"></svg>
                  Fast Development
                </div>
              </div>
              <div>
                <p class="text-gray-600">Build 10x faster with our AI-powered tools</p>
              </div>
            </div>
            <div class="text-center">
              <div>
                <div class="flex items-center justify-center">
                  <svg class="h-6 w-6 text-green-500 mr-2"></svg>
                  Easy Deployment
                </div>
              </div>
              <div>
                <p class="text-gray-600">Deploy with one click to any platform</p>
              </div>
            </div>
            <div class="text-center">
              <div>
                <div class="flex items-center justify-center">
                  <svg class="h-6 w-6 text-green-500 mr-2"></svg>
                  Scalable Infrastructure
                </div>
              </div>
              <div>
                <p class="text-gray-600">Scale from zero to millions of users</p>
              </div>
            </div>
          </div>
        `
        html = html.replace(/\{\[[\s\S]*?\][\s\S]*?map\([^\)]*?\)\}/g, featuresHtml)
      }
      return html.trim()
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <ChatWidget />

      {messages.length === 0 ? (
        // Initial State - Similar to v0.dev
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Main Prompt Area */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm mb-6">
                <Sparkles className="h-4 w-4" />
                <span>New: Edit faster with Design Mode</span>
                <Link href="#" className="underline">
                  Try it now →
                </Link>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6">What can I help you build?</h1>

              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Textarea
                    placeholder="Ask Nexus to build..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[120px] text-lg resize-none pr-12"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-3 right-3"
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="mr-2">
                    Nc.15-md
                  </Badge>
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted/50 bg-transparent"
                    onClick={() => handleQuickAction(action.label)}
                  >
                    <action.icon className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Starter Templates */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Starter Templates</h2>
              <p className="text-muted-foreground mb-6">
                Get started instantly with a framework or integration of your choice.
              </p>

              <div className="grid md:grid-cols-4 gap-4">
                {starterTemplates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div
                        className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center text-2xl mb-4`}
                      >
                        {template.icon}
                      </div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Community Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">From the Community</h2>
                  <p className="text-muted-foreground">Explore what the community is building with Nexus.</p>
                </div>
                <Link href="#" className="text-primary hover:underline">
                  Browse All →
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "AI Assistant UI",
                    description: "Modern chat interface with AI capabilities",
                    image: "/placeholder.svg?height=200&width=300",
                  },
                  {
                    title: "E-commerce Dashboard",
                    description: "Complete admin panel for online stores",
                    image: "/placeholder.svg?height=200&width=300",
                  },
                  {
                    title: "Portfolio Website",
                    description: "Clean and professional portfolio design",
                    image: "/placeholder.svg?height=200&width=300",
                  },
                ].map((project, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Chat Interface with Code Preview
        <div className="h-[calc(100vh-4rem)]">
          <ResizablePanelGroup direction="horizontal">
            {/* Chat Panel (AI Assistant) */}
            <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
              <div className="h-full flex flex-col">
                <div className="border-b p-4">
                  <h2 className="font-semibold flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    AI Assistant
                  </h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.blueprint && (
                            <div className="mt-4 p-4 bg-background/10 rounded-lg">
                              <h4 className="font-semibold mb-2">📋 Blueprint</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <strong>Title:</strong> {message.blueprint.title}
                                </div>
                                <div>
                                  <strong>Description:</strong> {message.blueprint.description}
                                </div>
                                <div>
                                  <strong>Features:</strong>
                                  <ul className="list-disc list-inside ml-2 mt-1">
                                    {message.blueprint.features.map((feature, idx) => (
                                      <li key={idx}>{feature}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <strong>Tech Stack:</strong> {message.blueprint.techStack.join(", ")}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-muted-foreground rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Generating your project...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Describe what you want to build or modify..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                    />
                    <Button onClick={() => handleSend()} disabled={!input.trim() || isGenerating}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            {/* Code/Preview Section (right) */}
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Tabs wrapper START */}
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
                  {/* Header with tab triggers + actions */}
                  <div className="border-b p-4 flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="code" className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>Code</span>
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center space-x-2">
                      {selectedTab === "code" && (
                        <>
                          <Button variant="outline" size="sm" onClick={copyCode}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={downloadZip}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Zip
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </>
                      )}
                      {selectedTab === "preview" && (
                        <>
                          <Button variant="outline" size="icon" onClick={openPreviewInNewTab} title="Open in new tab">
                            <Globe className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={copyPreviewUrl} title="Copy preview URL">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ---- Tab content area ---- */}
                  <div className="flex-1">
                    <TabsContent value="code" className="h-full m-0">
                      {/* File Explorer and Code Editor side by side, resizable */}
                      <ResizablePanelGroup direction="horizontal">
                        {/* File Explorer (left, resizable) */}
                        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                          <div className="h-full border-r bg-muted/20 flex-shrink-0 flex flex-col">
                            <div className="p-2 border-b">
                              <h3 className="font-semibold text-sm mb-2">File Explorer</h3>
                            </div>
                            <ScrollArea className="h-full p-2">
                              {fileStructure.length > 0 ? (
                                <div className="space-y-1">
                                  {fileStructure.map((node, index) => (
                                    <FileTreeItem key={index} node={node} />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>File structure will appear here after code generation</p>
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        {/* Code Editor (right, resizable) */}
                        <ResizablePanel defaultSize={75} minSize={30}>
                          <ScrollArea className="h-full w-full">
                            <div className="p-4">
                              {selectedFile && (
                                <div className="mb-2 text-sm text-muted-foreground border-b pb-2">{selectedFile}</div>
                              )}
                              <div className="bg-muted/30 p-4 rounded-lg overflow-auto" style={{ minHeight: '400px', maxHeight: '70vh', width: '100%', minWidth: '100%' }}>
                                <pre className="text-sm font-mono whitespace-pre min-w-fit overflow-x-auto" style={{ minWidth: '600px' }}>
                                  <code>{currentCode || "// Generated code will appear here..."}</code>
                                </pre>
                              </div>
                            </div>
                          </ScrollArea>
                        </ResizablePanel>
                      </ResizablePanelGroup>
                    </TabsContent>

                    <TabsContent value="preview" className="h-full m-0">
                      <div className="h-full bg-white dark:bg-gray-900 p-0 relative flex items-center justify-center overflow-x-auto overflow-y-auto max-h-full max-w-full">
                        <div className="p-8">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-10 text-center mb-8 min-w-[600px]">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Your Project Preview</h1>
                            <p className="text-lg md:text-xl mb-6">This is a static preview of your frontend project. The actual code and interactivity will be available in your code editor and when you deploy your project.</p>
                            <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full shadow hover:bg-gray-100 transition">Get Started</button>
                          </div>
                          <div className="grid md:grid-cols-3 gap-8 min-w-[900px]">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                              <div className="flex items-center justify-center mb-4">
                                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 4h1a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v7a2 2 0 002 2h1" /></svg>
                              </div>
                              <h2 className="font-semibold text-lg mb-2">Modern UI</h2>
                              <p className="text-gray-600 dark:text-gray-300">Beautiful, responsive layouts for any device.</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                              <div className="flex items-center justify-center mb-4">
                                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <h2 className="font-semibold text-lg mb-2">Fast Development</h2>
                              <p className="text-gray-600 dark:text-gray-300">Build and iterate quickly with reusable components.</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                              <div className="flex items-center justify-center mb-4">
                                <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                              </div>
                              <h2 className="font-semibold text-lg mb-2">Ready to Deploy</h2>
                              <p className="text-gray-600 dark:text-gray-300">Easily launch your project to production.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
                {/* Tabs wrapper END */}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  )
}
