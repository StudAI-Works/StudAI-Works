import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Code, Users, Cloud, Star, Github, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

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
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Building <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to build faster</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools and AI assistance to accelerate your development workflow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Code Generation</h3>
              <p className="text-muted-foreground">
                Generate high-quality code instantly with our advanced AI models. From components to full applications.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-Time Collaboration</h3>
              <p className="text-muted-foreground">
                Work together seamlessly with your team. Share projects, review code, and build together in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Dev Environments in Cloud</h3>
              <p className="text-muted-foreground">
                Spin up development environments instantly. No setup required. Code from anywhere, anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by developers worldwide</h2>
            <p className="text-xl text-muted-foreground">See what our users are saying about Nexus Cloud Platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Full Stack Developer",
                content:
                  "Nexus Cloud Platform has revolutionized my development workflow. The AI code generation is incredibly accurate and saves me hours every day.",
                rating: 5,
              },
              {
                name: "Marcus Rodriguez",
                role: "Tech Lead",
                content:
                  "The collaboration features are outstanding. Our team can work together seamlessly, and the cloud environments are always ready to go.",
                rating: 5,
              },
              {
                name: "Emily Johnson",
                role: "Startup Founder",
                content:
                  "As a non-technical founder, Nexus helps me prototype ideas quickly. The AI assistance makes development accessible to everyone.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to accelerate your development?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers who are building faster with Nexus Cloud Platform
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Nexus Cloud Platform</h3>
              <p className="text-muted-foreground mb-4">
                Your intelligent code companion for building projects at lightning speed.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 STUDAI EDUTECH PVT. LTD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
