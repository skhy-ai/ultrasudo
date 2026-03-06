// data.js
import * as THREE from 'three';

// Solar system data with physical units
// radiusKm: mean radius in kilometers
// distanceAu: semi-major axis in astronomical units
export const solarSystemData = [
    { name: "Sun", radiusKm: 696340, color: 0xffff00, position: new THREE.Vector3(0, 0, 0) },
    { name: "Mercury", radiusKm: 2440, color: 0xb39283, distanceAu: 0.39, orbitSpeed: 4.1 },
    { name: "Venus", radiusKm: 6052, color: 0xe6c229, distanceAu: 0.72, orbitSpeed: 1.6 },
    { name: "Earth", radiusKm: 6371, color: 0x1a66ff, distanceAu: 1.00, orbitSpeed: 1.0, hasMoon: true },
    { name: "Mars", radiusKm: 3390, color: 0xc1440e, distanceAu: 1.52, orbitSpeed: 0.53 },
    { name: "Jupiter", radiusKm: 69911, color: 0xe3dccb, distanceAu: 5.20, orbitSpeed: 0.084 },
    { name: "Saturn", radiusKm: 58232, color: 0xf5e7b2, distanceAu: 9.58, orbitSpeed: 0.034, hasRings: true },
    { name: "Uranus", radiusKm: 25362, color: 0xd1e7e7, distanceAu: 19.2, orbitSpeed: 0.012 },
    { name: "Neptune", radiusKm: 24622, color: 0x5b5ddf, distanceAu: 30.05, orbitSpeed: 0.006 }
];

// Named stars data (in light years from Earth)
export const namedStarsData = [
    { name: "Sirius", color: 0xffffff, position: new THREE.Vector3(8.6, 0, 0) },
    { name: "Alpha Centauri", color: 0xffffcc, position: new THREE.Vector3(4.37, 0, 0) },
    { name: "Vega", color: 0xccffff, position: new THREE.Vector3(25, 0, 0) },
    { name: "Betelgeuse", color: 0xff6b35, position: new THREE.Vector3(642.5, 0, 0) },
    { name: "Rigel", color: 0x9bb0ff, position: new THREE.Vector3(863, 0, 0) }
].map(star => ({
    ...star,
    position: star.position.multiplyScalar(10), // Scale for better visualization
    radius: 5,
    type: 'star'
}));