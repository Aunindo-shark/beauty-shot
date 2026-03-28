function dedent(str) {
  const lines = str.split('\n');
  while(lines.length > 0 && lines[0].trim() === '') lines.shift();
  while(lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return '';
  const minIndent = lines.reduce((min, line) => {
    if (line.trim() === '') return min;
    const match = line.match(/^\s*/);
    const indent = match ? match[0].length : 0;
    return Math.min(min, indent);
  }, Infinity);
  
  if (minIndent === Infinity) return str;
  return lines.map(line => line.slice(minIndent)).join('\n');
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateBeautyShot") {
    let text = window.getSelection().toString();
    if (!text || text.trim() === '') {
      text = request.text; // fallback
    }
    createBeautyShotUI(text);
  }
});

function createBeautyShotUI(rawtext) {
  if (document.getElementById('beauty-shot-container')) return;

  const text = dedent(rawtext);
  const container = document.createElement('div');
  container.id = 'beauty-shot-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = '999999';

  const shadow = container.attachShadow({ mode: 'open' });

  Promise.all([
    fetch(chrome.runtime.getURL('tailwind.css')).then(r => r.text()),
    fetch(chrome.runtime.getURL('atom-one-dark.css')).then(r => r.text())
  ]).then(([tailwindCSS, hljsCSS]) => {
    
    const styleTailwind = document.createElement('style');
    styleTailwind.textContent = tailwindCSS;
    shadow.appendChild(styleTailwind);

    const styleHljs = document.createElement('style');
    styleHljs.textContent = hljsCSS;
    shadow.appendChild(styleHljs);

    const styleCustom = document.createElement('style');
    styleCustom.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      .glass-panel {
        background: rgba(255, 255, 255, 0.08);
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
      
      .code-container {
        background: #1e1e24;
        tab-size: 4;
      }
      
      .code-container::-webkit-scrollbar {
        display: none;
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

      .hljs {
        background: transparent !important;
        padding: 0 !important;
        font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
      }

      /* Clean scrollbar for viewing long code in the canvas */
      #canvas-wrapper::-webkit-scrollbar {
          width: 8px;
      }
      #canvas-wrapper::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
      }
      #canvas-wrapper::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
      }
    `;
    shadow.appendChild(styleCustom);

    let highlightedHtml = escapeHTML(text);
    if (typeof hljs !== 'undefined') {
      try {
        highlightedHtml = hljs.highlightAuto(text).value;
      } catch (e) {
        console.error("Highlight error:", e);
      }
    }

    const wrapper = document.createElement('div');
    wrapper.className = "flex h-screen w-screen bg-black bg-opacity-70 text-white fixed inset-0 items-center justify-center wrapper-anim";
    
    // Removed max-h-full from the terminal so it grows infinitely
    // Changed canvas-wrapper to flex-col and overflow-y-auto so the glass container itself scrolls when tall!
    wrapper.innerHTML = `
      <!-- Main Modal -->
      <div class="glass-panel flex flex-row rounded-2xl w-11/12 max-w-6xl h-[85vh] overflow-hidden relative shadow-2xl">
        <button id="close-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center z-50 transition-all">✕</button>
        
        <!-- Canvas Area (Left) - Using overflow-y-auto so we can view long shots -->
        <div class="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto bg-black bg-opacity-40" id="canvas-wrapper">
          <div id="beauty-card" class="canvas-area bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 rounded-xl flex flex-col items-center justify-center w-full max-w-4xl shadow-2xl relative shrink-0" style="margin: auto;">
            <!-- Code Window Mockup (Removed overflow restrictions so it naturally expands) -->
            <div class="w-full relative shadow-2xl rounded-xl overflow-hidden border border-white border-opacity-20 flex flex-col" style="background-color: #1e1e24;">
              <!-- Window Controls Bar -->
              <div class="px-4 py-3 flex space-x-2 items-center" style="background-color: #2d2d35;">
                <div class="w-3 h-3 rounded-full" style="background-color: #ff5f56;"></div>
                <div class="w-3 h-3 rounded-full" style="background-color: #ffbd2e;"></div>
                <div class="w-3 h-3 rounded-full" style="background-color: #27c93f;"></div>
              </div>
              <!-- Code Block -->
              <div class="p-6 code-container w-full">
                <pre class="m-0 text-sm leading-relaxed text-gray-100" style="white-space: pre-wrap; word-wrap: break-word;"><code id="code-content" class="hljs">${highlightedHtml}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (Right) -->
        <div class="w-80 border-l border-white border-opacity-20 glass-panel p-8 flex flex-col overflow-y-auto shrink-0 z-10 bg-white bg-opacity-5">
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

          <div class="mt-auto pt-4">
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

    const closeBtn = shadow.getElementById('close-btn');
    closeBtn.addEventListener('click', () => {
      container.remove();
    });

    const canvas = shadow.getElementById('beauty-card');
    const gradientBtns = shadow.querySelectorAll('.gradient-btn');
    
    gradientBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        gradientBtns.forEach(b => {
          b.classList.remove('border-white');
          b.classList.add('border-transparent');
        });
        btn.classList.add('border-white');
        btn.classList.remove('border-transparent');

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
  }).catch(err => {
    console.error("Failed to load resources:", err);
  });
}

function exportAsImage(shadowRoot) {
  const beautyCard = shadowRoot.getElementById('beauty-card');
  const btn = shadowRoot.getElementById('download-btn');
  const originalText = btn.innerHTML;
  btn.innerText = 'Capturing...';

  // Temporarily grab all styles from the shadow root and put them inside the beautyCard!
  // This guarantees html-to-image sees all the global tailwind styles inside Shadow DOM.
  const styles = Array.from(shadowRoot.querySelectorAll('style')).map(s => s.cloneNode(true));
  const styleContainer = document.createElement('div');
  styleContainer.style.display = 'none';
  styles.forEach(s => styleContainer.appendChild(s));
  beautyCard.appendChild(styleContainer);

  setTimeout(() => {
    if (typeof htmlToImage !== 'undefined') {
      htmlToImage.toPng(beautyCard, {
        pixelRatio: 2,
        skipFonts: false,
        cacheBust: true,
        backgroundColor: 'rgba(0,0,0,0)'
      }).then(dataUrl => {
         styleContainer.remove();
         const link = document.createElement('a');
         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
         link.download = `beauty-shot-${timestamp}.png`;
         link.href = dataUrl;
         link.click();
         btn.innerHTML = originalText;
      }).catch(err => {
         styleContainer.remove();
         console.error("Capture error:", err);
         btn.innerText = 'Capture Failed';
         setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      });
    } else {
      styleContainer.remove();
      btn.innerText = 'Error: Capture Script Missing';
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }
  }, 150);
}
