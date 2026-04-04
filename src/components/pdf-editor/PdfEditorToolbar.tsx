'use client';

import {
  FolderOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomOut,
  ZoomIn,
  Maximize2,
  MousePointer2,
  Highlighter,
  Type,
  Pen,
  Square,
  Eraser,
  Undo2,
  Redo2,
  PanelLeft,
} from 'lucide-react';
import type { ToolType } from './PdfEditorCanvas';

interface Props {
  currentPage: number;
  totalPages: number;
  zoom: number;
  activeTool: ToolType;
  sidebarOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onOpenFile: () => void;
  onDownload: () => void;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSidebar: () => void;
  annotationColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (w: number) => void;
}

const TOOLS: { type: ToolType; icon: typeof MousePointer2; label: string }[] = [
  { type: 'select', icon: MousePointer2, label: '選取' },
  { type: 'highlight', icon: Highlighter, label: '螢光筆' },
  { type: 'text', icon: Type, label: '文字' },
  { type: 'draw', icon: Pen, label: '畫筆' },
  { type: 'rectangle', icon: Square, label: '矩形' },
  { type: 'eraser', icon: Eraser, label: '橡皮擦' },
];

const COLORS = [
  '#ef4444', '#f59e0b', '#34d399', '#4c8dff', '#6366f1', '#8b5cf6', '#ec4899', '#e8e8ed',
];

export default function PdfEditorToolbar({
  currentPage,
  totalPages,
  zoom,
  activeTool,
  sidebarOpen,
  canUndo,
  canRedo,
  onOpenFile,
  onDownload,
  onPageChange,
  onZoomChange,
  onFitWidth,
  onToolChange,
  onUndo,
  onRedo,
  onToggleSidebar,
  annotationColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
}: Props) {
  const btnBase =
    'p-2 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  const btnActive = 'bg-bg-active text-accent';

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-bg-secondary flex-shrink-0 flex-wrap">
      {/* Sidebar toggle */}
      <button
        className={`${btnBase} ${sidebarOpen ? btnActive : ''}`}
        onClick={onToggleSidebar}
        title="縮圖面板"
      >
        <PanelLeft size={16} strokeWidth={1.5} />
      </button>

      <Separator />

      {/* File */}
      <button className={btnBase} onClick={onOpenFile} title="開啟檔案">
        <FolderOpen size={16} strokeWidth={1.5} />
      </button>
      <button
        className={btnBase}
        onClick={onDownload}
        disabled={totalPages === 0}
        title="下載 PDF"
      >
        <Download size={16} strokeWidth={1.5} />
      </button>

      <Separator />

      {/* Page navigation */}
      <button
        className={btnBase}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        title="上一頁"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>
      <div className="flex items-center gap-1 text-[13px] text-text-secondary mx-1">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (v >= 1 && v <= totalPages) onPageChange(v);
          }}
          className="w-10 text-center bg-bg-tertiary border border-border-light rounded px-1 py-0.5 text-text-primary text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span>/ {totalPages}</span>
      </div>
      <button
        className={btnBase}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        title="下一頁"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>

      <Separator />

      {/* Zoom */}
      <button
        className={btnBase}
        onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
        title="縮小"
      >
        <ZoomOut size={16} strokeWidth={1.5} />
      </button>
      <span className="text-[13px] text-text-secondary w-12 text-center select-none">
        {Math.round(zoom * 100)}%
      </span>
      <button
        className={btnBase}
        onClick={() => onZoomChange(Math.min(5, zoom + 0.25))}
        title="放大"
      >
        <ZoomIn size={16} strokeWidth={1.5} />
      </button>
      <button className={btnBase} onClick={onFitWidth} title="適合寬度">
        <Maximize2 size={16} strokeWidth={1.5} />
      </button>

      <Separator />

      {/* Annotation tools */}
      {TOOLS.map((t) => (
        <button
          key={t.type}
          className={`${btnBase} ${activeTool === t.type ? btnActive : ''}`}
          onClick={() => onToolChange(t.type)}
          title={t.label}
        >
          <t.icon size={16} strokeWidth={1.5} />
        </button>
      ))}

      <Separator />

      {/* Color picker */}
      <div className="flex items-center gap-0.5">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`w-5 h-5 rounded-full border-2 transition-transform ${
              annotationColor === c ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
            title={c}
          />
        ))}
      </div>

      {/* Stroke width */}
      <select
        value={strokeWidth}
        onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
        className="ml-1 bg-bg-tertiary border border-border-light rounded px-1 py-0.5 text-[12px] text-text-secondary"
      >
        <option value={1}>1px</option>
        <option value={2}>2px</option>
        <option value={4}>4px</option>
        <option value={8}>8px</option>
      </select>

      <Separator />

      {/* Undo / Redo */}
      <button
        className={btnBase}
        onClick={onUndo}
        disabled={!canUndo}
        title="復原 (Ctrl+Z)"
      >
        <Undo2 size={16} strokeWidth={1.5} />
      </button>
      <button
        className={btnBase}
        onClick={onRedo}
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z)"
      >
        <Redo2 size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
