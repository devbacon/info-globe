// import * as THREE from "three";
import ThreeGlobe from "three-globe";
import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js?external=three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js?external=three";

const markerSvg = `<svg viewBox="-4 0 36 36">
    <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
    <circle fill="black" cx="14" cy="14" r="7"></circle>
  </svg>`;

// Gen random data
const N = 30;
const gData = [...Array(N).keys()].map(() => ({
  lat: (Math.random() - 0.5) * 180,
  lng: (Math.random() - 0.5) * 360,
  size: 7 + Math.random() * 30,
  color: ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
}));

const Globe = new ThreeGlobe()
  .globeImageUrl("/public/earth-blue-marble.jpg")
  .bumpImageUrl("/public/earth-topology.png")
  .htmlElementsData(gData)
  .htmlElement((d) => {
    const el = document.createElement("div");
    el.innerHTML = markerSvg;
    el.style.color = d.color;
    el.style.width = `${d.size}px`;
    el.style.transition = "opacity 250ms";
    return el;
  })
  .htmlElementVisibilityModifier(
    (el, isVisible) => (el.style.opacity = isVisible ? 1 : 0)
  );

const CLOUDS_IMG_URL = "./clouds.png"; // from https://github.com/turban/webgl-earth
const CLOUDS_ALT = 0.004;
const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame

const Clouds = new THREE.Mesh(
  new THREE.SphereGeometry(Globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75)
);
new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
  Clouds.material = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
  });
});

Globe.add(Clouds);

(function rotateClouds() {
  Clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
  requestAnimationFrame(rotateClouds);
})();

// Setup renderers
const renderers = [new THREE.WebGLRenderer(), new CSS2DRenderer()];
renderers.forEach((r, idx) => {
  r.setSize(window.innerWidth, window.innerHeight);
  if (idx > 0) {
    // overlay additional on top of main renderer
    r.domElement.style.position = "absolute";
    r.domElement.style.top = "0px";
    r.domElement.style.pointerEvents = "none";
  }
  document.getElementById("globeViz").appendChild(r.domElement);
});

// Setup scene
const scene = new THREE.Scene();
scene.add(Globe);
scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));

// Setup camera
const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
camera.position.z = 500;

// Add camera controls
const tbControls = new TrackballControls(camera, renderers[0].domElement);
tbControls.minDistance = 101;
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;

// Update pov when camera moves
Globe.setPointOfView(camera);
tbControls.addEventListener("change", () => Globe.setPointOfView(camera));

// Kick-off renderers
(function animate() {
  // IIFE
  // Frame cycle
  tbControls.update();
  renderers.forEach((r) => r.render(scene, camera));
  requestAnimationFrame(animate);
})();
