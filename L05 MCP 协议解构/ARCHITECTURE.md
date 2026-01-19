# MCP 架构流程图

本文档包含 MCP 协议的架构图和通信流程图。

## 1. 核心架构图

```mermaid
graph TB
    subgraph "用户层"
        User[👤 用户]
    end

    subgraph "Host 宿主层"
        Host[Host<br/>Claude Desktop / Cursor / Web UI]
        LLM[🧠 LLM<br/>Claude / GPT-4]
    end

    subgraph "Client 客户端层"
        Client[MCP Client<br/>SDK / 协议实现]
    end

    subgraph "传输层"
        Stdio[Stdio<br/>标准输入输出]
        SSE[SSE over HTTP<br/>服务器推送事件]
    end

    subgraph "Server 服务端层"
        Server1[Weather Server<br/>天气服务]
        Server2[SQLite Server<br/>数据库服务]
        Server3[File Server<br/>文件服务]
    end

    User -->|输入 Prompt| Host
    Host -->|Function Call| LLM
    LLM -->|工具调用请求| Host
    Host -->|MCP 协议| Client
    Client -->|JSON-RPC| Stdio
    Client -->|JSON-RPC| SSE
    Stdio -->|本地进程| Server1
    SSE -->|HTTP 请求| Server2
    SSE -->|HTTP 请求| Server3
    Server1 -->|响应| Client
    Server2 -->|响应| Client
    Server3 -->|响应| Client
    Client -->|结果| Host
    Host -->|最终回复| User

    style Host fill:#e1f5ff
    style Client fill:#fff4e1
    style Server1 fill:#e8f5e9
    style Server2 fill:#e8f5e9
    style Server3 fill:#e8f5e9
    style LLM fill:#f3e5f5
```

## 2. 握手流程（Handshake）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    Note over C,S: 握手阶段（Handshake）

    C->>S: initialize<br/>{protocolVersion, capabilities, clientInfo}
    Note right of C: 告诉 Server 我的协议版本和能力

    S->>C: initialize result<br/>{protocolVersion, capabilities, serverInfo}
    Note left of S: 告诉 Client 我的协议版本和支持的能力

    C->>S: notifications/initialized
    Note right of C: 确认握手完成，可以开始正常通信

    Note over C,S: ✅ 握手完成，开始正常通信
```

## 3. 工具发现流程（Discovery）

```mermaid
sequenceDiagram
    participant H as Host
    participant C as Client
    participant S as Server
    participant L as LLM

    Note over H,L: 工具发现阶段（Discovery）

    H->>C: 请求可用工具列表
    C->>S: tools/list
    S->>C: tools list result<br/>{tools: [{name, description, inputSchema}]}
    C->>H: 返回工具列表

    Note over H,L: 将工具转换为 LLM 可理解的格式

    H->>L: 注入工具 Schema<br/>(Function Calling 格式)
    Note right of L: LLM 现在知道有哪些工具可用
```

## 4. 工具执行流程（Execution）

```mermaid
sequenceDiagram
    participant U as User
    participant H as Host
    participant L as LLM
    participant C as Client
    participant S as Server

    Note over U,S: 工具执行阶段（Execution）

    U->>H: 用户提问<br/>"北京天气怎么样？"
    H->>L: 发送 Prompt + 工具 Schema
    L->>H: Function Call<br/>{tool: "get_temperature", args: {city: "Beijing"}}

    Note over H: 将 Function Call 转换为 MCP 请求

    H->>C: 调用工具请求
    C->>S: tools/call<br/>{name: "get_temperature", arguments: {city: "Beijing"}}
    
    Note over S: 执行工具逻辑

    S->>C: tool call result<br/>{content: [{text: "北京 15°C 晴"}]}
    C->>H: 返回结果
    H->>L: 将结果注入上下文
    L->>H: 生成最终回复
    H->>U: "北京当前温度是 15°C，天气晴朗"
```

## 5. 完整通信流程（完整示例）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    Note over C,S: 阶段 1: 握手（Handshake）

    C->>S: initialize (id: 0)
    S->>C: initialize result (id: 0)
    C->>S: notifications/initialized

    Note over C,S: 阶段 2: 发现（Discovery）

    C->>S: tools/list (id: 1)
    S->>C: tools list result (id: 1)

    Note over C,S: 阶段 3: 执行（Execution）

    C->>S: tools/call (id: 2)<br/>{name: "get_temperature", arguments: {city: "Beijing"}}
    S->>C: tool call result (id: 2)<br/>{content: [{text: "北京 15°C 晴"}]}

    Note over C,S: 可以继续执行更多工具调用...
```

## 6. MCP vs Function Calling 对比

```mermaid
graph LR
    subgraph "Function Calling (LLM 能力)"
        FC1[LLM 看到工具 Schema]
        FC2[LLM 决定调用工具]
        FC3[LLM 生成 JSON 文本]
        FC1 --> FC2 --> FC3
    end

    subgraph "MCP (传输协议)"
        MCP1[发现工具]
        MCP2[路由请求]
        MCP3[执行工具]
        MCP4[返回结果]
        MCP1 --> MCP2 --> MCP3 --> MCP4
    end

    FC3 -.->|"需要 MCP 来执行"| MCP2

    style FC1 fill:#f3e5f5
    style FC2 fill:#f3e5f5
    style FC3 fill:#f3e5f5
    style MCP1 fill:#e1f5ff
    style MCP2 fill:#e1f5ff
    style MCP3 fill:#e1f5ff
    style MCP4 fill:#e1f5ff
```

## 7. Stdio vs SSE 传输对比

```mermaid
graph TB
    subgraph "Stdio 传输（本地）"
        C1[Client]
        P1[子进程]
        S1[Server]
        C1 -->|stdin| P1
        P1 -->|stdout| C1
        P1 -.->|"同一台机器"| S1
    end

    subgraph "SSE 传输（远程）"
        C2[Client]
        HTTP[HTTP POST]
        SSE[SSE Stream]
        S2[Server]
        C2 -->|HTTP POST| HTTP
        HTTP --> S2
        S2 -->|SSE| SSE
        SSE --> C2
        S2 -.->|"可以在地球另一端"| C2
    end

    style C1 fill:#fff4e1
    style S1 fill:#e8f5e9
    style C2 fill:#fff4e1
    style S2 fill:#e8f5e9
```

## 8. JSON-RPC 消息格式

```mermaid
graph TB
    subgraph "Request 请求"
        R1[jsonrpc: '2.0']
        R2[method: 'tools/call']
        R3[params: {...}]
        R4[id: 1]
        R1 --> R2 --> R3 --> R4
    end

    subgraph "Response 响应"
        RES1[jsonrpc: '2.0']
        RES2[result: {...}]
        RES3[id: 1]
        RES1 --> RES2 --> RES3
    end

    subgraph "Notification 通知"
        N1[jsonrpc: '2.0']
        N2[method: 'notifications/initialized']
        N3[无 id 字段]
        N1 --> N2 --> N3
    end

    style R1 fill:#e1f5ff
    style RES1 fill:#e8f5e9
    style N1 fill:#fff4e1
```

## 关键概念说明

### Host（宿主）
- **定义**：用户直接交互的程序
- **职责**：管理生命周期，聚合 Prompt 和工具，与 LLM 交互

### Client（客户端）
- **定义**：Host 内部的组件，实现 MCP 协议
- **职责**：维持与 Server 的连接，转换 Function Call 为 MCP 请求

### Server（服务端）
- **定义**：能力的提供者
- **职责**：暴露 Tools、Resources、Prompts

### 协议版本
- 当前版本：`2024-11-05`
- 采用日期格式，便于理解版本演进

### 传输方式
- **Stdio**：本地进程通信，零延迟，安全
- **SSE over HTTP**：远程服务，支持分布式部署

---

**最后更新**：2024-01-15
