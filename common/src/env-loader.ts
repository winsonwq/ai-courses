// 环境变量加载工具
// 支持从 .env 文件加载环境变量

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'

/**
 * 加载 .env 文件
 * 从项目根目录开始向上查找 .env 文件
 */
export function loadEnv(): void {
  let currentDir = __dirname

  // 向上查找项目根目录（包含 .git 或 package.json 的目录）
  while (currentDir !== '/') {
    const envPath = join(currentDir, '.env')
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8')
      const lines = envContent.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim()
            // 移除引号（如果有）
            const cleanValue = value.replace(/^["']|["']$/g, '')
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = cleanValue
            }
          }
        }
      }
      return
    }

    // 检查是否到达项目根目录
    if (existsSync(join(currentDir, '.git')) || existsSync(join(currentDir, 'package.json'))) {
      const envPath = join(currentDir, '.env')
      if (existsSync(envPath)) {
        // 已经在项目根目录，再次检查
        break
      }
    }

    currentDir = dirname(currentDir)
  }
}
