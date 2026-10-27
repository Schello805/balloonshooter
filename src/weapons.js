import * as THREE from "three";
import { createBoltRifleModel, createRapidRifleModel } from "./weapon-models.js";

const brass = new THREE.MeshStandardMaterial({ color: "#d9a441", roughness: 0.35, metalness: 0.8 });

let flashTexture = null;
function getFlashTexture() {
  if (flashTexture) return flashTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,240,1)");
  gradient.addColorStop(0.28, "rgba(255,224,150,0.92)");
  gradient.addColorStop(0.55, "rgba(255,150,50,0.36)");
  gradient.addColorStop(1, "rgba(255,110,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  flashTexture = new THREE.CanvasTexture(canvas);
  return flashTexture;
}

class Weapon {
  constructor(spec) {
    Object.assign(this, spec);
    this.group = new THREE.Group();
    this.group.scale.setScalar(this.scale);
    this.cooldown = 0;
    this.kick = 0;
    this.sway = 0;
    this.ammo = this.maxAmmo;

    const model = this.buildModel();
    this.group.add(model.group);
    this.muzzle = model.muzzle;

    this.flash = new THREE.PointLight("#ffce7a", 0, 4.5, 2);
    this.flash.position.copy(this.muzzle);
    this.group.add(this.flash);

    this.flashSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getFlashTexture(),
        color: "#ffe6b0",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.flashSprite.position.copy(this.muzzle);
    this.flashSprite.scale.setScalar(0.42 * model.flashScale);
    this.group.add(this.flashSprite);

    this.group.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });
  }

  fire() {
    if (this.cooldown > 0) return false;
    if (this.ammo <= 0) return false;
    this.cooldown = this.cooldownTime;
    if (Number.isFinite(this.ammo)) this.ammo -= 1;
    this.kick = 1;
    return true;
  }

  update(dt, speed, aiming) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.kick += (0 - this.kick) * Math.min(1, dt * 10);
    this.flash.intensity *= Math.exp(-dt * 30);
    this.flashSprite.material.opacity *= Math.exp(-dt * 30);

    this.sway += dt * (1.6 + speed * 0.55);
    const moving = speed > 0.6 ? 1 : 0.25;
    const aimX = aiming ? this.aimOffset : 0;

    const targetX = this.basePos.x - aimX + Math.cos(this.sway) * 0.009 * moving;
    const targetY = this.basePos.y + aimX * 0.72 + Math.sin(this.sway * 2) * 0.008 * moving;

    const blend = Math.min(1, dt * 14);
    this.group.position.x += (targetX - this.group.position.x) * blend;
    this.group.position.y += (targetY - this.group.position.y) * blend;
    this.group.position.z = this.basePos.z + this.kick * this.kickTravel;

    this.group.rotation.x = this.baseRotX + this.kick * this.kickRot;
    this.group.rotation.y = this.baseRotY;
    this.group.rotation.z = this.kick * 0.02 + Math.sin(this.sway) * 0.004 * moving;
  }

  flashNow() {
    this.flash.intensity = 5.5;
    this.flashSprite.material.opacity = 1;
    this.flashSprite.material.rotation = Math.random() * Math.PI * 2;
  }

  resetAmmo() {
    this.ammo = this.maxAmmo;
    this.cooldown = 0;
    this.kick = 0;
  }
}

class BoltRifle extends Weapon {
  constructor() {
    super({
      id: "bolt",
      name: "Präzision",
      cooldownTime: 0.36,
      auto: false,
      maxAmmo: Infinity,
      ammoLabel: "∞",
      recoilPitch: 0.021,
      recoilYaw: 0.002,
      scale: 0.68,
      basePos: new THREE.Vector3(0.33, -0.285, -0.6),
      baseRotX: 0,
      baseRotY: -0.05,
      aimOffset: 0.055,
      kickTravel: 0.1,
      kickRot: 0.15,
      buildModel: createBoltRifleModel,
    });
  }
}

class RapidRifle extends Weapon {
  constructor() {
    super({
      id: "rapid",
      name: "Schnellfeuer",
      cooldownTime: 0.06,
      auto: true,
      maxAmmo: 30,
      ammoLabel: "30",
      recoilPitch: 0.008,
      recoilYaw: 0.005,
      scale: 0.7,
      basePos: new THREE.Vector3(0.32, -0.28, -0.56),
      baseRotX: 0,
      baseRotY: -0.04,
      aimOffset: 0.062,
      kickTravel: 0.055,
      kickRot: 0.1,
      buildModel: createRapidRifleModel,
    });
  }
}

export class WeaponManager {
  constructor(camera) {
    this.holder = new THREE.Group();
    camera.add(this.holder);

    this.weapons = [new BoltRifle(), new RapidRifle()];
    this.index = 0;
    this.switching = false;
    this.switchT = 0;
    this.pending = null;
    this.shells = [];

    for (const weapon of this.weapons) {
      weapon.group.visible = false;
      this.holder.add(weapon.group);
    }
    this.weapons[0].group.visible = true;
  }

  get current() {
    return this.weapons[this.index];
  }

  reset() {
    this.index = 0;
    this.switching = false;
    this.switchT = 0;
    this.pending = null;
    for (const weapon of this.weapons) {
      weapon.resetAmmo();
      weapon.group.visible = false;
    }
    this.weapons[0].group.visible = true;
    this.holder.position.set(0, 0, 0);
    this.holder.rotation.set(0, 0, 0);
    for (const shell of this.shells) this.holder.parent.remove(shell.mesh);
    this.shells = [];
  }

  select(index) {
    if (this.switching || index === this.index || !this.weapons[index]) return false;
    this.pending = index;
    this.switching = true;
    this.switchT = 0;
    return true;
  }

  toggle() {
    return this.select((this.index + 1) % this.weapons.length);
  }

  tryFire() {
    if (this.switching) return false;
    return this.current.fire();
  }

  ejectShell() {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.036, 6), brass);
    shell.position.copy(this.current.muzzle);
    shell.position.x += 0.09;
    shell.position.z += 0.34;
    shell.rotation.z = Math.PI / 2;
    this.holder.parent.add(shell);
    this.shells.push({
      mesh: shell,
      vel: new THREE.Vector3(1.4 + Math.random() * 0.6, 0.9 + Math.random() * 0.5, 0.5),
      life: 0,
    });
  }

  update(dt, player, aiming) {
    if (this.switching) {
      this.switchT += dt / 0.34;
      if (this.switchT >= 0.5 && this.pending !== null) {
        this.weapons[this.index].group.visible = false;
        this.index = this.pending;
        this.pending = null;
        this.weapons[this.index].group.visible = true;
      }
      if (this.switchT >= 1) {
        this.switching = false;
        this.switchT = 0;
      }
    }

    const lower = this.switching ? Math.sin(Math.min(1, this.switchT) * Math.PI) : 0;
    this.holder.position.y = -lower * 0.32;
    this.holder.position.z = lower * 0.05;
    this.holder.rotation.x = -lower * 0.55;
    this.holder.rotation.z = lower * 0.16;

    const speed = Math.hypot(player.velocity.x, player.velocity.z);
    for (const weapon of this.weapons) {
      weapon.update(dt, speed, aiming && weapon === this.current);
    }

    for (const shell of this.shells) {
      shell.life += dt;
      shell.vel.y -= 9 * dt;
      shell.mesh.position.addScaledVector(shell.vel, dt);
      shell.mesh.rotation.x += dt * 12;
      shell.mesh.rotation.y += dt * 6;
    }
    this.shells = this.shells.filter((shell) => {
      if (shell.life < 1.1) return true;
      shell.mesh.parent?.remove(shell.mesh);
      shell.mesh.geometry.dispose();
      return false;
    });
  }
}
