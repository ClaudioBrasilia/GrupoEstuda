
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Upload, FileText, X } from 'lucide-react';

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
  
  const [subject, setSubject] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
    setSubject('');
    setSelectedFile(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx')) {
        toast.error("Formato de arquivo não suportado. Use PDF, DOCX ou TXT.");
        return;
      }
      
      setSelectedFile(file);
      setSubject(''); 
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleGenerateTest = async () => {
    const trimmedSubject = subject.trim();
    
    // Validação rigorosa antes de prosseguir
    if (!trimmedSubject && !selectedFile) {
      alert("Digite um assunto ou envie um arquivo");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      let fileContent = "";
      
      if (selectedFile) {
        if (selectedFile.type === 'text/plain') {
          fileContent = await selectedFile.text();
        } else {
          setIsUploading(true);
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('study-activities')
            .upload(fileName, selectedFile);
            
          if (uploadError) throw uploadError;
          fileContent = `[Arquivo enviado: ${selectedFile.name}]`;
          setIsUploading(false);
        }
      }
      
      const payload = {
        questionCount: numQuestions,
        difficulty: difficulty,
        subject: selectedFile ? "" : trimmedSubject,
        fileContent: fileContent
      };

      // Log do payload conforme solicitado
      console.log("Payload enviado:", payload);
      
      const { data, error } = await supabase.functions.invoke('generate-test-questions', {
        body: payload
      });

      if (error) throw error;
      if (!data || !data.questions) throw new Error('Resposta inválida do servidor');

      setGeneratedTest(data.questions);
      toast.success("Teste gerado com sucesso!");
    } catch (error) {
      console.error('Failed to generate test:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar teste");
    } finally {
      setIsGenerating(false);
      setIsUploading(false);
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
            
            <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
              <div>
                <Label className="text-base font-semibold mb-3 block">1. Escolha a base para o teste</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto específico</Label>
                    <Input 
                      id="subject"
                      placeholder="Ex: Revolução Francesa, Fotossíntese, Cálculo I..."
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        if (e.target.value) setSelectedFile(null);
                      }}
                      disabled={!!selectedFile}
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">OU</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload de material (PDF, DOCX, TXT)</Label>
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-study-primary/50 transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.txt"
                        />
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo aqui</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-study-primary/5 border border-study-primary/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="text-study-primary" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8">
                          <X size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <Label className="mb-4 block">{t('aiTests.questionsNumber')}: {numQuestions}</Label>
                  <Slider
                    value={[numQuestions]}
                    min={5}
                    max={30}
                    step={5}
                    onValueChange={(value) => setNumQuestions(value[0])}
                  />
                </div>
                
                <div>
                  <Label className="mb-4 block">{t('aiTests.difficulty')}</Label>
                  <RadioGroup value={difficulty} onValueChange={setDifficulty} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy" className="cursor-pointer">{t('aiTests.difficulties.easy')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer">{t('aiTests.difficulties.medium')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label htmlFor="hard" className="cursor-pointer">{t('aiTests.difficulties.hard')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <Button
                onClick={handleGenerateTest}
                className="w-full bg-study-primary h-12 text-lg font-semibold"
                disabled={isGenerating || (!subject.trim() && !selectedFile)}
              >
                {isGenerating ? (isUploading ? "Enviando arquivo..." : "Gerando questões...") : "Gerar Teste com IA"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-study-primary">{t('aiTests.generatedTest')}</h1>
              <Button onClick={handleCreateNewTest} variant="outline">
                Novo Teste
              </Button>
            </div>

            {isCorrected && testResult && (
              <Card className="bg-study-primary/5 border-study-primary/20">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-study-primary mb-2">{testResult.score}%</div>
                  <p className="text-muted-foreground">
                    Você acertou {testResult.correctCount} de {testResult.totalQuestions} questões
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-8">
              {generatedTest.map((q, index) => (
                <Card key={q.id} data-question-id={q.id} className={`overflow-hidden ${isCorrected ? (userAnswers[q.id] === q.answer ? 'border-green-500/50' : 'border-red-500/50') : ''}`}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <span className="bg-study-primary/10 text-study-primary text-xs font-bold px-2 py-1 rounded">
                        QUESTÃO {index + 1}
                      </span>
                    </div>
                    
                    {q.context && (
                      <div className="bg-muted/50 p-4 rounded-lg text-sm italic text-muted-foreground border-l-4 border-study-primary/30">
                        {q.context}
                      </div>
                    )}
                    
                    <p className="text-lg font-medium leading-relaxed">{q.question}</p>
                    
                    <RadioGroup 
                      value={userAnswers[q.id]} 
                      onValueChange={(val) => handleAnswerChange(q.id, val)}
                      disabled={isCorrected}
                      className="space-y-3"
                    >
                      {q.options?.map((option, optIdx) => {
                        const isSelected = userAnswers[q.id] === option;
                        const isCorrect = option === q.answer;
                        
                        let optionClass = "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent";
                        if (isCorrected) {
                          if (isCorrect) optionClass = "flex items-center space-x-3 p-3 rounded-lg border border-green-500 bg-green-500/10";
                          else if (isSelected && !isCorrect) optionClass = "flex items-center space-x-3 p-3 rounded-lg border border-red-500 bg-red-500/10";
                          else optionClass = "flex items-center space-x-3 p-3 rounded-lg border opacity-50";
                        } else if (isSelected) {
                          optionClass = "flex items-center space-x-3 p-3 rounded-lg border border-study-primary bg-study-primary/5";
                        }

                        return (
                          <div key={optIdx} className={optionClass} onClick={() => !isCorrected && handleAnswerChange(q.id, option)}>
                            <RadioGroupItem value={option} id={`q${q.id}-opt${optIdx}`} className="sr-only" />
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border font-bold text-sm">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <Label htmlFor={`q${q.id}-opt${optIdx}`} className="flex-grow cursor-pointer text-base">
                              {option}
                            </Label>
                            {isCorrected && isCorrect && <CheckCircle className="text-green-500 h-5 w-5" />}
                            {isCorrected && isSelected && !isCorrect && <XCircle className="text-red-500 h-5 w-5" />}
                          </div>
                        );
                      })}
                    </RadioGroup>

                    {isCorrected && q.explanation && (
                      <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg text-sm">
                        <p className="font-bold text-blue-700 mb-1">Explicação:</p>
                        <p className="text-blue-900/80">{q.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {!isCorrected ? (
              <Button onClick={handleSubmitTest} className="w-full bg-study-primary h-12 text-lg font-semibold sticky bottom-4 shadow-lg">
                Finalizar e Corrigir Teste
              </Button>
            ) : (
              <div className="flex gap-4 sticky bottom-4">
                <Button onClick={handleCreateNewTest} className="flex-1 bg-study-primary h-12 text-lg font-semibold shadow-lg">
                  Gerar Novo Teste
                </Button>
                <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} variant="outline" className="h-12 px-6">
                  Voltar ao Topo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TestGenerator;
