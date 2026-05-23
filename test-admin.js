import http from 'http';

function makeRequest(path, method, payload) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : '';
    const headers = {};
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: headers
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          if (body) parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          body: parsed
        });
      });
    });
    
    req.on('error', (err) => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("=== Phase 4 Admin API & Hardening Verification ===");
  
  // 1. Check initial globalMute state
  console.log("\n1. Querying server status...");
  const initStatus = await makeRequest('/', 'GET');
  console.log("Response:", initStatus.body);
  
  // 2. Enable Global Mute
  console.log("\n2. Enabling Global Admin Mute via /api/admin/mute...");
  const muteResult = await makeRequest('/api/admin/mute', 'POST', { muted: true });
  console.log("Status:", muteResult.statusCode, "Body:", muteResult.body);
  
  // 3. Try sending a notification (Should be blocked, returning 403)
  console.log("\n3. Attempting to dispatch notification during global mute...");
  const notifResult = await makeRequest('/api/notifications', 'POST', {
    senderId: 'verify_sender',
    senderName: 'Mute Verifier',
    recipientId: 'user_dev_01',
    message: 'This message should be blocked!',
    theme: 'airplane'
  });
  console.log("Status (Expected 403):", notifResult.statusCode, "Body:", notifResult.body);
  
  // 4. Disable Global Mute
  console.log("\n4. Disabling Global Admin Mute...");
  const unmuteResult = await makeRequest('/api/admin/mute', 'POST', { muted: false });
  console.log("Status:", unmuteResult.statusCode, "Body:", unmuteResult.body);
  
  // 5. Send notification again (Should be allowed, returning 200)
  console.log("\n5. Dispatching notification after unmuting...");
  const allowedNotif = await makeRequest('/api/notifications', 'POST', {
    senderId: 'verify_sender',
    senderName: 'Mute Verifier',
    recipientId: 'user_dev_01',
    message: 'This message is allowed!',
    theme: 'cat'
  });
  console.log("Status (Expected 200):", allowedNotif.statusCode, "Body:", allowedNotif.body);
  const notifId = allowedNotif.body.notification.id;
  
  // 6. Dismiss the notification via admin dismiss endpoint
  console.log(`\n6. Dismissing notification ${notifId} via admin dismiss API...`);
  const dismissResult = await makeRequest(`/api/admin/dismiss/${notifId}`, 'POST');
  console.log("Status (Expected 200):", dismissResult.statusCode, "Body:", dismissResult.body);
  
  console.log("\nVerification complete!");
}

runTests().catch(err => console.error("Test failed:", err));
