import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api.js";

const Materi = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [mySubscriptions, setMySubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user subscriptions
    useEffect(() => {
        const loadSubscriptions = async () => {
            try {
                const response = await apiService.getMySubscriptions();
                setMySubscriptions(response.subscriptions || []);
            } catch (error) {
                console.error('Error loading subscriptions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadSubscriptions();
        }
    }, [user]);

    // Generate color classes
    const colors = [
        "bg-blue-100 text-blue-600",
        "bg-emerald-100 text-emerald-600", 
        "bg-purple-100 text-purple-600",
        "bg-orange-100 text-orange-600",
        "bg-red-100 text-red-600",
        "bg-indigo-100 text-indigo-600",
        "bg-pink-100 text-pink-600",
        "bg-yellow-100 text-yellow-600",
        "bg-green-100 text-green-600",
        "bg-cyan-100 text-cyan-600"
    ];

    // Convert subscriptions to materials format
    const materials = mySubscriptions.map((sub, index) => ({
        id: sub.name?.toLowerCase().replace(/\s+/g, '-') || `course-${sub.course_id}`,
        name: sub.name,
        course_code: sub.course_code,
        credits: sub.credits || 3,
        pengajar: "Dosen Pengampu", // TODO: Get from database
        meetings: 16, // Standard 16 meetings per semester
        semester: sub.semester || "Ganjil",
        color: colors[index % colors.length]
    }));

    // Filter by search
    const filteredMaterials = materials.filter((item) => {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.pengajar.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-12">
                    <span className="text-amber-500 font-bold tracking-wider uppercase text-sm mb-2">Academic Resources</span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                        Akses Materi Kuliah
                    </h1>
                    <p className="text-gray-500 max-w-2xl text-lg mb-8">
                        Pilih mata kuliah untuk mengunduh materi, slide presentasi, dan catatan dari dosen pengampu.
                    </p>

                    {/* Search Bar */}
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm transition-all"
                            placeholder="Cari mata kuliah atau nama dosen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid Section */}
                {filteredMaterials.length > 0 ? (
                    <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredMaterials.map((item) => (
                            <Link
                                key={item.id}
                                to={`/Materi/${item.id}`}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full"
                            >
                                {/* Card Header / Image Area */}
                                <div className={`h-32 ${item.color || 'bg-gray-100'} relative flex items-center justify-center overflow-hidden`}>
                                    {/* Circle Decorative Background */}
                                    <div className="absolute w-32 h-32 bg-white/30 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                    
                                    <svg className="h-16 w-16 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex flex-col flex-grow justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-2 py-1 text-[10px] font-bold tracking-wide uppercase bg-gray-100 text-gray-600 rounded-md">
                                                Semester {item.semester}
                                            </span>
                                            <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {item.meetings} Pertemuan
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug group-hover:text-amber-500 transition-colors">
                                            {item.name}
                                        </h3>

                                        <div className="flex items-start gap-2 mt-4">
                                            <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                {item.pengajar}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Footer (Action) */}
                                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-amber-500 font-semibold text-sm">
                                        <span>Lihat Materi</span>
                                        <svg className="w-5 h-5 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* State jika pencarian tidak ditemukan */
                    <div className="text-center py-20">
                        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Mata kuliah tidak ditemukan</h3>
                        <p className="text-gray-500">Coba cari dengan kata kunci lain.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Materi;