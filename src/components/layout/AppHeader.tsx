import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguagesIcon, Share2Icon, UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TranslateFn = (key: string) => string;

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/': 'app.name',
  '/groups': 'navigation.groups',
  '/progress': 'navigation.progress',
  '/water': 'navigation.water',
  '/leaderboard': 'navigation.leaders',
  '/profile': 'navigation.profile',
  '/login': 'login.title',
  '/register': 'register.title',
  '/plans': 'plans.title',
  '/generate-test': 'aiTests.title',
};

const getPageTitle = (pathname: string, t: TranslateFn): string => {
  if (pathname.startsWith('/group/')) {
    return t('groups.title');
  }

  return t(PAGE_TITLE_KEYS[pathname] ?? 'app.name');
};

const getPlanName = (plan: string, t: TranslateFn): string => {
  if (plan === 'free') return t('plans.free.name');
  if (plan === 'basic') return t('plans.basic.name');
  return t('plans.premium.name');
};

const AppHeader: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const title = useMemo(() => getPageTitle(pathname, t), [pathname, t]);
  const userPlanName = useMemo(() => (user ? getPlanName(user.plan, t) : ''), [user, t]);
  const shouldShowLogin = pathname !== '/login' && pathname !== '/register';

  const handleShare = useCallback(async () => {
    const shareData = {
      title: t('app.name'),
      text: t('app.shareMessage'),
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert(t('app.linkCopied'));
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }, [t]);

  const handleChangeLanguage = useCallback(
    (language: string) => {
      i18n.changeLanguage(language);
    },
    [i18n],
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <header className="bg-gradient-to-r from-background via-background to-primary/5 border-b border-border/50 backdrop-blur-sm py-4 px-6 sticky top-0 z-10 flex items-center justify-between shadow-elegant">
      <div className="flex-1" />

      <h1 className="text-xl font-bold text-center bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent flex-1">
        {title}
      </h1>

      <div className="flex items-center gap-2 flex-1 justify-end">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="text-foreground hover:bg-primary/10 transition-smooth"
          title={t('app.share')}
          aria-label={t('app.share')}
        >
          <Share2Icon size={20} />
        </Button>

        {user && <NotificationBell />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-primary/10 transition-smooth"
              aria-label={t('language.title')}
            >
              <LanguagesIcon size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleChangeLanguage('en')}>
              {t('language.english')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangeLanguage('pt')}>
              {t('language.portuguese')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-primary/10 transition-smooth"
                aria-label={t('navigation.profile')}
              >
                <UserIcon size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>{user.name}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/plans')}>{userPlanName}</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>{t('settings.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          shouldShowLogin && (
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
