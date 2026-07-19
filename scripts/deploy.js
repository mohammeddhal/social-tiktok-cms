const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  // 1. Find the path 
  // 2. cd to path
  // 3. git pull && npm run build && pm2 restart all
  const cmd = `
    echo "Finding directory..."
    DIR=$(find / -type d -name "social-tiktok-cms" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -n 1)
    if [ -z "$DIR" ]; then
      echo "Directory not found!"
      exit 1
    fi
    echo "Found at: $DIR"
    cd "$DIR"
    echo "Pulling updates..."
    git pull
    echo "Building Next.js app..."
    npm run build
    echo "Restarting PM2..."
    pm2 restart all
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '72.61.184.217',
  port: 22,
  username: 'root',
  password: 'Mmoodi@@3574122'
});
