// npc.js - enemy AI with simple patrol, aim, shooting, and ragdoll on death
class NPC {
  constructor(GM, pos = new THREE.Vector3(), options = {}) {
    this.GM = GM;
    this.scene = GM.scene;
    this.position = pos.clone();
    this.health = options.health || 120;
    this.model = null;
    this.anim = null;
    this.target = null; // player reference
    this.state = 'idle';
    this.visionRange = 40;
    this.shootTimer = 0;
    this.makeModel();
    this.isDead = false;
  }

  makeModel() {
    const root = new THREE.Object3D();
    root.position.copy(this.position);
    root.name = 'NPCRoot';

    const hips = new THREE.Object3D(); hips.name = 'Hips'; hips.position.set(0, 0, 0);
    root.add(hips);

    const upper = new THREE.Object3D(); upper.name = 'UpperBody'; upper.position.set(0, 0.85, 0);
    hips.add(upper);

    const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color: 0x5a5a5a }));
    capsule.position.set(0, 0.9, 0); capsule.name = 'BodyCapsule';
    hips.add(capsule);

    // weapon
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.55), new THREE.MeshStandardMaterial({ color: 0x2f2f2f }));
    w.name = 'Weapon'; w.position.set(0.36, 0, 0.55);
    upper.add(w);
    const muzzle = new THREE.Object3D(); muzzle.name = 'MuzzlePoint'; muzzle.position.set(0, 0, 0.33); w.add(muzzle);
    const shell = new THREE.Object3D(); shell.name = 'ShellEjectPoint'; shell.position.set(-0.06, 0, 0.04); w.add(shell);

    this.scene.add(root);
    this.model = root;
    this.anim = new AnimSystem(root);
  }

  update(dt) {
    if (this.isDead) return;
    // find player
    const player = this.GM.player;
    if (!player) return;

    // distance to player
    const d = player.model.position.distanceTo(this.model.position);
    if (d < this.visionRange) {
      // face player
      const dir = player.model.position.clone().sub(this.model.position);
      const yaw = Math.atan2(dir.x, dir.z);
      this.model.rotation.y = THREE.MathUtils.lerpAngle(this.model.rotation.y, yaw, dt * 4);
      // enter combat
      if (d < 25) {
        this.state = 'engage';
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
          this.fireAt(player);
          this.shootTimer = 0.9 + Math.random() * 0.6;
        }
      } else {
        this.state = 'approach';
        // simple move forward
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.model.quaternion);
        this.model.position.addScaledVector(fwd, dt * 1.2);
      }
    } else {
      this.state = 'patrol';
      // gentle wander
      this.model.position.x += (Math.sin(performance.now() * 0.001 + this.model.id) * 0.001) * dt * 100;
    }

    // update anim
    const moveSpeed = (this.state === 'engage') ? 0 : (this.state === 'approach' ? 0.45 : 0.05);
    this.anim.update(dt, { isAiming: this.state === 'engage', moveSpeed: moveSpeed, lookYaw: this.model.rotation.y, dead: this.isDead });
  }

  fireAt(player) {
    if (this.isDead) return;
    const muzzle = this.model.getObjectByName('MuzzlePoint');
    const shell = this.model.getObjectByName('ShellEjectPoint');
    if (muzzle) this.GM.fx.spawnMuzzle(muzzle.getWorldPosition(new THREE.Vector3()), muzzle.getWorldQuaternion(new THREE.Quaternion()), 0.25);
    if (shell) this.GM.fx.spawnShell(shell.getWorldPosition(new THREE.Vector3()), this.model.getWorldDirection(new THREE.Vector3()).negate());
    // tracer + hitcheck
    const origin = muzzle ? muzzle.getWorldPosition(new THREE.Vector3()) : this.model.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    const dir = player.model.position.clone().sub(origin).normalize();
    const ray = new THREE.Raycaster(origin, dir, 0, 100);
    const hits = ray.intersectObjects([player.model], true);
    if (hits.length > 0) {
      // hit player: apply damage
      playerDamage(player, 20);
      this.GM.fx.spawnTracer(origin, hits[0].point);
      this.GM.fx.spawnImpact(hits[0].point, hits[0].face.normal);
    } else {
      const miss = origin.clone().add(dir.multiplyScalar(60));
      this.GM.fx.spawnTracer(origin, miss);
    }
  }

  applyDamage(amount) {
    this.health -= amount;
    if (this.health <= 0 && !this.isDead) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    // spawn ragdoll-ish bodies: create a few cubes with physics
    const parts = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0x6b6b6b }));
      p.position.copy(this.model.position).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6));
      this.scene.add(p);
      p.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2);
      this.GM._tempPhysics.push(p);
      parts.push(p);
    }
    // remove model
    this.scene.remove(this.model);
  }
}

// quick damage to player function used above
function playerDamage(player, amount) {
  // for now just log. You can expand to health bar
  console.log('player hit', amount);
  // you could reduce player health here
}

window.NPC = NPC;

