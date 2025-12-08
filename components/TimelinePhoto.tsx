import { useState } from "react";
import Transformable from "./Transformable";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { Photo } from "@/lib/types";

interface TimelinePhotoProps {
  photo: Photo;
  hourGroupIndex: number;
  photoIndex?: number;
  onUpdate: (photoId: string, updates: any) => void;
  onDelete: (photoId: string, fileUrl: string) => void;
  onRemoveBg: (photoId: string, fileUrl: string) => void;
}

export default function TimelinePhoto({ photo, hourGroupIndex, photoIndex = 0, onUpdate, onDelete, onRemoveBg }: TimelinePhotoProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 시간대 그룹 인덱스로 Y 위치 계산 (각 그룹은 150px 높이)
  const baseY = hourGroupIndex * 150;
  // X 위치는 사진 인덱스에 따라 간격을 둠 (170px 간격)
  const baseX = photo.position?.x || (50 + photoIndex * 170);

  return (
    <>
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
                  setShowDeleteConfirm(true);
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

    {showDeleteConfirm && (
      <DeleteConfirmModal
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(photo.id, photo.file_url);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
  </>
  );
}
