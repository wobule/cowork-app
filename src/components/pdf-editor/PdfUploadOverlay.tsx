'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface PdfUploadOverlayProps {
  onFileLoad: (file: File, data: ArrayBuffer) => void;
}

export default function PdfUploadOverlay({ onFileLoad }: PdfUploadOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') return;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onFileLoad(file, reader.result);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoad]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className="flex-1 flex items-center justify-center"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <button
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center gap-4 p-16 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-accent bg-accent/10'
            : 'border-border hover:border-text-tertiary'
        }`}
      >
        <Upload size={48} strokeWidth={1} className="text-text-tertiary" />
        <div className="text-center">
          <p className="text-[16px] text-text-primary font-medium">
            拖曳 PDF 檔案至此處
          </p>
          <p className="text-[13px] text-text-tertiary mt-1">
            或點擊選擇檔案
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
