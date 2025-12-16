# 车辆营销口播稿生成器 (AutoScript AI)

基于 Google Gemini API 的智能视频营销文案生成工具。上传车辆配置单（PDF）和实拍视频，自动生成精准的短视频营销口播稿。

## 功能特点

- **双模态分析**：利用 Gemini 多模态能力，同时深入理解 PDF 文档参数与视频视觉内容。
- **两阶段生成工作流**：
  1. **关键帧分析**：自动提取视频关键节点，计算分镜时长，确保音画同步。
  2. **营销润色**：基于分析结果，生成自然口语化、带有营销钩子的口播文案。
- **高级模型支持**：专为 Gemini 3.0 Pro 和 Gemini 2.5 Pro 优化，支持长视频处理。
- **灵活配置**：支持自定义 API Key 和 Prompt 提示词，设置自动保存于本地。

## 部署说明 (Vercel)

本项目无需复杂的构建流程，可直接部署在 Vercel 上。

1. **准备代码**：将本仓库推送到您的 GitHub。
2. **导入项目**：在 Vercel Dashboard 中选择 "Import Project" 并导入本仓库。
3. **配置环境变量** (可选)：
   - 如果您有固定的 API Key 供所有用户使用，请在 Vercel 的 `Settings` -> `Environment Variables` 中添加：
     - Key: `API_KEY`
     - Value: `您的_Gemini_API_Key`
   - *注意：如果不配置，用户需要在网页端手动输入 Key。*
4. **部署**：点击 Deploy 即可。

## 本地使用

1. 克隆仓库：
   ```bash
   git clone git@github.com:rbtsama/script01.git
   ```
2. 确保您的环境支持运行 React 应用（本项目结构适配常见的 Web 容器或直接作为静态资源服务）。
3. 打开网页，进入右上方“系统设置”。
4. 输入您的 Google Gemini API Key。
5. 选择模型（默认为 `gemini-3-pro-preview`）。
6. 上传 PDF 和视频文件，点击“一键生成”。

## 技术栈

- **前端框架**: React 19
- **样式库**: Tailwind CSS
- **AI SDK**: Google GenAI SDK (@google/genai)
