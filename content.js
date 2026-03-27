function loadHtmlToImage() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('html-to-image-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'html-to-image-script';
    // Load html-to-image from CDN into the main page
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load html-to-image'));
    document.head.appendChild(script);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateBeautyShot") {
    // Ensure the library loads before building the UI
    loadHtmlToImage()
      .then(() => createBeautyShotUI(request.text))
      .catch((err) => {
        console.error("html-to-image failed to load:", err);
        createBeautyShotUI(request.text); // load UI anyway
      });
  }
});

function createBeautyShotUI(text) {
  // Check if exists
  if (document.getElementById('beauty-shot-container')) return;

  const container = document.createElement('div');
  container.id = 'beauty-shot-container';
  // Pin to viewport
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = '999999';

  const shadow = container.attachShadow({ mode: 'open' });

  // Add Tailwind via local extension resource
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('tailwind.css');
  shadow.appendChild(link);

  // Add Custom Styles for Glassmorphism
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .glass-panel {
      background: rgba(255, 255, 255, 0.08); /* Apple usually uses very subtle translucent whites or darks */
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
      animation: modalEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .wrapper-anim {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      animation: fadeEnter 0.3s ease-out forwards;
    }

    @keyframes fadeEnter {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalEnter {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(12px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    .code-block {
      background: #1e1e24; /* Dark theme */
      color: #f8f8f2;
      font-family: 'Fira Code', 'Consolas', monospace;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      overflow: auto;
      white-space: pre-wrap;
      tab-size: 4;
    }

    .canvas-area {
      transition: background 0.3s ease, padding 0.3s ease;
    }

    button {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    button:hover {
      transform: translateY(-1px);
    }
  `;
  shadow.appendChild(style);

  // HTML Structure
  const wrapper = document.createElement('div');
  wrapper.className = "flex h-screen w-screen bg-black bg-opacity-70 text-white fixed inset-0 items-center justify-center wrapper-anim";
  
  wrapper.innerHTML = `
    <!-- Main Modal -->
    <div class="glass-panel flex flex-row rounded-2xl w-11/12 max-w-6xl h-5/6 overflow-hidden relative shadow-2xl">
      <button id="close-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center z-50 transition-all">✕</button>
      
      <!-- Canvas Area (Left) -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-hidden bg-black bg-opacity-40" id="canvas-wrapper">
        <div id="beauty-card" class="canvas-area bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 rounded-xl flex flex-col items-center justify-center w-full max-w-4xl shadow-2xl relative">
          <!-- Code Window Mockup -->
          <div class="w-full relative shadow-2xl rounded-lg overflow-hidden border border-white border-opacity-10">
            <!-- Window Controls Bar -->
            <div class="bg-gray-800 px-4 py-3 flex space-x-2 items-center">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <!-- Code Block -->
            <pre class="code-block w-full text-sm leading-relaxed m-0 rounded-none">${escapeHTML(text)}</pre>
          </div>
        </div>
      </div>

      <!-- Sidebar (Right) -->
      <div class="w-80 border-l border-white border-opacity-20 glass-panel p-8 flex flex-col overflow-y-auto">
        <h2 class="text-3xl font-bold mb-8 text-white tracking-tight">Beauty Shot</h2>
        
        <!-- Gradient Presets -->
        <div class="mb-10">
          <label class="block text-xs font-semibold mb-3 text-white tracking-wider uppercase text-opacity-80">Background</label>
          <div class="grid grid-cols-3 gap-3">
            <button class="gradient-btn h-12 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-2 border-white focus:outline-none" data-gradient="from-indigo-500 via-purple-500 to-pink-500"></button>
            <button class="gradient-btn h-12 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 border-2 border-transparent focus:outline-none" data-gradient="from-cyan-400 via-blue-500 to-indigo-600"></button>
            <button class="gradient-btn h-12 rounded-lg bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 border-2 border-transparent focus:outline-none" data-gradient="from-orange-400 via-red-500 to-rose-600"></button>
          </div>
        </div>

        <!-- Padding Control -->
        <div class="mb-10">
          <label class="block text-xs font-semibold mb-3 text-white tracking-wider uppercase text-opacity-80">Padding</label>
          <input type="range" id="padding-slider" min="16" max="128" value="48" class="w-full h-1 bg-gray-500 bg-opacity-50 rounded-lg appearance-none cursor-pointer outline-none slider-thumb">
          <div class="flex justify-between text-xs font-medium text-gray-400 mt-3 tracking-wide">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>

        <div class="mt-auto">
          <button id="download-btn" class="w-full py-3.5 px-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg flex items-center justify-center space-x-2.5 hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span class="tracking-wide">Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(wrapper);
  document.body.appendChild(container);

  // Setup Event Listeners
  const closeBtn = shadow.getElementById('close-btn');
  closeBtn.addEventListener('click', () => {
    container.remove();
  });

  const canvas = shadow.getElementById('beauty-card');
  const gradientBtns = shadow.querySelectorAll('.gradient-btn');
  
  gradientBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Clear borders
      gradientBtns.forEach(b => {
        b.classList.remove('border-white');
        b.classList.add('border-transparent');
      });
      // Add border to selected
      btn.classList.add('border-white');
      btn.classList.remove('border-transparent');

      // Update background
      const oldClasses = Array.from(canvas.classList).filter(c => c.startsWith('from-') || c.startsWith('via-') || c.startsWith('to-'));
      canvas.classList.remove(...oldClasses);
      
      const newClasses = btn.getAttribute('data-gradient').split(' ');
      canvas.classList.add(...newClasses);
    });
  });

  const paddingSlider = shadow.getElementById('padding-slider');
  paddingSlider.addEventListener('input', (e) => {
    canvas.style.padding = `${e.target.value}px`;
  });

  const downloadBtn = shadow.getElementById('download-btn');
  downloadBtn.addEventListener('click', () => {
    exportAsImage(shadow);
  });
}

function exportAsImage(shadowRoot) {
  const beautyCard = shadowRoot.getElementById('beauty-card');
  const btn = shadowRoot.getElementById('download-btn');
  const originalText = btn.innerHTML;
  btn.innerText = 'Capturing...';

  const imgOptions = {
    pixelRatio: 2,
    skipFonts: false,
    cacheBust: true
  };

  if (typeof htmlToImage !== 'undefined') {
    htmlToImage.toPng(beautyCard, imgOptions)
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'code-snapshot.png';
        link.href = dataUrl;
        link.click();
        btn.innerHTML = originalText;
      })
      .catch((error) => {
        console.error("Error capturing image:", error);
        btn.innerHTML = originalText;
      });
  } else {
    // Fallback: inject script into main world to bypass isolated context restriction
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const container = document.getElementById('beauty-shot-container');
        if (!container || !container.shadowRoot) return;
        const card = container.shadowRoot.getElementById('beauty-card');
        if (!window.htmlToImage || !card) return;

        window.htmlToImage.toPng(card, {
          pixelRatio: 2,
          skipFonts: false,
          cacheBust: true
        })
          .then(function(dataUrl) {
             const link = document.createElement('a');
             link.download = 'code-snapshot.png';
             link.href = dataUrl;
             link.click();
          })
          .catch(function(err) {
             console.error('html-to-image error:', err);
          });
      })();
    `;
    document.body.appendChild(script);
    script.remove();
    setTimeout(() => { btn.innerHTML = originalText; }, 1500);
  }
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
