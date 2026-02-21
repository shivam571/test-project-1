import { useState, useRef, useEffect, useCallback } from 'react';
import { ModelCategory, VoicePipeline, ModelManager } from '@runanywhere/web';
import { VideoCapture, VLMWorkerBridge, TextGeneration } from '@runanywhere/web-llamacpp';
import { AudioCapture, AudioPlayback, VAD, SpeechActivity } from '@runanywhere/web-onnx';
import { useModelLoader } from '../hooks/useModelLoader';
import { ModelBanner } from './ModelBanner';

const CAPTURE_DIM = 384;

type RecipeState = 'idle' | 'scanning' | 'generating-recipe' | 'recipe-ready' | 'cooking-voice';

interface Ingredient {
  name: string;
  quantity?: string;
}

interface Recipe {
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  cookTime?: string;
  difficulty?: string;
  nutrition?: string;
}

export function RecipeSnapTab() {
  // Model loaders
  const vlmLoader = useModelLoader(ModelCategory.Multimodal);
  const llmLoader = useModelLoader(ModelCategory.Language, true);
  const sttLoader = useModelLoader(ModelCategory.SpeechRecognition, true);
  const ttsLoader = useModelLoader(ModelCategory.SpeechSynthesis, true);
  const vadLoader = useModelLoader(ModelCategory.Audio, true);

  // State
  const [state, setState] = useState<RecipeState>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [customIngredients, setCustomIngredients] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const videoMountRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<VideoCapture | null>(null);
  const micRef = useRef<AudioCapture | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const vadUnsub = useRef<(() => void) | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (captureRef.current) {
        captureRef.current.stop();
        captureRef.current.videoElement.parentNode?.removeChild(captureRef.current.videoElement);
      }
      micRef.current?.stop();
      vadUnsub.current?.();
    };
  }, []);

  // ------------------------------------------------------------------
  // Step 1: Camera + VLM - Scan Ingredients
  // ------------------------------------------------------------------
  const startCamera = useCallback(async () => {
    if (captureRef.current?.isCapturing) return;

    const cam = new VideoCapture({ facingMode: 'environment' });
    await cam.start();
    captureRef.current = cam;

    const mount = videoMountRef.current;
    if (mount) {
      const el = cam.videoElement;
      el.style.width = '100%';
      el.style.borderRadius = '12px';
      mount.appendChild(el);
    }

    setCameraActive(true);
  }, []);

  const scanIngredients = useCallback(async () => {
    const cam = captureRef.current;
    if (!cam?.isCapturing) {
      await startCamera();
      return;
    }

    setState('scanning');
    setError(null);

    try {
      // Ensure VLM loaded
      if (vlmLoader.state !== 'ready') {
        await vlmLoader.ensure();
      }

      const frame = cam.captureFrame(CAPTURE_DIM);
      if (!frame) throw new Error('Failed to capture frame');

      const bridge = VLMWorkerBridge.shared;
      if (!bridge.isModelLoaded) {
        throw new Error('VLM model not loaded');
      }

      const prompt = 'List all the food ingredients you can see in this image. Only list the ingredient names, one per line. Be specific.';
      const result = await bridge.process(
        frame.rgbPixels,
        frame.width,
        frame.height,
        prompt,
        { maxTokens: 100, temperature: 0.3 }
      );

      // Parse ingredients from response
      const ingredients = result.text
        .split('\n')
        .map(line => line.trim().replace(/^[-•*]\s*/, ''))
        .filter(line => line.length > 0 && !line.toLowerCase().includes('cannot') && !line.toLowerCase().includes('unable'));

      setDetectedIngredients(ingredients);
      setState('idle');

      // Stop camera after scan
      if (cam) {
        cam.stop();
        cam.videoElement.parentNode?.removeChild(cam.videoElement);
        captureRef.current = null;
        setCameraActive(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('idle');
    }
  }, [vlmLoader, startCamera]);

  // ------------------------------------------------------------------
  // Step 2: LLM - Generate Recipe
  // ------------------------------------------------------------------
  const generateRecipe = useCallback(async () => {
    const allIngredients = [
      ...detectedIngredients,
      ...customIngredients.split(',').map(s => s.trim()).filter(Boolean)
    ];

    if (allIngredients.length === 0) {
      setError('Please scan or add ingredients first');
      return;
    }

    setState('generating-recipe');
    setError(null);

    try {
      // Ensure LLM loaded
      if (llmLoader.state !== 'ready') {
        await llmLoader.ensure();
      }

      const prompt = `You are an expert chef. Given these ingredients: ${allIngredients.join(', ')}.

Create a delicious recipe using as many of these ingredients as possible. Format your response EXACTLY like this:

RECIPE NAME: [name]
COOK TIME: [time]
DIFFICULTY: [Easy/Medium/Hard]

INGREDIENTS:
- [ingredient 1]
- [ingredient 2]

STEPS:
1. [step 1]
2. [step 2]

NUTRITION: [brief nutrition info]

Keep it practical and tasty!`;

      const { text } = await TextGeneration.generate(prompt, {
        maxTokens: 400,
        temperature: 0.7,
        systemPrompt: 'You are a professional chef helping home cooks create delicious meals.'
      });

      // Parse the recipe
      const parsed = parseRecipeText(text);
      setRecipe(parsed);
      setState('recipe-ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('idle');
    }
  }, [detectedIngredients, customIngredients, llmLoader]);

  const parseRecipeText = (text: string): Recipe => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    let name = 'Delicious Recipe';
    let cookTime = 'Unknown';
    let difficulty = 'Medium';
    let nutrition = 'N/A';
    const ingredients: Ingredient[] = [];
    const steps: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('RECIPE NAME:')) {
        name = line.replace('RECIPE NAME:', '').trim();
      } else if (line.startsWith('COOK TIME:')) {
        cookTime = line.replace('COOK TIME:', '').trim();
      } else if (line.startsWith('DIFFICULTY:')) {
        difficulty = line.replace('DIFFICULTY:', '').trim();
      } else if (line.startsWith('NUTRITION:')) {
        nutrition = line.replace('NUTRITION:', '').trim();
      } else if (line === 'INGREDIENTS:') {
        currentSection = 'ingredients';
      } else if (line === 'STEPS:') {
        currentSection = 'steps';
      } else if (currentSection === 'ingredients' && line.startsWith('-')) {
        ingredients.push({ name: line.replace(/^-\s*/, '') });
      } else if (currentSection === 'steps' && /^\d+\./.test(line)) {
        steps.push(line.replace(/^\d+\.\s*/, ''));
      }
    }

    return { name, ingredients, steps, cookTime, difficulty, nutrition };
  };

  // ------------------------------------------------------------------
  // Step 3: Voice - Cooking Assistant
  // ------------------------------------------------------------------
  const ensureVoiceModels = useCallback(async (): Promise<boolean> => {
    const results = await Promise.all([
      vadLoader.ensure(),
      sttLoader.ensure(),
      llmLoader.ensure(),
      ttsLoader.ensure(),
    ]);
    return results.every(Boolean);
  }, [vadLoader, sttLoader, llmLoader, ttsLoader]);

  const startVoiceCooking = useCallback(async () => {
    if (!recipe) return;

    setVoiceTranscript('');
    setVoiceResponse('');
    setError(null);

    // Load voice models if needed
    const anyMissing = !ModelManager.getLoadedModel(ModelCategory.Audio)
      || !ModelManager.getLoadedModel(ModelCategory.SpeechRecognition)
      || !ModelManager.getLoadedModel(ModelCategory.SpeechSynthesis);

    if (anyMissing) {
      const ok = await ensureVoiceModels();
      if (!ok) {
        setError('Failed to load voice models');
        return;
      }
    }

    setState('cooking-voice');

    // Start with reading current step
    const stepText = `Step ${currentStep + 1}: ${recipe.steps[currentStep]}`;
    setVoiceResponse(stepText);

    try {
      const tts = await import('@runanywhere/web-onnx').then(m => m.TTS);
      const result = await tts.synthesize(stepText, { speed: 1.0 });
      const player = new AudioPlayback({ sampleRate: result.sampleRate });
      await player.play(result.audio as Float32Array, result.sampleRate);
      player.dispose();
    } catch (err) {
      console.error('TTS error:', err);
    }

    // Start listening for voice commands
    const mic = new AudioCapture({ sampleRate: 16000 });
    micRef.current = mic;

    if (!pipelineRef.current) {
      pipelineRef.current = new VoicePipeline();
    }

    VAD.reset();

    vadUnsub.current = VAD.onSpeechActivity((activity) => {
      if (activity === SpeechActivity.Ended) {
        const segment = VAD.popSpeechSegment();
        if (segment && segment.samples.length > 1600) {
          processVoiceCommand(segment.samples as Float32Array);
        }
      }
    });

    await mic.start(
      (chunk) => { VAD.processSamples(chunk); },
      (level) => { setAudioLevel(level); }
    );
  }, [recipe, currentStep, ensureVoiceModels]);

  const processVoiceCommand = useCallback(async (audioData: Float32Array) => {
    const pipeline = pipelineRef.current;
    if (!pipeline || !recipe) return;

    micRef.current?.stop();
    vadUnsub.current?.();

    try {
      const systemPrompt = `You are a cooking assistant helping someone follow a recipe. They are on step ${currentStep + 1} of ${recipe.steps.length}. Current step: "${recipe.steps[currentStep]}". Available commands: next step, repeat step, ingredient substitution, cooking tip. Respond in 1-2 sentences.`;

      const result = await pipeline.processTurn(audioData, {
        maxTokens: 50,
        temperature: 0.7,
        systemPrompt
      }, {
        onTranscription: (text) => setVoiceTranscript(text),
        onResponseToken: (_token, accumulated) => setVoiceResponse(accumulated),
        onResponseComplete: (text) => {
          setVoiceResponse(text);
          // Check for navigation commands
          if (text.toLowerCase().includes('next step') || voiceTranscript.toLowerCase().includes('next')) {
            setTimeout(() => nextStep(), 1000);
          } else if (text.toLowerCase().includes('previous') || voiceTranscript.toLowerCase().includes('back')) {
            setTimeout(() => prevStep(), 1000);
          }
        },
        onSynthesisComplete: async (audio, sampleRate) => {
          const player = new AudioPlayback({ sampleRate });
          await player.play(audio, sampleRate);
          player.dispose();
        }
      });

      if (result) {
        setVoiceTranscript(result.transcription);
        setVoiceResponse(result.response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    // Restart listening
    if (state === 'cooking-voice') {
      const mic = new AudioCapture({ sampleRate: 16000 });
      micRef.current = mic;
      VAD.reset();
      await mic.start(
        (chunk) => { VAD.processSamples(chunk); },
        (level) => { setAudioLevel(level); }
      );
    }
  }, [recipe, currentStep, state, voiceTranscript]);

  const stopVoiceCooking = useCallback(() => {
    micRef.current?.stop();
    vadUnsub.current?.();
    setState('recipe-ready');
    setAudioLevel(0);
  }, []);

  const nextStep = useCallback(() => {
    if (recipe && currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [recipe, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const resetRecipe = useCallback(() => {
    setRecipe(null);
    setDetectedIngredients([]);
    setCustomIngredients('');
    setCurrentStep(0);
    setState('idle');
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const pendingLoader = vlmLoader.state !== 'ready' ? vlmLoader :
                        llmLoader.state !== 'ready' ? llmLoader : null;

  return (
    <div className="tab-panel recipe-snap-panel">
      <div className="recipe-header">
        <h2>🍳 RecipeSnap</h2>
        <p className="recipe-subtitle">AI-Powered Cooking Assistant</p>
      </div>

      {pendingLoader && state === 'idle' && (
        <ModelBanner
          state={pendingLoader.state}
          progress={pendingLoader.progress}
          error={pendingLoader.error}
          onLoad={pendingLoader.ensure}
          label={pendingLoader === vlmLoader ? 'VLM' : 'LLM'}
        />
      )}

      {error && <div className="error-banner">{error}</div>}

      {/* Step 1: Scan Ingredients */}
      {!recipe && (
        <div className="recipe-section">
          <h3>📸 Step 1: Scan Ingredients</h3>
          
          {!cameraActive ? (
            <div className="camera-placeholder">
              <p>Take a photo of your fridge or pantry</p>
              <button className="btn btn-primary" onClick={startCamera}>
                Open Camera
              </button>
            </div>
          ) : (
            <div className="camera-view">
              <div ref={videoMountRef} />
              <button 
                className="btn btn-primary btn-scan" 
                onClick={scanIngredients}
                disabled={state === 'scanning'}
              >
                {state === 'scanning' ? 'Scanning...' : '📸 Scan Ingredients'}
              </button>
            </div>
          )}

          {detectedIngredients.length > 0 && (
            <div className="ingredients-detected">
              <h4>✅ Detected Ingredients:</h4>
              <div className="ingredient-chips">
                {detectedIngredients.map((ing, idx) => (
                  <span key={idx} className="ingredient-chip">{ing}</span>
                ))}
              </div>
            </div>
          )}

          <div className="manual-ingredients">
            <h4>➕ Add More Ingredients (optional):</h4>
            <input
              type="text"
              placeholder="e.g., salt, pepper, olive oil (comma separated)"
              value={customIngredients}
              onChange={(e) => setCustomIngredients(e.target.value)}
              className="ingredient-input"
            />
          </div>

          <button
            className="btn btn-primary btn-generate"
            onClick={generateRecipe}
            disabled={state === 'generating-recipe' || (detectedIngredients.length === 0 && !customIngredients.trim())}
          >
            {state === 'generating-recipe' ? '🔄 Generating Recipe...' : '✨ Generate Recipe'}
          </button>
        </div>
      )}

      {/* Step 2: Display Recipe */}
      {recipe && (state === 'recipe-ready' || state === 'cooking-voice') && (
        <div className="recipe-display">
          <div className="recipe-header-section">
            <h3>{recipe.name}</h3>
            <div className="recipe-meta">
              <span>⏱️ {recipe.cookTime}</span>
              <span>📊 {recipe.difficulty}</span>
            </div>
          </div>

          <div className="recipe-ingredients">
            <h4>Ingredients:</h4>
            <ul>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx}>{ing.name}</li>
              ))}
            </ul>
          </div>

          <div className="recipe-steps">
            <h4>Instructions:</h4>
            {recipe.steps.map((step, idx) => (
              <div 
                key={idx} 
                className={`recipe-step ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              >
                <span className="step-number">{idx + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          {recipe.nutrition && (
            <div className="recipe-nutrition">
              <h4>Nutrition Info:</h4>
              <p>{recipe.nutrition}</p>
            </div>
          )}

          <div className="recipe-actions">
            {state !== 'cooking-voice' ? (
              <>
                <button className="btn btn-primary btn-voice" onClick={startVoiceCooking}>
                  🎙️ Start Voice Cooking
                </button>
                <button className="btn" onClick={resetRecipe}>
                  🔄 New Recipe
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-danger" onClick={stopVoiceCooking}>
                  ⏹️ Stop Voice Mode
                </button>
                <div className="voice-indicator" style={{ '--level': audioLevel } as React.CSSProperties}>
                  <div className="pulse" />
                  <span>Listening...</span>
                </div>
              </>
            )}
          </div>

          {state === 'cooking-voice' && (
            <div className="voice-feedback">
              {voiceTranscript && (
                <div className="voice-transcript">
                  <strong>You:</strong> {voiceTranscript}
                </div>
              )}
              {voiceResponse && (
                <div className="voice-response">
                  <strong>Chef AI:</strong> {voiceResponse}
                </div>
              )}
            </div>
          )}

          {state === 'recipe-ready' && (
            <div className="step-navigation">
              <button 
                className="btn" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                ← Previous
              </button>
              <span className="step-counter">
                Step {currentStep + 1} / {recipe.steps.length}
              </span>
              <button 
                className="btn" 
                onClick={nextStep}
                disabled={currentStep === recipe.steps.length - 1}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
