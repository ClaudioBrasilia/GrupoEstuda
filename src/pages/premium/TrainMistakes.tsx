import React, { useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

type TrainingBase = 'last-test' | 'all-errors' | 'by-subject';
type TrainingDifficulty = 'easy' | 'medium' | 'hard';

interface MistakeItem {
  id: string;
  subject: string;
  wasCorrected: boolean;
}

const mockMistakes: MistakeItem[] = [
  { id: '1', subject: 'Matemática', wasCorrected: false },
  { id: '2', subject: 'História', wasCorrected: true },
  { id: '3', subject: 'Matemática', wasCorrected: false },
  { id: '4', subject: 'Física', wasCorrected: false },
];

const previousResult = 60;
const currentResultMock = 80;

const TrainMistakes: React.FC = () => {
  const navigate = useNavigate();
  const [trainingBase, setTrainingBase] = useState<TrainingBase>('last-test');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionsCount, setQuestionsCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<TrainingDifficulty>('medium');
  const [hasFinishedTraining, setHasFinishedTraining] = useState(false);

  const hasMistakes = mockMistakes.length > 0;

  const summary = useMemo(() => {
    const total = mockMistakes.length;
    const corrected = mockMistakes.filter((item) => item.wasCorrected).length;
    const accuracy = total > 0 ? Math.round((corrected / total) * 100) : 0;

    const countBySubject = mockMistakes.reduce<Record<string, number>>((acc, item) => {
      acc[item.subject] = (acc[item.subject] || 0) + 1;
      return acc;
    }, {});

    const weakestSubject =
      Object.entries(countBySubject).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return {
      overallAccuracy: accuracy,
      weakestSubject,
      lastResult: `${corrected}/${total}`,
    };
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(mockMistakes.map((item) => item.subject))),
    []
  );

  const improvement = currentResultMock - previousResult;

  const handleStartTraining = () => {
    // TODO: integrar com dados reais de erros salvos / tentativas.
    setHasFinishedTraining(true);
  };

  const handleTrainAgain = () => {
    setHasFinishedTraining(false);
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

        {!hasMistakes ? (
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

            {!hasFinishedTraining ? (
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
            ) : (
              <Card className="border-study-primary/30 bg-study-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-study-primary">Resultado do treino</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded border p-3">
                      <p className="text-sm text-muted-foreground">Resultado anterior</p>
                      <p className="text-lg font-semibold">{previousResult}%</p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-sm text-muted-foreground">Resultado atual</p>
                      <p className="text-lg font-semibold">{currentResultMock}%</p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-sm text-muted-foreground">Melhoria percentual</p>
                      <p className="text-lg font-semibold text-green-600">+{improvement}%</p>
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
