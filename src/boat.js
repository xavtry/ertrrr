// boat.js - simple landing craft mover that approaches shore and spawns troops
class Boat {
  constructor(GM, pos = new THREE.Vector3(), options = {}) {
    this.GM = GM;
    this.scene = GM.scene;
    this.model = null;
    this.pos = pos.clone();
    this.speed = options.speed || 1.7;
    this._makeModel();
    this.landed = false;
    this.unloadTimer = 0;
  }

  _makeModel() {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 9), new THREE.MeshStandardMaterial({ color: 0x555a6b }));
    hull.position.copy(this.pos);
    hull.position.y = 0.2;
    hull.castShadow = true;
    this.scene.add(hull);
    this.model = hull;
    // hold ref for raycast targets if needed
    hull.userData.isBoat = true;
  }

  update(dt) {
    if (!this.model) return;
    // move forward toward z = -12 (shore)
    const targetZ = -18;
    if (!this.landed) {
      const dir = new THREE.Vector3(0, 0, targetZ - this.model.position.z).normalize();
      this.model.position.addScaledVector(dir, dt * this.speed);
      // bobbing
      this.model.position.y = 0.2 + Math.sin(performance.now() * 0.001 + this.model.id) * 0.06;
      if (this.model.position.z < targetZ + 0.5) {
        this.landed = true;
        this.unloadTimer = 1.2;
        this._unloadTroops();
      }
    } else {
      // after landing, small idle
      if (this.unloadTimer > 0) {
        this.unloadTimer -= dt;
      }
    }
  }

  _unloadTroops() {
    // spawn a couple of NPCs near the bow
    for (let i = 0; i < 3; i++) {
      const x = this.model.position.x + (Math.random() - 0.5) * 3.5;
      const z = this.model.position.z + 2 + Math.random() * 1.5;
      this.GM.spawnSingleNPC(new THREE.Vector3(x, 0, z));
    }
  }
}

window.Boat = Boat;

