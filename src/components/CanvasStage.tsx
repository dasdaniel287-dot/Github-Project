import React, { useEffect, useRef, useState, useCallback } from 'react';
import Konva from 'konva';
import { useEditorStore, DocumentSnapshot } from '../store/useEditorStore';
import { CanvasElement, TextElement } from '../types/canvas';

interface CanvasStageProps {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
}

interface SnapLine {
  orientation: 'V' | 'H';
  position: number;
}

const SNAP_THRESHOLD = 6;

export const CanvasStage: React.FC<CanvasStageProps> = ({ stageRef, containerRef }) => {
  const artboard = useEditorStore((s) => s.artboard);
  const elements = useEditorStore((s) => s.elements);
  const selectedId = useEditorStore((s) => s.selectedId);
  const toolMode = useEditorStore((s) => s.toolMode);
  const zoom = useEditorStore((s) => s.zoom);
  const pan = useEditorStore((s) => s.pan);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const isDarkTheme = useEditorStore((s) => s.isDarkTheme);

  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const updateElement = useEditorStore((s) => s.updateElement);
  const getSnapshot = useEditorStore((s) => s.getSnapshot);
  const commitSnapshot = useEditorStore((s) => s.commitSnapshot);

  const konvaContainerRef = useRef<HTMLDivElement | null>(null);
  const contentLayerRef = useRef<Konva.Layer | null>(null);
  const artboardGroupRef = useRef<Konva.Group | null>(null);
  const overlayLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const dragBeforeSnapRef = useRef<DocumentSnapshot | null>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Inline text editing state
  const [editingTextEl, setEditingTextEl] = useState<TextElement | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fit artboard in viewport on initial mount
  const fitToViewport = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const padding = 140;
    const availW = Math.max(200, rect.width - padding * 2);
    const availH = Math.max(200, rect.height - padding);
    const nextZoom = Math.min(availW / artboard.width, availH / artboard.height, 1);
    const clampedZoom = Math.max(0.15, Math.min(1.5, Number(nextZoom.toFixed(2))));

    const nextPanX = (rect.width - artboard.width * clampedZoom) / 2;
    const nextPanY = (rect.height - artboard.height * clampedZoom) / 2 + 12;

    setZoom(clampedZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [artboard.width, artboard.height, containerRef, setZoom, setPan]);

  useEffect(() => {
    fitToViewport();
    // Only auto-fit when artboard dimensions change significantly or on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artboard.width, artboard.height]);

  // Listen for custom fit event
  useEffect(() => {
    const handler = () => fitToViewport();
    window.addEventListener('canvasflow:fit', handler);
    return () => window.removeEventListener('canvasflow:fit', handler);
  }, [fitToViewport]);

  // Spacebar temporary pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !editingTextEl &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editingTextEl]);

  // Initialize Konva Stage once
  useEffect(() => {
    const host = konvaContainerRef.current;
    const container = containerRef.current;
    if (!host || !container) return;

    const rect = container.getBoundingClientRect();
    const stage = new Konva.Stage({
      container: host,
      width: rect.width || window.innerWidth,
      height: rect.height || window.innerHeight,
    });

    const contentLayer = new Konva.Layer();
    const artboardGroup = new Konva.Group({
      x: 0,
      y: 0,
      width: artboard.width,
      height: artboard.height,
    });
    contentLayer.add(artboardGroup);

    const overlayLayer = new Konva.Layer();
    const transformer = new Konva.Transformer({
      anchorSize: 9,
      anchorCornerRadius: 3,
      anchorStroke: '#6366F1',
      anchorFill: '#FFFFFF',
      anchorStrokeWidth: 1.5,
      borderStroke: '#6366F1',
      borderStrokeWidth: 1.5,
      rotateAnchorOffset: 24,
      rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
      rotationSnapTolerance: 5,
      keepRatio: false,
      boundBoxFunc: (oldBox, newBox) => {
        if (Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 2) {
          return oldBox;
        }
        return newBox;
      },
    });
    overlayLayer.add(transformer);

    stage.add(contentLayer);
    stage.add(overlayLayer);

    stageRef.current = stage;
    contentLayerRef.current = contentLayer;
    artboardGroupRef.current = artboardGroup;
    overlayLayerRef.current = overlayLayer;
    transformerRef.current = transformer;

    // Resize observer for responsive viewport
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          stage.width(width);
          stage.height(height);
          stage.batchDraw();
        }
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      stage.destroy();
      stageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync stage viewport scale & pan
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scale({ x: zoom, y: zoom });
    stage.position({ x: pan.x, y: pan.y });
    stage.batchDraw();
  }, [zoom, pan, stageRef]);

  // Draw snap guidelines helper
  const renderGuides = useCallback((lines: SnapLine[]) => {
    const overlay = overlayLayerRef.current;
    const stage = stageRef.current;
    if (!overlay || !stage) return;

    overlay.find('.snap-guide').forEach((n) => n.destroy());

    const currentScale = stage.scaleX() || 1;
    const strokeW = 1 / currentScale;

    lines.forEach((line) => {
      if (line.orientation === 'V') {
        overlay.add(
          new Konva.Line({
            name: 'snap-guide',
            points: [line.position, -2000, line.position, artboard.height + 2000],
            stroke: '#6366F1',
            strokeWidth: strokeW,
            dash: [4 / currentScale, 4 / currentScale],
            listening: false,
          })
        );
      } else {
        overlay.add(
          new Konva.Line({
            name: 'snap-guide',
            points: [-2000, line.position, artboard.width + 2000, line.position],
            stroke: '#6366F1',
            strokeWidth: strokeW,
            dash: [4 / currentScale, 4 / currentScale],
            listening: false,
          })
        );
      }
    });
    overlay.batchDraw();
  }, [artboard.width, artboard.height]);

  const clearGuides = useCallback(() => {
    const overlay = overlayLayerRef.current;
    if (!overlay) return;
    overlay.find('.snap-guide').forEach((n) => n.destroy());
    overlay.batchDraw();
  }, []);

  // Compute snap targets and apply snapping
  const computeSnapAndApply = useCallback(
    (node: Konva.Node, el: CanvasElement) => {
      if (!snapEnabled) return { x: node.x(), y: node.y() };

      const threshold = SNAP_THRESHOLD / Math.max(0.2, zoom);

      // Node bounding box in artboard space (note circle/star are centered, others top-left)
      const isCentered = el.type === 'circle' || el.type === 'star';
      const w = el.width;
      const h = el.height;
      const rawLeft = isCentered ? node.x() - w / 2 : node.x();
      const rawTop = isCentered ? node.y() - h / 2 : node.y();

      const xTargets: number[] = [0, artboard.width / 2, artboard.width];
      const yTargets: number[] = [0, artboard.height / 2, artboard.height];

      elements.forEach((other) => {
        if (other.id === el.id || !other.visible) return;
        xTargets.push(other.x, other.x + other.width / 2, other.x + other.width);
        yTargets.push(other.y, other.y + other.height / 2, other.y + other.height);
      });

      const nodeXEdges = [
        { offset: 0, val: rawLeft },
        { offset: w / 2, val: rawLeft + w / 2 },
        { offset: w, val: rawLeft + w },
      ];
      const nodeYEdges = [
        { offset: 0, val: rawTop },
        { offset: h / 2, val: rawTop + h / 2 },
        { offset: h, val: rawTop + h },
      ];

      let bestDx = Infinity;
      let snapLineX: number | null = null;
      let snappedLeft = rawLeft;

      for (const edge of nodeXEdges) {
        for (const target of xTargets) {
          const diff = Math.abs(edge.val - target);
          if (diff < threshold && diff < bestDx) {
            bestDx = diff;
            snapLineX = target;
            snappedLeft = target - edge.offset;
          }
        }
      }

      let bestDy = Infinity;
      let snapLineY: number | null = null;
      let snappedTop = rawTop;

      for (const edge of nodeYEdges) {
        for (const target of yTargets) {
          const diff = Math.abs(edge.val - target);
          if (diff < threshold && diff < bestDy) {
            bestDy = diff;
            snapLineY = target;
            snappedTop = target - edge.offset;
          }
        }
      }

      const activeLines: SnapLine[] = [];
      if (snapLineX !== null) activeLines.push({ orientation: 'V', position: snapLineX });
      if (snapLineY !== null) activeLines.push({ orientation: 'H', position: snapLineY });
      renderGuides(activeLines);

      const finalNodeX = isCentered ? snappedLeft + w / 2 : snappedLeft;
      const finalNodeY = isCentered ? snappedTop + h / 2 : snappedTop;
      node.x(finalNodeX);
      node.y(finalNodeY);

      return { x: snappedLeft, y: snappedTop };
    },
    [snapEnabled, zoom, artboard.width, artboard.height, elements, renderGuides]
  );

  // Sync elements & artboard onto Konva Layer
  useEffect(() => {
    const stage = stageRef.current;
    const contentLayer = contentLayerRef.current;
    const artboardGroup = artboardGroupRef.current;
    const transformer = transformerRef.current;
    if (!stage || !contentLayer || !artboardGroup || !transformer) return;

    const interactive = toolMode === 'select' && !isSpacePressed;

    // Clear previous artboard children
    artboardGroup.destroyChildren();
    artboardGroup.clip({
      x: 0,
      y: 0,
      width: artboard.width,
      height: artboard.height,
    });

    // Artboard shadow rect sits behind the clipped group in contentLayer
    contentLayer.find('.artboard-backdrop').forEach((n) => n.destroy());
    const backdrop = new Konva.Rect({
      name: 'artboard-backdrop',
      x: 0,
      y: 0,
      width: artboard.width,
      height: artboard.height,
      fill: artboard.backgroundColor,
      shadowColor: isDarkTheme ? 'rgba(0,0,0,0.65)' : 'rgba(15,23,42,0.16)',
      shadowBlur: 48,
      shadowOffsetY: 16,
      listening: true,
    });
    backdrop.on('mousedown tap', () => {
      if (interactive) {
        setSelectedId(null);
      }
    });
    contentLayer.add(backdrop);
    backdrop.moveToBottom();

    // Also click on empty stage deselects
    stage.off('mousedown.deselect tap.deselect');
    stage.on('mousedown.deselect tap.deselect', (e) => {
      if (e.target === stage && interactive) {
        setSelectedId(null);
      }
    });

    // Render each element in order
    elements.forEach((el) => {
      if (!el.visible) return;
      const isEditingThis = editingTextEl?.id === el.id;

      const commonShadow = el.shadowEnabled
        ? {
            shadowEnabled: true,
            shadowColor: el.shadowColor || '#000000',
            shadowBlur: el.shadowBlur ?? 24,
            shadowOffsetX: el.shadowOffsetX ?? 0,
            shadowOffsetY: el.shadowOffsetY ?? 10,
            shadowOpacity: 0.35,
          }
        : { shadowEnabled: false };

      let node: Konva.Node | null = null;

      if (el.type === 'rect') {
        node = new Konva.Rect({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          opacity: el.opacity,
          fill: el.fill,
          stroke: el.stroke === 'transparent' ? undefined : el.stroke,
          strokeWidth: el.stroke === 'transparent' ? 0 : el.strokeWidth,
          cornerRadius: el.cornerRadius,
          draggable: interactive && !el.locked,
          ...commonShadow,
        });
      } else if (el.type === 'circle') {
        node = new Konva.Ellipse({
          id: el.id,
          x: el.x + el.width / 2,
          y: el.y + el.height / 2,
          radiusX: Math.max(2, el.width / 2),
          radiusY: Math.max(2, el.height / 2),
          rotation: el.rotation,
          opacity: el.opacity,
          fill: el.fill,
          stroke: el.stroke === 'transparent' ? undefined : el.stroke,
          strokeWidth: el.stroke === 'transparent' ? 0 : el.strokeWidth,
          draggable: interactive && !el.locked,
          ...commonShadow,
        });
      } else if (el.type === 'star') {
        const outerR = Math.max(6, Math.min(el.width, el.height) / 2);
        node = new Konva.Star({
          id: el.id,
          x: el.x + el.width / 2,
          y: el.y + el.height / 2,
          numPoints: el.numPoints || 5,
          outerRadius: outerR,
          innerRadius: outerR * (el.innerRadiusRatio || 0.45),
          rotation: el.rotation,
          opacity: el.opacity,
          fill: el.fill,
          stroke: el.stroke === 'transparent' ? undefined : el.stroke,
          strokeWidth: el.stroke === 'transparent' ? 0 : el.strokeWidth,
          draggable: interactive && !el.locked,
          ...commonShadow,
        });
      } else if (el.type === 'line') {
        node = new Konva.Rect({
          id: el.id,
          x: el.x,
          y: el.y,
          width: Math.max(8, el.width),
          height: Math.max(2, el.strokeWidth),
          rotation: el.rotation,
          opacity: el.opacity,
          fill: el.stroke,
          cornerRadius: el.strokeWidth / 2,
          hitStrokeWidth: 16,
          draggable: interactive && !el.locked,
        });
      } else if (el.type === 'icon') {
        const group = new Konva.Group({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          opacity: el.opacity,
          draggable: interactive && !el.locked,
        });
        const hitRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: el.width,
          height: el.height,
          fill: 'rgba(0,0,0,0.001)',
        });
        const pathNode = new Konva.Path({
          data: el.pathData,
          scaleX: el.width / el.viewBoxSize,
          scaleY: el.height / el.viewBoxSize,
          fill: el.fill === 'transparent' ? undefined : el.fill,
          stroke: el.stroke,
          strokeWidth: el.strokeWidth,
          lineCap: 'round',
          lineJoin: 'round',
          ...commonShadow,
        });
        group.add(hitRect);
        group.add(pathNode);
        node = group;
      } else if (el.type === 'text') {
        const textNode = new Konva.Text({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          text: el.text,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          fontStyle: `${el.fontWeight} ${el.fontStyle || 'normal'}`.trim(),
          fill: el.fill,
          align: el.align,
          lineHeight: el.lineHeight || 1.2,
          letterSpacing: el.letterSpacing || 0,
          rotation: el.rotation,
          opacity: isEditingThis ? 0 : el.opacity,
          draggable: interactive && !el.locked && !isEditingThis,
          ...commonShadow,
        });
        textNode.on('dblclick dbltap', () => {
          if (el.locked) return;
          setEditingTextEl(el);
          setEditingValue(el.text);
        });
        node = textNode;
      } else if (el.type === 'image') {
        const imgGroup = new Konva.Group({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          opacity: el.opacity,
          draggable: interactive && !el.locked,
          clipFunc: (ctx) => {
            const r = Math.min(el.cornerRadius || 0, el.width / 2, el.height / 2);
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.arcTo(el.width, 0, el.width, el.height, r);
            ctx.arcTo(el.width, el.height, 0, el.height, r);
            ctx.arcTo(0, el.height, 0, 0, r);
            ctx.arcTo(0, 0, el.width, 0, r);
            ctx.closePath();
          },
        });

        const placeholder = new Konva.Rect({
          width: el.width,
          height: el.height,
          fill: '#1E293B',
        });
        imgGroup.add(placeholder);

        const cached = imageCacheRef.current.get(el.src);
        if (cached && cached.complete) {
          const kImg = new Konva.Image({
            image: cached,
            width: el.width,
            height: el.height,
          });
          imgGroup.add(kImg);
        } else {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imageCacheRef.current.set(el.src, img);
            const kImg = new Konva.Image({
              image: img,
              width: el.width,
              height: el.height,
            });
            imgGroup.add(kImg);
            contentLayer.batchDraw();
          };
          img.src = el.src;
        }
        node = imgGroup;
      }

      if (!node) return;

      node.on('mousedown tap', (e) => {
        if (!interactive) return;
        e.cancelBubble = true;
        setSelectedId(el.id);
      });

      node.on('dragstart', () => {
        dragBeforeSnapRef.current = getSnapshot();
        setSelectedId(el.id);
      });

      node.on('dragmove', () => {
        computeSnapAndApply(node!, el);
      });

      node.on('dragend', () => {
        clearGuides();
        const isCentered = el.type === 'circle' || el.type === 'star';
        const nextX = isCentered ? node!.x() - el.width / 2 : node!.x();
        const nextY = isCentered ? node!.y() - el.height / 2 : node!.y();
        updateElement(
          el.id,
          { x: Math.round(nextX), y: Math.round(nextY) },
          false
        );
        if (dragBeforeSnapRef.current) {
          commitSnapshot(dragBeforeSnapRef.current);
          dragBeforeSnapRef.current = null;
        }
      });

      node.on('transformstart', () => {
        dragBeforeSnapRef.current = getSnapshot();
      });

      node.on('transformend', () => {
        const scaleX = node!.scaleX();
        const scaleY = node!.scaleY();
        const nextRot = Math.round(node!.rotation());

        node!.scaleX(1);
        node!.scaleY(1);

        if (el.type === 'text') {
          const isVerticalScaled = Math.abs(scaleY - 1) > 0.02;
          const nextWidth = Math.max(40, Math.round(el.width * scaleX));
          const nextFontSize = isVerticalScaled
            ? Math.max(10, Math.round(el.fontSize * scaleY))
            : el.fontSize;
          updateElement(
            el.id,
            {
              x: Math.round(node!.x()),
              y: Math.round(node!.y()),
              width: nextWidth,
              fontSize: nextFontSize,
              height: Math.max(20, Math.round(node!.height() * scaleY)),
              rotation: nextRot,
            },
            false
          );
        } else if (el.type === 'circle' || el.type === 'star') {
          const nextW = Math.max(16, Math.round(el.width * scaleX));
          const nextH = Math.max(16, Math.round(el.height * scaleY));
          updateElement(
            el.id,
            {
              x: Math.round(node!.x() - nextW / 2),
              y: Math.round(node!.y() - nextH / 2),
              width: nextW,
              height: nextH,
              rotation: nextRot,
            },
            false
          );
        } else if (el.type === 'line') {
          const nextW = Math.max(16, Math.round(el.width * scaleX));
          const nextStrokeW = Math.max(1, Math.round(el.strokeWidth * scaleY));
          updateElement(
            el.id,
            {
              x: Math.round(node!.x()),
              y: Math.round(node!.y()),
              width: nextW,
              height: nextStrokeW,
              strokeWidth: nextStrokeW,
              rotation: nextRot,
            },
            false
          );
        } else {
          const nextW = Math.max(16, Math.round(el.width * scaleX));
          const nextH = Math.max(16, Math.round(el.height * scaleY));
          updateElement(
            el.id,
            {
              x: Math.round(node!.x()),
              y: Math.round(node!.y()),
              width: nextW,
              height: nextH,
              rotation: nextRot,
            },
            false
          );
        }

        if (dragBeforeSnapRef.current) {
          commitSnapshot(dragBeforeSnapRef.current);
          dragBeforeSnapRef.current = null;
        }
      });

      artboardGroup.add(node as Konva.Shape | Konva.Group);
    });

    // Attach transformer to selected node
    const selectedEl = elements.find((e) => e.id === selectedId);
    if (selectedEl && !selectedEl.locked && selectedEl.visible && !editingTextEl && interactive) {
      const targetNode = artboardGroup.findOne(`#${selectedId}`);
      if (targetNode) {
        if (selectedEl.type === 'text') {
          transformer.enabledAnchors([
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
          ]);
        } else if (selectedEl.type === 'line') {
          transformer.enabledAnchors(['middle-left', 'middle-right']);
        } else {
          transformer.enabledAnchors([
            'top-left',
            'top-center',
            'top-right',
            'middle-left',
            'middle-right',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]);
        }
        transformer.nodes([targetNode]);
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }

    contentLayer.batchDraw();
    overlayLayerRef.current?.batchDraw();
  }, [
    elements,
    artboard,
    selectedId,
    toolMode,
    isSpacePressed,
    isDarkTheme,
    editingTextEl,
    setSelectedId,
    updateElement,
    getSnapshot,
    commitSnapshot,
    computeSnapAndApply,
    clearGuides,
    stageRef,
  ]);

  // Focus inline textarea when opened
  useEffect(() => {
    if (editingTextEl && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextEl]);

  const commitInlineText = () => {
    if (!editingTextEl) return;
    if (editingValue !== editingTextEl.text) {
      updateElement(editingTextEl.id, { text: editingValue }, true);
    }
    setEditingTextEl(null);
  };

  // Mouse wheel zoom toward pointer + trackpad pan
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) === 0) {
      const rect = container.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const scaleBy = 1.07;
      const direction = e.deltaY > 0 ? -1 : 1;
      const nextZoom = Math.max(
        0.15,
        Math.min(3, direction > 0 ? zoom * scaleBy : zoom / scaleBy)
      );

      const mousePointTo = {
        x: (pointerX - pan.x) / zoom,
        y: (pointerY - pan.y) / zoom,
      };

      const nextPan = {
        x: pointerX - mousePointTo.x * nextZoom,
        y: pointerY - mousePointTo.y * nextZoom,
      };

      setZoom(Number(nextZoom.toFixed(3)));
      setPan(nextPan);
    } else {
      setPan({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  };

  // Workspace panning with Pan tool, Spacebar+drag, or Middle mouse button
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode === 'pan' || isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const cursorClass =
    isPanning
      ? 'cursor-grabbing'
      : toolMode === 'pan' || isSpacePressed
      ? 'cursor-grab'
      : 'cursor-default';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative h-full w-full overflow-hidden select-none ${
        isDarkTheme ? 'workspace-grid-dark' : 'workspace-grid-light'
      } ${cursorClass}`}
    >
      <div ref={konvaContainerRef} className="h-full w-full" />

      {/* Native inline text editor overlay when double-clicking a text layer */}
      {editingTextEl && (
        <textarea
          ref={textareaRef}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={commitInlineText}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingTextEl(null);
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              commitInlineText();
            }
          }}
          style={{
            position: 'absolute',
            left: `${pan.x + editingTextEl.x * zoom}px`,
            top: `${pan.y + editingTextEl.y * zoom}px`,
            width: `${Math.max(80, editingTextEl.width * zoom)}px`,
            minHeight: `${Math.max(40, editingTextEl.height * zoom)}px`,
            fontSize: `${editingTextEl.fontSize * zoom}px`,
            fontFamily: editingTextEl.fontFamily,
            fontWeight: editingTextEl.fontWeight,
            lineHeight: editingTextEl.lineHeight || 1.2,
            letterSpacing: `${(editingTextEl.letterSpacing || 0) * zoom}px`,
            color: editingTextEl.fill,
            textAlign: editingTextEl.align,
            transform: editingTextEl.rotation
              ? `rotate(${editingTextEl.rotation}deg)`
              : undefined,
            transformOrigin: 'top left',
          }}
          className="z-30 resize-none border border-indigo-500 bg-transparent p-0 outline-none overflow-hidden"
        />
      )}
    </div>
  );
};
