"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0, 1); }
`;

const FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_fadeHeight;
uniform float u_maxOpacity;
uniform float u_noiseScale;
uniform vec3  u_color;

// --- permutation hash ---
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

// --- value noise (smooth) ---
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1,0));
  float c = hash(i + vec2(0,1));
  float d = hash(i + vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

// --- fBm: fewer octaves = bigger, smoother blobs ---
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5, max = 0.0;
  for (int i = 0; i < 3; i++) {
    v   += vnoise(p) * amp;
    max += amp;
    amp *= 0.5;
    p   *= 2.01;
  }
  return v / max;
}

// --- static grain: fixed per pixel, time only advances very slowly ---
float grain(vec2 p, float t) {
  // floor(t * 0.1) means grain pattern changes ~every 10 seconds
  return hash(floor(p) + floor(t * 0.1) * 17.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  // Offset yNorm to account for the 300px extension above viewport
  // so fade still reads 0=top-of-viewport, 1=bottom
  float extraFrac = 300.0 / u_res.y;
  float yNorm = 1.0 - uv.y - extraFrac; // 0=top of viewport

  // vertical fade
  float raw = max(0.0, 1.0 - yNorm / u_fadeHeight);
  float mask = raw * raw * (3.0 - 2.0 * raw);
  if (mask < 0.001) { gl_FragColor = vec4(0); return; }

  // Domain warping: one fbm pass warps the coords of a second pass
  // This creates swirling, folding wave shapes instead of uniform blobs
  vec2 np = uv * u_noiseScale;

  // First pass — compute warp offsets, each axis drifts independently
  vec2 warp = vec2(
    fbm(np + vec2(u_time * 0.7, u_time * 0.3)),
    fbm(np + vec2(u_time * 0.4, u_time * 0.8) + vec2(5.2, 1.3))
  );

  // Second pass — sample at warped coords, high warp = big dramatic blobs
  float terrain = fbm(np + warp * 3.5 + vec2(u_time * 0.2, u_time * 0.15));

  // Hard contrast: fewer midtones, more black/white regions
  terrain = smoothstep(0.3, 0.7, terrain);

  // static grain — changes pattern every ~10s, no flicker
  float g = grain(gl_FragCoord.xy, u_time);

  float combined = g * terrain;

  float alpha = combined * mask * u_maxOpacity;
  gl_FragColor = vec4(u_color, alpha);
}
`;

function hexToRGB(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function GrainOverlay({
  fadeHeight  = 0.80,
  maxOpacity  = 0.65,
  noiseScale  = 2.5,
  driftSpeed  = 0.015,  // terrain drift per second
  colorRGB    = [0, 0, 0],
}) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    // compile
    const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    gl.attachShader(prog, vert); gl.attachShader(prog, frag);
    gl.linkProgram(prog); gl.useProgram(prog);

    // full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1,  -1,1,  1,1
    ]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // uniforms
    const uRes         = gl.getUniformLocation(prog, "u_res");
    const uTime        = gl.getUniformLocation(prog, "u_time");
    const uFadeHeight  = gl.getUniformLocation(prog, "u_fadeHeight");
    const uMaxOpacity  = gl.getUniformLocation(prog, "u_maxOpacity");
    const uNoiseScale  = gl.getUniformLocation(prog, "u_noiseScale");
    const uColor       = gl.getUniformLocation(prog, "u_color");

    gl.uniform1f(uFadeHeight, fadeHeight);
    gl.uniform1f(uMaxOpacity, maxOpacity);
    gl.uniform1f(uNoiseScale, noiseScale);
    const rgb = typeof colorRGB === "string" ? hexToRGB(colorRGB) : colorRGB;
    gl.uniform3f(uColor, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const EXTRA = 300; // px above viewport to cover overscroll bounce
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight + EXTRA;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let startTime = performance.now();

    function draw(now) {
      const t = (now - startTime) / 1000 * driftSpeed;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [fadeHeight, maxOpacity, noiseScale, driftSpeed, colorRGB]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -300, left: 0,
        width: "100%", height: "calc(100vh + 300px)",
        pointerEvents: "none",
        zIndex: 0,
        mixBlendMode: "multiply",
      }}
    />
  );
}
