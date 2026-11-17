import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Sun,
  Moon,
  Download,
  ChevronDown,
  Wand2,
  Command,
  Maximize2,
} from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import { ARTBOARD_PRESETS } from '../constants/presets';

export const TopBar: React.FC = () => {
  const artboard = useEditorStore((s) => s.artboard);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const isDarkTheme = useEditorStore((s) => s.isDarkTheme);

  const updateArtboard = useEditorStore((s) => s.updateArtboard);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const setCommandBarOpen = useEditorStore((s) => s.setCommandBarOpen);
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen);

  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);
  const [customW, setCustomW] = useState(String(artboard.width));
  const [customH, setCustomH] = useState(String(artboard.height));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(artboard.name);

  const sizeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCustomW(String(artboard.width));
    setCustomH(String(artboard.height));
  }, [artboard.width, artboard.height]);

  useEffect(() => {
    setTitleDraft(artboard.name);
  }, [artboard.name]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setIsSizeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const applyCustomDimensions = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(120, Math.min(4096, Number(customW) || artboard.width));
    const h = Math.max(120, Math.min(4096, Number(customH) || artboard.height));
    updateArtboard({ width: w, height: h });
    setIsSizeMenuOpen(false);
  };

  const commitTitle = () => {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== artboard.name) {
      updateArtboard({ name: trimmed });
    } else {
      setTitleDraft(artboard.name);
    }
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 px-4 pt-3">
      {/* Left Floating Island: Brand, Title, Preset Dimensions, Undo/Redo */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#13161E]/95">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-white/10">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="8" height="8" rx="2" />
              <rect x="13" y="13" width="8" height="8" rx="2" />
              <path d="M13 7h5v5" />
              <path d="M6 13v5h5" />
            </svg>
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            CanvasFlow AI
          </span>
        </div>

        {/* Inline Editable Document Name */}
        {isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setTitleDraft(artboard.name);
                setIsEditingTitle(false);
              }
            }}
            className="w-40 rounded-md border border-indigo-500 bg-transparent px-2 py-0.5 text-xs font-medium text-slate-900 outline-none dark:text-slate-100"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            title="Rename project"
            className="max-w-[160px] truncate rounded-md px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          >
            {artboard.name}
          </button>
        )}

        {/* Artboard Size Dropdown */}
        <div ref={sizeMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsSizeMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
          >
            <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono-tabular">
              {artboard.width} × {artboard.height}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isSizeMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#161A23]">
              <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Canvas Presets
              </p>
              <div className="space-y-1">
                {ARTBOARD_PRESETS.map((preset) => {
                  const active =
                    artboard.width === preset.width && artboard.height === preset.height;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        updateArtboard({ width: preset.width, height: preset.height });
                        setIsSizeMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="font-mono-tabular text-[11px] text-slate-400">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={applyCustomDimensions}
                className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10"
              >
                <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Custom Dimensions (px)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={120}
                    max={4096}
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    aria-label="Custom width"
                    className="font-mono-tabular w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400">×</span>
                  <input
                    type="number"
                    min={120}
                    max={4096}
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    aria-label="Custom height"
                    className="font-mono-tabular w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 whitespace-nowrap shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pl-1 border-l border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center Floating Island: AI Magic Layout & Command Bar Trigger */}
      <button
        type="button"
        onClick={() => setCommandBarOpen(true)}
        className="pointer-events-auto hidden md:flex items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 text-xs text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:border-indigo-400 hover:text-slate-900 dark:border-white/10 dark:bg-[#13161E]/95 dark:text-slate-400 dark:hover:border-indigo-500/60 dark:hover:text-slate-100 w-[340px] lg:w-[400px]"
      >
        <span className="flex items-center gap-2 truncate">
          <Wand2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">AI Magic Layout or quick command...</span>
        </span>
        <kbd className="font-mono-tabular flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 shrink-0">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Right Floating Island: Mobile AI trigger, Theme Toggle, Primary Export CTA */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#13161E]/95">
        <button
          type="button"
          onClick={() => setCommandBarOpen(true)}
          title="AI Command Bar (Ctrl+K)"
          aria-label="Open AI Command Bar"
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <Wand2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle color theme"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
