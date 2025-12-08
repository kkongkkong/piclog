-- Supabase Storage 정책 설정 (photos 버킷)

-- 1. 모든 사용자에게 파일 업로드 허용
CREATE POLICY "Allow public uploads to photos bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'photos');

-- 2. 모든 사용자에게 파일 읽기 허용
CREATE POLICY "Allow public reads from photos bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- 3. 모든 사용자에게 파일 업데이트 허용
CREATE POLICY "Allow public updates to photos bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'photos');

-- 4. 모든 사용자에게 파일 삭제 허용 (Guest 모드이므로)
CREATE POLICY "Allow public deletes from photos bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'photos');
