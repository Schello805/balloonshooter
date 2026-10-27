import * as THREE from "three";
import { heightAt, BOUNDS } from "./terrain.js";

export const PALETTE = [
  { id: "red", name: "Rot", color: "#ff4d5e", points: 100, weight: 34, size: 1.0, speed: 1.0 },
  { id: "blue", name: "Blau", color: "#3fa9ff", points: 150, weight: 26, size: 0.95, speed: 1.1 },
  { id: "green", name: "Grün", color: "#4ade80", points: 200, weight: 18, size: 0.88, speed: 1.15 },
  { id: "yellow", name: "Gelb", color: "#f9e84a", points: 300, weight: 12, size: 0.8, speed: 1.25 },
  { id: "purple", name: "Lila", color: "#a78bfa", points: 500, weight: 7, size: 0.72, speed: 1.35 },
  { id: "gold", name: "Gold", color: "#ffb300", points: 750, weight: 3, size: 0.62, speed: 1.5 },
];

const TOTAL_WEIGHT = PALETTE.reduce((sum, p) => sum + p.weight, 0);
const BALLOON_COUNT = 27;
const MIN_DISTANCE = 21;
const SPAWN_DISTANCE = 30;
const SPAWN_CLEAR = 34;
const STRING_LENGTH = 2.2;

function pickColor() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const entry of PALETTE) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return PALETTE[0];
}

const sphereGeo = new THREE.SphereGeometry(1.0, 14, 12);
const knotGeo = new THREE.ConeGeometry(0.16, 0.3, 6);

export class BalloonField {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.balloons = [];
    this.meshes = [];
    this.effects = [];
    this.generation = 0;
    this.group = new THREE.Group();
    scene.add(this.group);

    for (let i = 0; i < BALLOON_COUNT; i++) {
      this.spawn(true);
    }
  }

  randomPlacement() {
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = SPAWN_DISTANCE + Math.pow(Math.random(), 0.75) * 38;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.abs(x) > BOUNDS - 6 || Math.abs(z) > BOUNDS - 6) continue;
      const dx = x - this.player.position.x;
      const dz = z - this.player.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < SPAWN_DISTANCE) continue;

      const viewX = -Math.sin(this.player.yaw);
      const viewZ = -Math.cos(this.player.yaw);
      if (dist < SPAWN_CLEAR && (dx * viewX + dz * viewZ) / dist > 0.8) continue;
      const ground = heightAt(x, z);
      const height = 6 + Math.random() * 14;
      return new THREE.Vector3(x, ground + height, z);
    }
    let dirX = -this.player.position.x;
    let dirZ = -this.player.position.z;
    if (Math.hypot(dirX, dirZ) < 1) {
      dirX = 1;
      dirZ = 0;
    }
    const length = Math.hypot(dirX, dirZ);
    const x = THREE.MathUtils.clamp(this.player.position.x + (dirX / length) * 42, -BOUNDS + 8, BOUNDS - 8);
    const z = THREE.MathUtils.clamp(this.player.position.z + (dirZ / length) * 42, -BOUNDS + 8, BOUNDS - 8);
    return new THREE.Vector3(x, heightAt(x, z) + 14, z);
  }

  spawn(initial = false) {
    const spec = pickColor();
    const anchor = this.randomPlacement();

    const material = new THREE.MeshStandardMaterial({
      color: spec.color,
      flatShading: true,
      roughness: 0.32,
      metalness: 0.05,
      emissive: new THREE.Color(spec.color),
      emissiveIntensity: spec.id === "gold" ? 0.55 : 0.14,
    });

    const balloon = new THREE.Group();
    const body = new THREE.Mesh(sphereGeo, material);
    body.scale.set(spec.size, spec.size * 1.18, spec.size);
    body.castShadow = true;

    const knot = new THREE.Mesh(knotGeo, material);
    knot.position.y = -spec.size * 1.02;
    knot.rotation.x = Math.PI;

    const stringMat = new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.45,
    });
    const stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -spec.size * 1.1, 0),
      new THREE.Vector3(0, -spec.size * 1.1 - STRING_LENGTH, 0),
    ]);
    const string = new THREE.Line(stringGeo, stringMat);

    balloon.add(body, knot, string);
    balloon.position.copy(anchor);
    balloon.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });

    const entry = {
      spec,
      object: balloon,
      body,
      anchor: anchor.clone(),
      baseY: anchor.y,
      phase: Math.random() * Math.PI * 2,
      bobSpeed: (0.7 + Math.random() * 0.8) * spec.speed,
      bobAmount: 0.5 + Math.random() * 1.1,
      driftRadius: 1.4 + Math.random() * 5 * spec.speed,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: (0.12 + Math.random() * 0.3) * spec.speed * (Math.random() < 0.5 ? 1 : -1),
      alive: true,
      bornAt: initial ? -999 : performance.now() / 1000,
    };

    balloon.userData.balloon = entry;
    this.group.add(balloon);
    this.balloons.push(entry);
    this.meshes.push(body);
    body.userData.entry = entry;
    return entry;
  }

  update(dt, time) {
    for (const b of this.balloons) {
      if (!b.alive) continue;
      b.driftAngle += b.driftSpeed * dt;
      b.object.position.x = b.anchor.x + Math.cos(b.driftAngle) * b.driftRadius;
      b.object.position.z = b.anchor.z + Math.sin(b.driftAngle) * b.driftRadius;
      b.object.position.y = b.baseY + Math.sin(time * b.bobSpeed + b.phase) * b.bobAmount;
      b.object.rotation.z = Math.sin(time * b.bobSpeed * 0.8 + b.phase) * 0.12;

      const dx = b.object.position.x - this.player.position.x;
      const dz = b.object.position.z - this.player.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < MIN_DISTANCE) {
        const nx = distance > 0.001 ? dx / distance : 1;
        const nz = distance > 0.001 ? dz / distance : 0;
        const shift = MIN_DISTANCE - distance;
        b.anchor.x += nx * shift;
        b.anchor.z += nz * shift;
        b.object.position.x += nx * shift;
        b.object.position.z += nz * shift;
      }
      const grow = Math.min(1, (time - b.bornAt) / 0.5);
      b.object.scale.setScalar(0.25 + 0.75 * grow);
    }
    this.updateEffects(dt);
  }

  hitTest(raycaster) {
    const hits = raycaster.intersectObjects(this.meshes, false);
    return hits.length ? hits[0].object.userData.entry : null;
  }

  pop(entry) {
    entry.alive = false;
    const pos = entry.object.position.clone();
    this.group.remove(entry.object);
    entry.object.traverse((o) => {
      if (o.isMesh) o.material.dispose();
      if (o.isLine) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
    this.balloons = this.balloons.filter((b) => b !== entry);
    this.meshes = this.meshes.filter((m) => m.userData.entry !== entry);

    this.burst(pos, entry.spec.color, entry.spec.size);

    const gen = this.generation;
    setTimeout(() => {
      if (gen === this.generation && this.balloons.length < BALLOON_COUNT) this.spawn();
    }, 450);
  }

  burst(position, color, size) {
    const count = 34;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.2,
        Math.random() - 0.5
      ).normalize();
      dir.multiplyScalar((4 + Math.random() * 9) * size);
      velocities.push(dir);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.22 * size + 0.08,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.effects.push({ points, velocities, life: 0, maxLife: 0.85 });

    const ringGeo = new THREE.RingGeometry(0.4, 0.55, 18);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.scale.setScalar(size);
    this.scene.add(ring);
    this.effects.push({ ring, life: 0, maxLife: 0.4 });
  }

  updateEffects(dt) {
    for (const fx of this.effects) {
      fx.life += dt;
      const t = fx.life / fx.maxLife;
      if (fx.points) {
        const arr = fx.points.geometry.attributes.position.array;
        for (let i = 0; i < fx.velocities.length; i++) {
          const v = fx.velocities[i];
          arr[i * 3] += v.x * dt;
          arr[i * 3 + 1] += v.y * dt;
          arr[i * 3 + 2] += v.z * dt;
          v.y -= 16 * dt;
        }
        fx.points.geometry.attributes.position.needsUpdate = true;
        fx.points.material.opacity = 1 - t;
      }
      if (fx.ring) {
        fx.ring.scale.addScalar(dt * 16);
        fx.ring.material.opacity = 0.85 * (1 - t);
        fx.ring.lookAt(this.player.camera.position);
      }
    }

    this.effects = this.effects.filter((fx) => {
      if (fx.life < fx.maxLife) return true;
      const obj = fx.points || fx.ring;
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
      return false;
    });
  }

  reset() {
    this.generation += 1;
    for (const b of [...this.balloons]) {
      this.group.remove(b.object);
      b.object.traverse((o) => {
        if (o.isMesh) o.material.dispose();
        if (o.isLine) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
    this.balloons = [];
    this.meshes = [];
    for (const fx of this.effects) {
      const obj = fx.points || fx.ring;
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    }
    this.effects = [];
    for (let i = 0; i < BALLOON_COUNT; i++) this.spawn(true);
  }
}
