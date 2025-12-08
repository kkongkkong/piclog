interface DeleteConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          삭제 하시겠습니까?
        </h2>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition"
          >
            예
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
          >
            아니오
          </button>
        </div>
      </div>
    </div>
  )
}
