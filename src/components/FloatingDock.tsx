import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer2,
  Hand,
  Type,
  Shapes,
  Smile,
  ImagePlus,
  LayoutTemplate,
  Layers,
  Square,
  Circle,
  Star,
  Minus,
  RectangleHorizontal,
} from 'lucide-react';
import { useEditorStore, getActivePalette } from '../store/useEditorStore';
import { DESIGN_TEMPLATES, VECTOR_ICONS } from '../constants/presets';

type DockMenu = 'text' | 'shapes' | 'icons' | 'templates' | null;

export const FloatingDock: React.FC = () => {
  const artboard = useEditorStore((s) => s.artboard);
  const toolMode = useEditorStore((s) => s.toolMode);
  const activePaletteId = useEditorStore((s) => s.activePaletteId);
  const customPalettes = useEditorStore((s) => s.customPalettes);
  const showLayersPanel = useEditorStore((s) => s.showLayersPanel);

  const setToolMode = useEditorStore((s) => s.setToolMode);
  const addElement = useEditorStore((s) => s.addElement);
  const applyTemplate = useEditorStore((s) => s.applyTemplate);
  const setShowLayersPanel = useEditorStore((s) => s.setShowLayersPanel);

  const [openMenu, setOpenMenu] = useState<DockMenu>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const palette = getActivePalette(activePaletteId, customPalettes);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const centerPos = (w: number, h: number) => ({
    x: Math.round((artboard.width - w) / 2),
    y: Math.round((artboard.height - h) / 2),
  });

  const handleAddText = (variant: 'heading' | 'subheading' | 'body' | 'kicker') => {
    const configs = {
      heading: {
        name: 'Heading',
        text: 'Design with Intent',
        fontSize: Math.round(Math.max(48, artboard.width * 0.068)),
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '800' as const,
        fill: palette.colors.text,
        colorRole: 'text' as const,
        w: Math.round(artboard.width * 0.7),
        h: 120,
      },
      subheading: {
        name: 'Subheading',
        text: 'Modular layouts & instant design tokens',
        fontSize: Math.round(Math.max(28, artboard.width * 0.036)),
        fontFamily: 'DM Sans',
        fontWeight: '600' as const,
        fill: palette.colors.text,
        colorRole: 'text' as const,
        w: Math.round(artboard.width * 0.65),
        h: 80,
      },
      body: {
        name: 'Body Copy',
        text: 'Double-click any text element to edit directly on the canvas with crisp typographic hierarchy.',
        fontSize: Math.round(Math.max(20, artboard.width * 0.024)),
        fontFamily: 'DM Sans',
        fontWeight: '400' as const,
        fill: palette.colors.mutedText,
        colorRole: 'mutedText' as const,
        w: Math.round(artboard.width * 0.6),
        h: 96,
      },
      kicker: {
        name: 'Mono Label',
        text: '01 · FEATURE RELEASE',
        fontSize: Math.round(Math.max(16, artboard.width * 0.02)),
        fontFamily: 'JetBrains Mono',
        fontWeight: '500' as const,
        fill: palette.colors.accent,
        colorRole: 'accent' as const,
        w: Math.round(artboard.width * 0.45),
        h: 40,
      },
    }[variant];

    const pos = centerPos(configs.w, configs.h);
    addElement({
      type: 'text',
      name: configs.name,
      x: pos.x,
      y: pos.y,
      width: configs.w,
      height: configs.h,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      text: configs.text,
      fontSize: configs.fontSize,
      fontFamily: configs.fontFamily,
      fontWeight: configs.fontWeight,
      align: 'left',
      lineHeight: 1.2,
      letterSpacing: variant === 'kicker' ? 1.5 : 0,
      fill: configs.fill,
      colorRole: configs.colorRole,
    });
    setOpenMenu(null);
  };

  const handleAddShape = (shape: 'rect' | 'card' | 'circle' | 'star' | 'line') => {
    const unit = Math.round(Math.min(artboard.width, artboard.height) * 0.25);

    if (shape === 'rect') {
      const pos = centerPos(unit, unit);
      addElement({
        type: 'rect',
        name: 'Rectangle',
        ...pos,
        width: unit,
        height: unit,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: palette.colors.primary,
        stroke: 'transparent',
        strokeWidth: 0,
        cornerRadius: 0,
        colorRole: 'primary',
      });
    } else if (shape === 'card') {
      const w = Math.round(unit * 1.6);
      const h = unit;
      const pos = centerPos(w, h);
      addElement({
        type: 'rect',
        name: 'Surface Card',
        ...pos,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: palette.colors.surface,
        stroke: palette.colors.secondary,
        strokeWidth: 2,
        cornerRadius: 24,
        colorRole: 'surface',
        shadowEnabled: true,
        shadowColor: '#000000',
        shadowBlur: 32,
        shadowOffsetX: 0,
        shadowOffsetY: 14,
      });
    } else if (shape === 'circle') {
      const pos = centerPos(unit, unit);
      addElement({
        type: 'circle',
        name: 'Circle',
        ...pos,
        width: unit,
        height: unit,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: palette.colors.accent,
        stroke: 'transparent',
        strokeWidth: 0,
        colorRole: 'accent',
      });
    } else if (shape === 'star') {
      const pos = centerPos(unit, unit);
      addElement({
        type: 'star',
        name: 'Star',
        ...pos,
        width: unit,
        height: unit,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        fill: palette.colors.accent,
        stroke: 'transparent',
        strokeWidth: 0,
        numPoints: 5,
        innerRadiusRatio: 0.45,
        colorRole: 'accent',
      });
    } else if (shape === 'line') {
      const w = Math.round(artboard.width * 0.5);
      const pos = centerPos(w, 4);
      addElement({
        type: 'line',
        name: 'Divider Line',
        ...pos,
        width: w,
        height: 4,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        stroke: palette.colors.secondary,
        strokeWidth: 3,
        colorRole: 'secondary',
      });
    }
    setOpenMenu(null);
  };

  const handleAddIcon = (icon: (typeof VECTOR_ICONS)[number]) => {
    const size = Math.round(Math.min(artboard.width, artboard.height) * 0.1);
    const pos = centerPos(size, size);
    addElement({
      type: 'icon',
      name: `Icon · ${icon.label}`,
      ...pos,
      width: size,
      height: size,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      iconName: icon.name,
      pathData: icon.pathData,
      viewBoxSize: icon.viewBoxSize,
      fill: 'transparent',
      stroke: palette.colors.accent,
      strokeWidth: 2,
      colorRole: 'accent',
    });
    setOpenMenu(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxSide = Math.min(artboard.width, artboard.height) * 0.6;
        const ratio = img.width / img.height;
        const w = ratio >= 1 ? Math.round(maxSide) : Math.round(maxSide * ratio);
        const h = ratio >= 1 ? Math.round(maxSide / ratio) : Math.round(maxSide);
        const pos = centerPos(w, h);
        addElement({
          type: 'image',
          name: file.name.replace(/\.[^/.]+$/, ''),
          ...pos,
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          src,
          cornerRadius: 12,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleMenu = (menu: DockMenu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <aside
      ref={dockRef}
      className="pointer-events-auto fixed left-4 top-1/2 z-30 flex -translate-y-1/2 items-start gap-3"
    >
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#13161E]/95">
        <DockButton
          active={toolMode === 'select' && openMenu === null}
          onClick={() => {
            setToolMode('select');
            setOpenMenu(null);
          }}
          label="Select (V)"
          icon={<MousePointer2 className="h-4 w-4" />}
        />
        <DockButton
          active={toolMode === 'pan'}
          onClick={() => {
            setToolMode('pan');
            setOpenMenu(null);
          }}
          label="Pan Workspace (H / Space)"
          icon={<Hand className="h-4 w-4" />}
        />

        <div className="my-1 h-px w-6 bg-slate-200 dark:bg-white/10" />

        <DockButton
          active={openMenu === 'text'}
          onClick={() => toggleMenu('text')}
          label="Add Text"
          icon={<Type className="h-4 w-4" />}
        />
        <DockButton
          active={openMenu === 'shapes'}
          onClick={() => toggleMenu('shapes')}
          label="Add Shapes"
          icon={<Shapes className="h-4 w-4" />}
        />
        <DockButton
          active={openMenu === 'icons'}
          onClick={() => toggleMenu('icons')}
          label="Vector Icons"
          icon={<Smile className="h-4 w-4" />}
        />
        <DockButton
          active={false}
          onClick={() => fileInputRef.current?.click()}
          label="Upload Image"
          icon={<ImagePlus className="h-4 w-4" />}
        />
        <DockButton
          active={openMenu === 'templates'}
          onClick={() => toggleMenu('templates')}
          label="Templates"
          icon={<LayoutTemplate className="h-4 w-4" />}
        />

        <div className="my-1 h-px w-6 bg-slate-200 dark:bg-white/10" />

        <DockButton
          active={showLayersPanel}
          onClick={() => {
            setShowLayersPanel(!showLayersPanel);
            setOpenMenu(null);
          }}
          label="Layers Panel"
          icon={<Layers className="h-4 w-4" />}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Contextual Floating Popovers */}
      {openMenu === 'text' && (
        <div className="w-60 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#161A23]/95">
          <p className="mb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Insert Typography
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleAddText('heading')}
              className="w-full rounded-xl border border-slate-200/80 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="font-display block text-base font-extrabold text-slate-900 dark:text-slate-100">
                Add Heading
              </span>
              <span className="text-[11px] text-slate-400">Plus Jakarta Sans · 800</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddText('subheading')}
              className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Add Subheading
              </span>
              <span className="text-[11px] text-slate-400">DM Sans · 600</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddText('body')}
              className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="block text-xs text-slate-600 dark:text-slate-300">
                Add Body Copy
              </span>
              <span className="text-[11px] text-slate-400">DM Sans · 400</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddText('kicker')}
              className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="font-mono-tabular block text-xs font-medium text-indigo-500">
                01 · MONO KICKER
              </span>
              <span className="text-[11px] text-slate-400">JetBrains Mono · 500</span>
            </button>
          </div>
        </div>
      )}

      {openMenu === 'shapes' && (
        <div className="w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#161A23]/95">
          <p className="mb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Geometric Shapes
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleAddShape('rect')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 p-3 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <Square className="h-5 w-5" />
              <span>Rectangle</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShape('card')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 p-3 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <RectangleHorizontal className="h-5 w-5" />
              <span>Surface Card</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShape('circle')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 p-3 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <Circle className="h-5 w-5" />
              <span>Circle</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShape('star')}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 p-3 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <Star className="h-5 w-5" />
              <span>Star</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShape('line')}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <Minus className="h-4 w-4" />
              <span>Divider Line</span>
            </button>
          </div>
        </div>
      )}

      {openMenu === 'icons' && (
        <div className="w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#161A23]/95">
          <p className="mb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Scalable Vector Icons
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {VECTOR_ICONS.map((icon) => (
              <button
                key={icon.name}
                type="button"
                onClick={() => handleAddIcon(icon)}
                title={icon.label}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200/70 p-2.5 text-slate-700 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-500 dark:border-white/10 dark:text-slate-200"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox={`0 0 ${icon.viewBoxSize} ${icon.viewBoxSize}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon.pathData} />
                </svg>
                <span className="text-[10px] truncate max-w-full">{icon.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {openMenu === 'templates' && (
        <div className="w-72 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#161A23]/95">
          <p className="mb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Starter Layouts
          </p>
          <div className="space-y-2">
            {DESIGN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  applyTemplate(tpl);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 p-2.5 text-left transition-colors hover:border-indigo-500/50 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {tpl.name}
                  </p>
                  <p className="font-mono-tabular mt-0.5 text-[11px] text-slate-400">
                    {tpl.category}
                  </p>
                </div>
                <span
                  className="h-6 w-6 rounded-md border border-black/10 dark:border-white/20 shrink-0"
                  style={{ backgroundColor: tpl.backgroundColor }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

interface DockButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

const DockButton: React.FC<DockButtonProps> = ({ active, onClick, label, icon }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
    }`}
  >
    {icon}
  </button>
);
