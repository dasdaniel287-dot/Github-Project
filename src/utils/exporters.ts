import Konva from 'konva';
import { jsPDF } from 'jspdf';
import { Artboard, CanvasElement } from '../types/canvas';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownload(blobOrDataUrl: Blob | string, filename: string) {
  const url =
    typeof blobOrDataUrl === 'string'
      ? blobOrDataUrl
      : URL.createObjectURL(blobOrDataUrl);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof blobOrDataUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function renderStageArtboardDataUrl(
  stage: Konva.Stage,
  artboard: Artboard,
  mimeType: 'image/png' | 'image/jpeg',
  pixelRatio = 2
): string {
  // Save current viewport transform and transformer visibility
  const prevScale = { x: stage.scaleX(), y: stage.scaleY() };
  const prevPos = { x: stage.x(), y: stage.y() };
  const transformers = stage.find('Transformer');
  const guideLines = stage.find('.snap-guide');

  transformers.forEach((tr) => tr.hide());
  guideLines.forEach((g) => g.hide());

  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();

  const dataUrl = stage.toDataURL({
    x: 0,
    y: 0,
    width: artboard.width,
    height: artboard.height,
    pixelRatio,
    mimeType,
    quality: 0.96,
  });

  // Restore viewport
  stage.scale(prevScale);
  stage.position(prevPos);
  transformers.forEach((tr) => tr.show());
  guideLines.forEach((g) => g.show());
  stage.batchDraw();

  return dataUrl;
}

export function exportRasterImage(
  stage: Konva.Stage,
  artboard: Artboard,
  format: 'png' | 'jpg'
) {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = renderStageArtboardDataUrl(stage, artboard, mime, 2);
  const safeName = (artboard.name || 'canvasflow-design')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  triggerDownload(dataUrl, `${safeName}.${format}`);
}

export function exportToPDF(stage: Konva.Stage, artboard: Artboard) {
  const dataUrl = renderStageArtboardDataUrl(stage, artboard, 'image/jpeg', 2);
  const orientation = artboard.width >= artboard.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [artboard.width, artboard.height],
    hotfixes: ['px_scaling'],
  });
  pdf.addImage(dataUrl, 'JPEG', 0, 0, artboard.width, artboard.height);
  const safeName = (artboard.name || 'canvasflow-design')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  pdf.save(`${safeName}.pdf`);
}

function buildStarPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  numPoints: number
): string {
  const pts: string[] = [];
  const step = Math.PI / numPoints;
  for (let i = 0; i < 2 * numPoints; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return pts.join(' ');
}

function wrapTextLines(text: string, width: number, fontSize: number): string[] {
  const approxCharsPerLine = Math.max(8, Math.floor(width / (fontSize * 0.56)));
  const rawParagraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of rawParagraphs) {
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length <= approxCharsPerLine) {
        current = (current + ' ' + word).trim();
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

export function generateSVGCode(elements: CanvasElement[], artboard: Artboard): string {
  const visible = elements.filter((e) => e.visible);
  const hasShadow = visible.some((e) => e.shadowEnabled);

  const defs = hasShadow
    ? `  <defs>\n    <filter id="cf-shadow" x="-20%" y="-20%" width="140%" height="140%">\n      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.35" />\n    </filter>\n  </defs>\n`
    : '';

  const nodes = visible
    .map((el) => {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const transformAttr = el.rotation
        ? ` transform="rotate(${el.rotation.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`
        : '';
      const opacityAttr = el.opacity < 1 ? ` opacity="${el.opacity.toFixed(2)}"` : '';
      const filterAttr = el.shadowEnabled ? ` filter="url(#cf-shadow)"` : '';

      if (el.type === 'rect') {
        const stroke =
          el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
            ? ` stroke="${el.stroke}" stroke-width="${el.strokeWidth}"`
            : '';
        return `  <rect x="${Math.round(el.x)}" y="${Math.round(el.y)}" width="${Math.round(
          el.width
        )}" height="${Math.round(el.height)}" rx="${Math.round(el.cornerRadius)}" fill="${
          el.fill
        }"${stroke}${opacityAttr}${filterAttr}${transformAttr} />`;
      }

      if (el.type === 'circle') {
        const rx = el.width / 2;
        const ry = el.height / 2;
        const stroke =
          el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
            ? ` stroke="${el.stroke}" stroke-width="${el.strokeWidth}"`
            : '';
        return `  <ellipse cx="${Math.round(cx)}" cy="${Math.round(cy)}" rx="${Math.round(
          rx
        )}" ry="${Math.round(ry)}" fill="${el.fill}"${stroke}${opacityAttr}${filterAttr}${transformAttr} />`;
      }

      if (el.type === 'star') {
        const outerR = Math.min(el.width, el.height) / 2;
        const innerR = outerR * (el.innerRadiusRatio || 0.45);
        const pts = buildStarPoints(cx, cy, outerR, innerR, el.numPoints || 5);
        const stroke =
          el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
            ? ` stroke="${el.stroke}" stroke-width="${el.strokeWidth}"`
            : '';
        return `  <polygon points="${pts}" fill="${el.fill}"${stroke}${opacityAttr}${filterAttr}${transformAttr} />`;
      }

      if (el.type === 'line') {
        return `  <line x1="${Math.round(el.x)}" y1="${Math.round(el.y)}" x2="${Math.round(
          el.x + el.width
        )}" y2="${Math.round(el.y)}" stroke="${el.stroke}" stroke-width="${
          el.strokeWidth
        }" stroke-linecap="round"${opacityAttr}${transformAttr} />`;
      }

      if (el.type === 'icon') {
        const scaleX = el.width / el.viewBoxSize;
        const scaleY = el.height / el.viewBoxSize;
        return `  <g transform="translate(${Math.round(el.x)}, ${Math.round(el.y)}) scale(${scaleX.toFixed(
          2
        )}, ${scaleY.toFixed(2)})${
          el.rotation ? ` rotate(${el.rotation.toFixed(1)} ${el.viewBoxSize / 2} ${el.viewBoxSize / 2})` : ''
        }"${opacityAttr}>\n    <path d="${el.pathData}" fill="${el.fill}" stroke="${
          el.stroke
        }" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />\n  </g>`;
      }

      if (el.type === 'text') {
        const lines = wrapTextLines(el.text, el.width, el.fontSize);
        const textAnchor =
          el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
        const anchorX =
          el.align === 'center'
            ? el.x + el.width / 2
            : el.align === 'right'
            ? el.x + el.width
            : el.x;
        const lineAdvance = el.fontSize * (el.lineHeight || 1.2);
        const tspans = lines
          .map(
            (line, i) =>
              `<tspan x="${Math.round(anchorX)}" dy="${
                i === 0 ? Math.round(el.fontSize * 0.9) : Math.round(lineAdvance)
              }">${escapeXml(line)}</tspan>`
          )
          .join('');

        return `  <text x="${Math.round(anchorX)}" y="${Math.round(
          el.y
        )}" font-family="${escapeXml(el.fontFamily)}, sans-serif" font-size="${Math.round(
          el.fontSize
        )}" font-weight="${el.fontWeight}" letter-spacing="${
          el.letterSpacing
        }" text-anchor="${textAnchor}" fill="${el.fill}"${opacityAttr}${transformAttr}>${tspans}</text>`;
      }

      if (el.type === 'image') {
        return `  <image x="${Math.round(el.x)}" y="${Math.round(el.y)}" width="${Math.round(
          el.width
        )}" height="${Math.round(el.height)}" href="${escapeXml(
          el.src
        )}" preserveAspectRatio="xMidYMid slice"${opacityAttr}${transformAttr} />`;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${artboard.width} ${artboard.height}" width="${artboard.width}" height="${artboard.height}">\n${defs}  <rect width="100%" height="100%" fill="${artboard.backgroundColor}" />\n${nodes}\n</svg>`;
}

export function downloadSVG(elements: CanvasElement[], artboard: Artboard) {
  const svg = generateSVGCode(elements, artboard);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const safeName = (artboard.name || 'canvasflow-design')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  triggerDownload(blob, `${safeName}.svg`);
}

export function generateTailwindCode(elements: CanvasElement[], artboard: Artboard): string {
  const visible = elements.filter((e) => e.visible);

  const children = visible
    .map((el) => {
      const leftPct = ((el.x / artboard.width) * 100).toFixed(2);
      const topPct = ((el.y / artboard.height) * 100).toFixed(2);
      const widthPct = ((el.width / artboard.width) * 100).toFixed(2);
      const heightPct = ((el.height / artboard.height) * 100).toFixed(2);
      const opacityCls =
        el.opacity < 1 ? ` opacity-[${el.opacity.toFixed(2)}]` : '';
      const rotateCls = el.rotation
        ? ` rotate-[${Math.round(el.rotation)}deg]`
        : '';
      const shadowCls = el.shadowEnabled ? ' shadow-2xl' : '';

      if (el.type === 'rect') {
        const borderCls =
          el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
            ? ` border-[${el.strokeWidth}px] border-[${el.stroke}]`
            : '';
        return `  {/* ${el.name} */}\n  <div\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] h-[${heightPct}%] bg-[${el.fill}] rounded-[${Math.round(
          el.cornerRadius
        )}px]${borderCls}${shadowCls}${opacityCls}${rotateCls}"\n  />`;
      }

      if (el.type === 'circle') {
        const borderCls =
          el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
            ? ` border-[${el.strokeWidth}px] border-[${el.stroke}]`
            : '';
        return `  {/* ${el.name} */}\n  <div\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] h-[${heightPct}%] bg-[${el.fill}] rounded-full${borderCls}${shadowCls}${opacityCls}${rotateCls}"\n  />`;
      }

      if (el.type === 'line') {
        return `  {/* ${el.name} */}\n  <div\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] h-[${Math.max(
          1,
          Math.round(el.strokeWidth)
        )}px] bg-[${el.stroke}]${opacityCls}${rotateCls}"\n  />`;
      }

      if (el.type === 'star') {
        const outerR = Math.min(el.width, el.height) / 2;
        const innerR = outerR * (el.innerRadiusRatio || 0.45);
        const pts = buildStarPoints(el.width / 2, el.height / 2, outerR, innerR, el.numPoints || 5);
        return `  {/* ${el.name} */}\n  <svg\n    viewBox="0 0 ${Math.round(el.width)} ${Math.round(
          el.height
        )}"\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] h-[${heightPct}%]${opacityCls}${rotateCls}"\n  >\n    <polygon points="${pts}" fill="${el.fill}" />\n  </svg>`;
      }

      if (el.type === 'icon') {
        return `  {/* ${el.name} */}\n  <svg\n    viewBox="0 0 ${el.viewBoxSize} ${el.viewBoxSize}"\n    fill="${el.fill}"\n    stroke="${el.stroke}"\n    strokeWidth={${el.strokeWidth}}\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] h-[${heightPct}%]${opacityCls}${rotateCls}"\n  >\n    <path d="${el.pathData}" strokeLinecap="round" strokeLinejoin="round" />\n  </svg>`;
      }

      if (el.type === 'text') {
        const alignCls =
          el.align === 'center'
            ? 'text-center'
            : el.align === 'right'
            ? 'text-right'
            : 'text-left';
        const weightMap: Record<string, string> = {
          '400': 'font-normal',
          '500': 'font-medium',
          '600': 'font-semibold',
          '700': 'font-bold',
          '800': 'font-extrabold',
        };
        const weightCls = weightMap[el.fontWeight] || 'font-semibold';
        return `  {/* ${el.name} */}\n  <p\n    style={{ fontFamily: "'${el.fontFamily}', sans-serif", fontSize: 'clamp(12px, ${(
          (el.fontSize / artboard.width) *
          100
        ).toFixed(2)}vw, ${Math.round(el.fontSize)}px)', lineHeight: ${
          el.lineHeight
        }, letterSpacing: '${el.letterSpacing}px' }}\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] text-[${
          el.fill
        }] ${weightCls} ${alignCls}${opacityCls}${rotateCls}"\n  >\n    ${el.text}\n  </p>`;
      }

      if (el.type === 'image') {
        return `  {/* ${el.name} */}\n  <img\n    src="${el.src.slice(0, 64)}${
          el.src.length > 64 ? '...' : ''
        }"\n    alt="${escapeXml(el.name)}"\n    className="absolute left-[${leftPct}%] top-[${topPct}%] w-[${widthPct}%] h-[${heightPct}%] object-cover rounded-[${Math.round(
          el.cornerRadius
        )}px]${opacityCls}${rotateCls}"\n  />`;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n\n');

  return `<div\n  className="relative w-full max-w-[${artboard.width}px] aspect-[${artboard.width}/${artboard.height}] overflow-hidden bg-[${artboard.backgroundColor}]"\n>\n${children}\n</div>`;
}
