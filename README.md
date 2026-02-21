# RecipeSnap - AI-Powered Cooking Assistant

A revolutionary web app using **RunAnywhere SDK** that brings on-device AI to your kitchen. RecipeSnap combines Vision, Language, and Voice AI to create the ultimate hands-free cooking experience — 100% private, offline-capable, running entirely in your browser.

## Features

### 1. Smart Ingredient Detection (VLM)
- **Scan Your Fridge**: Take a photo of your fridge or pantry
- **AI Recognition**: VLM identifies all visible ingredients automatically
- **Manual Addition**: Add extra ingredients manually (spices, oils, etc.)
- **Privacy First**: Images never leave your device

### 2. Intelligent Recipe Generation (LLM)
- **Personalized Recipes**: AI creates recipes using your available ingredients
- **Detailed Instructions**: Step-by-step cooking guide
- **Nutritional Info**: Get basic nutrition information
- **Multiple Options**: Generate different recipes from the same ingredients

### 3. Voice-Controlled Cooking (VAD + STT + TTS)
- **Hands-Free Operation**: Perfect when your hands are messy
- **Natural Commands**: 
  - "Next step" - Move to the next instruction
  - "Repeat step" - Hear the current step again
  - "Substitution for X" - Get ingredient alternatives
  - "Cooking tip" - Get helpful advice
- **Real-Time Listening**: Voice Activity Detection knows when you're speaking
- **Natural Voice Response**: AI speaks back with clear, natural TTS

### 4. Smart Features
- **Visual Progress**: See which steps are completed
- **Step Navigation**: Manually move between steps
- **Recipe Metadata**: Cook time, difficulty level, and nutrition
- **Cooking Tips**: Ask questions during cooking

## Original Demo Features

| Tab | What it does |
|-----|-------------|
| **🍳 RecipeSnap** | Full cooking assistant: scan ingredients, generate recipes, voice-guided cooking |
| **💬 Chat** | Stream text from an on-device LLM (LFM2 350M) |
| **📷 Vision** | Point your camera and describe what the VLM sees (LFM2-VL 450M) |
| **🎙️ Voice** | Speak naturally — VAD detects speech, STT transcribes, LLM responds, TTS speaks back |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port shown in terminal). 

**First Time Setup:**
1. Models download on first use (~250MB total)
2. Cached in browser's OPFS for instant reuse
3. Grant camera and microphone permissions when prompted

## How to Use RecipeSnap

### Step 1: Scan Ingredients
1. Click "Open Camera" to activate your device camera
2. Point at your fridge, pantry, or ingredients on counter
3. Click "📸 Scan Ingredients" to capture and analyze
4. AI will list all detected ingredients
5. (Optional) Add more ingredients manually

### Step 2: Generate Recipe
1. Review detected ingredients
2. Click "✨ Generate Recipe"
3. Wait 5-10 seconds for AI to create a personalized recipe
4. View recipe name, ingredients, steps, cook time, and nutrition

### Step 3: Voice Cooking Mode
1. Click "🎙️ Start Voice Cooking"
2. AI will read the first step aloud
3. Say commands like:
   - "Next step" - Move forward
   - "Repeat" - Hear current step again
   - "Substitute for chicken" - Get alternatives
   - "Give me a tip" - Get cooking advice
4. Navigate with voice or manual controls
5. Click "⏹️ Stop Voice Mode" when done

## How It Works

```
@runanywhere/web (npm package)
  ├── WASM engine (llama.cpp, whisper.cpp, sherpa-onnx)
  ├── Model management (download, OPFS cache, load/unload)
  └── TypeScript API (TextGeneration, STT, TTS, VAD, VLM, VoicePipeline)
```

The app imports everything from `@runanywhere/web`:

```typescript
import { RunAnywhere, TextGeneration, VLMWorkerBridge } from '@runanywhere/web';

await RunAnywhere.initialize({ environment: 'development' });

// Stream LLM text
const { stream } = await TextGeneration.generateStream('Hello!', { maxTokens: 200 });
for await (const token of stream) { console.log(token); }

// VLM: describe an image
const result = await VLMWorkerBridge.shared.process(rgbPixels, width, height, 'Describe this.');
```

## Project Structure

```
src/
├── main.tsx              # React root
├── App.tsx               # Tab navigation (Chat | Vision | Voice)
├── runanywhere.ts        # SDK init + model catalog + VLM worker
├── workers/
│   └── vlm-worker.ts     # VLM Web Worker entry (2 lines)
├── hooks/
│   └── useModelLoader.ts # Shared model download/load hook
├── components/
│   ├── ChatTab.tsx        # LLM streaming chat
│   ├── VisionTab.tsx      # Camera + VLM inference
│   ├── VoiceTab.tsx       # Full voice pipeline
│   └── ModelBanner.tsx    # Download progress UI
└── styles/
    └── index.css          # Dark theme CSS
```

## Adding Your Own Models

Edit the `MODELS` array in `src/runanywhere.ts`:

```typescript
{
  id: 'my-custom-model',
  name: 'My Model',
  repo: 'username/repo-name',           // HuggingFace repo
  files: ['model.Q4_K_M.gguf'],         // Files to download
  framework: LLMFramework.LlamaCpp,
  modality: ModelCategory.Language,      // or Multimodal, SpeechRecognition, etc.
  memoryRequirement: 500_000_000,        // Bytes
}
```

Any GGUF model compatible with llama.cpp works for LLM/VLM. STT/TTS/VAD use sherpa-onnx models.

## Deployment

### Vercel

```bash
npm run build
npx vercel --prod
```

The included `vercel.json` sets the required Cross-Origin-Isolation headers.

### Netlify

Add a `_headers` file:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: credentialless
```

### Any static host

Serve the `dist/` folder with these HTTP headers on all responses:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

## Browser Requirements

- Chrome 96+ or Edge 96+ (recommended: 120+)
- WebAssembly (required)
- SharedArrayBuffer (requires Cross-Origin Isolation headers)
- OPFS (for persistent model cache)

## Documentation

- [SDK API Reference](https://docs.runanywhere.ai)
- [npm package](https://www.npmjs.com/package/@runanywhere/web)
- [GitHub](https://github.com/RunanywhereAI/runanywhere-sdks)

## License

MIT
