import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocument } from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type QuestionFormat = 'multiple_choice' | 'open_ended';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GenerateRequestBody {
  mode?: 'random' | 'custom';
  subject?: string;
  topic?: string;
  questionCount?: number;
  numQuestions?: number;
  difficulty?: string;
  types?: unknown;
  formats?: unknown;
  fileContent?: string;
  text?: string;
  fileUrl?: string;
  subjects?: string[];
}

interface NormalizedQuestion {
  id: number;
  context: string | null;
  question: string;
  options?: string[];
  answer: string;
  explanation: string | null;
}

const normalizeDifficulty = (value: string | undefined): Difficulty => {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }

  const lowered = (value || '').toLowerCase();
  if (['fácil', 'facil', 'easy'].includes(lowered)) return 'easy';
  if (['médio', 'medio', 'medium'].includes(lowered)) return 'medium';
  if (['difícil', 'dificil', 'hard'].includes(lowered)) return 'hard';

  return 'medium';
};

const normalizeFormats = (types: unknown, formats: unknown): QuestionFormat[] => {
  const source = Array.isArray(types) ? types : Array.isArray(formats) ? formats : [];

  const normalized = source
    .map((item) => String(item).toLowerCase().trim())
    .map((item) => {
      if (item === 'discursiva' || item === 'discursive') return 'open_ended';
      if (item === 'multiple_choice' || item === 'multipla_escolha' || item === 'multiple') return 'multiple_choice';
      if (item === 'open_ended') return 'open_ended';
      return null;
    })
    .filter((item): item is QuestionFormat => item !== null);

  if (normalized.length === 0) {
    return ['multiple_choice'];
  }

  return Array.from(new Set(normalized));
};

const parseAIResponse = (content: string): unknown => {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1]);
  }

  const firstBracket = content.indexOf('[');
  const lastBracket = content.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const jsonArray = content.slice(firstBracket, lastBracket + 1);
    return JSON.parse(jsonArray);
  }

  return JSON.parse(content);
};

const normalizeQuestions = (raw: unknown, requestedFormats: QuestionFormat[]): NormalizedQuestion[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((q, index) => {
      const item = typeof q === 'object' && q !== null ? q as Record<string, unknown> : {};
      const questionText = String(item.question || '').trim();
      const answerText = String(item.answer || '').trim();

      if (!questionText || !answerText) {
        return null;
      }

      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option).trim()).filter(Boolean)
        : [];

      const shouldBeMultipleChoice = requestedFormats.length === 1
        ? requestedFormats[0] === 'multiple_choice'
        : options.length > 0;

      if (shouldBeMultipleChoice && options.length < 2) {
        return null;
      }

      return {
        id: Number(item.id) > 0 ? Number(item.id) : index + 1,
        context: item.context ? String(item.context) : null,
        question: questionText,
        options: shouldBeMultipleChoice ? options : undefined,
        answer: answerText,
        explanation: item.explanation ? String(item.explanation) : null,
      } satisfies NormalizedQuestion;
    })
    .filter((question): question is NormalizedQuestion => question !== null);
};


const extractTextFromPdf = async (bytes: Uint8Array): Promise<string> => {
  const loadingTask = getDocument({ data: bytes, disableWorker: true });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join('\n').trim();
};

const extractTextFromFileUrl = async (fileUrl: string): Promise<string> => {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo (${response.status}).`);
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isPdf = fileUrl.toLowerCase().includes('.pdf') || contentType.includes('application/pdf');

  if (isPdf) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfText = await extractTextFromPdf(bytes);
    return pdfText.slice(0, 12000);
  }

  const text = await response.text();
  return text.slice(0, 12000);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('generate-test-questions invoked', {
      hasOpenAIApiKey: Boolean(openAIApiKey),
    });

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let body: GenerateRequestBody;
    try {
      body = await req.json() as GenerateRequestBody;
    } catch (_error) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido. Envie JSON com Content-Type: application/json.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const generationMode = body.mode === 'custom' ? 'custom' : 'random';
    const questionCount = Number(body.questionCount ?? body.numQuestions ?? 10);
    const difficulty = normalizeDifficulty(body.difficulty);
    const requestedFormats = normalizeFormats(body.types, body.formats);
    const topicFromPayload = String(body.topic || body.subject || '').trim();
    const topicFromSubjects = Array.isArray(body.subjects)
      ? body.subjects.map((s) => String(s).trim()).filter(Boolean).join(', ')
      : '';
    const topic = topicFromPayload || topicFromSubjects;
    const fileUrl = String(body.fileUrl || '').trim();
    const payloadText = String(body.fileContent || body.text || '').trim();

    let sourceText = payloadText;
    if (fileUrl) {
      try {
        sourceText = await extractTextFromFileUrl(fileUrl);
      } catch (fileError) {
        console.error('File extraction error:', fileError);
        return new Response(
          JSON.stringify({ error: 'Não foi possível processar o arquivo enviado. Verifique se a URL está acessível e o arquivo é válido.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (generationMode === 'custom' && !topic && !sourceText) {
      return new Response(
        JSON.stringify({ error: 'No modo personalizado, informe um assunto específico ou envie um arquivo.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50) {
      return new Response(
        JSON.stringify({ error: 'questionCount deve ser um número inteiro entre 1 e 50.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const prompt = generationMode === 'custom'
      ? `Gere ${questionCount} questões seguindo estritamente a base informada pelo usuário.

BASE OBRIGATÓRIA PARA AS QUESTÕES:
- Assunto/Tópico: ${topic || 'não informado'}
- Conteúdo enviado pelo usuário: ${sourceText ? 'sim (usar como referência principal)' : 'não'}
${sourceText ? `
CONTEÚDO DO USUÁRIO (resuma e use como referência principal):
"""
${sourceText.slice(0, 12000)}
"""` : ''}

REGRAS:
- Não gerar questões aleatórias fora da base fornecida.
- Dificuldade: ${difficulty}
- Formatos solicitados: ${requestedFormats.join(', ')}
- Se "multiple_choice": criar 5 alternativas plausíveis e apenas 1 correta.
- Se "open_ended": não incluir "options".
- Sempre incluir "answer" e "explanation".

RETORNO OBRIGATÓRIO (APENAS array JSON puro, sem markdown, sem ```json e sem texto extra):
[
  {
    "id": 1,
    "context": "string opcional",
    "question": "enunciado",
    "options": ["A", "B", "C", "D", "E"],
    "answer": "resposta correta",
    "explanation": "explicação breve",
    "format": "multiple_choice"
  }
]`
      : `Gere ${questionCount} questões no modo aleatório criativo, usando as matérias base como referência principal.

MATÉRIAS BASE:
- ${topic || 'Geral'}

REGRAS:
- Dificuldade: ${difficulty}
- Formatos solicitados: ${requestedFormats.join(', ')}
- Pode criar contextos variados e criativos dentro das matérias base selecionadas.
- Se "multiple_choice": criar 5 alternativas plausíveis e apenas 1 correta.
- Se "open_ended": não incluir "options".
- Sempre incluir "answer" e "explanation".

RETORNO OBRIGATÓRIO (APENAS array JSON puro, sem markdown, sem \`\`\`json e sem texto extra):
[
  {
    "id": 1,
    "context": "string opcional",
    "question": "enunciado",
    "options": ["A", "B", "C", "D", "E"],
    "answer": "resposta correta",
    "explanation": "explicação breve",
    "format": "multiple_choice"
  }
]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você gera questões educacionais com saída JSON estrita. Responda APENAS com um array JSON puro (sem markdown, sem ```json, sem texto adicional). Proibido inventar base fora do assunto/conteúdo informado pelo usuário.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI error:', errorData);
      console.error('OpenAI request failed with status:', response.status);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns segundos e tente novamente.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos da OpenAI indisponíveis/insuficientes para gerar questões.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Falha de autenticação na OpenAI. Verifique o secret OPENAI_API_KEY.' }),
          {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ error: `OpenAI error: ${errorData.error?.message || 'Unknown error'}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Resposta da IA sem conteúdo utilizável.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let parsedQuestions: unknown;
    try {
      parsedQuestions = parseAIResponse(content);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da IA em JSON válido.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const questions = normalizeQuestions(parsedQuestions, requestedFormats);

    if (questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'A IA não retornou questões válidas para os parâmetros enviados.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        questions,
        meta: {
          topic,
          questionCount,
          difficulty,
          formats: requestedFormats,
          sourceTextProvided: Boolean(sourceText),
          fileUrlProvided: Boolean(fileUrl),
          mode: generationMode,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in generate-test-questions function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
