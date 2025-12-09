-- photos 테이블에 original_url 컬럼 추가
-- 배경제거 기능 사용 시 원본 URL을 저장하여 원복 가능하도록 함

ALTER TABLE photos
ADD COLUMN IF NOT EXISTS original_url TEXT;

-- 기존 레코드의 인덱스 추가 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_photos_is_bg_removed ON photos(is_bg_removed);
