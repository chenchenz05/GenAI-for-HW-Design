import { GoogleGenAI, Type } from "@google/genai";
import { HardwareConfig, PerformanceMetrics, HardwareDataPoint } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function predictPerformance(
  config: HardwareConfig,
  historicalData: HardwareDataPoint[]
): Promise<PerformanceMetrics> {
  const prompt = `
    You are an expert in Android hardware performance. 
    Predict the performance metrics for a new hardware configuration based on the provided historical data and your internal knowledge of mobile SOCs and device classes.

    New Configuration:
    - OEM: ${config.oem}
    - Board: ${config.board}
    - Platform: ${config.platform} (${config.platform_vendor})
    - Form Factor: ${config.form_factor}
    - RAM: ${config.ram_gb}GB
    - Storage: ${config.storage_gb}GB
    - CPU: ${config.cpu_name} (${config.num_cores} cores @ ${config.cpu_clock_speed}GHz, ${config.cpu_architecture})
    - GPU: ${config.gpu_model}
    - Display: ${config.screen_size}" @ ${config.pixel_size}
    - Features: Touchscreen=${config.has_touchscreen}, Stylus=${config.has_stylus}
    - Battery: ${config.battery_manufacturer}
    - Usage Pattern: ${config.usage_group}

    Historical Data (Learned from SQL Database):
    ${historicalData.length > 0 ? historicalData.slice(0, 15).map(d => `
      - [${d.oem} ${d.cpu_name}] Platform: ${d.platform}, RAM: ${d.ram_gb}GB, Form: ${d.form_factor}, Usage: ${d.usage_group}
        Result: Single-Core: ${d.singleCoreScore}, Multi-Core: ${d.multiCoreScore}, GPU: ${d.gpuScore}, Thermal: ${d.thermalThrottling}/10
    `).join('\n') : "No historical data available yet. Use your general knowledge."}

    Instructions:
    1. Analyze patterns across different hardware classes and Usage Patterns.
    2. Consider how the Usage Pattern (e.g., Gaming vs Office) affects performance metrics. Gaming might prioritize GPU and multi-core, while Office might prioritize app launch speed and thermal efficiency.
    3. Consider how Form Factor (Tablet vs Phone) affects thermal headroom and sustained performance.
    3. Evaluate the impact of Platform Vendor (Qualcomm, MediaTek, etc.) on driver efficiency and GPU performance.
    4. Predict realistic Geekbench-style scores and app launch metrics.
    5. Return the prediction in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          singleCoreScore: { type: Type.NUMBER },
          multiCoreScore: { type: Type.NUMBER },
          gpuScore: { type: Type.NUMBER },
          appLaunchSpeed: { type: Type.NUMBER, description: "1-10 scale" },
          thermalThrottling: { type: Type.NUMBER, description: "1-10 scale" },
        },
        required: ["singleCoreScore", "multiCoreScore", "gpuScore", "appLaunchSpeed", "thermalThrottling"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as PerformanceMetrics;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Prediction failed");
  }
}

export async function generateSyntheticData(): Promise<HardwareDataPoint[]> {
  const prompt = `
    Generate 5 realistic examples of Android hardware configurations and their performance metrics.
    Include a variety of tiers: flagship (e.g. Snapdragon 8 Gen 3), mid-range, and entry-level.
    Include different form factors like Foldables, Tablets, and standard Smartphones.
    Return as a JSON array of objects matching the HardwareDataPoint interface.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            oem: { type: Type.STRING },
            board: { type: Type.STRING },
            platform: { type: Type.STRING },
            platform_vendor: { type: Type.STRING },
            form_factor: { type: Type.STRING },
            ram_gb: { type: Type.NUMBER },
            storage_gb: { type: Type.NUMBER },
            num_cores: { type: Type.NUMBER },
            cpu_name: { type: Type.STRING },
            cpu_architecture: { type: Type.STRING },
            cpu_clock_speed: { type: Type.NUMBER },
            gpu_model: { type: Type.STRING },
            has_touchscreen: { type: Type.BOOLEAN },
            has_stylus: { type: Type.BOOLEAN },
            screen_size: { type: Type.NUMBER },
            pixel_size: { type: Type.STRING },
            battery_manufacturer: { type: Type.STRING },
            usage_group: { type: Type.STRING },
            singleCoreScore: { type: Type.NUMBER },
            multiCoreScore: { type: Type.NUMBER },
            gpuScore: { type: Type.NUMBER },
            appLaunchSpeed: { type: Type.NUMBER },
            thermalThrottling: { type: Type.NUMBER },
          },
          required: [
            "oem", "board", "platform", "platform_vendor", "form_factor", 
            "ram_gb", "storage_gb", "num_cores", "cpu_name", "cpu_architecture",
            "cpu_clock_speed", "gpu_model", "has_touchscreen", "has_stylus",
            "screen_size", "pixel_size", "battery_manufacturer", "usage_group",
            "singleCoreScore", "multiCoreScore", "gpuScore", "appLaunchSpeed", "thermalThrottling"
          ],
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((d: any) => ({ ...d, timestamp: new Date().toISOString() }));
  } catch (e) {
    console.error("Failed to parse synthetic data", e);
    return [];
  }
}
