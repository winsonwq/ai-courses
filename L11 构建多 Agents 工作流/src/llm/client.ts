import type { LLMRequest, LLMResponse, Message } from './types';

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not set');

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });
  return response.json() as Promise<LLMResponse>;
}

export async function runStep(messages: Message[], tools: unknown[]): Promise<Message> {
  const response = await callLLM({
    model: 'deepseek-chat',
    messages,
    tools,
  });
  return response.choices[0].message;
}
