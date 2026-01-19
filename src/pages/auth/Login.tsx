
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageLayout from '@/components/layout/PageLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Digite um email válido')
    .min(1, 'Email é obrigatório'),
  password: z.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(50, 'A senha não pode ter mais de 50 caracteres')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/groups', { replace: true });
    }
  }, [user, authLoading, navigate]);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      const { error } = await login(data.email, data.password);
      
      if (error) {
        setLoginError(error.message);
        toast.error('Falha no login: ' + error.message);
        return;
      }
      
      toast.success('Login realizado com sucesso');
      // Navigation will happen via useEffect when user state updates
    } catch (error) {
      setLoginError((error instanceof Error) ? error.message : 'Ocorreu um erro ao fazer login');
      toast.error('Falha no login: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-study-primary">{t('login.title')}</h1>
          </div>
          
          {loginError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.email')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('login.password')}</FormLabel>
                      <Link to="/forgot-password" className="text-xs text-study-primary hover:underline">
                        {t('login.forgotPassword')}
                      </Link>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-study-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Carregando...' : t('login.loginButton')}
              </Button>
            </form>
          </Form>
          
          <div className="text-center text-sm">
            <p>
              {t('login.registerPrompt')}{' '}
              <Link to="/register" className="text-study-primary hover:underline">
                {t('login.registerButton')}
              </Link>
            </p>
          </div>
          
          <div className="text-center text-xs text-gray-500 pt-6 space-y-1">
            <p>
              Ao continuar, você concorda com nossos
            </p>
            <p>
              <Link to="/terms" className="text-study-primary hover:underline">Termos de Uso</Link>
              {' '}&amp;{' '}
              <Link to="/privacy" className="text-study-primary hover:underline">Política de Privacidade</Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;
