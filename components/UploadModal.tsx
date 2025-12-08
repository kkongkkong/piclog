import { useRef } from 'react'
import { getGuestId } from '@/utils/guestId'

interface UploadModalProps {
  onClose: () => void
  onUploadSuccess: () => void
  onUploadingChange: (uploading: boolean) => void
  currentDate?: Date
}

export default function UploadModal({ onClose, onUploadSuccess, onUploadingChange, currentDate }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (files.length > 3) {
      alert('최대 3장까지 업로드 가능합니다.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    onUploadingChange(true)
    onClose()

    const guestId = getGuestId()
    let successCount = 0
    let errorMessages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        const formData = new FormData()
        formData.append('file', file)
        formData.append('guestId', guestId)

        if (currentDate) {
          formData.append('targetDate', currentDate.toISOString())
        }

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!result.success) {
          errorMessages.push(`${file.name}: ${result.message}`)
        } else {
          successCount++
        }
      }

      onUploadingChange(false)

      if (successCount > 0) {
        onUploadSuccess()
      }

      if (errorMessages.length > 0) {
        alert(`오류: ${errorMessages.join(', ')}`)
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      onUploadingChange(false)
      alert(`업로드 오류: ${error.message}`)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">사진 업로드</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            최대 3장의 사진이 업로드 가능합니다
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex gap-3">
            <button
              onClick={handleFileSelect}
              className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-gray-900 font-semibold py-3 rounded-lg hover:opacity-90 transition"
            >
              사진 선택
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
