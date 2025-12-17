// API Service for CSSC Backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cssc-lyart.vercel.app/api";

class ApiService {
  constructor() {
    // Normalize base URL: remove any trailing slash to avoid double slashes when joining
    this.baseURL = API_BASE_URL.replace(/\/+$/, "");
    this.token = localStorage.getItem("cssc-token");
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("cssc-token", token);
    } else {
      localStorage.removeItem("cssc-token");
    }
  }

  // Get headers with authentication
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log("🔄 API Request:", {
      url,
      method: config.method || "GET",
      headers: config.headers,
      body: config.body ? JSON.parse(config.body) : null,
    });

    try {
      const response = await fetch(url, config);

      console.log("📡 API Response:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      const data = await response.json();

      console.log("📦 Response Data:", data);

      if (!response.ok) {
        console.error("❌ API Error Response:", {
          status: response.status,
          error: data.error,
          details: data.details,
          data,
        });
        throw new Error(data.error || data.details || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("💥 API Request Error:", {
        message: error.message,
        url,
        endpoint,
        error,
      });
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, data) {
    return this.request(endpoint, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.post("/auth/login", { email, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post("/auth/register", userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.get("/auth/me");
  }

  async updateProfile(userData) {
    return this.put("/auth/profile", userData);
  }

  // Course methods
  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/courses?${queryString}` : "/courses";
    return this.get(endpoint);
  }

  async getCourse(id) {
    return this.get(`/courses/${id}`);
  }

  async getCourseDetails(courseId) {
    return this.get(`/courses/${courseId}/details`);
  }

  async subscribeCourse(courseId) {
    return this.post("/courses/subscribe", { course_id: courseId });
  }

  async unsubscribeCourse(courseId) {
    return this.delete("/courses/unsubscribe", { course_id: courseId });
  }

  async getMySubscriptions() {
    return this.get("/courses/my/subscriptions");
  }

  async createCourse(courseData) {
    return this.post("/courses", courseData);
  }

  // Schedule methods
  async getDefaultSchedule() {
    return this.get("/schedule/default");
  }

  async getRealSchedule(params = {}) {
    // Add cache-busting timestamp
    params._t = Date.now();
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/schedule/real?${queryString}`
      : "/schedule/real";
    return this.get(endpoint);
  }

  async updateSchedule(scheduleData) {
    // Add week calculation if not provided
    if (scheduleData.newDate && !scheduleData.weekNumber) {
      // Parse YYYY-MM-DD as local date to avoid timezone shifts
      const [y, m, d] = scheduleData.newDate.split("-").map(Number);
      const eventDate = new Date(y, m - 1, d);
      const semesterStart = new Date(2024, 7, 26); // month is 0-indexed (August = 7)
      const weekNumber = Math.ceil(
        (eventDate - semesterStart) / (7 * 24 * 60 * 60 * 1000)
      );
      scheduleData.weekNumber = weekNumber;
    }

    return this.post("/schedule/update", scheduleData);
  }

  async getScheduleHistory(courseId) {
    return this.get(`/schedule/history/${courseId}`);
  }

  // Room methods
  async getRooms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/rooms?${queryString}` : "/rooms";
    return this.get(endpoint);
  }

  async getRoom(id) {
    return this.get(`/rooms/${id}`);
  }

  async getRoomStatus(date, time) {
    return this.get(`/rooms/status?date=${date}&time=${time}`);
  }

  async getAvailableRooms(date, startTime, endTime, minCapacity) {
    const params = new URLSearchParams({
      date,
      start_time: startTime,
      end_time: endTime,
    });

    if (minCapacity) {
      params.append("min_capacity", minCapacity);
    }

    return this.get(`/rooms/available?${params.toString()}`);
  }

  async getRoomSchedule(roomId, date) {
    return this.get(`/rooms/${roomId}/schedule?date=${date}`);
  }

  async createRoom(roomData) {
    return this.post("/rooms", roomData);
  }

  // Notification methods
  async getNotificationPreferences() {
    return this.get("/notifications/preferences");
  }

  async updateNotificationPreferences(preferences) {
    return this.put("/notifications/preferences", preferences);
  }

  async sendScheduleChangeNotification(notificationData) {
    return this.post("/notifications/schedule-change", notificationData);
  }

  async testNotification(type, recipient) {
    return this.post("/notifications/test", { type, recipient });
  }

  // Schedule methods
  async getMySchedules() {
    return this.get("/courses/schedules/my");
  }

  async getAllSchedules() {
    return this.get("/courses/schedules/all");
  }

  // Announcements methods
  async getMyAnnouncements() {
    return this.get("/announcements/my");
  }

  async getAllAnnouncements() {
    return this.get("/announcements/all");
  }

  async createAnnouncement(data) {
    return this.post("/announcements", data);
  }

  // Get all rooms
  async getRooms() {
    return this.request("/rooms");
  }

  // Find available rooms for rescheduling
  async findAvailableRooms(params) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/rooms/available-for-reschedule?${queryParams}`);
  }

  // Materials methods
  async getMaterials(courseId, meeting) {
    return this.get(`/materials/${courseId}/${meeting}`);
  }

  // Get all materials for a course (grouped by meeting)
  async getMaterialsForCourse(courseId) {
    return this.get(`/materials/${courseId}`);
  }

  // Aggregated material counts per course
  async getMaterialsCounts() {
    return this.get("/materials/counts");
  }

  async uploadMaterial(courseId, meeting, formData) {
    const url = `${this.baseURL}/materials/${courseId}/${meeting}/upload`;
    const headers = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  }

  async downloadMaterial(courseId, meeting, fileId) {
    const url = `${this.baseURL}/materials/${courseId}/${meeting}/download/${fileId}`;
    const headers = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    return response.blob();
  }

  async deleteMaterial(courseId, meeting, fileId) {
    return this.request(`/materials/${courseId}/${meeting}/${fileId}`, {
      method: "DELETE",
    });
  }

  // Health check
  async healthCheck() {
    return this.get("/health");
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
