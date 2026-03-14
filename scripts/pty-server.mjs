#!/usr/bin/env node
/**
 * Terminal WebSocket Server (macOS)
 * ==================================
 * Uses `script -q /dev/null` to allocate a real PTY on macOS,
 * giving full interactive terminal support (colors, cursor,
 * line editing, vim, claude, ssh — everything).
 *
 * Usage: node scripts/pty-server.mjs
 * Port:  3100 (PTY_PORT env)
 */

import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { homedir, platform } from 'os';

const PORT = parseInt(process.env.PTY_PORT || '3100', 10);
const SHELL = process.env.SHELL || '/bin/zsh';
const IS_MAC = platform() === 'darwin';

const wss = new WebSocketServer({ port: PORT });
const sessions = new Map();

console.log(`[pty-server] ws://localhost:${PORT}`);
console.log(`[pty-server] shell: ${SHELL} | platform: ${platform()}`);

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get('session') || crypto.randomUUID();
  const cols = url.searchParams.get('cols') || '120';
  const rows = url.searchParams.get('rows') || '30';
  const cwd = url.searchParams.get('cwd') || process.cwd();

  console.log(`[pty-server] session ${sessionId} (${cols}x${rows})`);

  const env = {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    COLUMNS: cols,
    LINES: rows,
    HOME: homedir(),
    LANG: process.env.LANG || 'en_US.UTF-8',
    LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
  };

  // Use `script` to allocate a real PTY on macOS
  // On Linux, use `script -qc`
  let proc;
  if (IS_MAC) {
    proc = spawn('script', ['-q', '/dev/null', SHELL, '-i'], {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } else {
    proc = spawn('script', ['-qc', `${SHELL} -i`, '/dev/null'], {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  sessions.set(sessionId, { proc, ws });

  // PTY output → Browser
  proc.stdout.on('data', (data) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'output', data: data.toString('utf-8') }));
    }
  });

  proc.stderr.on('data', (data) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'output', data: data.toString('utf-8') }));
    }
  });

  proc.on('close', (code) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'exit', code: code ?? 0 }));
    }
    sessions.delete(sessionId);
    console.log(`[pty-server] session ${sessionId} closed (${code})`);
  });

  proc.on('error', (err) => {
    console.error(`[pty-server] error:`, err.message);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'output', data: `\r\nError: ${err.message}\r\n` }));
    }
  });

  // Browser → PTY stdin
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'input') {
        proc.stdin.write(msg.data);
      } else if (msg.type === 'resize') {
        // Send SIGWINCH-style resize via stty
        // This works through the PTY allocated by `script`
        if (msg.cols && msg.rows) {
          proc.stdin.write(`stty cols ${msg.cols} rows ${msg.rows}\n`);
        }
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      proc.stdin.write(raw.toString());
    }
  });

  ws.on('close', () => {
    proc.kill('SIGHUP');
    sessions.delete(sessionId);
    console.log(`[pty-server] session ${sessionId} disconnected`);
  });

  ws.send(JSON.stringify({
    type: 'ready',
    sessionId,
    cwd,
    shell: SHELL,
  }));
});

process.on('SIGINT', () => {
  for (const [, s] of sessions) {
    s.proc.kill('SIGHUP');
  }
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  for (const [, s] of sessions) {
    s.proc.kill('SIGHUP');
  }
  wss.close();
  process.exit(0);
});
