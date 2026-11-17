export type ElementType = 'text' | 'rect' | 'circle' | 'star' | 'line' | 'icon' | 'image';

export type ColorRole =
  | 'background'
  | 'surface'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'text'
  | 'mutedText';

export type ToolMode = 'select' | 'pan';

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  colorRole?: ColorRole;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  fontStyle?: 'normal' | 'italic';
  fill: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface StarElement extends BaseElement {
  type: 'star';
  fill: string;
  stroke: string;
  strokeWidth: number;
  numPoints: number;
  innerRadiusRatio: number;
}

export interface LineElement extends BaseElement {
  type: 'line';
  stroke: string;
  strokeWidth: number;
  dash?: number[];
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
  pathData: string;
  viewBoxSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  cornerRadius: number;
}

export type CanvasElement =
  | TextElement
  | RectElement
  | CircleElement
  | StarElement
  | LineElement
  | IconElement
  | ImageElement;

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type NewCanvasElement = DistributiveOmit<CanvasElement, 'id'>;

export interface Artboard {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
}

export interface ArtboardPreset {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
}

export interface BrandPalette {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    mutedText: string;
  };
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  presetId: string;
  width: number;
  height: number;
  backgroundColor: string;
  paletteId: string;
  elements: NewCanvasElement[];
}
