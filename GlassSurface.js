/**
 * GlassSurface Web Component
 * Ported from React Bits (https://reactbits.dev/components/glass-surface)
 *
 * Creates a realistic glass refraction effect with:
 * 1. SVG displacement filter (Chromium — full chromatic aberration)
 * 2. CSS edge-warp layers (all browsers — visible edge displacement)
 * 3. Prismatic border (chromatic fringe at glass edge)
 * 4. Specular highlight (top-edge light reflection)
 */
class GlassSurface extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._renderTimeout = null;
    }

    static get observedAttributes() {
        return [
            'border-radius', 'border-width', 'brightness', 'opacity', 'blur',
            'displace', 'background-opacity', 'saturation', 'distortion-scale',
            'red-offset', 'green-offset', 'blue-offset', 'x-channel', 'y-channel',
            'mix-blend-mode'
        ];
    }

    getAttr(name, defaultValue) {
        const val = this.getAttribute(name);
        if (val === null) return defaultValue;
        if (typeof defaultValue === 'number') return parseFloat(val);
        return val;
    }

    connectedCallback() {
        this.uniqueId = Math.random().toString(36).substring(2, 9);
        this.filterId = `glass-filter-${this.uniqueId}`;
        this.svgSupported = this._supportsSVGFilters();

        this._render();

        // Watch for .dark class changes on <html> to re-render with correct colors
        this._darkModeObserver = new MutationObserver(() => this._render());
        this._darkModeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    disconnectedCallback() {
        if (this._darkModeObserver) this._darkModeObserver.disconnect();
        if (this._renderTimeout) clearTimeout(this._renderTimeout);
    }

    attributeChangedCallback() {
        if (!this.isConnected) return;
        // Debounce: coalesce multiple attribute changes into one render
        if (this._renderTimeout) clearTimeout(this._renderTimeout);
        this._renderTimeout = setTimeout(() => this._render(), 0);
    }

    /* ------------------------------------------------------------------ */
    /*  Feature detection                                                  */
    /* ------------------------------------------------------------------ */

    _supportsSVGFilters() {
        return false; // Force CSS-only path for clean glass refraction without color fringing
    }

    _isDark() {
        return document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;
    }


    /* ------------------------------------------------------------------ */
    /*  Host styling                                                       */
    /* ------------------------------------------------------------------ */

    _applyHostStyles() {
        const borderRadius = this.getAttr('border-radius', 24);
        const backgroundOpacity = this.getAttr('background-opacity', 0);
        const saturation = this.getAttr('saturation', 1);

        this.style.borderRadius = `${borderRadius}px`;
        this.style.setProperty('--glass-frost', backgroundOpacity);
        this.style.setProperty('--glass-saturation', saturation);
        this.style.setProperty('--filter-id', `url(#${this.filterId})`);

        if (this.svgSupported) {
            this.classList.add('glass-surface--svg');
            this.classList.remove('glass-surface--fallback');
        } else {
            this.classList.add('glass-surface--fallback');
            this.classList.remove('glass-surface--svg');
        }
        this.classList.add('glass-surface');
    }

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    _render() {
        const isDark = this._isDark();
        const displace = this.getAttr('displace', 3);
        const blur = this.getAttr('blur', 11);

        // --- Edge warp parameters ---
        // The warp layer is scaled up slightly so the backdrop-filter captures
        // shifted background pixels at the edges. Masked to only show at edges,
        // this creates visible refraction-like displacement.
        const warpScale = 1 + (displace * 0.01);   // displace=5 → scale(1.05)
        const warpBlur = Math.round(blur * 0.5);    // Light additional blur
        const warpBrightness = isDark ? 1.25 : 1.15;
        const warpContrast = isDark ? 1.12 : 1.08;

        this._applyHostStyles();

        const shadowStyle = document.createElement('style');
        shadowStyle.textContent = `
      :host {
        display: block;
        position: relative;
        overflow: visible;
        transition: opacity 0.26s ease-out;
      }

      /* ===== SVG filter path (Chromium) ===== */
      :host(.glass-surface--svg) {
        background: ${isDark
                ? 'hsl(0 0% 0% / var(--glass-frost, 0))'
                : 'hsl(0 0% 100% / var(--glass-frost, 0))'
            };
        backdrop-filter: var(--filter-id) saturate(var(--glass-saturation, 1));
        box-shadow:
          0 0 2px 1px ${isDark
                ? 'color-mix(in oklch, white, transparent 65%)'
                : 'color-mix(in oklch, black, transparent 85%)'
            } inset,
          0 0 10px 4px ${isDark
                ? 'color-mix(in oklch, white, transparent 85%)'
                : 'color-mix(in oklch, black, transparent 90%)'
            } inset,
          0px 4px 16px rgba(17,17,26,0.05),
          0px 8px 24px rgba(17,17,26,0.05),
          0px 16px 56px rgba(17,17,26,0.05),
          0px 4px 16px rgba(17,17,26,0.05) inset,
          0px 8px 24px rgba(17,17,26,0.05) inset,
          0px 16px 56px rgba(17,17,26,0.05) inset;
      }

      /* ===== Fallback path (Safari, Firefox) ===== */
      :host(.glass-surface--fallback) {
        background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.35)'};
        backdrop-filter: blur(${blur * 2}px) saturate(1.8) brightness(${isDark ? '1.12' : '1.03'});
        -webkit-backdrop-filter: blur(${blur * 2}px) saturate(1.8) brightness(${isDark ? '1.12' : '1.03'});
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)'};
        box-shadow:
          ${isDark
                ? `inset 0 1px 0 0 rgba(255,255,255,0.12),
               inset 0 -1px 0 0 rgba(255,255,255,0.06)`
                : `0 8px 32px 0 rgba(31,38,135,0.12),
               0 2px 16px 0 rgba(31,38,135,0.06),
               inset 0 1px 0 0 rgba(255,255,255,0.45),
               inset 0 -1px 0 0 rgba(255,255,255,0.2)`
            };
      }

      .glass-surface__wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: inherit;
      }

      .glass-surface__filter {
        width: 100%;
        height: 100%;
        pointer-events: none;
        position: absolute;
        inset: 0;
        opacity: 0;
        z-index: -1;
      }

      /* ========================================================
         EDGE REFRACTION — Creates the "bent glass" look
         ======================================================== */

      /* Clip container — ensures warp layers don't extend beyond glass bounds */
      .glass-refraction {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
        transform: translateZ(0); /* Fix Safari overflow rounding bug */
        clip-path: inset(0 round ${this.getAttr('border-radius', 24)}px);
      }

      /*
       * Edge warp layer:
       * - Uses backdrop-filter to capture the background
       * - transform: scale() shifts which pixels are captured at the edges
       * - mask-image limits the effect to the edges only
       * - Result: background appears displaced/bent at the glass edges
       */
      .glass-warp {
        position: absolute;
        inset: 0;
        backdrop-filter: blur(${warpBlur}px) brightness(${warpBrightness}) contrast(${warpContrast}) saturate(1.3);
        -webkit-backdrop-filter: blur(${warpBlur}px) brightness(${warpBrightness}) contrast(${warpContrast}) saturate(1.3);
        transform: scale(${warpScale});
        transform-origin: center;
        -webkit-mask-image:
          linear-gradient(to right, black 0%, transparent 14%, transparent 86%, black 100%),
          linear-gradient(to bottom, black 0%, transparent 30%, transparent 70%, black 100%);
        mask-image:
          linear-gradient(to right, black 0%, transparent 14%, transparent 86%, black 100%),
          linear-gradient(to bottom, black 0%, transparent 30%, transparent 70%, black 100%);
        opacity: 0.7;
      }

      /*
       * Second warp layer (opposite direction):
       * Slightly scaled down, creates a counter-warp that enhances the edge
       * distortion by showing background shifted in the opposite direction.
       */
      .glass-warp-inner {
        position: absolute;
        inset: 0;
        backdrop-filter: blur(${warpBlur}px) brightness(${isDark ? 0.85 : 0.95}) saturate(1.4);
        -webkit-backdrop-filter: blur(${warpBlur}px) brightness(${isDark ? 0.85 : 0.95}) saturate(1.4);
        transform: scale(${1 / warpScale});
        transform-origin: center;
        -webkit-mask-image:
          linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.5) 100%),
          linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%);
        mask-image:
          linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.5) 100%),
          linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%);
        opacity: 0.4;
      }


      /* ========================================================
         SPECULAR HIGHLIGHT — Light reflection on glass surface
         ======================================================== */
      .glass-specular {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        z-index: 0;
        background: linear-gradient(
          180deg,
          ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.28)'} 0%,
          ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)'} 25%,
          transparent 55%
        );
      }

      /* ========================================================
         CONTENT
         ======================================================== */
      .glass-surface__content {
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
        border-radius: inherit;
      }

      :host(:focus-visible) {
        outline: 2px solid ${isDark ? '#0a84ff' : '#007aff'};
        outline-offset: 2px;
      }
    `;

        const wrapper = document.createElement('div');
        wrapper.className = 'glass-surface__wrapper';
        wrapper.innerHTML = `
      <div class="glass-refraction">
        <div class="glass-warp"></div>
        <div class="glass-warp-inner"></div>
      </div>
      <div class="glass-specular"></div>

      <div class="glass-surface__content">
        <slot></slot>
      </div>
    `;

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(shadowStyle);
        this.shadowRoot.appendChild(wrapper);
    }
}

customElements.define('glass-surface', GlassSurface);
