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
uniform vec2 u_mouse;      // canvas-local 0..1
uniform float u_proximity; // 0 = far away, 1 = mouse on top of canvas

// ---- smooth rounded normal — curved dome per arm ----
// Instead of flat pyramid faces, model each arm as a curved lobe:
// the normal rotates smoothly from pointing outward at the tip
// to pointing up at the center, with a gentle curve along the arm.
vec3 surfaceNormal(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  float r = length(p);
  float ax = abs(p.x), ay = abs(p.y);

  // "Arm weight" — how much are we inside an arm vs the gap between arms
  // High when one axis dominates strongly
  float armWeight = abs(ax - ay) / (ax + ay + 0.001);
  armWeight = smoothstep(0.0, 0.6, armWeight);

  // Curved outward slope: normal tilts outward along dominant axis,
  // but falls off toward the tip (r→1) and toward center (r→0)
  // giving a convex dome shape rather than flat facet
  float tipFalloff = 1.0 - r * r; // dome: highest curvature at center
  float slope = 2.5 * tipFalloff * armWeight;

  vec3 N;
  if (ax > ay) {
    N = normalize(vec3(sign(p.x) * slope, p.y * 0.5, 1.0));
  } else {
    N = normalize(vec3(p.x * 0.5, sign(p.y) * slope, 1.0));
  }

  // Near exact center: blend to straight up
  float centerBlend = smoothstep(0.12, 0.0, r);
  return normalize(mix(N, vec3(0.0, 0.0, 1.0), centerBlend));
}

// ---- liquid chrome + chromatic aberration ----
// No time-based animation — purely mouse driven
vec3 liquidChrome(vec3 N, vec2 mouse, float proximity) {
  // Reflect off surface normal
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), N);
  vec2 muv = r.xy * 0.5 + 0.5;

  // Mouse shifts the reflection pool — proximity-weighted
  muv += (mouse - 0.5) * 0.28 * proximity;

  float v = muv.y;

  // High-contrast black/white — mercury core
  float bands = smoothstep(0.45, 0.55, v);
  vec3 col = mix(vec3(0.02, 0.02, 0.03), vec3(0.90, 0.93, 1.0), bands);

  // Sharp bright horizon flash at the split
  float flash = smoothstep(0.04, 0.0, abs(v - 0.5));
  col += flash * 0.85;

  // Fresnel — edges face away from viewer
  float fres = pow(1.0 - abs(N.z), 2.5);

  // Chromatic aberration on edges
  vec2 aberDir = normalize(N.xy + vec2(0.001));
  float aberScale = fres * 0.07;
  float vR = (muv + aberDir * aberScale).y;
  float vB = (muv - aberDir * aberScale).y;
  float bR = smoothstep(0.45, 0.55, vR);
  float bG = smoothstep(0.45, 0.55, v);
  float bB = smoothstep(0.45, 0.55, vB);
  vec3 aberCol = mix(vec3(0.02,0.02,0.03), vec3(0.90,0.93,1.0), vec3(bR, bG, bB));
  col = mix(col, aberCol, fres * 0.8);

  // Prismatic rainbow at extreme edges
  vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (fres * 0.6 + vec3(0.0, 0.33, 0.67)));
  col = mix(col, rainbow, pow(fres, 3.0) * 0.85);

  // Mouse glint — white hot spot, only when close
  float glint = smoothstep(0.16, 0.0, length(muv - mouse)) * proximity;
  col += glint * vec3(1.0, 0.96, 0.9) * 1.5;

  return col;
}

void main() {
  float mask = texture2D(u_mask, v_uv).a;
  if (mask < 0.5) discard;

  vec3 N   = surfaceNormal(v_uv);
  vec3 col = liquidChrome(N, u_mouse, u_proximity);

  // Subtle center glow
  float inner = smoothstep(0.5, 0.0, length(v_uv * 2.0 - 1.0));
  col += inner * 0.08;

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
    const toRGB = (hex) => {
      const h = hex.replace("#","");
      return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255];
    };
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

    const uMask      = gl.getUniformLocation(prog, "u_mask");
    const uMouse     = gl.getUniformLocation(prog, "u_mouse");
    const uProximity = gl.getUniformLocation(prog, "u_proximity");
    gl.uniform1i(uMask, 0);
    gl.uniform2f(uMouse, 0.5, 0.5);
    gl.uniform1f(uProximity, 0.0);

    let mouseX = 0.5, mouseY = 0.5, proximity = 0.0;
    // Influence radius in pixels — mouse must be within this distance to affect shader
    const INFLUENCE_PX = 220;
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      // Canvas-local normalized coords
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
      // Distance from canvas center in screen pixels
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      // Smooth falloff: 1 when on top, 0 when >= INFLUENCE_PX away
      proximity = Math.max(0, 1 - dist / INFLUENCE_PX);
      // Ease it (quadratic) so it really only kicks in when close
      proximity = proximity * proximity;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let raf;
    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uProximity, proximity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", handleMouseMove); };
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
