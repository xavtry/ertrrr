// fx.js - handles muzzle flash quads, shell ejection, tracers, and impact debris
class FX {
  constructor(scene) {
    this.scene = scene;
    this.tmp = new THREE.Object3D();
    this.active = [];
    this.tracers = [];
  }

  spawnMuzzle(position, quaternion, scale = 0.3) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFF7E6, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const quad = new THREE.Mesh(geo, mat);
    quad.position.copy(position);
    quad.quaternion.copy(quaternion);
    quad.scale.setScalar(scale);
    this.scene.add(quad);
    this.active.push({ obj: quad, t: 0, ttl: 0.06 });
  }

  spawnShell(position, direction) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshStandardMaterial({ color: 0xbfa66a }));
    s.position.copy(position);
    this.scene.add(s);
    const body = new THREE.Mesh();
    s.userData.vel = direction.clone().multiplyScalar(2.2).add(new THREE.Vector3(0, 1.4, 0));
    this.active.push({ obj: s, t: 0, ttl: 6, physics: true });
  }

  spawnTracer(from, to) {
    const geom = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = new THREE.LineBasicMaterial({ color: 0xfff1b0 });
    const ln = new THREE.Line(geom, mat);
    this.scene.add(ln);
    this.tracers.push({ obj: ln, t: 0, ttl: 0.12 });
  }

  spawnImpact(point, normal) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: 0x8a7f70 }));
    cube.position.copy(point).add(normal.clone().multiplyScalar(0.02));
    cube.lookAt(point.add(normal));
    this.scene.add(cube);
    this.active.push({ obj: cube, t: 0, ttl: 6 });
  }

  update(dt) {
    // update ephemeral objects
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i];
      a.t += dt;
      if (a.physics && a.obj) {
        // simple manual physics
        a.obj.userData.vel.y += -9.8 * dt * 0.2;
        a.obj.position.addScaledVector(a.obj.userData.vel, dt);
        a.obj.rotation.x += dt * 5;
      }
      if (a.obj) {
        if (a.t > a.ttl) {
          this.scene.remove(a.obj);
          if (a.obj.geometry) a.obj.geometry.dispose();
          if (a.obj.material) a.obj.material.dispose();
          this.active.splice(i, 1);
        }
      }
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.t += dt;
      if (t.t > t.ttl) {
        this.scene.remove(t.obj);
        t.obj.geometry.dispose();
        if (t.obj.material) t.obj.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}

window.FX = FX;

