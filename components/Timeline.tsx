// components/Timeline.tsx
import { useState, useEffect, useRef } from "react";
import TimelineItem from "./TimelineItem";
import TimelinePhoto from "./TimelinePhoto";
import TimelineText from "./TimelineText";
import TextInputModal from "./TextInputModal";
import LoadingModal from "./LoadingModal";
import { Photo } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { getGuestId } from "@/utils/guestId";

interface TimelineProps {
  refreshTrigger?: number;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

interface GroupedPhotos {
  hour: number;
  photos: Photo[];
}

interface TextObject {
  id: string;
  hour: number;
  text: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

export default function Timeline({ refreshTrigger, currentDate, onDateChange }: TimelineProps) {
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos[]>([]);
  const [textObjects, setTextObjects] = useState<TextObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [contextMenuHour, setContextMenuHour] = useState<number | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  /** -------------------------------
   * 📌 1. Load Timeline
   * ------------------------------- */
  useEffect(() => {
    loadTimeline();
  }, [refreshTrigger, currentDate]);

  const loadTimeline = async () => {
    setLoading(true);
    const guestId = getGuestId();

    // 선택된 날짜의 시작과 끝 계산
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", guestId)
      .gte("timestamp", startOfDay.toISOString())
      .lte("timestamp", endOfDay.toISOString())
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error loading timeline:", error);
      setLoading(false);
      return;
    }

    const grouped: Record<number, Photo[]> = {};

    (data || []).forEach((p: Photo) => {
      if (!grouped[p.hour]) grouped[p.hour] = [];
      grouped[p.hour].push(p);
    });

    setGroupedPhotos(
      Object.entries(grouped)
        .map(([hour, photos]) => ({
          hour: Number(hour),
          photos,
        }))
        .sort((a, b) => a.hour - b.hour)
    );

    setLoading(false);
  };

  /** -------------------------------
   * 📌 2. Text Handling
   * ------------------------------- */
  const handleContextMenu = (e: React.MouseEvent, hour: number) => {
    e.preventDefault();
    setContextMenuHour(hour);
    setShowTextModal(true);
  };

  const handleAddText = (text: string) => {
    if (!text.trim() || contextMenuHour === null) return;

    const newText: TextObject = {
      id: `text-${Date.now()}`,
      hour: contextMenuHour,
      text: text.trim(),
      position: { x: 100, y: 50 },
      scale: 1,
      rotation: 0,
    };

    console.log('Adding new text:', newText);
    setTextObjects((prev) => [...prev, newText]);
    setShowTextModal(false);
    setContextMenuHour(null);
  };

  const handleTextUpdate = (id: string, updates: Partial<TextObject>) => {
    setTextObjects((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleTextDelete = (id: string) => {
    setTextObjects((prev) => prev.filter((t) => t.id !== id));
  };

  /** -------------------------------
   * 📌 3. Photo Update, Delete & Remove BG
   * ------------------------------- */
  const handlePhotoUpdate = async (photoId: string, updates: any) => {
    // DB에 위치 저장
    const { error } = await supabase
      .from("photos")
      .update({
        position: updates.x !== undefined && updates.y !== undefined ? { x: updates.x, y: updates.y } : undefined,
        scale: updates.scale,
        rotation: updates.rotation,
      })
      .eq("id", photoId);

    if (error) {
      console.error("Error updating photo:", error);
    }
  };

  const handlePhotoDelete = async (photoId: string, fileUrl: string) => {
    const res = await fetch("/api/photos/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, fileUrl }),
    });
    const json = await res.json();
    if (json.success) loadTimeline();
  };

  const handlePhotoRemoveBg = async (photoId: string, url: string) => {
    try {
      setIsRemovingBg(true);
      console.log("Removing background for:", photoId, url);
      const res = await fetch("/api/photos/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, imageUrl: url }),
      });
      const json = await res.json();
      console.log("Remove BG response:", json);
      setIsRemovingBg(false);
      if (json.success) {
        loadTimeline();
      } else {
        alert(`배경 제거 실패: ${json.message}`);
      }
    } catch (error) {
      console.error("Remove BG error:", error);
      setIsRemovingBg(false);
      alert("배경 제거 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="timeline-loading">Loading...</div>;

  // 사진이 없을 때
  if (groupedPhotos.length === 0) {
    return (
      <div className="timeline">
        {/* ---------------- HEADER ---------------- */}
        <div className="timeline-header mb-6">
          <button
            className="date-nav-btn"
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() - 1);
              onDateChange(d);
            }}
          >
            ←
          </button>

          <div className="timeline-date-info">
            <p className="timeline-date">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{" "}
              {currentDate.getDate()}일
            </p>
          </div>

          <button
            className="date-nav-btn"
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 1);
              onDateChange(d);
            }}
          >
            →
          </button>
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-lg">이 날의 사진이 없습니다</p>
          <p className="text-sm mt-2">사진을 업로드해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {/* ---------------- HEADER ---------------- */}
      <div className="timeline-header mb-6">
        <button
          className="date-nav-btn"
          onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            onDateChange(d);
          }}
        >
          ←
        </button>

        <div className="timeline-date-info">
          <p className="timeline-date">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{" "}
            {currentDate.getDate()}일
          </p>
        </div>

        <button
          className="date-nav-btn"
          onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            onDateChange(d);
          }}
        >
          →
        </button>
      </div>

      {/* ---------------- TIMELINE CONTAINER ---------------- */}
      <div
        className="timeline-container"
        style={{
          minHeight: groupedPhotos.length > 0
            ? `${(Math.max(...groupedPhotos.map(g => g.hour)) - Math.min(...groupedPhotos.map(g => g.hour)) + 1) * 150 + 100}px`
            : '600px'
        }}
        onContextMenu={(e) => handleContextMenu(e, 0)}
      >
        {/* Timeline with hour markers */}
        <div className="timeline-hours">
          {(() => {
            const minHour = groupedPhotos.length > 0 ? Math.min(...groupedPhotos.map(g => g.hour)) : 0;
            const maxHour = groupedPhotos.length > 0 ? Math.max(...groupedPhotos.map(g => g.hour)) : 23;
            const hours = [];
            for (let i = minHour; i <= maxHour; i++) {
              hours.push(<TimelineItem key={i} hour={i} startHour={minHour} />);
            }
            return hours;
          })()}
        </div>

        {/* Photos layer - absolute positioned */}
        <div
          className="timeline-photos-layer"
          onContextMenu={(e) => {
            e.preventDefault();
            const minHour = groupedPhotos.length > 0 ? Math.min(...groupedPhotos.map(g => g.hour)) : 0;

            // 클릭 위치 기반 hour 계산
            const rect = e.currentTarget.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const hourIndex = Math.floor(clickY / 150);
            const targetHour = minHour + hourIndex;

            setContextMenuHour(targetHour);
            setShowTextModal(true);
          }}
          onTouchStart={(e) => {
            const minHour = groupedPhotos.length > 0 ? Math.min(...groupedPhotos.map(g => g.hour)) : 0;
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const clickY = touch.clientY - rect.top;
            const hourIndex = Math.floor(clickY / 150);
            const targetHour = minHour + hourIndex;

            longPressTimer.current = setTimeout(() => {
              setContextMenuHour(targetHour);
              setShowTextModal(true);
            }, 600);
          }}
          onTouchEnd={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }}
          onTouchMove={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }}
        >
          {(() => {
            const minHour = groupedPhotos.length > 0 ? Math.min(...groupedPhotos.map(g => g.hour)) : 0;
            return groupedPhotos.flatMap(({ hour, photos }) =>
              photos.map((p, index) => (
                <TimelinePhoto
                  key={p.id}
                  photo={p}
                  hour={hour}
                  startHour={minHour}
                  photoIndex={index}
                  onUpdate={handlePhotoUpdate}
                  onDelete={handlePhotoDelete}
                  onRemoveBg={handlePhotoRemoveBg}
                />
              ))
            );
          })()}

          {/* text objects */}
          {(() => {
            const minHour = groupedPhotos.length > 0 ? Math.min(...groupedPhotos.map(g => g.hour)) : 0;
            return textObjects.map((t) => (
              <TimelineText
                key={t.id}
                textObject={t}
                startHour={minHour}
                onUpdate={handleTextUpdate}
                onDelete={handleTextDelete}
              />
            ));
          })()}
        </div>
      </div>

      {/* text modal */}
      {showTextModal && (
        <TextInputModal
          onSubmit={handleAddText}
          onClose={() => {
            setShowTextModal(false);
            setContextMenuHour(null);
          }}
        />
      )}

      {/* loading modal */}
      {isRemovingBg && <LoadingModal message="배경을 제거하고 있습니다..." />}
    </div>
  );
}
