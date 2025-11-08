// animsystem.js - simple animation state machine for primitive characters
class AnimSystem {
  constructor(root) {
    this.root = root;
    // transforms we will animate (expects child names)
    this.hips = root.getObjectByName('Hips') || root;
    this.upper = root.getObjectByName('UpperBody') || root;
    this.weapon = root.getObjectByName('Weapon') || new THREE.Object3D();
    this.state = 'idle';
    this.timer = 0;
    this.aimBlend = 0;
    this.recoil = 0;
  }

  update(dt, input) {
    this.timer += dt;
    // state selection
    if (input.dead) this.state = 'dead';
    else if (input.isAiming && input.moveSpeed > 0.1) this.state = 'aimwalk';
    else if (input.isAiming) this.state = 'aimidle';
    else if (input.moveSpeed > 0.5) this.state = 'run';
    else if (input.moveSpeed > 0.01) this.state = 'walk';
    else this.state = 'idle';

    // apply lower-body bob
    let bob = 0;
    if (this.state === 'walk') bob = Math.sin(this.timer * 7) * 0.08;
    else if (this.state === 'run') bob = Math.sin(this.timer * 14) * 0.14;
    this.hips.position.y = 0.9 + bob;

    // upper body aim/idle blend: rotate upper a bit toward look direction when aiming
    const targetAim = input.isAiming ? 1 : 0;
    this.aimBlend = THREE.MathUtils.lerp(this.aimBlend, targetAim, dt * 6);
    this.upper.rotation.x = THREE.MathUtils.degToRad(-4 * this.aimBlend);
    this.upper.rotation.y = THREE.MathUtils.lerp(this.upper.rotation.y, input.lookYaw * 0.002 * this.aimBlend, dt * 6);

    // weapon recoil (procedural)
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 10);
      this.weapon.rotation.x = -this.recoil * 0.02;
    } else {
      this.weapon.rotation.x = THREE.MathUtils.lerp(this.weapon.rotation.x, 0, dt * 8);
    }
  }

  fireImpulse() {
    this.recoil = 12 + Math.random() * 6;
  }
}

window.AnimSystem = AnimSystem;

