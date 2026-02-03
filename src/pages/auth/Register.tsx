
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import PageLayout from '@/components/layout/PageLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// Define validation schema
const registerSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome não pode ter mais de 50 caracteres'),
  email: z.string()
    .email('Digite um email válido')
    .min(1, 'Email é obrigatório'),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .max(50, 'A senha não pode ter mais de 50 caracteres'),
  confirmPassword: z.string()
    .min(1, 'Confirme sua senha'),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'Você deve aceitar os termos de uso e política de privacidade'
    })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerUser, isAuthActionLoading } = useAuth();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    setRegisterError(null);
    
    const { error } = await registerUser(data.name, data.email, data.password);
    
    if (error) {
      setRegisterError(error.message);
      toast.error('Falha no cadastro: ' + error.message);
      return;
    }
    
    toast.success('Cadastro realizado com sucesso! Redirecionando...');
    
    // Redirect manual após sucesso do cadastro
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };
  
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-study-primary">{t('register.title')}</h1>
          </div>
          
          {registerError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{registerError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.email')}</FormLabel>
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
                    <FormLabel>{t('register.password')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Aceito os <Link to="/terms" className="text-study-primary hover:underline">Termos de Uso</Link>
                        {' '}e a{' '}
                        <Link to="/privacy" className="text-study-primary hover:underline">Política de Privacidade</Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-study-primary"
                disabled={isAuthActionLoading}
              >
                {isAuthActionLoading ? 'Carregando...' : t('register.registerButton')}
              </Button>
            </form>
          </Form>
          
          <div className="text-center text-sm">
            <p>
              {t('register.loginPrompt')}{' '}
              <Link to="/login" className="text-study-primary hover:underline">
                {t('register.loginButton')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Register;
