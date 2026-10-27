import * as THREE from "three";
import "./styles.css";
import { createWorld } from "./world.js";
import { heightAt } from "./terrain.js";
import { Player } from "./player.js";
import { BalloonField } from "./balloons.js";
import { WeaponManager } from "./weapons.js";
import { Hud } from "./hud.js";
import { playShot, playPop, playMiss, playHorn, playEmpty, playSwitch } from "./audio.js";
import { createRanking } from "./ranking.js";

const ROUND_TIME = 60;
const HIP_FOV = 78;
const AIM_FOV = 52;

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(HIP_FOV, window.innerWidth / window.innerHeight, 0.08, 1200);
scene.add(camera);

const world = createWorld(scene);
const player = new Player(camera, canvas);
const weapons = new WeaponManager(camera);
const gunFill = new THREE.PointLight("#ffeacb", 2.4, 3.4, 2);
gunFill.position.set(0.5, 0.18, 0.1);
camera.add(gunFill);
const gunRim = new THREE.PointLight("#cfe2ff", 1.1, 2.6, 2);
gunRim.position.set(-0.45, -0.05, 0.15);
camera.add(gunRim);
const balloons = new BalloonField(scene, player);
const hud = new Hud();
const ranking = createRanking(hud, () => ({
  score: state.finalScore,
  pops: state.finalPops,
  active: state.mode === "over",
}));

const raycaster = new THREE.Raycaster();
raycaster.far = 260;
const center = new THREE.Vector2(0, 0);

const state = {
  mode: "menu",
  timeLeft: ROUND_TIME,
  score: 0,
  pops: 0,
  elapsed: 0,
  lastTime: performance.now(),
  firing: false,
  finalScore: 0,
  finalPops: 0,
};

camera.position.set(0, heightAt(0, 0) + 1.72, 0);

let pendingStart = false;
let freeLook = false;

function startRound() {
  state.timeLeft = ROUND_TIME;
  state.score = 0;
  state.pops = 0;
  state.finalScore = 0;
  state.finalPops = 0;
  ranking.invalidate();
  state.mode = "paused";
  hud.setScore(0);
  hud.setTime(ROUND_TIME);
  player.reset();
  balloons.reset();
  weapons.reset();
  state.firing = false;
  hud.setWeapon(weapons);
  hud.showGame();
  hud.hidePause();
  pendingStart = true;
  requestLock();
  setTimeout(() => {
    if (pendingStart && state.mode === "paused" && !document.pointerLockElement) {
      pendingStart = false;
      freeLook = true;
      player.freeLook = true;
      player.enabled = true;
      state.mode = "playing";
      hud.hidePause();
    }
  }, 700);
}

function requestLock() {
  const retry = () => {
    try {
      const plain = canvas.requestPointerLock();
      if (plain && typeof plain.catch === "function") plain.catch(() => {});
    } catch {
      /* pointer lock unavailable - free look fallback takes over */
    }
  };
  try {
    const result = canvas.requestPointerLock({ unadjustedMovement: true });
    if (result && typeof result.catch === "function") result.catch(retry);
  } catch {
    retry();
  }
}

function endRound() {
  state.mode = "over";
  state.finalScore = state.score;
  state.finalPops = state.pops;
  player.enabled = false;
  player.aiming = false;
  camera.fov = HIP_FOV;
  camera.updateProjectionMatrix();
  if (document.pointerLockElement) document.exitPointerLock();
  playHorn();
  hud.showEnd(state.score, state.pops);
  void ranking.refreshAfterRound();
}

function fire() {
  if (state.mode !== "playing") return;
  const weapon = weapons.current;
  if (weapon.ammo <= 0) {
    playEmpty();
    if (weapons.select(0)) {
      playSwitch();
      hud.setWeapon(weapons);
    }
    return;
  }
  if (!weapons.tryFire()) return;

  playShot(weapon.id);
  weapon.flashNow();
  weapons.ejectShell();
  player.addRecoil(weapon.recoilPitch, weapon.recoilYaw ? (Math.random() - 0.5) * weapon.recoilYaw : 0);
  hud.setWeapon(weapons);
  if (weapon.ammo === 0) {
    hud.setWeapon(weapons);
    setTimeout(() => {
      if (weapons.current === weapon && weapon.ammo === 0 && state.mode === "playing") {
        if (weapons.select(0)) {
          playSwitch();
          hud.setWeapon(weapons);
        }
      }
    }, 550);
  }

  raycaster.setFromCamera(center, camera);
  const entry = balloons.hitTest(raycaster);

  if (entry) {
    const points = entry.spec.points;
    state.score += points;
    state.pops += 1;
    hud.setScore(state.score);
    hud.popup(`+${points}`, entry.spec.color);
    hud.hit();
    playPop(points);
    balloons.pop(entry);
  } else {
    playMiss();
  }
}

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  player.enabled = locked || freeLook;

  if (locked) {
    pendingStart = false;
    if (state.mode === "paused") {
      state.mode = "playing";
      hud.hidePause();
    }
  } else {
    pendingStart = false;
    if (state.mode === "playing" && !freeLook) {
      state.mode = "paused";
      player.aiming = false;
      hud.showPause();
    }
  }
});

document.getElementById("start-btn").addEventListener("click", startRound);
document.getElementById("again-btn").addEventListener("click", startRound);
document.getElementById("resume-btn").addEventListener("click", () => {
  if (freeLook) {
    state.mode = "playing";
    player.enabled = true;
    hud.hidePause();
    return;
  }
  requestLock();
});

document.addEventListener("mousedown", (e) => {
  if (state.mode !== "playing") return;
  if (e.button === 0) {
    state.firing = true;
    fire();
  }
  if (e.button === 2) player.aiming = true;
});
document.addEventListener("mouseup", (e) => {
  if (e.button === 0) state.firing = false;
  if (e.button === 2) player.aiming = false;
});
document.addEventListener(
  "wheel",
  (e) => {
    if (state.mode !== "playing") return;
    if (weapons.toggle()) {
      playSwitch();
      hud.setWeapon(weapons);
    }
  },
  { passive: true }
);
document.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("keydown", (e) => {
  if (e.code === "Enter" && state.mode === "over" && e.target.tagName !== "INPUT") startRound();
  if (state.mode !== "playing") return;
  const slot = e.code === "Digit1" ? 0 : e.code === "Digit2" ? 1 : e.code === "KeyQ" ? null : undefined;
  if (slot === undefined) return;
  const changed = slot === null ? weapons.toggle() : weapons.select(slot);
  if (changed) {
    playSwitch();
    hud.setWeapon(weapons);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  state.elapsed += dt;

  if (state.mode === "playing") {
    state.timeLeft -= dt;
    hud.setTime(state.timeLeft);
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      hud.setTime(0);
      endRound();
    }
  } else if (state.mode === "menu") {
    player.yaw += dt * 0.045;
  }

  const targetFov = player.aiming ? AIM_FOV : HIP_FOV;
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10);
  camera.updateProjectionMatrix();

  player.update(dt);
  weapons.update(dt, player, player.aiming);
  if (state.mode === "playing" && state.firing && weapons.current.auto) fire();
  balloons.update(dt, state.elapsed);
  world.update(dt, state.elapsed);

  renderer.render(scene, camera);
}

hud.showMenu();
hud.setTime(ROUND_TIME);
animate();

if (import.meta.env.DEV) {
  window.__game = {
    state,
    player,
    balloons,
    weapons,
    camera,
    hud,
    ranking,
    fire,
    startRound,
    endRound,
  };
}
