import * as THREE from "three";

export const WORLD_SIZE = 220;
export const BOUNDS = 96;

export function heightAt(x, z) {
  const rolling = 6.2 * Math.sin(x * 0.038) * Math.cos(z * 0.034);
  const cross = 3.1 * Math.sin((x + z) * 0.055 + 1.2);
  const detail = 1.7 * Math.cos(x * 0.108 - z * 0.082);
  const ripple = 0.85 * Math.sin(x * 0.27) * Math.cos(z * 0.23);
  const knoll = 1.3 * Math.exp(-((x - 42) ** 2 + (z + 38) ** 2) / 900);
  return rolling + cross + detail + ripple + knoll;
}

export function slopeAt(x, z) {
  const e = 0.8;
  const dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
  const dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
  return Math.hypot(dx, dz);
}

const palette = {
  low: new THREE.Color("#4f7f36"),
  mid: new THREE.Color("#76b352"),
  high: new THREE.Color("#a2cd77"),
  rock: new THREE.Color("#8a8f86"),
  dirt: new THREE.Color("#7c6b4f"),
};

function colorFor(y, normalY, jitter) {
  const t = THREE.MathUtils.clamp((y + 6) / 13, 0, 1);
  let color;
  if (normalY < 0.74) {
    color = groundRamp(y).lerp(palette.rock, THREE.MathUtils.clamp((0.74 - normalY) * 3.6, 0, 0.85));
  } else {
    color = groundRamp(y);
  }
  color.offsetHSL(jitter * 0.008, jitter * 0.04, jitter * 0.045);
  return color;
}

function groundRamp(y) {
  const t = THREE.MathUtils.clamp((y + 6) / 13, 0, 1);
  if (t < 0.45) return palette.low.clone().lerp(palette.mid, t / 0.45);
  return palette.mid.clone().lerp(palette.high, (t - 0.45) / 0.55);
}

export function createTerrain() {
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 148, 148);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  }

  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();

  const fp = flat.attributes.position;
  const fn = flat.attributes.normal;
  const colors = new Float32Array(fp.count * 3);

  for (let i = 0; i < fp.count; i += 3) {
    const y = (fp.getY(i) + fp.getY(i + 1) + fp.getY(i + 2)) / 3;
    const ny = (fn.getY(i) + fn.getY(i + 1) + fn.getY(i + 2)) / 3;
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const jitter = (seed - Math.floor(seed)) * 2 - 1;
    const c = colorFor(y, ny, jitter);
    for (let v = 0; v < 3; v++) {
      colors[(i + v) * 3] = c.r;
      colors[(i + v) * 3 + 1] = c.g;
      colors[(i + v) * 3 + 2] = c.b;
    }
  }
  flat.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.96,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(flat, material);
  mesh.receiveShadow = true;
  return mesh;
}
