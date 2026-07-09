/* ==========================================================================
   SARA CLOTHING — HERO-THREE.JS
   Real WebGL 3D starfield for the homepage hero, built with Three.js.
   Layered on top of (not replacing) the existing CSS orbs and CSS
   twinkling stars — if this script or the Three.js CDN fails to load,
   the canvas just stays empty and the CSS-only effects still cover it.

   This file only READS the hero DOM (bounding size, and whether a slide's
   is-active class changed) — it never touches pages/home.js, so the
   carousel's own behavior (autoplay, arrows, dots, swipe, a11y attributes)
   is completely unaffected.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (typeof window.THREE === 'undefined') return; // CDN blocked/slow — silent fallback

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // CSS twinkling stars alone cover this case

    const heroBg = document.querySelector('[data-hero-3d-bg]');
    const canvas = document.querySelector('[data-hero-three]');
    const hero = document.querySelector('.hero');
    const heroSlides = document.querySelector('.hero__slides');
    if (!heroBg || !canvas || !hero || !heroSlides) return;

    const THREE = window.THREE;
    const isNarrow = window.innerWidth < 700;
    const STAR_COUNT = isNarrow ? 220 : 420;

    let width = hero.clientWidth;
    let height = hero.clientHeight;
    if (width === 0 || height === 0) return;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 800);
    camera.position.z = 220;

    const starGroup = new THREE.Group();
    scene.add(starGroup);

    // ---- Star geometry: positions + per-star size/phase/speed/tint ----
    const positions = new Float32Array(STAR_COUNT * 3);
    const scales = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    const speeds = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);

    // Brand palette: warm cream base, occasional gold accent — matches
    // tokens.css instead of generic white/blue sparkle.
    const cream = new THREE.Color('#fff8ec');
    const gold = new THREE.Color('#c9a15a');

    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 700; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 420; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500 - 60; // z (depth)

      scales[i] = 1.2 + Math.random() * 2.6;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.6 + Math.random() * 1.6;

      const useGold = Math.random() < 0.16;
      const c = useGold ? gold : cream;
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    // ---- Shader material: soft round glow dots that twinkle individually ----
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBurst: { value: 0 }, // 0 = normal, animates to 1 briefly on slide change
      },
      vertexShader: `
        attribute float aScale;
        attribute float aPhase;
        attribute float aSpeed;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uBurst;
        varying float vTwinkle;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          float twinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * aSpeed + aPhase));
          vTwinkle = clamp(twinkle + uBurst * 0.6, 0.0, 1.4);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aScale * (260.0 / -mvPosition.z) * (1.0 + uBurst * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vTwinkle;
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          float alpha = smoothstep(0.5, 0.0, dist) * vTwinkle;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    starGroup.add(points);

    // ---- Mouse parallax: gentle camera drift toward cursor position ----
    let targetRotX = 0;
    let targetRotY = 0;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 0.25;
      targetRotX = ny * 0.18;
    });

    hero.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    // ---- Slide-change burst: brief brighten/enlarge of every star ----
    // Purely observes the class the carousel already toggles — never
    // calls into pages/home.js.
    let burstTarget = 0;
    let burstTimer = null;
    const observer = new MutationObserver(() => {
      burstTarget = 1;
      if (burstTimer) window.clearTimeout(burstTimer);
      burstTimer = window.setTimeout(() => {
        burstTarget = 0;
      }, 260);
    });
    observer.observe(heroSlides, { attributes: true, attributeFilter: ['class'], subtree: true });

    // ---- Resize handling ----
    function handleResize() {
      width = hero.clientWidth;
      height = hero.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    window.addEventListener('resize', handleResize, { passive: true });

    // ---- Render loop ----
    const clock = new THREE.Clock();
    let currentBurst = 0;

    function animate() {
      requestAnimationFrame(animate);

      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;

      // Ease current burst value toward its target for a smooth pulse
      currentBurst += (burstTarget - currentBurst) * 0.15;
      material.uniforms.uBurst.value = currentBurst;

      // Very slow ambient drift so the field never feels static
      starGroup.rotation.y += 0.00035;

      // Ease camera rotation toward the mouse-driven target (parallax)
      camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05;
      camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;

      renderer.render(scene, camera);
    }

    animate();
  }
})();
