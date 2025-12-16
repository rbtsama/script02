import React, { useState, useEffect } from 'react';
import { generateScript } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { OutputDisplay } from './components/OutputDisplay';
import { UploadedFiles, ProcessingState, GenerationResult } from './types';
import { PROMPT_1 as DEFAULT_PROMPT_1, PROMPT_2 as DEFAULT_PROMPT_2 } from './constants';

const App: React.FC = () => {
  // Check for API Key at startup (injected by Vite at build time)
  const envApiKey = process.env.API_KEY;
  
  // State for user-provided settings
  const [modelId, setModelId] = useState<string>('gemini-3-pro-preview'); // Default to 3.0 Pro
  
  // Prompt Management State
  const [showPromptEditor, setShowPromptEditor] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  const [prompt1, setPrompt1] = useState<string>(DEFAULT_PROMPT_1);
  const [prompt2, setPrompt2] = useState<string>(DEFAULT_PROMPT_2);

  const [files, setFiles] = useState<UploadedFiles>({ pdf: null, video: null });
  const [state, setState] = useState<ProcessingState>({ status: 'idle' });
  const [result, setResult] = useState<GenerationResult>({ step1Output: '', step2Output: '' });

  // Load settings from local storage on mount
  useEffect(() => {
    const storedModel = localStorage.getItem('gemini_model_id');
    // Validate stored model is one of the allowed options, otherwise reset to default
    if (storedModel && (storedModel === 'gemini-3-pro-preview' || storedModel === 'gemini-2.5-flash')) {
      setModelId(storedModel);
    }
  }, []);

  // Show Guidance Screen if API Key is missing
  if (!envApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center animate-in fade-in zoom-in duration-300">
           <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <h2 className="text-xl font-bold text-slate-800 mb-3">未检测到 API Key</h2>
           <p className="text-slate-600 mb-6 leading-relaxed text-sm">
             为了提升安全性，API Key 现已通过环境变量进行统一管理。<br/>
             请根据您的部署环境，按照下方指南进行配置：
           </p>
           
           <div className="bg-slate-50 p-5 rounded-xl text-left text-sm text-slate-700 space-y-4 mb-8 border border-slate-200">
             <div className="flex gap-3">
               <div className="bg-black text-white px-2 py-0.5 rounded text-xs h-fit font-mono mt-0.5">Vercel</div>
               <div className="flex-1">
                 <p className="mb-1 font-medium">在部署设置中添加环境变量：</p>
                 <code className="block bg-slate-200 px-2 py-1.5 rounded text-slate-800 font-mono text-xs mb-1">Key: API_KEY</code>
                 <code className="block bg-slate-200 px-2 py-1.5 rounded text-slate-800 font-mono text-xs">Value: 您的 Gemini API Key</code>
                 <p className="text-xs text-slate-500 mt-1">*配置完成后请重新部署 (Redeploy) 才能生效。</p>
               </div>
             </div>
             
             <div className="h-px bg-slate-200 w-full"></div>

             <div className="flex gap-3">
               <div className="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs h-fit font-mono mt-0.5">本地</div>
               <div className="flex-1">
                  <p className="mb-1 font-medium">在根目录创建 <code className="bg-slate-200 px-1 rounded">.env</code> 文件并添加：</p>
                  <code className="block bg-slate-200 px-2 py-1.5 rounded text-slate-800 font-mono text-xs">API_KEY=您的Key</code>
               </div>
             </div>
           </div>
           
           <button 
             onClick={() => window.location.reload()} 
             className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
           >
             已配置，刷新页面
           </button>
           <p className="mt-4 text-xs text-slate-400">
            没有 Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">点击免费获取</a>
           </p>
        </div>
      </div>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (modelId.trim()) {
      localStorage.setItem('gemini_model_id', modelId.trim());
    }
    setShowSettings(false);
  };

  const resetPrompts = () => {
    if(confirm('确定要恢复默认提示词吗？')) {
      setPrompt1(DEFAULT_PROMPT_1);
      setPrompt2(DEFAULT_PROMPT_2);
    }
  };

  const handleGenerate = async () => {
    if (!files.pdf || !files.video) return;
    
    if (files.video.size > 50 * 1024 * 1024) {
       if(!confirm("视频文件较大 (>50MB)。浏览器端处理可能会变慢或崩溃，是否继续？")) {
         return;
       }
    }

    setState({ status: 'reading_files', message: '读取文件中...' });
    setResult({ step1Output: '', step2Output: '' });

    try {
      const output = await generateScript(
        files.pdf, 
        files.video, 
        (msg) => setState({ status: 'processing_step1', message: msg }),
        prompt1,
        prompt2,
        modelId // Pass the custom model ID
      );
      
      setResult({
        step1Output: output.step1,
        step2Output: output.step2
      });
      setState({ status: 'complete' });

    } catch (error: any) {
      setState({ status: 'error', message: error.message });
      
      // Handle Permission Denied (403) or Unauthorized (401)
      if (error.message?.includes('401') || error.message?.includes('403') || error.message?.toLowerCase().includes('permission')) {
         alert(`权限错误 (403/401)。\n\n当前使用的模型: ${modelId}\n\n请检查环境变量中的 API Key 是否有权访问该模型。`);
      }
    }
  };

  const isReady = files.pdf && files.video && state.status !== 'reading_files' && state.status !== 'processing_step1';
  const isProcessing = state.status === 'reading_files' || state.status === 'processing_step1';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </span>
                 系统设置
               </h3>
               <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Model Selection Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">模型选择 (Model)</label>
                <div className="relative">
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-mono bg-slate-50 appearance-none"
                  >
                    <option value="gemini-3-pro-preview">Gemini 3.0 Pro (gemini-3-pro-preview)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (gemini-2.5-flash)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  选择适合您任务的模型。
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prompt Editor Modal */}
      {showPromptEditor && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
               <div className="flex items-center gap-2">
                 <div className="bg-purple-100 p-1.5 rounded-md text-purple-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
                 <h3 className="font-bold text-lg text-slate-800">Prompt 提示词设置</h3>
               </div>
               <button onClick={() => setShowPromptEditor(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
               <div className="flex-1 p-6 flex flex-col min-h-0">
                  <label className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
                    第一步：视频分析与草稿
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Prompt 1</span>
                  </label>
                  <textarea 
                    className="flex-1 w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono text-xs leading-relaxed text-slate-600"
                    value={prompt1}
                    onChange={(e) => setPrompt1(e.target.value)}
                    placeholder="输入 Prompt 1..."
                  />
               </div>
               <div className="flex-1 p-6 flex flex-col min-h-0">
                  <label className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
                    第二步：营销润色
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Prompt 2</span>
                  </label>
                  <textarea 
                    className="flex-1 w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono text-xs leading-relaxed text-slate-600"
                    value={prompt2}
                    onChange={(e) => setPrompt2(e.target.value)}
                    placeholder="输入 Prompt 2..."
                  />
               </div>
            </div>

            <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-between items-center">
               <button 
                 onClick={resetPrompts}
                 className="text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
               >
                 恢复默认设置
               </button>
               <button 
                 onClick={() => setShowPromptEditor(false)}
                 className="bg-purple-600 text-white font-bold py-2 px-8 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
               >
                 保存并关闭
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              A
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              车辆营销口播稿生成器
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => setShowSettings(true)}
               className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all"
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
               系统设置
             </button>
             <button
               onClick={() => setShowPromptEditor(true)}
               className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-purple-200 transition-all"
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               提示词设置
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <FileUploader 
            label="上传配置单 (PDF)" 
            accept=".pdf"
            file={files.pdf}
            onFileSelect={(f) => setFiles(prev => ({ ...prev, pdf: f }))}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            }
          />
          <FileUploader 
            label="上传车辆视频" 
            accept="video/*"
            file={files.video}
            onFileSelect={(f) => setFiles(prev => ({ ...prev, video: f }))}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            }
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-center justify-center mb-12">
          <button
            onClick={handleGenerate}
            disabled={!isReady}
            className={`
              relative px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform
              ${isReady 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 hover:-translate-y-1 active:translate-y-0 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
            {isProcessing ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在生成中...
              </span>
            ) : (
              "一键生成口播稿"
            )}
          </button>
          
          {state.message && (
             <p className="mt-4 text-sm font-medium text-blue-600 animate-pulse bg-blue-50 px-3 py-1 rounded-full">
               {state.message}
             </p>
          )}
          
          {state.status === 'error' && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm max-w-2xl flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <strong>出错了：</strong> {state.message}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {(result.step1Output || result.step2Output) && (
          <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="h-[650px]">
              <OutputDisplay 
                title="中间过程：关键帧与分析" 
                content={result.step1Output} 
                variant="secondary"
              />
            </div>
            <div className="h-[650px]">
              <OutputDisplay 
                title="最终产出：营销口播稿" 
                content={result.step2Output} 
                variant="primary"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;