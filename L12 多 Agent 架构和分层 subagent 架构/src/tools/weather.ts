import type { ToolSchema } from './types';

/** 已弃用：仅保留以兼容可能存在的 agents/weather 引用。项目已改用 file + translate agents。 */
export const workerWeatherTool: ToolSchema = {
  type: 'function',
  function: {
    name: 'getWeather',
    description: '获取指定城市的天气',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string', description: '城市名' } },
      required: ['city'],
    },
  },
};
