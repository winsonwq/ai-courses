import { execSync } from 'child_process';
import type { ToolSchema } from './types';

/** 禁止在 shell 中使用的模式（坚决不删除） */
const SHELL_BLOCKLIST = [
  /\brm\b/i,
  /\bdel\b/i,
  /\bdelete\b/i,
  /\btruncate\b/i,
  /\bunlink\b/i,
  /\brmdir\b/i,
  /\bremove\b/i,
];

function isAllowedShellCommand(cmd: string): boolean {
  const trimmed = cmd.trim();
  if (!trimmed) return false;
  for (const pattern of SHELL_BLOCKLIST) {
    if (pattern.test(trimmed)) return false;
  }
  return true;
}

export const workerRunSafeShellTool: ToolSchema = {
  type: 'function',
  function: {
    name: 'runSafeShell',
    description:
      '在本地执行 shell 命令，支持读和写。读：ls、cat、head、tail、grep、find 等；写：echo "内容" > 文件（覆盖）、echo "内容" >> 文件（追加）。严禁 rm、del 等删除操作。',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的 shell 命令（禁止 rm、del 等删除）' },
      },
      required: ['command'],
    },
  },
};

export interface RunSafeShellArgs {
  command: string;
}

export function executeRunSafeShell(args: RunSafeShellArgs): string {
  const { command } = args;
  if (!isAllowedShellCommand(command)) {
    return '错误: 该命令被拒绝。不允许执行删除操作（如 rm、del、rmdir 等）。';
  }
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      cwd: process.cwd(),
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
    return result.trim() || '(无输出)';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return `命令执行失败: ${msg}`;
  }
}
