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
    default:
      console.warn(`Unknown theme "${theme}", falling back to airplane`);
      playAirplaneTheme(senderName, message, durationMs);
      break;
  }
}

// Run on load
window.addEventListener('DOMContentLoaded', initOverlay);
