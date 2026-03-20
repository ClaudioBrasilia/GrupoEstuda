
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  selected: boolean;
}

interface GeneratedQuestion {
  id: number;
  context?: string;
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

interface TestResult {
  correctCount: number;
  totalQuestions: number;
  score: number;
  details: Array<{
    questionId: number;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

interface SavedTestSummary {
  id: string;
  title: string;
  difficulty: string;
  questions_count: number;
  created_at: string;
}

const TestGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTest, setGeneratedTest] = useState<GeneratedQuestion[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isCorrected, setIsCorrected] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [savedTests, setSavedTests] = useState<SavedTestSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSavingTest, setIsSavingTest] = useState<boolean>(false);
  const [savedTestId, setSavedTestId] = useState<string | null>(null);
  
  // Novos estados para o modo personalizado
  const [topic, setTopic] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 'portuguese', name: t('groups.subjects.portuguese'), selected: true },
    { id: 'math', name: t('groups.subjects.math'), selected: false },
    { id: 'history', name: t('groups.subjects.history'), selected: false },
    { id: 'geography', name: t('groups.subjects.geography'), selected: false },
    { id: 'physics', name: t('groups.subjects.physics'), selected: false },
    { id: 'chemistry', name: t('groups.subjects.chemistry'), selected: false },
    { id: 'biology', name: t('groups.subjects.biology'), selected: false },
    { id: 'literature', name: t('groups.subjects.literature'), selected: false },
    { id: 'english', name: t('groups.subjects.english'), selected: false },
    { id: 'essay', name: t('groups.subjects.essay'), selected: false },
  ]);

  useEffect(() => {
    if (user?.id && user.plan === 'premium') {
      fetchSavedTests();
    }
  }, [user?.id, user?.plan]);

  const fetchSavedTests = async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('id, title, difficulty, questions_count, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedTests(data || []);
    } catch (error) {
      console.error('Failed to load saved tests:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const buildTestTitle = (selectedSubjectNames: string[]) => {
    if (topic.trim()) return topic.trim();
    if (selectedSubjectNames.length > 0) return selectedSubjectNames.join(', ');
    return 'Simulado personalizado';
  };

  const saveGeneratedTest = async (questions: GeneratedQuestion[], selectedSubjectNames: string[]) => {
    if (!user || questions.length === 0) return null;

    setIsSavingTest(true);
    try {
      const title = buildTestTitle(selectedSubjectNames);

      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          user_id: user.id,
          title,
          topic: topic.trim() || null,
          difficulty,
          subject_names: selectedSubjectNames,
          source_file_url: fileUrl || null,
          questions_count: questions.length,
        })
        .select('id')
        .single();

      if (testError) throw testError;

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(
          questions.map((question, index) => ({
            test_id: test.id,
            position: index + 1,
            context: question.context || null,
            question: question.question,
            options: question.options || [],
            answer: question.answer || '',
            explanation: question.explanation || null,
          }))
        );

      if (questionsError) throw questionsError;

      setSavedTestId(test.id);
      await fetchSavedTests();
      toast.success('Teste salvo no histórico!');
      return test.id;
    } catch (error) {
      console.error('Failed to save generated test:', error);
      toast.error('O teste foi gerado, mas não foi possível salvá-lo no histórico.');
      return null;
    } finally {
      setIsSavingTest(false);
    }
  };

  const loadSavedTest = async (testId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select('position, context, question, options, answer, explanation')
        .eq('test_id', testId)
        .order('position', { ascending: true });

      if (error) throw error;

      const restoredQuestions: GeneratedQuestion[] = (data || []).map((question) => ({
        id: question.position,
        context: question.context || undefined,
        question: question.question,
        options: Array.isArray(question.options) ? question.options.filter((item): item is string => typeof item === 'string') : [],
        answer: question.answer,
        explanation: question.explanation || undefined,
      }));

      setGeneratedTest(restoredQuestions);
      setUserAnswers({});
      setIsCorrected(false);
      setTestResult(null);
      setSavedTestId(testId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Teste carregado do histórico.');
    } catch (error) {
      console.error('Failed to load saved test:', error);
      toast.error('Não foi possível carregar este teste salvo.');
    }
  };
  
  const toggleSubject = (id: string) => {
    setSubjects(subjects.map(subject => 
      subject.id === id ? { ...subject, selected: !subject.selected } : subject
    ));
  };
  
  const handleAnswerChange = (questionId: number, selectedOption: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 1024 * 1024 * 5) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmitTest = () => {
    if (!generatedTest) return;
    
    const unansweredCount = generatedTest.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        t('aiTests.unansweredWarning', { count: unansweredCount })
      );
      if (!confirmSubmit) return;
    }
    
    let correctCount = 0;
    const details = generatedTest.map(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.answer;
      
      if (isCorrect) correctCount++;
      
      return {
        questionId: question.id,
        isCorrect,
        userAnswer: userAnswer || '',
        correctAnswer: question.answer || ''
      };
    });
    
    const totalQuestions = generatedTest.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    
    setTestResult({
      correctCount,
      totalQuestions,
      score,
      details
    });
    
    setIsCorrected(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(t('aiTests.correctionSuccess', { correct: correctCount, total: totalQuestions }));
  };
  
  const handleCreateNewTest = () => {
    setGeneratedTest(null);
    setUserAnswers({});
    setIsCorrected(false);
    setTestResult(null);
    setSavedTestId(null);
    setTopic('');
    setFileUrl('');
  };
  
  const handleGenerateTest = async () => {
    const selectedSubjects = subjects.filter(s => s.selected);
    
    // Validação: exige assunto ou arquivo
    if (!topic && !fileUrl && selectedSubjects.length === 0) {
      toast.error("Forneça um assunto, arquivo ou selecione uma matéria.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const selectedSubjectNames = selectedSubjects.map(s => s.name);
      
      const { data, error } = await supabase.functions.invoke('generate-test-questions', {
        body: {
          numQuestions,
          difficulty,
          subjects: selectedSubjectNames,
          topic,
          fileUrl
        }
      });

      if (error) throw error;
      if (!data || !Array.isArray(data.questions)) {
        throw new Error('Resposta inválida do servidor');
      }

      setGeneratedTest(data.questions);
      setSavedTestId(null);
      await saveGeneratedTest(data.questions, selectedSubjectNames);
      toast.success(t('aiTests.generatingSuccess'));
    } catch (error: unknown) {
      console.error('Failed to generate test:', error);
      toast.error(error instanceof Error ? error.message : t('aiTests.generatingFailed'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (user?.plan !== 'premium') {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-2xl font-bold text-study-primary mb-4">{t('aiTests.premiumFeature')}</h2>
          <p className="mb-8 text-gray-600">Esta funcionalidade está disponível apenas para assinantes Premium.</p>
          <Button onClick={() => navigate('/plans')} className="bg-study-primary">
            {t('aiTests.upgrade')}
          </Button>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="py-8 px-4 max-w-3xl mx-auto">
        {!generatedTest ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-study-primary text-center">{t('aiTests.title')}</h1>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg">Histórico recente</h2>
                    <p className="text-sm text-gray-600">Abra um teste salvo para revisar as questões depois.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchSavedTests} disabled={isLoadingHistory}>
                    {isLoadingHistory ? 'Atualizando...' : 'Atualizar'}
                  </Button>
                </div>

                {savedTests.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {isLoadingHistory ? 'Carregando histórico...' : 'Nenhum teste salvo ainda.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between rounded border p-3 gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{test.title}</p>
                          <p className="text-xs text-gray-500">
                            {test.questions_count} questões • {t(`aiTests.difficulties.${test.difficulty}`)} • {new Date(test.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadSavedTest(test.id)}>
                          Abrir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <div>
                <Label>{t('aiTests.questionsNumber')}: {numQuestions}</Label>
                <Slider
                  value={[numQuestions]}
                  min={5}
                  max={30}
                  step={5}
                  onValueChange={(value) => setNumQuestions(value[0])}
                  className="my-4"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assunto Específico</Label>
                  <Input 
                    placeholder="Ex: Revolução Industrial..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload PDF/TXT</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept=".pdf,.txt" 
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  {fileUrl && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Arquivo pronto</p>}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t('aiTests.selectSubjects')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject.id}
                        checked={subject.selected}
                        onCheckedChange={() => toggleSubject(subject.id)}
                      />
                      <Label htmlFor={subject.id}>{subject.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">{t('aiTests.difficulty')}</Label>
                <RadioGroup value={difficulty} onValueChange={setDifficulty} className="flex space-x-4">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <div key={d} className="flex items-center space-x-2">
                      <RadioGroupItem value={d} id={d} />
                      <Label htmlFor={d}>{t(`aiTests.difficulties.${d}`)}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <Button
                onClick={handleGenerateTest}
                className="w-full bg-study-primary"
                disabled={isGenerating || isUploading}
              >
                {isGenerating ? "Gerando questões..." : t('aiTests.generate')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-study-primary">{t('aiTests.generatedTest')}</h1>
              <div className="flex items-center gap-2">
                {isSavingTest ? (
                  <span className="text-sm text-gray-500">Salvando...</span>
                ) : savedTestId ? (
                  <span className="text-sm text-green-600">Salvo no histórico</span>
                ) : null}
                <Button onClick={handleCreateNewTest} variant="outline" size="sm">
                  Novo Simulado
                </Button>
              </div>
            </div>
            
            {isCorrected && testResult && (
              <Card className="bg-study-primary/5 border-study-primary/20">
                <CardContent className="pt-6 text-center">
                  <h2 className="text-4xl font-bold text-study-primary mb-2">{testResult.score}%</h2>
                  <p className="text-gray-600">
                    Você acertou {testResult.correctCount} de {testResult.totalQuestions} questões
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {generatedTest.map((question, index) => {
                const result = testResult?.details.find(d => d.questionId === question.id);
                return (
                  <Card key={question.id} className={`${isCorrected ? (result?.isCorrect ? 'border-green-500' : 'border-red-500') : ''}`}>
                    <CardContent className="pt-6 space-y-4">
                      {question.context && (
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">{question.context}</p>
                      )}
                      <p className="font-semibold">{index + 1}. {question.question}</p>
                      
                      <RadioGroup
                        value={userAnswers[question.id] || ''}
                        onValueChange={(val) => handleAnswerChange(question.id, val)}
                        disabled={isCorrected}
                        className="space-y-2"
                      >
                        {question.options?.map((option, idx) => (
                          <div key={idx} className={`flex items-center space-x-2 p-2 rounded ${isCorrected && option === question.answer ? 'bg-green-100' : ''}`}>
                            <RadioGroupItem value={option} id={`q${question.id}-o${idx}`} />
                            <Label htmlFor={`q${question.id}-o${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {isCorrected && question.explanation && (
                        <div className="mt-4 p-3 bg-blue-50 text-sm rounded">
                          <strong>Explicação:</strong> {question.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!isCorrected && (
              <Button onClick={handleSubmitTest} className="w-full bg-study-primary h-12 text-lg">
                Finalizar e Corrigir
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TestGenerator;
