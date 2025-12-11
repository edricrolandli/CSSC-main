import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const MateriDetail = () => {
    const { id: courseId } = useParams();
    const { user } = useAuth();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCourseData = async () => {
            try {
                setLoading(true);
                
                // Get user subscriptions to find the course
                const subsResponse = await apiService.getMySubscriptions();
                const subscriptions = subsResponse.subscriptions || [];
                
                // Find course by URL slug
                const course = subscriptions.find(sub => 
                    sub.name?.toLowerCase().replace(/\s+/g, '-') === courseId
                );
                
                if (!course) {
                    setError('Mata kuliah tidak ditemukan atau Anda belum berlangganan');
                    return;
                }
                
                setCourseData(course);
                
            } catch (err) {
                console.error('Error loading course:', err);
                setError('Gagal memuat data mata kuliah');
            } finally {
                setLoading(false);
            }
        };

        if (user && courseId) {
            loadCourseData();
        }
    }, [courseId, user]);

    // Generate meeting list (16 meetings)
    const generateMeetings = () => {
        const meetings = [];
        for (let i = 1; i <= 16; i++) {
            meetings.push({
                id: i,
                title: `Pertemuan ${i}`,
                description: `Materi pembelajaran pertemuan ke-${i}`,
                materials: [
                    { type: 'pdf', name: `Slide Pertemuan ${i}.pdf`, size: '2.5 MB' },
                    { type: 'ppt', name: `Presentasi ${i}.pptx`, size: '4.1 MB' },
                    { type: 'doc', name: `Handout ${i}.docx`, size: '1.2 MB' }
                ]
            });
        }
        return meetings;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Memuat materi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                        <p className="text-red-600">{error}</p>
                        <Link 
                            to="/Materi" 
                            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Kembali ke Materi
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const meetings = generateMeetings();

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link 
                            to="/Materi" 
                            className="flex items-center text-blue-600 hover:text-blue-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Kembali ke Materi
                        </Link>
                        
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {courseData?.course_code}
                        </span>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {courseData?.name}
                    </h1>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Dosen Pengampu • {courseData?.credits || 3} SKS • Semester {courseData?.semester || 'Ganjil'}
                    </div>
                </div>

                {/* Meetings List */}
                <div className="space-y-4">
                    {meetings.map((meeting) => (
                        <div key={meeting.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {meeting.title}
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {meeting.materials.length} file
                                </span>
                            </div>
                            
                            <p className="text-gray-600 mb-4">{meeting.description}</p>
                            
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {meeting.materials.map((material, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex-shrink-0 mr-3">
                                            {material.type === 'pdf' && (
                                                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            {material.type === 'ppt' && (
                                                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                            {material.type === 'doc' && (
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {material.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {material.size}
                                            </p>
                                        </div>
                                        
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MateriDetail;