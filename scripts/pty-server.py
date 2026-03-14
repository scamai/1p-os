#!/usr/bin/env python3
"""
PTY WebSocket Server
=====================
Real PTY terminal server using Python's pty module.
Supports interactive programs: vim, claude, ssh, htop, etc.

Usage: python3 scripts/pty-server.py
Port:  3100 (PTY_PORT env)
"""

import asyncio
import json
import os
import pty
import signal
import struct
import fcntl
import termios
import subprocess
import sys

try:
    import websockets
except ImportError:
    print("Installing websockets...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
    import websockets

PORT = int(os.environ.get("PTY_PORT", "3100"))
SHELL = os.environ.get("SHELL", "/bin/zsh")
sessions = {}


def set_winsize(fd, rows, cols):
    """Set terminal window size."""
    winsize = struct.pack("HHHH", rows, cols, 0, 0)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)


async def terminal_session(websocket):
    """Handle a single terminal WebSocket session."""
    # Parse query params
    path = websocket.request.path if hasattr(websocket, 'request') else '/'
    params = {}
    if '?' in path:
        for p in path.split('?', 1)[1].split('&'):
            if '=' in p:
                k, v = p.split('=', 1)
                params[k] = v

    session_id = params.get('session', os.urandom(8).hex())
    cols = int(params.get('cols', '120'))
    rows = int(params.get('rows', '30'))
    cwd = params.get('cwd', os.getcwd())

    print(f"[pty] session {session_id} ({cols}x{rows})")

    # Allocate real PTY
    master_fd, slave_fd = pty.openpty()

    # Set initial size
    set_winsize(slave_fd, rows, cols)

    # Spawn shell in the PTY
    env = os.environ.copy()
    env.update({
        "TERM": "xterm-256color",
        "COLORTERM": "truecolor",
        "COLUMNS": str(cols),
        "LINES": str(rows),
        "LANG": os.environ.get("LANG", "en_US.UTF-8"),
        "LC_ALL": os.environ.get("LC_ALL", "en_US.UTF-8"),
    })

    pid = os.fork()
    if pid == 0:
        # Child process
        os.setsid()
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        os.close(master_fd)
        os.close(slave_fd)
        os.chdir(cwd)
        os.execvpe(SHELL, [SHELL, "-i"], env)
        sys.exit(1)

    # Parent process
    os.close(slave_fd)
    sessions[session_id] = {"pid": pid, "fd": master_fd}

    # Make master_fd non-blocking
    import fcntl
    flags = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

    # Send ready
    await websocket.send(json.dumps({
        "type": "ready",
        "sessionId": session_id,
        "cwd": cwd,
        "shell": SHELL,
    }))

    # Read loop: PTY → WebSocket
    async def read_pty():
        loop = asyncio.get_event_loop()
        while True:
            try:
                await asyncio.sleep(0.01)  # 10ms poll
                try:
                    data = os.read(master_fd, 4096)
                    if not data:
                        break
                    await websocket.send(json.dumps({
                        "type": "output",
                        "data": data.decode("utf-8", errors="replace"),
                    }))
                except BlockingIOError:
                    pass
                except OSError:
                    break
            except asyncio.CancelledError:
                break

    # Write loop: WebSocket → PTY
    async def write_pty():
        try:
            async for message in websocket:
                try:
                    msg = json.loads(message)
                    if msg.get("type") == "input":
                        os.write(master_fd, msg["data"].encode("utf-8"))
                    elif msg.get("type") == "resize":
                        r = int(msg.get("rows", rows))
                        c = int(msg.get("cols", cols))
                        set_winsize(master_fd, r, c)
                        # Send SIGWINCH to the process group
                        os.killpg(os.getpgid(pid), signal.SIGWINCH)
                    elif msg.get("type") == "ping":
                        await websocket.send(json.dumps({"type": "pong"}))
                except (json.JSONDecodeError, KeyError):
                    os.write(master_fd, message.encode("utf-8") if isinstance(message, str) else message)
        except websockets.exceptions.ConnectionClosed:
            pass

    # Run both loops
    read_task = asyncio.create_task(read_pty())
    write_task = asyncio.create_task(write_pty())

    try:
        await asyncio.gather(read_task, write_task)
    except Exception:
        pass
    finally:
        read_task.cancel()
        write_task.cancel()

        # Cleanup
        try:
            os.kill(pid, signal.SIGHUP)
            os.waitpid(pid, os.WNOHANG)
        except (ProcessLookupError, ChildProcessError):
            pass
        try:
            os.close(master_fd)
        except OSError:
            pass

        sessions.pop(session_id, None)
        print(f"[pty] session {session_id} closed")


async def main():
    print(f"[pty-server] ws://localhost:{PORT}")
    print(f"[pty-server] shell: {SHELL}")

    async with websockets.serve(terminal_session, "localhost", PORT):
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[pty-server] shutting down")
        for sid, s in sessions.items():
            try:
                os.kill(s["pid"], signal.SIGHUP)
            except ProcessLookupError:
                pass
