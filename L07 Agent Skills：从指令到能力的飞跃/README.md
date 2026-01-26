# L07 Agent Skills：从指令到能力的飞跃

https://github.com/user-attachments/assets/81fdeba4-7365-454c-a4fd-2bcbd1edbcd6

[Agent_Skills_Standard.pdf](https://github.com/user-attachments/files/24860838/Agent_Skills_Standard.pdf)

本课程将深入探讨 AI Agent 的 **Skill（技能）** 体系。我们将从定义、加载机制、目录结构以及与 MCP 的关系等多个维度进行解构。

## 1. 什么是 Skill？

在 Agentic AI 的语境下，**Skill 是增强 Agent 能力的逻辑单元**。
如果说 Prompt 是 Agent 的“大脑指令”，MCP 是 Agent 的“外接手”，那么 Skill 就是 Agent 的**“肌肉记忆”和“专业套路”**。

- **本质**：Skill 是一组封装好的指令、脚本和知识参考，旨在解决特定领域的复杂问题。
- **形态**：在现代 IDE（如 Cursor, Claude Code, Antigravity）中，**Skill == Folder**。一个文件夹就是一个完整的技能包。

## 2. 核心机制：渐进式加载 (Progressive Loading)

为什么不把所有指令都塞进 System Prompt？
- **Token 限制**：LLM 的上下文窗口虽然在扩大（如 128K），但 System Prompt 过长会干扰模型对当前任务的注意力。
- **效率**：Agent 应该只在需要执行 Git 操作时才加载 Git 相关的指令。

**渐进式加载**意味着 Agent 会根据当前任务，动态地从绑定的 Skills 目录中检索并加载相关的 `SKILL.md` 内容到 System Message 中。

## 3. Skill 的目录结构

一个标准的 Skill 文件夹通常包含以下部分：

```text
skill_name/
├── SKILL.md      # 核心定义文件（包含 metadata: name, description）
├── scripts/      # 自动化脚本（Bash, Python, JS 等）
├── references/   # 知识库、最佳实践、规则文档
└── assets/       # 图片、模板等辅助资源
```

## 4. Skill 存放在哪里？

不同的工具对 Skills 的存放位置有不同的约定：
- **Cursor / Claude Code / Opencode**: `.claude/skills/`
- **Antigravity**: `.agent/skills/`
- **通用约定**: `AGENTS.md` 配置文件 + `.agent/skills/`

## 5. SKILL.md vs System Message

| 特性 | System Message | SKILL.md |
| :--- | :--- | :--- |
| **持久性** | 整个会话过程全局生效 | 按需加载，动态注入 |
| **定位** | 身份定义、基础规则 | 专业领域知识、具体执行逻辑 |
| **管理** | 通常在代码中写死或通过配置加载 | 模块化管理，易于复用和分享 |

**核心观点**：`SKILL.md` 的内容最终会成为 System Message 的一部分，但它是通过“自动发现”机制注入的，无需开发者手动拼接。

## 6. Skill 与 MCP 的关系

这是很多开发者困惑的点：
- **MCP (Model Context Protocol)**：提供的是**工具接口 (Tools)**。例如：读取文件、发起网络请求。
- **Skill**：提供的是**逻辑与封装 (Logic & Encapsulation)**。它是如何调用工具、处理异常、并遵循特定标准的集合。

> **比喻**：MCP 给了 Agent 一把手术刀（工具），而 Skill 则是“如何进行阑尾炎手术”的医学知识和操作规范（代码+逻辑）。

## 7. LLM 工作机制中的角色

在 Skill 执行过程中，涉及 LLM 的四种角色：
1. **System**: 包含全局规则 + 当前激活技能的 `SKILL.md`。
2. **User**: 用户的具体需求。
3. **Assistant**: AI 的思考过程和指令输出。
4. **Tool/Role**: 脚本执行的结果反馈给 AI。

---

## 示例演练

在本目录的 `examples/skills/` 下，我们提供了两个典型的 Skill 示例：

1.  **`git-history-analyzer`**: 包含 `scripts`，用于通过自动化脚本分析 Git 提交历史。
2.  **`ui-tester`**: 包含 `references`，用于基于项目 UI 规范进行自动化测试验证。
