
import React from 'react';
import { Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Subject } from '@/types/groupTypes';
import { useTranslation } from 'react-i18next';

interface GroupSubjectsTabProps {
  subjects: Subject[];
  currentUserIsAdmin: boolean;
  newSubject: string;
  setNewSubject: (value: string) => void;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (value: boolean) => void;
  addVestibularDialogOpen: boolean;
  setAddVestibularDialogOpen: (value: boolean) => void;
  handleAddSubject: (e: React.FormEvent) => void;
  handleDeleteSubject: (subjectId: string) => void;
  confirmDeleteSubject: () => void;
  handleAddVestibularModule: () => void;
}

const GroupSubjectsTab: React.FC<GroupSubjectsTabProps> = ({
  subjects,
  currentUserIsAdmin,
  newSubject,
  setNewSubject,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  addVestibularDialogOpen,
  setAddVestibularDialogOpen,
  handleAddSubject,
  handleDeleteSubject,
  confirmDeleteSubject,
  handleAddVestibularModule
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Matérias Disponíveis</h3>
        
        {currentUserIsAdmin && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-study-primary">
                  <Plus size={16} className="mr-1" />
                  {t('groups.addSubjects')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Matéria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Nome da Matéria</Label>
                    <Input
                      id="subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Digite o nome da matéria"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-study-primary">{t('group.addSubject')}</Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={addVestibularDialogOpen} onOpenChange={setAddVestibularDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus size={16} className="mr-1" />
                  {t('groups.addVestibular')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Módulo Vestibular</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500 mb-4">
                  Isso adicionará todas as matérias padrão do vestibular ao seu grupo.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setAddVestibularDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddVestibularModule} className="bg-study-primary">
                    Confirmar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {subjects.map((subject) => (
          <div key={subject.id} className="card p-3 cursor-pointer hover:border-study-primary transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id={`subject-${subject.id}`} />
                <Label htmlFor={`subject-${subject.id}`} className="cursor-pointer">
                  {subject.name}
                </Label>
              </div>
              
              {currentUserIsAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => handleDeleteSubject(subject.id)}
                  title={t('groups.deleteSubject')}
                >
                  <Trash size={14} className="text-red-500" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Confirmação de exclusão de matéria */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Matéria</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteSubject}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupSubjectsTab;
