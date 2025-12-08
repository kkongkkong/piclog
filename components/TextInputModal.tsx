// components/TextInputModal.tsx
import { useState } from "react";

export default function TextInputModal({ onSubmit, onClose }: any) {
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-xl shadow-xl w-[80%] max-w-[320px]">
        <h3 className="font-semibold text-lg mb-3">텍스트 추가</h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border p-2 rounded resize-none"
          rows={3}
          placeholder="텍스트를 입력하세요"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>
            취소
          </button>
          <button
            className="px-3 py-1 bg-[#FFD700] rounded font-semibold"
            onClick={() => onSubmit(text)}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
