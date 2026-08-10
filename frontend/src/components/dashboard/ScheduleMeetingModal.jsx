import { useState, useRef, useEffect } from "react";
import { useMeetingStore } from "../../store/useMeetingStore";

const ScheduleMeetingModal = ({ isOpen, onClose }) => {
  const { scheduleMeeting, isSchedulingMeeting } = useMeetingStore();
  
  // Form States
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [time, setTime] = useState(""); // "HH:MM" string
  
  // UI Calendar Engine States
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !selectedDate || !time) {
      return alert("Please fill out all fields");
    }

    // Combine custom date and time into a single valid ISO String
    const [hours, minutes] = time.split(":");
    const finalDateTime = new Date(selectedDate);
    finalDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const result = await scheduleMeeting({
      title: title.trim(),
      scheduledFor: finalDateTime.toISOString(),
    });

    if (result.success) {
      setTitle("");
      setSelectedDate(null);
      setTime("");
      onClose();
    } else {
      alert(result.message);
    }
  };

  // Calendar Calculation Engine Helpers
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarCells = [];

    // Padding for empty days at start of month
    for (let i = 0; i < firstDay; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Actual calendar numeric days
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = cellDate < today;
      const isSelected = selectedDate && selectedDate.toDateString() === cellDate.toDateString();

      calendarCells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => {
            setSelectedDate(cellDate);
            setShowCalendar(false);
          }}
          className={`p-2 text-sm rounded-lg font-medium transition-all ${
            isSelected 
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold" 
              : isPast 
                ? "text-slate-600 cursor-not-allowed opacity-40" 
                : "text-slate-300 hover:bg-slate-700/60"
          }`}
        >
          {day}
        </button>
      );
    }
    return calendarCells;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <form 
        onSubmit={handleSchedule}
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-md p-6 text-white border shadow-2xl bg-slate-900 border-slate-800 rounded-2xl"
      >
        <h2 className="mb-6 text-xl font-bold tracking-wide text-slate-100">Schedule Meeting</h2>
        
        <div className="space-y-5">
          {/* Title Input */}
          <div>
            <label className="block mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
              Meeting Title
            </label>
            <input 
              type="text" 
              placeholder="e.g., Weekly Sprint Review" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              disabled={isSchedulingMeeting}
              className="w-full p-3 transition border rounded-xl bg-slate-800/50 border-slate-700/60 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-200 placeholder:text-slate-500"
              required
              autoFocus
            />
          </div>

          {/* Form Controls Grid Splitting Date & Time Separately */}
          <div className="grid grid-cols-2 gap-4">
            {/* Custom Modern Calendar Picker */}
            <div className="relative" ref={calendarRef}>
              <label className="block mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
                Date
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center justify-between w-full p-3 text-left transition border rounded-xl bg-slate-800/50 border-slate-700/60 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-200"
              >
                <span className={selectedDate ? "text-slate-200" : "text-slate-500"}>
                  {selectedDate ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select Date"}
                </span>
                <span className="text-purple-400">📅</span>
              </button>

              {/* Custom Dropdown Calendar Engine UI Panel */}
              {showCalendar && (
                <div className="absolute left-0 z-50 p-4 mt-2 duration-150 border shadow-2xl top-full w-72 bg-slate-800 border-slate-700 rounded-xl animate-in fade-in zoom-in-95">
                  {/* Calendar Top Header Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-slate-700 text-slate-400">◀</button>
                    <span className="text-sm font-semibold text-slate-200">
                      {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-slate-700 text-slate-400">▶</button>
                  </div>

                  {/* Day Names Grid Label */}
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="p-1 text-xs font-bold text-slate-500">{day}</div>
                    ))}
                  </div>

                  {/* Operational Calendar Render Matrix Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {generateCalendarDays()}
                  </div>
                </div>
              )}
            </div>

            {/* Time Selection Field Input */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
                Time
              </label>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                disabled={isSchedulingMeeting}
                className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Controls Modal Buttons */}
        <div className="flex gap-3 mt-8">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3 font-medium transition rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={isSchedulingMeeting || !title.trim() || !selectedDate || !time}
            className="flex-1 py-3 font-medium text-white transition bg-purple-600 shadow-lg rounded-xl hover:bg-purple-500 shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSchedulingMeeting ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleMeetingModal;
