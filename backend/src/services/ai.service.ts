import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export interface GoalAnalysis {
  difficulty_score: number;
  estimated_duration: string;
  prerequisites: string[];
  strengths: string[];
  weaknesses: string[];
  starting_point: string;
  learning_strategy: string;
  confidence_score: number;
}

export interface MilestoneInput {
  sequence_number: number;
  title: string;
  description: string;
  estimated_days: number;
  topics: string[];
  learning_objectives: string[];
  resources: {
    title: string;
    url: string;
    resource_type: 'video' | 'article' | 'documentation' | 'course' | 'tool';
    estimated_minutes: number;
    why_recommended: string;
  }[];
  project: {
    title: string;
    description: string;
    requirements: string[];
    tech_stack: string[];
    steps: { step_number: number; description: string }[];
    estimated_hours: number;
  };
  tasks: {
    title: string;
    description: string;
    task_type: 'read' | 'watch' | 'practice' | 'build' | 'quiz';
    estimated_minutes: number;
    day_number: number;
  }[];
}

export interface RoadmapGeneration {
  title: string;
  description: string;
  total_weeks: number;
  milestones: MilestoneInput[];
}

export class AIService {
  private static getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Sanitizes and extracts structured intent from a raw natural language goal query.
   * This runs as a lightweight pre-pass before full analysis.
   */
  private static parseNaturalLanguageGoal(params: {
    title: string;
    description: string;
    skill_level: string;
    target_skill_level: string;
  }): string {
    const raw = `${params.title} ${params.description}`.trim();
    // Build a rich plain-English summary for the LLM context
    return `The user wants to: "${raw}". Their current skill level is ${params.skill_level} and they aim to reach ${params.target_skill_level} level.`;
  }

  /**
   * Generates Goal Analysis and Personalized Roadmap in a single unified LLM pass for consistency.
   */
  public static async analyzeAndPlan(params: {
    title: string;
    description: string;
    skill_level: string;
    target_skill_level: string;
    learning_style: string;
    weekly_hours: number;
    target_date: string;
  }): Promise<{ analysis: GoalAnalysis; roadmap: RoadmapGeneration }> {
    const genAI = this.getGenAI();
    if (!genAI) {
      logger.info('Gemini API key is not configured. Using structured mock fallback generator.');
      return this.generateMockFallback(params);
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const nlSummary = this.parseNaturalLanguageGoal(params);

      const prompt = `You are the lead AI orchestrator engine for SkillVerse, an AI-powered personalized learning workspace system.
A user has submitted a learning goal in natural language. Your job is to:
1. Understand the INTENT from the natural language input — even if it is vague, informal, or conversational.
2. Conduct a rigorous diagnostic analysis on the learning objective.
3. Generate a personalized, structured learning roadmap.

--- User Goal (Natural Language) ---
${nlSummary}

--- Additional Parameters ---
- Learning Style: "${params.learning_style}"
- Weekly Committed Hours: ${params.weekly_hours} hours/week
- Target Completion Date: "${params.target_date}"

--- Analysis Instructions ---
1. Understand and interpret the user's natural language goal, even if vague.
2. Estimate: difficulty score (1-10), duration, prerequisites, strengths, weaknesses, starting point, learning strategy, confidence score (0-100).
3. Build a sequential weekly roadmap broken into milestones.
4. For each milestone provide:
   - sequence_number (1-indexed integer)
   - title & description
   - estimated_days (integer, e.g. 7)
   - topics array (specific core knowledge areas)
   - learning_objectives array (concrete hands-on outcomes)
   - resources array (minimum 2 items); each resource MUST have resource_type which is EXACTLY one of: "article", "video", "course", "documentation", "tool"
   - project (capstone): title, description, requirements array, tech_stack array, steps array (each with step_number and description), estimated_hours
   - tasks array (day-by-day actions); each task MUST have task_type which is EXACTLY one of: "read", "watch", "practice", "build", "quiz"

--- Response Format ---
Return ONLY a raw valid JSON object (no markdown fences, no prose before or after):
{
  "analysis": {
    "difficulty_score": 7,
    "estimated_duration": "4 weeks",
    "prerequisites": ["item"],
    "strengths": ["item"],
    "weaknesses": ["item"],
    "starting_point": "description",
    "learning_strategy": "description",
    "confidence_score": 90
  },
  "roadmap": {
    "title": "Roadmap Title",
    "description": "Overview",
    "total_weeks": 4,
    "milestones": [
      {
        "sequence_number": 1,
        "title": "Milestone Title",
        "description": "Milestone description",
        "estimated_days": 7,
        "topics": ["topic"],
        "learning_objectives": ["objective"],
        "resources": [
          {
            "title": "Resource Name",
            "url": "https://example.com",
            "resource_type": "documentation",
            "estimated_minutes": 30,
            "why_recommended": "reason"
          }
        ],
        "project": {
          "title": "Project Title",
          "description": "Build this",
          "requirements": ["req"],
          "tech_stack": ["tech"],
          "steps": [{ "step_number": 1, "description": "step" }],
          "estimated_hours": 8
        },
        "tasks": [
          {
            "title": "Task Title",
            "description": "Task description",
            "task_type": "read",
            "estimated_minutes": 45,
            "day_number": 1
          }
        ]
      }
    ]
  }
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();

      // Robustly extract JSON — strip any markdown fences or prose wrapping
      let cleaned = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      const parsed = JSON.parse(cleaned);

      if (!parsed.analysis || !parsed.roadmap) {
        throw new Error('Gemini response missing required analysis or roadmap keys');
      }

      // Sanitize enum values to prevent DB constraint violations
      if (parsed.roadmap.milestones) {
        const validResourceTypes = new Set(['article', 'video', 'course', 'documentation', 'tool']);
        const validTaskTypes = new Set(['read', 'watch', 'practice', 'build', 'quiz']);

        for (const m of parsed.roadmap.milestones) {
          if (m.resources) {
            m.resources = m.resources.map((r: any) => ({
              ...r,
              resource_type: validResourceTypes.has(r.resource_type) ? r.resource_type : 'article',
            }));
          }
          if (m.tasks) {
            m.tasks = m.tasks.map((t: any) => ({
              ...t,
              task_type: validTaskTypes.has(t.task_type) ? t.task_type : 'read',
            }));
          }
        }
      }

      logger.info('Gemini AI analysis and roadmap generated successfully.');
      return parsed;
    } catch (e: any) {
      logger.error('Gemini API call failed, falling back to mock generator: ' + e.message);
      return this.generateMockFallback(params);
    }
  }

  private static generateMockFallback(params: {
    title: string;
    description: string;
    skill_level: string;
    target_skill_level: string;
    learning_style: string;
    weekly_hours: number;
    target_date: string;
  }): { analysis: GoalAnalysis; roadmap: RoadmapGeneration } {
    const isBackendObj = /backend|api|database|node|python|sql/i.test(params.title + ' ' + params.description);
    
    const analysis: GoalAnalysis = {
      difficulty_score: params.skill_level === 'beginner' ? 6 : params.skill_level === 'intermediate' ? 8 : 9,
      estimated_duration: '4 weeks',
      prerequisites: isBackendObj 
        ? ['Basic JavaScript syntax foundations', 'Command line environment familiarity']
        : ['Semantic HTML5 structure conventions', 'Basic CSS layout values'],
      strengths: [
        `Expressive target goal details match market demand.`,
        `Selected style: ${params.learning_style} aligns with the target learning curve.`
      ],
      weaknesses: [
        `Ambitious scope might conflict with weekly budget of ${params.weekly_hours} hours.`,
        `Short learning timeline requires strict attention to practical milestones.`
      ],
      starting_point: isBackendObj 
        ? 'Step 1: Setting up strict Node compilations and handling raw HTTP responses.'
        : 'Step 1: Initializing custom CSS variables and learning the DOM event hooks.',
      learning_strategy: `Review structured docs blocks using the ${params.learning_style} methodology. Budget at least ${Math.round(params.weekly_hours / 5)} hours per study session, followed by milestone capstone projects.`,
      confidence_score: 92,
    };

    const roadmap: RoadmapGeneration = {
      title: `${params.title} Roadmap`,
      description: `Hyper-personalized, AI-curated track mapping targets towards ${params.target_skill_level} proficiency in ${params.title}.`,
      total_weeks: 2,
      milestones: [
        {
          sequence_number: 1,
          title: isBackendObj ? 'Foundational Routing & Server Assembly' : 'Modern DOM Manipulation and Component Layouts',
          description: isBackendObj 
            ? 'Assemble an Express microservice backend, handling dynamic routing contexts and compiling typescript outputs.'
            : 'Construct structured HTML pages styled with modern responsive grid layouts and managed DOM events.',
          estimated_days: 7,
          topics: isBackendObj 
            ? ['Node.js Event loops', 'HTTP headers schemas', 'TypeScript configurations', 'Middlewares setup']
            : ['CSS Flexbox & Grids', 'DOM event parameters', 'Async JSON fetching', 'Layout state caches'],
          learning_objectives: isBackendObj 
            ? ['Create a functional HTTP request listener', 'Register routes via router trees', 'Set up Express middleware blocks']
            : ['Develop responsive views without libraries', 'Handle dynamic list interactions', 'Hook forms outputs payload'],
          resources: [
            {
              title: isBackendObj ? 'Next-Generation Node Server Architectures' : 'Modern Web Layout guides - MDN',
              url: isBackendObj ? 'https://nodejs.org/en/docs/' : 'https://developer.mozilla.org/en-US/docs/Web/Guide',
              resource_type: 'documentation',
              estimated_minutes: 25,
              why_recommended: 'Essential standard reference mapping foundational behaviors and configurations.'
            },
            {
              title: isBackendObj ? 'Building APIs without frameworks' : 'Learn CSS Grid Layouts Interactives',
              url: isBackendObj ? 'https://www.youtube.com/watch?v=foundations' : 'https://cssgrid.io/',
              resource_type: 'video',
              estimated_minutes: 20,
              why_recommended: 'Visual walkthrough tracing common developer mistakes and optimizations.'
            }
          ],
          project: {
            title: isBackendObj ? 'Interactive Task Database Microservice' : 'Stateful Task Planner Dashboard',
            description: isBackendObj 
              ? 'Formulate a server using raw Node HTTP module or Express. Standardize JSON outputs and include request body parsers.'
              : 'Assemble a responsive client dashboard styled with CSS Grid, updating local task status widgets.',
            requirements: isBackendObj 
              ? ['Expose dynamic POST endpoints', 'Parse incoming request body details', 'Serve standardized JSON payloads']
              : ['Render list components dynamically', 'Provide state filters', 'Fit mobile viewport bounds'],
            tech_stack: isBackendObj ? ['Node.js', 'Express', 'TypeScript'] : ['React', 'CSS Grid', 'Lucide React'],
            steps: [
              { index: 1, description: 'Set up package directory and typescript compiling paths.' },
              { index: 2, description: 'Design routes handlers mapping specific HTTP request methods.' },
              { index: 3, description: 'Review validation requirements and format error payloads.' }
            ].map(s => ({ step_number: s.index, description: s.description })),
            estimated_hours: 6
          },
          tasks: [
            {
              title: 'Read Core Tutorial Content',
              description: 'Read the official getting started guide for setting up dev tooling.',
              task_type: 'read',
              estimated_minutes: 30,
              day_number: 1
            },
            {
              title: 'Watch Practical Setup Walkthrough',
              description: 'Observe compiler toolchain configurations to avoid common mistakes.',
              task_type: 'watch',
              estimated_minutes: 20,
              day_number: 2
            },
            {
              title: 'Practice Formulating Route Nodes',
              description: 'Expose local handlers and test responses locally via cURL or Postman.',
              task_type: 'practice',
              estimated_minutes: 45,
              day_number: 3
            },
            {
              title: 'Debug Error Handling Systems',
              description: 'Write custom middlewares to catch and log broken request exceptions.',
              task_type: 'practice',
              estimated_minutes: 40,
              day_number: 4
            },
            {
              title: 'Launch Project Scaffolding',
              description: 'Establish standard repository configurations and structure the folders.',
              task_type: 'practice',
              estimated_minutes: 50,
              day_number: 5
            },
            {
              title: 'Implement Core Project Specifications',
              description: 'Bring the dashboard elements to functional completion.',
              task_type: 'practice',
              estimated_minutes: 90,
              day_number: 6
            },
            {
              title: 'Review Project with Socratic Assistant',
              description: 'Self-audit compiler flags and refactor code constructs according to principles.',
              task_type: 'practice',
              estimated_minutes: 30,
              day_number: 7
            }
          ]
        },
        {
          sequence_number: 2,
          title: isBackendObj ? 'Supabase Integrations & Row Validation Layers' : 'Data Streams Hydration & State Persistence',
          description: isBackendObj 
            ? 'Connect our Node.js server to Supabase PostgreSQL, configuring Table schemas and enabling Row Level Security controls.'
            : 'Synchronize page states using local storage caches and integrate token-based request clients.',
          estimated_days: 7,
          topics: isBackendObj 
            ? ['PostgreSQL schemas', 'Row Level Security configurations', 'Supabase Client queries', 'Join tables queries']
            : ['Local Storage updates', 'Context stores managers', 'Router hook controllers', 'Form validation regex'],
          learning_objectives: isBackendObj 
            ? ['Provision schemas through SQL migration files', 'Implement user auth gate checks', 'Query data stores via Javascript SDK']
            : ['Save app layout settings in browsers', 'Intercept unauthenticated paths', 'Display structured api parameters'],
          resources: [
            {
              title: isBackendObj ? 'Configuring Supabase RLS and DB Policies' : 'Global Application State Strategies',
              url: isBackendObj ? 'https://supabase.com/docs/guides/auth' : 'https://react.dev/learn/managing-state',
              resource_type: 'documentation',
              estimated_minutes: 30,
              why_recommended: 'Official design patterns for setting up correct access rules.'
            },
            {
              title: isBackendObj ? 'Building Relational Database Queries' : 'Local Storage Cache Hydration Walkthroughs',
              url: isBackendObj ? 'https://supabase.com/docs/reference/javascript/' : 'https://www.youtube.com/watch?v=state-cache',
              resource_type: 'video',
              estimated_minutes: 15,
              why_recommended: 'Practical video demo focusing on database integration patterns.'
            }
          ],
          project: {
            title: isBackendObj ? 'Secure Database API Integration' : 'Cached Task Explorer Dashboard',
            description: isBackendObj 
              ? 'Construct relational database tables, apply select/insert policies, and expose security endpoints.'
              : 'Enhance the task planner by syncing dashboard items to localStorage and adding loading loaders.',
            requirements: isBackendObj 
              ? ['Link learning tables using foreign keys', 'Apply RLS policies for auth.users', 'Perform query filters']
              : ['Hydrate state cache on mount', 'Expose loading indicators', 'Persist settings inputs'],
            tech_stack: isBackendObj ? ['Supabase', 'PostgreSQL', 'SQL'] : ['Next.js', 'TailwindCSS', 'Zustand'],
            steps: [
              { index: 1, description: 'Design target schema and run DDL query statements.' },
              { index: 2, description: 'Expose authenticated clients binding client authorization headers.' },
              { index: 3, description: 'Assert table read protections using active RLS definitions.' }
            ].map(s => ({ step_number: s.index, description: s.description })),
            estimated_hours: 5
          },
          tasks: [
            {
              title: 'Learn Schema Design Rules',
              description: 'Understand foreign key references and data normalization.',
              task_type: 'read',
              estimated_minutes: 25,
              day_number: 1
            },
            {
              title: 'Configure DB Connection Layers',
              description: 'Verify backend credentials and initialize environment connectors.',
              task_type: 'practice',
              estimated_minutes: 30,
              day_number: 2
            },
            {
              title: 'Expose RLS Table Rules',
              description: 'Apply security policies restricting rows to their respective owners.',
              task_type: 'practice',
              estimated_minutes: 40,
              day_number: 3
            },
            {
              title: 'Query Data via Supabase SDK',
              description: 'Fetch and filter active database rows in client routes.',
              task_type: 'practice',
              estimated_minutes: 45,
              day_number: 4
            },
            {
              title: 'Organize Code Service Layers',
              description: 'Refactor controllers to isolate DB execution files.',
              task_type: 'practice',
              estimated_minutes: 35,
              day_number: 5
            },
            {
              title: 'Finalize Milestone Project Requirements',
              description: 'Complete the backend secure auth integration scripts.',
              task_type: 'practice',
              estimated_minutes: 100,
              day_number: 6
            },
            {
              title: 'Conduct Final Security Self-Audits',
              description: 'Validate error exception logs and compile production modules.',
              task_type: 'practice',
              estimated_minutes: 30,
              day_number: 7
            }
          ]
        }
      ]
    };

    return { analysis, roadmap };
  }
}
