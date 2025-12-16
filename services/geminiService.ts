import { GoogleGenAI } from "@google/genai";
import { PROMPT_1, PROMPT_2 } from '../constants';

const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateScript = async (
  pdfFile: File,
  videoFile: File,
  onStatusUpdate: (status: string) => void,
  customPrompt1?: string,
  customPrompt2?: string,
  modelId: string = "gemini-3-pro-preview"
): Promise<{ step1: string; step2: string }> => {
  
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key 缺失。请检查环境变量配置。");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use the modelId passed from the UI (defaults to gemini-3-pro-preview if not provided)
  const model = modelId;

  onStatusUpdate(`正在准备文件 (使用模型: ${model})...`);
  
  // 1. Prepare Inputs
  const pdfPart = await fileToPart(pdfFile);
  const videoPart = await fileToPart(videoFile);

  // 2. Execute Prompt 1 (Transition Script)
  onStatusUpdate("第一步：正在分析视频与文档... (可能需要一分钟)");
  
  const p1 = customPrompt1 || PROMPT_1;
  const p2 = customPrompt2 || PROMPT_2;

  try {
    const result1 = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: p1 },
            pdfPart,
            videoPart
          ]
        }
      ]
    });

    const step1Text = result1.text || "第一步未生成任何内容。";

    // 3. Execute Prompt 2 (Final Polish)
    onStatusUpdate("第二步：正在根据策略生成最终口播稿...");

    const result2 = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `这是基于视频和PDF生成的中间草稿:\n\n${step1Text}\n\n` },
            { text: p2 }
          ]
        }
      ]
    });

    const step2Text = result2.text || "第二步未生成任何内容。";

    return {
      step1: step1Text,
      step2: step2Text
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMessage = error.message || "生成过程中发生未知错误。";
    
    // Enrich error message for common issues
    if (errorMessage.includes("403")) {
      errorMessage += ` (权限不足：Key 可能无权访问 ${model})`;
    } else if (errorMessage.includes("404")) {
      errorMessage += ` (模型未找到：请检查模型名称 ${model} 是否正确)`;
    }
    
    throw new Error(errorMessage);
  }
};