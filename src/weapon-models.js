import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const steel = new THREE.MeshStandardMaterial({
  color: "#9aa6ad",
  roughness: 0.38,
  metalness: 0.3,
  emissive: "#131a1e",
  emissiveIntensity: 0.45,
});
const steelDark = new THREE.MeshStandardMaterial({
  color: "#5d676f",
  roughness: 0.5,
  metalness: 0.26,
  emissive: "#0f1518",
  emissiveIntensity: 0.45,
});
const black = new THREE.MeshStandardMaterial({
  color: "#343d43",
  roughness: 0.6,
  metalness: 0.18,
  emissive: "#0d1215",
  emissiveIntensity: 0.5,
});
const polymer = new THREE.MeshStandardMaterial({ color: "#48544b", roughness: 0.92, metalness: 0.04 });
const polymerLight = new THREE.MeshStandardMaterial({ color: "#59665c", roughness: 0.9, metalness: 0.04 });
const glove = new THREE.MeshStandardMaterial({ color: "#7b7663", roughness: 0.96, metalness: 0.02 });
const gloveDark = new THREE.MeshStandardMaterial({ color: "#5f5b4a", roughness: 0.96, metalness: 0.02 });
const glass = new THREE.MeshStandardMaterial({
  color: "#a6dcef",
  roughness: 0.06,
  metalness: 0.15,
  emissive: "#2f7f9c",
  emissiveIntensity: 0.75,
});
const lensTint = new THREE.MeshStandardMaterial({
  color: "#101f26",
  roughness: 0.12,
  metalness: 0.4,
  emissive: "#123845",
  emissiveIntensity: 0.28,
});
const redDot = new THREE.MeshStandardMaterial({
  color: "#ff5a4a",
  emissive: "#ff2a1a",
  emissiveIntensity: 2.4,
  roughness: 0.4,
});

function box(w, h, d, material, radius = 0.008) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), material);
}

function at(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

function tube(radius, length, material, segments = 16, r2 = radius) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, radius, length, segments), material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function ring(radius, thickness) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 8, 18), steelDark);
}

function glovedHand(material, mirrored = false) {
  const hand = new THREE.Group();
  const palm = box(0.052, 0.092, 0.072, material, 0.022);
  hand.add(palm);

  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0105, 0.052, 3, 7), material);
    finger.rotation.z = Math.PI / 2;
    finger.position.set(0, 0.032 - i * 0.021, -0.046);
    hand.add(finger);
  }

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0115, 0.048, 3, 7), material);
  thumb.rotation.set(0.5, 0, mirrored ? -0.9 : 0.9);
  thumb.position.set(mirrored ? 0.03 : -0.03, -0.014, 0.012);
  hand.add(thumb);

  return hand;
}

export function createBoltRifleModel() {
  const group = new THREE.Group();

  const receiver = box(0.076, 0.096, 0.54, steelDark, 0.012);
  group.add(receiver);
  group.add(at(box(0.07, 0.022, 0.5, steel, 0.006), 0, 0.055, -0.01));
  group.add(at(box(0.046, 0.013, 0.42, black, 0.004), 0, 0.072, -0.02));

  group.add(at(tube(0.019, 0.62, steel), 0, 0.012, -0.58));
  group.add(at(tube(0.03, 0.11, black, 12, 0.034), 0, 0.012, -0.94));
  group.add(at(ring(0.031, 0.005), 0, 0.012, -1.0));

  const handguard = box(0.066, 0.072, 0.34, polymer, 0.018);
  group.add(at(handguard, 0, 0.006, -0.36));
  for (let i = 0; i < 4; i++) {
    group.add(at(box(0.072, 0.018, 0.026, black, 0.005), 0, 0.008, -0.26 - i * 0.062));
  }

  const stock = box(0.066, 0.1, 0.38, polymer, 0.016);
  stock.rotation.x = 0.025;
  group.add(at(stock, 0, -0.014, 0.44));
  group.add(at(box(0.05, 0.042, 0.2, polymerLight, 0.014), 0, 0.042, 0.31));
  group.add(at(box(0.07, 0.115, 0.028, black, 0.008), 0, -0.012, 0.64));
  group.add(at(box(0.02, 0.02, 0.14, steel, 0.006), 0.032, -0.02, 0.52));

  const grip = box(0.056, 0.16, 0.088, polymer, 0.018);
  grip.rotation.x = -0.28;
  group.add(at(grip, 0, -0.115, 0.19));

  group.add(at(box(0.05, 0.012, 0.085, black, 0.004), 0, -0.072, 0.115));
  group.add(at(box(0.012, 0.034, 0.02, black, 0.004), -0.021, -0.09, 0.092));
  group.add(at(box(0.012, 0.03, 0.02, black, 0.004), -0.021, -0.083, 0.148));

  const magazine = box(0.052, 0.125, 0.1, steelDark, 0.012);
  group.add(at(magazine, 0, -0.1, -0.04));

  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.105, 8), steel);
  bolt.rotation.z = Math.PI / 2;
  group.add(at(bolt, 0.058, 0.006, 0.135));
  const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), black);
  group.add(at(boltKnob, 0.112, 0.006, 0.135));

  const scopeTube = tube(0.032, 0.3, black, 18);
  group.add(at(scopeTube, 0, 0.138, -0.01));
  group.add(at(tube(0.043, 0.1, black, 18, 0.036), 0, 0.138, -0.2));
  group.add(at(tube(0.038, 0.085, black, 18, 0.033), 0, 0.138, 0.15));
  group.add(at(ring(0.038, 0.007), 0, 0.138, -0.12));
  group.add(at(ring(0.038, 0.007), 0, 0.138, 0.07));

  const frontLens = new THREE.Mesh(new THREE.CircleGeometry(0.037, 20), glass);
  group.add(at(frontLens, 0, 0.138, -0.252));
  frontLens.rotation.y = Math.PI;
  const rearLens = new THREE.Mesh(new THREE.CircleGeometry(0.031, 20), lensTint);
  group.add(at(rearLens, 0, 0.138, 0.194));

  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.032, 12), steelDark);
  group.add(at(turret, 0, 0.186, -0.02));
  const sideKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.028, 12), steelDark);
  sideKnob.rotation.z = Math.PI / 2;
  group.add(at(sideKnob, 0.046, 0.138, -0.02));

  const rightHand = glovedHand(glove);
  rightHand.position.set(0.016, -0.122, 0.19);
  rightHand.rotation.set(-0.28, -0.14, 0.04);
  group.add(rightHand);

  const leftHand = glovedHand(gloveDark, true);
  leftHand.position.set(-0.026, -0.058, -0.355);
  leftHand.rotation.set(-0.22, 0.18, 0.1);
  leftHand.scale.set(0.95, 0.95, 0.95);
  group.add(leftHand);

  return { group, muzzle: new THREE.Vector3(0, 0.012, -1.02), flashScale: 1 };
}

export function createRapidRifleModel() {
  const group = new THREE.Group();

  group.add(at(box(0.07, 0.082, 0.36, polymer, 0.014), 0, -0.008, 0));
  group.add(at(box(0.062, 0.048, 0.34, steelDark, 0.012), 0, 0.044, -0.01));

  for (let i = 0; i < 6; i++) {
    group.add(at(box(0.04, 0.013, 0.034, black, 0.003), 0, 0.076, -0.15 + i * 0.052));
  }

  group.add(at(tube(0.026, 0.24, black), 0, 0.012, -0.31));
  for (let i = 0; i < 4; i++) {
    group.add(at(box(0.062, 0.016, 0.022, steelDark, 0.004), 0, 0.012, -0.24 - i * 0.05));
  }
  group.add(at(tube(0.026, 0.1, steel, 12, 0.032), 0, 0.012, -0.48));
  for (let i = 0; i < 3; i++) {
    group.add(at(box(0.07, 0.008, 0.014, black, 0.002), 0, 0.012, -0.45 - i * 0.026));
  }

  group.add(at(box(0.056, 0.056, 0.2, polymerLight, 0.016), 0, -0.012, -0.27));

  group.add(at(box(0.026, 0.03, 0.26, steelDark, 0.008), 0, 0.026, 0.31));
  group.add(at(box(0.026, 0.028, 0.26, steelDark, 0.008), 0, -0.022, 0.31));
  group.add(at(box(0.042, 0.1, 0.03, black, 0.01), 0, 0.002, 0.45));

  const grip = box(0.05, 0.145, 0.08, polymer, 0.018);
  grip.rotation.x = -0.24;
  group.add(at(grip, 0, -0.108, 0.152));

  group.add(at(box(0.044, 0.011, 0.078, black, 0.004), 0, -0.064, 0.092));
  group.add(at(box(0.011, 0.03, 0.02, black, 0.004), -0.018, -0.082, 0.07));
  group.add(at(box(0.011, 0.028, 0.02, black, 0.004), -0.018, -0.078, 0.12));

  const magUpper = box(0.046, 0.12, 0.078, steelDark, 0.012);
  magUpper.rotation.x = 0.12;
  group.add(at(magUpper, 0, -0.09, -0.055));
  const magLower = box(0.044, 0.11, 0.072, steelDark, 0.012);
  magLower.rotation.x = 0.3;
  group.add(at(magLower, 0, -0.175, -0.03));

  const foregrip = box(0.044, 0.12, 0.058, polymerLight, 0.016);
  foregrip.rotation.x = 0.16;
  group.add(at(foregrip, 0, -0.09, -0.29));

  group.add(at(box(0.018, 0.026, 0.07, steel, 0.005), 0.044, 0.03, -0.02));
  group.add(at(box(0.02, 0.02, 0.02, black, 0.004), 0.05, -0.02, 0.02));

  const sightBase = box(0.046, 0.024, 0.09, black, 0.006);
  group.add(at(sightBase, 0, 0.098, -0.07));
  const sightHousing = box(0.05, 0.052, 0.07, black, 0.012);
  group.add(at(sightHousing, 0, 0.126, -0.07));
  const sightGlass = new THREE.Mesh(new THREE.CircleGeometry(0.019, 16), glass);
  group.add(at(sightGlass, 0, 0.126, -0.106));
  sightGlass.rotation.y = Math.PI;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), redDot);
  group.add(at(dot, 0, 0.126, -0.104));

  const rightHand = glovedHand(glove);
  rightHand.position.set(0.016, -0.116, 0.148);
  rightHand.rotation.set(-0.24, -0.14, 0.04);
  group.add(rightHand);

  const leftHand = glovedHand(gloveDark, true);
  leftHand.position.set(-0.024, -0.1, -0.305);
  leftHand.rotation.set(0.14, 0.18, 0.1);
  leftHand.scale.set(0.95, 0.95, 0.95);
  group.add(leftHand);

  return { group, muzzle: new THREE.Vector3(0, 0.012, -0.54), flashScale: 0.7 };
}
