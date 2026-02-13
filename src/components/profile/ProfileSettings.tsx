
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/layout/PageLayout';
import { Droplet, Palette } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ThemeSelector } from '@/components/ui/theme-toggle';

const ProfileSettings: React.FC = () => {
  const { user, updateUserPlan } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [waterGoal, setWaterGoal] = useState('2500');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('name, water_goal_ml')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setName(data.name || '');
      setWaterGoal(data.water_goal_ml?.toString() || '2500');
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      if (!user) throw new Error('No user found');

      const goalValue = parseInt(waterGoal);
      if (goalValue < 500 || goalValue > 5000) {
        toast.error('Meta de água deve estar entre 500ml e 5000ml');
        setIsUpdating(false);
        return;
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name,
          water_goal_ml: goalValue
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(t('profile.settings.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.settings.passwordsNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(t('profile.settings.passwordChanged'));
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('profile.settings.title', 'Configurações')}</h1>
          <p className="text-muted-foreground">{t('profile.settings.description', 'Gerencie sua conta e preferências')}</p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{t('profile.settings.profile')}</TabsTrigger>
          <TabsTrigger value="appearance">{t('profile.settings.appearance', 'Aparência')}</TabsTrigger>
          <TabsTrigger value="security">{t('profile.settings.security')}</TabsTrigger>
          <TabsTrigger value="subscription">{t('profile.settings.subscription')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4 pt-4">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.settings.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.settings.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
                placeholder="seu@email.com"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="water-goal" className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-500" />
                Meta Diária de Água (ml)
              </Label>
              <Input
                id="water-goal"
                type="number"
                min="500"
                max="5000"
                step="100"
                value={waterGoal}
                onChange={(e) => setWaterGoal(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 2000ml-3500ml dependendo da atividade física
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-study-primary"
              disabled={isUpdating}
            >
              {isUpdating ? t('profile.settings.updating') : t('profile.settings.updateProfile')}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('profile.settings.theme', 'Tema')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('profile.settings.themeDescription', 'Escolha o tema da interface')}
              </p>
            </div>
            
            <ThemeSelector />
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{t('profile.settings.accountSecurity')}</h3>
              <p className="text-sm text-gray-500">
                {t('profile.settings.manageSecuritySettings')}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(true)}
            >
              {t('profile.settings.changePassword')}
            </Button>
            
            <div className="pt-4">
              <h3 className="font-medium">{t('profile.settings.privacy')}</h3>
              <p className="text-sm text-gray-500">
                {t('profile.settings.managePrivacy')}
              </p>
              <div className="pt-2">
                <Link to="/privacy" className="text-study-primary hover:underline text-sm">
                  {t('profile.settings.viewPrivacyPolicy')}
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="subscription" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{t('profile.settings.currentPlan')}</h3>
              <p className="text-sm mt-1 capitalize font-semibold text-study-primary">
                {user?.plan === 'premium' ? t('profile.settings.premium') : user?.plan === 'basic' ? t('profile.settings.basic') : t('profile.settings.free')}
              </p>
              
              {user?.plan !== 'premium' && (
                <p className="text-sm text-gray-500 mt-2">
                  {t('profile.settings.upgradeMessage')}
                </p>
              )}
            </div>
            
            <Link to="/my-plan">
              <Button className="w-full bg-study-primary">
                {user?.plan === 'premium' ? t('profile.settings.manageSubscription') : t('profile.settings.managePlans')}
              </Button>
            </Link>
          </div>
        </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.settings.changePasswordTitle')}</DialogTitle>
            <DialogDescription>
              {t('profile.settings.changePasswordDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.settings.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('profile.settings.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('profile.settings.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-study-primary"
                disabled={isUpdating}
              >
                {isUpdating ? t('profile.settings.changing') : t('profile.settings.changePassword')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default ProfileSettings;
