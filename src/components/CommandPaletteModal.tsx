import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  X,
  Loader2,
  Type,
  Square,
  Circle,
  Palette,
  Download,
  Maximize2,
  SunMoon,
  AlertCircle,
  CornerDownLeft,
} from 'lucide-react';
import { useEditorStore, getActivePalette } from '../store/useEditorStore';
import { BRAND_PALETTES } from '../constants/presets';

const EXAMPLE_PROMPTS = [
  'Create a tech event poster in deep cobalt blue with bold typography',
  'Minimalist specialty coffee launch card on warm ivory background',
  'Modern AI developer tools YouTube thumbnail with high contrast amber accent',
];

export const CommandPaletteModal: React.FC = () => {
  const isOpen = useEditorStore((s) => s.isCommandBarOpen);
  const artboard = useEditorStore((s) => s.artboard);
  const activePaletteId = useEditorStore((s) => s.activePaletteId);
  const customPalettes = useEditorStore((s) => s.customPalettes);

  const setCommandBarOpen = useEditorStore((s) => s.setCommandBarOpen);
  const addElement = useEditorStore((s) => s.addElement);
  const applyBrandPalette = useEditorStore((s) => s.applyBrandPalette);
  const applyGeneratedLayout = useEditorStore((s) => s.applyGeneratedLayout);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen);

  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const palette = getActivePalette(activePaletteId, customPalettes);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateAILayout = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          width: artboard.width,
          height: artboard.height,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI layout.');
      }
      applyGeneratedLayout(data);
      setQuery('');
      setCommandBarOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to generate layout.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickActions = [
    {
      id: 'add-heading',
      label: 'Insert Display Heading',
      hint: 'Text',
      icon: <Type className="h-4 w-4" />,
      run: () => {
        addElement({
          type: 'text',
          name: 'Heading',
          x: Math.round(artboard.width * 0.15),
          y: Math.round(artboard.height * 0.4),
          width: Math.round(artboard.width * 0.7),
          height: 110,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          text: 'Bold Creative Direction',
          fontSize: Math.round(Math.max(48, artboard.width * 0.065)),
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: '800',
          fill: palette.colors.text,
          align: 'left',
          lineHeight: 1.15,
          letterSpacing: -1,
          colorRole: 'text',
        });
      },
    },
    {
      id: 'add-card',
      label: 'Insert Surface Card',
      hint: 'Shape',
      icon: <Square className="h-4 w-4" />,
      run: () => {
        const w = Math.round(artboard.width * 0.45);
        const h = Math.round(artboard.height * 0.3);
        addElement({
          type: 'rect',
          name: 'Surface Card',
          x: Math.round((artboard.width - w) / 2),
          y: Math.round((artboard.height - h) / 2),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          fill: palette.colors.surface,
          stroke: palette.colors.secondary,
          strokeWidth: 2,
          cornerRadius: 20,
          colorRole: 'surface',
        });
      },
    },
    {
      id: 'add-circle',
      label: 'Insert Accent Circle',
      hint: 'Shape',
      icon: <Circle className="h-4 w-4" />,
      run: () => {
        const s = Math.round(Math.min(artboard.width, artboard.height) * 0.22);
        addElement({
          type: 'circle',
          name: 'Accent Circle',
          x: Math.round((artboard.width - s) / 2),
          y: Math.round((artboard.height - s) / 2),
          width: s,
          height: s,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          fill: palette.colors.accent,
          stroke: 'transparent',
          strokeWidth: 0,
          colorRole: 'accent',
        });
      },
    },
    ...BRAND_PALETTES.slice(0, 3).map((pal) => ({
      id: `pal-${pal.id}`,
      label: `Switch Palette: ${pal.name}`,
      hint: 'Brand Kit',
      icon: <Palette className="h-4 w-4" />,
      run: () => applyBrandPalette(pal),
    })),
    {
      id: 'fit-canvas',
      label: 'Zoom Canvas to Fit Viewport',
      hint: 'View',
      icon: <Maximize2 className="h-4 w-4" />,
      run: () => window.dispatchEvent(new Event('canvasflow:fit')),
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark / Light Workspace',
      hint: 'View',
      icon: <SunMoon className="h-4 w-4" />,
      run: () => toggleTheme(),
    },
    {
      id: 'open-export',
      label: 'Export PNG, PDF, SVG, or Tailwind CSS',
      hint: 'Export',
      icon: <Download className="h-4 w-4" />,
      run: () => setExportModalOpen(true),
    },
  ];

  const normalizedQ = query.trim().toLowerCase();
  const filteredActions = normalizedQ
    ? quickActions.filter((a) => a.label.toLowerCase().includes(normalizedQ))
    : quickActions.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-xs"
      onClick={() => !isGenerating && setCommandBarOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#13161E]"
      >
        {/* Prompt & Command Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateAILayout(query);
          }}
          className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-white/10"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />
          ) : (
            <Wand2 className="h-4 w-4 text-indigo-500 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !isGenerating) setCommandBarOpen(false);
            }}
            placeholder="Describe a design for AI layout or filter commands..."
            disabled={isGenerating}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100"
          />
          {query.trim() && (
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <span>{isGenerating ? 'Generating...' : 'Generate AI Layout'}</span>
              {!isGenerating && <CornerDownLeft className="h-3 w-3" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => !isGenerating && setCommandBarOpen(false)}
            aria-label="Close command bar"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI Prompt Starters */}
        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            AI Magic Layout Prompts ({artboard.width}×{artboard.height})
          </p>
          <div className="space-y-1">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  setQuery(example);
                  generateAILayout(example);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
              >
                <span className="truncate">{example}</span>
                <span className="ml-3 text-[11px] text-indigo-500 shrink-0">Generate</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Commands */}
        <div className="thin-scrollbar max-h-60 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Quick Actions
          </p>
          {filteredActions.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-slate-400">
              Press Enter to generate an AI layout for &ldquo;{query}&rdquo;
            </p>
          ) : (
            filteredActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  action.run();
                  setCommandBarOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-slate-400">{action.icon}</span>
                  <span className="font-medium">{action.label}</span>
                </span>
                <span className="text-[11px] text-slate-400">{action.hint}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
