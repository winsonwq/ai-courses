import { getWeatherTool } from "./getWeather.js";
import { getWeatherSSETool } from "./getWeatherSSE.js";

// 导出所有工具
export const tools = [
  getWeatherTool,
  getWeatherSSETool
];
