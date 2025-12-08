import Transformable from "./Transformable";

export default function TimelinePhoto({ photo, hour, startHour = 0, photoIndex = 0, onUpdate, onDelete, onRemoveBg }) {
  // 시간별 Y 위치 계산 (각 시간대는 150px 높이)
  const baseY = (hour - startHour) * 150;
  // X 위치는 사진 인덱스에 따라 간격을 둠 (170px 간격)
  const baseX = photo.position?.x || (50 + photoIndex * 170);

  return (
    <Transformable
      id={photo.id}
      isTimeline={false}
      defaultX={baseX}
      defaultY={photo.position?.y || baseY}
      defaultScale={photo.scale || 1}
      defaultRotation={photo.rotation || 0}
      onChange={(updates) => {
        onUpdate(photo.id, updates);
      }}
    >
      {(selected) => (
        <div className="timeline-photo-sticker">
          {selected && (
            <div className="timeline-photo-actions">
              <button
                className="timeline-action-btn bg-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveBg(photo.id, photo.file_url);
                }}
              >
                배경제거
              </button>
              <button
                className="timeline-action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(photo.id, photo.file_url);
                }}
              >
                삭제
              </button>
            </div>
          )}
          <img src={photo.file_url} alt="" style={{ maxWidth: '150px' }} />
        </div>
      )}
    </Transformable>
  );
}
