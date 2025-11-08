// water.js - simple waved plane that moves up/down and applies simple foam near shore
class Water {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.size = options.size || 400;
    this.level = options.level || -1.2;
    this.waveAmp = options.waveAmp || 0.28;
    this.waveFreq = options.waveFreq || 0.8;
    this.mesh = null;
    this.time = 0;
  }

  create() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, 64, 64);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x466d9b, transparent: true, opacity: 0.9, metalness: 0.05, roughness: 0.9 });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = this.level;
    m.receiveShadow = true;
    this.scene.add(m);
    this.mesh = m;
    // light shimmering via small vertex displacement stored in userData for shaderless approach
    this.origPos = geo.attributes.position.array.slice();
  }

  update(dt) {
    if (!this.mesh) return;
    this.time += dt;
    const pos = this.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const off = Math.sin((x + this.time * 3.2) * 0.12 + z * 0.08) * this.waveAmp * 0.5 + Math.cos((z - this.time * 2.3) * 0.14) * this.waveAmp * 0.5;
      pos.setY(i, off);
    }
    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
}

window.Water = Water;

