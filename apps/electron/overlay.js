// Theme configurations matching packages/theme-engine/src/index.ts
const Themes = {
  airplane: {
    durationMs: 10000,
  },
  cat: {
    durationMs: 8500,
  },
  meme: {
    durationMs: 11000,
  },
  intern: {
    durationMs: 8000,
  },
  news: {
    durationMs: 8500,
  },
  pirate: {
    durationMs: 9000,
  },
  ninja: {
    durationMs: 5000,
  }
};

// Web Audio API Synthesizer for Premium Sound Effects
const NotificationSynth = {
  ctx: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playAirplaneSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Engine Propeller hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.4);

      // 2. Rising twin chimes
      this.playChime(now + 1.0, 523.25); // C5
      this.playChime(now + 1.15, 659.25); // E5
    } catch (e) {
      console.warn('AudioContext blocked or failed for airplane chime:', e);
    }
  },

  playCatSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.linearRampToValueAtTime(850, now + 0.12);
      osc.frequency.linearRampToValueAtTime(620, now + 0.35);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('AudioContext blocked or failed for cat sound:', e);
    }
  },

  playMemeSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // C major chord (arpeggiated C4 - E4 - G4 - C5)
      const freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (idx * 0.05));

        gain.gain.setValueAtTime(0, now + (idx * 0.05));
        gain.gain.linearRampToValueAtTime(0.08, now + (idx * 0.05) + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (idx * 0.05));
        osc.stop(now + 1.65);
      });
    } catch (e) {
      console.warn('AudioContext blocked or failed for meme sound:', e);
    }
  },

  playInternSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Footsteps sound (rapid tiny low frequency pops)
      for (let i = 0; i < 12; i++) {
        const time = now + (i * 0.15);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.08);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.09);
      }

      // 2. Slide whistle stumble (starts around 2s in animation)
      const whistleTime = now + 1.8;
      const oscW = ctx.createOscillator();
      const gainW = ctx.createGain();
      oscW.type = 'sine';
      oscW.frequency.setValueAtTime(600, whistleTime);
      oscW.frequency.linearRampToValueAtTime(250, whistleTime + 0.4);
      oscW.frequency.exponentialRampToValueAtTime(700, whistleTime + 0.7);
      gainW.gain.setValueAtTime(0, whistleTime);
      gainW.gain.linearRampToValueAtTime(0.06, whistleTime + 0.1);
      gainW.gain.exponentialRampToValueAtTime(0.001, whistleTime + 0.8);
      oscW.connect(gainW);
      gainW.connect(ctx.destination);
      oscW.start(whistleTime);
      oscW.stop(whistleTime + 0.85);
    } catch (e) {
      console.warn('AudioContext failed for intern sound:', e);
    }
  },

  playNewsSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Dramatic synth brass/bells news arpeggio
      const notes = [
        { timeOffset: 0.0, freq: 196.00, dur: 0.2 }, // G3
        { timeOffset: 0.15, freq: 196.00, dur: 0.2 }, // G3
        { timeOffset: 0.3, freq: 261.63, dur: 0.25 }, // C4
        { timeOffset: 0.5, freq: 329.63, dur: 0.25 }, // E4
        { timeOffset: 0.7, freq: 392.00, dur: 0.4 },  // G4
        { timeOffset: 1.0, freq: 523.25, dur: 0.6 }   // C5
      ];

      notes.forEach((n) => {
        const time = now + n.timeOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.05, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + n.dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + n.dur + 0.05);
      });
    } catch (e) {
      console.warn('AudioContext failed for news sound:', e);
    }
  },

  playPirateSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Sea wave roll (noise sweep)
      const bufferSize = ctx.sampleRate * 2.0; // 2 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(100, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(1000, now + 1.0);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 2.0);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
      noiseGain.gain.linearRampToValueAtTime(0, now + 2.0);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // 2. Accordion Sea Shanty notes (C4 - E4 - G4 - C5 - G4 - E4 - C4)
      const shanty = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63];
      shanty.forEach((f, idx) => {
        const time = now + 0.3 + (idx * 0.2);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, time);
        
        const oscFilter = ctx.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(600, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 0.05);
        gain.gain.linearRampToValueAtTime(0, time + 0.18);
        
        osc.connect(oscFilter);
        oscFilter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
      });
    } catch (e) {
      console.warn('AudioContext failed for pirate sound:', e);
    }
  },

  playNinjaSound() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Blade Swoosh whoosh (0s - 0.3s)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.25);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);

      // 2. Smoke Bomb explosion (starts at 1.2s)
      const explodeTime = now + 1.2;
      const explodeBufferSize = ctx.sampleRate * 0.5; // 0.5s burst
      const explodeBuffer = ctx.createBuffer(1, explodeBufferSize, ctx.sampleRate);
      const explodeData = explodeBuffer.getChannelData(0);
      for (let i = 0; i < explodeBufferSize; i++) {
        explodeData[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = explodeBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, explodeTime);
      filter.frequency.exponentialRampToValueAtTime(50, explodeTime + 0.4);
      const gainN = ctx.createGain();
      gainN.gain.setValueAtTime(0, explodeTime);
      gainN.gain.linearRampToValueAtTime(0.12, explodeTime + 0.02);
      gainN.gain.exponentialRampToValueAtTime(0.001, explodeTime + 0.45);
      
      noise.connect(filter);
      filter.connect(gainN);
      gainN.connect(ctx.destination);
      noise.start(explodeTime);

      // 3. Pentatonic wind chime end
      this.playChime(explodeTime + 0.2, 880.00); // A5
      this.playChime(explodeTime + 0.3, 987.77); // B5
      this.playChime(explodeTime + 0.4, 1174.66); // D6
    } catch (e) {
      console.warn('AudioContext failed for ninja sound:', e);
    }
  },

  playChime(time, freq) {
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.5);
    } catch (e) {}
  }
};

function triggerThemeSound(theme) {
  switch (theme) {
    case 'airplane':
      NotificationSynth.playAirplaneSound();
      break;
    case 'cat':
      NotificationSynth.playCatSound();
      break;
    case 'meme':
      NotificationSynth.playMemeSound();
      break;
    case 'intern':
      NotificationSynth.playInternSound();
      break;
    case 'news':
      NotificationSynth.playNewsSound();
      break;
    case 'pirate':
      NotificationSynth.playPirateSound();
      break;
    case 'ninja':
      NotificationSynth.playNinjaSound();
      break;
  }
}

// Helper to generate a consistent emoji based on sender name
function getEmojiForSender(senderName) {
  const emojis = ['🚀', '🐱', '✈️', '🎉', '🔥', '💡', '🤖', '🎮', '🍕', '🦄', '🌈', '🥑', '✨', '⚡️', '🌟'];
  if (!senderName) return '🔔';
  const charCodeSum = senderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return emojis[charCodeSum % emojis.length];
}

// Closes the window or finishes preview mode
function finishAnimation() {
  console.log('Animation completed.');
  if (window.api && typeof window.api.sendAnimationComplete === 'function') {
    window.api.sendAnimationComplete();
  } else {
    // Standalone fallback: show completed state
    const overlay = document.getElementById('overlay-container');
    overlay.innerHTML = '<div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: #10b981; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-family: sans-serif;">Preview Finished</div>';
  }
}

// Injects the markup for the Airplane theme and plays the GSAP timeline
function playAirplaneTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper airplane-wrapper';
  wrapper.id = 'airplane-node';
  
  wrapper.innerHTML = `
    <svg class="airplane-svg" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>
        <linearGradient id="wingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9" />
          <stop offset="100%" stop-color="#075985" />
        </linearGradient>
        <linearGradient id="propGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f87171" />
          <stop offset="100%" stop-color="#dc2626" />
        </linearGradient>
      </defs>
      <!-- Fuselage -->
      <path d="M 20,60 C 20,40, 60,30, 150,50 C 170,53, 190,58, 195,60 C 190,62, 170,67, 150,70 C 60,90, 20,80, 20,60 Z" fill="url(#planeGrad)" />
      <!-- Canopy (Window) -->
      <path d="M 120,48 C 120,40, 140,40, 155,50 C 140,51, 125,51, 120,48 Z" fill="#e0f2fe" opacity="0.8" />
      <!-- Tail fin -->
      <path d="M 30,52 L 15,15 C 20,10, 30,10, 45,25 L 45,50 Z" fill="url(#wingGrad)" />
      <!-- Main Wing -->
      <path d="M 90,60 L 60,110 C 65,115, 75,115, 95,95 L 125,60 Z" fill="url(#wingGrad)" />
      <path d="M 100,58 L 120,20 C 123,17, 130,17, 135,25 L 130,55 Z" fill="url(#wingGrad)" opacity="0.9" />
      <!-- Propeller Spinner -->
      <path d="M 195,57 C 197,57, 200,58, 200,60 C 200,62, 197,63, 195,63 Z" fill="#f43f5e" />
      <!-- Propeller Blades -->
      <ellipse id="prop-blades" cx="197" cy="60" rx="3" ry="25" fill="url(#propGrad)" opacity="0.8" />
    </svg>
    <div class="airplane-banner banner-wave">
      <span style="font-size: 1.35rem; display: inline-flex; align-items: center;">✈️</span>
      <span class="banner-text">
        <strong style="color: #e0e7ff; font-weight: 800;">${senderName}:</strong> ${message}
      </span>
    </div>
  `;
  
  container.appendChild(wrapper);

  // Setup GSAP Animations
  const tl = gsap.timeline({
    onComplete: finishAnimation
  });

  // 1. Spinning Propeller
  gsap.to('#prop-blades', {
    scaleY: 0.1,
    transformOrigin: 'center center',
    repeat: -1,
    yoyo: true,
    duration: 0.05,
    ease: 'none'
  });

  // 2. Bobbing Flight Motion
  gsap.to(wrapper, {
    y: '+=20',
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    duration: 1.2
  });

  // 3. Move Across Screen
  const targetX = window.innerWidth + 950;
  tl.to(wrapper, {
    x: targetX,
    duration: durationMs / 1000,
    ease: 'power1.inOut'
  });
}

// Injects the markup for the Running Cat theme and plays the GSAP timeline
function playCatTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper cat-wrapper';
  wrapper.id = 'cat-node';
  
  wrapper.innerHTML = `
    <div class="cat-speech-bubble">
      <strong style="color: #fb923c; font-weight: 800;">${senderName}:</strong> ${message}
    </div>
    <svg class="cat-svg" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fb923c" />
          <stop offset="100%" stop-color="#ea580c" />
        </linearGradient>
      </defs>
      <!-- Tail -->
      <path id="cat-tail" d="M 105,40 C 115,30, 115,15, 105,10 C 98,6, 95,15, 100,22 L 95,35 Z" fill="url(#catGrad)" />
      <!-- Body -->
      <ellipse cx="60" cy="45" rx="35" ry="18" fill="url(#catGrad)" />
      <!-- Head -->
      <circle cx="28" cy="35" r="15" fill="url(#catGrad)" />
      <!-- Ears -->
      <polygon points="16,25 24,12 28,23" fill="url(#catGrad)" />
      <polygon points="28,23 32,12 40,25" fill="url(#catGrad)" />
      <!-- Eyes -->
      <circle cx="22" cy="32" r="2.5" fill="#ffffff" />
      <circle cx="22" cy="32" r="1.2" fill="#000000" />
      <circle cx="30" cy="32" r="2.5" fill="#ffffff" />
      <circle cx="30" cy="32" r="1.2" fill="#000000" />
      <!-- Nose & Whiskers -->
      <polygon points="25,37 27,37 26,38.5" fill="#fda4af" />
      <path d="M 26,38.5 Q 26,41, 24,41 M 26,38.5 Q 26,41, 28,41" stroke="#ea580c" stroke-width="1.2" fill="none" />
      <!-- Whiskers -->
      <line x1="18" y1="38" x2="8" y2="37" stroke="#ffffff" stroke-width="1" />
      <line x1="18" y1="40" x2="6" y2="41" stroke="#ffffff" stroke-width="1" />
      <line x1="34" y1="38" x2="44" y2="37" stroke="#ffffff" stroke-width="1" />
      <line x1="34" y1="40" x2="46" y2="41" stroke="#ffffff" stroke-width="1" />
      <!-- Legs (Leg elements are animated via rotation) -->
      <path id="cat-leg-f1" d="M 35,53 L 28,70 C 27,72, 22,72, 23,68 L 30,50 Z" fill="url(#catGrad)" />
      <path id="cat-leg-f2" d="M 45,53 L 42,67 C 41,69, 37,69, 38,65 L 42,50 Z" fill="url(#catGrad)" opacity="0.8" />
      <path id="cat-leg-b1" d="M 80,53 L 88,70 C 89,72, 94,72, 93,68 L 82,50 Z" fill="url(#catGrad)" />
      <path id="cat-leg-b2" d="M 72,53 L 78,67 C 79,69, 83,69, 82,65 L 75,50 Z" fill="url(#catGrad)" opacity="0.8" />
    </svg>
  `;

  container.appendChild(wrapper);

  // Setup GSAP Animations
  const tl = gsap.timeline({
    onComplete: finishAnimation
  });

  // 1. Rapid Running Bobbing (simulates paws hitting the ground)
  gsap.to(wrapper, {
    y: '-=12',
    yoyo: true,
    repeat: -1,
    ease: 'power1.inOut',
    duration: 0.16
  });

  // 2. Tail wagging
  gsap.to('#cat-tail', {
    rotate: 18,
    transformOrigin: 'bottom center',
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    duration: 0.2
  });

  // 3. Leg Wiggling/Running Motion
  gsap.to('#cat-leg-f1', { rotate: 22, transformOrigin: '35px 53px', yoyo: true, repeat: -1, duration: 0.12, ease: 'sine.inOut' });
  gsap.to('#cat-leg-f2', { rotate: -22, transformOrigin: '45px 53px', yoyo: true, repeat: -1, duration: 0.12, ease: 'sine.inOut' });
  gsap.to('#cat-leg-b1', { rotate: -22, transformOrigin: '80px 53px', yoyo: true, repeat: -1, duration: 0.12, ease: 'sine.inOut' });
  gsap.to('#cat-leg-b2', { rotate: 22, transformOrigin: '72px 53px', yoyo: true, repeat: -1, duration: 0.12, ease: 'sine.inOut' });

  // 4. Speech Bubble pulsing
  gsap.to('.cat-speech-bubble', {
    scale: 1.05,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    duration: 0.6
  });

  // 5. Run Across Screen
  const targetX = -(window.innerWidth + 900);
  tl.to(wrapper, {
    x: targetX,
    duration: durationMs / 1000,
    ease: 'none'
  });
}

// Injects the markup for the Meme glassmorphism card theme and plays the GSAP timeline
function playMemeTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper meme-wrapper';
  wrapper.id = 'meme-node';
  
  const emoji = getEmojiForSender(senderName);

  wrapper.innerHTML = `
    <div class="meme-avatar">${emoji}</div>
    <div class="meme-title">Incoming Message</div>
    <div class="meme-message">"${message}"</div>
    <div class="meme-sender">Sent by ${senderName}</div>
  `;

  container.appendChild(wrapper);

  // Setup GSAP Animations
  const tl = gsap.timeline({
    onComplete: finishAnimation
  });

  // 1. Initial State
  gsap.set(wrapper, {
    scale: 0,
    opacity: 0,
    xPercent: -50,
    yPercent: -50
  });

  // 2. Bounce In Entrance
  tl.to(wrapper, {
    scale: 1,
    opacity: 1,
    duration: 0.8,
    ease: 'back.out(1.6)'
  });

  // Calculate the holding display duration (entrance 0.8s + exit 0.6s)
  const displayDuration = Math.max((durationMs - 1400) / 1000, 4.0);

  // 3. Float up/fading Exit after delay
  tl.to(wrapper, {
    scale: 0.8,
    opacity: 0,
    yPercent: -100,
    delay: displayDuration,
    duration: 0.6,
    ease: 'power2.in'
  });
}

// Injects the markup for the Office Intern Running theme
function playInternTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper intern-wrapper';
  wrapper.id = 'intern-node';

  wrapper.innerHTML = `
    <svg class="intern-svg" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
      <circle class="sweat-drop" id="sweat1" cx="35" cy="40" r="3" fill="#38bdf8" />
      <circle class="sweat-drop" id="sweat2" cx="30" cy="48" r="2.5" fill="#38bdf8" />
      <rect x="50" y="50" width="30" height="35" rx="5" fill="#3b82f6" />
      <circle cx="65" cy="30" r="14" fill="#fed7aa" />
      <path d="M 50,22 Q 65,12 80,22 Q 75,18 65,22 Q 55,18 50,22 Z" fill="#7c2d12" />
      <ellipse cx="68" cy="35" rx="3" ry="5" fill="#7c2d12" />
      <circle cx="60" cy="28" r="1.5" fill="#000" />
      <circle cx="70" cy="28" r="1.5" fill="#000" />
      <g id="intern-papers">
        <rect x="70" y="32" width="45" height="35" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" />
        <rect x="73" y="29" width="45" height="35" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="78" y1="36" x2="108" y2="36" stroke="#cbd5e1" stroke-width="2" />
        <line x1="78" y1="44" x2="104" y2="44" stroke="#cbd5e1" stroke-width="2" />
        <line x1="78" y1="52" x2="110" y2="52" stroke="#cbd5e1" stroke-width="2" />
      </g>
      <path id="intern-leg-l" d="M 55,85 L 48,98 C 47,99, 42,99, 43,95 L 52,85 Z" fill="#1d4ed8" />
      <path id="intern-leg-r" d="M 75,85 L 82,98 C 83,99, 88,99, 87,95 L 78,85 Z" fill="#1d4ed8" opacity="0.8" />
    </svg>
    <div class="intern-speech-bubble">
      <strong style="color: #6ee7b7; font-weight: 800;">Intern (${senderName}):</strong> "${message}"
    </div>
  `;
  container.appendChild(wrapper);

  const tl = gsap.timeline({ onComplete: finishAnimation });

  gsap.to('#intern-leg-l', { rotate: 30, transformOrigin: '55px 85px', yoyo: true, repeat: -1, duration: 0.12, ease: 'sine.inOut' });
  gsap.to('#intern-leg-r', { rotate: -30, transformOrigin: '75px 85px', yoyo: true, repeat: -1, duration: 0.12, ease: 'sine.inOut' });
  gsap.to('#intern-papers', { rotate: 5, y: -4, transformOrigin: '70px 45px', yoyo: true, repeat: -1, duration: 0.1, ease: 'sine.inOut' });

  gsap.to('.sweat-drop', {
    x: '-=30',
    y: '+=15',
    scale: 0.2,
    opacity: 0,
    stagger: 0.05,
    repeat: -1,
    duration: 0.4,
    ease: 'power1.out'
  });

  gsap.to(wrapper, { y: '+=15', yoyo: true, repeat: -1, duration: 0.18, ease: 'sine.inOut' });

  const targetX = window.innerWidth + 950;
  tl.to(wrapper, {
    x: targetX * 0.4,
    duration: (durationMs / 1000) * 0.4,
    ease: 'none'
  })
  .to(wrapper, {
    rotate: 35,
    x: '+=80',
    y: '+=40',
    duration: 0.8,
    ease: 'power2.out'
  })
  .to(wrapper, {
    rotate: -10,
    y: '-=45',
    duration: 0.4,
    ease: 'back.out(2)'
  })
  .to(wrapper, {
    rotate: 0,
    y: 0,
    x: targetX,
    duration: (durationMs / 1000) * 0.45,
    ease: 'power1.in'
  });
}

// Injects the markup for the Breaking News theme
function playNewsTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper news-wrapper';
  wrapper.id = 'news-node';

  wrapper.innerHTML = `
    <div class="news-badge">Live</div>
    <div class="news-ticker-container">
      <div class="news-title" id="newsTickerText">⚡ BREAKING NEWS: "${message}"</div>
      <div class="news-reporter">Reported by Correspondent ${senderName}</div>
    </div>
  `;
  container.appendChild(wrapper);

  const tl = gsap.timeline({ onComplete: finishAnimation });

  tl.to(wrapper, {
    bottom: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out'
  });

  const activeDuration = Math.max((durationMs - 1600) / 1000, 5.0);

  const tickerText = document.getElementById('newsTickerText');
  gsap.from(tickerText, {
    x: 100,
    opacity: 0,
    duration: 1.0,
    ease: 'power2.out',
    delay: 0.8
  });

  tl.to(wrapper, {
    bottom: -150,
    opacity: 0,
    delay: activeDuration,
    duration: 0.8,
    ease: 'power3.in'
  });
}

// Injects the markup for the Pirate Ship theme
function playPirateTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper pirate-wrapper';
  wrapper.id = 'pirate-node';

  wrapper.innerHTML = `
    <div class="pirate-scroll">
      ⚓ Matey <strong>${senderName}</strong>: "${message}" 🍗
    </div>
    <svg class="pirate-svg" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">
      <path id="pirate-waves" d="M -10,95 Q 15,85 40,95 Q 65,85 90,95 Q 115,85 140,95 L 140,110 L -10,110 Z" fill="#1d4ed8" opacity="0.6" />
      <path d="M 15,65 L 105,65 C 100,82 85,92 60,92 C 35,92 20,82 15,65 Z" fill="#78350f" stroke="#451a03" stroke-width="2" />
      <rect x="25" y="60" width="70" height="6" rx="2" fill="#92400e" />
      <rect x="57" y="15" width="6" height="50" rx="1" fill="#78350f" />
      <path d="M 35,20 C 48,15, 68,15, 85,20 C 78,35, 78,45, 85,55 C 68,58, 48,58, 35,55 C 42,45, 42,35, 35,20 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
      <circle cx="60" cy="35" r="4.5" fill="#000" />
      <path d="M 57,32 L 63,38 M 63,32 L 57,38" stroke="#000" stroke-width="1.5" />
      <path d="M 63,15 L 78,20 L 63,25 Z" fill="#dc2626" />
    </svg>
  `;
  container.appendChild(wrapper);

  const tl = gsap.timeline({ onComplete: finishAnimation });

  gsap.to('#pirate-waves', {
    x: '+=20',
    yoyo: true,
    repeat: -1,
    duration: 0.8,
    ease: 'sine.inOut'
  });

  gsap.to('.pirate-svg', {
    rotate: 6,
    y: '-=10',
    transformOrigin: '60px 85px',
    yoyo: true,
    repeat: -1,
    duration: 1.4,
    ease: 'sine.inOut'
  });

  gsap.to('.pirate-scroll', {
    y: '+=8',
    yoyo: true,
    repeat: -1,
    duration: 0.9,
    ease: 'sine.inOut'
  });

  const targetX = -(window.innerWidth + 900);
  tl.to(wrapper, {
    x: targetX,
    duration: durationMs / 1000,
    ease: 'none'
  });
}

// Injects the markup for the Ninja Scroll theme
function playNinjaTheme(senderName, message, durationMs) {
  const container = document.getElementById('overlay-container');
  const wrapper = document.createElement('div');
  wrapper.className = 'animation-wrapper ninja-wrapper';
  wrapper.id = 'ninja-node';

  wrapper.innerHTML = `
    <svg class="ninja-character" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#0f172a" stroke-width="3" />
      <path d="M 22,42 C 22,35, 78,35, 78,42 C 78,54, 22,54, 22,42 Z" fill="#fed7aa" />
      <path d="M 33,44 L 43,47 C 40,49, 36,49, 33,44 Z" fill="#dc2626" />
      <path d="M 67,44 L 57,47 C 60,49, 64,49, 67,44 Z" fill="#dc2626" />
      <path id="ninja-tie" d="M 88,48 C 96,44, 98,58, 92,62 C 89,64, 86,54, 88,48 Z" fill="#0f172a" />
    </svg>
    <div class="ninja-scroll-container" id="ninjaScroll">
      <div class="ninja-message" id="ninjaMsg">
        🥷 <strong>${senderName}</strong>: "${message}"
      </div>
    </div>
    <div class="smoke-puff" id="ninjaSmoke"></div>
  `;
  container.appendChild(wrapper);

  const tl = gsap.timeline({ onComplete: finishAnimation });

  gsap.set(wrapper, {
    scale: 0.1,
    opacity: 0,
    y: -300
  });

  tl.to(wrapper, {
    scale: 1,
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'bounce.out'
  });

  gsap.to('#ninja-tie', {
    rotate: 15,
    transformOrigin: '88px 48px',
    yoyo: true,
    repeat: -1,
    duration: 0.3,
    ease: 'sine.inOut'
  });

  tl.to('#ninjaScroll', {
    width: 480,
    duration: 0.5,
    ease: 'power2.out',
    delay: 0.3
  })
  .to('#ninjaMsg', {
    opacity: 1,
    duration: 0.4
  });

  const activeDuration = Math.max((durationMs - 2200) / 1000, 2.5);

  tl.to('#ninjaSmoke', {
    scale: 2.5,
    opacity: 1,
    duration: 0.3,
    ease: 'power1.out',
    delay: activeDuration
  })
  .to([ '.ninja-character', '#ninjaScroll' ], {
    opacity: 0,
    scale: 0.5,
    duration: 0.2
  }, '<')
  .to('#ninjaSmoke', {
    opacity: 0,
    scale: 3,
    duration: 0.5,
    ease: 'power1.in'
  });
}

// Handles parsing and running
function initOverlay() {
  console.log('Initializing overlay animation...');
  
  // 1. Check if running in Electron environment
  if (window.api && typeof window.api.getNotificationPayload === 'function') {
    window.api.getNotificationPayload().then((payload) => {
      console.log('Notification payload fetched from Electron main:', payload);
      if (payload) {
        startThemeAnimation(payload);
      } else {
        console.warn('No notification payload available. Closing.');
        finishAnimation();
      }
    }).catch((err) => {
      console.error('Failed to get notification payload:', err);
      finishAnimation();
    });
  } else {
    // 2. Standalone browser preview mode fallback (URL query parameters)
    console.log('Running in standalone browser mode. Parsing search parameters.');
    const params = new URLSearchParams(window.location.search);
    const theme = params.get('theme') || 'airplane';
    const msg = params.get('msg') || 'Default notification message testing overlay!';
    const sender = params.get('sender') || 'Alice Dev';
    
    startThemeAnimation({
      theme,
      message: msg,
      senderName: sender,
      id: 'preview-id'
    });
  }
}

// Starts the appropriate theme animation based on payload
function startThemeAnimation(payload) {
  const { theme, message, senderName } = payload;
  const config = Themes[theme] || Themes.airplane;
  const durationMs = payload.durationMs || config.durationMs;

  console.log(`Starting theme: "${theme}" | Sender: "${senderName}" | Message: "${message}" | Duration: ${durationMs}ms`);

  // Audio feedback check
  if (window.api && typeof window.api.getSettings === 'function') {
    window.api.getSettings().then((settings) => {
      if (settings && settings.soundEnabled) {
        triggerThemeSound(theme);
      }
    }).catch(() => {
      triggerThemeSound(theme);
    });
  } else {
    // Standalone fallback: auto trigger immediately and wire up click-trigger for autoplay block recovery
    triggerThemeSound(theme);
    const playOnClick = () => {
      triggerThemeSound(theme);
      document.removeEventListener('click', playOnClick);
    };
    document.addEventListener('click', playOnClick);
  }

  switch (theme) {
    case 'airplane':
      playAirplaneTheme(senderName, message, durationMs);
      break;
    case 'cat':
      playCatTheme(senderName, message, durationMs);
      break;
    case 'meme':
      playMemeTheme(senderName, message, durationMs);
      break;
    case 'intern':
      playInternTheme(senderName, message, durationMs);
      break;
    case 'news':
      playNewsTheme(senderName, message, durationMs);
      break;
    case 'pirate':
      playPirateTheme(senderName, message, durationMs);
      break;
    case 'ninja':
      playNinjaTheme(senderName, message, durationMs);
      break;
    default:
      console.warn(`Unknown theme "${theme}", falling back to airplane`);
      playAirplaneTheme(senderName, message, durationMs);
      break;
  }
}

// Run on load
window.addEventListener('DOMContentLoaded', initOverlay);
