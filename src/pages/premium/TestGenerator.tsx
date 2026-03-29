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
  testQuestionId?: string;
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
  subject_names: string[];
  latestAttempt?: {
    id: string;
    correct_answers: number;
    total_questions: number;
    score_percentage: number;
    created_at: string;
  } | null;
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
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary>({
    overallAccuracy: null,
    totalTestsTaken: 0,
    bestSubject: null,
    worstSubject: null,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSavingTest, setIsSavingTest] = useState<boolean>(false);
  const [savedTestId, setSavedTestId] = useState<string | null>(null);
  const [loadedAttemptId, setLoadedAttemptId] = useState<string | null>(null);
  
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
      const { data: allTestsData, error: allTestsError } = await supabase
        .from('tests')
        .select('id, subject_names');

      if (allTestsError) throw allTestsError;

      const { data: allAttemptsData, error: allAttemptsError } = await supabase
        .from('test_attempts')
        .select('test_id, correct_answers, total_questions, score_percentage');

      if (allAttemptsError) throw allAttemptsError;

      const testSubjects = new Map((allTestsData || []).map((test) => [
        test.id,
        test.subject_names && test.subject_names.length > 0 ? test.subject_names[0] : 'Sem matéria definida',
      ]));

      const attempts = allAttemptsData || [];
      const totalQuestionsAnswered = attempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
      const totalCorrectAnswers = attempts.reduce((sum, attempt) => sum + attempt.correct_answers, 0);
      const subjectPerformance = new Map<string, { totalScore: number; count: number }>();

      attempts.forEach((attempt) => {
        const subject = testSubjects.get(attempt.test_id) || 'Sem matéria definida';
        const current = subjectPerformance.get(subject) || { totalScore: 0, count: 0 };

        subjectPerformance.set(subject, {
          totalScore: current.totalScore + attempt.score_percentage,
          count: current.count + 1,
        });
      });

      const rankedSubjects = Array.from(subjectPerformance.entries())
        .map(([subject, stats]) => ({
          subject,
          averageScore: stats.totalScore / stats.count,
        }))
        .sort((a, b) => b.averageScore - a.averageScore);

      setPerformanceSummary({
        overallAccuracy: totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : null,
        totalTestsTaken: attempts.length,
        bestSubject: rankedSubjects[0]?.subject || null,
        worstSubject: rankedSubjects[rankedSubjects.length - 1]?.subject || null,
      });

      const { data, error } = await supabase
        .from('tests')
        .select('id, title, difficulty, questions_count, created_at, subject_names')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const tests = data || [];
      if (tests.length === 0) {
        setSavedTests([]);
        return;
      }

      const { data: attemptsData, error: attemptsError } = await supabase
        .from('test_attempts')
        .select('id, test_id, correct_answers, total_questions, score_percentage, created_at')
        .in('test_id', tests.map((test) => test.id))
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      const latestAttempts = new Map<string, SavedTestSummary['latestAttempt']>();
      (attemptsData || []).forEach((attempt) => {
        if (!latestAttempts.has(attempt.test_id)) {
          latestAttempts.set(attempt.test_id, {
            id: attempt.id,
            correct_answers: attempt.correct_answers,
            total_questions: attempt.total_questions,
            score_percentage: attempt.score_percentage,
            created_at: attempt.created_at,
          });
        }
      });

      setSavedTests(
        tests.map((test) => ({
          ...test,
          subject_names: test.subject_names || [],
          latestAttempt: latestAttempts.get(test.id) || null,
        }))
      );
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

      const { data: insertedQuestions, error: questionsError } = await supabase
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
        )
        .select('id, position');

      if (questionsError) throw questionsError;

      const questionIdsByPosition = new Map((insertedQuestions || []).map((item) => [item.position, item.id]));

      setGeneratedTest((prev) => prev?.map((question) => ({
        ...question,
        testQuestionId: questionIdsByPosition.get(question.id),
      })) || prev);
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
        .select('id, position, context, question, options, answer, explanation')
        .eq('test_id', testId)
        .order('position', { ascending: true });

      if (error) throw error;

      const restoredQuestions: GeneratedQuestion[] = (data || []).map((question) => ({
        id: question.position,
        testQuestionId: question.id,
        context: question.context || undefined,
        question: question.question,
        options: Array.isArray(question.options) ? question.options.filter((item): item is string => typeof item === 'string') : [],
        answer: question.answer,
        explanation: question.explanation || undefined,
      }));

      const { data: attempt, error: attemptError } = await supabase
        .from('test_attempts')
        .select('id, correct_answers, total_questions, score_percentage, created_at')
        .eq('test_id', testId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptError) throw attemptError;

      const answersByQuestionId: Record<string, { userAnswer: string; isCorrect: boolean }> = {};

      if (attempt?.id) {
        const { data: answerRows, error: answersError } = await supabase
          .from('test_attempt_answers')
          .select('test_question_id, user_answer, is_correct')
          .eq('attempt_id', attempt.id);

        if (answersError) throw answersError;

        (answerRows || []).forEach((answer) => {
          answersByQuestionId[answer.test_question_id] = {
            userAnswer: answer.user_answer || '',
            isCorrect: answer.is_correct,
          };
        });
      }

      const restoredAnswers = restoredQuestions.reduce<Record<number, string>>((acc, question) => {
        if (!question.testQuestionId) return acc;
        const answer = answersByQuestionId[question.testQuestionId];
        if (answer?.userAnswer) {
          acc[question.id] = answer.userAnswer;
        }
        return acc;
      }, {});

      const restoredDetails = restoredQuestions.map((question) => {
        const persistedAnswer = question.testQuestionId ? answersByQuestionId[question.testQuestionId] : undefined;
        const userAnswer = persistedAnswer?.userAnswer || '';
        const isCorrect = persistedAnswer?.isCorrect ?? userAnswer === question.answer;

        return {
          questionId: question.id,
          isCorrect,
          userAnswer,
          correctAnswer: question.answer || '',
        };
      });

      setGeneratedTest(restoredQuestions);
      setUserAnswers(restoredAnswers);
      setIsCorrected(Boolean(attempt));
      setTestResult(
        attempt
          ? {
              correctCount: attempt.correct_answers,
              totalQuestions: attempt.total_questions,
              score: attempt.score_percentage,
              details: restoredDetails,
            }
          : null
      );
      setSavedTestId(testId);
      setLoadedAttemptId(attempt?.id || null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(attempt ? 'Tentativa carregada para revisão.' : 'Teste carregado do histórico.');
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
  
  const saveAttemptAndResult = async () => {
    if (!generatedTest || !user || !savedTestId) return;

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
    const result: TestResult = {
      correctCount,
      totalQuestions,
      score,
      details
    };

    setTestResult(result);
    setIsCorrected(true);
    
    try {
      const { data: attempt, error: attemptError } = await supabase
        .from('test_attempts')
        .insert({
          test_id: savedTestId,
          user_id: user.id,
          total_questions: totalQuestions,
          correct_answers: correctCount,
          score_percentage: score,
        })
        .select('id')
        .single();

      if (attemptError) throw attemptError;

      const answersPayload = generatedTest
        .filter((question) => question.testQuestionId)
        .map((question) => {
          const detail = details.find((item) => item.questionId === question.id);
          return {
            attempt_id: attempt.id,
            test_question_id: question.testQuestionId as string,
            user_answer: detail?.userAnswer || null,
            is_correct: detail?.isCorrect || false,
          };
        });

      if (answersPayload.length > 0) {
        const { error: answersError } = await supabase
          .from('test_attempt_answers')
          .insert(answersPayload);

        if (answersError) throw answersError;
      }

      setLoadedAttemptId(attempt.id);
      await fetchSavedTests();
      toast.success(t('aiTests.correctionSuccess', { correct: correctCount, total: totalQuestions }));
    } catch (error) {
      console.error('Failed to save attempt:', error);
      toast.error('Teste corrigido, mas não foi possível salvar a tentativa.');
    } finally {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    void saveAttemptAndResult();
  };
  
  const handleCreateNewTest = () => {
    setGeneratedTest(null);
    setUserAnswers({});
    setIsCorrected(false);
    setTestResult(null);
    setSavedTestId(null);
    setLoadedAttemptId(null);
    setTopic('');
    setFileUrl('');
  };
  
  const handleGenerateTest = async () => {
    const selectedSubjects = subjects.filter(s => s.selected);
    const trimmedTopic = topic.trim();
    const normalizedFileUrl = fileUrl.trim();
    const selectedSubjectNames = selectedSubjects
      .map(({ name, id }) => (typeof name === 'string' && name.trim().length > 0 ? name : id))
      .map((subject) => subject.trim())
      .filter((subject) => subject.length > 0);
    
    // Validação: exige assunto ou arquivo
    if (!trimmedTopic && !normalizedFileUrl && selectedSubjectNames.length === 0) {
      toast.error("Forneça um assunto, arquivo ou selecione uma matéria.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log('generate-test-questions payload debug', {
        selectedSubjects,
        selectedSubjectNames,
        topic: trimmedTopic,
        fileUrl: normalizedFileUrl,
      });
      
      const { data, error } = await supabase.functions.invoke('generate-test-questions', {
        body: {
          numQuestions,
          difficulty,
          subjects: selectedSubjectNames,
          topic: trimmedTopic,
          fileUrl: normalizedFileUrl
        }
      });

      if (error) throw error;
      if (!data || !Array.isArray(data.questions)) {
        throw new Error('Resposta inválida do servidor');
      }

      setGeneratedTest(data.questions);
      setSavedTestId(null);
      setLoadedAttemptId(null);
      await saveGeneratedTest(data.questions, selectedSubjectNames);
      toast.success(t('aiTests.generatingSuccess'));
    } catch (error: unknown) {
      console.error('Failed to generate test:', error);

      let errorMessage = error instanceof Error ? error.message : t('aiTests.generatingFailed');
      const maybeError = error as { context?: Response } | null;

      if (maybeError?.context && typeof maybeError.context.json === 'function') {
        try {
          const payload = await maybeError.context.json() as { error?: string };
          if (typeof payload?.error === 'string' && payload.error.trim()) {
            errorMessage = payload.error;
          }
        } catch {
          // mantém mensagem padrão quando não houver payload JSON
        }
      }

      toast.error(errorMessage);
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
              <CardContent className="pt-6">
                <h2 className="font-semibold text-lg mb-4">Desempenho básico</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded border p-3">
                    <p className="text-gray-500">Acerto geral</p>
                    <p className="font-semibold text-study-primary">
                      {performanceSummary.overallAccuracy !== null ? `${performanceSummary.overallAccuracy}%` : '—'}
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-gray-500">Total de testes feitos</p>
                    <p className="font-semibold text-study-primary">{performanceSummary.totalTestsTaken}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-gray-500">Melhor matéria</p>
                    <p className="font-semibold text-study-primary">{performanceSummary.bestSubject || '—'}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-gray-500">Pior matéria</p>
                    <p className="font-semibold text-study-primary">{performanceSummary.worstSubject || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                            {(test.subject_names.length > 0 ? test.subject_names.join(', ') : 'Sem matéria definida')} • {t(`aiTests.difficulties.${test.difficulty}`)} • {new Date(test.created_at).toLocaleString('pt-BR')}
                          </p>
                          {test.latestAttempt ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Nota: {test.latestAttempt.correct_answers}/{test.latestAttempt.total_questions} • {test.latestAttempt.score_percentage}% • Revisado em {new Date(test.latestAttempt.created_at).toLocaleString('pt-BR')}
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1">Ainda não realizado.</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => loadSavedTest(test.id)}>
                          {test.latestAttempt ? 'Revisar' : 'Abrir'}
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
                  <span className="text-sm text-green-600">{loadedAttemptId ? 'Tentativa salva no histórico' : 'Salvo no histórico'}</span>
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
                          <div
                            key={idx}
                            className={`flex items-center space-x-2 p-2 rounded ${
                              isCorrected && option === question.answer
                                ? 'bg-green-100'
                                : isCorrected && userAnswers[question.id] === option && option !== question.answer
                                  ? 'bg-red-100'
                                  : ''
                            }`}
                          >
                            <RadioGroupItem value={option} id={`q${question.id}-o${idx}`} />
                            <Label htmlFor={`q${question.id}-o${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {isCorrected && result && (
                        <div className="space-y-1 text-sm">
                          <p><strong>Sua resposta:</strong> {result.userAnswer || 'Não respondida'}</p>
                          <p><strong>Resposta correta:</strong> {result.correctAnswer}</p>
                        </div>
                      )}

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
