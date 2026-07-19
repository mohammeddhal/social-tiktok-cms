const https = require('https');

const loginData = JSON.stringify({ email: 'publisher@grt-garage.com', password: 'password' }); 
const loginOptions = {
  hostname: 'social.grt-garage.com',
  path: '/api/mobile/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
};

const req = https.request(loginOptions, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (data.token) {
        console.log('Got token');
        // Fetch tasks
        const taskOptions = {
          hostname: 'social.grt-garage.com',
          path: '/api/mobile/tasks/tiktok',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${data.token}` }
        };
        const taskReq = https.request(taskOptions, (tres) => {
          let tbody = '';
          tres.on('data', d => tbody += d);
          tres.on('end', () => {
             console.log('Tasks status:', tres.statusCode);
             console.log('Tasks body:', tbody);
          });
        });
        taskReq.end();
      } else {
        console.log('Login failed:', body);
      }
    } catch(e) {
      console.log('Error parsing login:', e);
    }
  });
});
req.on('error', console.error);
req.write(loginData);
req.end();
