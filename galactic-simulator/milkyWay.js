class MilkyWay {
    constructor(scene, textureLoader) {
        this.scene = scene;
        this.textureLoader = textureLoader;
        this.milkyWay = null;
        this.diskRadius = 50000; // Radius of the Milky Way disk in light years
        this.diskHeight = 1000;  // Thickness of the Milky Way disk in light years
        this.bulgeRadius = 10000; // Radius of the central bulge
        this.bulgeHeight = 5000;  // Height of the central bulge
    }

    async load() {
        try {
            // Load textures for the Milky Way
            const [diskTexture, bulgeTexture, dustTexture] = await Promise.all([
                this.textureLoader.loadTexture('textures/milky_way_disk.jpg'),
                this.textureLoader.loadTexture('textures/milky_way_bulge.jpg'),
                this.textureLoader.loadTexture('textures/dust_clouds.png')
            ]);

            // Create the galactic disk
            const diskGeometry = new THREE.CylinderGeometry(
                this.diskRadius,
                this.diskRadius,
                this.diskHeight,
                64,
                1,
                true
            );

            const diskMaterial = new THREE.MeshPhongMaterial({
                map: diskTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                emissive: 0x111111,
                emissiveIntensity: 0.5,
                shininess: 10
            });

            const disk = new THREE.Mesh(diskGeometry, diskMaterial);
            disk.rotation.x = Math.PI / 2; // Rotate to be horizontal
            disk.position.set(0, 0, 0);

            // Create the galactic bulge
            const bulgeGeometry = new THREE.SphereGeometry(this.bulgeRadius, 32, 32);
            const bulgeMaterial = new THREE.MeshPhongMaterial({
                map: bulgeTexture,
                emissive: 0x111111,
                emissiveIntensity: 0.7,
                shininess: 20
            });

            const bulge = new THREE.Mesh(bulgeGeometry, bulgeMaterial);
            bulge.position.set(0, 0, 0);

            // Create dust clouds
            const dustParticles = this.createDustClouds(10000, dustTexture);

            // Group everything together
            this.milkyWay = new THREE.Group();
            this.milkyWay.add(disk);
            this.milkyWay.add(bulge);
            this.milkyWay.add(dustParticles);

            // Add to scene
            this.scene.add(this.milkyWay);

            // Add ambient light to simulate the glow of the galaxy
            const ambientLight = new THREE.AmbientLight(0x555555, 0.5);
            this.milkyWay.add(ambientLight);

            // Add point light at the center for the galactic core
            const coreLight = new THREE.PointLight(0xffdd99, 1, 100000, 2);
            coreLight.position.set(0, 0, 0);
            this.milkyWay.add(coreLight);

        } catch (error) {
            console.error('Error loading Milky Way textures:', error);
        }
    }

    createDustClouds(count, texture) {
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesMaterial = new THREE.PointsMaterial({
            size: 100,
            map: texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const positions = [];
        const colors = [];
        const sizes = [];

        // Color palette for dust clouds
        const colorPalette = [
            new THREE.Color(0x8e6e95), // Purple
            new THREE.Color(0x6a4a8c), // Deep purple
            new THREE.Color(0x4a3b6a), // Dark purple
            new THREE.Color(0x9c7fb5), // Light purple
            new THREE.Color(0x7d5a9e)  // Medium purple
        ];

        for (let i = 0; i < count; i++) {
            // Position in a disk shape
            const radius = Math.random() * this.diskRadius * 0.9;
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * this.diskHeight * 2;
            const z = Math.sin(angle) * radius;

            // Add some randomness to the position
            positions.push(
                x + (Math.random() - 0.5) * this.diskRadius * 0.1,
                y + (Math.random() - 0.5) * this.diskHeight * 0.5,
                z + (Math.random() - 0.5) * this.diskRadius * 0.1
            );

            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors.push(color.r, color.g, color.b);

            // Random size
            sizes.push(50 + Math.random() * 150);
        }

        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        return particles;
    }

    update() {
        // Very slow rotation of the Milky Way
        if (this.milkyWay) {
            this.milkyWay.rotation.y += 0.00001;
        }
    }
}
