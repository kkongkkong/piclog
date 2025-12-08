import { useState } from 'react'

interface OnboardingProps {
  onStart: () => void
}

export default function Onboarding({ onStart }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: '📸',
      title: '사진만 올리면 하루가\n자동으로 정리돼요',
      subtitle: '타임라인 위 사진은 자유롭게 이동,확대,회전이 가능해요',
    },
    {
      icon: '✨',
      title: '사진과 글로 자유롭게 꾸밀 수 있어요',
      subtitle: '사진을 눌러 배경을 제거하고\n오늘을 기록하는 짧은 한 마디를 적어 보세요',
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onStart()
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 animate-fade-in">
      <div className="mx-6 w-full max-w-md rounded-3xl bg-white px-8 py-12 shadow-2xl dark:bg-[#1e1e1e] animate-slide-up">
        <div key={currentStep} className="flex flex-col items-center text-center animate-fade-in">
          <div className="mb-8 text-7xl">{steps[currentStep].icon}</div>

          <h2 className="mb-4 text-2xl font-bold leading-tight text-gray-900 dark:text-white whitespace-pre-line">
            {steps[currentStep].title}
          </h2>

          <p className="mb-10 text-base leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {steps[currentStep].subtitle}
          </p>

          <div className="mb-8 flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-gradient-to-r from-[#7FF94F] to-[#CCFF99] w-6'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full rounded-full bg-gradient-to-r from-[#7FF94F] to-[#CCFF99] py-4 text-lg font-semibold text-gray-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {currentStep === steps.length - 1 ? 'Piclog 시작하기' : '다음'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
