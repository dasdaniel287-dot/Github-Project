import React from 'react';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Palette,
} from 'lucide-react';
import { useEditorStore, getActivePalette } from '../store/useEditorStore';
import { BRAND_PALETTES, CANVAS_FONTS } from '../constants/presets';
import { ColorRole } from '../types/canvas';

const COLOR_ROLES: { label: string; value: ColorRole }[] = [
  { label: 'Primary', value: 'primary' },
  { label: 'Accent', value: 'accent' },
  { label: 'Surface', value: 'surface' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Text', value: 'text' },
  { label: 'Muted', value: 'mutedText' },
];

export const InspectorPanel: React.FC = () => {
  const artboard = useEditorStore((s) => s.artboard);
  const elements = useEditorStore((s) => s.elements);
  const selectedId = useEditorStore((s) => s.selectedId);
  const activePaletteId = useEditorStore((s) => s.activePaletteId);
  const customPalettes = useEditorStore((s) => s.customPalettes);

  const updateArtboard = useEditorStore((s) => s.updateArtboard);
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const reorderElement = useEditorStore((s) => s.reorderElement);
  const applyBrandPalette = useEditorStore((s) => s.applyBrandPalette);

  const selected = elements.find((e) => e.id === selectedId) || null;
  const currentPalette = getActivePalette(activePaletteId, customPalettes);
  const allPalettes = [...customPalettes, ...BRAND_PALETTES];
  const quickSwatches = Object.values(currentPalette.colors);

  return (
    <aside className="pointer-events-auto fixed right-4 top-20 bottom-16 z-30 flex w-[276px] flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#13161E]/95">
      {!selected ? (
        /* Artboard & One-Click Brand Kit Inspector */
        <div className="thin-scrollbar flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Artboard & Theme
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Select any element on the canvas to edit its properties.
            </p>
          </div>

          {/* Background Color */}
          <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-white/10">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Canvas Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={artboard.backgroundColor}
                onChange={(e) => updateArtboard({ backgroundColor: e.target.value })}
                aria-label="Artboard background color"
                className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
              />
              <input
                type="text"
                value={artboard.backgroundColor}
                onChange={(e) => updateArtboard({ backgroundColor: e.target.value })}
                className="font-mono-tabular flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs uppercase text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickSwatches.map((hex, i) => (
                <button
                  key={`${hex}-${i}`}
                  type="button"
                  onClick={() => updateArtboard({ backgroundColor: hex })}
                  title={hex}
                  className="h-5 w-5 rounded-md border border-black/10 transition-transform hover:scale-110 dark:border-white/15"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* One-Click Brand Kit Switcher */}
          <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <Palette className="h-3.5 w-3.5 text-indigo-500" />
                Brand Kit Switcher
              </span>
              <span className="text-[11px] text-slate-400">1-Click</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Re-themes background, cards, accents, and typography across your entire design harmoniously.
            </p>
            <div className="space-y-1.5 pt-1">
              {allPalettes.map((pal) => {
                const isActive = pal.id === activePaletteId;
                const previewColors = [
                  pal.colors.background,
                  pal.colors.surface,
                  pal.colors.primary,
                  pal.colors.accent,
                  pal.colors.text,
                ];
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => applyBrandPalette(pal)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                      {pal.name}
                    </span>
                    <div className="flex items-center -space-x-1 shrink-0 pl-2">
                      {previewColors.map((c, idx) => (
                        <span
                          key={idx}
                          className="h-4 w-4 rounded-full border border-black/15 dark:border-white/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Context-Aware Element Inspector */
        <div className="thin-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header & Quick Actions */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-white/10">
            <input
              type="text"
              value={selected.name}
              onChange={(e) => updateElement(selected.id, { name: e.target.value })}
              aria-label="Layer name"
              className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-xs font-semibold text-slate-900 outline-none focus:bg-slate-100 dark:text-slate-100 dark:focus:bg-white/5"
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => updateElement(selected.id, { locked: !selected.locked })}
                title={selected.locked ? 'Unlock' : 'Lock'}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                {selected.locked ? (
                  <Lock className="h-3.5 w-3.5 text-indigo-500" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => duplicateElement(selected.id)}
                title="Duplicate (Ctrl+D)"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteElement(selected.id)}
                title="Delete (Del)"
                className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-500 dark:text-slate-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Position, Size & Rotation */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Transform
            </p>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="X"
                value={Math.round(selected.x)}
                onChange={(v) => updateElement(selected.id, { x: v })}
              />
              <NumberField
                label="Y"
                value={Math.round(selected.y)}
                onChange={(v) => updateElement(selected.id, { y: v })}
              />
              <NumberField
                label="W"
                value={Math.round(selected.width)}
                min={10}
                onChange={(v) => updateElement(selected.id, { width: Math.max(10, v) })}
              />
              <NumberField
                label="H"
                value={Math.round(selected.height)}
                min={2}
                onChange={(v) => updateElement(selected.id, { height: Math.max(2, v) })}
              />
              <NumberField
                label="°"
                value={Math.round(selected.rotation)}
                onChange={(v) => updateElement(selected.id, { rotation: v })}
              />
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-white/10 dark:bg-black/30">
                <span className="text-[11px] text-slate-400">Op</span>
                <span className="font-mono-tabular text-xs text-slate-800 dark:text-slate-200">
                  {Math.round(selected.opacity * 100)}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(selected.opacity * 100)}
              onChange={(e) =>
                updateElement(selected.id, { opacity: Number(e.target.value) / 100 })
              }
              aria-label="Opacity"
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Typography Controls (Text only) */}
          {selected.type === 'text' && (
            <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Typography
              </p>
              <textarea
                rows={3}
                value={selected.text}
                onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
              />
              <select
                value={selected.fontFamily}
                onChange={(e) => updateElement(selected.id, { fontFamily: e.target.value })}
                aria-label="Font family"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#0B0D12] dark:text-slate-100"
              >
                {CANVAS_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Size"
                  value={Math.round(selected.fontSize)}
                  min={8}
                  onChange={(v) =>
                    updateElement(selected.id, { fontSize: Math.max(8, v) })
                  }
                />
                <select
                  value={selected.fontWeight}
                  onChange={(e) =>
                    updateElement(selected.id, {
                      fontWeight: e.target.value as typeof selected.fontWeight,
                    })
                  }
                  aria-label="Font weight"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#0B0D12] dark:text-slate-100"
                >
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">SemiBold</option>
                  <option value="700">Bold</option>
                  <option value="800">ExtraBold</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="LH"
                  step={0.05}
                  value={Number(selected.lineHeight.toFixed(2))}
                  min={0.8}
                  onChange={(v) =>
                    updateElement(selected.id, { lineHeight: Math.max(0.8, v) })
                  }
                />
                <NumberField
                  label="Track"
                  value={Math.round(selected.letterSpacing)}
                  onChange={(v) => updateElement(selected.id, { letterSpacing: v })}
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-black/30">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => updateElement(selected.id, { align })}
                    className={`flex flex-1 items-center justify-center rounded-md py-1 transition-colors ${
                      selected.align === align
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                    {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                    {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors & Borders */}
          <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Appearance
            </p>

            {'fill' in selected && (
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Fill Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selected.fill === 'transparent' ? '#000000' : selected.fill}
                    onChange={(e) => updateElement(selected.id, { fill: e.target.value })}
                    className="h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
                  />
                  <input
                    type="text"
                    value={selected.fill}
                    onChange={(e) => updateElement(selected.id, { fill: e.target.value })}
                    className="font-mono-tabular flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickSwatches.map((hex, i) => (
                    <button
                      key={`${hex}-${i}`}
                      type="button"
                      onClick={() => updateElement(selected.id, { fill: hex })}
                      className="h-4 w-4 rounded border border-black/15 transition-transform hover:scale-110 dark:border-white/20"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {'stroke' in selected && (
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Stroke / Border
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selected.stroke === 'transparent' ? '#64748b' : selected.stroke}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        stroke: e.target.value,
                        strokeWidth: Math.max(1, selected.strokeWidth),
                      })
                    }
                    className="h-7 w-9 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
                  />
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={selected.strokeWidth}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        strokeWidth: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="font-mono-tabular w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
                  />
                  {selected.type !== 'line' && selected.stroke !== 'transparent' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selected.id, { stroke: 'transparent', strokeWidth: 0 })
                      }
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {'cornerRadius' in selected && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Border Radius</span>
                  <span className="font-mono-tabular">{Math.round(selected.cornerRadius)}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={Math.round(selected.cornerRadius)}
                  onChange={(e) =>
                    updateElement(selected.id, { cornerRadius: Number(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            )}

            {selected.type === 'star' && (
              <NumberField
                label="Points"
                value={selected.numPoints}
                min={3}
                onChange={(v) =>
                  updateElement(selected.id, { numPoints: Math.max(3, Math.min(16, v)) })
                }
              />
            )}

            {/* Drop Shadow */}
            {selected.type !== 'line' && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600 dark:text-slate-300">Drop Shadow</span>
                <button
                  type="button"
                  onClick={() =>
                    updateElement(selected.id, {
                      shadowEnabled: !selected.shadowEnabled,
                      shadowBlur: selected.shadowBlur ?? 28,
                    })
                  }
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selected.shadowEnabled
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
                  }`}
                >
                  {selected.shadowEnabled ? 'Enabled' : 'Off'}
                </button>
              </div>
            )}

            {/* Brand Kit Semantic Role Binding */}
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                Brand Kit Token Binding
              </label>
              <select
                value={selected.colorRole || ''}
                onChange={(e) =>
                  updateElement(selected.id, {
                    colorRole: (e.target.value || undefined) as ColorRole | undefined,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-[#0B0D12] dark:text-slate-100"
              >
                <option value="">Unlinked (Custom)</option>
                {COLOR_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Layer Ordering */}
          <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Layer Order
            </p>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => reorderElement(selected.id, 'front')}
                title="Bring to Front"
                className="flex items-center justify-center rounded-lg border border-slate-200 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <ArrowUpToLine className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reorderElement(selected.id, 'forward')}
                title="Bring Forward"
                className="flex items-center justify-center rounded-lg border border-slate-200 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reorderElement(selected.id, 'backward')}
                title="Send Backward"
                className="flex items-center justify-center rounded-lg border border-slate-200 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reorderElement(selected.id, 'back')}
                title="Send to Back"
                className="flex items-center justify-center rounded-lg border border-slate-200 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (val: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  min,
  step = 1,
  onChange,
}) => (
  <label className="flex items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-white/10 dark:bg-black/30">
    <span className="text-[11px] text-slate-400 shrink-0">{label}</span>
    <input
      type="number"
      step={step}
      min={min}
      value={value}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
      className="font-mono-tabular w-full bg-transparent text-right text-xs text-slate-900 outline-none dark:text-slate-100"
    />
  </label>
);
