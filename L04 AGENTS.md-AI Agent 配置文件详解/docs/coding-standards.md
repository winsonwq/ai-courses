# 编码规范详细说明

本文档详细说明了项目的编码规范，是对 `AGENTS.md` 中编码规范的补充和扩展。

## TypeScript 最佳实践

### 类型定义

#### 优先使用 `interface` 定义对象类型

```typescript
// ✅ 推荐
interface User {
  id: number;
  name: string;
  email: string;
}

// ⚠️ 仅在需要联合类型或工具类型时使用 type
type Status = 'pending' | 'approved' | 'rejected';
type UserWithStatus = User & { status: Status };
```

#### 使用类型别名提高可读性

```typescript
// ✅ 推荐
type UserId = number;
type Email = string;

interface User {
  id: UserId;
  email: Email;
}

// ❌ 不推荐
interface User {
  id: number;  // 不够语义化
  email: string;
}
```

### 函数设计

#### 函数参数

- 参数数量不超过 3 个，超过时使用对象参数
- 可选参数放在最后
- 使用解构参数提高可读性

```typescript
// ✅ 推荐
interface CreateUserParams {
  name: string;
  email: string;
  age?: number;
  role?: string;
}

function createUser({ name, email, age, role }: CreateUserParams): User {
  // ...
}

// ❌ 不推荐
function createUser(
  name: string,
  email: string,
  age?: number,
  role?: string
): User {
  // 参数太多，难以维护
}
```

#### 异步函数

- 始终返回 `Promise<T>` 类型
- 使用 `async/await` 而非 `Promise.then()`
- 错误处理使用 try-catch

```typescript
// ✅ 推荐
async function fetchUser(id: number): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new UserNotFoundError(`User ${id} not found`);
  }
}

// ❌ 不推荐
function fetchUser(id: number): Promise<User> {
  return api.get(`/users/${id}`)
    .then(response => response.data)
    .catch(error => {
      // 错误处理不够明确
      console.error(error);
      throw error;
    });
}
```

### 错误处理

#### 自定义错误类型

```typescript
// ✅ 推荐：定义自定义错误类
class UserNotFoundError extends Error {
  constructor(userId: number) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

// 使用
if (!user) {
  throw new UserNotFoundError(id);
}
```

#### 错误传播

- 在合适的层级处理错误
- 不要过度捕获错误
- 保留错误上下文

```typescript
// ✅ 推荐：在服务层抛出，在控制器层捕获
class UserService {
  async getUser(id: number): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }
}

class UserController {
  async getUser(req: Request, res: Response) {
    try {
      const user = await this.userService.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
```

### 代码组织

#### 文件结构

```typescript
// 1. 导入外部库
import { readFile } from 'fs/promises';
import axios from 'axios';

// 2. 导入内部模块
import { UserService } from './services/user-service';
import { validateEmail } from './utils/validation';

// 3. 导入类型（使用 type 关键字）
import type { User, UserRole } from './types/user';

// 4. 类型定义
interface Config {
  apiUrl: string;
}

// 5. 常量
const DEFAULT_TIMEOUT = 5000;

// 6. 主要代码
export class ApiClient {
  // ...
}

// 7. 辅助函数（如果文件内使用）
function helperFunction() {
  // ...
}
```

#### 模块导出

```typescript
// ✅ 推荐：每个文件一个默认导出
// user-service.ts
export default class UserService {
  // ...
}

// ✅ 推荐：多个相关导出使用命名导出
// utils.ts
export function formatDate(date: Date): string {
  // ...
}

export function parseDate(dateString: string): Date {
  // ...
}

// ❌ 不推荐：混合使用
export default class UserService { }
export function helper() {
  // ...
}
```

### 命名约定

#### 布尔值

- 使用 `is`、`has`、`should`、`can` 前缀

```typescript
// ✅ 推荐
const isActive = true;
const hasPermission = false;
const shouldRetry = true;
const canEdit = false;

// ❌ 不推荐
const active = true;  // 不够明确
const permission = false;
```

#### 事件处理函数

- 使用 `handle` 前缀

```typescript
// ✅ 推荐
function handleClick() { }
function handleSubmit() { }
function handleUserLogin() { }

// ❌ 不推荐
function onClick() { }
function submit() { }
```

#### 异步操作

- 使用动词开头，明确表达操作

```typescript
// ✅ 推荐
async function fetchUser() { }
async function createOrder() { }
async function deleteFile() { }

// ❌ 不推荐
async function user() { }
async function order() { }
```

### 代码注释

#### JSDoc 注释模板

```typescript
/**
 * 获取用户信息
 * 
 * 根据用户 ID 从数据库获取用户详细信息，包括基本信息和权限。
 * 如果用户不存在，会抛出 UserNotFoundError。
 * 
 * @param userId - 用户 ID，必须是正整数
 * @param includePermissions - 是否包含权限信息，默认为 false
 * @returns 用户对象，包含 id、name、email 等字段
 * @throws {UserNotFoundError} 当用户不存在时
 * @throws {ValidationError} 当 userId 无效时
 * 
 * @example
 * ```typescript
 * const user = await getUser(123, true);
 * console.log(user.name); // "John Doe"
 * ```
 * 
 * @since 1.0.0
 * @see {@link User} 用户类型定义
 */
async function getUser(
  userId: number,
  includePermissions = false
): Promise<User> {
  // 实现
}
```

#### 行内注释

- 解释"为什么"而非"是什么"
- 复杂逻辑必须注释
- 避免显而易见的注释

```typescript
// ✅ 推荐：解释为什么
// 使用 Map 而非对象，因为需要保持插入顺序
const userMap = new Map<number, User>();

// ✅ 推荐：解释复杂逻辑
// 计算加权平均分：每门课程的成绩乘以学分，求和后除以总学分
const weightedAverage = courses.reduce((sum, course) => {
  return sum + course.score * course.credits;
}, 0) / totalCredits;

// ❌ 不推荐：显而易见的注释
// 设置变量 x 为 10
const x = 10;

// ❌ 不推荐：只说明是什么
// 获取用户
const user = await getUser(id);
```

### 性能优化

#### 避免不必要的计算

```typescript
// ✅ 推荐：缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ❌ 不推荐：每次渲染都计算
const expensiveValue = computeExpensiveValue(data);
```

#### 使用适当的数据结构

```typescript
// ✅ 推荐：需要快速查找时使用 Map
const userMap = new Map<number, User>();
userMap.set(user.id, user);
const user = userMap.get(id);  // O(1)

// ⚠️ 注意：数组查找是 O(n)
const users: User[] = [];
const user = users.find(u => u.id === id);  // O(n)
```

### 代码审查检查清单

在提交代码前，检查以下事项：

- [ ] 所有函数都有类型注解
- [ ] 没有使用 `any` 类型
- [ ] 所有公共函数都有 JSDoc 注释
- [ ] 错误处理完善
- [ ] 代码格式符合项目规范
- [ ] 没有 console.log 等调试代码
- [ ] 没有注释掉的代码
- [ ] 变量和函数命名清晰
- [ ] 代码逻辑清晰，没有过度复杂
