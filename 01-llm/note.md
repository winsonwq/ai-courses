## AI 互动
### 请求
POST /api/v1/chat/completions
{
  "model": "deepseek-r1", // session 级别记忆
  "messages": [
    {
      "role": "user", // user, assistant, system, tool
      "content": "A"
    },
    {
      "role": "assistant",
      "content": "B"
    },
    {
      "role": "user", // user, assistant, system, tool
      "content": "talk about"
    },
    {
      "role": "assistant",
      "content": "A B"
    }
  ]
}
### 响应
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1715769600,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello, how can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 10,
    "total_tokens": 20
  }
}