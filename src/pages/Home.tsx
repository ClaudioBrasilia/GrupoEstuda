
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [forceShowButtons, setForceShowButtons] = useState(false);
  
  // If user is already logged in, redirect to groups page
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/groups');
    }
  }, [user, isLoading, navigate]);

  // Safety timeout: force show buttons after 3 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setForceShowButtons(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-accent/10 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6 text-center">
          {t('app.name')}
        </h1>
        <p className="text-xl text-muted-foreground mb-12 text-center max-w-md">
          {t('app.slogan')}
        </p>
      </div>
      
      <div className="relative w-64 h-64 rounded-full mb-12 animate-in zoom-in duration-1000 delay-300">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-slow" />
        <div className="absolute inset-8 rounded-full bg-primary/30 animate-pulse-slow delay-150" />
        <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-white text-4xl font-bold">SB</span>
        </div>
      </div>
      
      <div className="space-y-4 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        {isLoading && !forceShowButtons ? (
          <Button 
            className="w-full" 
            disabled
          >
            {t('loading')}
          </Button>
        ) : user ? (
          <>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all" 
              onClick={() => navigate('/groups')}
            >
              {t('navigation.groups')}
            </Button>
            {user.plan === 'premium' && (
              <Button 
                className="w-full bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-md hover:shadow-lg transition-all" 
                onClick={() => navigate('/generate-test')}
              >
                {t('aiTests.title')}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all" 
              onClick={() => navigate('/login')}
            >
              {t('login.title')}
            </Button>
            <Button 
              variant="outline"
              className="w-full border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all" 
              onClick={() => navigate('/register')}
            >
              {t('register.title')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
