import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { PLAN_LIMITS, PlanType } from '@/config/planLimits';

export interface GroupFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  user_id: string;
  user_name: string;
  created_at: Date;
}

export const useGroupFiles = (groupId: string | undefined) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!groupId || !user) return;

    try {
      setLoading(true);

      // Fetch file metadata from our custom table
      const { data: filesData, error } = await supabase
        .from('group_files')
        .select(`
          id,
          file_name,
          file_path,
          file_size,
          content_type,
          user_id,
          created_at
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user names for file uploaders
      const userIds = [...new Set(filesData?.map(f => f.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const formattedFiles = filesData?.map(file => ({
        id: file.id,
        file_name: file.file_name,
        file_path: file.file_path,
        file_size: file.file_size,
        content_type: file.content_type,
        user_id: file.user_id,
        user_name: profiles?.find(p => p.id === file.user_id)?.name || 'Unknown User',
        created_at: new Date(file.created_at)
      })) || [];

      setFiles(formattedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    if (groupId && user) {
      fetchFiles();
    }
  }, [groupId, user, fetchFiles]);

  const uploadFile = async (file: File) => {
    if (!groupId || !user) return { success: false, error: 'Dados insuficientes' };

    try {
      setUploading(true);

      // Get user's plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      const userPlan = (profile?.plan as PlanType) || 'free';
      const planLimits = PLAN_LIMITS[userPlan];

      // Check if user can upload files
      if (!planLimits.canUploadFiles) {
        toast.error('Upload de arquivos disponível apenas para planos Basic e Premium');
        return { success: false, error: 'Upload restrito a planos pagos' };
      }

      // Validate file size based on plan
      const maxSizeBytes = planLimits.maxUploadSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const maxSizeText = planLimits.maxUploadSizeMB >= 1024 
          ? '1 GB' 
          : `${planLimits.maxUploadSizeMB} MB`;
        return { success: false, error: `Arquivo muito grande. Máximo ${maxSizeText} para seu plano.` };
      }

      // Create unique file path
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `${groupId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('group-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save file metadata to our table
      const { data: fileData, error: metadataError } = await supabase
        .from('group_files')
        .insert({
          group_id: groupId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type || null
        })
        .select()
        .single();

      if (metadataError) throw metadataError;

      // Add to local state
      const newFile: GroupFile = {
        id: fileData.id,
        file_name: fileData.file_name,
        file_path: fileData.file_path,
        file_size: fileData.file_size,
        content_type: fileData.content_type,
        user_id: fileData.user_id,
        user_name: user.name,
        created_at: new Date(fileData.created_at)
      };

      setFiles(prev => [newFile, ...prev]);

      return { success: true };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: 'Erro ao fazer upload do arquivo' };
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: GroupFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('group-files')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao fazer download do arquivo');
    }
  };

  const deleteFile = async (file: GroupFile) => {
    if (file.user_id !== user?.id) {
      toast.error('Você só pode excluir seus próprios arquivos');
      return { success: false };
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('group-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: metadataError } = await supabase
        .from('group_files')
        .delete()
        .eq('id', file.id);

      if (metadataError) throw metadataError;

      // Remove from local state
      setFiles(prev => prev.filter(f => f.id !== file.id));

      toast.success('Arquivo excluído com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao excluir arquivo');
      return { success: false };
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    files,
    loading,
    uploading,
    uploadFile,
    downloadFile,
    deleteFile,
    formatFileSize,
    refreshFiles: fetchFiles
  };
};
