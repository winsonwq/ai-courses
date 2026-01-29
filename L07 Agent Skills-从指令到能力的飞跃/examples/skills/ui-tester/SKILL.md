---
name: ui_tester
description: 基于项目 UI 设计规范进行自动化代码审查和视觉一致性检查。
---

# Skill: UI Tester

该技能让 Agent 具备“设计师的眼睛”。它不仅检查代码逻辑，还参考 `references/ui_design_spec.md` 中的规范来检查：
1. 颜色值是否符合主题色（Theme Colors）。
2. 间距（Spacing）是否符合 8px 网格系统。
3. 字体（Typography）是否使用了正确的层级。

## 使用场景
1. 在 PR 审查阶段检查 UI 组件是否合规。
2. 生成新的页面模板。

## 参考资料
- `references/ui_design_spec.md`: 包含颜色、字体、阴影等设计 Token。
