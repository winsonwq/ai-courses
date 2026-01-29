# 架构文档

本文档说明了项目的整体架构设计和技术决策。

## 架构概览

### 系统架构图

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTP/HTTPS
       ▼
┌─────────────┐
│   API       │
│   Gateway   │
└──────┬──────┘
       │
       ├──────────┬──────────┐
       ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │  User   │ │  Order  │
│ Service │ │ Service │ │ Service │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └───────────┴───────────┘
                 │
                 ▼
          ┌─────────────┐
          │  Database   │
          │  (PostgreSQL)│
          └─────────────┘
```

## 技术栈

### 后端
- **运行时**：Node.js 18+
- **框架**：Express.js / Fastify
- **语言**：TypeScript (严格模式)
- **数据库**：PostgreSQL
- **ORM**：Prisma / TypeORM
- **认证**：JWT

### 前端（如适用）
- **框架**：React / Vue
- **语言**：TypeScript
- **构建工具**：Vite / Webpack
- **状态管理**：Redux / Zustand

### 开发工具
- **包管理**：npm / pnpm
- **代码检查**：ESLint
- **代码格式化**：Prettier
- **测试**：Jest
- **类型检查**：TypeScript

## 目录结构

### 后端项目结构

```
src/
├── api/              # API 路由
│   ├── routes/       # 路由定义
│   └── middleware/   # 中间件
├── services/         # 业务逻辑层
│   ├── user-service.ts
│   └── auth-service.ts
├── repositories/     # 数据访问层
│   ├── user-repository.ts
│   └── base-repository.ts
├── models/           # 数据模型
│   └── user.ts
├── types/            # TypeScript 类型定义
│   └── user.ts
├── utils/            # 工具函数
│   ├── validation.ts
│   └── logger.ts
├── config/           # 配置文件
│   ├── database.ts
│   └── app.ts
├── middleware/       # 全局中间件
│   ├── auth.ts
│   └── error-handler.ts
└── __tests__/        # 测试文件
    ├── unit/
    └── integration/
```

### 前端项目结构（如适用）

```
src/
├── components/       # 可复用组件
│   ├── common/      # 通用组件
│   └── features/    # 功能组件
├── pages/           # 页面组件
├── hooks/           # 自定义 Hooks
├── store/           # 状态管理
│   ├── slices/
│   └── index.ts
├── services/        # API 服务
│   └── api-client.ts
├── utils/           # 工具函数
├── types/           # TypeScript 类型
└── __tests__/       # 测试文件
```

## 架构原则

### 1. 分层架构

```
┌─────────────────┐
│   Presentation  │  API 路由层
├─────────────────┤
│    Business     │  业务逻辑层
├─────────────────┤
│     Data        │  数据访问层
└─────────────────┘
```

**职责分离：**
- **Presentation Layer**：处理 HTTP 请求/响应、参数验证
- **Business Layer**：实现业务逻辑、业务规则
- **Data Layer**：数据访问、数据库操作

### 2. 依赖注入

使用依赖注入提高代码的可测试性和可维护性：

```typescript
// ✅ 好的设计：依赖注入
class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger: Logger
  ) {}

  async getUserById(id: number): Promise<User> {
    this.logger.info(`Fetching user ${id}`);
    return this.userRepository.findById(id);
  }
}

// ❌ 不好的设计：硬编码依赖
class UserService {
  private userRepository = new UserRepository();  // 硬编码
  private logger = new Logger();  // 硬编码
}
```

### 3. 单一职责原则

每个类/函数只负责一个功能：

```typescript
// ✅ 好的设计：职责单一
class UserValidator {
  validateEmail(email: string): boolean { }
  validatePassword(password: string): boolean { }
}

class UserService {
  async createUser(userData: UserData): Promise<User> { }
  async updateUser(id: number, userData: UserData): Promise<User> { }
}

// ❌ 不好的设计：职责过多
class UserManager {
  validateEmail() { }
  validatePassword() { }
  createUser() { }
  updateUser() { }
  sendEmail() { }  // 不应该在这里
  generateReport() { }  // 不应该在这里
}
```

### 4. 接口隔离原则

使用小而专的接口：

```typescript
// ✅ 好的设计：接口隔离
interface Readable {
  read(): Promise<Data>;
}

interface Writable {
  write(data: Data): Promise<void>;
}

class FileStorage implements Readable, Writable {
  // 实现
}

// ❌ 不好的设计：接口过大
interface Storage {
  read(): Promise<Data>;
  write(data: Data): Promise<void>;
  delete(): Promise<void>;
  backup(): Promise<void>;
  restore(): Promise<void>;
  // 太多方法
}
```

## 设计模式

### 1. Repository 模式

抽象数据访问层：

```typescript
interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: UserData): Promise<User>;
  update(id: number, userData: Partial<UserData>): Promise<User>;
  delete(id: number): Promise<void>;
}

class PostgreSQLUserRepository implements UserRepository {
  // 实现
}

class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }
}
```

### 2. Service 模式

封装业务逻辑：

```typescript
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(userData: UserData): Promise<User> {
    // 1. 验证数据
    this.validateUserData(userData);

    // 2. 检查是否已存在
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new UserAlreadyExistsError(userData.email);
    }

    // 3. 创建用户
    const user = await this.userRepository.create(userData);

    // 4. 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(user.email);

    // 5. 记录日志
    this.logger.info(`User created: ${user.id}`);

    return user;
  }
}
```

### 3. Factory 模式

创建复杂对象：

```typescript
class UserFactory {
  static createAdmin(name: string, email: string): User {
    return {
      name,
      email,
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      createdAt: new Date(),
    };
  }

  static createRegularUser(name: string, email: string): User {
    return {
      name,
      email,
      role: 'user',
      permissions: ['read'],
      createdAt: new Date(),
    };
  }
}
```

## 数据流

### API 请求流程

```
1. Client Request
   ↓
2. API Gateway (路由、认证)
   ↓
3. Controller (参数验证、调用 Service)
   ↓
4. Service (业务逻辑)
   ↓
5. Repository (数据访问)
   ↓
6. Database
   ↓
7. Response (序列化、错误处理)
   ↓
8. Client Response
```

### 错误处理流程

```
Error Occurred
   ↓
Service Layer throws CustomError
   ↓
Controller catches error
   ↓
Error Middleware processes error
   ↓
Returns formatted error response
```

## 安全考虑

### 1. 认证和授权

- 使用 JWT 进行身份认证
- 实现基于角色的访问控制（RBAC）
- 使用中间件验证权限

### 2. 数据验证

- 输入验证：使用 Zod 或 class-validator
- SQL 注入防护：使用参数化查询
- XSS 防护：转义输出

### 3. 敏感数据

- 密码使用 bcrypt 哈希
- 环境变量存储敏感配置
- 不在日志中记录敏感信息

## 性能优化

### 1. 数据库优化

- 使用索引加速查询
- 避免 N+1 查询问题
- 使用连接池

### 2. 缓存策略

- 使用 Redis 缓存热点数据
- 实现缓存失效策略
- 使用 CDN 缓存静态资源

### 3. 代码优化

- 避免不必要的计算
- 使用适当的数据结构
- 异步处理耗时操作

## 扩展性

### 水平扩展

- 无状态服务设计
- 使用负载均衡
- 数据库读写分离

### 垂直扩展

- 优化数据库查询
- 使用缓存减少数据库压力
- 代码性能优化

## 监控和日志

### 日志

- 结构化日志（JSON 格式）
- 日志级别：debug、info、warn、error
- 集中式日志收集

### 监控

- 应用性能监控（APM）
- 错误追踪
- 资源使用监控

## 部署架构

### 开发环境

```
Local Machine
  ├── Node.js
  ├── PostgreSQL (Docker)
  └── Redis (Docker)
```

### 生产环境

```
Load Balancer
  ├── App Server 1
  ├── App Server 2
  └── App Server N
      ↓
  Database (Primary + Replicas)
  Redis Cluster
```

## 技术决策记录

### 决策 1：选择 TypeScript

**日期**：2024-01-01  
**决策**：使用 TypeScript 而非 JavaScript  
**原因**：
- 类型安全提高代码质量
- 更好的 IDE 支持
- 减少运行时错误

**影响**：
- 需要编译步骤
- 学习曲线

### 决策 2：使用 Repository 模式

**日期**：2024-01-05  
**决策**：使用 Repository 模式抽象数据访问  
**原因**：
- 提高可测试性
- 便于切换数据源
- 业务逻辑与数据访问分离

**影响**：
- 增加代码量
- 需要更多抽象层

## 未来规划

### 短期（1-3 个月）
- 实现完整的认证系统
- 添加 API 文档（Swagger）
- 完善测试覆盖

### 中期（3-6 个月）
- 实现微服务架构
- 添加消息队列
- 实现分布式追踪

### 长期（6-12 个月）
- 迁移到云原生架构
- 实现服务网格
- 添加 AI 功能
