'use client';

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Canvas as FabricCanvas } from 'fabric';

export type ToolType =
  | 'select'
  | 'highlight'
  | 'text'
  | 'draw'
  | 'rectangle'
  | 'eraser';

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getAnnotationsForExport: () => Map<number, object[]>;
}

interface Props {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  activeTool: ToolType;
  annotationColor: string;
  strokeWidth: number;
  onPageRendered?: () => void;
}

const PdfEditorCanvas = forwardRef<CanvasHandle, Props>(function PdfEditorCanvas(
  { pdfDoc, currentPage, zoom, activeTool, annotationColor, strokeWidth, onPageRendered },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricInstanceRef = useRef<FabricCanvas | null>(null);
  const annotationsMapRef = useRef<Map<number, string>>(new Map());
  const prevPageRef = useRef<number>(currentPage);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const canUndoRef = useRef(false);
  const canRedoRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawingObjRef = useRef<{ startX: number; startY: number; rect: any } | null>(null);

  // Save current annotations for a page
  const saveCurrentAnnotations = useCallback((page: number) => {
    const fc = fabricInstanceRef.current;
    if (!fc) return;
    const json = JSON.stringify(fc.toJSON());
    annotationsMapRef.current.set(page, json);
  }, []);

  // Push history state
  const pushHistory = useCallback(() => {
    if (isRestoringRef.current) return;
    const fc = fabricInstanceRef.current;
    if (!fc) return;
    const json = JSON.stringify(fc.toJSON());
    // Truncate any redo history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    canUndoRef.current = historyIndexRef.current > 0;
    canRedoRef.current = false;
  }, []);

  // Initialize fabric canvas
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const fabric = await import('fabric');
      if (cancelled || !fabricCanvasRef.current) return;
      if (fabricInstanceRef.current) {
        fabricInstanceRef.current.dispose();
      }
      const fc = new fabric.Canvas(fabricCanvasRef.current, {
        isDrawingMode: false,
        selection: true,
        width: 100,
        height: 100,
      });
      fabricInstanceRef.current = fc;

      // Track history
      const onModified = () => pushHistory();
      fc.on('object:added', onModified);
      fc.on('object:modified', onModified);
      fc.on('object:removed', onModified);

      // Initial history state
      pushHistory();
    };
    init();
    return () => {
      cancelled = true;
      if (fabricInstanceRef.current) {
        fabricInstanceRef.current.dispose();
        fabricInstanceRef.current = null;
      }
    };
  }, [pushHistory]);

  // Render PDF page
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!pdfCanvasRef.current) return;
      const page = await pdfDoc.getPage(currentPage);
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: zoom * dpr });
      const canvas = pdfCanvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      await page.render({ canvas, viewport }).promise;
      if (cancelled) return;

      // Resize fabric overlay to match
      const fc = fabricInstanceRef.current;
      if (fc) {
        const cssW = viewport.width / dpr;
        const cssH = viewport.height / dpr;
        fc.setDimensions({ width: cssW, height: cssH });

        // Restore annotations for this page
        const saved = annotationsMapRef.current.get(currentPage);
        if (saved) {
          isRestoringRef.current = true;
          await fc.loadFromJSON(saved);
          fc.renderAll();
          isRestoringRef.current = false;
        }

        // Reset history for page
        historyRef.current = [JSON.stringify(fc.toJSON())];
        historyIndexRef.current = 0;
        canUndoRef.current = false;
        canRedoRef.current = false;
      }

      onPageRendered?.();
    };

    // Save annotations of previous page before rendering new one
    if (prevPageRef.current !== currentPage) {
      saveCurrentAnnotations(prevPageRef.current);
      const fc = fabricInstanceRef.current;
      if (fc) {
        fc.clear();
      }
      prevPageRef.current = currentPage;
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, zoom, saveCurrentAnnotations, onPageRendered]);

  // Tool switching
  useEffect(() => {
    const fc = fabricInstanceRef.current;
    if (!fc) return;

    // Reset
    fc.isDrawingMode = false;
    fc.selection = true;
    fc.defaultCursor = 'default';
    fc.hoverCursor = 'move';
    fc.forEachObject((obj) => {
      obj.selectable = true;
      obj.evented = true;
    });

    // Clean up any previous rectangle-drawing handlers
    fc.off('mouse:down');
    fc.off('mouse:move');
    fc.off('mouse:up');

    const setupBrush = async (color: string, width: number) => {
      const { PencilBrush } = await import('fabric');
      const brush = new PencilBrush(fc);
      brush.color = color;
      brush.width = width;
      fc.freeDrawingBrush = brush;
    };

    if (activeTool === 'draw') {
      fc.isDrawingMode = true;
      setupBrush(annotationColor, strokeWidth);
    } else if (activeTool === 'highlight') {
      fc.isDrawingMode = true;
      setupBrush(annotationColor + '4D', strokeWidth * 6);
    } else if (activeTool === 'text') {
      fc.isDrawingMode = false;
      fc.selection = false;
      fc.defaultCursor = 'text';
      fc.hoverCursor = 'text';
      fc.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      const handler = async (opt: any) => {
        const fabric = await import('fabric');
        const pointer = fc.getScenePoint(opt.e);
        const text = new fabric.IText('文字', {
          left: pointer.x,
          top: pointer.y,
          fontSize: strokeWidth * 4 + 12,
          fill: annotationColor,
          fontFamily: 'sans-serif',
          editable: true,
        });
        fc.add(text);
        fc.setActiveObject(text);
        text.enterEditing();
        // Remove handler after placing one text
        fc.off('mouse:down', handler);
      };
      fc.on('mouse:down', handler);
    } else if (activeTool === 'rectangle') {
      fc.isDrawingMode = false;
      fc.selection = false;
      fc.defaultCursor = 'crosshair';
      fc.hoverCursor = 'crosshair';
      fc.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });

      fc.on('mouse:down', (opt: any) => {
        const pointer = fc.getScenePoint(opt.e);
        drawingObjRef.current = { startX: pointer.x, startY: pointer.y, rect: null };
      });

      fc.on('mouse:move', async (opt: any) => {
        if (!drawingObjRef.current) return;
        const pointer = fc.getScenePoint(opt.e);
        const { startX, startY } = drawingObjRef.current;
        const left = Math.min(startX, pointer.x);
        const top = Math.min(startY, pointer.y);
        const width = Math.abs(pointer.x - startX);
        const height = Math.abs(pointer.y - startY);

        if (!drawingObjRef.current.rect) {
          const fabric = await import('fabric');
          const rect = new fabric.Rect({
            left,
            top,
            width,
            height,
            fill: 'transparent',
            stroke: annotationColor,
            strokeWidth: strokeWidth,
            selectable: false,
            evented: false,
          });
          fc.add(rect);
          drawingObjRef.current.rect = rect;
        } else {
          drawingObjRef.current.rect.set({ left, top, width, height });
          fc.renderAll();
        }
      });

      fc.on('mouse:up', () => {
        if (drawingObjRef.current?.rect) {
          drawingObjRef.current.rect.set({ selectable: true, evented: true });
          fc.setActiveObject(drawingObjRef.current.rect);
          fc.renderAll();
        }
        drawingObjRef.current = null;
      });
    } else if (activeTool === 'eraser') {
      fc.isDrawingMode = false;
      fc.selection = false;
      fc.defaultCursor = 'not-allowed';
      fc.hoverCursor = 'not-allowed';
      fc.on('mouse:down', (opt: any) => {
        const target = fc.findTarget(opt.e) as any;
        if (target && target.type) {
          fc.remove(target as any);
          fc.renderAll();
        }
      });
    }
    // 'select' is the default — nothing extra needed
  }, [activeTool, annotationColor, strokeWidth]);

  // Expose undo/redo and annotation export
  useImperativeHandle(
    ref,
    () => ({
      get canUndo() {
        return canUndoRef.current;
      },
      get canRedo() {
        return canRedoRef.current;
      },
      undo() {
        const fc = fabricInstanceRef.current;
        if (!fc || historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        isRestoringRef.current = true;
        fc.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
          fc.renderAll();
          isRestoringRef.current = false;
          canUndoRef.current = historyIndexRef.current > 0;
          canRedoRef.current = historyIndexRef.current < historyRef.current.length - 1;
        });
      },
      redo() {
        const fc = fabricInstanceRef.current;
        if (!fc || historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current++;
        isRestoringRef.current = true;
        fc.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
          fc.renderAll();
          isRestoringRef.current = false;
          canUndoRef.current = historyIndexRef.current > 0;
          canRedoRef.current = historyIndexRef.current < historyRef.current.length - 1;
        });
      },
      getAnnotationsForExport() {
        // Save current page first
        saveCurrentAnnotations(currentPage);
        const result = new Map<number, object[]>();
        annotationsMapRef.current.forEach((json, page) => {
          try {
            const parsed = JSON.parse(json);
            if (parsed.objects && parsed.objects.length > 0) {
              result.set(page, parsed.objects);
            }
          } catch {
            // skip invalid
          }
        });
        return result;
      },
    }),
    [currentPage, saveCurrentAnnotations]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto flex items-start justify-center bg-bg-primary p-4"
    >
      <div className="relative shadow-2xl">
        <canvas ref={pdfCanvasRef} className="block" />
        <canvas
          ref={fabricCanvasRef}
          className="absolute top-0 left-0"
        />
      </div>
    </div>
  );
});

export default PdfEditorCanvas;
