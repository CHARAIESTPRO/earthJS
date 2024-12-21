import * as THREE from 'three';

export function loadPoints(globeGroup) {
  fetch('../assets/data/points.json')
    .then(response => response.json())
    .then(points => {
      points.forEach(point => addGlowyRhombus(globeGroup, point.lat, point.lon));
    })
    .catch(error => console.error('Error loading points:', error));
}

function addGlowyRhombus(globeGroup, lat, lon) {
  const radius = 5; // Globe radius
  const phi = (90 - lat) * (Math.PI / 180); // Convert latitude to phi
  const theta = (lon + 180) * (Math.PI / 180); // Convert longitude to theta

  // Calculate x, y, z coordinates
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  // Create a 3D rhombus geometry
  const rhombusGeometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0.02, 0,   // Top vertex
    -0.01, 0, 0,  // Left vertex
    0.01, 0, 0,   // Right vertex
    0, -0.02, 0,  // Bottom vertex
  ]);
  const indices = [
    0, 1, 2, // Top triangle
    1, 3, 2, // Bottom triangle
  ];
  rhombusGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  rhombusGeometry.setIndex(indices);
  rhombusGeometry.computeVertexNormals();

  const rhombusMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 }); // Green color
  const rhombus = new THREE.Mesh(rhombusGeometry, rhombusMaterial);

  // Add a pulsating glow around the rhombus using ShaderMaterial
  const glowGeometry = new THREE.SphereGeometry(0.04, 8, 8); // Slightly larger than the rhombus
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      color: { value: new THREE.Color(0x00FF00) }, // Green color
      intensityMultiplier: { value: 3.0 }, // Tripled emission intensity
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float intensityMultiplier;
      varying vec3 vNormal;
      void main() {
        float intensity = (0.5 + 0.5 * sin(time * 5.0)) * intensityMultiplier; // Increased pulsating effect
        gl_FragColor = vec4(color, intensity * 0.6); // Adjust intensity for strong glow
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);

  // Group the rhombus and glow together
  const pointGroup = new THREE.Group();
  pointGroup.add(rhombus, glow);
  pointGroup.position.set(x, y, z);

  // Add the group to the globe
  globeGroup.add(pointGroup);

  // Animate the glow material
  const clock = new THREE.Clock();
  function animateGlow() {
    glowMaterial.uniforms.time.value = clock.getElapsedTime();
    requestAnimationFrame(animateGlow);
  }
  animateGlow();
}
