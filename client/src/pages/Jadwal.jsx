import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api.js";
import { FaChevronLeft, FaChevronRight, FaExchangeAlt, FaCalendarAlt, FaSearch } from "react-icons/fa";
import RoomAvailability from "../components/RoomAvailability";

// Helper function to check if a date is within the allowed range (up to Dec 5, 2025)
const isDateInRange = (date) => {
  const maxDate = new Date('2025-12-05T23:59:59');
  return new Date(date) <= maxDate;
};

// Helper function to format time for display
const formatTimeDisplay = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

const Jadwal = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [showRoomSearch, setShowRoomSearch] = useState(false);
    const [directReschedule, setDirectReschedule] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        date: '',
        startTime: '08:00',
        endTime: '09:30',
        roomId: '',
        roomName: ''
    });

    const START_HOUR = 7;
    const END_HOUR = 23; // Extend to 11 PM
    const ROW_HEIGHT = 60;

    // 5 days only (Senin-Jumat)
    const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Handle reschedule button click
    const handleRescheduleClick = (event) => {
        setSelectedEvent(event);
        setIsRescheduling(true);
        setShowRoomSearch(false);
        setDirectReschedule(false);
        // Pre-fill with current event details
        setNewSchedule({
            date: event.event_date || new Date().toISOString().split('T')[0],
            startTime: event.start_time || '08:00',
            endTime: event.end_time || '09:30',
            roomId: event.room_id || '',
            roomName: event.room_name || ''
        });
    };

    // Handle direct reschedule form change
    const handleScheduleChange = (e) => {
        const { name, value } = e.target;
        setNewSchedule(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle direct reschedule submission
    const handleDirectReschedule = async () => {
        if (!newSchedule.date || !newSchedule.startTime || !newSchedule.endTime) {
            alert('Mohon isi semua field yang diperlukan');
            return;
        }

        // Validate date is within allowed range
        if (!isDateInRange(newSchedule.date)) {
            alert('Maaf, jadwal hanya bisa dibuat hingga 5 Desember 2025');
            return;
        }

        try {
            // Here you would call your API to update the schedule
            // await apiService.updateSchedule({
            //   eventId: selectedEvent.id,
            //   ...newSchedule
            // });
            alert('Jadwal berhasil diubah!');
            setIsRescheduling(false);
            // Refresh the schedule
            fetchScheduleData();
        } catch (error) {
            console.error('Error rescheduling:', error);
            alert('Gagal mengubah jadwal. Silakan coba lagi.');
        }
    };

    // Handle slot selection from RoomAvailability
    const handleSlotSelect = (slot) => {
        // Update the new schedule with selected slot
        setNewSchedule({
            date: slot.date,
            startTime: slot.start_time,
            endTime: slot.end_time,
            roomId: slot.room_id,
            roomName: slot.room_name
        });
        setShowRoomSearch(false);
    };

    // Close the reschedule dialog
    const closeRescheduleDialog = () => {
        setIsRescheduling(false);
        setSelectedEvent(null);
        setShowRoomSearch(false);
        setDirectReschedule(false);
    };

    // Filter out dates after December 5, 2025
    const filteredScheduleData = useMemo(() => {
        if (!scheduleData) return [];

        return scheduleData.map(day => ({
            ...day,
            classes: day.classes?.filter(cls => {
                if (!cls.event_date) return true;
                return isDateInRange(cls.event_date);
            })
        }));
    }, [scheduleData]);

    // Fetch schedule data from backend
    useEffect(() => {
        let isMounted = true;

        const fetchSchedule = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch user's schedules from subscribed courses
                console.log('🔄 Fetching schedules...');
                const response = await apiService.getMySchedules();
                console.log('📦 Raw API response:', response);

                // Handle both response formats: direct array or { schedules: [...] }
                const schedules = Array.isArray(response) ? response :
                    (response.schedules || response.data?.schedules || []);

                console.log('📅 Processed schedules:', schedules);

                if (!isMounted) return;

                // Transform API data - keep day_of_week as is
                const colorMap = {
                    'Pemrograman Website': 'bg-blue-100 text-blue-700',
                    'Kecerdasan Buatan': 'bg-purple-100 text-purple-700',
                    'Basis Data': 'bg-indigo-100 text-indigo-700',
                    'Etika Profesi': 'bg-pink-100 text-pink-700',
                    'Wirausaha Digital': 'bg-orange-100 text-orange-700',
                    'Struktur Data': 'bg-green-100 text-green-700'
                };

                // Transform schedules - handle potential undefined values
                const transformedData = schedules.map(schedule => {
                    const startTime = schedule.start_time ?
                        (typeof schedule.start_time === 'string' ? schedule.start_time.substring(0, 5) : '00:00') : '00:00';
                    const endTime = schedule.end_time ?
                        (typeof schedule.end_time === 'string' ? schedule.end_time.substring(0, 5) : '00:00') : '00:00';

                    return {
                        id: schedule.id || Date.now() + Math.random(),
                        course_id: schedule.course_id || null,
                        course_name: schedule.course_name || 'Mata Kuliah',
                        day_of_week: schedule.day_of_week || 1, // Default to Monday if not set
                        start_time: startTime,
                        end_time: endTime,
                        room_code: schedule.room_code || schedule.room_name || 'TBA',
                        lecturer_name: schedule.lecturer_name || 'Dosen',
                        color: colorMap[schedule.course_name] || 'bg-gray-100 text-gray-700'
                    };
                });

                console.log('🔄 Transformed schedules:', transformedData);

                if (isMounted) {
                    setScheduleData(transformedData);
                }
            } catch (err) {
                console.error('❌ Error fetching schedules:', err);
                if (isMounted) {
                    setError(err.message || 'Gagal memuat jadwal');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSchedule();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [user]);

    // Get Monday of the week containing the given date
    const getMonday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    // Get week days starting from Monday (5 working days only)
    const getWeekDays = () => {
        const monday = getMonday(currentDate);
        const days = [];
        const DAY_INDICES = [1, 2, 3, 4, 5]; // Monday to Friday (1-5)

        // Debug: Log all schedule days for reference
        console.log('📅 All schedule days:', scheduleData.map(s => ({
            course: s.course_name,
            day: s.day_of_week,
            dayName: DAY_NAMES[s.day_of_week],
            time: `${s.start_time}-${s.end_time}`
        })));

        DAY_INDICES.forEach((apiDayOfWeek, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);

            const classesForDay = scheduleData.filter(s => {
                const scheduleDay = typeof s.day_of_week === 'string' ?
                    parseInt(s.day_of_week, 10) : s.day_of_week;
                return scheduleDay === apiDayOfWeek;
            }) || [];

            console.log(`📅 ${DAY_NAMES[apiDayOfWeek]} (${date.getDate()} ${MONTHS[date.getMonth()].substring(0, 3)}) - API day: ${apiDayOfWeek}, Classes: ${classesForDay.length}`,
                classesForDay.map(c => c.course_name));

            days.push({
                dateObj: date,
                dayName: DAY_NAMES[apiDayOfWeek], // Use API day to get correct name
                dateNum: date.getDate(),
                classes: classesForDay,
                dayOfWeek: apiDayOfWeek
            });
        });

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
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = (hours * 60) + minutes;
        const startOfDay = START_HOUR * 60; // 7:00 AM in minutes
        const minutesFromStart = totalMinutes - startOfDay;
        return (minutesFromStart / 60) * ROW_HEIGHT;
    };

    const calculateHeight = (startTime, endTime) => {
        if (!startTime || !endTime) return ROW_HEIGHT * 2; // Default height
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = endMinutes - startMinutes;
        return Math.max((duration / 60) * ROW_HEIGHT, ROW_HEIGHT); // Ensure minimum height
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
                            {/* Schedule Grid */}
                            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                {/* Main Schedule Container */}
                                <div className="relative h-[calc(100vh-200px)] overflow-y-auto">
                                    {/* Time slots column - Fixed position */}
                                    <div className="absolute left-0 w-20 z-20 bg-white">
                                        <div className="h-16"></div> {/* Spacer for day headers */}
                                        {timeSlots.map((time, idx) => (
                                            <div
                                                key={idx}
                                                className="h-15 text-xs text-right pr-2 border-r border-gray-200"
                                                style={{ height: `${ROW_HEIGHT}px` }}
                                            >
                                                {time}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Schedule grid */}
                                    <div className="ml-20">
                                        {/* Day headers row - Fixed at the top */}
                                        <div className="grid grid-cols-5 gap-1 sticky top-0 z-20 bg-white">
                                            {weekDays.map((day, dayIdx) => (
                                                <div
                                                    key={`header-${dayIdx}`}
                                                    className={`border-b-2 border-gray-200 p-2 text-center font-medium ${
                                                        isToday(day.dateObj) ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    <div className="font-semibold">{day.dayName}</div>
                                                    <div className={`text-sm ${
                                                        isToday(day.dateObj)
                                                            ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                                                            : 'text-gray-500'
                                                    }`}>
                                                        {day.dateNum}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Schedule content */}
                                        <div className="grid grid-cols-5 gap-1 relative">
                                            {weekDays.map((day, dayIdx) => (
                                                <div
                                                    key={dayIdx}
                                                    className="border border-t-0 border-gray-200 bg-white relative"
                                                    style={{ minHeight: `${(END_HOUR - START_HOUR) * ROW_HEIGHT}px` }}
                                                >

                                                    {/* Schedule items */}
                                                    <div className="relative" style={{ minHeight: `${(END_HOUR - START_HOUR) * ROW_HEIGHT}px` }}>
                                                        {day.classes?.map((cls, clsIdx) => {
                                                            const top = calculateTopPosition(cls.start_time);
                                                            const height = calculateHeight(cls.start_time, cls.end_time);

                                                            return (
                                                                <div
                                                                    key={clsIdx}
                                                                    className={`absolute left-1 right-1 rounded p-2 text-xs overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer ${cls.color} z-10`}
                                                                    style={{
                                                                        top: `${top}px`,
                                                                        height: `${height}px`,
                                                                        minHeight: '40px' // Ensure minimum height for visibility
                                                                    }}
                                                                    title={`${cls.course_name}\n${cls.lecturer_name || 'Dosen'}\n${cls.room_code || 'TBA'}`}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-semibold truncate">{cls.course_name || 'Mata Kuliah'}</p>
                                                                            <p className="text-xs opacity-75 truncate">
                                                                                {cls.start_time} - {cls.end_time}
                                                                            </p>
                                                                            <p className="text-xs opacity-75 truncate">{cls.room_code || 'TBA'}</p>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRescheduleClick(cls);
                                                                            }}
                                                                            className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                                                                            title="Reschedule"
                                                                        >
                                                                            <FaExchangeAlt size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Current time indicator */}
                                    {currentTimeTop !== null && (
                                        <div
                                            className="absolute left-20 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
                                            style={{ top: `${64 + currentTimeTop}px` }}
                                        >
                                            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reschedule Dialog */}
            {isRescheduling && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Reschedule Kelas</h3>
                            <button 
                                onClick={closeRescheduleDialog}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Detail Kelas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Mata Kuliah:</span>
                                    <span className="ml-2 font-medium">{selectedEvent.course_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dari:</span>
                                    <span className="ml-2 font-medium">
                                        {selectedEvent.event_date} {selectedEvent.start_time}-{selectedEvent.end_time}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Ruangan Saat Ini:</span>
                                    <span className="ml-2 font-medium">{selectedEvent.room_code || 'Belum ditentukan'}</span>
                                </div>
                            </div>
                        </div>

                        {!showRoomSearch && !directReschedule && (
                            <div className="space-y-4">
                                <h4 className="font-medium">Pilih Opsi Reschedule:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowRoomSearch(true)}
                                        className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center h-32"
                                    >
                                        <FaSearch className="text-2xl text-blue-600 mb-2" />
                                        <span className="font-medium">Cari Ruangan Tersedia</span>
                                        <span className="text-sm text-gray-500 mt-1">Temukan slot waktu yang kosong</span>
                                    </button>
                                    <button
                                        onClick={() => setDirectReschedule(true)}
                                        className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center h-32"
                                    >
                                        <FaCalendarAlt className="text-2xl text-green-600 mb-2" />
                                        <span className="font-medium">Atur Langsung</span>
                                        <span className="text-sm text-gray-500 mt-1">Tentukan jadwal secara manual</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {showRoomSearch && (
                            <div className="mt-4">
                                <h4 className="font-medium mb-4">Cari Ruangan Tersedia</h4>
                                <RoomAvailability 
                                    onSelectSlot={handleSlotSelect}
                                    originalDate={newSchedule.date}
                                    originalStartTime={newSchedule.startTime}
                                    originalEndTime={newSchedule.endTime}
                                />
                            </div>
                        )}

                        {directReschedule && (
                            <div className="mt-4">
                                <h4 className="font-medium mb-4">Atur Jadwal Langsung</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tanggal Baru
                                        </label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={newSchedule.date}
                                            onChange={handleScheduleChange}
                                            className="w-full p-2 border rounded"
                                            min={new Date().toISOString().split('T')[0]}
                                            max="2025-12-05"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jam Mulai
                                        </label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={newSchedule.startTime}
                                            onChange={handleScheduleChange}
                                            className="w-full p-2 border rounded"
                                            step="1800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jam Selesai
                                        </label>
                                        <input
                                            type="time"
                                            name="endTime"
                                            value={newSchedule.endTime}
                                            onChange={handleScheduleChange}
                                            className="w-full p-2 border rounded"
                                            step="1800"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ruangan (opsional)
                                    </label>
                                    <input
                                        type="text"
                                        name="roomName"
                                        value={newSchedule.roomName}
                                        onChange={handleScheduleChange}
                                        placeholder="Contoh: D-103"
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDirectReschedule(false);
                                            setShowRoomSearch(false);
                                        }}
                                        className="px-4 py-2 border rounded hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDirectReschedule}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        )}

                        {(showRoomSearch || directReschedule) && newSchedule.roomName && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">Rencana Perubahan</h4>
                                <div className="text-sm text-gray-700">
                                    <p>Tanggal: {new Date(newSchedule.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p>Waktu: {formatTimeDisplay(newSchedule.startTime)} - {formatTimeDisplay(newSchedule.endTime)}</p>
                                    <p>Ruangan: {newSchedule.roomName || 'Belum ditentukan'}</p>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleDirectReschedule}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Konfirmasi Perubahan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Jadwal;
