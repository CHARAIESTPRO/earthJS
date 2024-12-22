import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { createGlobe } from './globe.js';
import { loadPoints } from './points.js'; // This will be updated to handle IPinfo
import { loadConnections } from './connections.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Enhance Orbit Controls
controls.enableDamping = true; // Smooth movement
controls.dampingFactor = 0.05; // Damping strength
controls.minDistance = 10; // Minimum zoom distance
controls.maxDistance = 20; // Maximum zoom distance
controls.enablePan = false; // Disable panning (to keep the globe centered)
controls.minPolarAngle = Math.PI / 4; // Restrict downward rotation
controls.maxPolarAngle = Math.PI / 2; // Restrict upward rotation

// Add Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 3, 5);
scene.add(light);

// Create Globe and Add to Scene
const globeGroup = createGlobe();
scene.add(globeGroup);

// Fetch User Location Using IPinfo API
async function fetchUserLocation() {
  try {
    const response = await fetch('https://ipinfo.io/json?token=YOUR_API_TOKEN'); // Replace with your IPinfo token
    if (!response.ok) throw new Error('Failed to fetch geolocation data');
    
    const data = await response.json();
    const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));

    // Dynamically add the user's location to the globe
    loadPoints(globeGroup, { country: data.country, latitude, longitude });
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
  }
}

// Call the IPinfo API
fetchUserLocation();

// Load Connections (Optional, if applicable)
loadConnections(globeGroup);

// Position Camera
camera.position.set(0, 10, 15);
camera.lookAt(globeGroup.position);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  globeGroup.rotation.y += 0.001; // Rotate the globe (and its children)
  controls.update(); // Update OrbitControls
  renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
