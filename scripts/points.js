import * as THREE from 'three';

export function loadPoints(globeGroup) {
  fetch('../assets/data/points.json')
    .then(response => response.json())
    .then(points => {
      points.forEach(point => addGlowyPoint(globeGroup, point.lat, point.lon));
    })
    .catch(error => console.error('Error loading points:', error));
}

function addGlowyPoint(globeGroup, lat, lon) {
  const radius = 5; // Globe radius
  const phi = (90 - lat) * (Math.PI / 180); // Convert latitude to phi
  const theta = (lon + 180) * (Math.PI / 180); // Convert longitude to theta

  // Calculate x, y, z coordinates
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  // Create a tiny sphere for the point
  const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8); // Much smaller point size
  const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
  const point = new THREE.Mesh(pointGeometry, pointMaterial);

  // Add a faint glow around the point
  const glowGeometry = new THREE.SphereGeometry(0.04, 8, 8); // Slightly larger than the point
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.3, // More subtle glow
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);

  // Group the point and glow together
  const pointGroup = new THREE.Group();
  pointGroup.add(point, glow);
  pointGroup.position.set(x, y, z);

  // Add the group to the globe
  globeGroup.add(pointGroup);
}
