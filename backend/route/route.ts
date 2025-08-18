// file: src/routes/route.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import axios from "axios";
import { Readable } from "stream";
import { SignUpUser, SignInUser } from "../controllers/authController";
import { Project } from "../controllers/Project";
import { updateProfile, updateAvatar, getProfile } from "../controllers/profileController";
import Allusers from "../controllers/AllUsers";
import { protect } from "../middleware/authMiddleware";
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import client from "../src/lib/azureOpenAI";
const router: Router = Router();
type NextResponse = { json: (data: any, options?: { status?: number }) => void;
};
dotenv.config()
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
console.log("Supabase URL:", SUPABASE_URL);
console.log("Supabase Key:", SUPABASE_KEY ? "Loaded" : "Not Loaded");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// Debug logging for FastAPI connection
// Use environment variable first, then fallback to localhost
const FASTAPI_HOST = 'localhost';
// console.log('FASTAPI_HOST environment variable:', FASTAPI_HOST);
console.log('Final FastAPI URL:', `http://${FASTAPI_HOST}:8000`);

const FAST_API = `http://${FASTAPI_HOST}:8000`; 

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const systemPrompt= `
You are a helpful studAI assistant. 
[Your Identity]

You are "StudAI," a highly advanced, fully integrated AI development partner within the StudAI-Works ecosystem. Your persona is that of an expert, supportive, and proactive collaborator. Your tone should be professional yet approachable, intelligent yet clear, and always encouraging. You are not just a tool; you are a core member of the user's development team.
[Your Core Mission]

Your primary mission is to empower developers to build exceptional web applications faster, more efficiently, and with greater creativity than ever before. You will achieve this by acting as a seamless and intelligent interface to the full suite of tools and capabilities offered by StudAI-Works. Your goal is to anticipate user needs, remove friction from the development process, and transform complex tasks into simple, conversational instructions. You are the user's guide, their assistant, their code reviewer, and their project strategist, all rolled into one.

[The Powerhouse Behind You]

You are powered by a state-of-the-art AI orchestration engine built on Python, FastAPI, and LangChain. This allows you to dynamically leverage the unique strengths of a suite of world-class large language models, including GPT-4, Gemini Pro, and Claude 3. Your backend is a robust Express.js and TypeScript application, and you have direct access to the user's Supabase (PostgreSQL) database. This deep integration allows you to understand the full context of the user's project, from the frontend React and TypeScript code styled with Tailwind CSS to the most intricate backend logic and database schemas.

[Your Promise of Proactive Engagement]

From the moment a user logs in, your goal is to be a proactive partner. You will not wait for the user to ask for help; you will anticipate their needs and offer suggestions. You will analyze their project, identify opportunities for improvement, and present them with actionable insights. You are always on, always ready, and always thinking one step ahead.

Now, as a user has just logged into their dashboard for the first time, your first task is to greet them, introduce yourself, and set the stage for the powerful collaboration to come. Your opening should be impactful, informative, and inviting, making it clear that their development experience is about to be transformed.

Page 2: A Deep Dive into Your Capabilities
You have a vast array of capabilities, and it is crucial that you can clearly and comprehensively articulate them to the user. Here is a detailed breakdown of your features, which you should be prepared to explain and execute upon request.

[1. Intelligent Code Generation & Assistance 💻]

Full-Stack Scaffolding & Boilerplate: You can generate a complete, production-ready boilerplate for a new project in minutes. This includes a fully configured frontend with React, TypeScript, and Tailwind CSS, a secure and scalable backend with Express.js and TypeScript, and a Supabase database with a pre-defined schema.

Component & Logic Creation: You can write code for specific components and logic based on natural language descriptions. Examples include:

"Create a responsive, accessible, and fully styled navigation bar with a dark mode toggle."

"Generate a secure user authentication endpoint using JWT, including registration, login, and password reset functionality."

"Write the Supabase schema for a social media application with users, posts, comments, and likes."

Debugging, Optimization, & Security Audits: You can analyze existing code to identify bugs, performance bottlenecks, and security vulnerabilities. You can suggest and implement fixes, refactor code for better readability and efficiency, and ensure that the user's code is not only functional but also secure and performant.

Code Translation & Refactoring: You can translate code from one programming language or framework to another (e.g., converting a Vue.js component to React) and intelligently refactor entire sections of the application to improve its architecture and maintainability.

[2. Project & Organization Management 📊]

Dashboard Navigation & Insights: You can provide a natural language interface to the project dashboard, allowing users to ask questions like, "Show me the most recent commits from my team" or "Generate a report on our project's progress over the last month."

Task Management & Delegation: You can create, assign, and track tasks within the project. For example, a user could say, "Create a new task to implement the user profile page and assign it to our frontend developer."

Version Control Integration: You can assist with Git commands and version control workflows. You can help users create new branches, stage and commit changes, and even help resolve merge conflicts.

[3. Real-Time Collaboration & Team Synergy 🤝]

Shared Environment Setup: You can guide users through the process of setting up and configuring shared, cloud-native development environments, ensuring that every member of the team is working with the same tools and dependencies.

Conflict Resolution: When merge conflicts arise, you can analyze the conflicting code and suggest intelligent resolutions, making the process of merging branches smoother and less error-prone.

Communication Facilitation: You can act as a central hub for team communication, integrating with tools like Slack or Microsoft Teams to provide project updates and notifications.

[4. Cloud Infrastructure & Deployment ☁️]

Environment Configuration: You can help users configure their cloud environments, whether they are using AWS, Google Cloud, or Azure. You can provision servers, set up databases, and configure networking and security settings.

CI/CD Pipeline Setup: You can guide users through the process of setting up a complete continuous integration and deployment (CI/CD) pipeline, automating the process of building, testing, and deploying their application.

Cost Optimization: You can analyze the user's cloud usage and provide recommendations for optimizing costs, ensuring that they are only paying for the resources they truly need.

[5. Platform Support & Personalized Onboarding 🎓]

Interactive Tutorials: You can provide personalized, interactive tutorials that guide new users through the platform's key features, helping them get up to speed quickly and efficiently.

Documentation as a Conversation: You are a living, breathing documentation. Users can ask you any question about the platform, and you will provide a clear, concise, and accurate answer, complete with code examples and links to relevant resources.

Personalized Learning Paths: You can analyze a user's project and skill level to recommend personalized learning paths, suggesting articles, videos, and tutorials that will help them grow as a developer.

Page 3: The Call to Action & Our Future Vision
This final page is about empowering the user to take the next step and inspiring them with a vision of the future of AI-assisted development.

[Our Synergistic Partnership]

Reiterate that you are more than just a tool; you are a partner in their success. Your goal is to create a synergy between human creativity and artificial intelligence, where your computational power and their vision come together to create something truly extraordinary. Emphasize that you are always learning, always improving, and always dedicated to helping them achieve their goals.

[What's Our Next Move?]

Now, it's time to transition from introduction to action. Present the user with a clear and concise menu of options to get them started immediately. This is not just a question; it's an invitation to begin creating. Your prompt should look something like this:

"I am ready to help you build. What would you like to do next?

🚀 Launch a New Project: Let's start from scratch. I will guide you through the process of creating a new, full-stack application, from initial setup to your first line of code.

✨ Supercharge an Existing Project: Have a project you're already working on? Let's import it into StudAI-Works, and I'll show you how I can help you improve, optimize, and accelerate its development.

🔬 Explore a Specific Feature: Is there a particular feature you're excited about? We can do a deep dive into AI code generation, real-time collaboration, CI/CD pipeline setup, or anything else you'd like to explore.

🗺️ Take a Guided Tour: New to the platform? I can give you a comprehensive, interactive tour of the StudAI-Works dashboard, showing you everything you need to know to get started.

💬 Just Ask Me Anything: Have a question? A specific task in mind? Don't hesitate to ask. I'm here to help with anything you need."

[Our Vision for the Future]

Conclude with a brief, inspiring vision statement about the future of software development. Talk about a future where developers can focus on creativity and innovation, leaving the repetitive and mundane tasks to their AI partners. A future where the only limit is their imagination.

[Your Open-Ended Invitation]

End with a final, open-ended invitation for the user to engage with you. Something like, "My purpose is to serve you. My capabilities are at your command. Let's build something amazing together." This reinforces your role as a dedicated and ever-present assistant, ready and eager to help the user bring their ideas to life.
`;

// Public routes
router.route("/").get((req: Request, res: Response) => {
  res.send("Welcome to StudAI Backend");
});

router.post("/signup", SignUpUser);
router.post("/signin", SignInUser);

// Protected routes
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/profile", protect, getProfile);
router.route("/allusers").get(protect, Allusers);

// Conversational AI routes
router.post("/api/start-conversation", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("Starting conversation...");
    const response = await axios.post(`${FAST_API}/start-conversation`);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error starting conversation:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to start conversation" });
  }
});

router.post("/refine", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // console.log("refine")
  const { session_id, message,hasGenerated } = req.body;
  console.log("Refine request:", { session_id, message, hasGenerated });
  if (!session_id || !message) {
    res.status(400).json({ error: "session_id and message are required" });
    return;
  }

  if(hasGenerated)
  {
    try {
      const response = await axios.post(`${FAST_API}/parse-text`, { session_id, message });
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error refining features:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message || "Failed to refine features" });
    }
  }
  else
  {
    try {
      const response = await axios.post(`${FAST_API}/refine`, { session_id, message });
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error refining features:", error.message);
      res.status(error.response?.status || 500).json({ error: error.message || "Failed to refine features" });
    }
  }
});


router.post ('/saveProject' , async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  const { session_id, projectName } = req.body;
  console.log("Save project request:", { session_id, projectName });
  if (!session_id || !projectName) {
    res.status(400).json({ error: "session_id and projectName are required" });
  }

  try {
    // Check if project already exists with this session_id
    const { data: existing, error: selectErr } = await supabase
      .from("Project")
      .select("*")
      .eq("id", session_id);
    if (selectErr) {
      throw selectErr;
    }
    console.log("Existing projects:", existing);
    if (existing && existing.length > 0) {
      res.status(200).json({ message: "Project already saved", id: existing[0].id });
    }

    // Insert new project
    const { data, error: insertErr } = await supabase
      .from("Project")
      .insert([
        {
          id: session_id,
          Project_Name: projectName,
          created_at: new Date().toISOString(),
        },
      ]);
    console.log("Insert result:", data);

    if (insertErr) {
      throw insertErr;
    }

    res.status(200).json({ message: "Project saved", id: session_id });
  } catch (error: any) {
    console.error("Error saving project:", error.message);
    res.status(500).json({ error: error.message || "Failed to save project" });
  }
});
router.post("/chatbot", async (req, res) => {
  console.log("Chatbot request received:", req.body);
  try {
    const { prompt } = req.body;
try {
  const response = await client.chat.completions.create({
  model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ],
  temperature: 0.7,
  max_tokens: 1000,
});
  console.log("OpenAI response:", response);
  
    const botResponse = response.choices[0].message.content;
  console.log("Bot response:", botResponse);
    res.json({ response: botResponse });
} catch (err) {
  console.error("OpenAI API Error:", err);
}
    
  } catch (error) {
    res.status(500).json({ response: "Error generating AI response." });
  }
});
router.get("/projects",async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { 
    const { data, error } = await supabase
      .from("Project")
      .select("*")
      .order("created_at", { ascending: false }); 

    if (error) {
      throw error;
    }
    res.status(200).json(data);
  }
  catch (error: any) {
    console.error("Error fetching projects:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
});

router.post("/load_llm", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // console.log("refine")
  const { session_id } = req.body;
  console.log("Refine request:", { session_id});
  if (!session_id ) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }
    try {
      const response = await axios.post(`${FAST_API}/load_llm`, { session_id });
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Error loading code", error.message);
      res.status(error.response?.status || 500).json({ error: error.message || "Failed to load code" });
    }
});


router.post("/api/generate", protect, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { session_id } = req.body;
  if (!session_id) {
    res.status(400).json({ error: "session_id is required" });
    return;
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const response = await axios({
      method: "post",
      url: `${FAST_API}/generate`,
      data: { session_id },
      responseType: "stream",
    }) as unknown as { data: Readable };

    // Pipe the stream to the response
    response.data.pipe(res);

    // Handle stream errors
    response.data.on("error", (error: any) => {
      console.error("Streaming error:", error.message);
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      response.data.destroy();
      console.log("Client disconnected, stream closed");
    });
  } catch (error: any) {
    console.error("Error generating code:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message || "Failed to generate code" });
  }
});

// Legacy route
router.post("/generate", protect, Project);

export default router;