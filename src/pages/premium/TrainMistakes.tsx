import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

type TrainingBase = 'last-test' | 'all-errors' | 'by-subject';
type TrainingDifficulty = 'easy' | 'medium' | 'hard';

interface TrainingQuestion {
  testQuestionId: string;
  testId: string;
  question: string;
  options: string[];
  answer: string;
  subject: string;
  sourceAttemptId: string;
  sourceAttemptCreatedAt: string;
  previousIsCorrect: boolean;
}

interface Summary {
  overallAccuracy: number;
  weakestSubject: string;
  lastResult: string;
  lastAttemptId: string | null;
}

interface AttemptData {
  id: string;
  test_id: string;
  correct_answers: number;
  total_questions: number;
  score_percentage: number;
  created_at: string;
}

interface MistakeRecord {
  attempt_id: string;
  test_question_id: string;
  is_correct: boolean;
  test_questions: {
    id: string;
    question: string;
    answer: string;
    options: unknown;
    test_id: string;
  } | null;
}

interface TrainingResult {
  previousResult: number;
  currentResult: number;
  improvement: number;
  correctCount: number;
  totalQuestions: number;
}

interface MistakeItem {
  id: string;
  subject: string;
  testQuestionId: string;
  testId: string;
  question: string;
  answer: string;
  options: string[];
  sourceAttemptId: string;
  sourceAttemptCreatedAt: string;
  difficulty: string;
  previousIsCorrect: boolean;
}

const TrainMistakes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainingBase, setTrainingBase] = useState<TrainingBase>('last-test');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionsCount, setQuestionsCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<TrainingDifficulty>('medium');
  const [allMistakes, setAllMistakes] = useState<MistakeItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    overallAccuracy: 0,
    weakestSubject: '—',
    lastResult: '—',
    lastAttemptId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [trainingQuestions, setTrainingQuestions] = useState<TrainingQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [hasStartedTraining, setHasStartedTraining] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);

  useEffect(() => {
    const loadTrainData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data: attempts, error: attemptsError } = await supabase
          .from('test_attempts')
          .select('id, test_id, correct_answers, total_questions, score_percentage, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (attemptsError) throw attemptsError;

        const attemptRows = (attempts || []) as AttemptData[];

        if (attemptRows.length === 0) {
          setAllMistakes([]);
          setSummary({
            overallAccuracy: 0,
            weakestSubject: '—',
            lastResult: '—',
            lastAttemptId: null,
          });
          return;
        }

        const testIds = Array.from(new Set(attemptRows.map((attempt) => attempt.test_id)));
        const { data: testsData, error: testsError } = await supabase
          .from('tests')
          .select('id, subject_names, difficulty')
          .in('id', testIds);

        if (testsError) throw testsError;

        const testsById = new Map(
          (testsData || []).map((test) => [
            test.id,
            {
              subject: test.subject_names?.[0] || 'Sem matéria definida',
              difficulty: test.difficulty || 'medium',
            },
          ])
        );

        const totalQuestions = attemptRows.reduce((sum, attempt) => sum + attempt.total_questions, 0);
        const totalCorrect = attemptRows.reduce((sum, attempt) => sum + attempt.correct_answers, 0);

        const subjectPerformance = new Map<string, { scoreSum: number; count: number }>();
        attemptRows.forEach((attempt) => {
          const subject = testsById.get(attempt.test_id)?.subject || 'Sem matéria definida';
          const current = subjectPerformance.get(subject) || { scoreSum: 0, count: 0 };
          subjectPerformance.set(subject, {
            scoreSum: current.scoreSum + attempt.score_percentage,
            count: current.count + 1,
          });
        });

        const weakestSubject =
          Array.from(subjectPerformance.entries())
            .map(([subject, stats]) => ({ subject, avg: stats.scoreSum / stats.count }))
            .sort((a, b) => a.avg - b.avg)[0]?.subject || '—';

        const lastAttempt = attemptRows[0];
        setSummary({
          overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
          weakestSubject,
          lastResult: `${lastAttempt.correct_answers}/${lastAttempt.total_questions}`,
          lastAttemptId: lastAttempt.id,
        });

        const attemptIds = attemptRows.map((attempt) => attempt.id);
        const { data: mistakesData, error: mistakesError } = await supabase
          .from('test_attempt_answers')
          .select('attempt_id, test_question_id, is_correct, test_questions(id, question, answer, options, test_id)')
          .in('attempt_id', attemptIds)
          .eq('is_correct', false);

        if (mistakesError) throw mistakesError;

        const attemptsById = new Map(attemptRows.map((attempt) => [attempt.id, attempt]));
        const uniqueMistakes = new Map<string, MistakeItem>();

        (mistakesData as MistakeRecord[] || []).forEach((item) => {
          const question = item.test_questions;
          if (!question) return;
          const attempt = attemptsById.get(item.attempt_id);
          if (!attempt) return;

          const existing = uniqueMistakes.get(item.test_question_id);
          if (existing && new Date(existing.sourceAttemptCreatedAt) > new Date(attempt.created_at)) {
            return;
          }

          uniqueMistakes.set(item.test_question_id, {
            id: question.id,
            testQuestionId: question.id,
            testId: question.test_id,
            subject: testsById.get(question.test_id)?.subject || 'Sem matéria definida',
            question: question.question,
            answer: question.answer,
            options: Array.isArray(question.options)
              ? question.options.filter((option): option is string => typeof option === 'string')
              : [],
            sourceAttemptId: item.attempt_id,
            sourceAttemptCreatedAt: attempt.created_at,
            difficulty: testsById.get(question.test_id)?.difficulty || 'medium',
            previousIsCorrect: false,
          });
        });

        setAllMistakes(Array.from(uniqueMistakes.values()));
      } catch (error) {
        console.error('Failed to load mistakes data:', error);
        toast.error('Não foi possível carregar os dados de treino de erros.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadTrainData();
  }, [user?.id]);

  const hasMistakes = allMistakes.length > 0;

  const subjects = useMemo(
    () => Array.from(new Set(allMistakes.map((item) => item.subject))),
    [allMistakes]
  );

  const handleStartTraining = () => {
    const filteredByBase = allMistakes.filter((item) => {
      if (trainingBase === 'last-test') return item.sourceAttemptId === summary.lastAttemptId;
      if (trainingBase === 'by-subject' && selectedSubject !== 'all') return item.subject === selectedSubject;
      return true;
    });

    const filteredByDifficulty = filteredByBase.filter((item) => item.difficulty === difficulty);
    const source = filteredByDifficulty.length > 0 ? filteredByDifficulty : filteredByBase;
    const selected = source.slice(0, questionsCount);

    if (selected.length === 0) {
      toast.error('Nenhuma questão encontrada para este filtro.');
      return;
    }

    setTrainingQuestions(
      selected.map((item) => ({
        testQuestionId: item.testQuestionId,
        testId: item.testId,
        question: item.question,
        options: item.options,
        answer: item.answer,
        subject: item.subject,
        sourceAttemptId: item.sourceAttemptId,
        sourceAttemptCreatedAt: item.sourceAttemptCreatedAt,
        previousIsCorrect: item.previousIsCorrect,
      }))
    );
    setUserAnswers({});
    setResult(null);
    setHasStartedTraining(true);
  };

  const handleTrainAgain = () => {
    setHasStartedTraining(false);
    setTrainingQuestions([]);
    setUserAnswers({});
    setResult(null);
  };

  const handleSubmitTraining = () => {
    if (trainingQuestions.length === 0) return;

    const unanswered = trainingQuestions.filter((question) => !userAnswers[question.testQuestionId]).length;
    if (unanswered > 0) {
      const confirmSubmit = window.confirm(`Você deixou ${unanswered} questão(ões) sem resposta. Deseja continuar?`);
      if (!confirmSubmit) return;
    }

    const correctCount = trainingQuestions.reduce((acc, question) => {
      return acc + (userAnswers[question.testQuestionId] === question.answer ? 1 : 0);
    }, 0);
    const total = trainingQuestions.length;
    const currentResult = Math.round((correctCount / total) * 100);
    const previousCorrect = trainingQuestions.reduce((acc, question) => acc + (question.previousIsCorrect ? 1 : 0), 0);
    const previousResult = Math.round((previousCorrect / total) * 100);
    const improvement = currentResult - previousResult;

    setResult({
      previousResult,
      currentResult,
      improvement,
      correctCount,
      totalQuestions: total,
    });
  };

  return (
    <PageLayout>
      <div className="py-8 px-4 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-study-primary">Treinar meus erros</h1>
          <p className="text-sm text-muted-foreground">
            Revise seus pontos fracos com foco nas questões que você errou.
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Carregando seus dados de treino...</p>
            </CardContent>
          </Card>
        ) : !hasMistakes ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <p className="font-medium">Você ainda não tem erros salvos para treinar.</p>
              <p className="text-sm text-muted-foreground">
                Faça um teste primeiro e volte aqui para praticar seus erros.
              </p>
              <Button variant="outline" onClick={() => navigate('/generate-test')}>
                Ir para gerador de testes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Taxa de acerto geral</p>
                  <p className="text-xl font-semibold text-study-primary">{summary.overallAccuracy}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Matéria mais fraca</p>
                  <p className="text-xl font-semibold text-study-primary">{summary.weakestSubject}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Último resultado</p>
                  <p className="text-xl font-semibold text-study-primary">{summary.lastResult}</p>
                </CardContent>
              </Card>
            </div>

            {!hasStartedTraining ? (
              <>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h2 className="font-semibold">Base do treino</h2>
                    <RadioGroup
                      value={trainingBase}
                      onValueChange={(value) => setTrainingBase(value as TrainingBase)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="last-test" id="last-test" />
                        <Label htmlFor="last-test">Último teste</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all-errors" id="all-errors" />
                        <Label htmlFor="all-errors">Todos os erros</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="by-subject" id="by-subject" />
                        <Label htmlFor="by-subject">Por matéria</Label>
                      </div>
                    </RadioGroup>

                    {trainingBase === 'by-subject' && (
                      <div className="space-y-2">
                        <Label>Selecionar matéria</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha a matéria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {subjects.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h2 className="font-semibold">Configuração</h2>
                    <div className="space-y-2">
                      <Label>Número de questões</Label>
                      <RadioGroup
                        value={String(questionsCount)}
                        onValueChange={(value) => setQuestionsCount(Number(value))}
                        className="flex gap-6"
                      >
                        {['5', '10', '15'].map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`count-${value}`} />
                            <Label htmlFor={`count-${value}`}>{value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Dificuldade</Label>
                      <RadioGroup
                        value={difficulty}
                        onValueChange={(value) => setDifficulty(value as TrainingDifficulty)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="easy" id="diff-easy" />
                          <Label htmlFor="diff-easy">Fácil</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="diff-medium" />
                          <Label htmlFor="diff-medium">Médio</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hard" id="diff-hard" />
                          <Label htmlFor="diff-hard">Difícil</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleStartTraining} className="w-full bg-study-primary h-11">
                  Treinar meus erros
                </Button>
              </>
            ) : !result ? (
              <>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <h2 className="font-semibold">Responda as questões</h2>
                    {trainingQuestions.map((question, index) => (
                      <div key={question.testQuestionId} className="space-y-2 rounded border p-4">
                        <p className="text-xs text-muted-foreground">
                          Questão {index + 1} • {question.subject}
                        </p>
                        <p className="font-medium">{question.question}</p>
                        <RadioGroup
                          value={userAnswers[question.testQuestionId] || ''}
                          onValueChange={(value) =>
                            setUserAnswers((prev) => ({ ...prev, [question.testQuestionId]: value }))
                          }
                          className="space-y-2"
                        >
                          {question.options.map((option) => (
                            <div key={`${question.testQuestionId}-${option}`} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${question.testQuestionId}-${option}`} />
                              <Label htmlFor={`${question.testQuestionId}-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitTraining} className="flex-1 bg-study-primary">
                    Finalizar treino
                  </Button>
                  <Button variant="outline" onClick={handleTrainAgain}>
                    Voltar
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-study-primary/30 bg-study-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-study-primary">Resultado do treino</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded border p-3">
                      <p className="text-sm text-muted-foreground">Resultado anterior</p>
                      <p className="text-lg font-semibold">{result.previousResult}%</p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-sm text-muted-foreground">Resultado atual</p>
                      <p className="text-lg font-semibold">
                        {result.correctCount}/{result.totalQuestions} ({result.currentResult}%)
                      </p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-sm text-muted-foreground">Melhoria percentual</p>
                      <p className={`text-lg font-semibold ${result.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.improvement >= 0 ? '+' : ''}
                        {result.improvement}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleTrainAgain}>Treinar novamente</Button>
                    <Button variant="outline" onClick={() => navigate('/generate-test')}>
                      Ver revisão
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                      Voltar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default TrainMistakes;
