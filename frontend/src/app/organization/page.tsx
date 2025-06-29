"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Users, Mail, MoreHorizontal, Crown, Edit, MessageSquare, Send } from "lucide-react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/dashboard-sidebar"

const mockOrganization = {
  name: "STUDAI EDUTECH",
  description: "Building the future of education technology",
  members: [
    {
      id: 1,
      name: "John Doe",
      email: "john@studai.com",
      role: "Owner",
      avatar: "/placeholder.svg?height=40&width=40",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah@studai.com",
      role: "Editor",
      avatar: "/placeholder.svg?height=40&width=40",
      lastActive: "1 day ago",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@studai.com",
      role: "Viewer",
      avatar: "/placeholder.svg?height=40&width=40",
      lastActive: "3 days ago",
    },
  ],
  projects: [
    {
      id: 1,
      name: "Learning Management System",
      description: "Comprehensive LMS for online education",
      members: 3,
      lastUpdated: "2 hours ago",
    },
    {
      id: 2,
      name: "Student Portal",
      description: "Student dashboard and course management",
      members: 2,
      lastUpdated: "1 day ago",
    },
  ],
}

const mockMessages = [
  {
    id: 1,
    user: "Sarah Chen",
    message: "Just pushed the new authentication system updates",
    timestamp: "10 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    user: "Mike Johnson",
    message: "The UI components are looking great! Ready for review",
    timestamp: "1 hour ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export default function OrganizationPage() {
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")

  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "editor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      setNewMessage("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Organization</h1>
                <p className="text-muted-foreground">Manage your team and collaborate on projects</p>
              </div>

              <div className="flex space-x-2">
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Mail className="mr-2 h-4 w-4" />
                      Invite Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Members</DialogTitle>
                      <DialogDescription>
                        Send invitations to new team members to join your organization.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="colleague@example.com" />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="message">Personal Message (Optional)</Label>
                        <Textarea id="message" placeholder="Welcome to our team!" rows={3} />
                      </div>
                      <Button className="w-full">Send Invitation</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Organization</DialogTitle>
                      <DialogDescription>Set up a new organization to collaborate with your team.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input id="org-name" placeholder="My Awesome Company" />
                      </div>
                      <div>
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea id="org-description" placeholder="What does your organization do?" rows={3} />
                      </div>
                      <Button className="w-full">Create Organization</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Organization Info & Members */}
              <div className="lg:col-span-2 space-y-6">
                {/* Organization Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="h-5 w-5" />
                          <span>{mockOrganization.name}</span>
                        </CardTitle>
                        <CardDescription className="mt-2">{mockOrganization.description}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members ({mockOrganization.members.length})</CardTitle>
                    <CardDescription>Manage your team members and their permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockOrganization.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{member.name}</p>
                                {member.role === "Owner" && <Crown className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                              <p className="text-xs text-muted-foreground">Last active: {member.lastActive}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Change Role</DropdownMenuItem>
                                <DropdownMenuItem>Send Message</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Remove Member</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Projects ({mockOrganization.projects.length})</CardTitle>
                    <CardDescription>Projects shared with your organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockOrganization.projects.map((project) => (
                        <div key={project.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{project.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span>{project.members} members</span>
                                <span>Updated {project.lastUpdated}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Open
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Chat */}
              <div className="space-y-6">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Team Chat</span>
                    </CardTitle>
                    <CardDescription>Collaborate and discuss with your team</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-4 overflow-auto mb-4">
                      {mockMessages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.user} />
                            <AvatarFallback>{message.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium">{message.user}</p>
                              <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button size="icon" onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
