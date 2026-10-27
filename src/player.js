import * as THREE from "three";
import { heightAt, BOUNDS } from "./terrain.js";

const EYE_HEIGHT = 1.72;
const WALK_SPEED = 9;
const SPRINT_SPEED = 15;
const GRAVITY = 26;
const JUMP = 9;
const SENSITIVITY = 0.0022;

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.position = new THREE.Vector3(0, heightAt(0, 0) + EYE_HEIGHT, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.recoil = 0;
    this.yawKick = 0;
    this.bob = 0;
    this.onGround = true;
    this.enabled = false;
    this.freeLook = false;
    this.keys = new Set();
    this.aiming = false;
    this.sprinting = false;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }

  onMouseMove(e) {
    if (!this.enabled) return;
    if (!this.freeLook && document.pointerLockElement !== this.dom) return;
    this.yaw -= e.movementX * SENSITIVITY * (this.aiming ? 0.6 : 1);
    this.pitch -= e.movementY * SENSITIVITY * (this.aiming ? 0.6 : 1);
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.45, 1.45);
  }

  onKeyDown(e) {
    this.keys.add(e.code);
    if (e.code === "Space") e.preventDefault();
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
  }

  reset() {
    this.position.set(0, heightAt(0, 0) + EYE_HEIGHT, 0);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.recoil = 0;
    this.yawKick = 0;
  }

  addRecoil(pitchAmount, yawAmount = 0) {
    this.recoil += pitchAmount;
    this.yawKick += yawAmount;
  }

  update(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const dir = new THREE.Vector3();
    if (this.enabled) {
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) dir.add(forward);
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dir.sub(forward);
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dir.add(right);
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) dir.sub(right);
    }

    this.sprinting = this.enabled && this.keys.has("ShiftLeft") && !this.aiming && dir.lengthSq() > 0;
    const speed = this.aiming ? WALK_SPEED * 0.55 : this.sprinting ? SPRINT_SPEED : WALK_SPEED;

    if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(speed);
    const smoothing = 1 - Math.exp(-12 * dt);
    this.velocity.x += (dir.x - this.velocity.x) * smoothing;
    this.velocity.z += (dir.z - this.velocity.z) * smoothing;

    if (this.enabled && this.keys.has("Space") && this.onGround) {
      this.velocity.y = JUMP;
      this.onGround = false;
    }

    this.velocity.y -= GRAVITY * dt;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y += this.velocity.y * dt;

    this.position.x = THREE.MathUtils.clamp(this.position.x, -BOUNDS, BOUNDS);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -BOUNDS, BOUNDS);

    const floor = heightAt(this.position.x, this.position.z) + EYE_HEIGHT;
    if (this.position.y <= floor) {
      this.position.y = floor;
      this.velocity.y = 0;
      this.onGround = true;
    }

    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const moving = this.onGround && planarSpeed > 0.6;
    this.bob += dt * planarSpeed * (this.sprinting ? 1.5 : 1.1);
    const bobY = moving ? Math.sin(this.bob) * 0.045 : 0;
    const bobX = moving ? Math.cos(this.bob * 0.5) * 0.02 : 0;

    this.recoil += (0 - this.recoil) * Math.min(1, dt * 8);
    this.yawKick += (0 - this.yawKick) * Math.min(1, dt * 8);

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw + this.yawKick;
    this.camera.rotation.x = this.pitch + this.recoil;
    this.camera.position.set(this.position.x + bobX, this.position.y + bobY, this.position.z);
  }
}
