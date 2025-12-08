// components/TimelineItem.tsx
export default function TimelineItem({
  hour,
  topPosition,
  height
}: {
  hour: number;
  topPosition: number;
  height: number;
}) {
  return (
    <div className="timeline-hour-item" style={{ top: `${topPosition}px` }}>
      <span className="timeline-hour-label">
        {hour.toString().padStart(2, "0")}:00
      </span>
      <div className="timeline-hour-line" style={{ height: `${height - 30}px` }} />
    </div>
  );
}
