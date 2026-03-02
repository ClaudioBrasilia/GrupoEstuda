import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { numQuestions, difficulty, subjects, topic, fileUrl } = await req.json();
    
    // Validação: exige algum contexto
    if ((!subjects || subjects.length === 0) && !topic && !fileUrl) {
      return new Response(
        JSON.stringify({ error: 'Forneça um assunto, tópico ou arquivo para gerar as questões.' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedText = '';
    if (fileUrl) {
      console.log('Downloading file from:', fileUrl);
      const fileResponse = await fetch(fileUrl);
      if (fileResponse.ok) {
        // Se for PDF, idealmente usaríamos um parser, mas como fallback/simplificação
        // vamos tratar como texto se for .txt ou tentar extrair o que for possível.
        // Nota: Para PDF real em Deno, costuma-se usar bibliotecas específicas.
        extractedText = await fileResponse.text();
        // Limitar tamanho do texto para o prompt
        extractedText = extractedText.substring(0, 8000);
      }
    }

    const contextParts = [];
    if (subjects && subjects.length > 0) contextParts.push(`Matérias: ${subjects.join(", ")}`);
    if (topic) contextParts.push(`Tópico específico: ${topic}`);
    if (extractedText) contextParts.push(`Conteúdo base: ${extractedText}`);

    const prompt = `Crie exatamente ${numQuestions} questões de múltipla escolha baseadas no seguinte contexto:
${contextParts.join("\n")}

REGRAS:
- Dificuldade: ${difficulty}
- Estilo: ENEM/Vestibulares brasileiros recentes.
- Responda APENAS com um array JSON puro.
- NÃO use blocos de código markdown (\`\`\`json).
- Cada questão deve ter: id, context (2-4 linhas), question, options (array com 5), answer (texto da correta), explanation.

Formato esperado:
[{"id":1,"context":"...","question":"...","options":["..."],"answer":"...","explanation":"..."}]`;

    console.log('Calling OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um professor especialista em exames brasileiros. Responda apenas com JSON puro, sem markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: `OpenAI Error: ${errorData.error?.message || 'Unknown error'}` }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;
    
    if (!content) throw new Error('No content in AI response');

    let parsedData;
    try {
      parsedData = JSON.parse(content);
      if (!Array.isArray(parsedData) && parsedData.questions) {
        parsedData = parsedData.questions;
      }
    } catch (e) {
      console.error('Parsing error:', e, content);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar JSON da IA' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const formattedQuestions = Array.isArray(parsedData) 
      ? parsedData.map((q, index) => ({
          id: q.id || index + 1,
          context: q.context || null,
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          answer: q.answer || '',
          explanation: q.explanation || null
        })).filter(q => q.question && q.options.length > 0)
      : [];

    return new Response(
      JSON.stringify({ 
        questions: formattedQuestions,
        meta: { totalGenerated: formattedQuestions.length }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
