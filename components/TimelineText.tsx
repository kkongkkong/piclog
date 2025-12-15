import { useState } from "react";
import Transformable from "./Transformable";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface TextObject {
  id: string;
  hour: number;
  text: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

interface TimelineTextProps {
  textObject: TextObject;
  baseY: number;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export default function TimelineText({ textObject, baseY, onUpdate, onDelete }: TimelineTextProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
    <Transformable
      id={textObject.id}
      isTimeline={false}
      defaultX={textObject.position?.x || 100}
      defaultY={baseY + (textObject.position?.y || 50)}  // 절대 좌표 = baseY + 상대 좌표
      defaultScale={textObject.scale || 1}
      defaultRotation={textObject.rotation || 0}
      onChange={(updates) => {
        // 절대 좌표를 상대 좌표로 변환하여 저장
        const relativeUpdates = {
          position: { x: updates.x, y: updates.y - baseY },  // 상대 좌표 = 절대 좌표 - baseY
          scale: updates.scale,
          rotation: updates.rotation
        };
        onUpdate(textObject.id, relativeUpdates);
      }}
    >
      {(selected) => (
        <div className="timeline-text-sticker">
          {selected && (
            <div className="timeline-photo-actions">
              <button
                className="timeline-action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                삭제
              </button>
            </div>
          )}
          <div className="timeline-text-content">
            {textObject.text}
          </div>
        </div>
      )}
    </Transformable>

    {showDeleteConfirm && (
      <DeleteConfirmModal
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(textObject.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
    </>
  );
}
