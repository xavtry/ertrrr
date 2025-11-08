// input.js - keyboard and mouse input wrapper with pointer lock support
class InputHandler {
  constructor(domElement) {
    this.dom = domElement;
    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.enabled = false;

    this.mouseSensitivity = 0.12;
    this.move = { forward: 0, right: 0 };
    this.isFiring = false;
    this.isAiming = false;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyR') this.reloadRequested = true;
      if (e.code === 'KeyT') this.toggleViewRequested = true;
    });
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    this.dom.addEventListener('mousedown', (e) => {
      // left click to fire
      if (e.button === 0) this.isFiring = true;
    });
    this.dom.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isFiring = false;
    });
    this.dom.addEventListener('mousemove', (e) => {
      if (!document.pointerLockElement) return;
      this.mouseDelta.x += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      this.mouseDelta.y += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    });

    // pointer lock
    this.dom.addEventListener('click', () => {
      if (!document.pointerLockElement) this.dom.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.enabled = document.pointerLockElement === this.dom;
    });
  }

  update() {
    // compute movement axis
    const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
    const right = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    this.move.forward = forward;
    this.move.right = right;
    this.isAiming = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || false;

    // update look from mouseDelta
    this.lookYaw += this.mouseDelta.x * this.mouseSensitivity;
    this.lookPitch += this.mouseDelta.y * this.mouseSensitivity;
    this.mouseDelta.x = 0; this.mouseDelta.y = 0;

    // clamp pitch
    this.lookPitch = Math.max(-85, Math.min(85, this.lookPitch));

    // convenience
    this.moveSpeed = Math.min(1, Math.abs(forward) + Math.abs(right) * 0.7);
  }
}

window.InputHandler = InputHandler;

