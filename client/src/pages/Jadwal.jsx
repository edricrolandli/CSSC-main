import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api.js";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";

const Jadwal = () => {
    const { user } = useAuth();
    const [currentWeek, setCurrentWeek] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scheduleData, setScheduleData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const START_HOUR = 7; 
    const END_HOUR = 18;  
    const ROW_HEIGHT = 80; 

    // 5 days only (Senin-Jumat)
    const WEEKDAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]; 

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
                
                // Get current week's date range
                const today = new Date();
                const currentDay = today.getDay();
                const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
                const monday = new Date(today);
                monday.setDate(today.getDate() + mondayOffset + (currentWeek * 7));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                
                // Fetch real schedule
                const response = await apiService.getRealSchedule({
                    start_date: monday.toISOString().split('T')[0],
                    end_date: sunday.toISOString().split('T')[0]
                });
                
                // Transform backend data to frontend format
                const transformedSchedule = transformScheduleData(response.events);
                setScheduleData(transformedSchedule);
                
            } catch (error) {
                console.error('Failed to fetch schedule:', error);
                setError('Gagal memuat jadwal. Silakan coba lagi.');
                
                // Fallback to dummy data if backend fails
                setScheduleData(getDummyScheduleData());
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [user, currentWeek]);

    // Transform backend schedule data to frontend format
    const transformScheduleData = (events) => {
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const schedule = {};
        
        // Initialize all days
        dayNames.forEach(day => {
            schedule[day] = { dayName: day, classes: [] };
        });
        
        // Process events
        Object.entries(events).forEach(([date, dayEvents]) => {
            const dateObj = new Date(date);
            const dayName = dayNames[dateObj.getDay()];
            
            dayEvents.forEach(event => {
                const classData = {
                    time: `${event.start_time} - ${event.end_time}`,
                    subject: event.course_name,
                    instructor: event.lecturer_name || 'N/A',
                    room: event.room.name,
                    color: getColorForCourse(event.course_code),
                    course_id: event.course_id,
                    event_id: event.id
                };
                
                schedule[dayName].classes.push(classData);
            });
        });
        
        return Object.values(schedule);
    };

    // Get color for course based on course code
    const getColorForCourse = (courseCode) => {
        const colors = [
            "bg-purple-100 border-l-4 border-purple-500 text-purple-900",
            "bg-blue-100 border-l-4 border-blue-500 text-blue-900",
            "bg-green-100 border-l-4 border-green-500 text-green-900",
            "bg-orange-100 border-l-4 border-orange-500 text-orange-900",
            "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900",
            "bg-pink-100 border-l-4 border-pink-500 text-pink-900",
            "bg-indigo-100 border-l-4 border-indigo-500 text-indigo-900",
            "bg-teal-100 border-l-4 border-teal-500 text-teal-900",
            "bg-cyan-100 border-l-4 border-cyan-500 text-cyan-900",
            "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-900"
        ];
        
        // Use course code to determine color consistently
        const hash = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    // Dummy data fallback
    const getDummyScheduleData = () => {
        return [
            {
                dayName: "Senin",
                classes: [
                    {
                        time: "08:20 - 10:00",
                        subject: "Praktikum Basis Data",
                        instructor: "Muhammad Syukron Jazila",
                        room: "Lab 2",
                        color: "bg-purple-100 border-l-4 border-purple-500 text-purple-900"
                    },
                    {
                        time: "10:30 - 12:10",
                        subject: "Komputerisasi Ekon. & Bisnis",
                        instructor: "Taufik Akbar Parluhutan SE, M.Si",
                        room: "GL 1",
                        color: "bg-blue-100 border-l-4 border-blue-500 text-blue-900"
                    }
                ]
            },
            {
                dayName: "Selasa",
                classes: [
                    {
                        time: "08:50 - 10:30",
                        subject: "IELTS Preparation",
                        instructor: "Drs. Yulianus Harefa GradDipEd TESOL., MEd TESOL",
                        room: "D-101",
                        color: "bg-green-100 border-l-4 border-green-500 text-green-900"
                    },
                    {
                        time: "10:30 - 12:10",
                        subject: "Praktikum Struktur Data (Lanjutan)",
                        instructor: "Alya Debora Panggabean",
                        room: "Lab 2",
                        color: "bg-green-100 border-l-4 border-green-500 text-green-900"
                    },
                    {
                        time: "13:50 - 16:20",
                        subject: "Kecerdasan Buatan",
                        instructor: "Dr. Amalia S.T., M.T. | Dr. Pauzi Ibrahim Nainggolan S.Komp., M.Sc.",
                        room: "D-104",
                        color: "bg-orange-100 border-l-4 border-orange-500 text-orange-900"
                    }
                ]
            },
            {
                dayName: "Rabu",
                classes: [
                    {
                        time: "08:00 - 10:30",
                        subject: "Pemrograman Website",
                        instructor: "Anandhini Medianty Nababan S.Kom., M.T | Insidini Fawwaz M.Kom",
                        room: "D-103",
                        color: "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900"
                    },
                    {
                        time: "14:40 - 17:10",
                        subject: "Basis Data",
                        instructor: "Dr. Dewi Sartika Br Ginting S.Kom., M.Kom | Insidini Fawwaz M.Kom",
                        room: "D-103",
                        color: "bg-pink-100 border-l-4 border-pink-500 text-pink-900"
                    }
                ]
            },
            {
                dayName: "Kamis",
                classes: [
                    {
                        time: "08:00 - 09:40",
                        subject: "Etika Profesi",
                        instructor: "Dr. Ir. Elviawaty Muisa Zamzami S.T., M.T., M.M., IPU | Dr. Eng Ade Candra S.T., M.Kom.",
                        room: "D-104",
                        color: "bg-indigo-100 border-l-4 border-indigo-500 text-indigo-900"
                    },
                    {
                        time: "10:00 - 12:00", 
                        subject: "Wirausaha Digital",
                        instructor: "Dr. T. Henny Febriana Harumy S.Kom., M.Kom | Dr. Fauzan Nurahmadi S.Kom., M.Cs",
                        room: "D-104",
                        color: "bg-teal-100 border-l-4 border-teal-500 text-teal-900"
                    }
                ]
            },
            {
                dayName: "Jumat",
                classes: [
                    {
                        time: "10:30 - 12:10",
                        subject: "Prak. Pemrograman Website",
                        instructor: "Muhammad Dzakwan Attaqiy",
                        room: "Lab 3",
                        color: "bg-cyan-100 border-l-4 border-cyan-500 text-cyan-900"
                    },
                    {
                        time: "13:50 - 16:20",
                        subject: "Struktur Data",
                        instructor: "Anandhini Medianty Nababan S.Kom., M.T | Insidini Fawwaz M.Kom",
                        room: "D-101",
                        color: "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-900"
                    }
                ]
            },
            { dayName: "Sabtu", classes: [] } 
        ];
    };

    const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
        const hour = START_HOUR + i;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    const getDaysInWeek = () => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Minggu, 1 = Senin, ...
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
        const monday = new Date(now.setDate(diffToMonday));
        
        const days = [];
        
        // Generate 5 days only (Senin-Jumat)
        for (let i = 0; i < 5; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dayNameIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][date.getDay()];
            const scheduleForDay = scheduleData.find(s => s.dayName === dayNameIndo) || { classes: [] };
            days.push({
                dateObj: date,
                dayName: dayNameIndo,
                dateNum: date.getDate(),
                classes: scheduleForDay.classes
            });
        }
        return days;
    };

    const weekDays = getDaysInWeek();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

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

    const currentTimeTop = getCurrentTimePosition();

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
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && (
                    <>
                        {/* --- HEADER --- */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
                            <div className="flex-1">
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Jadwal Kelas</h1>
                                
                                {/* UPDATE: Nama Mahasiswa tanpa padding (sesuai request) */}
                                <div className="flex items-center gap-2 text-sm text-[#4b4b4b]">
                                    <h1 className="">Halo,   
                                    <span className="rounded-full text-[#1e1e1e] font-semibold">
                                        {user?.name || "User"}
                                    </span>
                                    </h1>
                                </div>
                            </div>
                            
                            {/* Calendar Widget */}
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                    <FaCalendarAlt className="text-blue-600" />
                                    <span>{monthNames[weekDays[0]?.dateObj?.getMonth()]} {weekDays[0]?.dateObj?.getFullYear()}</span>
                                </div>
                                <div className="grid grid-cols-5 gap-1 text-center">
                                    {WEEKDAYS.map((day, index) => (
                                        <div key={day} className="text-xs font-medium text-gray-500 py-1">
                                            {day.substring(0, 3)}
                                        </div>
                                    ))}
                                    {weekDays.map((day, index) => {
                                        const isToday = selectedDate.toDateString() === day.dateObj.toDateString();
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedDate(day.dateObj)}
                                                className={`text-sm py-2 rounded-lg transition-colors ${
                                                    isToday 
                                                        ? 'bg-blue-600 text-white font-bold' 
                                                        : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {day.dateNum}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Navigasi Minggu */}
                            <div className="flex items-center bg-white p-1.5 rounded-full shadow-md border border-gray-200">
                                <button onClick={() => setCurrentWeek(p => p - 1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="px-4 font-semibold text-gray-700 min-w-[140px] text-center">
                                    {monthNames[weekDays[0].dateObj.getMonth()]} {weekDays[0].dateObj.getFullYear()}
                                </span>
                                <button onClick={() => setCurrentWeek(p => p + 1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                {/* --- DESKTOP VIEW (GRID) --- */}
                <div className="hidden lg:block bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative">
                    
                    {/* Header Hari (Sticky) */}
                    <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-gray-200 sticky top-0 z-30 bg-white">
                        <div className="p-4 text-center border-r border-gray-100 bg-gray-50 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-400">GMT+7</span>
                        </div>
                        {weekDays.map((day, idx) => {
                            const isToday = day.dateObj.getDate() === new Date().getDate() && day.dateObj.getMonth() === new Date().getMonth();
                            return (
                                <div key={idx} className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-amber-50' : ''}`}>
                                    <p className={`text-sm font-medium ${isToday ? 'text-amber-600' : 'text-gray-500'}`}>{day.dayName}</p>
                                    <div className={`w-10 h-10 mx-auto mt-1 flex items-center justify-center rounded-full text-lg font-bold ${isToday ? 'bg-amber-400 text-white shadow-md' : 'text-gray-800'}`}>
                                        {day.dateNum}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Area Grid Jadwal Scrollable */}
                    <div className="relative overflow-y-auto max-h-[700px] border border-gray-200 rounded-lg bg-white">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]">
                            <div className="border-r border-gray-200 bg-gray-50">
                                {timeSlots.map((time, idx) => (
                                    <div key={idx} className="border-b border-gray-200 text-xs text-gray-400 font-medium pr-3 flex items-start justify-end pt-1" style={{ height: `${ROW_HEIGHT}px` }}>
                                        {time}
                                    </div>
                                ))}
                            </div>
                            {weekDays.map((_, idx) => (
                                <div key={idx} className="border-r border-gray-100 last:border-r-0 relative">
                                    {timeSlots.map((_, tIdx) => (
                                        <div key={tIdx} className="border-b border-gray-50 w-full" style={{ height: `${ROW_HEIGHT}px` }}></div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Indikator Waktu Sekarang (Garis Merah) */}
                        {currentTimeTop !== null && (
                            <div 
                                className="absolute left-[80px] right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                                style={{ top: `${currentTimeTop}px` }}
                            >
                                <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                            </div>
                        )}

                        {/* Event Cards Layer */}
                        <div className="absolute inset-0 grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr] pointer-events-none">
                            <div></div> 
                            
                            {weekDays.map((day, colIdx) => (
                                <div key={colIdx} className="relative h-full">
                                    {day.classes.map((cls, clsIdx) => {
                                        const [start, end] = cls.time.split(" - ");
                                        return (
                                            <div
                                                key={clsIdx}
                                                className={`absolute left-1 right-1 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow pointer-events-auto cursor-pointer flex flex-col justify-start overflow-hidden ${cls.color}`}
                                                style={{
                                                    top: `${calculateTopPosition(start)}px`,
                                                    height: `${calculateHeight(start, end)}px`,
                                                    zIndex: 10
                                                }}
                                            >
                                                <div className="font-bold text-xs sm:text-sm leading-tight mb-1">{cls.subject}</div>
                                                <div className="text-[10px] sm:text-xs opacity-90 leading-tight mb-auto">{cls.instructor}</div>
                                                
                                                <div className="flex justify-between items-end mt-1">
                                                     <div className="text-[10px] font-semibold px-1.5 py-0.5 bg-white/40 rounded backdrop-blur-sm">
                                                        {cls.room}
                                                    </div>
                                                    <div className="text-[10px] font-medium opacity-80">
                                                        {start}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        <div style={{ height: `${timeSlots.length * ROW_HEIGHT}px` }}></div>
                    </div>
                </div>

                {/* --- MOBILE VIEW (LIST) --- */}
                <div className="lg:hidden space-y-6">
                    {weekDays.map((day, idx) => {
                        const isToday = day.dateObj.getDate() === new Date().getDate() && day.dateObj.getMonth() === new Date().getMonth();
                        
                        return (
                            <div key={idx} className={`rounded-2xl border overflow-hidden ${isToday ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200 bg-white'}`}>
                                <div className={`px-5 py-3 flex items-center justify-between ${isToday ? 'bg-amber-300' : 'bg-[#8db89a]'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl font-bold ${isToday ? 'text-black' : 'text-white'}`}>{day.dateNum}</span>
                                        <div>
                                            <div className={`font-bold text-lg leading-none ${isToday ? 'text-black' : 'text-white'}`}>{day.dayName}</div>
                                            <div className={`text-xs ${isToday ? 'text-black/70' : 'text-white/80'}`}>{monthNames[day.dateObj.getMonth()]}</div>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${isToday ? 'bg-white/30 text-black' : 'bg-white/20 text-white'}`}>
                                        {day.classes.length} Kelas
                                    </div>
                                </div>

                                <div className="p-4 space-y-3 bg-white">
                                    {day.classes.length > 0 ? (
                                        day.classes.map((cls, clsIdx) => (
                                            <div key={clsIdx} className={`rounded-xl p-4 border-l-4 shadow-sm ${cls.color}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-gray-900">{cls.subject}</h3>
                                                    <span className="text-xs font-bold px-2 py-1 bg-white/50 rounded-md whitespace-nowrap">
                                                        {cls.time}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-700 mb-3 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    {cls.instructor}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold px-2 py-1 bg-white rounded border border-gray-100 flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        {cls.room}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="inline-block p-3 rounded-full bg-gray-50 mb-2">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <p className="text-gray-400 text-sm">Tidak ada jadwal kuliah.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </>
                )}

            </div>
        </div>
    );
};

export default Jadwal;