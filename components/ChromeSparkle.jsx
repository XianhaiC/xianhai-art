"use client";

import { useRef, useEffect } from "react";

// ─── Hex to RGB ───────────────────────────────────────────────────────────────
function hexToRGB(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ─── Vertex shader ────────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ─── Fragment shader ─────────────────────────────────────────────────────────
const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_mask;
uniform float u_time;

// ---- matcap UV from normal ----
vec2 matcapUV(vec3 N) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), N);
  float m = 2.0 * sqrt(r.x*r.x + r.y*r.y + (r.z+1.0)*(r.z+1.0));
  return r.xy / m + 0.5;
}

// ---- procedural chrome matcap ----
// Simulates: black base, vivid blue sky band, sharp white highlight, dark ground
vec3 chromeMatcap(vec2 uv, float t) {
  float v = uv.y;

  // Rotating specular streak
  float angle = t * 0.4;
  vec2 rot = vec2(cos(angle), sin(angle));
  float streak = dot(uv - 0.5, rot);
  float spec = smoothstep(0.08, 0.0, abs(streak - 0.05));

  // Sky (top ~35%)
  vec3 sky   = mix(vec3(0.10, 0.30, 0.70), vec3(0.55, 0.75, 1.00), smoothstep(0.65, 1.0, v));
  // Ground (bottom ~35%)
  vec3 ground = mix(vec3(0.04, 0.04, 0.06), vec3(0.15, 0.12, 0.10), smoothstep(0.0, 0.35, v));
  // White band
  vec3 white = vec3(1.0);
  // Black void
  vec3 black = vec3(0.0);

  vec3 col = black;
  col = mix(col, ground, smoothstep(0.0,  0.30, v));
  col = mix(col, black,  smoothstep(0.30, 0.42, v));
  col = mix(col, white,  smoothstep(0.42, 0.55, v));
  col = mix(col, black,  smoothstep(0.55, 0.60, v));
  col = mix(col, sky,    smoothstep(0.60, 0.75, v));

  // Specular streak
  col = mix(col, white, spec * 0.9);

  return col;
}

// ---- analytic surface normal from UV position ----
// The shape is a 4-pointed star pyramid viewed from above.
// Each arm points in one of 4 cardinal directions; the slope
// faces outward-downward from the center apex.
vec3 surfaceNormal(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0; // -1..1
  float ax = abs(p.x), ay = abs(p.y);

  // Which of the 4 arms are we in? (based on dominant axis)
  // Normal slopes away from center in the arm direction + up (z)
  vec3 N;
  float apex = 0.08; // blend radius near center
  float centerBlend = smoothstep(apex, 0.0, length(p));

  if (ax > ay) {
    // Left/right arm
    float side = sign(p.x);
    N = normalize(vec3(side * 0.7, p.y * 0.3, 0.6));
  } else {
    // Top/bottom arm
    float side = sign(p.y);
    N = normalize(vec3(p.x * 0.3, side * 0.7, 0.6));
  }

  // Near apex: blend toward straight up
  N = normalize(mix(N, vec3(0.0, 0.0, 1.0), centerBlend));
  return N;
}

// ---- extra fresnel rim ----
float fresnel(vec3 N) {
  float f = 1.0 - abs(N.z);
  return pow(f, 3.0) * 0.6;
}

void main() {
  // Shape mask from PNG alpha
  float mask = texture2D(u_mask, v_uv).a;
  if (mask < 0.5) discard;

  vec3 N   = surfaceNormal(v_uv);
  vec2 muv = matcapUV(N);
  vec3 col = chromeMatcap(muv, u_time);

  // Fresnel rim brightening
  col = mix(col, vec3(1.0), fresnel(N));

  // Slight apex glow
  float apex = smoothstep(0.08, 0.0, length(v_uv * 2.0 - 1.0));
  col = mix(col, vec3(1.0), apex * 0.6);

  gl_FragColor = vec4(col, mask);
}
`;

// ─── WebGL helpers ────────────────────────────────────────────────────────────
function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error(gl.getShaderInfoLog(s));
  return s;
}

function makeProgram(gl, vert, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER,   vert));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  return p;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ChromeSparkle({ size = 64, speed = 1.0, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const prog = makeProgram(gl, VERT, FRAG);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Load mask texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    img.src = "/crossx.png";

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMask = gl.getUniformLocation(prog, "u_mask");
    gl.uniform1i(uMask, 0);

    let raf;
    let t = 0;
    function draw(ts) {
      t = ts * 0.001 * speed;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return (
    <div style={{
      position:      "relative",
      display:       "inline-block",
      width:         size,
      height:        size,
      zIndex:        10,
      ...style,
    }}>
      {/* Ground shadow */}
      <div style={{
        position:      "absolute",
        bottom:        "-8%",
        left:          "10%",
        width:         "80%",
        height:        "14%",
        background:    "radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, transparent 70%)",
        filter:        "blur(4px)",
        pointerEvents: "none",
      }} />
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{ width: size, height: size, display: "block" }}
      />
    </div>
  );
}
