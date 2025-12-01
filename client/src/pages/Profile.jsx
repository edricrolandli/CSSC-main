import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({});
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("profileImage") || null
  );

  // Course subscription states
  const [allCourses, setAllCourses] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [subscriptionMode, setSubscriptionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCount, setShowCount] = useState(3);
  const [coursesExpanded, setCoursesExpanded] = useState(true);

  useEffect(() => {
    setTempData(user || {});
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCoursesAndSubscriptions();
    }
  }, [user]);

  const loadCoursesAndSubscriptions = async () => {
    try {
      setLoadingCourses(true);
      
      // Load all available courses
      const coursesResponse = await apiService.getCourses();
      console.log('📚 All courses:', coursesResponse.courses?.length || 0);
      setAllCourses(coursesResponse.courses || []);
      
      // Load user's subscriptions
      const subsResponse = await apiService.getMySubscriptions();
      console.log('📋 My subscriptions:', subsResponse.subscriptions?.length || 0);
      console.log('📋 Subscription data:', subsResponse.subscriptions);
      setMySubscriptions(subsResponse.subscriptions || []);
      
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubscribe = async (courseId) => {
    try {
      await apiService.subscribeCourse(courseId);
      // Refresh subscriptions
      const subsResponse = await apiService.getMySubscriptions();
      setMySubscriptions(subsResponse.subscriptions || []);
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Gagal berlangganan mata kuliah');
    }
  };

  const handleUnsubscribe = async (courseId) => {
    try {
      await apiService.unsubscribeCourse(courseId);
      // Refresh subscriptions
      const subsResponse = await apiService.getMySubscriptions();
      setMySubscriptions(subsResponse.subscriptions || []);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      alert('Gagal berhenti berlangganan');
    }
  };

  const isSubscribed = (courseId) => {
    const subscribed = mySubscriptions.some(sub => sub.course_id === courseId);
    return subscribed;
  };

  // Filter courses based on search
  const filteredCourses = allCourses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.lecturer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Courses to display (limited by showCount)
  const displayedCourses = filteredCourses.slice(0, showCount);
  const hasMoreCourses = filteredCourses.length > showCount;

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleSave = () => {
    updateUser(tempData);
    setEditMode(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setProfileImage(base64);
      localStorage.setItem("profileImage", base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="pt-20 min-h-screen bg-[#f5f5f0] flex justify-center items-start px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl mt-6 sm:mt-10 border border-gray-100 overflow-hidden">

          {}
          <div className="bg-gradient-to-r from-[#8db89a] to-[#7da88a] px-6 sm:px-8 py-8 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {}
              <label className="cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-white/90 text-sm sm:text-base">
                  {user.role === "dosen" ? "Dosen" : "Mahasiswa"}
                </p>
              </div>
            </div>
          </div>

          {/* Course Subscription Section */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1e1e1e]">Mata Kuliah Saya</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCoursesExpanded(!coursesExpanded)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  {coursesExpanded ? 'Tutup' : 'Buka'}
                </button>
                <button
                  onClick={() => setSubscriptionMode(!subscriptionMode)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {subscriptionMode ? 'Selesai' : 'Kelola'}
                </button>
              </div>
            </div>

            {coursesExpanded && (
              <>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
                      placeholder="Cari mata kuliah, kode, atau nama dosen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Results count */}
                {searchTerm && (
                  <div className="mb-4 text-sm text-gray-600">
                    Ditemukan {filteredCourses.length} mata kuliah
                  </div>
                )}

                {loadingCourses ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-2">Memuat mata kuliah...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {displayedCourses.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        {searchTerm ? 'Tidak ada mata kuliah yang cocok' : 'Belum ada mata kuliah tersedia'}
                      </p>
                    ) : (
                      <>
                        {displayedCourses.map((course) => {
                          const subscribed = isSubscribed(course.id);
                          return (
                            <div
                              key={course.id}
                              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                subscribed
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex-1">
                                <h3 className="font-semibold text-[#1e1e1e]">{course.name}</h3>
                                <p className="text-sm text-gray-600">{course.course_code}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {course.lecturer_name} • {course.room_name}
                                </p>
                              </div>
                              
                              {subscriptionMode ? (
                                subscribed ? (
                                  <button
                                    onClick={() => handleUnsubscribe(course.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                                  >
                                    Berhenti
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSubscribe(course.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                  >
                                    Berlangganan
                                  </button>
                                )
                              ) : (
                                <div className={`px-3 py-1 rounded text-xs font-medium ${
                                  subscribed
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-300 text-gray-600'
                                }`}>
                                  {subscribed ? 'Subscribed' : 'Not Subscribed'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Load More Button */}
                        {hasMoreCourses && (
                          <div className="text-center pt-4">
                            <button
                              onClick={() => setShowCount(prev => Math.min(prev + 2, filteredCourses.length))}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                            >
                              Tampilkan {Math.min(2, filteredCourses.length - showCount)} lagi
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-6 sm:px-8 py-6 sm:py-8 border-t border-gray-200 mb-16">
            <h2 className="text-xl font-bold mb-6 text-[#1e1e1e]">Informasi Personal</h2>

            <div className="space-y-4">
              {}
              <ProfileField
                label="Nama"
                value={tempData.name}
                editMode={editMode}
                onChange={(e) => setTempData({ ...tempData, name: e.target.value })}
              />

              {}
              <ProfileField
                label="Email"
                value={tempData.email}
                editMode={editMode}
                onChange={(e) => setTempData({ ...tempData, email: e.target.value })}
              />

              {}
              <ProfileField
                label="No HP"
                value={tempData.phone}
                editMode={editMode}
                onChange={(e) => setTempData({ ...tempData, phone: e.target.value })}
              />

              {}
              <ProfileField
                label="Peran"
                value={user.role === "dosen" ? "Dosen" : "Mahasiswa"}
                readOnly
              />

              {}
              <ProfileField
                label={user.role === "dosen" ? "NIP" : "NIM"}
                value={tempData.identityNumber}
                editMode={editMode}
                onChange={(e) =>
                  setTempData({ ...tempData, identityNumber: e.target.value })
                }
              />
            </div>

            {}
            <div className="flex justify-end mt-8 gap-3">
              {!editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
                  >
                    Edit Profil
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-6 py-3 rounded-xl bg-gray-300 hover:bg-gray-400 text-black text-sm font-semibold transition"
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition"
                  >
                    Simpan
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ProfileField = ({ label, value, editMode, onChange, readOnly = false }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3">
      <span className="font-semibold text-[#4b4b4b] text-sm sm:text-base w-full sm:w-32 mb-1 sm:mb-0">
        {label}:
      </span>

      {!editMode || readOnly ? (
        <span className="text-[#1e1e1e] text-sm sm:text-base break-all">{value}</span>
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="border px-3 py-1 rounded-lg w-full sm:w-64"
        />
      )}
    </div>
  );
};

export default Profile;
