# Piclog Supabase 설정 가이드

## 1단계: 테이블 생성

Supabase Dashboard → SQL Editor로 이동하여 다음 SQL을 실행하세요:

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  user_id TEXT NOT NULL,
  is_bg_removed BOOLEAN DEFAULT FALSE,
  position JSONB,
  scale FLOAT DEFAULT 1,
  rotation FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_photos_user_hour ON photos(user_id, hour);
CREATE INDEX idx_photos_timestamp ON photos(timestamp DESC);
```

## 2단계: Storage 버킷 생성

1. Supabase Dashboard → Storage로 이동
2. "New bucket" 클릭
3. 버킷 이름: `photos`
4. Public bucket: **체크** (공개 읽기 허용)
5. "Create bucket" 클릭

## 3단계: Storage 정책 설정 ⚠️ **필수**

**방법 1: SQL로 정책 설정 (권장)**

Supabase Dashboard → SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- 업로드 허용 (모든 사용자)
CREATE POLICY "Allow public uploads to photos bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'photos');

-- 읽기 허용 (모든 사용자)
CREATE POLICY "Allow public reads from photos bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- 업데이트 허용 (모든 사용자)
CREATE POLICY "Allow public updates to photos bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'photos');

-- 삭제 허용 (모든 사용자)
CREATE POLICY "Allow public deletes from photos bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'photos');
```

**방법 2: UI로 정책 설정**

1. Supabase Dashboard → Storage → photos 버킷 클릭
2. "Policies" 탭 클릭
3. "New Policy" 클릭
4. 각각의 정책 추가:
   - **INSERT**: "Allow public uploads"
   - **SELECT**: "Allow public reads"
   - **UPDATE**: "Allow public updates"
   - **DELETE**: "Allow public deletes"
5. Target roles: `public` 선택
6. Policy definition: `bucket_id = 'photos'`

## 4단계: 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 파일명이 `YYYYMMDD_HHMMSS.jpg` 형식인 사진 업로드
   - 예: `20231205_153012.jpg`
3. 브라우저 콘솔(F12)에서 에러 확인

## 파일명 예시 생성 방법

테스트용 파일명을 만드는 방법:
- 파일명을 `20231205_150000.jpg`로 변경 (15시)
- 파일명을 `20231205_090000.jpg`로 변경 (9시)
- 파일명을 `20231205_120000.jpg`로 변경 (12시)

## 문제 해결

### 업로드가 안 되는 경우

1. **브라우저 콘솔 확인** (F12 → Console 탭)
   - 어떤 에러 메시지가 나오는지 확인

2. **서버 터미널 확인**
   - 서버 로그에서 에러 메시지 확인

3. **파일명 형식 확인**
   - 반드시 `YYYYMMDD_HHMMSS.jpg` 형식이어야 함

4. **Supabase 테이블/버킷 확인**
   - Supabase Dashboard에서 `photos` 테이블 존재 여부
   - Storage에서 `photos` 버킷 존재 여부

### 자주 발생하는 오류

#### "Invalid filename format"
→ 파일명이 `YYYYMMDD_HHMMSS.jpg` 형식이 아님

#### "Database error"
→ `photos` 테이블이 생성되지 않음

#### "Upload failed"
→ `photos` Storage 버킷이 생성되지 않음

#### "Maximum 3 photos per hour slot"
→ 해당 시간대에 이미 3장의 사진이 있음 (다른 시간대로 변경)
