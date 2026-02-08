
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguagesIcon, UserIcon, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getPageTitle = (pathname: string, t: (key: string) => string): string => {
  switch (pathname) {
    case '/':
      return t('app.name');
    case '/groups':
      return t('navigation.groups');
    case '/progress':
      return t('navigation.progress');
    case '/water':
      return t('navigation.water');
    case '/leaderboard':
      return t('navigation.leaders');
    case '/profile':
      return t('navigation.profile');
    case '/login':
      return t('login.title');
    case '/register':
      return t('register.title');
    case '/plans':
      return t('plans.title');
    case '/generate-test':
      return t('aiTests.title');
    default:
      if (pathname.startsWith('/group/')) {
        return t('groups.title');
      }
      return t('app.name');
  }
};

const AppHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const title = getPageTitle(location.pathname, t);
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Grupo Estuda',
      text: 'Junte-se a nós no Grupo Estuda e melhore seu desempenho acadêmico!',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copiado!",
          description: "O link do app foi copiado para sua área de transferência.",
        });
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };
  
  return (
    <header className="bg-gradient-to-r from-background via-background to-primary/5 border-b border-border/50 backdrop-blur-sm py-4 px-6 sticky top-0 z-10 flex items-center justify-between shadow-elegant">
      <div className="flex-1 flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleShare}
          className="text-foreground hover:bg-primary/10 transition-smooth"
          title="Compartilhar"
        >
          <Share2 size={20} />
        </Button>
      </div>
      
      <h1 className="text-xl font-bold text-center bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent flex-1">{title}</h1>
      
      <div className="flex items-center gap-2 flex-1 justify-end">
        <ThemeToggle />
        
        {user && <NotificationBell />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10 transition-smooth">
              <LanguagesIcon size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              {t('language.english')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('pt')}>
              {t('language.portuguese')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10 transition-smooth">
                <UserIcon size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                {user.name}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/plans')}>
                {user.plan === 'free' ? t('plans.free.name') : 
                 user.plan === 'basic' ? t('plans.basic.name') : 
                 t('plans.premium.name')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                logout();
                navigate('/login');
              }}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          location.pathname !== '/login' && location.pathname !== '/register' && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              {t('login.title')}
            </Button>
          )
        )}
      </div>
    </header>
  );
};

export default AppHeader;
