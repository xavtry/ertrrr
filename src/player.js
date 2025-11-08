// player.js - first/third person controller, weapon fire, animation hookup
class Player {
  constructor(GM, opts = {}) {
    this.GM = GM;
    this.scene = GM.scene;
    this.input = new InputHandler(GM.renderer.domElement);
    this.fx = GM.fx;
    this.position = new THREE.Vector3(0, 1.1, -18);
    this.velocity = new THREE.Vector3();
    this.speed = 4.2;
    this.runMultiplier = 1.6;
    this.isFirstPerson = opts.firstPerson ?? true;
    this.camera = GM.camera;
    this.thirdCamera = null;
    this.model = null;
    this.anim = null;
    this.fireCooldown = 0;
    this.mag = 8;
    this.maxMag = 8;
    this.reloadTime = 1.8;
    this.reloading = 0;

    this._setupModel();
  }

  _setupModel() {
    // build primitive capsule + simple bone structure to animate
    const root = new THREE.Object3D();
    root.name = 'PlayerRoot';
    root.position.copy(this.position);

    const hips = new THREE.Object3D(); hips.name = 'Hips'; hips.position.set(0, 0, 0);
    root.add(hips);

    const upper = new THREE.Object3D(); upper.name = 'UpperBody'; upper.position.set(0, 0.9, 0);
    hips.add(upper);

    // invisible body capsule for collisions (not physics)
    const capGeo = new THREE.CapsuleGeometry(0.35, 0.8, 4, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x444444, visible: false });
    const capsule = new THREE.Mesh(capGeo, capMat);
    capsule.name = 'BodyCapsule'; capsule.position.set(0, 0.9, 0);
    hips.add(capsule);

    // weapon (cube)
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    w.name = 'Weapon'; w.position.set(0.4, 0, 0.55);
    upper.add(w);
    const muzzle = new THREE.Object3D(); muzzle.name = 'MuzzlePoint'; muzzle.position.set(0, 0, 0.33); w.add(muzzle);
    const shell = new THREE.Object3D(); shell.name = 'ShellEjectPoint'; shell.position.set(-0.06, 0, 0.06); w.add(shell);

    this.scene.add(root);
    this.model = root;

    // animation system
    this.anim = new AnimSystem(root);

    // third-person camera container
    const thirdCam = new THREE.Object3D();
    thirdCam.position.set(0, 2.5, -5);
    root.add(thirdCam);
    this.thirdCamera = thirdCam;
  }

  update(dt) {
    this.input.update();

    // movement local
    const forward = this.input.move.forward;
    const right = this.input.move.right;
    const dir = new THREE.Vector3(right, 0, forward).normalize();

    // rotate model toward camera yaw
    const yawRad = THREE.MathUtils.degToRad(this.input.lookYaw);
    this.model.rotation.y = yawRad;

    // convert player local move into world
    const worldDir = new THREE.Vector3(dir.x, 0, dir.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y);
    const spd = this.speed * (this.input.isAiming ? 0.55 : 1);
    this.velocity.x = worldDir.x * spd;
    this.velocity.z = worldDir.z * spd;

    // simple gravity/clamp
    this.velocity.y += -9.8 * dt * 0.5;
    this.model.position.addScaledVector(this.velocity, dt);
    if (this.model.position.y < 0.3) { this.model.position.y = 0.3; this.velocity.y = 0; }

    // camera placement
    if (this.isFirstPerson) {
      // camera at head
      this.GM.activeCamera = this.GM.camera;
      const headPos = new THREE.Vector3().setFromMatrixPosition(this.model.getObjectByName('UpperBody').matrixWorld);
      this.GM.activeCamera.position.copy(headPos);
      // apply look rotation
      this.GM.activeCamera.rotation.set(THREE.MathUtils.degToRad(-this.input.lookPitch), THREE.MathUtils.degToRad(this.input.lookYaw), 0);
    } else {
      // third person: world camera follows behind
      this.GM.activeCamera = this.GM.thirdPersonCamera;
      const t = this.model.getObjectByName('Hips');
      const back = new THREE.Vector3(0, 1.8, -5).applyQuaternion(this.model.quaternion);
      this.GM.activeCamera.position.copy(this.model.position).add(back);
      this.GM.activeCamera.lookAt(this.model.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
    }

    // update animation state
    this.anim.update(dt, { isAiming: this.input.isAiming, moveSpeed: Math.abs(this.input.move.forward) + Math.abs(this.input.move.right), lookYaw: this.input.lookYaw, dead: false });

    // firing
    this.fireCooldown -= dt;
    if (this.input.isFiring && this.fireCooldown <= 0 && this.reloading <= 0) {
      this.fire();
      this.fireCooldown = 0.12;
    }

    if (this.reloadRequested()) {
      this.startReload();
    }

    if (this.reloading > 0) {
      this.reloading = Math.max(0, this.reloading - dt);
      if (this.reloading === 0) this.mag = this.maxMag;
    }
  }

  reloadRequested() {
    if (!this.input.reloadRequested) return false;
    this.input.reloadRequested = false;
    return this.mag < this.maxMag && this.reloading <= 0;
  }

  startReload() {
    this.reloading = this.reloadTime;
  }

  fire() {
    if (this.mag <= 0) return;
    this.mag--;
    // animation recoil
    this.anim.fireImpulse();
    // muzzle flash & shell
    const muzzle = this.model.getObjectByName('MuzzlePoint');
    const shell = this.model.getObjectByName('ShellEjectPoint');
    if (muzzle) this.fx.spawnMuzzle(muzzle.getWorldPosition(new THREE.Vector3()), muzzle.getWorldQuaternion(new THREE.Quaternion()), 0.3);
    if (shell) this.fx.spawnShell(shell.getWorldPosition(new THREE.Vector3()), this.model.getWorldDirection(new THREE.Vector3()).negate());
    // tracer / hit check
    const origin = muzzle ? muzzle.getWorldPosition(new THREE.Vector3()) : this.model.position.clone().add(new THREE.Vector3(0,1.2,0));
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(THREE.MathUtils.degToRad(-this.input.lookPitch), THREE.MathUtils.degToRad(this.input.lookYaw), 0));
    const ray = new THREE.Raycaster(origin, dir, 0, 100);
    const hits = ray.intersectObjects(this.GM.raycastTargets, true);
    if (hits.length > 0) {
      const h = hits[0];
      this.fx.spawnTracer(origin, h.point);
      this.fx.spawnImpact(h.point, h.face.normal);
      // apply damage to NPCs if applicable
      if (h.object.userData && h.object.userData.entity) {
        h.object.userData.entity.applyDamage(40);
      }
    } else {
      const miss = origin.clone().add(dir.multiplyScalar(80));
      this.fx.spawnTracer(origin, miss);
    }
  }

  toggleView() {
    this.isFirstPerson = !this.isFirstPerson;
  }
}

window.Player = Player;

