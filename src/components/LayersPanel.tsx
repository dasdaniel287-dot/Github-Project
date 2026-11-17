import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Type,
  Square,
  Circle,
  Star,
  Minus,
  Image as ImageIcon,
  Smile,
} from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import { ElementType } from '../types/canvas';

const typeIcons: Record<ElementType, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  rect: <Square className="h-3.5 w-3.5" />,
  circle: <Circle className="h-3.5 w-3.5" />,
  star: <Star className="h-3.5 w-3.5" />,
  line: <Minus className="h-3.5 w-3.5" />,
  icon: <Smile className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
};

export const LayersPanel: React.FC = () => {
  const showLayersPanel = useEditorStore((s) => s.showLayersPanel);
  const elements = useEditorStore((s) => s.elements);
  const selectedId = useEditorStore((s) => s.selectedId);

  const setShowLayersPanel = useEditorStore((s) => s.setShowLayersPanel);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const updateElement = useEditorStore((s) => s.updateElement);
  const reorderElement = useEditorStore((s) => s.reorderElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);

  if (!showLayersPanel) return null;

  // Render top-most layer first
  const reversed = [...elements].reverse();

  return (
    <div className="pointer-events-auto fixed left-20 top-1/2 z-30 flex max-h-[65vh] w-64 -translate-y-1/2 flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#13161E]/95">
      <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2.5 dark:border-white/10">
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
          Layers ({elements.length})
        </span>
        <button
          type="button"
          onClick={() => setShowLayersPanel(false)}
          aria-label="Close layers panel"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="thin-scrollbar flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {reversed.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-slate-400">
            No elements on canvas yet.
          </p>
        ) : (
          reversed.map((el) => {
            const isSelected = el.id === selectedId;
            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 shrink-0">{typeIcons[el.type]}</span>
                  <span className="truncate font-medium">{el.name}</span>
                </div>

                <div
                  className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => reorderElement(el.id, 'forward')}
                    title="Bring Forward"
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderElement(el.id, 'backward')}
                    title="Send Backward"
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateElement(el.id, { visible: !el.visible })}
                    title={el.visible ? 'Hide' : 'Show'}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {el.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-amber-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateElement(el.id, { locked: !el.locked })}
                    title={el.locked ? 'Unlock' : 'Lock'}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {el.locked ? (
                      <Lock className="h-3 w-3 text-indigo-500" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteElement(el.id)}
                    title="Delete"
                    className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
