import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseClient } from '../lib/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: string[];           // exactly 4 options
  correct_option_index: number; // 0-based index into options[]
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface GeneratedQuiz {
  quizId: string;
  title: string;
  moduleId: string;
  moduleName: string;
  milestoneNumber: number;
  topicsCovered: string[];
  skillLevel: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    explanation: string;
    difficulty: string;
    topic: string;
  }>;
  maxScore: number;
  passPercentage: number;
}

export interface SubmitResult {
  attemptId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  percentage: number;
  passPercentage: number;
  results: Array<{
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
    topic: string;
  }>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class QuizService {

  private static getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') return null;
    return new GoogleGenerativeAI(apiKey);
  }

  // ── GET /api/quiz/current ──────────────────────────────────────────────────
  public static async getCurrentQuiz(
    userId: string,
    token?: string
  ): Promise<GeneratedQuiz> {
    const client = getSupabaseClient(token);

    // 1. Find the user's active roadmap
    const { data: roadmap, error: roadmapErr } = await client
      .from('roadmaps')
      .select(`
        id,
        title,
        total_weeks,
        goal_id,
        learning_goals (
          title,
          raw_goal,
          skill_level,
          analyzed_payload
        ),
        roadmap_modules (
          id,
          sequence_number,
          title,
          description,
          topics,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (roadmapErr || !roadmap) {
      throw AppError.notFound('No active roadmap found. Please complete onboarding first.');
    }

    // 2. Find the current module (in_progress first, then first not_started)
    const modules: any[] = (roadmap as any).roadmap_modules || [];
    let activeModule = modules.find(m => m.status === 'in_progress');
    if (!activeModule) {
      activeModule = modules
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .find(m => m.status !== 'completed');
    }
    if (!activeModule) {
      // All completed — use the last module
      activeModule = modules.sort((a, b) => b.sequence_number - a.sequence_number)[0];
    }
    if (!activeModule) {
      throw AppError.notFound('No roadmap modules found.');
    }

    const goal = (roadmap as any).learning_goals;
    const completedTopics = modules
      .filter(m => m.status === 'completed')
      .flatMap((m: any) => Array.isArray(m.topics) ? m.topics : []);

    // 3. Check if a quiz already exists for this module (re-use to avoid hammering API)
    const { data: existingQuiz } = await client
      .from('quizzes')
      .select(`
        id, title, max_score, pass_percentage,
        quiz_questions (
          id, question_text, options, correct_option_index, explanation,
          difficulty, topic
        )
      `)
      .eq('module_id', activeModule.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingQuiz && (existingQuiz as any).quiz_questions?.length >= 5) {
      logger.info(`[QuizService] Re-using existing quiz ${existingQuiz.id} for module ${activeModule.id}`);
      return this.formatQuizResponse(existingQuiz, activeModule, goal);
    }

    // 4. Generate a new quiz via Gemini
    const questions = await this.generateQuestions({
      goalTitle: goal?.title || 'Unknown Goal',
      rawGoal: goal?.raw_goal || '',
      skillLevel: goal?.skill_level || 'beginner',
      roadmapTitle: (roadmap as any).title,
      moduleTitle: activeModule.title,
      moduleDescription: activeModule.description,
      topics: Array.isArray(activeModule.topics) ? activeModule.topics : [],
      completedTopics,
      milestoneNumber: activeModule.sequence_number,
    });

    // 5. Persist quiz → quiz_questions
    const quizTitle = `Milestone ${activeModule.sequence_number}: ${activeModule.title} Assessment`;

    const { data: newQuiz, error: quizErr } = await client
      .from('quizzes')
      .insert({
        user_id: userId,
        module_id: activeModule.id,
        title: quizTitle,
        max_score: questions.length,
        pass_percentage: 70,
      })
      .select('id, title, max_score, pass_percentage')
      .single();

    if (quizErr || !newQuiz) {
      throw new AppError('Failed to create quiz', 500);
    }

    // 6. Insert quiz questions — try with metadata columns, fall back without them
    const questionRows = questions.map(q => ({
      quiz_id: newQuiz.id,
      question_text: q.question,
      options: q.options,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    let insertedQuestions: any[] | null = null;

    // First attempt: with difficulty & topic (requires migration 20260718000001)
    const { data: withMeta, error: withMetaErr } = await client
      .from('quiz_questions')
      .insert(questionRows)
      .select('id, question_text, options, correct_option_index, explanation, difficulty, topic');

    if (withMetaErr) {
      logger.warn(`[QuizService] Insert with metadata failed (${withMetaErr.message}), retrying without metadata columns.`);
      // Fallback: insert without optional metadata columns
      const baseRows = questionRows.map(({ difficulty, topic, ...rest }) => rest);
      const { data: withoutMeta, error: withoutMetaErr } = await client
        .from('quiz_questions')
        .insert(baseRows)
        .select('id, question_text, options, correct_option_index, explanation');

      if (withoutMetaErr) {
        logger.error(`[QuizService] Failed to insert questions: ${withoutMetaErr.message}`);
        throw new AppError('Failed to save quiz questions', 500);
      }
      // Reattach metadata from in-memory questions for the response
      insertedQuestions = (withoutMeta || []).map((q: any, i: number) => ({
        ...q,
        difficulty: questions[i]?.difficulty || 'medium',
        topic: questions[i]?.topic || activeModule.title,
      }));
    } else {
      insertedQuestions = withMeta || [];
    }

    const quizWithQuestions = {
      ...newQuiz,
      quiz_questions: insertedQuestions || [],
    };

    return this.formatQuizResponse(quizWithQuestions, activeModule, goal);
  }

  // ── POST /api/quiz/submit ─────────────────────────────────────────────────
  public static async submitQuiz(
    userId: string,
    quizId: string,
    answers: Record<string, number>, // { questionId: selectedIndex }
    token?: string
  ): Promise<SubmitResult> {
    const client = getSupabaseClient(token);

    // 1. Fetch quiz + questions (verify ownership via RLS)
    const { data: quiz, error } = await client
      .from('quizzes')
      .select(`
        id, max_score, pass_percentage,
        quiz_questions (
          id, correct_option_index, explanation, topic
        )
      `)
      .eq('id', quizId)
      .eq('user_id', userId)
      .single();

    if (error || !quiz) {
      throw AppError.notFound('Quiz not found or access denied.');
    }

    const questions: any[] = (quiz as any).quiz_questions || [];

    // 2. Calculate score
    let score = 0;
    const results = questions.map((q: any) => {
      const selectedIndex = answers[q.id] ?? -1;
      const isCorrect = selectedIndex === q.correct_option_index;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        selectedIndex,
        correctIndex: q.correct_option_index,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
      };
    });

    const maxScore = (quiz as any).max_score || questions.length;
    const passPercentage = (quiz as any).pass_percentage || 70;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= passPercentage;

    // 3. Persist attempt
    const { data: attempt, error: attemptErr } = await client
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        passed,
        answers_submitted: answers,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (attemptErr) {
      logger.error(`[QuizService] Failed to save attempt: ${attemptErr.message}`);
      // Non-fatal — still return results
    }

    return {
      attemptId: attempt?.id || '',
      score,
      maxScore,
      passed,
      percentage,
      passPercentage,
      results,
    };
  }

  // ── Gemini question generator ─────────────────────────────────────────────
  private static async generateQuestions(ctx: {
    goalTitle: string;
    rawGoal: string;
    skillLevel: string;
    roadmapTitle: string;
    moduleTitle: string;
    moduleDescription: string;
    topics: string[];
    completedTopics: string[];
    milestoneNumber: number;
  }): Promise<QuizQuestion[]> {
    const genAI = this.getGenAI();

    if (!genAI) {
      logger.warn('[QuizService] GEMINI_API_KEY not set — using fallback quiz generator.');
      return this.buildFallbackQuestions(ctx);
    }

    const topicList = ctx.topics.length > 0 ? ctx.topics.join(', ') : ctx.moduleTitle;
    const completedList = ctx.completedTopics.length > 0
      ? ctx.completedTopics.slice(-6).join(', ')
      : 'None';

    const prompt = `You are an expert technical instructor at SkillVerse, an AI-powered learning platform.

Generate exactly 7 high-quality multiple-choice quiz questions to assess understanding of the following learning milestone.

=== LEARNER CONTEXT ===
Learning Goal: "${ctx.goalTitle}"
Roadmap: "${ctx.roadmapTitle}"
Skill Level: ${ctx.skillLevel}
Current Milestone: Milestone ${ctx.milestoneNumber} — "${ctx.moduleTitle}"
Milestone Description: ${ctx.moduleDescription}
Topics to Test: ${topicList}
Previously Completed Topics: ${completedList}

=== QUESTION REQUIREMENTS ===
- Test understanding of: ${topicList}
- Questions must be specific to the user's learning goal, not generic
- Vary difficulty: 2 easy, 3 medium, 2 hard
- Each question must have exactly 4 answer options
- One correct answer per question (0-based index)
- Provide a clear, educational explanation for the correct answer
- Avoid trick questions — test genuine understanding

=== RESPONSE FORMAT ===
Return ONLY a raw valid JSON array, no markdown, no prose:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_option_index": 0,
    "explanation": "...",
    "difficulty": "easy",
    "topic": "specific topic from the milestone"
  }
]`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();

      // Extract JSON array (strip any markdown fences)
      let cleaned = text;
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) cleaned = arrayMatch[0];

      const parsed: any[] = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Gemini returned empty or invalid quiz array');
      }

      // Validate and sanitise each question
      const valid = ['easy', 'medium', 'hard'];
      const questions: QuizQuestion[] = parsed
        .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4)
        .slice(0, 10) // cap at 10
        .map(q => ({
          question: String(q.question),
          options: q.options.map(String),
          correct_option_index: Math.min(Math.max(Number(q.correct_option_index) || 0, 0), 3),
          explanation: String(q.explanation || ''),
          difficulty: valid.includes(q.difficulty) ? q.difficulty : 'medium',
          topic: String(q.topic || ctx.moduleTitle),
        }));

      if (questions.length < 3) {
        throw new Error(`Only ${questions.length} valid questions returned by Gemini`);
      }

      logger.info(`[QuizService] Gemini generated ${questions.length} questions for: ${ctx.moduleTitle}`);
      return questions;
    } catch (err: any) {
      logger.error(`[QuizService] Gemini failed: ${err.message}. Using fallback.`);
      return this.buildFallbackQuestions(ctx);
    }
  }

  // ── Topic-aware fallback question generator ───────────────────────────────
  private static buildFallbackQuestions(ctx: {
    goalTitle: string;
    moduleTitle: string;
    topics: string[];
    skillLevel: string;
  }): QuizQuestion[] {
    const topic = ctx.topics[0] || ctx.moduleTitle;
    const topic2 = ctx.topics[1] || ctx.topics[0] || ctx.moduleTitle;

    return [
      {
        question: `Which of the following best describes the core purpose of "${topic}" in the context of "${ctx.goalTitle}"?`,
        options: [
          `It provides the foundational structure for ${topic}`,
          `It replaces the need for any other tool or library`,
          `It is only used in legacy systems`,
          `It requires external cloud infrastructure to function`,
        ],
        correct_option_index: 0,
        explanation: `"${topic}" provides the foundational building blocks needed in "${ctx.goalTitle}". Understanding this is essential before advancing to more complex topics.`,
        difficulty: 'easy',
        topic,
      },
      {
        question: `When working with "${topic}" at the ${ctx.skillLevel} level, what is the most important first step?`,
        options: [
          'Jump directly into complex use cases',
          'Set up the correct development environment and understand the core concepts',
          'Skip fundamentals and focus only on deployment',
          'Memorize all API methods before writing any code',
        ],
        correct_option_index: 1,
        explanation: 'Proper environment setup and conceptual grounding prevent common mistakes that compound over time. This is the universally recommended approach for any skill level.',
        difficulty: 'easy',
        topic,
      },
      {
        question: `In the milestone "${ctx.moduleTitle}", which approach correctly demonstrates applying "${topic2}"?`,
        options: [
          `Using ${topic2} only in production environments, never locally`,
          `Applying ${topic2} as a post-processing step after project completion`,
          `Integrating ${topic2} early in the development workflow for validation`,
          `Ignoring ${topic2} until the final milestone`,
        ],
        correct_option_index: 2,
        explanation: `Early integration of "${topic2}" in the workflow allows you to catch issues before they become expensive to fix—a core principle in professional software development.`,
        difficulty: 'medium',
        topic: topic2,
      },
      {
        question: `Which statement about "${ctx.moduleTitle}" is most accurate?`,
        options: [
          'It can only be applied to hobby projects',
          'It requires learning all prerequisites before starting anything',
          'It builds on prior knowledge progressively with hands-on practice',
          'It is completely independent of other milestones in the roadmap',
        ],
        correct_option_index: 2,
        explanation: `The milestone "${ctx.moduleTitle}" is designed to progressively reinforce concepts—each task builds on the previous, making practice the core mechanism for retention.`,
        difficulty: 'medium',
        topic: ctx.moduleTitle,
      },
      {
        question: `What differentiates an ${ctx.skillLevel}-level approach to "${topic}" from a beginner approach?`,
        options: [
          'Using different programming languages entirely',
          'Applying deeper pattern understanding and handling edge cases deliberately',
          'Writing more lines of code',
          'Avoiding documentation and relying on intuition',
        ],
        correct_option_index: 1,
        explanation: `At the ${ctx.skillLevel} level, the focus shifts from "making it work" to "making it work correctly across edge cases"—pattern recognition and intentional design become critical.`,
        difficulty: 'hard',
        topic,
      },
      {
        question: `In the context of "${ctx.goalTitle}", what is the consequence of skipping the practice tasks in "${ctx.moduleTitle}"?`,
        options: [
          'No consequence — theory alone is sufficient',
          'The roadmap automatically adjusts to compensate',
          'Knowledge gaps accumulate and create blockers in later milestones',
          'The AI mentor provides substitutes automatically',
        ],
        correct_option_index: 2,
        explanation: 'Skills in software engineering are procedural — skipping practical application creates accumulating gaps. Later milestones build directly on this one.',
        difficulty: 'medium',
        topic: ctx.moduleTitle,
      },
      {
        question: `Which of the following is the best indicator that you have mastered "${topic2}"?`,
        options: [
          'You can recite its documentation from memory',
          'You have watched all tutorial videos about it',
          'You can apply it to solve a new, unseen problem without referring to examples',
          'You have copied a working example from a project template',
        ],
        correct_option_index: 2,
        explanation: 'Transfer of learning — applying a concept to a novel situation — is the gold standard of mastery. Recall and recognition are necessary but insufficient.',
        difficulty: 'hard',
        topic: topic2,
      },
    ];
  }

  // ── Format DB quiz for API response ──────────────────────────────────────
  private static formatQuizResponse(
    quiz: any,
    module: any,
    goal: any
  ): GeneratedQuiz {
    const questions = (quiz.quiz_questions || []).map((q: any) => ({
      id: q.id,
      question: q.question_text,
      options: Array.isArray(q.options) ? q.options : [],
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      topic: q.topic || module.title,
    }));

    return {
      quizId: quiz.id,
      title: quiz.title,
      moduleId: module.id,
      moduleName: module.title,
      milestoneNumber: module.sequence_number,
      topicsCovered: Array.isArray(module.topics) ? module.topics : [],
      skillLevel: goal?.skill_level || 'beginner',
      questions,
      maxScore: quiz.max_score || questions.length,
      passPercentage: quiz.pass_percentage || 70,
    };
  }
}
