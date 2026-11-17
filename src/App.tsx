import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { useEditorStore } from './store/useEditorStore';
import { TopBar } from './components/TopBar';
import { FloatingDock } from './components/FloatingDock';
import { LayersPanel } from './components/LayersPanel';
import { CanvasStage } from './components/CanvasStage';
import { InspectorPanel } from './components/InspectorPanel';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ExportModal } from './components/ExportModal';
import { ViewportControls } from './components/ViewportControls';

export default function App() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedId = useEditorStore((s) => s.selectedId);
  const elements = useEditorStore((s) => s.elements);
  const isCommandBarOpen = useEditorStore((s) => s.isCommandBarOpen);
  const isExportModalOpen = useEditorStore((s) => s.isExportModalOpen);

  const setCommandBarOpen = useEditorStore((s) => s.setCommandBarOpen);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  // Sync dark mode class on initial mount
  useEffect(() => {
    const isDark = useEditorStore.getState().isDarkTheme;
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K always toggles Command Bar
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandBarOpen(!isCommandBarOpen);
        return;
      }

      // Cmd/Ctrl + 0 fits canvas to viewport
      if (mod && e.key === '0') {
        e.preventDefault();
        window.dispatchEvent(new Event('canvasflow:fit'));
        return;
      }

      if (isEditingField || isCommandBarOpen || isExportModalOpen) {
        return;
      }

      // Undo / Redo
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate
      if (mod && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
        return;
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
        return;
      }

      // Escape deselects
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }

      // Tool modes
      if (!mod && e.key.toLowerCase() === 'v') {
        setToolMode('select');
        return;
      }
      if (!mod && e.key.toLowerCase() === 'h') {
        setToolMode('pan');
        return;
      }

      // Arrow key nudging
      if (
        selectedId &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        const current = elements.find((el) => el.id === selectedId);
        if (!current || current.locked) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        updateElement(selectedId, {
          x: Math.round(current.x + dx),
          y: Math.round(current.y + dy),
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedId,
    elements,
    isCommandBarOpen,
    isExportModalOpen,
    setCommandBarOpen,
    setToolMode,
    setSelectedId,
    deleteElement,
    duplicateElement,
    updateElement,
    undo,
    redo,
  ]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#EEF0F4] dark:bg-[#0B0D12]">
      <CanvasStage stageRef={stageRef} containerRef={containerRef} />
      <TopBar />
      <FloatingDock />
      <LayersPanel />
      <InspectorPanel />
      <ViewportControls />
      <CommandPaletteModal />
      <ExportModal stageRef={stageRef} />
    </main>
  );
}
