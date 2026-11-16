// Διακριτικά 3D εφέ (Three.js): φωτεινά σωματίδια στο hero, αναμμένο κερί στο CTA.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.setClearColor(0x000000, 0);
  return r;
}

function fit(renderer, camera, canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const pr = renderer.getPixelRatio();
  if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

// Τρέχει το loop μόνο όταν ο καμβάς είναι ορατός
function runWhenVisible(el, frame) {
  let raf = 0, visible = false, last = performance.now(), t = 0;
  const loop = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    frame(t, dt);
    if (visible) raf = requestAnimationFrame(loop);
  };
  if (reduce) { frame(2.5, 0); return; }
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
  }).observe(el);
}

/* ---------------------------------------------------------------- Hero: σωματίδια φωτός */
function heroParticles(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const N = window.innerWidth < 720 ? 55 : 130;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N), size = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * 10;
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * 5;
    pos[i * 3 + 2] = -9 + Math.random() * 11;
    seed[i] = Math.random();
    size[i] = 0.5 + Math.random() * 1.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float aSeed; attribute float aSize;
      uniform float uTime; uniform float uPR;
      varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.10 + aSeed * 0.12) + 5.0, 10.0) - 5.0;
        p.x += sin(uTime * 0.25 + aSeed * 12.0) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * 46.0 / -mv.z;
        float edge = smoothstep(5.0, 3.2, abs(p.y));
        vA = edge * (0.35 + 0.65 * fract(aSeed * 7.13)) * (0.65 + 0.35 * sin(uTime * 0.9 + aSeed * 30.0));
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d); a *= a;
        gl_FragColor = vec4(0.95, 0.95, 0.97, a * vA * 0.45);
      }`,
  });
  scene.add(new THREE.Points(geo, mat));

  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  runWhenVisible(canvas, (t) => {
    fit(renderer, camera, canvas);
    mat.uniforms.uTime.value = t;
    camera.position.x += (mx * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });
}

/* ---------------------------------------------------------------- CTA: αναμμένο κερί */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,205,140,0.5)');
  grd.addColorStop(0.2, 'rgba(255,180,100,0.22)');
  grd.addColorStop(0.5, 'rgba(255,160,80,0.06)');
  grd.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function candle(canvas) {
  const renderer = makeRenderer(canvas);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const R = 7.6;

  // Κερί (lathe για ελαφρώς λιωμένη κορυφή)
  const prof = [[0, 0], [0.40, 0], [0.42, 0.04], [0.42, 1.50], [0.41, 1.57], [0.36, 1.61], [0.20, 1.60], [0.08, 1.56], [0, 1.555]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const wax = new THREE.MeshStandardMaterial({ color: 0xf7f0e4, roughness: 0.55, metalness: 0, emissive: 0xffb36b, emissiveIntensity: 0.12 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), wax);
  body.position.y = 0.12;
  scene.add(body);

  // Βάση (μπρούτζινο πιατάκι)
  const brass = new THREE.MeshStandardMaterial({ color: 0xc4c4ca, roughness: 0.28, metalness: 0.9 });
  const dishProf = [[0, 0], [0.78, 0], [0.82, 0.03], [0.80, 0.10], [0.74, 0.12], [0.5, 0.08], [0, 0.08]].map(([x, y]) => new THREE.Vector2(x, y));
  scene.add(new THREE.Mesh(new THREE.LatheGeometry(dishProf, 72), brass));

  // Φυτίλι
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 }));
  wick.position.y = 1.74;
  scene.add(wick);

  // Φλόγα (billboard shader)
  const flameGeo = new THREE.PlaneGeometry(0.34, 0.78, 1, 1); flameGeo.translate(0, 0.39, 0);
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main() {
        float y = vUv.y;
        float sway = sin(uTime * 4.7) * 0.018 + sin(uTime * 9.1 + y * 3.0) * 0.012;
        float x = vUv.x - 0.5 - sway * y * 2.0;
        float w = 0.30 * pow(sin(clamp(y * 0.95 + 0.06, 0.0, 1.0) * 3.14159), 0.75) * (1.0 - 0.55 * y);
        float d = abs(x) / max(w, 0.001);
        float body = smoothstep(1.0, 0.45, d) * smoothstep(0.0, 0.10, y) * smoothstep(1.0, 0.45, y);
        float core = smoothstep(0.55, 0.0, d) * smoothstep(0.06, 0.22, y) * smoothstep(0.62, 0.25, y);
        vec3 col = mix(vec3(1.0, 0.50, 0.12), vec3(1.0, 0.93, 0.72), core);
        col = mix(col, vec3(0.35, 0.45, 1.0), smoothstep(0.20, 0.02, y) * 0.55);
        gl_FragColor = vec4(col * 1.25, body);
      }`,
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 1.78;
  scene.add(flame);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.y = 2.0; glow.scale.set(1.9, 1.9, 1);
  scene.add(glow);

  // Φωτισμός
  const light = new THREE.PointLight(0xffb066, 4, 8, 2);
  light.position.set(0, 2.05, 0);
  scene.add(light);
  scene.add(new THREE.HemisphereLight(0xeeeeee, 0x2b2b2e, 0.55));
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(2, 3, 4); scene.add(fill);

  runWhenVisible(canvas, (t) => {
    fit(renderer, camera, canvas);
    const a = Math.sin(t * 0.18) * 0.32;
    camera.position.set(Math.sin(a) * R, 2.0, Math.cos(a) * R);
    camera.lookAt(0, 1.25, 0);
    const f = 1 + Math.sin(t * 13.0) * 0.05 + Math.sin(t * 7.3) * 0.04 + Math.sin(t * 23.0) * 0.02;
    light.intensity = 4 * f;
    flame.scale.set(1, 0.96 + (f - 1) * 1.4, 1);
    flame.quaternion.copy(camera.quaternion);
    glow.material.opacity = 0.85 + (f - 1) * 1.5;
    flameMat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  });
}

if (webglOK()) {
  document.querySelectorAll('canvas.fx-particles').forEach((c) => { try { heroParticles(c); c.classList.add('on'); } catch (e) {} });
  document.querySelectorAll('.cta-candle canvas').forEach((c) => { try { candle(c); c.parentElement.classList.add('on'); } catch (e) {} });
}
