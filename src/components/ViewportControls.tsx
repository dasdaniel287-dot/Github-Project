import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Magnet, Keyboard } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

export const ViewportControls: React.FC = () => {
  const zoom = useEditorStore((s) => s.zoom);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setSnapEnabled = useEditorStore((s) => s.setSnapEnabled);

  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#13161E]/95">
      <button
        type="button"
        onClick={() => setZoom(Number((zoom - 0.1).toFixed(2)))}
        title="Zoom Out"
        aria-label="Zoom out"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('canvasflow:fit'))}
        title="Reset / Fit to Viewport (Ctrl+0)"
        className="font-mono-tabular min-w-[52px] rounded-lg px-2 py-1 text-center text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        type="button"
        onClick={() => setZoom(Number((zoom + 0.1).toFixed(2)))}
        title="Zoom In"
        aria-label="Zoom in"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('canvasflow:fit'))}
        title="Fit Artboard to Screen (Ctrl+0)"
        aria-label="Fit artboard to screen"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <Maximize className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setSnapEnabled(!snapEnabled)}
        title={snapEnabled ? 'Smart Alignment Guides: On' : 'Smart Alignment Guides: Off'}
        aria-label="Toggle smart alignment guides"
        className={`flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors ${
          snapEnabled
            ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
        }`}
      >
        <Magnet className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Snap</span>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowShortcuts((v) => !v)}
          title="Keyboard Shortcuts"
          aria-label="Show keyboard shortcuts"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>

        {showShortcuts && (
          <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#161A23]">
            <p className="mb-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </p>
            <div className="space-y-1.5 text-xs">
              <ShortcutRow label="AI Command Bar" keys="Ctrl / Cmd + K" />
              <ShortcutRow label="Undo" keys="Ctrl / Cmd + Z" />
              <ShortcutRow label="Redo" keys="Ctrl / Cmd + Y" />
              <ShortcutRow label="Duplicate Element" keys="Ctrl / Cmd + D" />
              <ShortcutRow label="Delete Element" keys="Del / Backspace" />
              <ShortcutRow label="Pan Canvas" keys="Hold Space / H" />
              <ShortcutRow label="Select Tool" keys="V" />
              <ShortcutRow label="Fit to Viewport" keys="Ctrl / Cmd + 0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ShortcutRow: React.FC<{ label: string; keys: string }> = ({ label, keys }) => (
  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
    <span>{label}</span>
    <kbd className="font-mono-tabular rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      {keys}
    </kbd>
  </div>
);
