import { create } from 'zustand';
import {
  Artboard,
  BrandPalette,
  CanvasElement,
  ColorRole,
  DesignTemplate,
  NewCanvasElement,
  ToolMode,
} from '../types/canvas';
import { BRAND_PALETTES, DESIGN_TEMPLATES } from '../constants/presets';

const MAX_HISTORY = 50;

export interface DocumentSnapshot {
  artboard: Artboard;
  elements: CanvasElement[];
  activePaletteId: string;
}

interface EditorState {
  // Document state
  artboard: Artboard;
  elements: CanvasElement[];
  activePaletteId: string;
  customPalettes: BrandPalette[];

  // History stacks
  past: DocumentSnapshot[];
  future: DocumentSnapshot[];

  // Selection & UI state
  selectedId: string | null;
  toolMode: ToolMode;
  zoom: number;
  pan: { x: number; y: number };
  snapEnabled: boolean;
  isDarkTheme: boolean;
  showLayersPanel: boolean;
  isCommandBarOpen: boolean;
  isExportModalOpen: boolean;

  // Actions
  setSelectedId: (id: string | null) => void;
  setToolMode: (mode: ToolMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setSnapEnabled: (enabled: boolean) => void;
  toggleTheme: () => void;
  setShowLayersPanel: (show: boolean) => void;
  setCommandBarOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;

  // Document mutations with history
  updateArtboard: (patch: Partial<Artboard>, recordHistory?: boolean) => void;
  addElement: (element: NewCanvasElement) => string;
  updateElement: (id: string, patch: Partial<CanvasElement>, recordHistory?: boolean) => void;
  commitSnapshot: (beforeSnapshot: DocumentSnapshot) => void;
  getSnapshot: () => DocumentSnapshot;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  reorderElement: (id: string, direction: 'forward' | 'backward' | 'front' | 'back') => void;
  applyBrandPalette: (palette: BrandPalette) => void;
  addCustomPalette: (palette: BrandPalette) => void;
  applyTemplate: (template: DesignTemplate) => void;
  applyGeneratedLayout: (payload: {
    title: string;
    backgroundColor: string;
    palette?: BrandPalette['colors'];
    elements: Array<Record<string, any>>;
  }) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

function makeId(prefix = 'el'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36).slice(-4)}`;
}

const initialTemplate = DESIGN_TEMPLATES[0];

const initialArtboard: Artboard = {
  id: 'artboard-main',
  name: initialTemplate.name,
  width: initialTemplate.width,
  height: initialTemplate.height,
  backgroundColor: initialTemplate.backgroundColor,
};

const initialElements: CanvasElement[] = initialTemplate.elements.map((el) => ({
  ...el,
  id: makeId(el.type),
})) as CanvasElement[];

function pushHistory(
  past: DocumentSnapshot[],
  snapshot: DocumentSnapshot
): DocumentSnapshot[] {
  const next = [...past, structuredClone(snapshot)];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  artboard: initialArtboard,
  elements: initialElements,
  activePaletteId: initialTemplate.paletteId,
  customPalettes: [],
  past: [],
  future: [],

  selectedId: null,
  toolMode: 'select',
  zoom: 0.52,
  pan: { x: 0, y: 0 },
  snapEnabled: true,
  isDarkTheme: true,
  showLayersPanel: false,
  isCommandBarOpen: false,
  isExportModalOpen: false,

  setSelectedId: (id) => set({ selectedId: id }),
  setToolMode: (toolMode) => set({ toolMode }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),

  toggleTheme: () =>
    set((state) => {
      const next = !state.isDarkTheme;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      return { isDarkTheme: next };
    }),

  setShowLayersPanel: (showLayersPanel) => set({ showLayersPanel }),
  setCommandBarOpen: (isCommandBarOpen) => set({ isCommandBarOpen }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

  getSnapshot: () => {
    const { artboard, elements, activePaletteId } = get();
    return structuredClone({ artboard, elements, activePaletteId });
  },

  commitSnapshot: (beforeSnapshot) =>
    set((state) => ({
      past: pushHistory(state.past, beforeSnapshot),
      future: [],
    })),

  updateArtboard: (patch, recordHistory = true) =>
    set((state) => {
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        artboard: { ...state.artboard, ...patch },
        ...(recordHistory
          ? { past: pushHistory(state.past, currentSnap), future: [] }
          : {}),
      };
    }),

  addElement: (elementData) => {
    const id = makeId(elementData.type);
    const newEl = { ...elementData, id } as CanvasElement;
    set((state) => {
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        elements: [...state.elements, newEl],
        selectedId: id,
        toolMode: 'select',
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    });
    return id;
  },

  updateElement: (id, patch, recordHistory = true) =>
    set((state) => {
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as CanvasElement) : el
        ),
        ...(recordHistory
          ? { past: pushHistory(state.past, currentSnap), future: [] }
          : {}),
      };
    }),

  deleteElement: (id) =>
    set((state) => {
      const target = state.elements.find((e) => e.id === id);
      if (!target) return state;
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        elements: state.elements.filter((el) => el.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    }),

  duplicateElement: (id) =>
    set((state) => {
      const target = state.elements.find((e) => e.id === id);
      if (!target) return state;
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      const cloned: CanvasElement = {
        ...structuredClone(target),
        id: makeId(target.type),
        name: `${target.name} Copy`,
        x: target.x + 24,
        y: target.y + 24,
      };
      return {
        elements: [...state.elements, cloned],
        selectedId: cloned.id,
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    }),

  reorderElement: (id, direction) =>
    set((state) => {
      const idx = state.elements.findIndex((e) => e.id === id);
      if (idx === -1) return state;
      const next = [...state.elements];
      const [item] = next.splice(idx, 1);

      if (direction === 'forward') {
        next.splice(Math.min(next.length, idx + 1), 0, item);
      } else if (direction === 'backward') {
        next.splice(Math.max(0, idx - 1), 0, item);
      } else if (direction === 'front') {
        next.push(item);
      } else if (direction === 'back') {
        next.unshift(item);
      }

      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        elements: next,
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    }),

  applyBrandPalette: (palette) =>
    set((state) => {
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };

      const mappedElements = state.elements.map((el) => {
        const role: ColorRole | undefined = el.colorRole;
        if (el.type === 'line') {
          const lineColor = role ? palette.colors[role] : palette.colors.secondary;
          return { ...el, stroke: lineColor };
        }
        if (el.type === 'text') {
          const textColor = role ? palette.colors[role] : palette.colors.text;
          return { ...el, fill: textColor };
        }
        if (el.type === 'rect' || el.type === 'circle' || el.type === 'star') {
          const fillRole: ColorRole = role ?? 'surface';
          const nextFill = palette.colors[fillRole];
          const nextStroke =
            el.stroke && el.stroke !== 'transparent'
              ? palette.colors.secondary
              : el.stroke;
          return { ...el, fill: nextFill, stroke: nextStroke };
        }
        if (el.type === 'icon') {
          const iconColor = role ? palette.colors[role] : palette.colors.accent;
          return { ...el, stroke: iconColor };
        }
        return el;
      });

      return {
        artboard: {
          ...state.artboard,
          backgroundColor: palette.colors.background,
        },
        elements: mappedElements as CanvasElement[],
        activePaletteId: palette.id,
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    }),

  addCustomPalette: (palette) =>
    set((state) => ({
      customPalettes: [
        palette,
        ...state.customPalettes.filter((p) => p.id !== palette.id),
      ].slice(0, 4),
    })),

  applyTemplate: (template) =>
    set((state) => {
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      const newElements = template.elements.map((el) => ({
        ...structuredClone(el),
        id: makeId(el.type),
      })) as CanvasElement[];

      return {
        artboard: {
          ...state.artboard,
          name: template.name,
          width: template.width,
          height: template.height,
          backgroundColor: template.backgroundColor,
        },
        elements: newElements,
        activePaletteId: template.paletteId,
        selectedId: null,
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    }),

  applyGeneratedLayout: (payload) =>
    set((state) => {
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };

      let paletteId = state.activePaletteId;
      let nextCustomPalettes = state.customPalettes;

      if (payload.palette) {
        const aiPalette: BrandPalette = {
          id: `ai-${Date.now()}`,
          name: payload.title || 'AI Generated Kit',
          colors: payload.palette,
        };
        paletteId = aiPalette.id;
        nextCustomPalettes = [aiPalette, ...state.customPalettes].slice(0, 4);
      }

      const validRoles = new Set<ColorRole>([
        'background',
        'surface',
        'primary',
        'secondary',
        'accent',
        'text',
        'mutedText',
      ]);

      const normalizedElements: CanvasElement[] = (payload.elements || [])
        .map((raw): CanvasElement | null => {
          const type = raw.type;
          const colorRole = validRoles.has(raw.colorRole)
            ? (raw.colorRole as ColorRole)
            : undefined;
          const base = {
            id: makeId(type || 'el'),
            name: String(raw.name || 'Element'),
            x: Number.isFinite(raw.x) ? Number(raw.x) : 80,
            y: Number.isFinite(raw.y) ? Number(raw.y) : 80,
            width: Math.max(10, Number(raw.width) || 200),
            height: Math.max(2, Number(raw.height) || 80),
            rotation: Number(raw.rotation) || 0,
            opacity:
              typeof raw.opacity === 'number'
                ? Math.max(0.05, Math.min(1, raw.opacity))
                : 1,
            visible: true,
            locked: false,
            colorRole,
            shadowEnabled: Boolean(raw.shadowEnabled),
            shadowColor: '#000000',
            shadowBlur: Number(raw.shadowBlur) || 24,
            shadowOffsetX: 0,
            shadowOffsetY: 10,
          };

          if (type === 'text') {
            const weight = ['400', '500', '600', '700', '800'].includes(
              String(raw.fontWeight)
            )
              ? (String(raw.fontWeight) as '400' | '500' | '600' | '700' | '800')
              : '600';
            const align = ['left', 'center', 'right'].includes(raw.align)
              ? (raw.align as 'left' | 'center' | 'right')
              : 'left';
            return {
              ...base,
              type: 'text',
              text: String(raw.text || 'Headline'),
              fontSize: Math.max(12, Number(raw.fontSize) || 36),
              fontFamily: String(raw.fontFamily || 'Plus Jakarta Sans'),
              fontWeight: weight,
              fontStyle: 'normal',
              fill: String(raw.fill || payload.palette?.text || '#FFFFFF'),
              align,
              lineHeight: Number(raw.lineHeight) || 1.2,
              letterSpacing: Number(raw.letterSpacing) || 0,
            };
          }

          if (type === 'rect') {
            return {
              ...base,
              type: 'rect',
              fill: String(raw.fill || payload.palette?.surface || '#1E293B'),
              stroke: String(raw.stroke || 'transparent'),
              strokeWidth: Number(raw.strokeWidth) || 0,
              cornerRadius: Number(raw.cornerRadius) || 12,
            };
          }

          if (type === 'circle') {
            return {
              ...base,
              type: 'circle',
              fill: String(raw.fill || payload.palette?.accent || '#3B82F6'),
              stroke: String(raw.stroke || 'transparent'),
              strokeWidth: Number(raw.strokeWidth) || 0,
            };
          }

          if (type === 'star') {
            return {
              ...base,
              type: 'star',
              fill: String(raw.fill || payload.palette?.accent || '#F59E0B'),
              stroke: String(raw.stroke || 'transparent'),
              strokeWidth: Number(raw.strokeWidth) || 0,
              numPoints: Math.max(3, Math.min(12, Number(raw.numPoints) || 5)),
              innerRadiusRatio: 0.45,
            };
          }

          if (type === 'line') {
            return {
              ...base,
              type: 'line',
              height: Math.max(2, Number(raw.strokeWidth) || 2),
              stroke: String(raw.stroke || raw.fill || payload.palette?.primary || '#3B82F6'),
              strokeWidth: Math.max(1, Number(raw.strokeWidth) || 2),
            };
          }

          return null;
        })
        .filter((el): el is CanvasElement => el !== null);

      return {
        artboard: {
          ...state.artboard,
          name: payload.title || state.artboard.name,
          backgroundColor: payload.backgroundColor || state.artboard.backgroundColor,
        },
        elements: normalizedElements,
        activePaletteId: paletteId,
        customPalettes: nextCustomPalettes,
        selectedId: null,
        past: pushHistory(state.past, currentSnap),
        future: [],
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        artboard: previous.artboard,
        elements: previous.elements,
        activePaletteId: previous.activePaletteId,
        selectedId: null,
        past: nextPast,
        future: [structuredClone(currentSnap), ...state.future].slice(0, MAX_HISTORY),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const nextSnap = state.future[0];
      const nextFuture = state.future.slice(1);
      const currentSnap: DocumentSnapshot = {
        artboard: state.artboard,
        elements: state.elements,
        activePaletteId: state.activePaletteId,
      };
      return {
        artboard: nextSnap.artboard,
        elements: nextSnap.elements,
        activePaletteId: nextSnap.activePaletteId,
        selectedId: null,
        past: pushHistory(state.past, currentSnap),
        future: nextFuture,
      };
    }),
}));

export function getActivePalette(activeId: string, customPalettes: BrandPalette[]): BrandPalette {
  return (
    customPalettes.find((p) => p.id === activeId) ||
    BRAND_PALETTES.find((p) => p.id === activeId) ||
    BRAND_PALETTES[0]
  );
}
