import { useState } from 'react'
import UploadModal from './UploadModal'

interface UploadBoxProps {
  onUploadSuccess: () => void
  currentDate?: Date
}

export default function UploadBox({ onUploadSuccess, currentDate }: UploadBoxProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)

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
          currentDate={currentDate}
        />
      )}
    </>
  )
}
