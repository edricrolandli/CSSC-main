// API Service for CSSC Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('cssc-token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('cssc-token', token);
    } else {
      localStorage.removeItem('cssc-token');
    }
  }

  // Get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
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

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, data) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async updateProfile(userData) {
    return this.put('/auth/profile', userData);
  }

  // Course methods
  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/courses?${queryString}` : '/courses';
    return this.get(endpoint);
  }

  async getCourse(id) {
    return this.get(`/courses/${id}`);
  }

  async subscribeCourse(courseId) {
    return this.post('/courses/subscribe', { course_id: courseId });
  }

  async unsubscribeCourse(courseId) {
    return this.delete('/courses/unsubscribe', { course_id: courseId });
  }

  async getMySubscriptions() {
    return this.get('/courses/my/subscriptions');
  }

  async createCourse(courseData) {
    return this.post('/courses', courseData);
  }

  // Schedule methods
  async getDefaultSchedule() {
    return this.get('/schedule/default');
  }

  async getRealSchedule(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/schedule/real?${queryString}` : '/schedule/real';
    return this.get(endpoint);
  }

  async updateSchedule(scheduleData) {
    return this.post('/schedule/update', scheduleData);
  }

  async getScheduleHistory(courseId) {
    return this.get(`/schedule/history/${courseId}`);
  }

  // Room methods
  async getRooms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/rooms?${queryString}` : '/rooms';
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
      params.append('min_capacity', minCapacity);
    }
    
    return this.get(`/rooms/free-slots?${params.toString()}`);
  }

  async getRoomSchedule(roomId, date) {
    return this.get(`/rooms/${roomId}/schedule?date=${date}`);
  }

  async createRoom(roomData) {
    return this.post('/rooms', roomData);
  }

  // Notification methods
  async getNotificationPreferences() {
    return this.get('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences) {
    return this.put('/notifications/preferences', preferences);
  }

  async sendScheduleChangeNotification(notificationData) {
    return this.post('/notifications/schedule-change', notificationData);
  }

  async testNotification(type, recipient) {
    return this.post('/notifications/test', { type, recipient });
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
