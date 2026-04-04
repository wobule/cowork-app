'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import PdfUploadOverlay from '@/components/pdf-editor/PdfUploadOverlay';
import PdfEditorToolbar from '@/components/pdf-editor/PdfEditorToolbar';
import PdfEditorSidebar from '@/components/pdf-editor/PdfEditorSidebar';
import PdfEditorCanvas, {
  type ToolType,
  type CanvasHandle,
} from '@/components/pdf-editor/PdfEditorCanvas';

export default function PdfEditorPage() {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [annotationColor, setAnnotationColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF
  const loadPdf = useCallback(async (file: File, data: ArrayBuffer) => {
    setIsLoading(true);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      const doc = await pdfjs.getDocument({ data: data.slice(0) }).promise;
      setPdfDoc(doc);
      setPdfBytes(data);
      setFileName(file.name);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setZoom(1.0);
      setActiveTool('select');
    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('無法載入 PDF 檔案');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open file dialog
  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          loadPdf(file, reader.result);
        }
      };
      reader.readAsArrayBuffer(file);
      // Reset input so the same file can be re-opened
      e.target.value = '';
    },
    [loadPdf]
  );

  // Download PDF with annotations
  const handleDownload = useCallback(async () => {
    if (!pdfBytes || !canvasRef.current) return;
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfLibDoc = await PDFDocument.load(pdfBytes);
      const annotations = canvasRef.current.getAnnotationsForExport();

      annotations.forEach((objects, pageNum) => {
        const page = pdfLibDoc.getPage(pageNum - 1);
        const { height: pageHeight } = page.getSize();

        for (const obj of objects) {
          const o = obj as Record<string, unknown>;
          const type = o.type as string;

          // Parse color
          const parseColor = (c: string | undefined) => {
            if (!c) return rgb(1, 0, 0);
            const hex = c.replace('#', '').substring(0, 6);
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            return rgb(r, g, b);
          };

          if (type === 'rect') {
            const left = (o.left as number) || 0;
            const top = (o.top as number) || 0;
            const width = (o.width as number) || 0;
            const height = (o.height as number) || 0;
            const strokeColor = parseColor(o.stroke as string);
            const sw = (o.strokeWidth as number) || 1;

            page.drawRectangle({
              x: left,
              y: pageHeight - top - height,
              width,
              height,
              borderColor: strokeColor,
              borderWidth: sw,
            });
          } else if (type === 'i-text' || type === 'text' || type === 'textbox') {
            const left = (o.left as number) || 0;
            const top = (o.top as number) || 0;
            const text = (o.text as string) || '';
            const fontSize = (o.fontSize as number) || 16;
            const color = parseColor(o.fill as string);

            page.drawText(text, {
              x: left,
              y: pageHeight - top - fontSize,
              size: fontSize,
              color,
            });
          } else if (type === 'path') {
            // Freehand path - draw as lines between points
            const pathData = o.path as number[][][];
            const left = (o.left as number) || 0;
            const top = (o.top as number) || 0;
            const color = parseColor(o.stroke as string);
            const sw = (o.strokeWidth as number) || 1;
            const opacity = (o.opacity as number) ?? 1;

            if (pathData && Array.isArray(pathData)) {
              for (const segment of pathData) {
                for (let i = 0; i < segment.length - 1; i++) {
                  const p1 = segment[i];
                  const p2 = segment[i + 1];
                  if (p1.length >= 2 && p2.length >= 2) {
                    page.drawLine({
                      start: {
                        x: left + p1[0],
                        y: pageHeight - (top + p1[1]),
                      },
                      end: {
                        x: left + p2[0],
                        y: pageHeight - (top + p2[1]),
                      },
                      thickness: sw,
                      color,
                      opacity,
                    });
                  }
                }
              }
            }
          }
        }
      });

      const modifiedBytes = await pdfLibDoc.save();
      const blob = new Blob([modifiedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.pdf', '') + '_edited.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('匯出 PDF 失敗');
    }
  }, [pdfBytes, fileName]);

  // Fit width
  const handleFitWidth = useCallback(() => {
    // Approximate: set zoom so page fills available width
    setZoom(1.2);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          canvasRef.current?.undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          canvasRef.current?.redo();
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Fabric handles its own delete when text is being edited
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Periodically sync undo/redo state from canvas
  const onPageRendered = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.canUndo);
      setCanRedo(canvasRef.current.canRedo);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Toolbar - always visible */}
      <PdfEditorToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        activeTool={activeTool}
        sidebarOpen={sidebarOpen}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenFile={handleOpenFile}
        onDownload={handleDownload}
        onPageChange={setCurrentPage}
        onZoomChange={setZoom}
        onFitWidth={handleFitWidth}
        onToolChange={setActiveTool}
        onUndo={() => {
          canvasRef.current?.undo();
          setTimeout(onPageRendered, 50);
        }}
        onRedo={() => {
          canvasRef.current?.redo();
          setTimeout(onPageRendered, 50);
        }}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        annotationColor={annotationColor}
        onColorChange={setAnnotationColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/80">
            <div className="text-text-secondary text-[14px]">載入中...</div>
          </div>
        )}

        {pdfDoc ? (
          <>
            {sidebarOpen && (
              <PdfEditorSidebar
                pdfDoc={pdfDoc}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}
            <PdfEditorCanvas
              ref={canvasRef}
              pdfDoc={pdfDoc}
              currentPage={currentPage}
              zoom={zoom}
              activeTool={activeTool}
              annotationColor={annotationColor}
              strokeWidth={strokeWidth}
              onPageRendered={onPageRendered}
            />
          </>
        ) : (
          <PdfUploadOverlay onFileLoad={loadPdf} />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-bg-secondary text-[11px] text-text-tertiary flex-shrink-0">
        <span>{fileName || 'PDF 編輯器'}</span>
        {pdfDoc && (
          <span>
            第 {currentPage} 頁，共 {totalPages} 頁 · {Math.round(zoom * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
