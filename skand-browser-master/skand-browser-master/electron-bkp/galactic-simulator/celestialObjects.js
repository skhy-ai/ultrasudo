// celestialObjects.js
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class CelestialObjects {
    constructor(scene) {
        this.scene = scene;
        this.highlightedObjects = [];
        // Scale modes allow switching between more realistic sizes and educationally visible sizes
        this.scaleModes = {
            realistic: {
                // Distances: units per AU (scene units)
                distancePerAu: 300,
                // Sizes: units per km (very small so planets are tiny relative to distances)
                unitsPerKm: 1 / 50000
            },
            educational: {
                // Keep orbits compact to keep everything in view
                distancePerAu: 50,
                // Exaggerate sizes so planets are visible
                unitsPerKm: 1 / 1500
            }
        };
        this.scaleMode = 'educational';
    }
    // ...
    createSolarSystem(solarSystemData) {
        // Clear existing objects
        this.highlightedObjects = [];

        const scaling = this.scaleModes[this.scaleMode];

        // Create Sun (expects radiusKm in data)
        const sunData = solarSystemData[0];
        const sun = this.createCelestialBody(sunData, scaling);
        sun.userData.info = "The Sun - Our local star";
        this.scene.add(sun);
        this.highlightedObjects.push(sun);
        this.addLabel(sun, "Sun");
        
        // Add point light for the sun
        const sunLight = new THREE.PointLight(0xffffff, 2, 1000, 2);
        this.scene.add(sunLight);

        // Create planets (expects distanceAu & radiusKm)
        solarSystemData.slice(1).forEach(planetData => {
            const planet = this.createCelestialBody(planetData, scaling);
            const orbitRadius = (planetData.distanceAu || 0) * scaling.distancePerAu;
            planet.position.x = orbitRadius;
            planet.userData = {
                info: `${planetData.name} - ${planetData.distanceAu ?? '?'} AU from Sun`,
                orbitRadius,
                orbitSpeed: planetData.orbitSpeed,
                angle: Math.random() * Math.PI * 2
            };

            // Add rings for Saturn
            if (planetData.hasRings) {
                const planetRadiusUnits = (planetData.radiusKm || 0) * scaling.unitsPerKm;
                this.addPlanetRings(planet, planetRadiusUnits);
            }

            // Add moon for Earth
            if (planetData.hasMoon) {
                const planetRadiusUnits = planet.geometry.parameters.radius;
                this.addMoon(planet, planetRadiusUnits);
            }

            // Add orbit path for visualization
            this.addOrbitPath(orbitRadius);

            this.scene.add(planet);
            this.highlightedObjects.push(planet);
            this.addLabel(planet, planetData.name);
        });

        return this.highlightedObjects;
    }

    createCelestialBody(data, scaling) {
        // compute radius in scene units from km
        const radiusUnits = (data.radiusKm || data.radius || 1) * scaling.unitsPerKm;
        const geometry = new THREE.SphereGeometry(radiusUnits, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: data.color,
            shininess: 10
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.name;
        return mesh;
    }

    addPlanetRings(planet, planetRadiusUnits) {
        const ringGeo = new THREE.RingGeometry(planetRadiusUnits * 1.5, planetRadiusUnits * 2, 64);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0xddddbb, 
            side: THREE.DoubleSide 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    addMoon(planet, planetRadiusUnits) {
        // Approximate Earth's moon as ~0.27 Earth radius, generic for demo
        const moonRadius = Math.max(planetRadiusUnits * 0.27, planetRadiusUnits * 0.05);
        const moonGeo = new THREE.SphereGeometry(moonRadius, 16, 16);
        const moonMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        const orbitRadius = planetRadiusUnits + Math.max(planetRadiusUnits * 0.8, 2);
        moon.position.x = orbitRadius;
        moon.userData = {
            orbitRadius,
            orbitSpeed: 13,
            angle: Math.random() * Math.PI * 2
        };
        planet.add(moon);
    }

    addLabel(object, text) {
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = text;
        const label = new CSS2DObject(div);
        label.position.set(0, object.geometry.parameters.radius + 10, 0);
        object.add(label);
    }

    addOrbitPath(radius) {
        if (!radius || radius <= 0) return;
        const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(256);
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
        const material = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.4 });
        const orbit = new THREE.LineLoop(geometry, material);
        this.scene.add(orbit);
    }

    setScaleMode(mode) {
        if (!this.scaleModes[mode]) return;
        this.scaleMode = mode;
    }

    update() {
        this.highlightedObjects.forEach(obj => {
            if (obj.userData?.orbitRadius !== undefined) {
                obj.userData.angle += 0.005 * (obj.userData.orbitSpeed || 1);
                obj.position.x = Math.cos(obj.userData.angle) * obj.userData.orbitRadius;
                obj.position.z = Math.sin(obj.userData.angle) * obj.userData.orbitRadius;
                
                // Update moon position if it exists
                if (obj.children.length > 0 && obj.children[0].userData?.orbitRadius) {
                    const moon = obj.children[0];
                    moon.userData.angle += 0.05;
                    moon.position.x = Math.cos(moon.userData.angle) * moon.userData.orbitRadius;
                    moon.position.z = Math.sin(moon.userData.angle) * moon.userData.orbitRadius;
                }
            }
        });
    }
}