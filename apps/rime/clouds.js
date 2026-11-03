/* Hero clouds: soft, wispy mist drifting across the RIME wordmark and the summit.
   Drawn live in WebGL from layered, domain-warped noise, so it never loops or shows a seam.
   Two layers move at different speeds for depth; the mist gathers in a band around the summit and thins out above and below. */
(() => {
  const hero = document.querySelector('.hero');
  const cv = document.createElement('canvas');
  cv.className = 'clouds'; cv.setAttribute('aria-hidden', 'true');
  hero.appendChild(cv);
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { cv.remove(); return; }

  const vs = `attribute vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }`;
  const fs = `
    precision mediump float;
    uniform vec2 res; uniform float t; uniform float band; uniform float scroll;
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float v = 0., a = .5;
      mat2 r = mat2(.8, -.6, .6, .8);
      for (int i = 0; i < 6; i++) { v += a * n(p); p = r * p * 2.03 + 11.7; a *= .5; }
      return v;
    }
    // one layer of mist: noise stretched sideways (wispy streaks), warped by itself so it curls as it drifts
    float mist(vec2 uv, float speed, float scale, float seed) {
      vec2 p = uv * vec2(scale * .38, scale * 2.6) + vec2(seed, 0.);
      p.x -= t * speed;
      vec2 w = vec2(fbm(p + vec2(0., t * .03)), fbm(p + vec2(5.2, 1.3) - t * .02));
      float d = fbm(p + 1.8 * w);
      return smoothstep(.50, .74, d);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / res;                 // 0..1, y up
      float aspect = res.x / res.y;
      vec2 q = vec2(uv.x * aspect, uv.y + scroll);
      // where the mist lives: a soft band centred on the summit and the letters
      float y = uv.y;
      float b = exp(-pow((y - band) / .22, 2.));
      float low = exp(-pow((y - (band - .26)) / .14, 2.)) * .9;  // a second veil lower down, across the slopes
      float far = mist(q, .018, 2.2, 0.);
      float near = mist(q + vec2(3.1, .4), .045, 1.5, 7.3);
      float a = far * .45 * (b + low) + near * .9 * (b + low * .6);
      a = clamp(a, 0., .92);
      // white mist with a faint grey underside so it reads on the pale sky as well as on dark rock
      // lit from above: tops of the wisps white, their bellies a soft grey that shows against the pale sky
      float body = fbm(q * vec2(1.1, 3.) - vec2(t * .03, 0.));
      float shade = mix(.80, 1., smoothstep(.25, .75, body));
      vec3 col = vec3(shade);
      gl_FragColor = vec4(col * a, a);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uRes = U('res'), uT = U('t'), uBand = U('band'), uScroll = U('scroll');
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // mist is soft, so it renders at a reduced resolution and the browser scales it up smoothly
  const Q = .5;
  const size = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    cv.width = Math.max(2, Math.round(w * Q)); cv.height = Math.max(2, Math.round(h * Q));
    gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uRes, cv.width, cv.height);
    // centre the band on the wordmark / summit, measured from the page
    const word = document.querySelector('.word').getBoundingClientRect(), r = hero.getBoundingClientRect();
    const mid = (word.top + word.height * .55 - r.top) / h;
    gl.uniform1f(uBand, 1 - Math.min(.85, Math.max(.2, mid)));
  };
  addEventListener('resize', size); size();
  document.fonts && document.fonts.ready.then(size);

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on = true, t0 = performance.now() - 40000;   // start mid-drift so it's already formed on load
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(frame); }).observe(hero);
  function frame(now) {
    if (!on) return;
    gl.uniform1f(uT, still ? 40 : (now - t0) / 1000);
    gl.uniform1f(uScroll, scrollY / innerHeight * .25);      // the mist lifts a touch as you scroll away
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
