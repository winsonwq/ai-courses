---
title: "OpenCode Agent 配置指南：从 JSON 到 Markdown 的完整实践"
summary: 详解 OpenCode 中 Agent 的两种配置方式（opencode.json 与 agents 目录下的 Markdown），逐项说明 mode、permission、steps、tools 等配置项的含义与用法，并澄清「目录 + AGENT.md」与「单文件 .md」在 UI 中的不同表现，推荐用 Markdown 方式便于分享与安装。
createdAt: 2026-02-04
updatedAt: 2026-02-04
---

# OpenCode Agent 配置指南：从 JSON 到 Markdown 的完整实践

OpenCode 的 [Agents 文档](https://opencode.ai/docs/agents/#create-agents) 给出了基本概念和若干示例，但配置项散落在多节、且对「如何在不同场景下生效」说得不多。实际使用时，你会遇到：`mode` 选 `primary`、`subagent` 还是 `all`？在 `~/.config/opencode/agents/` 下用**目录 + AGENT.md** 和**单文件 .md** 有什么区别？权限里的 `read`、`write`、`edit`、`bash`、`websearch` 如何与官方文档里的 `edit`、`bash`、`webfetch` 对应？

本文基于官方文档与实测，整理一份**可操作的配置清单**，并重点讲清 **mode** 与 **Markdown 目录/文件命名** 对界面和切换行为的影响。

## 1. 为什么需要自己配置 Agent？

内置的 **Build** 和 **Plan** 已经覆盖了「全功能开发」和「只分析不改代码」两种典型场景。但当你需要：

- 一个**既能在主界面用 Tab 切换、又能被 @ 召来干活**的「架构师」；
- 限制某类 Agent 的**最大步数**（控制成本）；
- 为某个 Agent 绑定**固定技能**（如 `skill-creator`）；
- 或希望把 Agent 定义**分享给团队/社区**，让人复制一份就能用；

就需要在全局或项目里**自定义 Agent**，并搞清楚每一项配置的含义。

## 2. 配置的两种入口

OpenCode 支持两种定义方式，**可以同时存在**（同名时具体优先级以官方/实测为准，通常项目级会覆盖全局）。

### 2.1 全局 / 项目 JSON：`opencode.json`

- **全局**：`~/.config/opencode/opencode.json`
- **项目**：项目根目录下的 `opencode.json`（或 `.opencode/` 下的配置，视版本而定）

所有自定义 Agent 写在顶层的 `agent` 对象里，每个 key 为 agent 标识符（如 `architect`），value 为配置对象。

### 2.2 Markdown 定义：`agents` 目录

- **全局**：`~/.config/opencode/agents/`
- **项目**：`.opencode/agents/`

两种写法会带来**不同的 UI 表现**（见第 4 节）：

- **单文件**：`architect.md` → 界面里出现名为 **Architect** 的 Agent，可直接用 Tab 或 @ 切换。
- **目录 + 固定文件名**：`architect/AGENT.md` → 界面里出现 **Architect/AGENT**（带路径层级），适合区分「同一角色下的不同变体」。

Markdown 文件顶部用 **YAML frontmatter** 写配置，字段与 `opencode.json` 里该 Agent 的字段一一对应（见下节）。

## 3. Agent 类型与 `mode` 详解

文档里把 Agent 分为 **primary**（主 Agent）和 **subagent**（子 Agent）。配置里的 `mode` 决定「这个 Agent 怎么被使用」。

| mode       | 含义 | Tab 切换 | @ 提及 | 被主 Agent 通过 Task 调用 |
|-----------|------|----------|--------|----------------------------|
| `primary` | 主对话 Agent | ✅ 出现在 Tab，可切换 | ✅ | - |
| `subagent` | 子 Agent | ❌ 不在 Tab | ✅ 可 @ | ✅ 可由 primary 调用 |
| `all`     | 两者兼有 | ✅ | ✅ | ✅（若支持） |

- **未写 `mode`** 时，文档说默认是 `all`，即同时具备「可 Tab 切换」和「可 @ 调用」的行为。
- 若你希望某个自定义 Agent **既能像 Build 一样在顶部 Tab 里选，又能被 @general 那样 @**，用 `"mode": "all"` 或省略 mode 即可。
- 若只想让它作为**仅被 @ 或仅被 Task 调用的专家**，用 `"mode": "subagent"`，并可用 `hidden: true` 把它从 @ 的自动补全里藏起来。

**和内置 Agent 的对应关系**：Build / Plan 是 `primary`，General / Explore 是 `subagent`；自定义的「架构师」「代码审查」等可按需选 `primary`、`subagent` 或 `all`。

## 4. Markdown 目录与文件命名对 UI 的影响

这是文档里没有明确写、但实测会直接影响界面的一点。

- 在 `~/.config/opencode/agents/` 下：
  - 使用 **`architect.md`**（单文件）  
    → 在 OpenCode 里会显示为 **Architect**，并且可以像 Build/Plan 一样在**顶部 Tab 切换**（当 `mode` 为 `primary` 或 `all` 时）。
  - 使用 **`architect/AGENT.md`**（目录 + 固定文件名）  
    → 会显示为 **Architect/AGENT**，名字带层级，适合用来区分例如「Architect/AGENT」「Architect/Review」等多变体。

因此：若你只想要一个叫「Architect」的 Agent 并希望它出现在 Tab 里，用 **`architect.md`** 更直观；若你要在「Architect」下挂多个子角色，再用 **`architect/xxx.md`** 的目录结构。

## 5. 配置项清单（与 JSON / YAML 对应）

下面按「常用度」和「文档完整度」列出可用的配置项；YAML 里写法与 JSON 一致（嵌套用缩进，列表用 `-`）。

### 5.1 必选 / 强烈建议

- **`description`**（string）  
  简短说明这个 Agent 做什么、何时用。主 Agent 用 Task 调用子 Agent 时会参考描述，**建议必填**。

### 5.2 类型与可见性

- **`mode`**：`primary` | `subagent` | `all`（见第 3 节）。
- **`hidden`**（boolean）  
  仅对 `subagent` 有效：为 `true` 时不会出现在 @ 的自动补全里，但仍可被主 Agent 通过 Task 调用。

### 5.3 模型与生成参数

- **`model`**（string）  
  如 `anthropic/claude-sonnet-4-20250514`。不写则主 Agent 用全局默认模型，子 Agent 用调用它的主 Agent 的模型。
- **`temperature`**（number，0–1）  
  越低越确定、越适合分析与规划；越高越发散。
- **`top_p`**（number，0–1）  
  与 temperature 二选一或搭配使用，控制采样范围。

### 5.4 步数与成本控制

- **`steps`**（number）  
  单轮对话内该 Agent 的**最大 agentic 步数**；达到后会被要求以总结+建议收尾。例如 `"steps": 200` 表示最多 200 步。  
  官方已弃用 `maxSteps`，请用 `steps`。

### 5.5 工具与权限

- **`tools`**（object）  
  键为工具名（如 `write`、`edit`、`bash`、或 MCP 的 `mymcp_*`），值为 `true`/`false`。Agent 级配置会覆盖全局的 `tools`。
- **`permission`**（object）  
  细粒度控制「是否允许 / 询问 / 拒绝」：
  - 顶层键：`read`、`edit`、`write`、`bash`、`websearch`（或文档中的 `webfetch`，以实际生效名为准）。
  - 值可以是：
    - `"allow"`：直接执行；
    - `"ask"`：执行前询问用户；
    - `"deny"`：禁止。
  - `bash` 可以写成对象，用 glob 按命令细分，例如：
    - `"*": "ask"`
    - `"git status *": "allow"`
    - `"git push": "ask"`
    规则顺序：**后匹配覆盖先匹配**，所以通常把 `*` 放前面，具体命令放后面。

你给出的示例里使用了 `read`、`edit`、`write`、`bash`、`websearch`，说明当前版本支持这些键；若文档只写 `edit`、`bash`、`webfetch`，可视为同一套权限体系的不同命名（以实际行为为准）。

### 5.6 子 Agent 调用权限（Task）

- **`permission.task`**（object）  
  仅对**主 Agent** 有意义：控制该主 Agent 能通过 Task 调用哪些 subagent。键为 subagent 名或 glob（如 `orchestrator-*`），值为 `allow` / `ask` / `deny`。设为 `deny` 时，该 subagent 不会出现在 Task 的工具描述里，模型就不会去调用它。

### 5.7 提示词与外观

- **`prompt`**（string）  
  系统提示词；可用 `{file:./prompts/xxx.txt}` 引用文件，路径相对当前配置文件所在目录。
- **`color`**（string）  
  UI 中的标识颜色：十六进制如 `#ff6b6b`，或主题色名如 `primary`、`accent`、`success` 等。
- **`disable`**（boolean）  
  设为 `true` 即禁用该 Agent。

### 5.8 技能与透传参数

- **`skills`**（array of string）  
  为该 Agent 绑定的技能 ID 列表，如 `["skill-creator"]`。
- 其他未在文档中列出的键，会**透传给底层模型/提供商**（如 `reasoningEffort`、`textVerbosity` 等），需查阅对应 provider 文档。

## 6. 完整示例：JSON 与 Markdown 对照

下面是一个「可 Tab 切换、可 @、带权限与步数限制」的架构师 Agent。

### 6.1 在 `opencode.json` 中配置

```json
{
  "agent": {
    "architect": {
      "description": "高级架构师与构建专家，擅长规划复杂系统并自动生成代码。",
      "mode": "all",
      "hidden": false,
      "permission": {
        "read": "allow",
        "edit": "ask",
        "write": "allow",
        "bash": "allow",
        "websearch": "allow"
      },
      "skills": ["skill-creator"],
      "steps": 200
    }
  }
}
```

### 6.2 用 Markdown 定义（便于分享与安装）

放在 `~/.config/opencode/agents/architect.md`（单文件，界面显示为 **Architect**）：

```markdown
---
description: 高级架构师与构建专家，擅长规划复杂系统并自动生成代码。
mode: all
hidden: false
permission:
  read: allow
  edit: ask
  write: allow
  bash: allow
  websearch: allow
skills:
  - skill-creator
steps: 200
---

你扮演高级架构师与构建专家。擅长从需求到架构、再到关键代码的完整规划与生成。
在修改代码前优先给出方案，必要时再动手写代码。
```

这样别人只要把 `architect.md` 拷贝到自己的 `agents/` 目录下即可使用，无需改 JSON，**文档式配置更利于分发和版本管理**。

## 7. 小结与建议

- **mode**：要能在 Tab 里切换选「主对话 Agent」用 `primary` 或 `all`；只要被 @ 或 Task 调用用 `subagent`；不写默认 `all`。
- **配置方式**：全局/项目 `opencode.json` 适合和现有配置一起管理；**Markdown 文件**更适合「一个 Agent 一个文件」、方便复制和分享。
- **agents 目录命名**：  
  - 单文件 `architect.md` → 界面名 **Architect**，可 Tab 切换；  
  - 目录 `architect/AGENT.md` → 界面名 **Architect/AGENT**，适合同一角色下多变体。
- 权限与工具：`permission` 与 `tools` 配合使用，先用 `tools` 关掉不需要的能力，再用 `permission` 做 ask/allow/deny 细控；步数用 `steps` 控制成本。

官方文档会随版本更新，若某选项在本文与文档中命名不一致（如 `webfetch` vs `websearch`），以你当前版本实际生效为准；有新选项出现时，可优先在 Markdown frontmatter 里试填，通常与 JSON 同构。

## 8. 参考资料

- [Agents | OpenCode — Configure and use specialized agents](https://opencode.ai/docs/agents/#create-agents)
- [Config | OpenCode](https://opencode.ai/docs/config/)（全局与项目配置）
- [Permissions | OpenCode](https://opencode.ai/docs/permissions/)
- [Tools | OpenCode](https://opencode.ai/docs/tools/)
