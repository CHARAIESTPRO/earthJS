import * as THREE from 'three';

export function loadConnections(scene) {
  fetch('../assets/data/connections.json')
    .then(response => response.json())
    .then(connections => {
      connections.forEach(connection => {
        addConnection(
          scene,
          connection.from.lat,
          connection.from.lon,
          connection.to.lat,
          connection.to.lon
        );
      });
    })
    .catch(error => console.error('Error loading connections:', error));
}

function addConnection(scene, lat1, lon1, lat2, lon2) {
  const radius = 5; // Globe radius

  // Convert lat/lon to spherical coordinates for point 1
  const phi1 = (90 - lat1) * (Math.PI / 180);
  const theta1 = (lon1 + 180) * (Math.PI / 180);
  const x1 = -radius * Math.sin(phi1) * Math.cos(theta1);
  const y1 = radius * Math.cos(phi1);
  const z1 = radius * Math.sin(phi1) * Math.sin(theta1);

  // Convert lat/lon to spherical coordinates for point 2
  const phi2 = (90 - lat2) * (Math.PI / 180);
  const theta2 = (lon2 + 180) * (Math.PI / 180);
  const x2 = -radius * Math.sin(phi2) * Math.cos(theta2);
  const y2 = radius * Math.cos(phi2);
  const z2 = radius * Math.sin(phi2) * Math.sin(theta2);

  // Create a line connecting the two points
  const points = [
    new THREE.Vector3(x1, y1, z1),
    new THREE.Vector3(x2, y2, z2),
  ];

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for connections
  const line = new THREE.Line(lineGeometry, lineMaterial);

  // Add line to scene
  scene.add(line);
}
