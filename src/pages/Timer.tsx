
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Clock, Flame, Play, Pause, StopCircle, Trophy, RotateCcw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useTimer } from '@/context/TimerContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import { toast } from '@/components/ui/sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Points per minute of study
const POINTS_PER_MINUTE = 1;

const Timer: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { 
    seconds, 
    isRunning, 
    selectedSubject, 
    selectedGroup,
    setIsRunning,
    setSelectedSubject,
    setSelectedGroup,
    resetTimer
  } = useTimer();
  const { studySessions, subjects, groups, loading, createStudySession, getSubjectsByGroup } = useStudySessions();
  const [pagesRead, setPagesRead] = React.useState('');
  const [exercisesSolved, setExercisesSolved] = React.useState('');
  const [completedSession, setCompletedSession] = React.useState<{ minutes: number; points: number; subject: string } | null>(null);

  // Format time display (HH:MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate earned points based on study time
  const calculatePoints = (durationInSeconds: number) => {
    const minutes = durationInSeconds / 60;
    return Math.floor(minutes * POINTS_PER_MINUTE);
  };
  
  // Handler functions for timer controls
  const handleStart = () => {
    if (!selectedSubject || !selectedGroup) {
      toast.error('Por favor, selecione uma matéria e um grupo antes de iniciar');
      return;
    }
    setIsRunning(true);
    toast.success('Cronômetro iniciado');
  };
  
  const handlePause = () => {
    setIsRunning(false);
    toast.info('Cronômetro pausado');
  };
  
  const handleReset = () => {
    if (!isRunning) {
      resetTimer();
      toast.info('Cronômetro reiniciado');
    } else {
      toast.error('Pause o cronômetro antes de reiniciar');
    }
  };
  
  const handleStop = async () => {
    if (seconds < 60) {
      toast.error('Estude por pelo menos 1 minuto para registrar a sessão');
      return;
    }

    if (!selectedSubject || !selectedGroup) {
      toast.error('Por favor, selecione uma matéria e um grupo antes de salvar');
      return;
    }
    
    setIsRunning(false);

    const parsedPages = parseInt(pagesRead, 10);
    const parsedExercises = parseInt(exercisesSolved, 10);
    const result = await createStudySession(selectedSubject, seconds, selectedGroup, {
      pages: Number.isNaN(parsedPages) ? null : parsedPages,
      exercises: Number.isNaN(parsedExercises) ? null : parsedExercises
    });

    if (result.success) {
      setCompletedSession({
        minutes: Math.floor(seconds / 60),
        points: result.points || calculatePoints(seconds),
        subject: selectedSubject === 'general' ? 'Estudo geral' : (subjects.find(subject => subject.id === selectedSubject)?.name || 'Sua matéria'),
      });
      toast.success(`Sessão de estudo concluída! Você ganhou ${result.points} pontos!`);
      setPagesRead('');
      setExercisesSolved('');
      resetTimer();
    } else {
      console.error('Erro ao salvar sessão:', result.error);
      toast.error(result.error || 'Erro ao salvar sessão de estudo');
    }
  };
  
  const availableSubjects = selectedGroup ? getSubjectsByGroup(selectedGroup) : subjects;

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-study-primary mx-auto mb-2"></div>
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Dialog open={Boolean(completedSession)} onOpenChange={(open) => !open && setCompletedSession(null)}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-primary via-primary/90 to-accent px-6 py-8 text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <CheckCircle2 size={36} aria-hidden="true" />
            </div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-2xl text-white">Sessão concluída!</DialogTitle>
              <DialogDescription className="text-white/80">Cada sessão conta para a sua evolução.</DialogDescription>
            </DialogHeader>
          </div>
          {completedSession && (
            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-primary/5 p-4 text-center">
                  <Clock className="mx-auto mb-2 text-primary" size={21} aria-hidden="true" />
                  <p className="text-2xl font-bold text-foreground">{completedSession.minutes} min</p>
                  <p className="text-xs text-muted-foreground">tempo focado</p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-4 text-center">
                  <Trophy className="mx-auto mb-2 text-amber-500" size={21} aria-hidden="true" />
                  <p className="text-2xl font-bold text-foreground">+{completedSession.points} XP</p>
                  <p className="text-xs text-muted-foreground">conquistados</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">Você estudou {completedSession.subject}.</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Volte à tela Hoje para acompanhar sua meta e escolher o próximo bloco de foco.</p>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button className="w-full" onClick={() => { setCompletedSession(null); window.location.hash = '#/today'; }}>
                  Ver meu progresso <ArrowRight className="ml-2" size={16} />
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setCompletedSession(null)}>
                  Continuar no cronômetro
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <h1 className="text-2xl font-bold mb-6">{t('timer.title')}</h1>
      
      <div className="flex flex-col gap-6">
        {/* Timer controls and display */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>{t('timer.timeElapsed')}</span>
              <span>{calculatePoints(seconds)} {t('timer.points')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <div className="text-5xl font-bold mb-4">{formatTime(seconds)}</div>
              <p className="text-sm text-gray-500">
                {POINTS_PER_MINUTE} {t('timer.pointsPerMinute')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('timer.selectGroup')}</label>
                <Select
                  value={selectedGroup}
                  onValueChange={(value) => {
                    setSelectedGroup(value);
                    setSelectedSubject(''); // Reset subject when group changes
                  }}
                  disabled={isRunning}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('timer.selectGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('timer.selectSubject')}</label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                  disabled={isRunning || !selectedGroup}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('timer.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Estudo Geral</SelectItem>
                    {availableSubjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('timer.pagesRead')}</label>
                  <Input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder={t('timer.optional')}
                    value={pagesRead}
                    onChange={(e) => setPagesRead(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('timer.exercisesSolved')}</label>
                  <Input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder={t('timer.optional')}
                    value={exercisesSolved}
                    onChange={(e) => setExercisesSolved(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {!isRunning ? (
                <Button onClick={handleStart} className="bg-green-500 hover:bg-green-600 flex items-center gap-2">
                  <Play size={18} />
                  {seconds === 0 ? t('timer.start') : t('timer.resume')}
                </Button>
              ) : (
                <Button onClick={handlePause} className="bg-amber-500 hover:bg-amber-600 flex items-center gap-2">
                  <Pause size={18} />
                  {t('timer.pause')}
                </Button>
              )}
              
              <Button onClick={handleStop} className="bg-red-500 hover:bg-red-600 flex items-center gap-2" disabled={seconds === 0}>
                <StopCircle size={18} />
                {t('timer.stop')}
              </Button>
              
              <Button variant="outline" onClick={handleReset} disabled={seconds === 0 || isRunning}>
                <RotateCcw size={18} />
                <span className="sr-only">{t('timer.reset')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Study Session History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('timer.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            {studySessions.length > 0 ? (
              <ScrollArea className="h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('timer.subject')}</TableHead>
                      <TableHead>{t('timer.duration')}</TableHead>
                      <TableHead>{t('timer.points')}</TableHead>
                      <TableHead>{t('timer.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studySessions.map((session) => {
                      const hours = Math.floor(session.duration_minutes / 60);
                      const minutes = session.duration_minutes % 60;
                      
                      return (
                        <TableRow key={session.id}>
                          <TableCell>{session.subject_name}</TableCell>
                          <TableCell>
                            {hours > 0 && `${hours}h `}
                            {minutes}m
                          </TableCell>
                          <TableCell>{session.points}</TableCell>
                          <TableCell>
                            {session.started_at.toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>{t('timer.noSessions')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Timer;
