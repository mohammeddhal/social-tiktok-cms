const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const cmd = `
    echo "Finding directory..."
    DIR=$(find / -type d -name "social-tiktok-cms" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -n 1)
    cd "$DIR"

    echo "Ensuring swap file exists to prevent out-of-memory errors..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
    fi

    echo "Pulling latest code from Github..."
    git config --global --add safe.directory "$DIR" || true
    git pull origin main

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
