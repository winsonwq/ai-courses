# 测试指南

本文档详细说明了项目的测试要求和最佳实践。

## 测试策略

### 测试金字塔

```
        /\
       /  \
      / E2E \         少量端到端测试
     /--------\
    /          \
   / Integration \    适量集成测试
  /--------------\
 /                \
/   Unit Tests     \  大量单元测试
/------------------\
```

### 测试类型

#### 1. 单元测试（Unit Tests）
- **目标**：测试单个函数或类的行为
- **特点**：快速、隔离、可重复
- **覆盖率要求**：≥ 80%

#### 2. 集成测试（Integration Tests）
- **目标**：测试多个组件之间的交互
- **特点**：测试真实环境、较慢
- **覆盖率要求**：关键流程 100%

#### 3. 端到端测试（E2E Tests）
- **目标**：测试完整的用户流程
- **特点**：最慢、最真实
- **覆盖率要求**：核心功能覆盖

## 单元测试

### 测试文件命名

- 测试文件：`*.test.ts` 或 `*.spec.ts`
- 位置：与源文件同目录或 `__tests__` 目录

```
src/
├── services/
│   ├── user-service.ts
│   └── user-service.test.ts
└── __tests__/
    └── utils.test.ts
```

### 测试结构

使用 `describe` 组织测试套件，使用 `it` 或 `test` 编写测试用例：

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when id exists', async () => {
      // Arrange: 准备测试数据
      const userId = 1;
      const expectedUser = { id: 1, name: 'John' };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(expectedUser);

      // Act: 执行被测试的函数
      const result = await userService.getUserById(userId);

      // Assert: 验证结果
      expect(result).toEqual(expectedUser);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 999;
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        UserNotFoundError
      );
    });
  });
});
```

### AAA 模式

所有测试应该遵循 AAA 模式：

1. **Arrange（准备）**：设置测试数据和环境
2. **Act（执行）**：调用被测试的函数
3. **Assert（断言）**：验证结果是否符合预期

### 测试命名

测试名称应该清晰描述测试的内容：

```typescript
// ✅ 好的测试名称
it('should return user when id exists', () => { });
it('should throw UserNotFoundError when user does not exist', () => { });
it('should cache user data for 5 minutes', () => { });

// ❌ 不好的测试名称
it('test getUserById', () => { });  // 没有说明测试什么
it('works', () => { });  // 太模糊
it('getUserById test case 1', () => { });  // 没有意义
```

### Mock 和 Stub

#### Mock 外部依赖

```typescript
// Mock API 调用
jest.mock('./api-client', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

// Mock 数据库
jest.mock('./database', () => ({
  db: {
    query: jest.fn(),
  },
}));
```

#### 使用 Spy

```typescript
// Spy 现有方法
const spy = jest.spyOn(userRepository, 'findById');
spy.mockResolvedValue(mockUser);

// 验证调用
expect(spy).toHaveBeenCalledWith(userId);
expect(spy).toHaveBeenCalledTimes(1);
```

#### Mock 数据

```typescript
// 创建真实的 Mock 数据
const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date('2024-01-01'),
};

// 使用工厂函数
function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    ...overrides,
  };
}
```

### 测试异步代码

```typescript
// 使用 async/await
it('should fetch user asynchronously', async () => {
  const user = await userService.getUserById(1);
  expect(user).toBeDefined();
});

// 测试 Promise rejection
it('should reject when user not found', async () => {
  await expect(userService.getUserById(999)).rejects.toThrow(
    UserNotFoundError
  );
});

// 使用 done 回调（不推荐，仅在必要时使用）
it('should call callback', (done) => {
  userService.getUser((user) => {
    expect(user).toBeDefined();
    done();
  });
});
```

### 测试边界情况

```typescript
describe('UserService.getUserById', () => {
  it('should handle null input', async () => {
    await expect(userService.getUserById(null as any)).rejects.toThrow();
  });

  it('should handle negative id', async () => {
    await expect(userService.getUserById(-1)).rejects.toThrow();
  });

  it('should handle very large id', async () => {
    await expect(userService.getUserById(Number.MAX_SAFE_INTEGER))
      .rejects.toThrow();
  });

  it('should handle empty string id', async () => {
    await expect(userService.getUserById('' as any)).rejects.toThrow();
  });
});
```

## 集成测试

### 测试数据库交互

```typescript
describe('UserRepository Integration', () => {
  let db: Database;

  beforeAll(async () => {
    // 设置测试数据库
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    // 清理测试数据库
    await teardownTestDatabase(db);
  });

  beforeEach(async () => {
    // 每个测试前清理数据
    await db.query('TRUNCATE TABLE users');
  });

  it('should create and retrieve user', async () => {
    // 创建用户
    const user = await userRepository.create({
      name: 'John',
      email: 'john@example.com',
    });

    // 验证用户已创建
    expect(user.id).toBeDefined();

    // 检索用户
    const retrieved = await userRepository.findById(user.id);
    expect(retrieved).toEqual(user);
  });
});
```

### 测试 API 端点

```typescript
describe('User API Integration', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = createApp();
    server = app.listen(0);  // 使用随机端口
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      name: 'John',
      email: 'john@example.com',
    });
  });
});
```

## 测试最佳实践

### 1. 测试行为而非实现

```typescript
// ✅ 好的测试：测试行为
it('should return user by id', async () => {
  const user = await userService.getUserById(1);
  expect(user).toBeDefined();
  expect(user.id).toBe(1);
});

// ❌ 不好的测试：测试实现细节
it('should call repository.findById once', async () => {
  const spy = jest.spyOn(repository, 'findById');
  await userService.getUserById(1);
  expect(spy).toHaveBeenCalledTimes(1);  // 如果实现改变，测试会失败
});
```

### 2. 一个测试一个断言（理想情况）

```typescript
// ✅ 好的测试：每个测试只测试一个方面
it('should return user with correct id', async () => {
  const user = await userService.getUserById(1);
  expect(user.id).toBe(1);
});

it('should return user with correct name', async () => {
  const user = await userService.getUserById(1);
  expect(user.name).toBe('John');
});

// ⚠️ 也可以：相关断言可以放在一起
it('should return user with all required fields', async () => {
  const user = await userService.getUserById(1);
  expect(user.id).toBe(1);
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
});
```

### 3. 使用描述性的测试数据

```typescript
// ✅ 好的测试：使用有意义的测试数据
it('should reject invalid email', async () => {
  await expect(
    userService.createUser({ name: 'John', email: 'invalid-email' })
  ).rejects.toThrow(ValidationError);
});

// ❌ 不好的测试：使用无意义的测试数据
it('should reject invalid email', async () => {
  await expect(
    userService.createUser({ name: 'a', email: 'b' })
  ).rejects.toThrow(ValidationError);
});
```

### 4. 避免测试私有方法

```typescript
// ❌ 不要直接测试私有方法
// 私有方法应该通过公共方法间接测试

class UserService {
  private validateEmail(email: string): boolean {
    // 私有方法
  }

  public createUser(userData: UserData): Promise<User> {
    if (!this.validateEmail(userData.email)) {
      throw new ValidationError('Invalid email');
    }
    // ...
  }
}

// ✅ 通过公共方法测试
it('should reject invalid email', async () => {
  await expect(
    userService.createUser({ email: 'invalid' })
  ).rejects.toThrow(ValidationError);
});
```

### 5. 清理测试数据

```typescript
describe('UserService', () => {
  beforeEach(() => {
    // 每个测试前重置 Mock
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // 每个测试后清理数据
    await cleanupTestData();
  });
});
```

## 测试覆盖率

### 覆盖率指标

- **语句覆盖率（Statement Coverage）**：≥ 80%
- **分支覆盖率（Branch Coverage）**：≥ 75%
- **函数覆盖率（Function Coverage）**：≥ 80%
- **行覆盖率（Line Coverage）**：≥ 80%

### 查看覆盖率

```bash
# 运行测试并生成覆盖率报告
npm test -- --coverage

# 查看 HTML 报告
open coverage/lcov-report/index.html
```

### 覆盖率配置

```json
// package.json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.test.ts",
      "!src/**/*.spec.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 75,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 测试工具

### Jest

```typescript
// 基本用法
describe('测试套件', () => {
  it('测试用例', () => {
    expect(1 + 1).toBe(2);
  });
});

// Mock
jest.mock('./module');
jest.spyOn(object, 'method');

// 异步测试
it('async test', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Library（如果使用 React）

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('should render user name', () => {
  render(<User name="John" />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

## 常见问题

### Q: 如何测试私有方法？
A: 不要直接测试私有方法，通过公共方法间接测试。

### Q: 如何测试随机数生成？
A: Mock Math.random() 或使用固定的随机种子。

### Q: 如何测试时间相关代码？
A: 使用 Jest 的 `jest.useFakeTimers()` 或 Mock Date 对象。

### Q: 集成测试太慢怎么办？
A: 使用内存数据库、Mock 外部服务、并行运行测试。
