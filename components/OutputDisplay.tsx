import React from 'react';

interface OutputDisplayProps {
  title: string;
  content: string;
  variant?: 'primary' | 'secondary';
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ title, content, variant = 'secondary' }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('内容已复制到剪贴板');
  };

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden flex flex-col h-full ${
      variant === 'primary' 
        ? 'border-blue-200 bg-white' 
        : 'border-slate-200 bg-slate-50'
    }`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        variant === 'primary' ? 'bg-blue-50/50' : 'bg-slate-100'
      }`}>
        <h3 className={`font-semibold ${
          variant === 'primary' ? 'text-blue-800' : 'text-slate-700'
        }`}>
          {title}
        </h3>
        <button 
          onClick={copyToClipboard}
          className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-white/80 active:bg-white transition-colors text-slate-600 border border-transparent hover:border-slate-200 hover:shadow-sm"
        >
          复制内容
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1 max-h-[600px]">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
          {content || <span className="text-slate-400 italic">等待生成结果...</span>}
        </pre>
      </div>
    </div>
  );
};