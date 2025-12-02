import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api.js";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Jadwal = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const START_HOUR = 7;
    const END_HOUR = 18;
    const ROW_HEIGHT = 60;

    // 5 days only (Senin-Jumat)
    const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch schedule data from backend
    useEffect(() => {
        const fetchSchedule = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch user's schedules from subscribed courses
                const response = await apiService.getMySchedules();
                const schedules = response.schedules || [];
                
                // Transform API data to match expected format
                const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const colorMap = {
                    'Pemrograman Website': 'bg-blue-100 text-blue-700',
                    'Kecerdasan Buatan': 'bg-purple-100 text-purple-700',
                    'Basis Data': 'bg-indigo-100 text-indigo-700',
                    'Etika Profesi': 'bg-pink-100 text-pink-700',
                    'Wirausaha Digital': 'bg-orange-100 text-orange-700',
                    'Struktur Data': 'bg-green-100 text-green-700'
                };
                
                // Group schedules by day
                const groupedByDay = {};
                schedules.forEach(schedule => {
                    if (!schedule.day_of_week) return;
                    
                    const dayName = dayNames[schedule.day_of_week];
                    if (!groupedByDay[dayName]) {
                        groupedByDay[dayName] = [];
                    }
                    
                    groupedByDay[dayName].push({
                        subject: schedule.course_name,
                        time: `${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}`,
                        room: schedule.room_code || 'TBA',
                        instructor: schedule.lecturer_name || 'TBA',
                        color: colorMap[schedule.course_name] || 'bg-gray-100 text-gray-700'
                    });
                });
                
                // Convert to array format
                const transformedData = Object.entries(groupedByDay).map(([dayName, classes]) => ({
                    dayName,
                    classes
                }));
                
                setScheduleData(transformedData);
            } catch (err) {
                console.error('Error fetching schedules:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [user]);

    // Get Monday of the week containing the given date
    const getMonday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    // Get week days starting from Monday
    const getWeekDays = () => {
        const monday = getMonday(currentDate);
        const days = [];

        for (let i = 0; i < 5; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dayName = DAY_NAMES[date.getDay()];
            const scheduleForDay = scheduleData.find(s => s.dayName === dayName) || { classes: [] };
            days.push({
                dateObj: date,
                dayName: dayName,
                dateNum: date.getDate(),
                classes: scheduleForDay.classes
            });
        }
        return days;
    };

    // Get calendar days for mini calendar
    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const calculateTopPosition = (timeString) => {
        const [hour, minute] = timeString.split(":").map(Number);
        const totalMinutesFromStart = (hour - START_HOUR) * 60 + minute;
        return (totalMinutesFromStart / 60) * ROW_HEIGHT;
    };

    const calculateHeight = (startTime, endTime) => {
        const startTop = calculateTopPosition(startTime);
        const endTop = calculateTopPosition(endTime);
        return endTop - startTop;
    };

    const getCurrentTimePosition = () => {
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        if (hour < START_HOUR || hour > END_HOUR) return null;
        const totalMinutesFromStart = (hour - START_HOUR) * 60 + minute;
        return (totalMinutesFromStart / 60) * ROW_HEIGHT;
    };

    const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
        const hour = START_HOUR + i;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    const weekDays = useMemo(() => getWeekDays(), [currentDate, scheduleData]);
    const calendarDays = useMemo(() => getCalendarDays(), [currentDate]);
    const currentTimeTop = useMemo(() => getCurrentTimePosition(), [currentTime]);
    
    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="min-h-screen bg-[#f5f5f0] pt-24 pb-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Memuat jadwal...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {!loading && (
                    <div className="flex gap-6">
                        {/* LEFT SIDEBAR - Mini Calendar */}
                        <div className="w-64 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => {
                                            const newDate = new Date(currentDate);
                                            newDate.setMonth(newDate.getMonth() - 1);
                                            setCurrentDate(newDate);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                    >
                                        <FaChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            const newDate = new Date(currentDate);
                                            newDate.setMonth(newDate.getMonth() + 1);
                                            setCurrentDate(newDate);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded transition"
                                    >
                                        <FaChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                                        <div key={idx} className="text-center text-xs font-semibold text-gray-500 py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day, idx) => {
                                        if (!day) {
                                            return <div key={`empty-${idx}`} className="aspect-square"></div>;
                                        }

                                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                        const isCurrentDay = isToday(dateObj);
                                        const isSelected = dateObj.toDateString() === currentDate.toDateString();

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setCurrentDate(dateObj)}
                                                className={`aspect-square text-sm rounded flex items-center justify-center transition ${
                                                    isCurrentDay
                                                        ? 'bg-blue-600 text-white font-bold'
                                                        : isSelected
                                                        ? 'bg-blue-100 text-blue-600 font-semibold'
                                                        : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE - Schedule Grid */}
                        <div className="flex-1">
                            {/* Header with Week Days */}
                            <div className="bg-white rounded-t-lg border border-gray-200 border-b-0">
                                <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]">
                                    {/* Time Column Header */}
                                    <div className="p-3 border-r border-gray-200 bg-gray-50"></div>

                                    {/* Day Headers */}
                                    {weekDays.map((day, idx) => {
                                        const isCurrentDay = isToday(day.dateObj);
                                        return (
                                            <div
                                                key={idx}
                                                className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                                                    isCurrentDay ? 'bg-blue-50' : 'bg-white'
                                                }`}
                                            >
                                                <p className={`text-xs font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {day.dayName.substring(0, 3).toUpperCase()}
                                                </p>
                                                <p className={`text-lg font-bold mt-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                                                    {day.dateNum}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Schedule Grid */}
                            <div className="relative overflow-y-auto max-h-[700px] border border-t-0 border-gray-200 rounded-b-lg bg-white">
                                {/* Grid Background */}
                                <div className="absolute inset-0 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]">
                                    {/* Time Column */}
                                    <div className="border-r border-gray-200 bg-gray-50">
                                        {timeSlots.map((time, idx) => (
                                            <div
                                                key={idx}
                                                className="border-b border-gray-200 text-xs text-gray-400 font-medium pr-3 flex items-start justify-end pt-1"
                                                style={{ height: `${ROW_HEIGHT}px` }}
                                            >
                                                {time}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day Columns */}
                                    {weekDays.map((_, idx) => (
                                        <div key={idx} className="border-r border-gray-100 last:border-r-0 relative">
                                            {timeSlots.map((_, tIdx) => (
                                                <div
                                                    key={tIdx}
                                                    className="border-b border-gray-50 w-full"
                                                    style={{ height: `${ROW_HEIGHT}px` }}
                                                ></div>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* Current Time Indicator */}
                                {currentTimeTop !== null && (
                                    <div
                                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
                                        style={{
                                            top: `${80 + currentTimeTop}px`,
                                            gridColumn: '1 / -1'
                                        }}
                                    >
                                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                    </div>
                                )}

                                {/* Schedule Events */}
                                <div className="absolute inset-0 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] pointer-events-none">
                                    <div></div>
                                    {weekDays.map((day, dayIdx) => (
                                        <div key={dayIdx} className="relative pointer-events-auto">
                                            {day.classes?.map((cls, clsIdx) => {
                                                const topPos = calculateTopPosition(cls.time.split(' - ')[0]);
                                                const height = calculateHeight(
                                                    cls.time.split(' - ')[0],
                                                    cls.time.split(' - ')[1]
                                                );

                                                return (
                                                    <div
                                                        key={clsIdx}
                                                        className={`absolute left-1 right-1 rounded p-2 text-xs overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer ${cls.color}`}
                                                        style={{
                                                            top: `${topPos}px`,
                                                            height: `${height}px`
                                                        }}
                                                        title={`${cls.subject}\n${cls.instructor}\n${cls.room}`}
                                                    >
                                                        <p className="font-semibold truncate">{cls.subject}</p>
                                                        <p className="text-xs opacity-75 truncate">{cls.time}</p>
                                                        <p className="text-xs opacity-75 truncate">{cls.room}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jadwal;
