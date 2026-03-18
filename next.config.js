/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

// Auto-start PTY server in dev mode
if (process.env.NODE_ENV !== 'production') {
  const { spawn } = require('child_process');
  const net = require('net');

  const PTY_PORT = 3100;

  // Check if already running
  const check = net.createConnection({ port: PTY_PORT, host: 'localhost' });
  check.on('error', () => {
    // Not running — start it
    const pty = spawn('python3', ['scripts/pty-server.py'], {
      cwd: __dirname,
      stdio: 'ignore',
      detached: true,
    });
    pty.unref();
    console.log(`[next.config] Started PTY server on port ${PTY_PORT}`);
  });
  check.on('connect', () => {
    check.destroy();
    // Already running
  });
}

module.exports = nextConfig;
