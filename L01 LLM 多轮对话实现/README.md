# 01-LLM 多轮对话实现

## 课程概述

从 0 开始构建一个**命令行 AI 聊天工具**，掌握大语言模型 API 的核心概念。

### 你将学会
- LLM API 的基本调用方式
- 多轮对话的 history 记忆机制
- 不同角色（system/user/assistant）的意义
- stream vs 非stream 响应模式
- temperature 等核心参数调优

### 课程路线
```
第1关：发送你的第一个请求
第2关：理解消息角色（system/user/assistant）
第3关：实现多轮对话记忆
第4关：添加 streaming 实时响应
第5关：调参实验（temperature）
```

---

## 实战项目

完成一个可以记住对话历史的 CLI 聊天工具：

```bash
$ npx ts-node src/ai-chat.ts
🤖 You: 你好，我叫小明
👤 AI: 你好小明！很高兴认识你。有什么我可以帮你的吗？

🤖 You: 我叫什么名字？
👤 AI: 你叫小明呀！需要继续这个话题吗？

🤖 You: /exit
👋 再见！
```

