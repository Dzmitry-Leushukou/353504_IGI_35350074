// test-poe.js
const axios = require('axios');

async function testPoeAPI() {
  try {
    console.log('Testing Poe API with key:', process.env.POE_API_KEY?.substring(0, 10) + '...');
    
    const response = await axios.post(
      'https://api.poe.com/v1/chat/completions',
      {
        model: "claude-3-opus", // Попробуйте другую модель
        messages: [
          {
            role: "user",
            content: "Hello, are you working?"
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.POE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Poe API Test Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Запустите тест
testPoeAPI();