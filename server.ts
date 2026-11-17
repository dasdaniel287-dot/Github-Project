import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'CanvasFlow AI' });
  });

  app.post('/api/ai-layout', async (req, res) => {
    try {
      const { prompt, width = 1080, height = 1080 } = req.body ?? {};
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Please provide a design prompt.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'GEMINI_API_KEY is not configured. Add your Gemini API key in Settings > Secrets to generate AI layouts.',
        });
        return;
      }

      const systemInstruction = `You are a senior graphic designer and layout architect for CanvasFlow AI.
Given a user's design prompt and target artboard dimensions (${width}x${height} px), generate a cohesive, balanced, publication-grade graphic design composition.

Rules for coordinates & composition:
- Every element must fit cleanly inside the artboard (0 <= x <= ${width}, 0 <= y <= ${height}) with generous outer margins (at least 5-8% of width/height).
- Use strong visual hierarchy: background decorative shapes/cards first (lower index), then foreground shapes/badges/dividers, then crisp typography (eyebrow/kicker, bold display headline, concise subtitle/body, CTA button or metadata footer).
- Ensure high contrast between text colors and underlying background/card fills (WCAG AA+).
- Use fonts strictly from: "Plus Jakarta Sans", "DM Sans", "Outfit", "Manrope", "Playfair Display", "Lora", "JetBrains Mono", "Space Mono".
- Supported element types: "rect", "circle", "star", "line", "text".
- For "text" elements: provide realistic, domain-authentic copy matching the prompt (no lorem ipsum), appropriate fontSize proportional to the ${width}x${height} canvas, width wide enough so lines wrap gracefully, and colorRole ("text", "mutedText", "primary", "accent", or "background" when text sits on an accent button).
- For "rect" elements: use subtle cornerRadius (e.g., 12, 16, 24) for modern UI cards or CTA pills, or 0 for geometric blocks.
- For "line" elements: use x, y as start point, width as horizontal length (and height as 0 or strokeWidth), stroke for color, strokeWidth between 1 and 6.
- Include 6 to 12 well-composed elements so the layout feels complete, intentional, and editable.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Design request: "${prompt.trim()}"\nTarget canvas dimensions: ${width}px wide by ${height}px tall.`,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Short 2-4 word project title for the generated design.',
              },
              backgroundColor: {
                type: Type.STRING,
                description: 'Hex color for the artboard background (e.g. #0B1221).',
              },
              palette: {
                type: Type.OBJECT,
                properties: {
                  background: { type: Type.STRING },
                  surface: { type: Type.STRING },
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                  accent: { type: Type.STRING },
                  text: { type: Type.STRING },
                  mutedText: { type: Type.STRING },
                },
                required: ['background', 'surface', 'primary', 'secondary', 'accent', 'text', 'mutedText'],
              },
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: 'One of: rect, circle, star, line, text',
                    },
                    name: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    rotation: { type: Type.NUMBER },
                    opacity: { type: Type.NUMBER },
                    fill: { type: Type.STRING },
                    stroke: { type: Type.STRING },
                    strokeWidth: { type: Type.NUMBER },
                    cornerRadius: { type: Type.NUMBER },
                    colorRole: {
                      type: Type.STRING,
                      description: 'Optional semantic role: background, surface, primary, secondary, accent, text, mutedText',
                    },
                    text: { type: Type.STRING },
                    fontSize: { type: Type.NUMBER },
                    fontFamily: { type: Type.STRING },
                    fontWeight: { type: Type.STRING },
                    align: { type: Type.STRING },
                    lineHeight: { type: Type.NUMBER },
                    letterSpacing: { type: Type.NUMBER },
                    numPoints: { type: Type.NUMBER },
                    shadowEnabled: { type: Type.BOOLEAN },
                    shadowBlur: { type: Type.NUMBER },
                  },
                  required: ['type', 'name', 'x', 'y', 'width', 'height'],
                },
              },
            },
            required: ['title', 'backgroundColor', 'palette', 'elements'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'The AI model returned an empty layout response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate AI layout.';
      console.error('AI layout generation error:', err);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CanvasFlow AI running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
