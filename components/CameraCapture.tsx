import { useState, useRef, useEffect } from 'react'

interface CameraCaptureProps {
  onClose: () => void
  onUploadSuccess: () => void
  onUploadingChange: (isUploading: boolean) => void
  currentDate?: Date
}

export default function CameraCapture({
  onClose,
  onUploadSuccess,
  onUploadingChange,
  currentDate,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 카메라 초기화
  useEffect(() => {
    let isMounted = true

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })

        if (isMounted) {
          setStream(mediaStream)
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
        }
      } catch (err) {
        console.error('Camera error:', err)
        if (isMounted) {
          setError('카메라 접근 권한이 필요합니다.')
        }
      }
    }

    initCamera()

    return () => {
      isMounted = false
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  // 사진 촬영
  const handleCapture = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
          setCapturedImage(dataUrl)
          setShowConfirmModal(true)
        }
      },
      'image/jpeg',
      0.9
    )
  }

  // 카메라 전환
  const handleSwitchCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  // 다시 촬영
  const handleRetake = () => {
    setCapturedImage(null)
    setCapturedBlob(null)
    setShowConfirmModal(false)
  }

  // 업로드 확인
  const handleConfirmUpload = async () => {
    if (!capturedBlob) return

    try {
      onUploadingChange(true)
      setShowConfirmModal(false)

      // guestId 가져오기
      const guestId = localStorage.getItem('piclog_guest_id')
      if (!guestId) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }

      // File 객체 생성
      const file = new File([capturedBlob], `camera_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      // FormData 생성
      const formData = new FormData()
      formData.append('file', file)
      formData.append('guestId', guestId)
      formData.append('lastModified', file.lastModified.toString())

      if (currentDate) {
        formData.append('targetDate', currentDate.toISOString())
      }

      // 업로드
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드에 실패했습니다.')
      }

      // 성공 처리
      onUploadSuccess()
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      onUploadingChange(false)
    }
  }

  // 에러 화면
  if (error) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📷</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px', color: '#2C3E50' }}>
          카메라를 사용할 수 없습니다
        </div>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '30px' }}>
          {error}
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px',
            background: '#2C3E50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    )
  }

  return (
    <>
      {/* 카메라 뷰 또는 미리보기 */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'black',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Video 또는 미리보기 이미지 */}
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* 컨트롤 바 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '30px 40px',
          paddingBottom: 'calc(30px + env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        }}>
          {capturedImage ? (
            <>
              {/* 다시 촬영 */}
              <button
                onClick={handleRetake}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                }}
              >
                다시 촬영
              </button>
              <div style={{ flex: 1 }} />
              {/* 사진 사용 */}
              <button
                onClick={() => setShowConfirmModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                사진 사용
              </button>
            </>
          ) : (
            <>
              {/* 카메라 전환 */}
              <button
                onClick={handleSwitchCamera}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid white',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                🔄
              </button>

              {/* 촬영 버튼 */}
              <button
                onClick={handleCapture}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '4px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                }}
              />

              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid white',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* 업로드 확인 모달 */}
      {showConfirmModal && capturedImage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10002,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
          }}>
            {/* 썸네일 */}
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}>
              <img
                src={capturedImage}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* 메시지 */}
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#2C3E50',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              사진을 타임라인에 업로드 하시겠습니까?
            </div>

            {/* 버튼 */}
            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                onClick={handleRetake}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                다시 촬영
              </button>
              <button
                onClick={handleConfirmUpload}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
