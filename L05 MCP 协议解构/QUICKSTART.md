# 快速开始指南

## 📦 安装

```bash
npm install
```

## 🚀 运行示例

### 1. 协议分析器（推荐先运行）

这个示例展示了如何解析和理解 MCP 协议消息，包括课程作业的答案。

```bash
npm run example:analyzer
```

**输出示例：**
```
============================================================
📋 MCP 协议分析器
============================================================

📨 原始通信日志：
[Line 1] Client → Server
{
  "jsonrpc": "2.0",
  "method": "initialize",
  ...
}
...
```

### 2. 完整的 Client-Server 演示

这个示例展示了完整的 MCP 通信流程：握手、工具发现、工具执行。

```bash
npm run client
```

**输出示例：**
```
[Client] 🚀 启动 MCP Client
[Client] 📡 连接到 Server...
[Server] 🚀 Weather Server 启动
[Client] 🤝 开始握手...
[Client] ✅ Server 信息: WeatherServer v0.1.0
...
```

### 3. 交互式演示

允许你输入城市名称查询天气。

```bash
npm run demo
```

**使用示例：**
```
请输入城市名称: Beijing
✅ 北京 当前温度：15°C，天气：晴

请输入城市名称: Shanghai
✅ 上海 当前温度：18°C，天气：多云

请输入城市名称: exit
👋 再见！
```

## 📚 代码结构说明

### 核心文件

- `src/types/mcp.ts` - MCP 协议类型定义
- `src/server/weather-server.ts` - Weather Server 实现
- `src/server/index.ts` - Server 入口（Stdio）
- `src/client/stdio-client.ts` - Stdio Client 实现
- `src/client/index.ts` - Client 入口

### 示例文件

- `src/examples/protocol-analyzer.ts` - 协议分析器
- `src/examples/interactive-demo.ts` - 交互式演示

## 🔍 理解代码流程

### 1. Server 端流程

1. Server 启动，监听 `stdin`
2. 收到 `initialize` 请求，返回 Server 信息
3. 收到 `notifications/initialized` 通知，标记已初始化
4. 收到 `tools/list` 请求，返回工具列表
5. 收到 `tools/call` 请求，执行工具并返回结果

### 2. Client 端流程

1. Client 启动 Server 子进程
2. 发送 `initialize` 请求，建立连接
3. 发送 `notifications/initialized` 通知
4. 发送 `tools/list` 请求，获取工具列表
5. 发送 `tools/call` 请求，执行工具

## 🎯 关键概念

### JSON-RPC 消息格式

**请求（Request）：**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": { "name": "get_temperature", "arguments": { "city": "Beijing" } },
  "id": 1
}
```

**响应（Response）：**
```json
{
  "jsonrpc": "2.0",
  "result": { "content": [{ "type": "text", "text": "北京 15°C 晴" }] },
  "id": 1
}
```

**通知（Notification）：**
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

### 握手流程

1. Client → Server: `initialize`
2. Server → Client: `initialize result`
3. Client → Server: `notifications/initialized`

### 工具调用流程

1. Client → Server: `tools/list`
2. Server → Client: `tools list result`
3. Client → Server: `tools/call`
4. Server → Client: `tool call result`

## 🐛 调试技巧

### 查看详细日志

所有 Server 的日志输出到 `stderr`，Client 的日志输出到 `stdout`。

### 手动测试 Server

```bash
# 启动 Server
tsx src/server/index.ts

# 在另一个终端，手动发送 JSON-RPC 消息
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":0}' | tsx src/server/index.ts
```

## 📖 下一步

1. 阅读 `ARCHITECTURE.md` 了解架构图
2. 阅读 `README.md` 了解课程内容
3. 修改 `weather-server.ts` 添加新工具
4. 实现自己的 MCP Server

---

**最后更新**：2024-01-15
