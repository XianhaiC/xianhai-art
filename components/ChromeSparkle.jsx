"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ── Reconstruct Blender world shader as GLSL ──────────────────────────────────
// Graph: Reflection → Mapping(rot 45/45/180, offset X+0.4) → Linear Gradient → Color Ramp
// Color ramp stops:
//   0.000  #000000
//   0.063  #ffffff
//   0.173  #000000
//   0.282  #000000
//   0.426  #FCFFE4
//   0.627  #000000
//   0.764  #000000
//   1.000  #ffffff

const CHROME_ENV_GLSL = `
// Rotate a vector by euler angles (applied as ZYX = Blender order XYZ)
vec3 rotateMapping(vec3 v) {
  // Blender mapping rotation: X=45deg Y=45deg Z=180deg
  float cx = cos(0.7854), sx = sin(0.7854); // 45 deg
  float cy = cos(0.7854), sy = sin(0.7854);
  float cz = cos(3.1416), sz = sin(3.1416); // 180 deg

  // Rotate X
  vec3 rx = vec3(v.x, cx*v.y - sx*v.z, sx*v.y + cx*v.z);
  // Rotate Y
  vec3 ry = vec3(cy*rx.x + sy*rx.z, rx.y, -sy*rx.x + cy*rx.z);
  // Rotate Z
  vec3 rz = vec3(cz*ry.x - sz*ry.y, sz*ry.x + cz*ry.y, ry.z);
  return rz;
}

// Linear gradient texture: projects onto X axis (Blender Linear = X gradient)
float linearGradient(vec3 v) {
  // Blender linear gradient uses the X component of the vector, mapped 0..1
  return clamp(v.x * 0.5 + 0.5, 0.0, 1.0);
}

// Color ramp with exact stops
vec3 colorRamp(float t) {
  // stops: 0.000 black, 0.063 white, 0.173 black, 0.282 black,
  //        0.426 #FCFFE4, 0.627 black, 0.764 black, 1.000 white
  vec3 black = vec3(0.0);
  vec3 white = vec3(1.0);
  vec3 warm  = vec3(0.988, 1.0, 0.894); // #FCFFE4

  if (t < 0.063) return mix(black, white, t / 0.063);
  if (t < 0.173) return mix(white, black, (t - 0.063) / (0.173 - 0.063));
  if (t < 0.282) return black;
  if (t < 0.426) return mix(black, warm,  (t - 0.282) / (0.426 - 0.282));
  if (t < 0.627) return mix(warm,  black, (t - 0.426) / (0.627 - 0.426));
  if (t < 0.764) return black;
  return mix(black, white, (t - 0.764) / (1.0 - 0.764));
}

vec3 blenderChrome(vec3 worldNormal, vec3 lightDir) {
  // View direction: camera is above looking down
  vec3 viewDir = vec3(0.0, -1.0, 0.0);

  // Reflection vector (what the surface "sees")
  vec3 R = reflect(viewDir, worldNormal);

  // Apply Blender mapping: rotate + offset X by 0.4
  vec3 mapped = rotateMapping(R);
  mapped.x += 0.4;

  // Linear gradient → color ramp
  float t = linearGradient(mapped);
  return colorRamp(t);
}
`;

export default function ChromeSparkle({ size = 64, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const w = size * 2;
    const h = size * 2;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // No tone mapping — we're doing color in the shader
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    camera.position.set(0, 6, 0);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, -1);

    // ── Shadow plane ──────────────────────────────────────────────────────────
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.02;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ── Shadow-only directional light ─────────────────────────────────────────
    // This light exists only for shadow casting — the chrome look comes from
    // the custom shader below, not from this light.
    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.0);
    shadowLight.position.set(-3, 6, -2);
    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.width  = 1024;
    shadowLight.shadow.mapSize.height = 1024;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far  = 20;
    shadowLight.shadow.camera.left   = -4;
    shadowLight.shadow.camera.right  =  4;
    shadowLight.shadow.camera.top    =  4;
    shadowLight.shadow.camera.bottom = -4;
    shadowLight.shadow.bias = -0.002;
    shadowLight.shadow.radius = 8;
    scene.add(shadowLight);
    scene.add(shadowLight.target);

    // ── Mouse → light direction + env rotation ────────────────────────────────
    let lightDirTarget = new THREE.Vector3(-0.4, -1, -0.3).normalize();
    let lightDirCurrent = lightDirTarget.clone();
    let envRotTarget = new THREE.Vector2(0, 0);
    let envRotCurrent = new THREE.Vector2(0, 0);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
      // Light position
      const lx = nx * 5, lz = ny * 5, ly = 6;
      const len = Math.sqrt(lx*lx + ly*ly + lz*lz);
      lightDirTarget.set(lx/len, ly/len, lz/len);
      shadowLight.position.set(lx, ly, lz);
      // Env rotation — subtle, just enough to shift the color bands
      envRotTarget.set(nx * 0.4, ny * 0.25);
    };
    window.addEventListener("mousemove", handleMouseMove);

    // ── Load GLB + apply custom chrome shader ─────────────────────────────────
    let chromeMaterial = null;
    const loader = new GLTFLoader();
    loader.load("/chrome_star.glb", (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const boxSize = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
      const scale = 2.2 / maxDim;
      model.position.sub(center.multiplyScalar(scale));
      model.scale.setScalar(scale);

      // Snap shadow plane to base
      shadowPlane.position.y = box.min.y * scale - 0.02;

      model.traverse((child) => {
        if (child.isMesh) {
          // Custom ShaderMaterial: Blender world shader chrome
          chromeMaterial = new THREE.ShaderMaterial({
            uniforms: {
              u_lightDir: { value: lightDirCurrent.clone() },
              u_envRot:   { value: new THREE.Vector2(0, 0) },
            },
            vertexShader: `
              varying vec3 v_worldNormal;
              void main() {
                v_worldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform vec3 u_lightDir;
              uniform vec2 u_envRot;
              varying vec3 v_worldNormal;

              ${CHROME_ENV_GLSL}

              vec3 rotateY(vec3 v, float a) {
                float c = cos(a), s = sin(a);
                return vec3(c*v.x + s*v.z, v.y, -s*v.x + c*v.z);
              }
              vec3 rotateX(vec3 v, float a) {
                float c = cos(a), s = sin(a);
                return vec3(v.x, c*v.y - s*v.z, s*v.y + c*v.z);
              }

              void main() {
                vec3 N = normalize(v_worldNormal);
                // Rotate the normal slightly before env lookup — shifts color bands
                vec3 Nrot = rotateY(rotateX(N, u_envRot.y), u_envRot.x);
                vec3 col = blenderChrome(Nrot, u_lightDir);

                // Subtle specular glint from the light direction
                vec3 viewDir = vec3(0.0, -1.0, 0.0);
                vec3 H = normalize(u_lightDir + (-viewDir));
                float spec = pow(max(dot(N, H), 0.0), 180.0) * 0.6;
                col += vec3(spec);

                // Fresnel dark ring at silhouette
                float fres = pow(1.0 - abs(dot(N, -viewDir)), 3.0);
                col = mix(col, vec3(0.0), fres * 0.7);

                gl_FragColor = vec4(col, 1.0);
              }
            `,
          });
          child.material = chromeMaterial;
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });

      scene.add(model);
    });

    // ── Render loop ───────────────────────────────────────────────────────────
    let raf;
    function draw() {
      raf = requestAnimationFrame(draw);

      // Smooth light + env rotation
      lightDirCurrent.lerp(lightDirTarget, 0.06).normalize();
      envRotCurrent.lerp(envRotTarget, 0.06);
      if (chromeMaterial) {
        chromeMaterial.uniforms.u_lightDir.value.copy(lightDirCurrent);
        chromeMaterial.uniforms.u_envRot.value.copy(envRotCurrent);
      }

      renderer.render(scene, camera);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
    };
  }, [size]);

  return (
    <div style={{
      position: "relative",
      display:  "inline-block",
      width:    size,
      height:   size,
      zIndex:   10,
      ...style,
    }}>
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{ width: size, height: size, display: "block" }}
      />
    </div>
  );
}
