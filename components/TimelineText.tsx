import Transformable from "./Transformable";

export default function TimelineText({ textObject, startHour = 0, onUpdate, onDelete }) {
  // 시간별 Y 위치 계산
  const baseY = (textObject.hour - startHour) * 150;

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
