import { useState } from 'react'
import CameraCapture from './CameraCapture'
import LoadingModal from './LoadingModal'

interface CameraButtonProps {
  onUploadSuccess: () => void
  currentDate?: Date
}

export default function CameraButton({ onUploadSuccess, currentDate }: CameraButtonProps) {
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  return (
    <>
      <button
        className="nav-button"
        onClick={() => setShowCameraCapture(true)}
      >
        <span className="text-2xl">📷</span>
        <span className="text-sm font-medium">촬영하기</span>
      </button>

      {showCameraCapture && (
        <CameraCapture
          onClose={() => setShowCameraCapture(false)}
          onUploadSuccess={onUploadSuccess}
          onUploadingChange={setIsUploading}
          currentDate={currentDate}
        />
      )}

      {isUploading && <LoadingModal message="사진 업로드 중" />}
    </>
  )
}
