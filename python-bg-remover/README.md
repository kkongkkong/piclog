# Python 배경 제거 서버

Flask 기반 배경 제거 서버입니다. `rembg` 라이브러리를 사용하여 이미지의 배경을 자동으로 제거합니다.

## 설치 방법

### 1. Python 설치 확인

Python 3.8 이상이 필요합니다.

```bash
python --version
# 또는
python3 --version
```

Python이 설치되어 있지 않다면 [python.org](https://www.python.org/downloads/)에서 다운로드하세요.

### 2. 가상환경 생성 (권장)

```bash
cd python-bg-remover

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. 의존성 설치

```bash
pip install -r requirements.txt
```

**참고:** `rembg` 설치 시 모델 파일(약 170MB)을 다운로드하므로 시간이 걸릴 수 있습니다.

### 4. 서버 실행

```bash
python app.py
```

서버가 성공적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
🚀 Background Removal Server Starting...
📍 Server running at: http://localhost:5000
🔍 Health check: http://localhost:5000/health
🎨 Remove BG endpoint: http://localhost:5000/remove-bg
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

### 5. 서버 테스트

브라우저에서 `http://localhost:5000/health`를 열어 서버가 정상 작동하는지 확인하세요.

정상 응답:
```json
{
  "status": "ok",
  "message": "Background removal server is running"
}
```

## API 사용법

### 1. `/remove-bg` - 이미지 URL로 배경 제거

**요청:**
```bash
curl -X POST http://localhost:5000/remove-bg \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/image.jpg"}'
```

**응답:**
```json
{
  "success": true,
  "message": "Background removed successfully",
  "image_base64": "data:image/png;base64,iVBORw0KG..."
}
```

### 2. `/remove-bg-file` - 파일 업로드로 배경 제거

**요청:**
```bash
curl -X POST http://localhost:5000/remove-bg-file \
  -F "file=@/path/to/image.jpg" \
  --output removed_bg.png
```

## Next.js와 연동

Next.js 프로젝트의 `.env.local` 파일에 다음을 추가하세요:

```
PYTHON_BG_REMOVAL_URL=http://localhost:5000
```

## 문제 해결

### 포트 5000이 이미 사용 중인 경우

`app.py`의 마지막 줄을 수정하세요:

```python
app.run(host='0.0.0.0', port=5001, debug=True)  # 5001로 변경
```

그리고 `.env.local`도 업데이트:
```
PYTHON_BG_REMOVAL_URL=http://localhost:5001
```

### rembg 설치 오류

```bash
# CUDA가 없는 경우 (CPU 버전)
pip install rembg[cpu]

# GPU가 있는 경우
pip install rembg[gpu]
```

### CORS 오류

`app.py`에서 CORS 설정을 확인하세요:
```python
CORS(app)  # 모든 도메인 허용
```

특정 도메인만 허용하려면:
```python
CORS(app, origins=["http://localhost:3000"])
```

## 성능 최적화

### GPU 사용 (권장)

NVIDIA GPU가 있다면 CUDA를 설치하여 처리 속도를 크게 향상시킬 수 있습니다.

1. [CUDA Toolkit](https://developer.nvidia.com/cuda-downloads) 설치
2. PyTorch GPU 버전 설치:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 모델 캐싱

첫 실행 시 모델이 자동으로 다운로드되어 캐시됩니다:
- **Windows:** `C:\Users\{username}\.u2net`
- **Mac/Linux:** `~/.u2net`

## 배포

### Docker로 실행 (선택사항)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]
```

빌드 & 실행:
```bash
docker build -t bg-remover .
docker run -p 5000:5000 bg-remover
```

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 참고 링크

- [rembg GitHub](https://github.com/danielgatis/rembg)
- [Flask Documentation](https://flask.palletsprojects.com/)
