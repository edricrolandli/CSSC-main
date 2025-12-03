// Using built-in fetch (Node.js 18+)

const testAPI = async () => {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'yehezkiel@usu.ac.id',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log('Login failed:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Now test the room availability endpoint
    const response = await fetch('http://localhost:5000/api/rooms/available-for-reschedule?original_date=2025-12-04&original_start_time=08:00&original_end_time=10:30&from_date=2025-12-03&to_date=2025-12-05', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPI();
