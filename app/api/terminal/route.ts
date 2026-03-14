import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ExecSchema = z.object({
  command: z.string().min(1).max(4000),
  cwd: z.string().optional(),
});

/**
 * POST /api/terminal — Execute a shell command locally.
 * DEV ONLY — blocked in production.
 */
export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production' && process.env.DEV_BYPASS !== 'true') {
    return NextResponse.json({ error: 'Terminal disabled in production' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = ExecSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { command, cwd } = parsed.data;

  try {
    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      exec(
        command,
        {
          cwd: cwd || process.cwd(),
          timeout: 30000,
          maxBuffer: 1024 * 1024, // 1MB
          env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
          shell: '/bin/zsh',
        },
        (error, stdout, stderr) => {
          resolve({
            stdout: stdout?.toString() ?? '',
            stderr: stderr?.toString() ?? '',
            code: error?.code ?? 0,
          });
        }
      );
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { stdout: '', stderr: String(err), code: 1 },
      { status: 200 }
    );
  }
}

/**
 * GET /api/terminal — Check if terminal is available + return CWD.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.DEV_BYPASS !== 'true') {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({
    available: true,
    cwd: process.cwd(),
    shell: '/bin/zsh',
    node: process.version,
    platform: process.platform,
  });
}
