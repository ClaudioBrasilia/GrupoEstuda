import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Difficulty = "easy" | "medium" | "hard";

interface RequestBody {
  numQuestions?: number;
  difficulty?: Difficulty;
  subjects?: string[];
  topic?: string;
  fileContent?: string;
}

interface AiQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
}

interface AiResponse {
  questions: AiQuestion[];
}

const sanitizeJsonResponse = (content: string): string => {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const isValidQuestion = (question: AiQuestion): boolean => {
  const hasValidQuestion = typeof question.question === "string" && question.question.trim().length > 0;
  const hasValidExplanation = typeof question.explanation === "string";
  const hasValidSubject = typeof question.subject === "string" && question.subject.trim().length > 0;
  const hasValidOptions = Array.isArray(question.options)
    && question.options.length === 4
    && question.options.every((option) => typeof option === "string" && option.trim().length > 0);
  const hasValidCorrectAnswer = Number.isInteger(question.correctAnswer)
    && question.correctAnswer >= 0
    && question.correctAnswer <= 3;

  return hasValidQuestion && hasValidExplanation && hasValidSubject && hasValidOptions && hasValidCorrectAnswer;
};

const normalizeQuestion = (question: AiQuestion): AiQuestion => ({
  question: question.question.trim(),
  options: question.options.map((option) => option.trim()),
  correctAnswer: question.correctAnswer,
  explanation: question.explanation.trim(),
  subject: question.subject.trim(),
});

const buildPrompt = (params: {
  numQuestions: number;
  difficulty: Difficulty;
  topic?: string;
  fileContent?: string;
  subjects: string[];
}): string => {
  const { numQuestions, difficulty, topic, fileContent, subjects } = params;
  const topicContext = topic?.trim() ? `Tópico informado: ${topic.trim()}.` : "";
  const subjectsContext = subjects.length > 0 ? `Matérias selecionadas: ${subjects.join(", ")}.` : "";

  const sourceInstruction = fileContent?.trim()
    ? `Fonte primária para criar as questões (PRIORITÁRIA):\n${fileContent.trim()}\nUse o tópico apenas como contexto complementar.`
    : `Use como base o tema informado e as matérias selecionadas. ${topicContext} ${subjectsContext}`;

  return `Crie ${numQuestions} questões de múltipla escolha em português brasileiro.

Dificuldade: ${difficulty}.
${topicContext}
${subjectsContext}

${sourceInstruction}

Regras obrigatórias:
- Retorne EXATAMENTE um objeto JSON com esta estrutura:
{
  "questions": [
    {
      "question": "texto",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "texto",
      "subject": "texto"
    }
  ]
}
- Cada questão deve ter exatamente 4 alternativas.
- correctAnswer deve ser um número inteiro entre 0 e 3.
- Não inclua markdown, comentários ou texto fora do JSON.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY não configurada no Supabase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as RequestBody;
    const numQuestions = Number.isFinite(body.numQuestions) ? Number(body.numQuestions) : 10;
    const difficulty: Difficulty = body.difficulty ?? "medium";
    const subjects = Array.isArray(body.subjects) ? body.subjects.map((subject) => String(subject)) : [];
    const topic = body.topic?.trim();
    const fileContent = body.fileContent?.trim();

    if (!topic && !fileContent) {
      return new Response(
        JSON.stringify({ error: "Informe um assunto ou envie um arquivo .txt/.md para gerar as questões." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (fileContent) {
      console.log(`Gerando questões com arquivo (tamanho: ${fileContent.length} caracteres)`);
    }

    const prompt = buildPrompt({
      numQuestions,
      difficulty,
      topic,
      fileContent,
      subjects,
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um gerador de testes educacionais. Responda APENAS com JSON válido, sem markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      await response.text();
      console.error(`OpenAI error status ${response.status}`);
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar as questões agora. Tente novamente em instantes." }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const completion = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta inválida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      const cleanContent = sanitizeJsonResponse(content);
      const parsed = JSON.parse(cleanContent) as AiResponse;

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Formato inválido");
      }

      const hasInvalidQuestion = parsed.questions.some((question) => !isValidQuestion(question));

      if (hasInvalidQuestion) {
        throw new Error("Questões inválidas");
      }

      const normalizedQuestions = parsed.questions.map(normalizeQuestion);

      return new Response(
        JSON.stringify({ questions: normalizedQuestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (_parseError) {
      return new Response(
        JSON.stringify({ error: "Resposta inválida da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Erro interno ao gerar as questões." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
