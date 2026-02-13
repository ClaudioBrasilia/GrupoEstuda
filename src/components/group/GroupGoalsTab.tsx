
import React, { useState } from 'react';
import { Plus, BookOpen, Trash2, TrendingUp, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Subject, GoalType } from '@/types/groupTypes';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/sonner';

interface GroupGoalsTabProps {
  goals: GoalType[];
  subjects: Subject[];
  isAdmin: boolean;
  newGoalSubject: string;
  setNewGoalSubject: (value: string) => void;
  newGoalType: 'exercises' | 'pages' | 'time';
  setNewGoalType: (value: 'exercises' | 'pages' | 'time') => void;
  newGoalTarget: string;
  setNewGoalTarget: (value: string) => void;
  handleAddGoal: (e: React.FormEvent) => void;
  getSubjectNameById: (id: string) => string;
  updateGoalProgress: (goalId: string, progress: number) => void;
  handleDeleteGoal: (goalId: string) => Promise<void>;
  handleIncreaseGoalTarget: (goalId: string, additionalTarget: number) => Promise<void>;
}

const GroupGoalsTab: React.FC<GroupGoalsTabProps> = ({
  goals,
  subjects,
  isAdmin,
  newGoalSubject,
  setNewGoalSubject,
  newGoalType,
  setNewGoalType,
  newGoalTarget,
  setNewGoalTarget,
  handleAddGoal,
  getSubjectNameById,
  updateGoalProgress,
  handleDeleteGoal,
  handleIncreaseGoalTarget
}) => {
  const { t } = useTranslation();
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [progressAmount, setProgressAmount] = useState<string>('');
  const [deleteGoalDialogOpen, setDeleteGoalDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [increaseTargetDialogOpen, setIncreaseTargetDialogOpen] = useState(false);
  const [selectedGoalForIncrease, setSelectedGoalForIncrease] = useState<string | null>(null);
  const [additionalTarget, setAdditionalTarget] = useState<string>('');

  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !progressAmount) return;
    
    const amount = parseInt(progressAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('goals.invalidAmount'));
      return;
    }

    updateGoalProgress(selectedGoalId, amount);
    setProgressAmount('');
    setShowProgressDialog(false);
  };

  const openProgressDialog = (goalId: string) => {
    setSelectedGoalId(goalId);
    setShowProgressDialog(true);
  };

  const openDeleteDialog = (goalId: string) => {
    setGoalToDelete(goalId);
    setDeleteGoalDialogOpen(true);
  };

  const confirmDelete = () => {
    if (goalToDelete) {
      handleDeleteGoal(goalToDelete);
      setDeleteGoalDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const openIncreaseTargetDialog = (goalId: string) => {
    setSelectedGoalForIncrease(goalId);
    setIncreaseTargetDialogOpen(true);
  };

  const handleIncreaseTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForIncrease || !additionalTarget) return;
    
    const amount = parseInt(additionalTarget);
    if (isNaN(amount) || amount <= 0) {
      toast.error('O valor deve ser maior que zero');
      return;
    }
    
    handleIncreaseGoalTarget(selectedGoalForIncrease, amount);
    setAdditionalTarget('');
    setIncreaseTargetDialogOpen(false);
    setSelectedGoalForIncrease(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{t('goals.title')}</h3>
        
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-study-primary">
                <Plus size={16} className="mr-1" />
                {t('goals.addGoal')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('goals.createGoal')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <Label htmlFor="goalSubject">{t('goals.subject')}</Label>
                  <Select value={newGoalSubject} onValueChange={setNewGoalSubject} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('goals.selectSubject')} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="goalType">{t('goals.type')}</Label>
                  <Select 
                    value={newGoalType} 
                    onValueChange={(value) => setNewGoalType(value as 'exercises' | 'pages' | 'time')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('goals.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exercises">{t('goals.types.exercises')}</SelectItem>
                      <SelectItem value="pages">{t('goals.types.pages')}</SelectItem>
                      <SelectItem value="time">{t('goals.types.time')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="goalTarget">{t('goals.target')}</Label>
                  <Input
                    id="goalTarget"
                    type="number"
                    min="1"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    placeholder={t('goals.enterTarget')}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-study-primary">
                  {t('goals.createGoal')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('goals.updateProgress')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div>
              <Label htmlFor="progressAmount">{t('goals.enterAmount')}</Label>
              <Input
                id="progressAmount"
                type="number"
                min="1"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                placeholder={t('goals.enterAmountPlaceholder')}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-study-primary">
              {t('goals.saveProgress')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="card p-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{getSubjectNameById(goal.subject)}</h4>
                    <p className="text-sm text-gray-500">
                      {goal.type === 'exercises' ? t('goals.types.exercises') : 
                       goal.type === 'pages' ? t('goals.types.pages') : 
                       t('goals.types.time')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {goal.current} / {goal.target}
                    </p>
                    
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => openIncreaseTargetDialog(goal.id)}
                            className="cursor-pointer"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Aumentar Meta
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(goal.id)}
                            className="cursor-pointer text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Meta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div 
                    className="bg-study-primary h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openProgressDialog(goal.id)}
                  >
                    {t('goals.updateProgress')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="mx-auto h-12 w-12 opacity-50 mb-2" />
          <p>{t('goals.noGoals')}</p>
        </div>
      )}
      
      {/* Delete Goal Confirmation Dialog */}
      <AlertDialog open={deleteGoalDialogOpen} onOpenChange={setDeleteGoalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Increase Target Dialog */}
      <Dialog open={increaseTargetDialogOpen} onOpenChange={setIncreaseTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aumentar Meta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIncreaseTarget} className="space-y-4">
            <div>
              <Label htmlFor="additionalTarget">Valor adicional</Label>
              <Input
                id="additionalTarget"
                type="number"
                min="1"
                value={additionalTarget}
                onChange={(e) => setAdditionalTarget(e.target.value)}
                placeholder="Quanto adicionar ao alvo atual?"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                O novo valor será: {selectedGoalForIncrease && goals.find(g => g.id === selectedGoalForIncrease)?.target} + {additionalTarget || 0}
              </p>
            </div>
            <Button type="submit" className="w-full bg-study-primary">
              Confirmar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupGoalsTab;
