// bunker.js - static bunker with MG mount and simple cover geometry
class Bunker {
  constructor(GM, pos = new THREE.Vector3(), options = {}) {
    this.GM = GM;
    this.scene = GM.scene;
    this.pos = pos.clone();
    this.hp = options.hp || 600;
    this.model = null;
    this._make();
  }

  _make() {
    // basic concrete block
    const body = new THREE.Mesh(new THREE.BoxGeometry(6, 2.7, 4), new THREE.MeshStandardMaterial({ color: 0x6b6c6f }));
    body.position.copy(this.pos);
    body.position.y = 1.2;
    this.scene.add(body);
    // top gunplate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 1.4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    plate.position.copy(this.pos).add(new THREE.Vector3(0, 1.7, 0));
    this.scene.add(plate);
    // a small barrel (non firing, decoration)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.copy(plate.position).add(new THREE.Vector3(0, -0.05, 0.4));
    this.scene.add(barrel);

    this.model = body;
    // register as raycast target for bullets
    body.userData.bunker = this;
  }

  applyDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.destroy();
  }

  destroy() {
    // replace with rubble (several boxes)
    for (let i = 0; i < 6; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x605c58 }));
      r.position.copy(this.model.position).add(new THREE.Vector3((Math.random() - 0.5) * 2.8, 0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 2.2));
      this.scene.add(r);
      this.GM._tempPhysics.push(r);
    }
    this.scene.remove(this.model);
  }
}

window.Bunker = Bunker;

