# L08 SKILL + Agent Browser 爬虫讲解

https://github.com/user-attachments/assets/778ec1f4-669b-4ec2-beb4-0c108b04bc30

本课程将带你回顾爬虫技术从“数据提取”到“AI 自主交互”的演进历程，并介绍如何通过 Skill 体系管理复杂的 Agent 浏览器能力。

---

## 1. 爬虫 1.0：HTTP 请求与 HTML 解析 (BeautifulSoup)

这是最传统的爬虫方式，适用于**服务端渲染 (SSR)** 的页面。

### 核心逻辑
1. **HTTP 请求**：使用 `requests` 或 `urllib` 发送 GET/POST 请求。
2. **分析 Response**：获取返回的 HTML 源码。
3. **DOM 爬取**：使用 `BeautifulSoup` 或 `lxml` 通过 CSS 选择器或 XPath 提取数据。

### 代码示例 (Python)
```python
import requests
from bs4 import BeautifulSoup

url = "https://example.com/news"
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# 爬取所有新闻标题
titles = [tag.get_text() for tag in soup.select('h2.title')]
```

### 局限性
- **无法处理 JS 渲染**：如果页面数据是异步加载的（CSR），返回的 HTML 往往是空的或者只有加载动画。
- **易被检测**：Headers 过于单一，缺乏真实的浏览器指纹。

---

## 2. 爬虫 2.0：浏览器自动化 (Selenium / Playwright)

随着单页应用 (SPA) 的流行，爬虫需要像真实用户一样“运行”浏览器。

### 核心技术：浏览器内核
- **Chromium / WebKit**：通过驱动程序（如 ChromeDriver）控制开源浏览器内核。
- **Headless Mode**：无头模式，在后台运行浏览器而不显示 UI。

### 核心功能
- **动作模拟**：截图 (`screenshot`)、点击 (`click`)、滚动手势 (`scroll`)。
- **等待机制**：相比 HTML 解析，这允许等待页面**全部加载完成**，不论是后端渲染还是前端异步请求的数据。

### 代码示例 (Python + Selenium)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/dynamic")

# 等待特定元素加载完成 (CSR 关键)
element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "content"))
)

driver.execute_script("window.scrollTo(0, document.body.scrollHeight);") # 滚动手势
driver.save_screenshot("page.png") # 截图
```

---

## 3. 爬虫 3.0：AI 自主决策 (Manus / Computer Use)

这是目前最前沿的阶段，Agent 不再依赖预设的脚本，而是根据屏幕内容**实时决策**。

### 核心特性
- **视觉理解**：Agent “看”浏览器的截图，识别输入框、按钮。
- **动态规划**：如果遇到弹窗，AI 会自主决定点击“关闭”而不是报错崩溃。
- **AI 助理模式**：在爬取过程中，Agent 会自动记录操作文档、整理提取到的非结构化数据。

> **代表性工具**：[Manus](https://manus.ai), Anthropic Computer Use, Browser-use.

---

## 4. Skill 体系：管理爬虫能力

在 Agent 开发中，我们不希望把复杂的爬虫逻辑写死在 System Prompt 中，而是通过 **Skill** 进行模块化管理。

### 4.1 skills.sh：AI 技能注册表
[skills.sh](https://skills.sh) 是一个专门为 AI Agent 设计的技能注册表。它将“过程性知识”（Procedural Knowledge）封装成可复用的模块。

- **核心理念**：通过一行命令为你的 Agent 增加专业能力。
- **安装方式**：使用 `npx skills-sh` 工具进行安装。

```bash
# 安装一个预设的技能 (以 Vercel React 最佳实践为例)
npx skills-sh install vercel-labs/agent-skills/vercel-react-best-practices

# 这会将技能下载到当前项目的技能目录中 (通常是 .agent/skills/)
```

### 4.2 为什么使用 skills.sh？
1. **可复用性**：无需为每个项目重新编写复杂的爬虫逻辑或 UI 规范。
2. **知识封装**：Skill 文件中包含了人类的最佳实践，Agent 加载后能立刻掌握该领域的“套路”。
3. **快速集成**：一行命令即可完成安装，就像 npm 管理依赖一样管理 AI 的能力。

### 4.3 区分不同工具的配置
不同的工具（如 WebDriver, Proxy, Account Session）需要不同的配置。

- **全局配置**：存放在 `.env` 或 `AGENTS.md`。
- **工具专用配置**：在 Skill 的目录下的 `config.json` 或 `settings.yaml` 中定义。
- **环境隔离**：确保 Agent 在使用 Selenium 时使用独立的 User Data Dir，避免干扰主浏览器。

### 4.4 Skill 结构示例
一个“高级爬虫 Skill”的典型结构：
```text
.agent/skills/advanced-scraper/
├── SKILL.md          # 告诉 Agent 如何使用本技能
├── scripts/
│   ├── browser_lib.py # 封装好的 Selenium/Playwright 操作
│   └── bypass_bot.js  # 反爬绕过脚本
└── references/
    └── selectors.json # 不同网站的常用 CSS 选择器
```

---

## 5. 总结

| 维度 | 爬虫 1.0 (BS4) | 爬虫 2.0 (Selenium) | 爬虫 3.0 (AI Agent) |
| :--- | :--- | :--- | :--- |
| **驱动方式** | 代码逻辑 (HTTP) | 驱动程序 (Control) | 模型推理 (Decision) |
| **渲染支持** | 仅 SSR | SSR + CSR | 全方位支持 |
| **复杂度** | 低 | 中 | 高 (需视觉模型) |
| **灵活性** | 极低（结构变了就挂） | 低（需人维护选择器） | 极高（AI 自适应页面） |
