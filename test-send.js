import http from 'http';

// Parse command line arguments for customization
const args = process.argv.slice(2);
const theme = args[0] || 'cat';
const message = args[1] || `Test notification message for theme: ${theme}!`;

const data = JSON.stringify({
  senderId: 'user_sender_99',
  senderName: 'Antigravity AI',
  recipientId: 'user_dev_01',
  message: message,
  theme: theme,
  expiresInMs: 300000
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/notifications',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log(`Sending notification to API with theme: "${theme}"...`);

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('API Response Status:', res.statusCode);
    console.log('API Response Body:', body);
  });
});

req.on('error', (error) => {
  console.error('Error sending request to API:', error);
});

req.write(data);
req.end();
