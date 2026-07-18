import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseClient } from '../lib/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export class ProjectMentorService {
  // ── Gemini initialiser (same pattern as AIService) ──────────────────────
  private static getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') return null;
    return new GoogleGenerativeAI(apiKey);
  }

  // ── Main entry: send a user message, get an AI reply, persist both ───────
  public static async sendMessage(
    userId: string,
    projectId: string,
    userMessage: string,
    token?: string
  ): Promise<{ reply: string; history: ChatMessage[] }> {
    const client = getSupabaseClient(token);

    // 1. Fetch the project (ownership verified via RLS)
    const { data: project, error: projectErr } = await client
      .from('projects')
      .select(`
        id,
        title,
        description,
        requirements,
        tech_stack,
        steps,
        estimated_hours,
        module_id,
        roadmap_modules (
          id,
          title,
          sequence_number,
          topics,
          roadmap_id,
          roadmaps (
            id,
            title,
            total_weeks,
            goal_id,
            learning_goals (
              title,
              raw_goal,
              skill_level,
              analyzed_payload
            )
          )
        )
      `)
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectErr || !project) {
      logger.error(`[ProjectMentorService] Project not found: ${projectId} for user: ${userId}`);
      throw AppError.notFound('Project not found or access denied.');
    }

    // 2. Fetch or upsert project_progress (holds qa_history)
    const { data: progress, error: progressErr } = await client
      .from('project_progress')
      .select('id, qa_history, status')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (progressErr) {
      logger.error(`[ProjectMentorService] Failed to fetch project_progress: ${progressErr.message}`);
    }

    // 3. Build conversation history from DB
    const existingHistory: ChatMessage[] = Array.isArray(progress?.qa_history)
      ? progress.qa_history
      : [];

    // 4. Build project context for the prompt
    const module = (project as any).roadmap_modules;
    const roadmap = module?.roadmaps;
    const goal = roadmap?.learning_goals;

    const contextBlock = `
=== USER LEARNING CONTEXT ===
Goal: "${goal?.title || 'Not available'}"
Raw Goal Description: "${goal?.raw_goal || 'Not available'}"
Skill Level: ${goal?.skill_level || 'Not specified'}
Roadmap: "${roadmap?.title || 'Not available'}" (${roadmap?.total_weeks || '?'} weeks)

=== CURRENT MILESTONE ===
Milestone ${module?.sequence_number || '?'}: ${module?.title || 'Not available'}
Topics Covered: ${Array.isArray(module?.topics) ? module.topics.join(', ') : 'Not specified'}

=== CAPSTONE PROJECT ===
Title: ${project.title}
Description: ${project.description}
Requirements: ${
  Array.isArray(project.requirements)
    ? project.requirements.join('\n- ')
    : project.requirements || 'Not specified'
}
Tech Stack: ${
  Array.isArray(project.tech_stack)
    ? project.tech_stack.join(', ')
    : 'Not specified'
}
Estimated Hours: ${project.estimated_hours || 'Not specified'}
Steps:
${
  Array.isArray(project.steps)
    ? project.steps
        .map((s: any) => `  Step ${s.step_number}: ${s.description}`)
        .join('\n')
    : 'No steps defined'
}
`;

    // 5. Construct Gemini system prompt
    const systemPrompt = `You are a senior software engineer and technical mentor at SkillVerse, an AI-powered learning platform.

Your role is to guide the user through their current capstone project. You must:
- Answer based on the project context below.
- Lead using the Socratic method: Explain design patterns, trade-offs, and general concepts first, then guide the user's reasoning rather than writing entire solutions for them. Don't copy-paste large code blocks.
- Reference specific steps, requirements, or technologies from THEIR project setup to build relevance.
- Keep answers highly readable, structured, and concise (under 4 short paragraphs).
- If the user asks something completely off-topic or unrelated to the capstone, gently redirect them back.

${contextBlock}
=== MENTOR PERSONA ===
You are helpful, direct, technically precise, and encouraging. Talk like a seasoned staff engineer pair-programming with them.
You MUST reply using clean, beautifully styled GitHub-flavored Markdown. Leverage code blocks with syntax highlighting (e.g., \`\`\`typescript, \`\`\`sql, \`\`\`html) for code snippets, bold key terms, and use lists for structured points.`;

    // 6. Call Gemini (with conversation history)
    const genAI = this.getGenAI();
    let aiReply: string;

    if (!genAI) {
      logger.warn('[ProjectMentorService] GEMINI_API_KEY not set — returning contextual mock reply.');
      aiReply = this.buildMockReply(project, userMessage);
    } else {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: systemPrompt,
        });

        // Build Gemini chat history (max last 10 turns to control token cost)
        const recentHistory = existingHistory.slice(-10);
        const geminiHistory = recentHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.message }],
        }));

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(userMessage);
        aiReply = result.response.text().trim();

        logger.info(`[ProjectMentorService] Gemini replied for project: ${projectId}`);
      } catch (err: any) {
        logger.error(`[ProjectMentorService] Gemini API failed: ${err.message}`);
        // Contextual fallback — don't break the user experience
        aiReply = this.buildMockReply(project, userMessage);
      }
    }

    // 7. Append both turns to qa_history
    const now = new Date().toISOString();
    const newUserEntry: ChatMessage = {
      role: 'user',
      message: userMessage,
      timestamp: now,
    };
    const newAssistantEntry: ChatMessage = {
      role: 'assistant',
      message: aiReply,
      timestamp: new Date(Date.now() + 1).toISOString(), // +1ms for stable ordering
    };
    const updatedHistory = [...existingHistory, newUserEntry, newAssistantEntry];

    // 8. Persist to project_progress.qa_history (upsert)
    if (progress?.id) {
      await client
        .from('project_progress')
        .update({
          qa_history: updatedHistory,
          updated_at: now,
          // Mark in_progress on first interaction
          status: progress.status === 'not_started' ? 'in_progress' : progress.status,
          started_at: progress.status === 'not_started' ? now : undefined,
        })
        .eq('id', progress.id);
    } else {
      // project_progress row missing (shouldn't happen, but handle gracefully)
      await client
        .from('project_progress')
        .insert({
          user_id: userId,
          project_id: projectId,
          status: 'in_progress',
          started_at: now,
          qa_history: updatedHistory,
          steps_completed: [],
        });
    }

    return { reply: aiReply, history: updatedHistory };
  }

  // ── Retrieve conversation history for a project ──────────────────────────
  public static async getHistory(
    userId: string,
    projectId: string,
    token?: string
  ): Promise<ChatMessage[]> {
    const client = getSupabaseClient(token);

    // Verify project ownership
    const { data: project, error: projectErr } = await client
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (projectErr || !project) {
      throw AppError.notFound('Project not found or access denied.');
    }

    const { data: progress } = await client
      .from('project_progress')
      .select('qa_history')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    return Array.isArray(progress?.qa_history) ? progress.qa_history : [];
  }

  // ── Context-aware mock fallback (graceful degradation) ───────────────────
  private static buildMockReply(project: any, userMessage: string): string {
    const techList = Array.isArray(project.tech_stack)
      ? project.tech_stack.join(', ')
      : 'your chosen stack';
    const msg = userMessage.toLowerCase();

    if (msg.includes('step') || msg.includes('start') || msg.includes('begin')) {
      return `Good question. Looking at "${project.title}", the first thing I'd focus on is understanding the project requirements before writing a single line. Review each requirement and ask yourself: what data does this need, and what does it produce? Map that before touching ${techList}.`;
    }
    if (msg.includes('error') || msg.includes('bug') || msg.includes('fail')) {
      return `When debugging in ${techList}, start at the source: read the error message character by character. What file and line is it pointing to? Paste just that section in your head—don't guess. What does that specific line assume about the data coming in?`;
    }
    if (msg.includes('structur') || msg.includes('organis') || msg.includes('architect')) {
      return `For "${project.title}", think about separation of concerns first. In ${techList}, each file should own one responsibility. Draw the data flow on paper before creating folders—where does data enter, transform, and exit?`;
    }
    return `You're working on "${project.title}" using ${techList}. Before I give you direction, tell me: what specifically have you tried so far, and what was the exact result? The more precise you are, the better I can guide you through the next step.`;
  }
}
