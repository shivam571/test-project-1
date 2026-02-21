# RecipeSnap - Testing Checklist

## System Requirements
- [ ] Browser: Chrome 96+ or Edge 96+
- [ ] WebAssembly support
- [ ] SharedArrayBuffer (COOP/COEP headers)
- [ ] OPFS support
- [ ] Camera permission available
- [ ] Microphone permission available
- [ ] RAM: 2GB minimum, 4GB+ recommended

## Initial Setup Tests

### App Loading
- [ ] App loads without errors
- [ ] SDK initializes successfully
- [ ] "Loading RunAnywhere SDK..." appears
- [ ] Acceleration mode badge shows (WebGPU or CPU)
- [ ] RecipeSnap tab is active by default

### Tab Navigation
- [ ] RecipeSnap tab displays correctly
- [ ] Can switch to Chat tab
- [ ] Can switch to Vision tab
- [ ] Can switch to Voice tab
- [ ] Active tab is highlighted
- [ ] Tab content switches correctly

## RecipeSnap Feature Tests

### 1. Model Loading & Banner
- [ ] VLM model banner appears when needed
- [ ] Click "Load Model" button works
- [ ] Download progress bar shows percentage
- [ ] Model successfully downloads and loads
- [ ] Banner disappears after model loads
- [ ] Error messages display if model fails

### 2. Camera & Ingredient Scanning

#### Camera Access
- [ ] "Open Camera" button appears
- [ ] Clicking opens camera permission dialog
- [ ] Camera feed displays after permission granted
- [ ] Video preview shows in rounded container
- [ ] Camera uses rear/environment camera (mobile)
- [ ] Camera permission denial shows error

#### Scanning Ingredients
- [ ] "📸 Scan Ingredients" button appears over video
- [ ] Button disabled while scanning
- [ ] "Scanning..." text appears during process
- [ ] VLM model loads if not already loaded
- [ ] Frame captured at correct resolution (384px)
- [ ] AI processes image successfully

#### Detection Results
- [ ] Detected ingredients display in chips
- [ ] Ingredient chips are styled (orange, rounded)
- [ ] Multiple ingredients detected correctly
- [ ] Ingredients filtered (no "unable", "cannot" text)
- [ ] Camera stops after successful scan
- [ ] Empty/unclear images handled gracefully

### 3. Manual Ingredient Input
- [ ] Manual ingredient input field displays
- [ ] Can type comma-separated ingredients
- [ ] Input field accepts text correctly
- [ ] Ingredients combine with detected ones
- [ ] Placeholder text is helpful

### 4. Recipe Generation

#### LLM Processing
- [ ] "✨ Generate Recipe" button enabled with ingredients
- [ ] Button disabled without ingredients
- [ ] "🔄 Generating Recipe..." shows during generation
- [ ] LLM model loads if not already loaded
- [ ] Recipe generates in 5-15 seconds
- [ ] Loading state prevents multiple clicks

#### Recipe Display
- [ ] Recipe name displays prominently
- [ ] Cook time shows correctly
- [ ] Difficulty level shows (Easy/Medium/Hard)
- [ ] Ingredients list formatted properly
- [ ] Steps numbered correctly (1, 2, 3...)
- [ ] Nutrition info displays
- [ ] Recipe formatted nicely with cards

#### Recipe Quality
- [ ] Recipe uses detected ingredients
- [ ] Recipe is practical and realistic
- [ ] Steps are logical and sequential
- [ ] Instructions are clear
- [ ] No hallucinated ingredients (uses what you have)

### 5. Step Navigation (Manual)
- [ ] Current step highlighted in orange
- [ ] Step counter shows "Step X / Total"
- [ ] "Previous" button works
- [ ] "Next" button works
- [ ] First step: Previous disabled
- [ ] Last step: Next disabled
- [ ] Completed steps show green checkmark
- [ ] Active step has orange border

### 6. Voice Cooking Mode

#### Starting Voice Mode
- [ ] "🎙️ Start Voice Cooking" button appears
- [ ] Voice models load (VAD, STT, TTS, LLM)
- [ ] First step reads aloud automatically
- [ ] TTS voice is clear and natural
- [ ] Microphone permission requested
- [ ] Microphone permission granted successfully

#### Voice Listening
- [ ] "Listening..." indicator appears
- [ ] Pulse animation shows activity
- [ ] Audio level indicator responsive
- [ ] VAD detects speech start/end
- [ ] Background noise filtered
- [ ] Silence doesn't trigger false commands

#### Voice Commands
- [ ] "Next step" advances to next instruction
- [ ] "Previous step" / "go back" returns to previous
- [ ] "Repeat step" / "repeat" reads current step again
- [ ] "Substitute for [ingredient]" gives alternatives
- [ ] "Give me a tip" provides cooking advice
- [ ] Other questions answered intelligently
- [ ] AI responds in 1-2 sentences (concise)

#### Voice Feedback
- [ ] Transcription displays (what you said)
- [ ] AI response displays (what it said)
- [ ] Response is spoken aloud via TTS
- [ ] Text and audio match
- [ ] Feedback clears between commands
- [ ] UI updates during processing

#### Voice Navigation Integration
- [ ] Voice "next" updates step counter
- [ ] Visual step highlights sync with voice
- [ ] Can mix voice and manual navigation
- [ ] Step completion marks update

#### Stopping Voice Mode
- [ ] "⏹️ Stop Voice Mode" button works
- [ ] Microphone stops listening
- [ ] Returns to recipe-ready state
- [ ] Can restart voice mode
- [ ] Manual controls re-enabled

### 7. New Recipe Flow
- [ ] "🔄 New Recipe" button appears
- [ ] Clicking resets all state
- [ ] Returns to ingredient scanning
- [ ] Detected ingredients cleared
- [ ] Custom ingredients cleared
- [ ] Recipe cleared
- [ ] Step counter reset to 0

### 8. Error Handling

#### Camera Errors
- [ ] Camera permission denied shows error
- [ ] No camera available shows error
- [ ] Camera in use by another app handled
- [ ] Error message is user-friendly

#### VLM Errors
- [ ] Model download failure shows error
- [ ] Model load failure shows error
- [ ] WASM memory errors recovered
- [ ] Network errors for model download handled

#### LLM Errors
- [ ] Generation failure shows error
- [ ] Incomplete generation handled
- [ ] Malformed recipe parsing works
- [ ] Empty response handled

#### Voice Errors
- [ ] Microphone permission denied handled
- [ ] STT failure shows error
- [ ] TTS failure shows error (but continues)
- [ ] VAD failure handled
- [ ] Pipeline errors don't crash app

### 9. UI/UX Quality

#### Layout & Styling
- [ ] Dark theme applied consistently
- [ ] Orange accent color (#FF5500) used
- [ ] Rounded corners (12px radius)
- [ ] Proper spacing and padding
- [ ] Responsive on mobile
- [ ] Readable font sizes
- [ ] High contrast text

#### Animations & Feedback
- [ ] Buttons have hover states
- [ ] Disabled buttons dimmed (40% opacity)
- [ ] Loading spinners smooth
- [ ] Progress bars animate
- [ ] Pulse animations work
- [ ] Transitions smooth (0.2-0.3s)

#### Accessibility
- [ ] Buttons have clear labels
- [ ] Icons complement text
- [ ] Color not only indicator
- [ ] Focus states visible
- [ ] Keyboard navigation works

### 10. Performance

#### Model Loading
- [ ] VLM loads in reasonable time (~5-10s)
- [ ] LLM loads in reasonable time (~3-5s)
- [ ] Voice models load together (~10-15s)
- [ ] Models cached after first load
- [ ] Second load instant (from OPFS)

#### Inference Speed
- [ ] VLM inference < 5 seconds
- [ ] LLM generation 5-15 seconds
- [ ] STT transcription < 2 seconds
- [ ] TTS synthesis < 1 second
- [ ] VAD real-time (no lag)

#### Memory Usage
- [ ] App doesn't crash with multiple recipes
- [ ] Models coexist (Language + Audio)
- [ ] No memory leaks with voice mode
- [ ] Can run for extended session

### 11. Privacy & Offline

#### Data Privacy
- [ ] Images never sent to server
- [ ] Transcripts never sent to server
- [ ] Recipes never sent to server
- [ ] All processing on-device
- [ ] No network requests for inference

#### Offline Capability
- [ ] Works without internet (after models cached)
- [ ] Can disconnect network mid-session
- [ ] Airplane mode works
- [ ] Models persist across browser restart

### 12. Browser Compatibility

#### Desktop
- [ ] Chrome (latest)
- [ ] Chrome (96+)
- [ ] Edge (latest)
- [ ] Edge (96+)

#### Mobile (if applicable)
- [ ] Chrome Android
- [ ] Safari iOS (if supported)
- [ ] Mobile camera works
- [ ] Mobile mic works
- [ ] Touch controls work

### 13. Multi-Tab Functionality

#### Compare Features
- [ ] RecipeSnap tab complete
- [ ] Chat tab still works
- [ ] Vision tab still works
- [ ] Voice tab still works
- [ ] Can switch between all tabs
- [ ] Models share correctly

## Edge Cases & Stress Tests

### Unusual Inputs
- [ ] Empty fridge/no ingredients detected
- [ ] Non-food items in camera
- [ ] Very dark/bright lighting
- [ ] Blurry camera image
- [ ] 50+ ingredients detected
- [ ] Single ingredient only
- [ ] Ingredients in multiple languages

### Unusual Usage
- [ ] Start voice mode on step 5
- [ ] Generate 5 recipes in a row
- [ ] Switch tabs during generation
- [ ] Stop voice mid-sentence
- [ ] Very long voice command (30s)
- [ ] Rapid next/previous clicking
- [ ] Voice commands while AI speaking

### Recovery
- [ ] Refresh page mid-recipe
- [ ] Browser back button
- [ ] Model unload/reload
- [ ] Clear OPFS cache
- [ ] Re-grant permissions

## Regression Tests (Original Features)

### Chat Tab
- [ ] Can send messages
- [ ] Streaming works
- [ ] Cancel works
- [ ] Stats display

### Vision Tab
- [ ] Camera works
- [ ] Single shot works
- [ ] Live mode works
- [ ] Custom prompts work

### Voice Tab
- [ ] Listening works
- [ ] Pipeline works
- [ ] Turn-taking works
- [ ] Audio playback works

## Notes & Observations

### What Works Well
- 

### Known Issues
- 

### Improvements Needed
- 

### Browser-Specific Issues
- 

## Test Results Summary

**Date Tested:**
**Browser:** 
**OS:**
**Pass Rate:** ___ / ___ tests

**Overall Status:** ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
