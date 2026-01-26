---
name: git_history_analyzer
description: 专门用于分析 Git 提交历史，识别项目的演进模式和潜在的风险提交。
---

# Skill: Git History Analyzer

该技能赋予 Agent 深度分析 Git 历史的能力。它通过调用底层的 `scripts/analyze_git.sh` 来获取统计数据，并结合 LLM 的逻辑进行解读。

## 使用场景
1. 追溯某个功能的修改历史。
2. 统计最近一周的开发热度。
3. 查找最常被修改的“脆弱”文件。

## 工作流程
1. 运行 `scripts/analyze_git.sh` 获取原始数据。
2. 将数据作为 context 读入。
3. AI 根据数据给出分析报告。
