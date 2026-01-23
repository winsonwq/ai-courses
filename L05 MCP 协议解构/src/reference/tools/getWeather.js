import { z } from "zod";

const mockWeatherData = {
  "成都": {
    city: "成都",
    temperature: 22,
    condition: "多云",
    humidity: 65
  },
  "北京": {
    city: "北京",
    temperature: 15,
    condition: "晴",
    humidity: 45
  }
};

const SUPPORTED_CITIES = Object.keys(mockWeatherData);

export const getWeatherTool = {
  name: "getWeather",
  definition: {
    title: "Get Weather",
    description: "获取指定城市的天气信息。支持的城市：成都、北京",
    inputSchema: {
      city: z.string().min(1)
    }
  },
  handler: async (args, extra) => {
    const { city } = args;
    const server = extra?.server;
    const sessionId = extra?.sessionId;

    // 如果服务器支持日志推送，发送进度消息（展示 SSE 主动推送）
    if (server && sessionId) {
      try {
        await server.sendLoggingMessage({
          level: 'info',
          data: `正在查询 ${city} 的天气信息...`
        }, sessionId);
      } catch (error) {
        // 忽略推送失败，不影响主要功能
      }
    }

    if (!SUPPORTED_CITIES.includes(city)) {
      return {
        content: [{
          type: "text",
          text: `错误：不支持的城市 "${city}"。目前支持的城市：${SUPPORTED_CITIES.join("、")}`
        }],
        isError: true
      };
    }

    // 模拟查询延迟，展示实时推送
    if (server && sessionId) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        await server.sendLoggingMessage({
          level: 'info',
          data: `已获取 ${city} 的天气数据，正在格式化...`
        }, sessionId);
      } catch (error) {
        // 忽略推送失败
      }
    }

    const weather = mockWeatherData[city];
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          city: weather.city,
          temperature: `${weather.temperature}°C`,
          condition: weather.condition,
          humidity: `${weather.humidity}%`,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
};
