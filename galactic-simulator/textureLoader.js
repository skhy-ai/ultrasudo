import * as THREE from 'three';

export class TextureLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.textures = new Map();
        this.loadingManager = new THREE.LoadingManager();
        this.texturePromises = [];
    }

    loadTexture(url) {
        if (this.textures.has(url)) {
            return Promise.resolve(this.textures.get(url));
        }

        const promise = new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    this.textures.set(url, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error(`Error loading texture: ${url}`, error);
                    resolve(null);
                }
            );
        });

        this.texturePromises.push(promise);
        return promise;
    }

    loadAllTextures() {
        return Promise.all(this.texturePromises);
    }

    getTexture(url) {
        return this.textures.get(url);
    }

    createMaterial(type, options = {}) {
        const baseOptions = {
            side: THREE.DoubleSide,
            transparent: true,
            opacity: options.opacity || 1.0,
            ...options
        };

        switch (type) {
            case 'atmosphere':
                return new THREE.MeshPhongMaterial({
                    ...baseOptions,
                    map: options.texture || null,
                    color: options.color || 0xffffff,
                    transparent: true,
                    opacity: options.opacity || 0.3,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending
                });

            case 'star':
                return new THREE.MeshBasicMaterial({
                    ...baseOptions,
                    map: options.texture || null,
                    color: options.color || 0xffffff,
                    transparent: true,
                    blending: THREE.AdditiveBlending
                });

            case 'nebula':
                return new THREE.MeshBasicMaterial({
                    ...baseOptions,
                    map: options.texture || null,
                    color: options.color || 0xffffff,
                    transparent: true,
                    opacity: options.opacity || 0.8,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

            case 'galaxy':
                return new THREE.MeshBasicMaterial({
                    ...baseOptions,
                    map: options.texture || null,
                    color: options.color || 0xffffff,
                    transparent: true,
                    opacity: options.opacity || 0.6,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

            default:
                return new THREE.MeshStandardMaterial({
                    ...baseOptions,
                    map: options.texture || null,
                    color: options.color || 0xffffff,
                    roughness: options.roughness || 0.8,
                    metalness: options.metalness || 0.2
                });
        }
    }

    createAtmosphere(radius, color, options = {}) {
        const geometry = new THREE.SphereGeometry(radius * 1.1, 32, 32);
        const material = this.createMaterial('atmosphere', {
            ...options,
            color: color,
            opacity: options.opacity || 0.3
        });
        return new THREE.Mesh(geometry, material);
    }

    createStar(radius, color, options = {}) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = this.createMaterial('star', {
            ...options,
            color: color
        });
        return new THREE.Mesh(geometry, material);
    }

    createNebula(radius, color, options = {}) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = this.createMaterial('nebula', {
            ...options,
            color: color,
            opacity: options.opacity || 0.8
        });
        return new THREE.Mesh(geometry, material);
    }

    createGalaxy(radius, color, options = {}) {
        const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);
        const material = this.createMaterial('galaxy', {
            ...options,
            color: color,
            opacity: options.opacity || 0.6,
            side: THREE.DoubleSide,
            transparent: true
        });
        
        const galaxy = new THREE.Mesh(geometry, material);
        galaxy.rotation.x = -Math.PI / 2; // Make it face the camera
        return galaxy;
    }
}
