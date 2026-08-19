import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, MessageCircle } from 'lucide-react';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useTranslation } from 'react-i18next';
import { Combobox } from '@/components/ui/combobox';

interface InvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName?: string;
}

interface SearchedUser {
  id: string;
  name: string;
  email: string;
}

export const InvitationDialog: React.FC<InvitationDialogProps> = ({
  open,
  onOpenChange,
  groupId,
  groupName,
}) => {
  const { t } = useTranslation();
  const { sendInvitation, loading, searchUsersByName, searchLoading } = useGroupInvitations();
  const [mode, setMode] = useState<'search' | 'whatsapp'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);

  const handleWhatsAppShare = () => {
    const registerUrl = `${window.location.origin}/register`;
    const message = groupName
      ? `Oi! Vem estudar comigo no GrupoEstuda 📚 Entrei no grupo "${groupName}" e queria te chamar. Cadastre-se por aqui: ${registerUrl}`
      : `Oi! Vem estudar comigo no GrupoEstuda 📚 Cadastre-se por aqui: ${registerUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchUsersByName(searchTerm).then(setSearchResults);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
    setMode('search');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'whatsapp') {
      handleWhatsAppShare();
      return;
    }

    if (mode === 'search' && selectedUser) {
      const { error } = await sendInvitation(groupId, selectedUser.email, selectedUser.id);
      if (!error) {
        handleReset();
        onOpenChange(false);
      }
    }
  };

  const isSubmitDisabled = () => {
    if (mode === 'whatsapp') return false;
    if (loading) return true;
    if (mode === 'search') return !selectedUser;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('group.inviteMember')}</DialogTitle>
          <DialogDescription>
            Busque um amigo dentro do app ou chame pelo WhatsApp
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'search' | 'whatsapp')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Buscar no App</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-4">
              {selectedUser ? (
                <div className="space-y-2">
                  <Label>Usuário Selecionado</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-2 py-2 px-3">
                      <div className="flex-1">
                        <div className="font-medium">{selectedUser.name}</div>
                        <div className="text-xs opacity-70">{selectedUser.email}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedUser(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Buscar Usuário</Label>
                  <Combobox
                    users={searchResults}
                    onSelect={setSelectedUser}
                    onSearchChange={setSearchTerm}
                    loading={searchLoading}
                    placeholder="Digite o nome do usuário..."
                    emptyMessage="Nenhum usuário encontrado"
                    searchTerm={searchTerm}
                    minCharacters={2}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <MessageCircle className="h-10 w-10 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  Vamos abrir o WhatsApp com uma mensagem de convite pronta.
                  Você escolhe o contato e envia.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitDisabled()}>
              {mode === 'whatsapp'
                ? 'Abrir WhatsApp'
                : loading
                ? 'Enviando...'
                : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
