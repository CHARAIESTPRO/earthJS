import * as THREE from 'three';

export function createGlobe() {
  const textureLoader = new THREE.TextureLoader();

  // Globe texture
  const earthTexture = textureLoader.load('../assets/textures/earth_dark.jpg');

  // Night texture
  const nightTexture = textureLoader.load('../assets/textures/earth_night.jpg');

  // Globe geometry and material
  const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    color: 0x999999,
    emissive: 0x020202,
    emissiveIntensity: 1.2,
    shininess: 12,
  });
  const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);

  // Night layer with orangish lights
  const nightGeometry = new THREE.SphereGeometry(5.01, 64, 64); // Slightly larger to avoid z-fighting
  const nightMaterial = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: nightTexture }, // Texture for the night map
      time: { value: 0.0 }, // Time uniform for animation
      emissiveBoost: { value: 2.5 }, // Boost emissive brightness
      sparkleIntensity: { value: 1.5 }, // Sparkle intensity
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D map;
      uniform float time;
      uniform float emissiveBoost;
      uniform float sparkleIntensity;

      void main() {
        vec4 texColor = texture2D(map, vUv);

        // Calculate brightness of the pixel (perceived luminance)
        float brightness = dot(texColor.rgb, vec3(0.2126, 0.7152, 0.0722));

        // Create a sparkle effect using a sine wave and random noise
        float sparkle = sin(time * 4.75 + vUv.x * 10.0 + vUv.y * 10.0) * 0.5 + 0.5;
        sparkle *= sparkleIntensity;

        // Adjust brightness for emission and sparkle
        brightness = brightness * emissiveBoost + sparkle * brightness;

        // Discard pixels that are too dark for transparency
        if (brightness < 0.05) discard;

        // Shift colors toward orangish hue
        vec3 orangishColor = vec3(1.0, 0.6, 0.2); // RGB for orangish tone
        vec3 finalColor = mix(texColor.rgb, orangishColor, 0.8); // Blend original with orangish color

        gl_FragColor = vec4(finalColor * brightness, brightness); // Adjust transparency based on brightness
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending, // Additive blending for glow
  });
  const nightMesh = new THREE.Mesh(nightGeometry, nightMaterial);

  // Atmosphere layer
  const atmosphereGeometry = new THREE.SphereGeometry(5.5, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.9 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(1, 0.6, 0, 1.0) * intensity; // Soft blue glow
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });
  const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

  // Create a group for the globe and add all elements
  const globeGroup = new THREE.Group();
  globeGroup.add(globeMesh, nightMesh, atmosphereMesh);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  const pointLight = new THREE.PointLight(0xffffff, 1.5, 1000);
  pointLight.position.set(200, 300, 400);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight1.position.set(-300, 200, 400);
  directionalLight1.castShadow = true;

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight2.position.set(300, -200, -400);
  directionalLight2.castShadow = true;

  globeGroup.add(ambientLight, pointLight, directionalLight1, directionalLight2);

  // Animate the sparkle effect
  const clock = new THREE.Clock();
  function updateNightMaterial() {
    nightMaterial.uniforms.time.value = clock.getElapsedTime();
    requestAnimationFrame(updateNightMaterial);
  }
  updateNightMaterial();

  return globeGroup;
}
