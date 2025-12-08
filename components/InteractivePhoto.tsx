import { useState, useRef, useEffect } from 'react'
import { Photo } from '@/lib/types'

interface InteractivePhotoProps {
  photo: Photo
  photoIndex: number
  isTimelineMode?: boolean
  onDelete: (photoId: string) => void
  onRemoveBg: (photoId: string) => void
  onUpdate?: (photoId: string, updates: Partial<Photo>) => void
}

export default function InteractivePhoto({
  photo,
  photoIndex,
  isTimelineMode = false,
  onDelete,
  onRemoveBg,
  onUpdate,
}: InteractivePhotoProps) {
  const [isSelected, setIsSelected] = useState(false)

  // 초기 위치 설정: DB에 저장된 값이 없으면 왼쪽 정렬로 배치
  const getInitialPosition = () => {
    if (photo.position?.x !== undefined && photo.position?.y !== undefined) {
      return photo.position
    }
    // 왼쪽 정렬: 노란 선 바로 오른쪽에 배치
    // 여러 장인 경우 약간씩 오른쪽/아래로 오프셋
    return {
      x: 15 + (photoIndex * 25), // 왼쪽에서 시작, 사진마다 25px 간격
      y: photoIndex * 20,         // 약간씩 아래로 배치
    }
  }

  const [transform, setTransform] = useState({
    scale: photo.scale || 1,
    rotation: photo.rotation || 0,
    x: getInitialPosition().x,
    y: getInitialPosition().y,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialDistance, setInitialDistance] = useState(0)
  const [initialRotation, setInitialRotation] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  // 두 터치 포인트 간 거리 계산
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 두 터치 포인트 간 각도 계산
  const getAngle = (touch1: Touch, touch2: Touch) => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI
  }

  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTimelineMode || !isSelected) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    e.stopPropagation()
  }

  // 마우스 드래그 중
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }))
  }

  // 마우스 드래그 종료
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      onUpdate?.(photo.id, {
        position: { x: transform.x, y: transform.y },
        scale: transform.scale,
        rotation: transform.rotation,
      })
    }
  }

  // 마우스 휠로 확대/축소
  const handleWheel = (e: React.WheelEvent) => {
    if (isTimelineMode || !isSelected) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
    }))
  }

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTimelineMode || !isSelected) return
    e.stopPropagation()

    if (e.touches.length === 1) {
      // 단일 터치: 드래그
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      })
    } else if (e.touches.length === 2) {
      // 두 손가락: 확대/축소 및 회전
      setInitialDistance(getDistance(e.touches[0], e.touches[1]))
      setInitialRotation(getAngle(e.touches[0], e.touches[1]))
    }
  }

  // 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTimelineMode || !isSelected) return
    e.stopPropagation()

    if (e.touches.length === 1 && isDragging) {
      // 단일 터치: 드래그
      setTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      }))
    } else if (e.touches.length === 2) {
      // 두 손가락: 확대/축소 및 회전
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const currentAngle = getAngle(e.touches[0], e.touches[1])

      const scaleChange = currentDistance / initialDistance
      const rotationChange = currentAngle - initialRotation

      setTransform(prev => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, prev.scale * scaleChange)),
        rotation: prev.rotation + rotationChange,
      }))

      setInitialDistance(currentDistance)
      setInitialRotation(currentAngle)
    }
  }

  // 터치 종료
  const handleTouchEnd = () => {
    if (isDragging || isSelected) {
      setIsDragging(false)
      onUpdate?.(photo.id, {
        position: { x: transform.x, y: transform.y },
        scale: transform.scale,
        rotation: transform.rotation,
      })
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // 클릭 외부 영역 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false)
      }
    }

    if (isSelected) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSelected])

  const handlePhotoClick = (e: React.MouseEvent) => {
    if (isTimelineMode) return
    e.stopPropagation()
    setIsSelected(!isSelected)
  }

  const handleDelete = async () => {
    if (confirm('이 사진을 삭제하시겠습니까?')) {
      await onDelete(photo.id)
    }
  }

  const handleRemoveBg = async () => {
    if (confirm('배경을 제거하시겠습니까?')) {
      await onRemoveBg(photo.id)
    }
  }

  // 타임라인 모드: 정적 레이아웃
  if (isTimelineMode) {
    return (
      <div className="timeline-photo-wrapper">
        <img
          src={photo.file_url}
          alt="Photo"
          className="timeline-photo"
        />
        {/* 타임라인 모드에서는 배경제거/삭제 버튼을 간단하게 표시 */}
        <div className="timeline-photo-actions">
          <button className="timeline-action-btn" onClick={handleRemoveBg}>
            배경제거
          </button>
          <button className="timeline-action-btn delete" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>
    )
  }

  // 스티커 모드: 인터랙티브 레이아웃
  return (
    <div className="content-block">
      <div
        ref={containerRef}
        className={`interactive-photo ${isSelected ? 'selected' : ''}`}
        style={{
          left: `${transform.x}px`,
          top: `${transform.y}px`,
          transform: `scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          cursor: isDragging ? 'grabbing' : isSelected ? 'grab' : 'pointer',
        }}
        onClick={handlePhotoClick}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={photo.file_url}
          alt="Photo"
          draggable={false}
          className="photo-block"
        />

        {isSelected && (
          <div className="photo-actions" onClick={(e) => e.stopPropagation()}>
            <button className="action-btn remove-bg" onClick={handleRemoveBg}>
              배경제거
            </button>
            <button className="action-btn delete" onClick={handleDelete}>
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 텍스트 블록 영역 (추후 확장 가능) */}
      <div className="text-block"></div>
    </div>
  )
}
