"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Code, Users, Cloud, Linkedin } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/header"

// --- 1. IMPORT THE useAuth HOOK ---
import { useAuth } from "./context/authContext"

export default function LandingPage() {
  // --- 2. GET AUTHENTICATION STATE ---
  const { user, isAuthenticated, logout } = useAuth();

  // --- 3. PREPARE USER DATA FOR THE HEADER ---
  console.log(user)
  const headerUser = user ? {
    name: user.fullName || "New User",
    email: user.email,
    avatar: "/placeholder.svg?height=32&width=32", // You can customize avatar later
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* The Header component will now show the user's avatar if logged in, or a login button if not */}
      <Header user={headerUser} onLogout={logout} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            ✨ Now with AI-Powered Code Generation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Your Intelligent Code Companion
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Build Projects at Lightning Speed with AI-powered development tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* --- 4. INTELLIGENT ROUTING FOR THE MAIN BUTTON --- */}
            {/* If logged in, this button goes to /dashboard. If not, it goes to /auth. */}
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              <Button size="lg" className="text-lg px-8 py-6">
                Start Building <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="/Demo_video.mp4" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
            Watch Demo
            </Button>
            </a>

          </div>
        </div>
      </section>

      {/* Features Section (No changes needed here) */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to build faster</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools and AI assistance to accelerate your development workflow
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-6"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><Code className="h-8 w-8 text-primary" /></div><h3 className="text-xl font-semibold mb-4">AI-Powered Code Generation</h3><p className="text-muted-foreground">Generate high-quality code instantly with our advanced AI models. From components to full applications.</p></CardContent></Card>
          <Card className="p-8 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-6"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><Users className="h-8 w-8 text-primary" /></div><h3 className="text-xl font-semibold mb-4">Real-Time Collaboration</h3><p className="text-muted-foreground">Work together seamlessly with your team. Share projects, review code, and build together in real-time.</p></CardContent></Card>
          <Card className="p-8 text-center hover:shadow-lg transition-shadow"><CardContent className="pt-6"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><Cloud className="h-8 w-8 text-primary" /></div><h3 className="text-xl font-semibold mb-4">Dev Environments in Cloud</h3><p className="text-muted-foreground">Spin up development environments instantly. No setup required. Code from anywhere, anytime.</p></CardContent></Card>
        </div>
      </section>

      {/* Testimonials Section (No changes needed here)
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by developers worldwide</h2>
            <p className="text-xl text-muted-foreground">See what our users are saying about StudAI Builder</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{name: "Sarah Chen", role: "Full Stack Developer", content: "StudAI Builder has revolutionized my development workflow. The AI code generation is incredibly accurate and saves me hours every day.", rating: 5,}, {name: "Marcus Rodriguez", role: "Tech Lead", content: "The collaboration features are outstanding. Our team can work together seamlessly, and the cloud environments are always ready to go.", rating: 5,}, {name: "Emily Johnson", role: "Startup Founder", content: "As a non-technical founder, StudAI Builder helps me prototype ideas quickly. The AI assistance makes development accessible to everyone.", rating: 5,}].map((testimonial, index) => (
              <Card key={index} className="p-6"><CardContent className="pt-6"><div className="flex mb-4">{[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />))}</div><p className="text-muted-foreground mb-4">"{testimonial.content}"</p><div><p className="font-semibold">{testimonial.name}</p><p className="text-sm text-muted-foreground">{testimonial.role}</p></div></CardContent></Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section (No changes needed here, except the link) */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to accelerate your development?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers who are building faster with StudAI Builder
          </p>
          {/* --- 5. INTELLIGENT ROUTING FOR THE FINAL CTA BUTTON --- */}
          <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer (No changes needed here) */}
      <footer className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
      <div>
          <h3 className="font-bold text-lg mb-4">StudAI Builder</h3>
          <p className="text-muted-foreground mb-4">
            Your intelligent code companion for building projects at lightning speed.
          </p>
          <div className="flex space-x-4">
        {/* YouTube */}
        <a href="https://www.youtube.com/@studaiedutech" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon">
            {/* YouTube Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a2.97 2.97 0 0 0-2.09-2.103C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.408.583a2.97 2.97 0 0 0-2.09 2.103C0 8.1 0 12 0 12s0 3.9.502 5.814a2.97 2.97 0 0 0 2.09 2.103C4.495 20.5 12 20.5 12 20.5s7.505 0 9.408-.583a2.97 2.97 0 0 0 2.09-2.103C24 15.9 24 12 24 12s0-3.9-.502-5.814zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
            </svg>
          </Button>
        </a>

        {/* Instagram */}
        <a href="https://www.instagram.com/studai_edutech/" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon">
            {/* Instagram Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.5-.88a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z"/>
            </svg>
          </Button>
        </a>

        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/company/studai-edutech-private-limited/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="icon">
            <Linkedin className="h-5 w-5" />
          </Button>
        </a>

        {/* WhatsApp */}
        <a href="https://whatsapp.com/channel/0029VayIg1nJUM2jSjBHKP2O" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon">
            {/* WhatsApp Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.52 3.48A11.87 11.87 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.16 1.6 5.98L0 24l6.21-1.58A11.95 11.95 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 21.82c-2.07 0-4.08-.55-5.84-1.6l-.42-.25-3.69.94.99-3.6-.27-.44A9.85 9.85 0 0 1 2.18 12c0-5.42 4.4-9.82 9.82-9.82 2.63 0 5.1 1.03 6.95 2.88A9.74 9.74 0 0 1 21.82 12c0 5.42-4.4 9.82-9.82 9.82z"/>
              <path d="M17.44 14.56c-.29-.14-1.72-.85-1.99-.94-.27-.1-.47-.14-.66.14-.2.29-.76.94-.93 1.14-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.66-1.6-.91-2.19-.24-.58-.48-.5-.66-.51h-.56c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44s1.03 2.83 1.17 3.02c.14.19 2.03 3.1 4.93 4.34 2.9 1.24 2.9.83 3.42.77.52-.05 1.72-.7 1.96-1.38.24-.67.24-1.24.17-1.38-.07-.14-.26-.22-.55-.36z"/>
            </svg>
          </Button>
        </a>
        </div>
  </div>

  <div>
    <h4 className="font-semibold mb-4">Ecosystem</h4>
    <ul className="space-y-2 text-muted-foreground">
      <li><a href="https://stud-ai.com/#Roadmap" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">StudAI Genie</a></li>
      <li><a href="https://studaiworks.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">StudAI Works</a></li>
      <li><a href="https://studaielev8.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">StudAI Elev8</a></li>
      <li><a href="https://stud-ai.com/#products" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">StudAI Loop</a></li>
      <li><a href="https://stud-ai.com/#products" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">StudAI Creator</a></li>
      {/* <li><Link to="/api" className="hover:text-foreground">API</Link></li> */}
    </ul>
  </div>

  <div>
    <h4 className="font-semibold mb-4">Company</h4>
    <ul className="space-y-2 text-muted-foreground">
      <li><a href="https://stud-ai.com/#Roadmap" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Roadmap</a></li>
      <li><a href="https://stud-ai.com/#impact" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">impact</a></li>
      <li><a href="https://stud-ai.com/#join" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Careers</a></li>
      <li><a href="https://stud-ai.com/#contact" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Contact</a></li>
    </ul>
  </div>

  <div>
    <h4 className="font-semibold mb-4">Legal</h4>
    <ul className="space-y-2 text-muted-foreground">
      <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
      <li><Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
      <li><Link to="/security" className="hover:text-foreground">Security</Link></li>
    </ul>
  </div>
</div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground"><p>© 2025 STUDAI EDUTECH PVT. LTD. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  )
}