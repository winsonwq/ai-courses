# GitHub Copilot 指令

这是 GitHub Copilot 的专用配置文件。Copilot 会自动识别并应用此文件中的指令。

## 项目上下文

这是一个 TypeScript 项目，使用 Node.js 运行时。项目遵循严格的编码规范和最佳实践。

## 编码风格

### TypeScript 规范
- 使用严格模式
- 所有函数必须有类型注解
- 禁止使用 `any`
- 优先使用 `interface` 而非 `type`（除非需要联合类型）

### 代码格式
- 2 个空格缩进
- 单引号
- 不使用分号
- 最大行长度 100 字符

### 命名约定
- 变量/函数：`camelCase`
- 类/接口：`PascalCase`
- 常量：`UPPER_SNAKE_CASE`

## 代码生成指南

### 函数编写
```typescript
/**
 * 函数功能描述
 * @param param - 参数说明
 * @returns 返回值说明
 */
async function example(param: string): Promise<Result> {
  try {
    // 实现
  } catch (error) {
    // 错误处理
  }
}
```

### 错误处理
- 所有异步函数必须包含 try-catch
- 使用自定义错误类型
- 错误信息包含上下文

### 测试编写
- 使用 Jest
- 测试文件：`*.test.ts`
- 遵循 AAA 模式（Arrange, Act, Assert）

## 项目结构

```
src/
├── api/          # API 路由
├── services/     # 业务逻辑
├── repositories/ # 数据访问
├── types/        # 类型定义
├── utils/        # 工具函数
└── __tests__/    # 测试文件
```

## 最佳实践

### 依赖注入
- 通过构造函数注入依赖
- 避免硬编码依赖

### 单一职责
- 每个函数只做一件事
- 类保持单一职责

### 代码复用
- 提取公共逻辑到工具函数
- 使用组合而非继承

## 特殊要求

### 安全性
- 验证所有输入
- 使用参数化查询防止 SQL 注入
- 不在日志中记录敏感信息

### 性能
- 避免不必要的计算
- 使用适当的数据结构
- 异步处理耗时操作

### 可维护性
- 代码清晰易读
- 添加必要的注释
- 遵循 DRY 原则

## 代码审查检查清单

生成代码时，确保：
- [ ] 有类型注解
- [ ] 有错误处理
- [ ] 有 JSDoc 注释（公共函数）
- [ ] 符合命名约定
- [ ] 没有硬编码值
- [ ] 代码格式正确

## 参考文档

详细规则请参考：
- `AGENTS.md` - 完整的 AI Agent 配置
- `docs/coding-standards.md` - 编码规范详细说明
- `docs/git-workflow.md` - Git 工作流
- `docs/testing-guidelines.md` - 测试指南
