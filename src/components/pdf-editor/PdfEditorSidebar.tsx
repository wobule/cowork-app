'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface Props {
  pdfDoc: PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function PdfEditorSidebar({
  pdfDoc,
  totalPages,
  currentPage,
  onPageChange,
}: Props) {
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedRef = useRef<Set<number>>(new Set());

  const renderThumbnail = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      if (renderedRef.current.has(pageNum)) return;
      renderedRef.current.add(pageNum);
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
    },
    [pdfDoc]
  );

  const setCanvasRef = useCallback(
    (pageNum: number, el: HTMLCanvasElement | null) => {
      if (el) {
        canvasRefs.current.set(pageNum, el);
        renderThumbnail(pageNum, el);
      } else {
        canvasRefs.current.delete(pageNum);
      }
    },
    [renderThumbnail]
  );

  // Re-render all thumbnails when pdfDoc changes
  useEffect(() => {
    renderedRef.current.clear();
    canvasRefs.current.forEach((canvas, pageNum) => {
      renderThumbnail(pageNum, canvas);
    });
  }, [pdfDoc, renderThumbnail]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const el = document.getElementById(`thumb-${currentPage}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage]);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="w-[160px] flex-shrink-0 bg-bg-secondary border-r border-border overflow-y-auto">
      <div className="p-2 text-[12px] text-text-tertiary font-medium border-b border-border px-3">
        頁面
      </div>
      <div className="flex flex-col gap-2 p-2 items-center">
        {pages.map((num) => (
          <button
            key={num}
            id={`thumb-${num}`}
            onClick={() => onPageChange(num)}
            className={`group relative rounded-md overflow-hidden border-2 transition-colors cursor-pointer ${
              num === currentPage
                ? 'border-accent'
                : 'border-transparent hover:border-border'
            }`}
          >
            <canvas
              ref={(el) => setCanvasRef(num, el)}
              className="block max-w-[136px]"
            />
            <span className="absolute bottom-1 right-1 text-[10px] bg-bg-primary/80 text-text-secondary px-1 rounded">
              {num}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
