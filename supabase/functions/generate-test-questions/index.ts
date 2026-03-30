import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

type Difficulty = 'easy' | 'medium' | 'hard';

interface GenerateRequestBody {
  topic?: string;
  amount?: number;
  difficulty?: Difficulty;
  content?: string;
  numQuestions?: number;
  subjects?: string[];
  fileUrl?: string;
}

interface GeneratedQuestion {
  id: number;
  context: string | null;
  question: string;
  options: string[];
  answer: string;
  explanation: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeDifficulty = (value?: string): Difficulty => {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }

  return 'medium';
};

const sanitizeAmount = (value?: number) => {
  if (!value || Number.isNaN(value)) return 10;
  return Math.min(Math.max(Math.trunc(value), 1), 30);
};

const extractTextFromFile = async (fileUrl?: string) => {
  if (!fileUrl) return '';

  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error('Não foi possível baixar o arquivo enviado para gerar as questões.');
  }

  const contentType = fileResponse.headers.get('content-type') ?? '';
  if (contentType.includes('application/pdf')) {
    return '';
  }

  const text = await fileResponse.text();
  return text.trim().slice(0, 8000);
};

const buildPrompt = ({
  topic,
  amount,
  difficulty,
  content,
  subjects,
}: {
  topic?: string;
  amount: number;
  difficulty: Difficulty;
  content?: string;
  subjects: string[];
}) => {
  const contextParts = [
    topic ? `Tópico principal: ${topic}` : null,
    subjects.length > 0 ? `Matérias de apoio: ${subjects.join(', ')}` : null,
    content ? `Conteúdo base:\n${content}` : null,
  ].filter(Boolean);

  return [
    `Gere exatamente ${amount} questões de múltipla escolha em português do Brasil.`,
    `Dificuldade: ${difficulty}.`,
    'Use linguagem clara, nível vestibular/ENEM e varie os enunciados.',
    contextParts.length > 0 ? contextParts.join('\n\n') : 'Se não houver contexto, use conhecimentos gerais coerentes com o tema informado.',
    'Responda somente em JSON válido no formato:',
    '{"questions":[{"id":1,"context":"texto opcional","question":"enunciado","options":["A","B","C","D"],"answer":"A","explanation":"explicação curta"}]}',
    'Cada questão deve ter 4 alternativas, exatamente 1 resposta correta e ids numéricos sequenciais.',
    'O campo answer deve conter exatamente o texto de uma das alternativas enviadas em options.',
  ].join('\n\n');
};

const normalizeQuestions = (payload: unknown, expectedAmount: number): GeneratedQuestion[] => {
  const maybeQuestions = Array.isArray(payload)
    ? payload
    : (payload && typeof payload === 'object' && Array.isArray((payload as { questions?: unknown[] }).questions))
      ? (payload as { questions: unknown[] }).questions
      : [];

  const normalized = maybeQuestions
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;

      const question = item as Record<string, unknown>;
      const options = Array.isArray(question.options)
        ? question.options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0)
        : [];
      const answer = typeof question.answer === 'string' ? question.answer.trim() : '';
      const prompt = typeof question.question === 'string' ? question.question.trim() : '';

      if (!prompt || options.length < 2 || !answer || !options.includes(answer)) {
        return null;
      }

      return {
        id: typeof question.id === 'number' ? question.id : index + 1,
        context: typeof question.context === 'string' && question.context.trim().length > 0
          ? question.context.trim()
          : null,
        question: prompt,
        options,
        answer,
        explanation: typeof question.explanation === 'string' && question.explanation.trim().length > 0
          ? question.explanation.trim()
          : null,
      } satisfies GeneratedQuestion;
    })
    .filter((question): question is GeneratedQuestion => question !== null)
    .slice(0, expectedAmount)
    .map((question, index) => ({ ...question, id: index + 1 }));

  if (normalized.length === 0) {
    throw new Error('A IA retornou questões em formato inválido.');
  }

  return normalized;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: 'OPENAI_API_KEY não configurada no ambiente da Edge Function.' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authorization = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Configuração do Supabase ausente no ambiente da Edge Function.' }, 500);
    }

    if (!authorization) {
      return jsonResponse({ error: 'Usuário não autenticado.' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse({ error: 'Usuário não autenticado.' }, 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile?.plan !== 'premium') {
      return jsonResponse({ error: 'Acesso permitido apenas para usuários Premium.' }, 403);
    }

    let body: GenerateRequestBody;
    try {
      body = await req.json() as GenerateRequestBody;
    } catch {
      return jsonResponse({ error: 'Payload inválido. Envie um JSON válido.' }, 400);
    }
    const topic = body.topic?.trim();
    const fileUrl = body.fileUrl?.trim();
    const subjects = Array.isArray(body.subjects)
      ? body.subjects
        .map((subject) => (typeof subject === 'string' ? subject.trim() : ''))
        .filter((subject): subject is string => subject.length > 0)
      : [];
    const amount = sanitizeAmount(body.amount ?? body.numQuestions);
    const difficulty = normalizeDifficulty(body.difficulty);
    let uploadedContent = '';
    try {
      uploadedContent = await extractTextFromFile(fileUrl);
    } catch {
      return jsonResponse({ error: 'Falha ao processar arquivo enviado.' }, 400);
    }
    const content = body.content?.trim() || uploadedContent;

    if (!topic && subjects.length === 0 && !content && !fileUrl) {
      return jsonResponse({ error: 'Informe um assunto, envie um arquivo ou selecione ao menos uma matéria.' }, 400);
    }

    const prompt = buildPrompt({ topic, amount, difficulty, content, subjects });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Você é um professor brasileiro. Gere apenas JSON válido com questões objetivas.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const providerMessage = errorPayload?.error?.message;
      const message = providerMessage
        ? `Falha ao chamar o provedor de IA: ${providerMessage}`
        : 'Falha ao chamar o provedor de IA.';
      return jsonResponse({ error: message }, response.status);
    }

    const completion = await response.json();
    const contentText = completion?.choices?.[0]?.message?.content;

    if (typeof contentText !== 'string' || !contentText.trim()) {
      throw new Error('A resposta do provedor de IA veio vazia.');
    }

    const parsedPayload = JSON.parse(contentText);
    const questions = normalizeQuestions(parsedPayload, amount);

    return jsonResponse({
      questions,
      meta: {
        requestedAmount: amount,
        returnedAmount: questions.length,
        difficulty,
        model: DEFAULT_MODEL,
      },
    });
  } catch (error) {
    console.error('generate-test-questions error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Erro interno ao gerar teste.',
    }, 500);
  }
});
