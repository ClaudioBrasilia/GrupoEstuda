import React, { useState } from 'react';
import { Upload, Download, Trash2, File, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useGroupFiles } from '@/hooks/useGroupFiles';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';

interface GroupFilesTabProps {
  groupId: string | undefined;
}

const GroupFilesTab: React.FC<GroupFilesTabProps> = ({ groupId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { files, loading, uploading, uploadFile, downloadFile, deleteFile, formatFileSize } = useGroupFiles(groupId);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    const result = await uploadFile(selectedFile);
    if (result.success) {
      setSelectedFile(null);
      setUploadDialogOpen(false);
      toast.success('Arquivo enviado com sucesso!');
    } else {
      toast.error(result.error || 'Erro ao fazer upload');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-study-primary mx-auto mb-2"></div>
          <p className="text-gray-500">Carregando arquivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('files.title', 'Arquivos')}</h3>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-study-primary">
              <Plus className="w-4 h-4 mr-2" />
              Enviar Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Arquivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    Arquivo selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading}
                  className="bg-study-primary"
                >
                  {uploading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {files.length > 0 ? (
          files.map(file => (
            <div key={file.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <File className="w-8 h-8 text-gray-400 mt-1" />
                  <div>
                    <h4 className="font-medium">{file.file_name}</h4>
                    <p className="text-sm text-gray-500">
                      Enviado por {file.user_name} • {formatFileSize(file.file_size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {file.created_at.toLocaleDateString()} às {file.created_at.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.user_id === user?.id && (
                    <Badge variant="secondary">Seu arquivo</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {file.user_id === user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFile(file)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <File className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo ainda</h3>
            <p className="text-gray-500">Seja o primeiro a compartilhar um arquivo com o grupo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupFilesTab;