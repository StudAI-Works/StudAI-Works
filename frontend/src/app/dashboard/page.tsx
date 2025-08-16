"use client"

import { useState,useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Copy, Clock, Folder } from "lucide-react";
import { Header } from "@/components/header";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "../context/authContext";
import { toast } from "react-toastify";
type ProjectType = {
  description: any;
  name: string;
  lastModified: string;
  status: string;
};

  const BASE_URL = "http://localhost:8080";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { user,token, logout } = useAuth();
  const [userProjects, setUserProjects] = useState<ProjectType[]>([]);
  const handleEditClick = (projectName: string) => {
  const encodedName = encodeURIComponent(projectName);
  navigate(`/generate/${encodedName}`);
};
  const navigate = useNavigate();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "deployed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "draft": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  console.log(user)
  const headerUser = {
    name: user.fullName,
    email: user.email,
    avatar: "/placeholder.svg?height=32&width=32",
  };
  useEffect(() => {
  const fetchUserProjects = async () => {
    toast.info("Loading your projects...")
    try {
      const res = await fetch(`${BASE_URL}/projects`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        }, // your auth headers function
      });
      if (!res.ok) throw new Error(`Error fetching projects: ${res.status}`);
      
      const data = await res.json();
      console.log("Fetched projects:", data);
      const mappedUserProjects = data.map(p => ({
        name: p.Project_Name || "Untitled",
        lastModified: new Date(p.created_at).toLocaleDateString(), // Format date nicely
        status: "active", // Or map from backend if you have status field
      }));
      setUserProjects(mappedUserProjects|| []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      toast.dismiss();
    }
  };

  fetchUserProjects();
}, []);

  const filteredProjects = userProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-background">
      <Header user={headerUser} onLogout={logout} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.fullName}! 👋
              </h1>
              <p className="text-muted-foreground">
                Ready to build something amazing? Let's get started with your projects.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Link to="/generate">
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Project
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Folder className="h-5 w-5 text-primary" />
                        <Badge variant="secondary" className="text-xs">
                          {project.type}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEditClick(project.name)}>
  <Edit className="mr-2 h-4 w-4" />Edit
</DropdownMenuItem>
                          <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{project.lastModified}</span>
                      </div>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Create your first project to get started"}
                </p>
                <Link to="/editorpage">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}