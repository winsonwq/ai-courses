# AI 代码示例

本文档提供项目中期望的代码风格和模式示例，帮助 AI 生成符合项目规范的代码。

## TypeScript 函数示例

### 基础函数

```typescript
/**
 * 计算两个数的和
 * @param a - 第一个数
 * @param b - 第二个数
 * @returns 两数之和
 */
export function add(a: number, b: number): number {
  return a + b;
}
```

### 异步函数

```typescript
/**
 * 获取用户信息
 * @param userId - 用户 ID
 * @returns 用户对象
 * @throws {UserNotFoundError} 当用户不存在时
 */
export async function getUserById(userId: number): Promise<User> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User ${userId} not found`);
    }
    return user;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw new Error(`Failed to fetch user ${userId}: ${error.message}`);
  }
}
```

### 类定义

```typescript
/**
 * 用户服务类
 * 提供用户相关的业务逻辑
 */
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger: Logger
  ) {}

  /**
   * 创建新用户
   * @param userData - 用户数据
   * @returns 创建的用户对象
   */
  async createUser(userData: CreateUserData): Promise<User> {
    this.logger.info(`Creating user: ${userData.email}`);
    
    // 验证数据
    this.validateUserData(userData);

    // 检查是否已存在
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new UserAlreadyExistsError(userData.email);
    }

    // 创建用户
    const user = await this.userRepository.create(userData);
    this.logger.info(`User created: ${user.id}`);

    return user;
  }

  private validateUserData(userData: CreateUserData): void {
    if (!userData.email || !isValidEmail(userData.email)) {
      throw new ValidationError('Invalid email address');
    }
    if (!userData.name || userData.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }
  }
}
```

## 错误处理示例

### 自定义错误类

```typescript
/**
 * 用户未找到错误
 */
export class UserNotFoundError extends Error {
  constructor(userId: number) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * 用户已存在错误
 */
export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 错误处理模式

```typescript
// ✅ 好的错误处理
async function processUser(userId: number): Promise<void> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    // 处理用户
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      // 处理特定错误
      logger.warn(`User not found: ${userId}`);
      throw error;
    }
    // 处理其他错误
    logger.error(`Unexpected error: ${error.message}`, error);
    throw new Error('Failed to process user');
  }
}

// ❌ 不好的错误处理
async function processUser(userId: number): Promise<void> {
  const user = await userRepository.findById(userId);  // 没有错误处理
  // 处理用户
}
```

## 类型定义示例

### Interface 定义

```typescript
/**
 * 用户接口
 */
export interface User {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  name: string;
  /** 邮箱地址 */
  email: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 创建用户数据
 */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

/**
 * 更新用户数据
 */
export interface UpdateUserData {
  name?: string;
  email?: string;
}
```

### 类型别名

```typescript
/**
 * 用户 ID 类型
 */
export type UserId = number;

/**
 * 邮箱类型
 */
export type Email = string;

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'user' | 'guest';
```

## 测试示例

### 单元测试

```typescript
import { UserService } from './user-service';
import { UserRepository } from './user-repository';
import { UserNotFoundError } from './errors';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as any;

    userService = new UserService(mockUserRepository);
  });

  describe('getUserById', () => {
    it('should return user when id exists', async () => {
      // Arrange
      const userId = 1;
      const expectedUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };
      mockUserRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      const userId = 999;
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        UserNotFoundError
      );
    });
  });
});
```

## API 路由示例

### Express 路由

```typescript
import { Router, Request, Response } from 'express';
import { UserService } from '../services/user-service';
import { validateCreateUser } from '../middleware/validation';

const router = Router();
const userService = new UserService();

/**
 * GET /api/users/:id
 * 获取用户信息
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await userService.getUserById(userId);
    res.json(user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users
 * 创建新用户
 */
router.post('/', validateCreateUser, async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

## 工具函数示例

### 验证函数

```typescript
/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否为有效邮箱
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 验证结果
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 工具类

```typescript
/**
 * 日期工具类
 */
export class DateUtils {
  /**
   * 格式化日期
   * @param date - 日期对象
   * @param format - 格式字符串 (YYYY-MM-DD)
   * @returns 格式化后的日期字符串
   */
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  /**
   * 计算两个日期之间的天数差
   * @param date1 - 第一个日期
   * @param date2 - 第二个日期
   * @returns 天数差
   */
  static daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / msPerDay);
  }
}
```

## 配置示例

### 环境配置

```typescript
/**
 * 应用配置
 */
export interface AppConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  apiUrl: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

/**
 * 加载应用配置
 */
export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    env: (process.env.NODE_ENV as any) || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME || 'mydb',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
    },
  };
}
```

## 最佳实践总结

1. **类型安全**：充分利用 TypeScript 类型系统
2. **错误处理**：所有异步操作都要有错误处理
3. **文档注释**：公共函数必须有 JSDoc
4. **单一职责**：每个函数只做一件事
5. **可测试性**：代码应该易于测试
6. **可读性**：代码应该清晰易懂
