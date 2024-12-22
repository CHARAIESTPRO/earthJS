import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

import { createGlobe } from './globe.js';
import { loadPoints } from './points.js';
import { loadConnections } from './connections.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Enhance Orbit Controls
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 20;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;

// Add Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// Create Globe and Add to Scene
const globeGroup = createGlobe();
scene.add(globeGroup);

// Load UFO
function loadUFO(scene) {
  const loader = new FBXLoader();

  loader.load('../assets/3d/ufo.fbx', (object) => {
    // Scale the UFO 1.8x larger
    object.scale.set(0.0009, 0.0009, 0.0009); // Increased size by 1.8x

    const radius = 5;
    const midpointLat = 15;
    const midpointLon = -30;

    const phi = (90 - midpointLat) * (Math.PI / 180);
    const theta = (midpointLon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    // Position the UFO slightly higher above the surface
    object.position.set(x, y + 0.9, z); // Adjusted height to `y + 0.9`

    const globeCenter = new THREE.Vector3(0, 0, 0);
    object.lookAt(globeCenter);
    object.rotateX(Math.PI / 2);
    object.rotateZ(Math.PI);

    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(object.animations[0]);
    action.play();

    scene.add(object);

    const clock = new THREE.Clock();
    function animateUFO() {
      const delta = clock.getDelta();
      mixer.update(delta);
      requestAnimationFrame(animateUFO);
    }
    animateUFO();
  },
  undefined,
  (error) => {
    console.error('Error loading UFO model:', error);
  });
}

// Fetch User Location Using IPinfo API
async function fetchUserLocation() {
  try {
    const response = await fetch('https://ipinfo.io/json?token=YOUR_API_TOKEN'); // Replace with your IPinfo token
    if (!response.ok) throw new Error('Failed to fetch geolocation data');
    
    const data = await response.json();
    const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));

    loadPoints(globeGroup, { country: data.country, latitude, longitude });
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
  }
}

// Initialize Scene
fetchUserLocation();
loadUFO(scene);
loadConnections(globeGroup);

// Position Camera
camera.position.set(0, 10, 15);
camera.lookAt(globeGroup.position);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  globeGroup.rotation.y += 0.001;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
