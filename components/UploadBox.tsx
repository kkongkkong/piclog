import { useState } from 'react'
import UploadModal from './UploadModal'
import LoadingModal from './LoadingModal'

interface UploadBoxProps {
  onUploadSuccess: () => void
  currentDate?: Date
}

export default function UploadBox({ onUploadSuccess, currentDate }: UploadBoxProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  return (
    <>
      <button
        className="nav-button"
        onClick={() => setShowUploadModal(true)}
      >
        <span className="text-3xl">➕</span>
        <span className="text-sm font-medium whitespace-nowrap">사진 추가하기</span>
      </button>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={onUploadSuccess}
          onUploadingChange={setIsUploading}
          currentDate={currentDate}
        />
      )}

      {isUploading && <LoadingModal message="사진 업로드 중" />}
    </>
  )
}
