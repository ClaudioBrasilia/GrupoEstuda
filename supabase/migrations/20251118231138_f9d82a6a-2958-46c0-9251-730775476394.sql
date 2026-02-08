-- Make study-activities bucket public so getPublicUrl() works correctly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'study-activities';