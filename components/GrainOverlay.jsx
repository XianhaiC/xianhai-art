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
  float yNorm = 1.0 - uv.y; // flip: 0=top,1=bottom in UV

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
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`;

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

    gl.uniform1f(uFadeHeight, fadeHeight);
    gl.uniform1f(uMaxOpacity, maxOpacity);
    gl.uniform1f(uNoiseScale, noiseScale);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
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
  }, [fadeHeight, maxOpacity, noiseScale, driftSpeed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100vh",
        pointerEvents: "none",
        zIndex: 99,
      }}
    />
  );
}
