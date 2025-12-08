import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getGuestId } from '@/utils/guestId';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  currentDate: Date;
}

export default function Calendar({ onDateSelect, currentDate }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [recordedDates, setRecordedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecordedDates();
  }, [viewDate]);

  const loadRecordedDates = async () => {
    const guestId = getGuestId();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // 해당 월의 시작과 끝
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const { data, error } = await supabase
      .from('photos')
      .select('timestamp')
      .eq('user_id', guestId)
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', endOfMonth.toISOString());

    if (error) {
      console.error('Error loading recorded dates:', error);
      return;
    }

    // 날짜별로 그룹화 (YYYY-MM-DD 형식)
    const dates = new Set<string>();
    (data || []).forEach((item) => {
      const date = new Date(item.timestamp);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dates.add(dateStr);
    });

    setRecordedDates(dates);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onDateSelect(selectedDate);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(viewDate);

  // 캘린더 그리드 생성
  const calendarDays = [];

  // 빈 칸 추가 (이전 달)
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasRecord = recordedDates.has(dateStr);
    const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
    const isSelected = currentDate.toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();

    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleDateClick(day)}
      >
        <span className="day-number">{day}</span>
        {hasRecord && <div className="record-indicator"></div>}
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-btn">
          ←
        </button>
        <h2 className="calendar-month">
          {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
        </h2>
        <button onClick={handleNextMonth} className="calendar-nav-btn">
          →
        </button>
      </div>

      <div className="calendar-weekdays">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>

      <div className="calendar-grid">
        {calendarDays}
      </div>
    </div>
  );
}
