INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload study materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view study materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials');

CREATE POLICY "Users can delete own study materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-materials' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
