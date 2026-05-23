import http from 'http';

function sendNotif(theme, message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      senderId: 'spam_tester',
      senderName: 'Spam Tester',
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
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Sending a burst of 3 notifications to test queueing...");
  try {
    const res1 = await sendNotif('airplane', 'First notification (Airplane theme)');
    console.log("Sent 1:", res1.notification.id);
    const res2 = await sendNotif('cat', 'Second notification (Cat theme)');
    console.log("Sent 2:", res2.notification.id);
    const res3 = await sendNotif('meme', 'Third notification (Meme theme)');
    console.log("Sent 3:", res3.notification.id);
    console.log("Burst dispatched successfully. Check Electron overlay queue console logs.");
  } catch (err) {
    console.error("Failed to send burst:", err.message);
  }
}

run();
