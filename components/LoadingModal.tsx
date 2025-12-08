interface LoadingModalProps {
  message: string;
}

export default function LoadingModal({ message }: LoadingModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
        <p className="text-lg font-semibold text-gray-800">{message}</p>
      </div>
    </div>
  );
}
