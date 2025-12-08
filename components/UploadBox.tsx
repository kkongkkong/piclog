import { useState, useRef } from 'react'
import { getGuestId } from '@/utils/guestId'
import LoadingModal from './LoadingModal'

interface UploadBoxProps {
  onUploadSuccess: () => void
}

export default function UploadBox({ onUploadSuccess }: UploadBoxProps) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setMessage('')

    const guestId = getGuestId()
    console.log('Guest ID:', guestId)

    let successCount = 0
    let errorMessages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`Uploading file ${i + 1}/${files.length}:`, file.name)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('guestId', guestId)

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        console.log('Upload result:', result)

        if (!result.success) {
          errorMessages.push(`${file.name}: ${result.message}`)
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        setMessage(`${successCount}개 사진 업로드 완료!`)
        setShowModal(true)
        onUploadSuccess()

        // 2초 후 모달 자동 닫기
        setTimeout(() => {
          setShowModal(false)
        }, 2000)
      }

      if (errorMessages.length > 0) {
        setMessage(`오류: ${errorMessages.join(', ')}`)
        setShowModal(true)

        setTimeout(() => {
          setShowModal(false)
        }, 3000)
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      setMessage(`업로드 오류: ${error.message}`)
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <label
        htmlFor="file-upload"
        className="nav-button upload-button"
        style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
      >
        <span className="text-3xl">➕</span>
        <span className="text-sm font-medium">사진 추가하기</span>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {/* 업로드 중 모달 */}
      {uploading && <LoadingModal message="사진이 업로드 중입니다..." />}

      {/* 업로드 완료 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm mx-4 animate-fade-in">
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-semibold text-gray-800">{message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
