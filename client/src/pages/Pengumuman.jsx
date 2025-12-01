import { useState, useEffect } from "react";
import { FaPlus, FaClock, FaUserTie, FaUserGraduate, FaBullhorn, FaCheckCircle, FaCalendarDay } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Pengumuman = () => {
    const { user } = useAuth(); 

    const [announcements, setAnnouncements] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Load Data
    useEffect(() => {
        const savedAnnouncements = localStorage.getItem("cssc-announcements");
        if (savedAnnouncements) {
            setAnnouncements(JSON.parse(savedAnnouncements));
        } else {
            const sampleAnnouncements = [
                {
                    id: 1,
                    title: "Perubahan Jadwal Wirausaha Digital",
                    content: "Teman-teman, mata kuliah Wirausaha Digital hari ini dipindah ke hari Kamis minggu depan ya. Mohon infokan ke yang lain.",
                    author: "Edric",
                    authorRole: "Komting",
                    subject: "Wirausaha Digital",
                    date: "2025-10-31",
                    time: "07:21",
                    status: "approved"
                },
                {
                    id: 2,
                    title: "Kuliah Pengganti Basis Data",
                    content: "Assalamualaikum, perkuliahan Basis Data kita adakan nanti malam pukul 20.00 WIB secara Daring (Zoom). Link akan dibagikan 15 menit sebelum mulai.",
                    author: "Dr. Dewi Sartika",
                    authorRole: "Dosen",
                    subject: "Basis Data",
                    date: "2025-11-05",
                    time: "10:22",
                    status: "approved"
                },
                {
                    id: 3,
                    title: "Dosen Tidak Hadir",
                    content: "Info dari bapak dosen, hari ini beliau berhalangan hadir karena ada rapat di rektorat. Tugas akan dikirim via Google Classroom.",
                    author: "Yehezkiel",
                    authorRole: "Mahasiswa",
                    subject: "Kecerdasan Buatan",
                    date: "2025-11-07",
                    time: "08:15",
                    status: "pending"
                }
            ];
            // Sort by date descending (terbaru diatas)
            const sorted = sampleAnnouncements.sort((a, b) => new Date(b.date) - new Date(a.date));
            setAnnouncements(sorted);
            localStorage.setItem("cssc-announcements", JSON.stringify(sorted));
        }
    }, []);

    // Format Tanggal Indonesia
    const formatDateIndo = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
        });
    };

    // Style berdasarkan Role
    const getRoleStyle = (role) => {
        switch (role) {
            case "Dosen":
                return {
                    border: "border-l-4 border-amber-500",
                    bg: "bg-amber-50",
                    badge: "bg-amber-100 text-amber-700",
                    icon: <FaUserTie />
                };
            case "Komting":
                return {
                    border: "border-l-4 border-blue-500",
                    bg: "bg-blue-50",
                    badge: "bg-blue-100 text-blue-700",
                    icon: <FaBullhorn />
                };
            case "Anggota": // Mahasiswa
                return {
                    border: "border-l-4 border-gray-400",
                    bg: "bg-white",
                    badge: "bg-gray-100 text-gray-600",
                    icon: <FaUserGraduate />
                };
            default: // Fallback
                return {
                    border: "border-l-4 border-gray-400",
                    bg: "bg-white",
                    badge: "bg-gray-100 text-gray-600",
                    icon: <FaUserGraduate />
                };
        }
    };

    // Check if user can create announcements
    const canCreateAnnouncement = user?.role === "Komting";

    // Grouping announcements by date
    const groupedAnnouncements = announcements.reduce((groups, announcement) => {
        const date = announcement.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(announcement);
        return groups;
    }, {});

    const sortedDates = Object.keys(groupedAnnouncements).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="min-h-screen bg-[#f5f5f0] pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Papan Pengumuman</h1>
                        <p className="text-gray-500 text-sm">Informasi terbaru seputar perkuliahan dan akademik.</p>
                    </div>
                    {canCreateAnnouncement ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <FaPlus className="text-amber-400" />
                            <span>Buat Pengumuman</span>
                        </button>
                    ) : (
                        <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
                            <FaUserGraduate className="inline mr-2" />
                            Hanya Komting yang bisa buat pengumuman
                        </div>
                    )}
                </div>

                {/* Timeline Feed */}
                <div className="space-y-8">
                    {sortedDates.map((date) => (
                        <div key={date} className="relative">
                            
                            {/* Sticky Date Divider */}
                            <div className="sticky top-20 z-10 flex justify-center mb-6">
                                <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold text-gray-600">
                                    <FaCalendarDay className="text-amber-500" />
                                    {formatDateIndo(date)}
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className="space-y-4">
                                {groupedAnnouncements[date].map((item) => {
                                    const style = getRoleStyle(item.authorRole);
                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 ${style.border}`}
                                        >
                                            {/* Card Header: Author & Subject */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${style.badge}`}>
                                                        {style.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900">{item.author}</span>
                                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                                                                {item.authorRole}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <span>{item.time} WIB</span>
                                                            <span>•</span>
                                                            <span className="font-medium text-gray-500">{item.subject}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Verified Icon for Dosen */}
                                                {item.authorRole === "Dosen" && (
                                                    <div className="text-blue-500" title="Terverifikasi Dosen">
                                                        <FaCheckCircle />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="pl-[52px]">
                                                <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>
                                                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                                                    {item.content}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Modal */}
                {showCreateForm && (
                    <CreateAnnouncementModal
                        user={user}
                        onClose={() => setShowCreateForm(false)}
                        onSubmit={(newAnnouncement) => {
                            const updated = [newAnnouncement, ...announcements].sort((a, b) => new Date(b.date) - new Date(a.date));
                            setAnnouncements(updated);
                            localStorage.setItem("cssc-announcements", JSON.stringify(updated));
                            setShowCreateForm(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

// --- MODAL COMPONENT (CLEAN VERSION) ---
const CreateAnnouncementModal = ({ user, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        subject: "",
        date: new Date().toISOString().split('T')[0], // Default today yyyy-mm-dd
        content: "",
        title: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newAnnouncement = {
            id: Date.now(),
            title: formData.title,
            content: formData.content,
            author: user.name,
            authorRole: user.role,
            subject: formData.subject,
            date: formData.date,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.',':'),
            status: "approved"
        };
        onSubmit(newAnnouncement);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Buat Pengumuman</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Input Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Pengumuman</label>
                        <input
                            type="text"
                            placeholder="Contoh: Perubahan Jadwal..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Mata Kuliah</label>
                             <input
                                type="text"
                                placeholder="Basis Data / Umum"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                             <input
                                type="date"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan</label>
                        <textarea
                            placeholder="Tulis detail pengumuman disini..."
                            rows="4"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition resize-none"
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition shadow-lg flex justify-center items-center gap-2"
                        >
                            <FaBullhorn className="text-amber-400"/>
                            Posting
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Pengumuman;