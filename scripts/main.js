import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Connection, PublicKey } from '@solana/web3.js';

import { createGlobe } from './globe.js';
import { loadPoints } from './points.js';
import { loadConnections } from './connections.js';

const TOKEN_MINT_ADDRESS = '9vR63dUzh61ohVZFvXEX7HXT39JeeoB7jEpKuGEtpump';
const SOLANA_RPC_URL = 'https://cold-hanni-fast-mainnet.helius-rpc.com/';
const connection = new Connection(SOLANA_RPC_URL);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// Create Globe and Add to Scene
const globeGroup = createGlobe();
scene.add(globeGroup);

// Fetch User Location with Token Check
async function fetchUserLocationWithTokenCheck(walletAddress) {
  console.log(`Checking token ownership for wallet: ${walletAddress}`);
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(TOKEN_MINT_ADDRESS) }
    );

    if (accounts.value.length > 0) {
      console.log('User owns the required token. Proceeding to fetch location...');
      const response = await fetch('https://ipinfo.io/json?token=8f47b686c73c80');
      if (!response.ok) throw new Error('Failed to fetch geolocation data');

      const data = await response.json();
      const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));

      loadPoints(globeGroup, { country: data.country, latitude, longitude });
      return { known: 1, unknown: 0 };
    } else {
      console.log('User does not own the required token.');
      alert('You do not own the required token.');
      return { known: 0, unknown: 1 };
    }
  } catch (error) {
    console.error('Error during token ownership check or geolocation fetch:', error);
    return { known: 0, unknown: 1 };
  }
}

// Load UFO
function loadUFO(scene, unknownCount) {
  const loader = new FBXLoader();

  loader.load('../assets/3d/ufo.fbx', (object) => {
    object.scale.set(0.0009, 0.0009, 0.0009);

    const radius = 5;
    const londonLat = 51.5074;
    const londonLon = -0.1278;

    function latLonToXYZ(lat, lon, altitude = 0.64) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius + altitude) * Math.sin(phi) * Math.cos(theta);
      const y = (radius + altitude) * Math.cos(phi);
      const z = (radius + altitude) * Math.sin(phi) * Math.sin(theta);
      return { x, y, z };
    }

    const ufoPosition = latLonToXYZ(londonLat, londonLon);
    object.position.set(ufoPosition.x, ufoPosition.y, ufoPosition.z);

    const globeCenter = new THREE.Vector3(0, 0, 0);
    object.lookAt(globeCenter);
    object.rotateX(Math.PI / 2);
    object.rotateZ(Math.PI);

    scene.add(object);
  },
  undefined,
  (error) => {
    console.error('Error loading UFO model:', error);
  });
}

// Initialize Scene
async function initializeScene(walletAddress) {
  const { known, unknown } = await fetchUserLocationWithTokenCheck(walletAddress);
  loadUFO(scene, unknown);
  loadConnections(globeGroup);
}

// Wallet Connection
async function connectWallet() {
  console.log('Connecting to wallet...');
  try {
    const { solana } = window;

    if (solana && solana.isPhantom) {
      const response = await solana.connect();
      const walletAddress = response.publicKey.toString();
      console.log(`Wallet connected: ${walletAddress}`);

      // Update button text
      const walletButton = document.getElementById('connect-wallet');
      walletButton.textContent = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

      initializeScene(walletAddress);
    } else {
      console.log('Phantom wallet not found.');
      alert('Phantom wallet not found. Please install it.');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
  }
}

// Add Wallet Connection Button Event Listener
document.getElementById('connect-wallet').addEventListener('click', connectWallet);

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
