// gamemanager.js - orchestrates scene objects, spawns, and game loop helpers
class GameManager {
  constructor({ scene, camera, renderer, container }) {
    this.scene = scene;
    this.camera = camera; // main camera object (first-person)
    this.renderer = renderer;
    this.container = container;

    // create a separate third person camera that is simply a copy for easier handling
    this.thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.activeCamera = this.camera;
    this.fx = new FX(scene);

    this.terrain = null;
    this.water = null;
    this.player = null;
    this.npcs = [];
    this.boats = [];
    this.bunkers = [];
    this.raycastTargets = [];
    this._tempPhysics = []; // for parts that need manual physics update
  }

  initTerrain() {
    this.terrain = new TerrainGenerator(this.scene, {});
    this.terrain.generate();
  }

  initWater() {
    this.water = new Water(this.scene, { level: -1.2 });
    this.water.create();
  }

  spawnPlayer(opts = {}) {
    this.player = new Player(this, opts);
    // register raycast target (for NPC shooting) - mark the visible capsule
    const body = this.player.model.getObjectByName('BodyCapsule');
    if (body) {
      this.raycastTargets.push(body);
      body.userData.entity = this.player;
    }

    // prepare third person camera helper
    this.thirdPersonCamera = this.thirdPersonCamera || new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.thirdPersonCamera.position.set(0, 3.5, 6);
    this.thirdPersonCamera.lookAt(0, 1.2, 0);

    // set GM.shared camera container for Player to use
    this.camera = this.camera;
    this.activeCamera = this.camera;

    // hook toggle view
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyT') { this.player.toggleView(); } });
  }

  spawnBoats(count = 2) {
    for (let i = 0; i < count; i++) {
      const x = -40 + i * 30 + Math.random() * 6;
      const z = -80;
      const b = new Boat(this, new THREE.Vector3(x, 0, z));
      this.boats.push(b);
    }
  }

  spawnBunkersLine() {
    const startX = -28;
    for (let i = 0; i < 4; i++) {
      const x = startX + i * 18 + (Math.random() - 0.5) * 4;
      const z = -2 + Math.random() * 6;
      const bunk = new Bunker(this, new THREE.Vector3(x, 0, z));
      this.bunkers.push(bunk);
      this.raycastTargets.push(bunk.model);
    }
  }

  spawnNPCs(count = 6) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 40 - 20;
      const z = Math.random() * 24 - 4;
      this.spawnSingleNPC(new THREE.Vector3(x, 0, z));
    }
  }

  spawnSingleNPC(pos) {
    const n = new NPC(this, pos);
    this.npcs.push(n);
    // register its capsule for raycast hits so player bullets can hit it
    const c = n.model.getObjectByName('BodyCapsule') || n.model;
    if (c) {
      this.raycastTargets.push(c);
      c.userData.entity = n;
    }
  }

  update(dt) {
    // update fx
    this.fx.update(dt);

    // update water
    if (this.water) this.water.update(dt);

    // update boats
    for (let b of this.boats) b.update(dt);

    // update NPCs
    for (let n of this.npcs) n.update(dt);

    // update player
    if (this.player) this.player.update(dt);

    // update temporary physics (simple integration)
    for (let i = this._tempPhysics.length - 1; i >= 0; i--) {
      const p = this._tempPhysics[i];
      if (!p) { this._tempPhysics.splice(i, 1); continue; }
      if (!p.userData.vel) continue;
      p.userData.vel.y += -9.8 * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      // simple ground check
      if (p.position.y < 0.05) p.userData.vel.y *= -0.3;
    }
  }
}

window.GameManager = GameManager;

