import Transformable from "./Transformable";

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
  hourGroupIndex: number;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export default function TimelineText({ textObject, hourGroupIndex, onUpdate, onDelete }: TimelineTextProps) {
  // 시간대 그룹 인덱스로 Y 위치 계산
  const baseY = hourGroupIndex * 150;

  return (
    <Transformable
      id={textObject.id}
      isTimeline={false}
      defaultX={textObject.position?.x || 100}
      defaultY={textObject.position?.y || baseY}
      defaultScale={textObject.scale || 1}
      defaultRotation={textObject.rotation || 0}
      onChange={(updates) => onUpdate(textObject.id, updates)}
    >
      {(selected) => (
        <div className="timeline-text-sticker">
          {selected && (
            <div className="timeline-photo-actions">
              <button
                className="timeline-action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(textObject.id);
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
  );
}
