import { z } from "zod";

const mockWeatherData = {
  "成都": {
    city: "成都",
    temperature: 22,
    condition: "多云",
    humidity: 65,
    windSpeed: "5 km/h",
    pressure: "1013 hPa",
    visibility: "10 km"
  },
  "北京": {
    city: "北京",
    temperature: 15,
    condition: "晴",
    humidity: 45,
    windSpeed: "8 km/h",
    pressure: "1020 hPa",
    visibility: "15 km"
  }
};

const SUPPORTED_CITIES = Object.keys(mockWeatherData);

/**
 * getWeatherSSE 工具 - 使用 SSE 多次推送天气结果
 * 展示 SSE 的主动推送特性，分步骤推送天气信息的各个部分
 */
export const getWeatherSSETool = {
  name: "getWeatherSSE",
  definition: {
    title: "Get Weather (SSE)",
    description: "获取指定城市的天气信息，通过 SSE 分多次推送结果。支持的城市：成都、北京。此工具展示 SSE 的主动推送特性。",
    inputSchema: {
      city: z.string().min(1).describe("城市名称")
    }
  },
  handler: async (args, extra) => {
    const { city } = args;
    const server = extra?.server;
    const sessionId = extra?.sessionId;
    const transport = extra?.transport;

    console.log(`[getWeatherSSE] 工具被调用，city: ${city}, sessionId: ${sessionId}, hasTransport: ${!!transport}`);
    console.log(`[getWeatherSSE] transport 详情:`, {
      hasTransport: !!transport,
      transportType: transport?.constructor?.name,
      sessionId: transport?.sessionId,
      hasSendMethod: typeof transport?.send === 'function'
    });

    if (!server || !sessionId) {
      return {
        content: [{
          type: "text",
          text: "错误：此工具需要 SSE 连接才能工作"
        }],
        isError: true
      };
    }

    if (!transport) {
      console.error(`[getWeatherSSE] 警告：没有 transport，消息可能无法推送`);
    }

    // 辅助函数：发送日志消息
    // 使用 server.sendLoggingMessage() 方法，它会自动路由到正确的 session
    const sendMessage = async (level, data) => {
      const message = { level, data };
      
      console.log(`[getWeatherSSE] 准备发送消息: ${data.substring(0, 50)}..., sessionId: ${sessionId}`);
      
      if (!server || !sessionId) {
        console.error(`[getWeatherSSE] 错误：缺少 server 或 sessionId`);
        return;
      }
      
      try {
        // 使用 server.sendLoggingMessage() 方法
        // 这个方法会自动找到对应 session 的 transport 并发送消息
        await server.sendLoggingMessage(message, sessionId);
        console.log(`[getWeatherSSE] ✅ 消息发送成功: ${data.substring(0, 30)}...`);
      } catch (error) {
        console.error(`[getWeatherSSE] ❌ 消息发送失败:`, error);
        console.error(`[getWeatherSSE] 错误类型: ${error.constructor.name}`);
        console.error(`[getWeatherSSE] 错误消息: ${error.message}`);
        if (error.stack) {
          console.error(`[getWeatherSSE] 错误堆栈:`, error.stack);
        }
      }
    };

    // 验证城市
    if (!SUPPORTED_CITIES.includes(city)) {
      try {
        await sendMessage('error', `❌ 不支持的城市 "${city}"。目前支持的城市：${SUPPORTED_CITIES.join("、")}`);
      } catch (error) {
        // 忽略推送失败
      }
      
      return {
        content: [{
          type: "text",
          text: `错误：不支持的城市 "${city}"。目前支持的城市：${SUPPORTED_CITIES.join("、")}`
        }],
        isError: true
      };
    }

    const weather = mockWeatherData[city];

    // 测试 transport 是否可用（在异步推送之前立即测试）
    if (transport) {
      try {
        console.log(`[getWeatherSSE] 测试 transport.send() 是否可用...`);
        const testMessage = {
          jsonrpc: '2.0',
          method: 'notifications/message',
          params: {
            level: 'info',
            data: '🔔 测试消息：transport 可用，准备开始推送天气信息'
          }
        };
        await transport.send(testMessage);
        console.log(`[getWeatherSSE] transport.send() 测试成功 - 消息已发送`);
      } catch (error) {
        console.error(`[getWeatherSSE] transport.send() 测试失败:`, error);
        console.error(`[getWeatherSSE] 错误类型: ${error.constructor.name}, 消息: ${error.message}`);
      }
    } else {
      console.warn(`[getWeatherSSE] 没有 transport，无法发送测试消息`);
    }

    // 异步推送天气信息的各个部分（展示 SSE 主动推送特性）
    (async () => {
      try {
        console.log(`[getWeatherSSE] 开始推送天气信息，sessionId: ${sessionId}, hasTransport: ${!!transport}`);
        
        // 步骤 1: 推送开始查询消息
        console.log(`[getWeatherSSE] 推送步骤 1: 开始查询消息`);
        await sendMessage('info', `🌤️ 开始查询 ${city} 的天气信息...`);
        console.log(`[getWeatherSSE] 步骤 1 推送完成`);

        await new Promise(resolve => setTimeout(resolve, 500));

        // 步骤 2: 推送城市信息
        console.log(`[getWeatherSSE] 推送步骤 2: 城市信息`);
        await sendMessage('info', `📍 城市: ${weather.city}`);
        console.log(`[getWeatherSSE] 步骤 2 推送完成`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // 步骤 3: 推送温度信息
        await sendMessage('info', `🌡️ 温度: ${weather.temperature}°C`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // 步骤 4: 推送天气状况
        await sendMessage('info', `☁️ 天气状况: ${weather.condition}`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // 步骤 5: 推送湿度信息
        await sendMessage('info', `💧 湿度: ${weather.humidity}%`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // 步骤 6: 推送风速信息
        await sendMessage('info', `💨 风速: ${weather.windSpeed}`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // 步骤 7: 推送气压信息
        await sendMessage('info', `📊 气压: ${weather.pressure}`);

        await new Promise(resolve => setTimeout(resolve, 600));

        // 步骤 8: 推送能见度信息
        await sendMessage('info', `👁️ 能见度: ${weather.visibility}`);

        await new Promise(resolve => setTimeout(resolve, 500));

        // 步骤 9: 推送完成消息和完整数据
        await sendMessage('info', `✅ ${city} 的天气信息查询完成！`);

        await sendMessage('info', `📋 完整数据: ${JSON.stringify({
          city: weather.city,
          temperature: `${weather.temperature}°C`,
          condition: weather.condition,
          humidity: `${weather.humidity}%`,
          windSpeed: weather.windSpeed,
          pressure: weather.pressure,
          visibility: weather.visibility,
          timestamp: new Date().toISOString()
        }, null, 2)}`);

      } catch (error) {
        console.error(`[getWeatherSSE] 推送天气信息失败 (sessionId: ${sessionId}):`, error);
        console.error(`[getWeatherSSE] 错误堆栈:`, error.stack);
        try {
          await server.sendLoggingMessage({
            level: 'error',
            data: `❌ 推送天气信息时出错: ${error.message}`
          }, sessionId);
        } catch (pushError) {
          console.error(`[getWeatherSSE] 推送错误消息也失败:`, pushError);
        }
      }
    })();

    // 立即返回初始响应（实际数据通过 SSE 推送）
    return {
      content: [{
        type: "text",
        text: `正在通过 SSE 推送 ${city} 的天气信息，请查看实时推送的消息...\n\n天气信息将分步骤推送：\n1. 城市信息\n2. 温度\n3. 天气状况\n4. 湿度\n5. 风速\n6. 气压\n7. 能见度\n8. 完整数据`
      }]
    };
  }
};
