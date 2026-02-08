-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for group files
INSERT INTO storage.buckets (id, name, public) VALUES ('group-files', 'group-files', false);

-- Create storage policies for group files
CREATE POLICY "Group members can view files from their groups" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'group-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT group_id::text 
    FROM group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Group members can upload files to their groups" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'group-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT group_id::text 
    FROM group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update files they uploaded" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'group-files' 
  AND owner = auth.uid()
);

CREATE POLICY "Users can delete files they uploaded" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'group-files' 
  AND owner = auth.uid()
);

-- Create table to track file metadata
CREATE TABLE public.group_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on group_files table
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

-- Create policies for group_files table
CREATE POLICY "Group members can view files metadata from their groups" 
ON public.group_files 
FOR SELECT 
USING (
  group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can upload files metadata to their groups" 
ON public.group_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own file metadata" 
ON public.group_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file metadata" 
ON public.group_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_group_files_updated_at
BEFORE UPDATE ON public.group_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();