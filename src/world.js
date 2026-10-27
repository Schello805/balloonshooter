import * as THREE from "three";
import { createTerrain } from "./terrain.js";
import { addTrees, addRocks } from "./scenery.js";
import { addGrass, addFlowers } from "./groundcover.js";
import { addMountains, addClouds, addBirds, updateAmbient } from "./ambient.js";

function createSky() {
  const geometry = new THREE.SphereGeometry(500, 40, 24);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const horizon = new THREE.Color("#e2f2ff");
  const top = new THREE.Color("#3b86cf");
  const temp = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const h = THREE.MathUtils.clamp(position.getY(i) / 260, 0, 1);
    const t = Math.pow(h, 0.62);
    temp.copy(horizon).lerp(top, t);
    colors[i * 3] = temp.r;
    colors[i * 3 + 1] = temp.g;
    colors[i * 3 + 2] = temp.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -1;
  return sky;
}

function glowTexture(innerColor, outerColor) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.22, innerColor);
  gradient.addColorStop(0.55, outerColor);
  gradient.addColorStop(1, "rgba(255,220,150,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createSunSprite(direction) {
  const group = new THREE.Group();
  const core = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture("rgba(255,255,250,1)", "rgba(255,226,150,0.55)"),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      toneMapped: false,
    })
  );
  core.scale.setScalar(70);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture("rgba(255,240,200,0.5)", "rgba(255,210,140,0.16)"),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      toneMapped: false,
    })
  );
  halo.scale.setScalar(230);
  group.add(halo, core);
  group.position.copy(direction.clone().multiplyScalar(360));
  return group;
}

export function createWorld(scene) {
  scene.background = new THREE.Color("#d3eaf9");
  scene.fog = new THREE.Fog("#cfe6f7", 80, 250);

  scene.add(createSky());

  const sunDir = new THREE.Vector3(0.52, 0.72, -0.34).normalize();
  scene.add(createSunSprite(sunDir));

  const hemi = new THREE.HemisphereLight("#dcefff", "#6d8f4a", 1.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight("#fff2d4", 2.5);
  sun.position.copy(sunDir).multiplyScalar(90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(sun.target);

  const terrain = createTerrain();
  scene.add(terrain);

  addMountains(scene);
  addTrees(scene);
  addRocks(scene);
  addGrass(scene);
  addFlowers(scene);
  const clouds = addClouds(scene);
  const birds = addBirds(scene);

  return {
    terrain,
    sun,
    update(dt, time) {
      updateAmbient(clouds, birds, time);
    },
  };
}
