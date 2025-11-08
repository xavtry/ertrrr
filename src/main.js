// main.js - initializes renderer, scene and kickstarts GameManager
(() => {
  // Basic three.js setup
  const container = document.getElementById('canvas-wrap');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x9fb7c6, 0.0012);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Camera (we will toggle 1st/3rd)
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.7, 0);

  // Lights
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(-10, 20, 10);
  dir.castShadow = true;
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  // Ground ambient (simple sky)
  const hemi = new THREE.HemisphereLight(0x98c9ff, 0x554433, 0.3);
  scene.add(hemi);

  // Small helpers
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Initialize systems
  const GM = window.GM = new GameManager({ scene, camera, renderer, container });

  // Procedural terrain and water
  GM.initTerrain();
  GM.initWater();

  // Spawn environment
  GM.spawnBunkersLine();
  GM.spawnBoats(3);
  GM.spawnNPCs(8);

  // Spawn player (first person by default)
  GM.spawnPlayer({ firstPerson: true });

  // Main loop
  let last = performance.now();
  function animate(t) {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    requestAnimationFrame(animate);
    GM.update(dt);
    renderer.render(scene, GM.activeCamera);
  }
  requestAnimationFrame(animate);
})();

