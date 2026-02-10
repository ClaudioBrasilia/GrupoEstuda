
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
import { CheckCircle, XCircle } from 'lucide-react';

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
  };
  
  const handleReviewWrong = () => {
    if (!testResult) return;
    const firstWrong = testResult.details.find(d => !d.isCorrect);
    if (firstWrong) {
      const element = document.querySelector(`[data-question-id="${firstWrong.questionId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  useEffect(() => {
    if (generatedTest) {
      const invalidQuestions = generatedTest.filter(q => !q.answer || !q.options);
      if (invalidQuestions.length > 0) {
        console.error('Questões inválidas:', invalidQuestions);
        toast.error(t('aiTests.invalidQuestions'));
      }
    }
  }, [generatedTest, t]);
  
  // Check if this is a premium feature and user doesn't have access
  if (user?.plan !== 'premium') {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-2xl font-bold text-study-primary mb-4">{t('aiTests.premiumFeature')}</h2>
          <p className="mb-8 text-gray-600">This feature is only available to premium subscribers.</p>
          <Button onClick={() => navigate('/plans')} className="bg-study-primary">
            {t('aiTests.upgrade')}
          </Button>
        </div>
      </PageLayout>
    );
  }
  
  const handleGenerateTest = async () => {
    const selectedSubjects = subjects.filter(s => s.selected);
    if (selectedSubjects.length === 0) {
      toast.error(t('aiTests.selectAtLeastOne'));
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const selectedSubjectNames = selectedSubjects.map(s => s.name);
      
      const { data, error } = await supabase.functions.invoke('generate-test-questions', {
        body: {
          numQuestions,
          difficulty,
          subjects: selectedSubjectNames
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        
        // Detectar erros específicos do Lovable AI
        let errorMessage = 'Erro ao gerar questões. Tente novamente.';
        
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
          errorMessage = '⏳ Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
        } else if (error.message?.includes('402') || error.message?.toLowerCase().includes('créditos')) {
          errorMessage = '💳 Créditos Lovable AI esgotados. Adicione créditos em Settings -> Workspace -> Usage.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!data || !data.questions) {
        throw new Error('Resposta inválida do servidor');
      }

      setGeneratedTest(data.questions);
      toast.success(t('aiTests.generatingSuccess'));
    } catch (error) {
      console.error('Failed to generate test:', error);
      toast.error(error instanceof Error ? error.message : t('aiTests.generatingFailed'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="py-8 px-4 max-w-3xl mx-auto">
        {!generatedTest ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-study-primary text-center">{t('aiTests.title')}</h1>
            
            <div className="space-y-4">
              <div>
                <Label>{t('aiTests.questionsNumber')}: {numQuestions}</Label>
                <Slider
                  value={[numQuestions]}
                  min={5}
                  max={50}
                  step={5}
                  onValueChange={(value) => setNumQuestions(value[0])}
                  className="my-4"
                />
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy">{t('aiTests.difficulties.easy')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">{t('aiTests.difficulties.medium')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard">{t('aiTests.difficulties.hard')}</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button
                onClick={handleGenerateTest}
                className="w-full bg-study-primary"
                disabled={isGenerating || subjects.filter(s => s.selected).length === 0}
              >
                {isGenerating ? t('aiTests.generating') : t('aiTests.generate')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-study-primary">{t('aiTests.generatedTest')}</h1>
              <Button 
                onClick={handleCreateNewTest} 
                variant="outline"
              >
                {t('aiTests.createAnother')}
              </Button>
            </div>
            
            {/* Result Summary Card */}
            {isCorrected && testResult && (
              <Card className="border-2 border-primary animate-fade-in">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-primary">
                      {t('aiTests.yourScore')}: {testResult.score}%
                    </h2>
                    <div className="flex justify-center gap-8 text-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-semibold">
                          {testResult.correctCount} {t('aiTests.correct')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600 font-semibold">
                          {testResult.totalQuestions - testResult.correctCount} {t('aiTests.wrong')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground">
                      {testResult.score >= 80 && t('aiTests.messages.excellent')}
                      {testResult.score >= 60 && testResult.score < 80 && t('aiTests.messages.good')}
                      {testResult.score >= 40 && testResult.score < 60 && t('aiTests.messages.improving')}
                      {testResult.score < 40 && t('aiTests.messages.keepTrying')}
                    </p>
                    
                    {testResult.correctCount < testResult.totalQuestions && (
                      <Button 
                        variant="outline" 
                        onClick={handleReviewWrong}
                      >
                        {t('aiTests.reviewWrong')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Progress Bar */}
            {!isCorrected && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('aiTests.progress')}: {Object.keys(userAnswers).length} / {generatedTest.length} {t('aiTests.questionsAnswered')}
                </p>
                <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(Object.keys(userAnswers).length / generatedTest.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Questions */}
            <div className="space-y-4">
              {generatedTest.map((question) => {
                const questionResult = testResult?.details.find(d => d.questionId === question.id);
                const isCorrect = questionResult?.isCorrect;
                const userAnswer = userAnswers[question.id];
                
                return (
                  <Card 
                    key={question.id} 
                    data-question-id={question.id}
                    className={`overflow-hidden transition-all ${
                      isCorrected 
                        ? isCorrect 
                          ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950' 
                          : 'border-2 border-red-500 bg-red-50 dark:bg-red-950'
                        : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Context (if exists) */}
                        {question.context && (
                          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4 text-sm border border-blue-200 dark:border-blue-800">
                            <p className="text-blue-900 dark:text-blue-100 italic leading-relaxed">
                              {question.context}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium flex-1">
                            {question.id}. {question.question}
                          </p>
                          {isCorrected && (
                            <span className="text-2xl flex-shrink-0">
                              {isCorrect ? '✅' : '❌'}
                            </span>
                          )}
                        </div>
                        
                        {question.options && (
                          <RadioGroup
                            value={userAnswers[question.id] || ''}
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                            disabled={isCorrected}
                          >
                            <div className="space-y-2">
                              {question.options.map((option, index) => {
                                const isUserAnswer = userAnswer === option;
                                const isCorrectAnswer = question.answer === option;
                                
                                return (
                                  <div 
                                    key={index} 
                                    className={`flex items-center space-x-2 p-3 rounded-md transition-colors ${
                                      isCorrected
                                        ? isCorrectAnswer
                                          ? 'bg-green-100 dark:bg-green-900 border border-green-400'
                                          : isUserAnswer && !isCorrect
                                            ? 'bg-red-100 dark:bg-red-900 border border-red-400'
                                            : ''
                                        : 'hover:bg-muted'
                                    }`}
                                  >
                                    <RadioGroupItem 
                                      value={option} 
                                      id={`q${question.id}_opt${index}`}
                                    />
                                    <Label 
                                      htmlFor={`q${question.id}_opt${index}`}
                                      className="flex-1 cursor-pointer"
                                    >
                                      {option}
                                      {isCorrected && isCorrectAnswer && (
                                        <span className="ml-2 text-green-700 dark:text-green-300 font-semibold">
                                          ({t('aiTests.correctAnswer')})
                                        </span>
                                      )}
                                      {isCorrected && isUserAnswer && !isCorrect && (
                                        <span className="ml-2 text-red-700 dark:text-red-300 font-semibold">
                                          ({t('aiTests.yourAnswer')})
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </RadioGroup>
                        )}
                        
                        {/* Explanation (show after correction) */}
                        {isCorrected && question.explanation && (
                          <div className="mt-4 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-700 dark:text-gray-300">
                              <strong className="text-primary">💡 Explicação:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              {!isCorrected && (
                <Button 
                  className="bg-primary"
                  onClick={handleSubmitTest}
                  disabled={Object.keys(userAnswers).length === 0}
                >
                  {t('aiTests.submitAnswers')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TestGenerator;
