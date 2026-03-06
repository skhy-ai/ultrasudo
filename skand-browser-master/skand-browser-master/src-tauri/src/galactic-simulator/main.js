// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { solarSystemData, namedStarsData } from './data.js';
import { CelestialObjects } from './celestialObjects.js';
import { TextureLoader } from './textureLoader.js';

// --- SCENE SETUP ---
let scene, camera, renderer, labelRenderer, controls, galaxy;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let celestialObjects;
let currentView = 'solarSystem';
let highlightedObjects = [];
let loadingProgress = 0;

// (Removed Loka-specific data; see loka-simulator.html for Hindu cosmology)

// Initialize the scene
async function init() {
    startLoading();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000010);

    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 100, 300);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create label renderer
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    document.body.appendChild(labelRenderer.domElement);

    // Add orbit controls
    controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 10000;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    celestialObjects = new CelestialObjects(scene);

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    document.getElementById('viewSolarSystem').addEventListener('click', () => setView('solarSystem'));
    const openLokaBtn = document.getElementById('openLokaSimulator');
    if (openLokaBtn) openLokaBtn.addEventListener('click', () => window.open('loka-simulator.html', '_blank'));
    document.getElementById('viewStars').addEventListener('click', () => setView('stars'));
    // Scale mode toggles
    const scaleEducationalBtn = document.getElementById('scaleEducational');
    const scaleRealisticBtn = document.getElementById('scaleRealistic');
    if (scaleEducationalBtn && scaleRealisticBtn) {
        scaleEducationalBtn.addEventListener('click', () => {
            if (celestialObjects) celestialObjects.setScaleMode('educational');
            scaleEducationalBtn.classList.add('active');
            scaleRealisticBtn.classList.remove('active');
            setView('solarSystem');
        });
        scaleRealisticBtn.addEventListener('click', () => {
            if (celestialObjects) celestialObjects.setScaleMode('realistic');
            scaleRealisticBtn.classList.add('active');
            scaleEducationalBtn.classList.remove('active');
            setView('solarSystem');
        });
    }

    // Start with solar system view
    await setView('solarSystem');
    
    // Hide loading screen
    finishLoading();

    // Start animation loop
    animate();
}

function setView(view) {
    currentView = view;
    
    // Clear the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    // Add lights back
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`view${view.charAt(0).toUpperCase() + view.slice(1)}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Create the selected view
    createGalaxy();
    
    switch (view) {
        case 'solarSystem':
            celestialObjects.createSolarSystem(solarSystemData);
            camera.position.set(0, 100, 300);
            controls.target.set(0, 0, 0);
            break;
        case 'stars':
            createNamedStars();
            camera.position.set(0, 1000, 1000);
            controls.target.set(0, 0, 0);
            break;
    }
    
    controls.update();
}

function createGalaxy() {
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Position stars in a sphere
        const radius = Math.random() * 5000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        // Random star color (mostly white with some blue/red/yellow)
        const rand = Math.random();
        if (rand > 0.9) {
            color.setRGB(0.8, 0.9, 1.0); // Blue
        } else if (rand > 0.8) {
            color.setRGB(1.0, 0.9, 0.5); // Yellow
        } else if (rand > 0.7) {
            color.setRGB(1.0, 0.7, 0.7); // Red
        } else {
            color.setRGB(1.0, 1.0, 1.0); // White
        }
        color.toArray(colors, i3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    galaxy = new THREE.Points(geometry, material);
    scene.add(galaxy);
}

// (Removed createLokas; see loka-simulator.html for dedicated visualization)

function createNamedStars() {
    highlightedObjects = [];
    namedStarsData.forEach(star => {
        const geometry = new THREE.SphereGeometry(star.radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: star.color,
            emissive: star.color,
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(star.position);
        mesh.name = star.name;
        mesh.userData = {
            info: `${star.name} - Star`,
            position: star.position.toArray()
        };
        scene.add(mesh);
        addLabel(mesh, star.name);
        highlightedObjects.push(mesh);
    });
}

function addLabel(object, text) {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    const label = new CSS2DObject(div);
    label.position.set(0, object.geometry.parameters.radius + 10, 0);
    object.add(label);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function checkIntersections() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(highlightedObjects);

    const tooltip = document.getElementById('tooltip');
    if (intersects.length > 0) {
        const object = intersects[0].object;
        tooltip.innerHTML = `<strong>${object.name}</strong><br>${object.userData.info || ''}`;
    } else {
        tooltip.innerHTML = 'Hover over an object for details';
    }
}

function startLoading() {
    loadingProgress = 0;
    document.getElementById('loadingProgress').style.width = '0%';
    document.getElementById('loading').style.display = 'flex';
    
    // Simulate progress
    const interval = setInterval(() => {
        if (loadingProgress < 90) {
            loadingProgress += 1;
            updateLoadingProgress(loadingProgress);
        } else {
            clearInterval(interval);
        }
    }, 50);
}

function updateLoadingProgress(progress) {
    loadingProgress = Math.min(progress, 100);
    document.getElementById('loadingProgress').style.width = `${loadingProgress}%`;
}

function finishLoading() {
    loadingProgress = 100;
    document.getElementById('loadingProgress').style.width = '100%';
    
    // Hide loading screen with a delay
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 500);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update celestial objects (planets, moons, etc.)
    if (celestialObjects) {
        celestialObjects.update();
    }

    // Update galaxy rotation
    if (galaxy) {
        galaxy.rotation.z -= 0.0005;
    }

    controls.update();
    checkIntersections();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Initialize the application
init();