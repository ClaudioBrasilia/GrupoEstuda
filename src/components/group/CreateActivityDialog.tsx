import { useState, useRef } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudyActivities } from '@/hooks/useStudyActivities';
import { useStudySessions } from '@/hooks/useStudySessions';
import { toast } from 'sonner';

interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  userGroups?: { id: string; name: string }[];
}

export const CreateActivityDialog = ({
  open,
  onOpenChange,
  groupId,
  userGroups = [],
}: CreateActivityDialogProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>(groupId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createActivity, uploading } = useStudyActivities(groupId);
  const { subjects, getSubjectsByGroup } = useStudySessions();

  const currentGroupSubjects = selectedGroup
    ? getSubjectsByGroup(selectedGroup)
    : [];

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedPhoto) {
      toast.error('Selecione uma foto');
      return;
    }

    if (!description.trim()) {
      toast.error('Adicione uma descrição');
      return;
    }

    const targetGroup = selectedGroup || groupId;
    if (!targetGroup) {
      toast.error('Selecione um grupo');
      return;
    }

    const result = await createActivity(
      targetGroup,
      selectedPhoto,
      description,
      selectedSubject || undefined
    );

    if (result.success) {
      // Reset form
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setDescription('');
      setSelectedSubject('');
      onOpenChange(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] max-h-[88vh] p-0 gap-0 overflow-hidden">
        <DialogHeader>
          <div className="p-6 pb-4">
          <DialogTitle>Nova Atividade de Estudo</DialogTitle>
          <DialogDescription>
            Compartilhe sua sessão de estudos com o grupo
          </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-6 pb-4">
          {/* Photo Preview or Upload */}
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemovePhoto}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Escolher da Galeria
                </Button>
              </div>
            </div>
          )}

          {/* Group Selection (only if not in a specific group) */}
          {!groupId && userGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {userGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject Selection */}
          {currentGroupSubjects.length > 0 && (
            <div className="space-y-2">
              <Label>Matéria (opcional)</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {currentGroupSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="O que você estudou?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

        </div>

        <div className="border-t bg-background px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={uploading || !selectedPhoto || !description.trim()}
          >
            {uploading ? 'Enviando...' : 'Publicar Atividade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
