interface SurveyModalProps {
  onClose: () => void
}

export default function SurveyModal({ onClose }: SurveyModalProps) {
  const handleSurveyClick = () => {
    window.open('https://forms.gle/rkGMQH1hdM5qfBu6A', '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Piclog 를 사용해 주셔서 감사합니다!
        </h2>
        <p className="text-base text-gray-700 mb-6 text-center leading-relaxed">
          이용과 관련하여 설문조사를 진행하고 있으니 잠시 시간내어 참여 부탁드리겠습니다😄
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSurveyClick}
            className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-gray-900 font-semibold py-3 rounded-lg hover:opacity-90 transition"
          >
            설문조사 참여하기
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
          >
            창닫기
          </button>
        </div>
      </div>
    </div>
  )
}
