import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const MateriDetail = () => {
    const { id: courseId } = useParams();
    const { user } = useAuth();
    const [courseData, setCourseData] = useState(null);
    const [materials, setMaterials] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadingMeeting, setUploadingMeeting] = useState(null);
    const [showUpload, setShowUpload] = useState({});

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
                
                // Load materials for this course
                await loadMaterials(course.course_id);
                
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

    const loadMaterials = async (courseId) => {
        try {
            // For now, return empty materials since API doesn't exist yet
            setMaterials({});
        } catch (err) {
            console.error('Error loading materials:', err);
        }
    };

    const handleFileUpload = async (meetingNumber, file) => {
        try {
            setUploadingMeeting(meetingNumber);

            const formData = new FormData();
            formData.append('material', file);
            formData.append('title', file.name);

            const response = await apiService.uploadMaterial(courseData.course_id, meetingNumber, formData);

            // Reload materials after successful upload
            await loadMaterials(courseData.course_id);

            setUploadingMeeting(null);
            setShowUpload(prev => ({ ...prev, [meetingNumber]: false }));
            alert('Upload berhasil!');

        } catch (err) {
            console.error('Upload error:', err);
            alert('Gagal upload file: ' + (err.message || 'Unknown error'));
            setUploadingMeeting(null);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!confirm('Hapus file ini?')) return;
        
        try {
            // TODO: Implement delete API
            console.log('Deleting material:', materialId);
            alert('File dihapus! (Demo)');
        } catch (err) {
            console.error('Delete error:', err);
            alert('Gagal hapus file');
        }
    };

    // Generate meeting list (16 meetings)
    const generateMeetings = () => {
        const meetings = [];
        for (let i = 1; i <= 16; i++) {
            meetings.push({
                id: i,
                title: `Pertemuan ${i}`,
                description: `Materi pembelajaran pertemuan ke-${i}`,
                materials: materials[i] || []
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
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">
                                        {meeting.materials.length} file
                                    </span>
                                    {user?.role === 'komting' && (
                                        <button
                                            onClick={() => setShowUpload(prev => ({ ...prev, [meeting.id]: !prev[meeting.id] }))}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                        >
                                            Upload
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-gray-600 mb-4">{meeting.description}</p>
                            
                            {/* Upload Form */}
                            {showUpload[meeting.id] && user?.role === 'admin' && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <input
                                        type="file"
                                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                handleFileUpload(meeting.id, e.target.files[0]);
                                            }
                                        }}
                                        disabled={uploadingMeeting === meeting.id}
                                        className="w-full"
                                    />
                                    {uploadingMeeting === meeting.id && (
                                        <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                                    )}
                                </div>
                            )}
                            
                            {meeting.materials.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>Belum ada materi untuk pertemuan ini</p>
                                    {user?.role === 'admin' && (
                                        <p className="text-sm mt-1">Klik tombol Upload untuk menambah materi</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {meeting.materials.map((material) => (
                                        <div 
                                            key={material.id}
                                            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="flex-shrink-0 mr-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {material.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(material.file_size / 1024).toFixed(1)} KB • {material.uploaded_by}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <button className="p-1 text-gray-400 hover:text-blue-600" title="Download">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteMaterial(material.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600"
                                                        title="Hapus"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MateriDetail;