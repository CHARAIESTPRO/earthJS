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
function loadUFO(scene, unknownCount) {
  const loader = new FBXLoader();

  loader.load('../assets/3d/ufo.fbx', (object) => {
    object.scale.set(0.0009, 0.0009, 0.0009); // Adjust size

    const radius = 5; // Globe radius
    const londonLat = 51.5074; // Latitude for London
    const londonLon = -0.1278; // Longitude for London

    // Function to convert lat/lon to 3D coordinates
    function latLonToXYZ(lat, lon, altitude = 0.64) { // Reduced altitude by 20% (0.8 -> 0.64)
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius + altitude) * Math.sin(phi) * Math.cos(theta);
      const y = (radius + altitude) * Math.cos(phi);
      const z = (radius + altitude) * Math.sin(phi) * Math.sin(theta);
      return { x, y, z };
    }

    // Set UFO position
    const ufoPosition = latLonToXYZ(londonLat, londonLon);
    object.position.set(ufoPosition.x, ufoPosition.y, ufoPosition.z);

    const globeCenter = new THREE.Vector3(0, 0, 0);
    object.lookAt(globeCenter);
    object.rotateX(Math.PI / 2);
    object.rotateZ(Math.PI);

    // Add UFO animation
    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(object.animations[0]); // Assuming the first animation is valid
    action.play();

    const clock = new THREE.Clock();
    function animateUFO() {
      const delta = clock.getDelta();
      mixer.update(delta);
      requestAnimationFrame(animateUFO);
    }
    animateUFO();

    // Add UFO to the scene
    scene.add(object);

    // Tooltip logic
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(object, true);

      if (intersects.length > 0) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.textContent = `Unknown IPs: ${unknownCount}`;
      } else {
        tooltip.style.display = 'none';
      }
    });
  },
  undefined,
  (error) => {
    console.error('Error loading UFO model:', error);
  });
}

// Fetch User Location
async function fetchUserLocation() {
  try {
    const response = await fetch('https://ipinfo.io/json?token=YOUR_API_TOKEN'); // Replace with your IPinfo token
    if (!response.ok) throw new Error('Failed to fetch geolocation data');
    
    const data = await response.json();
    const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));

    loadPoints(globeGroup, { country: data.country, latitude, longitude });
    return { known: 1, unknown: 0 }; // Example mock data
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
    return { known: 0, unknown: 1 }; // Assume IP is unknown in case of failure
  }
}

// Initialize Scene
async function initializeScene() {
  const { known, unknown } = await fetchUserLocation();
  loadUFO(scene, unknown); // Pass unknown IP count to the UFO function
  loadConnections(globeGroup);
}

initializeScene();

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
