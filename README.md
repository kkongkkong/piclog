# Piclog - Effortless 타임라인 자동 기록 서비스

## 프로젝트 개요
Piclog는 사진의 촬영 시간을 분석하여 자동으로 타임라인에 배치하는 일상 기록 서비스입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 Supabase 정보를 입력하세요:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PYTHON_BG_REMOVAL_URL=http://localhost:5000
```

### 3. Supabase 설정

#### 테이블 생성
Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  user_id TEXT NOT NULL,
  is_bg_removed BOOLEAN DEFAULT FALSE,
  original_url TEXT,  -- 배경제거 전 원본 URL (원복용)
  position JSONB,
  scale FLOAT DEFAULT 1,
  rotation FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 테이블이 있다면 이 명령으로 컬럼 추가:
-- ALTER TABLE photos ADD COLUMN IF NOT EXISTS original_url TEXT;
```

#### Storage 버킷 생성
1. Supabase Dashboard → Storage 이동
2. `photos` 버킷 생성
3. Public 읽기 허용

### 4. Python 배경 제거 서버 실행 (선택사항)

배경 제거 기능을 사용하려면 Python 서버를 실행해야 합니다.

**Windows:**
```bash
cd python-bg-remover
start.bat
```

**Mac/Linux:**
```bash
cd python-bg-remover
chmod +x start.sh
./start.sh
```

자세한 내용은 `python-bg-remover/README.md`를 참고하세요.

### 5. Next.js 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 주요 기능

### MVP 기능
- ✅ 사진 업로드 (파일명에서 timestamp 자동 추출)
- ✅ 24시간 타임라인 자동 생성
- ✅ 시간대별 최대 3장 제한

### 타임라인 꾸미기 기능
- ✅ 사진 선택 시 '배경제거', '삭제' 버튼 표시
- ✅ 사진 삭제 기능
- ✅ 사진 자유 배치 (드래그로 이동)
- ✅ 사진 확대/축소 (마우스 휠 또는 핀치)
- ✅ 사진 회전 (두 손가락 제스처)
- ✅ 배경 제거(누끼) 기능 (Python rembg 서버 연동)
- ✅ 배경제거한 사진 원복 기능 (원본으로 되돌리기)
- ✅ 텍스트 추가 및 꾸미기

## 파일 구조
```
piclog/
├── components/
│   ├── DraggableItem.tsx    # 드래그 가능한 아이템
│   ├── StickerLayer.tsx      # 스티커 레이어
│   ├── Timeline.tsx          # 타임라인
│   ├── TimelineSlot.tsx      # 시간대 슬롯
│   └── UploadBox.tsx         # 업로드 박스
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   └── types.ts              # TypeScript 타입
├── pages/
│   ├── api/
│   │   └── photos/
│   │       ├── upload.ts          # 업로드 API
│   │       ├── remove-bg.ts       # 배경 제거 API
│   │       ├── restore-original.ts # 원복 API
│   │       └── delete.ts          # 삭제 API
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx             # 메인 페이지
├── styles/
│   └── globals.css           # 글로벌 스타일
└── utils/
    ├── extractTimestamp.ts   # Timestamp 추출
    └── guestId.ts            # Guest ID 생성
```

## 사진 파일명 형식
업로드하는 사진 파일명은 다음 형식을 따라야 합니다:
```
YYYYMMDD_HHMMSS.jpg
예: 20231205_153012.jpg
```

## TODO (추가 구현 필요)
- [ ] 배경 제거 실제 처리 (Python rembg 또는 외부 API 연동)
- [ ] 텍스트 스티커 DB 저장
- [ ] 사진 위치/크기/회전 정보 DB 저장
- [ ] 모바일 터치 제스처 최적화

## 기술 스택
- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (DB + Storage)
- react-draggable
