import React, { useCallback } from 'react';

interface FileUploaderProps {
  label: string;
  accept: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  icon: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ label, accept, file, onFileSelect, icon }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center gap-3 h-40 group cursor-pointer
        ${file 
          ? 'border-emerald-500 bg-emerald-50/50' 
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
      />
      
      <div className={`text-3xl ${file ? 'text-emerald-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
        {icon}
      </div>
      
      <div className="text-center z-10 pointer-events-none">
        <p className={`font-medium ${file ? 'text-emerald-700' : 'text-slate-600'}`}>
          {file ? file.name : label}
        </p>
        {!file && (
          <p className="text-xs text-slate-400 mt-1">
            点击或拖拽文件至此处
          </p>
        )}
      </div>

      {file && (
        <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold z-10 pointer-events-none">
          已就绪
        </div>
      )}
    </div>
  );
};