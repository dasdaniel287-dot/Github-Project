import React, { useState, useMemo } from 'react';
import Konva from 'konva';
import { X, Download, Copy, Check, FileImage, FileCode2, Code2, FileText } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import {
  downloadSVG,
  exportRasterImage,
  exportToPDF,
  generateSVGCode,
  generateTailwindCode,
} from '../utils/exporters';

interface ExportModalProps {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
}

type ExportTab = 'raster' | 'svg' | 'tailwind';

export const ExportModal: React.FC<ExportModalProps> = ({ stageRef }) => {
  const isOpen = useEditorStore((s) => s.isExportModalOpen);
  const artboard = useEditorStore((s) => s.artboard);
  const elements = useEditorStore((s) => s.elements);
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen);

  const [tab, setTab] = useState<ExportTab>('raster');
  const [copied, setCopied] = useState(false);

  const svgCode = useMemo(
    () => (isOpen ? generateSVGCode(elements, artboard) : ''),
    [isOpen, elements, artboard]
  );

  const tailwindCode = useMemo(
    () => (isOpen ? generateTailwindCode(elements, artboard) : ''),
    [isOpen, elements, artboard]
  );

  if (!isOpen) return null;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs"
      onClick={() => setExportModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/15 dark:bg-[#13161E]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Export Design & Code
            </h2>
            <p className="font-mono-tabular mt-0.5 text-xs text-slate-400">
              {artboard.name} · {artboard.width} × {artboard.height}px
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExportModalOpen(false)}
            aria-label="Close export modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-5 py-2.5 dark:border-white/10 dark:bg-black/20">
          <button
            type="button"
            onClick={() => setTab('raster')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'raster'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileImage className="h-3.5 w-3.5" />
            <span>PNG / JPG / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('svg')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'svg'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>SVG Vector</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('tailwind')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'tailwind'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Tailwind CSS</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'raster' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  if (stageRef.current) exportRasterImage(stageRef.current, artboard, 'png');
                }}
                className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-indigo-500 hover:bg-indigo-500/5 dark:border-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <FileImage className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    PNG (2× Retina)
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Lossless raster image at {artboard.width * 2}×{artboard.height * 2}px.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
                  <Download className="h-3.5 w-3.5" /> Download PNG
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (stageRef.current) exportRasterImage(stageRef.current, artboard, 'jpg');
                }}
                className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-indigo-500 hover:bg-indigo-500/5 dark:border-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <FileImage className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    JPEG High Quality
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Compressed web-ready export for fast social publishing.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                  <Download className="h-3.5 w-3.5" /> Download JPG
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (stageRef.current) exportToPDF(stageRef.current, artboard);
                }}
                className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-indigo-500 hover:bg-indigo-500/5 dark:border-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    PDF Document
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Exact artboard-sized PDF ready for decks & print handoff.
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </span>
              </button>
            </div>
          )}

          {tab === 'svg' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clean, editable SVG markup preserving shapes, typography, and viewBox geometry.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(svgCode)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy SVG'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSVG(elements, artboard)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .svg</span>
                  </button>
                </div>
              </div>
              <pre className="thin-scrollbar max-h-[340px] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200 dark:border-white/10">
                <code>{svgCode}</code>
              </pre>
            </div>
          )}

          {tab === 'tailwind' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Responsive percentage-positioned JSX + Tailwind CSS code snippet ready for React/Next.js.
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(tailwindCode)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied Snippet' : 'Copy Tailwind JSX'}</span>
                </button>
              </div>
              <pre className="thin-scrollbar max-h-[340px] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-indigo-200 dark:border-white/10">
                <code>{tailwindCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
