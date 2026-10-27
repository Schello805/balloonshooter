import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { heightAt, slopeAt, BOUNDS } from "./terrain.js";

function tuftGeometry() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.ConeGeometry(0.055, 0.5 + Math.random() * 0.3, 3);
    blade.translate(0, 0.26, 0);
    blade.rotateZ((Math.random() - 0.5) * 0.55);
    blade.rotateY(Math.random() * Math.PI * 2);
    blade.translate((Math.random() - 0.5) * 0.16, 0, (Math.random() - 0.5) * 0.16);
    parts.push(blade);
  }
  return mergeGeometries(parts);
}

export function addGrass(scene) {
  const geometry = tuftGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    flatShading: true,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const count = 3600;
  const grass = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  let placed = 0;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.pow(Math.random(), 0.65) * 92;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) > BOUNDS || Math.abs(z) > BOUNDS) continue;
    if (slopeAt(x, z) > 0.5) continue;

    dummy.position.set(x, heightAt(x, z), z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.62 + Math.random() * 0.75;
    dummy.scale.set(s, s * (0.8 + Math.random() * 0.45), s);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);

    color.setHSL(0.23 + Math.random() * 0.07, 0.42, 0.34 + Math.random() * 0.16);
    grass.setColorAt(placed, color);
    placed += 1;
  }
  grass.count = placed;
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  grass.receiveShadow = true;
  grass.frustumCulled = false;
  scene.add(grass);
}

export function addFlowers(scene) {
  const geometry = new THREE.IcosahedronGeometry(0.07, 0);
  const material = new THREE.MeshStandardMaterial({ color: "#ffffff", flatShading: true, roughness: 0.85 });
  const colors = ["#fff6de", "#ffe066", "#ff9fb8", "#c9a7ff", "#ffffff"];
  const count = 520;
  const flowers = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  let placed = 0;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.pow(Math.random(), 0.6) * 88;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (slopeAt(x, z) > 0.45) continue;

    dummy.position.set(x, heightAt(x, z) + 0.42, z);
    dummy.rotation.y = Math.random() * Math.PI;
    const s = 0.8 + Math.random() * 0.8;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    flowers.setMatrixAt(placed, dummy.matrix);
    color.setStyle(colors[Math.floor(Math.random() * colors.length)]);
    flowers.setColorAt(placed, color);
    placed += 1;
  }
  flowers.count = placed;
  flowers.instanceMatrix.needsUpdate = true;
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  flowers.frustumCulled = false;
  scene.add(flowers);
}
