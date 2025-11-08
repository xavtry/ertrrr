// terrain.js - creates a bumpy beach strip with dunes and shingle patches
class TerrainGenerator {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.width = options.width || 260;
    this.depth = options.depth || 120;
    this.scale = options.scale || 1;
    this.duneHeight = options.duneHeight || 3.2;
    this.noiseScale = options.noiseScale || 0.06;
    this.mesh = null;
  }

  generate() {
    const w = this.width, d = this.depth;
    const geo = new THREE.PlaneGeometry(w, d, Math.floor(w / 2), Math.floor(d / 2));
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    // simple perlin-like noise using Math.noise substitute (sin/cos blend for deterministic)
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const nx = (x + w / 2) * this.noiseScale;
      const nz = (z + d / 2) * this.noiseScale;
      // pseudo-noise for now
      const n = (Math.sin(nx * 2.1) + Math.cos(nz * 1.7) * 0.9 + Math.sin((nx + nz) * 0.7) * 0.6) * 0.5;
      // shore factor: reduce height closer to one edge (water at negative z)
      const shoreFactor = Math.max(0, Math.min(1, (z + d / 2) / d)); // 0 at negative end (water), 1 at inland
      const height = n * this.duneHeight * shoreFactor;
      positions.setY(i, height);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ color: 0xe1cda8, roughness: 1.0 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    this.scene.add(this.mesh);

    // shingle + rock scatter (simple)
    this._scatterRocks();
    return this.mesh;
  }

  _scatterRocks() {
    const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7f70 });
    const count = 60;
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * this.width * 0.9;
      const rz = (Math.random() - 0.2) * this.depth * 0.7;
      const r = new THREE.Mesh(rockGeo, rockMat);
      const y = this._heightAt(rx, rz) + 0.02;
      r.position.set(rx, y, rz);
      const s = 0.4 + Math.random() * 1.2;
      r.scale.setScalar(s * (0.6 + Math.random() * 0.8));
      r.rotateY(Math.random() * Math.PI);
      r.castShadow = true;
      this.scene.add(r);
    }
  }

  _heightAt(x, z) {
    // approximate sample from plane geometry by using the same noise function
    const nx = (x + this.width / 2) * this.noiseScale;
    const nz = (z + this.depth / 2) * this.noiseScale;
    const n = (Math.sin(nx * 2.1) + Math.cos(nz * 1.7) * 0.9 + Math.sin((nx + nz) * 0.7) * 0.6) * 0.5;
    const shoreFactor = Math.max(0, Math.min(1, (z + this.depth / 2) / this.depth));
    return n * this.duneHeight * shoreFactor;
  }
}

// export
window.TerrainGenerator = TerrainGenerator;

