import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Lovable AI key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Padronizando para os nomes solicitados
    const { questionCount, difficulty, subject, fileContent } = await req.json();
    
    // Validação obrigatória: subject ou fileContent deve estar presente
    if (!subject && !fileContent) {
      return new Response(
        JSON.stringify({ error: 'Erro: É necessário fornecer um assunto ou o conteúdo de um arquivo.' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let contextSource = "";
    if (fileContent && fileContent.trim() !== "") {
      contextSource = `BASEADO NO SEGUINTE CONTEÚDO DE ARQUIVO:\n\n${fileContent}`;
    } else {
      contextSource = `SOBRE O SEGUINTE ASSUNTO: ${subject}`;
    }

    const prompt = `Crie ${questionCount} questões de múltipla escolha ${contextSource}.

ESPECIFICAÇÕES:
- Dificuldade: ${difficulty}
- Estilo: ENEM/Vestibulares (FUVEST, UNICAMP, UFRJ)/Concursos brasileiros recentes
- Ano base: 2020-2024 (use temas e formatos de provas recentes)
- Cada questão deve ter:
  * Texto contextualizador quando aplicável (trecho de notícia, texto literário, gráfico descrito, etc.)
  * Enunciado claro e direto
  * 5 alternativas (A, B, C, D, E)
  * Apenas UMA resposta correta
  
TEMAS PRIORITÁRIOS (quando aplicável):
- Atualidades e acontecimentos recentes no Brasil e mundo (2020-2024)
- Interdisciplinaridade (conectar diferentes áreas do conhecimento)
- Problemas reais, contextualizados e aplicáveis
- Interpretação de textos, gráficos, dados, charges

Formato JSON:
[
  {
    "id": 1,
    "context": "Texto contextualizador aqui (opcional mas recomendado, 2-4 linhas)",
    "question": "Enunciado da questão",
    "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"],
    "answer": "Alternativa correta (texto completo da alternativa)",
    "explanation": "Breve explicação da resposta correta (1-2 frases)"
  }
]`;

    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um professor especialista em criar questões de múltipla escolha no estilo ENEM, vestibulares (FUVEST, UNICAMP, UFRJ, etc.) e concursos públicos brasileiros.

DIRETRIZES OBRIGATÓRIAS:
- Se houver um conteúdo de arquivo fornecido, gere as questões EXCLUSIVAMENTE baseadas nele.
- Se houver apenas um assunto, gere questões aprofundadas sobre esse tema específico.
- Use contextualização: textos literários, jornalísticos, charges, gráficos descritos, dados estatísticos.
- Evite questões puramente decorativas; priorize raciocínio, interpretação e análise crítica.
- Use linguagem clara, formal e acadêmica típica do ENEM.
- Todas as 5 alternativas devem ser plausíveis e bem elaboradas.
- A resposta correta deve ser única e indiscutível.
- Inclua sempre uma breve explicação da resposta.

Retorne APENAS o array JSON, sem texto adicional, markdown ou comentários.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lovable AI error:', errorData);
      
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
          JSON.stringify({ error: 'Créditos Lovable AI esgotados. Adicione créditos em Settings -> Workspace -> Usage.' }), 
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Lovable AI error: ${errorData.error?.message || 'Unknown error'}` }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedQuestions;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       content.match(/\[([\s\S]*)\]/);
                       
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedQuestions = JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON parsing error:', e, 'Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da IA' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const formattedQuestions = Array.isArray(parsedQuestions) 
      ? parsedQuestions.map((q, index) => ({
          id: q.id || index + 1,
          context: q.context || null,
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D', 'E'],
          answer: q.answer || '',
          explanation: q.explanation || null
        })) 
      : [];

    return new Response(
      JSON.stringify({ questions: formattedQuestions }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in generate-test-questions function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
