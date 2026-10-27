import * as THREE from "three";
import { heightAt, slopeAt, BOUNDS } from "./terrain.js";

const trunkMat = new THREE.MeshStandardMaterial({ color: "#7a5230", flatShading: true, roughness: 1 });
const birchMat = new THREE.MeshStandardMaterial({ color: "#d9d3c4", flatShading: true, roughness: 0.95 });
const leafMats = ["#2c6f3b", "#3a8a45", "#24603a", "#4b9a4f"].map(
  (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92 })
);
const bushMats = ["#2f7a3f", "#3d8a48"].map(
  (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.95 })
);
const rockMat = new THREE.MeshStandardMaterial({ color: "#9aa3a1", flatShading: true, roughness: 0.95 });
const rockDark = new THREE.MeshStandardMaterial({ color: "#7d8785", flatShading: true, roughness: 0.97 });

const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 1.7, 6);
const pineGeo = new THREE.ConeGeometry(1.35, 2.2, 7);
const leafGeo = new THREE.IcosahedronGeometry(1.15, 0);
const rockGeo = new THREE.DodecahedronGeometry(1, 0);

function randomSpot(minRadius = 14, maxRadius = 95) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = Math.random() * Math.PI * 2;
    const r = minRadius + Math.sqrt(Math.random()) * (maxRadius - minRadius);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < BOUNDS && Math.abs(z) < BOUNDS && slopeAt(x, z) < 0.62) {
      return { x, z, y: heightAt(x, z) };
    }
  }
  return null;
}

function makePine() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.85;
  trunk.castShadow = true;
  tree.add(trunk);
  [1.35, 1.05, 0.72].forEach((scale, i) => {
    const cone = new THREE.Mesh(pineGeo, leafMats[i % leafMats.length]);
    cone.scale.setScalar(scale);
    cone.position.y = 1.9 + i * 0.95;
    cone.rotation.y = i * 0.5;
    cone.castShadow = true;
    tree.add(cone);
  });
  return tree;
}

function makeBroadleaf() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.scale.set(1.15, 1.3, 1.15);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMats[(i + 1) % leafMats.length]);
    leaf.position.set((i - 1) * 0.75, 2.9 + (i === 1 ? 0.55 : 0), (i % 2) * 0.5 - 0.25);
    leaf.scale.set(1.1 - i * 0.12, 0.95 + i * 0.1, 1.05);
    leaf.rotation.y = i * 1.1;
    leaf.castShadow = true;
    tree.add(leaf);
  }
  return tree;
}

function makeBirch() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.8, 6), birchMat);
  trunk.position.y = 1.4;
  trunk.castShadow = true;
  tree.add(trunk);
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMats[3]);
    leaf.position.set((i - 0.5) * 0.7, 3.1 + i * 0.5, (i % 2) * 0.35);
    leaf.scale.set(0.95, 0.85, 0.9);
    leaf.castShadow = true;
    tree.add(leaf);
  }
  return tree;
}

export function addTrees(scene) {
  for (let i = 0; i < 78; i++) {
    const spot = randomSpot(13, 96);
    if (!spot) continue;
    const roll = Math.random();
    const tree = roll < 0.52 ? makePine() : roll < 0.84 ? makeBroadleaf() : makeBirch();
    tree.position.set(spot.x, spot.y, spot.z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.75 + Math.random() * 0.75;
    tree.scale.setScalar(scale);
    scene.add(tree);
  }

  for (let i = 0; i < 46; i++) {
    const spot = randomSpot(12, 96);
    if (!spot) continue;
    const bush = new THREE.Group();
    const puffs = 2 + Math.floor(Math.random() * 2);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(leafGeo, bushMats[i % bushMats.length]);
      puff.position.set((Math.random() - 0.5) * 1.1, 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 1.1);
      puff.scale.set(0.8, 0.55, 0.8);
      puff.castShadow = true;
      bush.add(puff);
    }
    bush.position.set(spot.x, spot.y, spot.z);
    scene.add(bush);
  }
}

export function addRocks(scene) {
  for (let i = 0; i < 34; i++) {
    const spot = randomSpot(10, 94);
    if (!spot) continue;
    const cluster = 1 + Math.floor(Math.random() * 3);
    for (let r = 0; r < cluster; r++) {
      const rock = new THREE.Mesh(rockGeo, Math.random() < 0.5 ? rockMat : rockDark);
      const s = 0.45 + Math.random() * 1.15;
      rock.position.set(
        spot.x + (Math.random() - 0.5) * 2.4,
        spot.y + s * 0.3,
        spot.z + (Math.random() - 0.5) * 2.4
      );
      rock.scale.set(s, s * (0.6 + Math.random() * 0.4), s);
      rock.rotation.set(Math.random(), Math.random() * Math.PI, Math.random() * 0.6);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
  }

  for (let i = 0; i < 6; i++) {
    const spot = randomSpot(24, 90);
    if (!spot) continue;
    const boulder = new THREE.Mesh(rockGeo, rockDark);
    const s = 3 + Math.random() * 2.5;
    boulder.position.set(spot.x, spot.y + s * 0.28, spot.z);
    boulder.scale.set(s, s * 0.7, s * 1.1);
    boulder.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.3);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    scene.add(boulder);
  }
}
