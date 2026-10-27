import * as THREE from "three";

export function addMountains(scene) {
  const mats = ["#8aa6b8", "#93aec0", "#809caf"].map(
    (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 })
  );

  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 26 : 18;
    const baseRadius = ring === 0 ? 148 : 205;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2 + ring * 0.09;
      const radius = baseRadius + Math.random() * 42;
      const height = (ring === 0 ? 20 : 32) + Math.random() * (ring === 0 ? 24 : 34);
      const width = height * (0.78 + Math.random() * 0.45);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(width, height, 7), mats[(i + ring) % mats.length]);
      cone.position.set(Math.cos(angle) * radius, height / 2 - 18, Math.sin(angle) * radius);
      cone.rotation.y = Math.random() * Math.PI;
      cone.scale.z = 0.65 + Math.random() * 0.6;
      scene.add(cone);
    }
  }
}


export function addClouds(scene) {
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    flatShading: true,
    roughness: 1,
    emissive: "#d6ebff",
    emissiveIntensity: 0.3,
  });
  const puff = new THREE.IcosahedronGeometry(1, 1);
  const clouds = [];

  for (let i = 0; i < 14; i++) {
    const group = new THREE.Group();
    const count = 4 + Math.floor(Math.random() * 3);
    for (let p = 0; p < count; p++) {
      const mesh = new THREE.Mesh(puff, material);
      mesh.position.set((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 6);
      const s = 2.6 + Math.random() * 3;
      mesh.scale.set(s, s * 0.6, s * 0.82);
      group.add(mesh);
    }
    const a = Math.random() * Math.PI * 2;
    const r = 50 + Math.random() * 110;
    group.position.set(Math.cos(a) * r, 52 + Math.random() * 28, Math.sin(a) * r);
    group.scale.setScalar(0.9 + Math.random() * 0.8);
    scene.add(group);
    clouds.push({ group, speed: 0.4 + Math.random() * 0.6 });
  }
  return clouds;
}

export function addBirds(scene) {
  const material = new THREE.MeshStandardMaterial({ color: "#2f3a40", flatShading: true, roughness: 0.9 });
  const wingGeo = new THREE.BoxGeometry(0.9, 0.04, 0.18);
  const birds = [];

  for (let i = 0; i < 7; i++) {
    const bird = new THREE.Group();
    const left = new THREE.Mesh(wingGeo, material);
    left.position.x = -0.45;
    left.rotation.z = 0.28;
    const right = new THREE.Mesh(wingGeo, material);
    right.position.x = 0.45;
    right.rotation.z = -0.28;
    bird.add(left, right);
    bird.scale.setScalar(1.6 + Math.random());
    scene.add(bird);
    birds.push({
      group: bird,
      radius: 45 + Math.random() * 55,
      height: 32 + Math.random() * 20,
      angle: Math.random() * Math.PI * 2,
      speed: 0.1 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return birds;
}

export function updateAmbient(clouds, birds, time) {
  for (const cloud of clouds) {
    cloud.group.position.x += cloud.speed * 0.1;
    if (cloud.group.position.x > 190) cloud.group.position.x = -190;
  }
  for (const bird of birds) {
    bird.angle += bird.speed * 0.016;
    const x = Math.cos(bird.angle) * bird.radius;
    const z = Math.sin(bird.angle) * bird.radius;
    bird.group.position.set(x, bird.height + Math.sin(time * 0.6 + bird.phase) * 2, z);
    bird.group.rotation.y = -bird.angle + Math.PI / 2;
    bird.group.rotation.z = Math.sin(time * 2 + bird.phase) * 0.12;
  }
}
