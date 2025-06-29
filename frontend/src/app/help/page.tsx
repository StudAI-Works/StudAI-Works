"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  MessageCircle,
  Book,
  Video,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  HelpCircle,
  FileText,
  Zap,
  Code,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/dashboard-sidebar"
import { ChatWidget } from "@/components/chat-widget"

// Knowledge Base Data
const knowledgeBase = [
  {
    id: 1,
    title: "Getting Started with AI Code Generation",
    category: "Getting Started",
    content: "Learn how to use our AI-powered code generation to build applications quickly and efficiently.",
    tags: ["ai", "code generation", "tutorial", "beginner"],
    readTime: "5 min",
    popularity: 95,
  },
  {
    id: 2,
    title: "Deploying Your First Project",
    category: "Deployment",
    content: "Step-by-step guide to deploy your projects to Vercel, Netlify, or Railway with one click.",
    tags: ["deployment", "vercel", "netlify", "railway"],
    readTime: "8 min",
    popularity: 88,
  },
  {
    id: 3,
    title: "Setting Up Team Collaboration",
    category: "Collaboration",
    content: "Create organizations, invite team members, and manage permissions for collaborative development.",
    tags: ["team", "collaboration", "organization", "permissions"],
    readTime: "6 min",
    popularity: 82,
  },
  {
    id: 4,
    title: "Integrating with Databases",
    category: "Database",
    content: "Connect your projects with Supabase, Firebase, Neon, or Upstash for full-stack development.",
    tags: ["database", "supabase", "firebase", "neon", "upstash"],
    readTime: "10 min",
    popularity: 90,
  },
  {
    id: 5,
    title: "Advanced Customization Tips",
    category: "Advanced",
    content: "Pro tips for customizing generated code, optimizing performance, and best practices.",
    tags: ["advanced", "customization", "optimization", "best practices"],
    readTime: "12 min",
    popularity: 75,
  },
  {
    id: 6,
    title: "API Reference Documentation",
    category: "API",
    content: "Complete API documentation for integrating Nexus Cloud Platform with your applications.",
    tags: ["api", "documentation", "integration", "reference"],
    readTime: "15 min",
    popularity: 70,
  },
  {
    id: 7,
    title: "Troubleshooting Common Issues",
    category: "Troubleshooting",
    content: "Solutions to common problems and error messages you might encounter.",
    tags: ["troubleshooting", "errors", "debugging", "solutions"],
    readTime: "7 min",
    popularity: 85,
  },
  {
    id: 8,
    title: "Theme Customization Guide",
    category: "Customization",
    content: "Learn how to customize themes, colors, and styling in your generated applications.",
    tags: ["themes", "styling", "customization", "css", "tailwind"],
    readTime: "9 min",
    popularity: 78,
  },
]

const faqs = [
  {
    question: "How do I get started with Nexus Cloud Platform?",
    answer:
      "Getting started is easy! Simply sign up for a free account, then use our AI-powered Generate feature to describe what you want to build. Our AI will create a blueprint and generate the code for you.",
  },
  {
    question: "What programming languages and frameworks are supported?",
    answer:
      "We primarily support React, Next.js, TypeScript, and Tailwind CSS. We also integrate with popular databases like Supabase, Firebase, Neon, and Upstash for full-stack development.",
  },
  {
    question: "Can I deploy my projects directly from the platform?",
    answer:
      "Yes! We offer one-click deployment to Vercel, Netlify, and Railway. Simply click the Deploy button in the navbar and choose your preferred hosting platform.",
  },
  {
    question: "Is there a free tier available?",
    answer:
      "Yes, we offer a generous free tier that includes basic AI code generation, project creation, and community features. Premium plans unlock advanced features and higher usage limits.",
  },
  {
    question: "How does the AI code generation work?",
    answer:
      "Our AI analyzes your natural language description and generates production-ready code with proper structure, styling, and functionality. It creates blueprints first, then generates the actual code with live preview.",
  },
  {
    question: "Can I collaborate with my team?",
    answer:
      "Create an organization, invite team members, and collaborate on projects in real-time. You can assign different roles and permissions to team members.",
  },
]

const supportChannels = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Get instant help from our support team",
    availability: "24/7",
    action: "Start Chat",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us a detailed message",
    availability: "Response within 24h",
    action: "Send Email",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Talk to our experts directly",
    availability: "Mon-Fri 9AM-6PM EST",
    action: "Schedule Call",
  },
  {
    icon: Book,
    title: "Documentation",
    description: "Comprehensive guides and tutorials",
    availability: "Always available",
    action: "Browse Docs",
  },
]

const resources = [
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    count: "50+ videos",
  },
  {
    icon: FileText,
    title: "API Documentation",
    description: "Complete API reference",
    count: "Full reference",
  },
  {
    icon: Code,
    title: "Code Examples",
    description: "Ready-to-use code snippets",
    count: "100+ examples",
  },
  {
    icon: Zap,
    title: "Quick Start Guide",
    description: "Get up and running in minutes",
    count: "5 min read",
  },
]

// System Status Data
const systemStatus = {
  overall: "operational",
  lastUpdated: new Date(),
  services: [
    { name: "AI Code Generation", status: "operational", uptime: "99.9%", responseTime: "120ms" },
    { name: "Project Editor", status: "operational", uptime: "99.8%", responseTime: "85ms" },
    { name: "Deployment Services", status: "operational", uptime: "99.7%", responseTime: "200ms" },
    { name: "Database Connections", status: "operational", uptime: "99.9%", responseTime: "95ms" },
    { name: "Authentication", status: "operational", uptime: "100%", responseTime: "45ms" },
    { name: "File Storage", status: "operational", uptime: "99.8%", responseTime: "110ms" },
  ],
  incidents: [
    {
      id: 1,
      title: "Scheduled Maintenance - Database Optimization",
      status: "completed",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      description: "Routine database optimization completed successfully.",
    },
    {
      id: 2,
      title: "Minor Deployment Delays",
      status: "resolved",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: "Brief delays in deployment services have been resolved.",
    },
  ],
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    description: "",
  })

  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  // Knowledge Base Search
  const filteredKnowledge = knowledgeBase.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // FAQ Search
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const categories = ["all", ...Array.from(new Set(knowledgeBase.map((item) => item.category)))]

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Support ticket submitted:", ticketForm)
    // Reset form
    setTicketForm({
      subject: "",
      category: "general",
      priority: "medium",
      description: "",
    })
    alert("Support ticket submitted successfully! We'll get back to you soon.")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-100"
      case "degraded":
        return "text-yellow-600 bg-yellow-100"
      case "outage":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "outage":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <ChatWidget />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Help & Support</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get the help you need to make the most of Nexus Cloud Platform
              </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search for help articles, FAQs, or guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            <Tabs defaultValue="knowledge" className="space-y-8">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="support">Contact Support</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="status">System Status</TabsTrigger>
              </TabsList>

              {/* Knowledge Base Tab */}
              <TabsContent value="knowledge" className="space-y-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredKnowledge.map((article) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {article.popularity}%
                          </div>
                        </div>
                        <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {article.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{article.readTime}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredKnowledge.length === 0 && (
                  <div className="text-center py-12">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms or category filter</p>
                  </div>
                )}
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {filteredFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFaqs.length === 0 && (
                    <div className="text-center py-12">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">Try adjusting your search terms or browse all FAQs</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Support Channels */}
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                    <div className="space-y-4">
                      {supportChannels.map((channel, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <channel.icon className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{channel.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{channel.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {channel.availability}
                                  </div>
                                  <Button size="sm">{channel.action}</Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Support Ticket Form */}
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Submit a Ticket</h2>
                    <Card>
                      <CardContent className="p-6">
                        <form onSubmit={handleTicketSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              placeholder="Brief description of your issue"
                              value={ticketForm.subject}
                              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <select
                                id="category"
                                className="w-full p-2 border rounded-md"
                                value={ticketForm.category}
                                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                              >
                                <option value="general">General</option>
                                <option value="technical">Technical Issue</option>
                                <option value="billing">Billing</option>
                                <option value="feature">Feature Request</option>
                              </select>
                            </div>

                            <div>
                              <Label htmlFor="priority">Priority</Label>
                              <select
                                id="priority"
                                className="w-full p-2 border rounded-md"
                                value={ticketForm.priority}
                                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              placeholder="Please provide detailed information about your issue..."
                              rows={6}
                              value={ticketForm.description}
                              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                              required
                            />
                          </div>

                          <Button type="submit" className="w-full">
                            Submit Ticket
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Learning Resources</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {resources.map((resource, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6 text-center">
                          <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                            <resource.icon className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-2">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                          <Badge variant="secondary">{resource.count}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-6">Popular Guides</h2>
                  <div className="space-y-4">
                    {knowledgeBase
                      .sort((a, b) => b.popularity - a.popularity)
                      .slice(0, 5)
                      .map((guide, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                  <span className="font-medium">{guide.title}</span>
                                  <p className="text-sm text-muted-foreground">{guide.content}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{guide.readTime}</Badge>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {guide.popularity}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </TabsContent>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">System Status</h2>

                  {/* Overall Status */}
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        {getStatusIcon(systemStatus.overall)}
                        <div>
                          <h3 className="font-semibold text-green-700 capitalize">
                            All Systems {systemStatus.overall}
                          </h3>
                          <p className="text-sm text-muted-foreground">All services are running normally</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last updated: {systemStatus.lastUpdated.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Service Status</h3>
                    {systemStatus.services.map((service, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(service.status)}
                              <div>
                                <span className="font-medium">{service.name}</span>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                  <span>Uptime: {service.uptime}</span>
                                  <span>Response: {service.responseTime}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className={getStatusColor(service.status)}>
                              {service.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recent Incidents */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recent Incidents</h3>
                    {systemStatus.incidents.map((incident) => (
                      <Card key={incident.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{incident.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                              <div className="text-xs text-muted-foreground">
                                {incident.date.toLocaleDateString()} at {incident.date.toLocaleTimeString()}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={
                                incident.status === "resolved" || incident.status === "completed"
                                  ? "text-green-700 bg-green-100"
                                  : "text-yellow-700 bg-yellow-100"
                              }
                            >
                              {incident.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
