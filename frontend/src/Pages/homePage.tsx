"use client"

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useAuth } from "../app/context/authContext";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();

  const headerUser = user ? {
    name: user.fullName,
    email: user.email,
    avatar: "/placeholder.svg?height=32&width=32",
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <Header user={headerUser} onLogout={logout} />
      
      <main className="container mx-auto text-center py-20 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Nexus Cloud Platform</h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          The all-in-one solution for generating, building, and deploying your modern web applications with the power of AI.
        </p>
        
        <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
          <Button size="lg">
            Start Building
          </Button>
        </Link>
      </main>
    </div>
  );
}