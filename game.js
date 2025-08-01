// Game variables
let scene, camera, renderer, clock;
let player, playerVelocity, playerOnGround;
let keys = {};
let mouseX = 0, mouseY = 0;
let gameStarted = false;
let gameObjects = [];
let goblins = [];
let trolls = [];
let projectiles = [];
let laserBeams = [];
let healthPacks = [];
let cameraShake = { x: 0, y: 0, intensity: 0, duration: 0 };

// Mobile touch controls
let isMobile = false;
let isLandscape = true;
let touchControls = {
    movement: { x: 0, y: 0, active: false, moving: false },
    joystick: { centerX: 0, centerY: 0, maxRadius: 0 },
    jumpPressed: false,
    shootPressed: false
};

// Player immortality
let immortalityStart = 0;
let immortalityDuration = 5000; // 5 seconds
let isImmortal = false;

// Game stats
let health = 100;
let maxHealth = 100;
let score = 0;
let ammo = Infinity;

// Sound system
let audioContext;
let sounds = {};
let backgroundMusic;
let musicEnabled = true;
let allSoundsMuted = false; // Master mute control
let soundVolume = 0.1; // Much quieter
let musicVolume = 0.02; // Very quiet background music

// Physics constants
const GRAVITY = -30;
const JUMP_FORCE = 15;
const MOVE_SPEED = 10;
const MOUSE_SENSITIVITY = 0.002;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('gameCanvas'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create clock for delta time
    clock = new THREE.Clock();

    // Initialize player
    initPlayer();

    // Create lighting
    createLighting();

    // Create environment
    createEnvironment();

    // Create goblins
    createGoblins();

    // Initialize sound system
    initSounds();

    // Set up event listeners
    setupEventListeners();
    
    // Check initial orientation
    checkOrientation();
    
    // Add page visibility handling for mobile
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, mute all sounds on mobile
            if (isMobile) {
                window.wasAudioMuted = allSoundsMuted;
                allSoundsMuted = true;
                console.log('Page hidden - audio muted');
            }
        } else {
            // Page is visible again, restore previous audio state
            if (isMobile && window.wasAudioMuted !== undefined) {
                allSoundsMuted = window.wasAudioMuted;
                console.log('Page visible - audio restored');
            }
        }
    });

    // Start health pack spawning
    startHealthPackSpawning();

    // Start troll spawning
    startTrollSpawning();

    // Update UI initially
    updateUI();

    // Start game loop
    animate();
}

function initPlayer() {
    // Player is just a camera with physics
    player = {
        position: new THREE.Vector3(0, 2, 10),
        rotation: new THREE.Vector2(0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        onGround: false,
        height: 1.8
    };
    
    camera.position.copy(player.position);
    playerVelocity = new THREE.Vector3();
    playerOnGround = false;
}

function checkMobileSoundSettings() {
    // Check if device is in silent mode (iOS/Android detection)
    if (isMobile) {
        // Try to detect silent mode on mobile
        navigator.mediaSession = navigator.mediaSession || {};
        
        // Check for reduced motion preference (accessibility)
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Respect mobile volume settings
        const testAudio = () => {
            try {
                const testCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = testCtx.createOscillator();
                const gainNode = testCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(testCtx.destination);
                gainNode.gain.setValueAtTime(0.001, testCtx.currentTime); // Very quiet test
                
                oscillator.start();
                oscillator.stop(testCtx.currentTime + 0.01);
                
                return true;
            } catch (e) {
                console.log('Mobile audio restricted or silent mode detected');
                return false;
            }
        };
        
        if (prefersReducedMotion || !testAudio()) {
            allSoundsMuted = true;
            musicEnabled = false;
            console.log('Mobile sound settings: Audio disabled due to accessibility or device settings');
            return false;
        }
    }
    return true;
}

function initSounds() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Check mobile sound settings
        const canPlayAudio = checkMobileSoundSettings();
        
        if (canPlayAudio) {
            createSounds();
            startBackgroundMusic();
        } else {
            console.log('Audio initialization skipped due to mobile settings');
        }
    } catch (error) {
        console.warn('Audio not supported:', error);
        allSoundsMuted = true;
        musicEnabled = false;
    }
}

function createSounds() {
    // Create synthetic sounds using Web Audio API
    sounds.laser = createLaserSound();
    sounds.goblinWalk = createGoblinWalkSound();
    sounds.healthPickup = createHealthPickupSound();
    sounds.trollLand = createTrollLandSound();
    sounds.trollWalk = createTrollWalkSound();
}

function createLaserSound() {
    return () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(soundVolume * 0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    };
}

function createGoblinWalkSound() {
    return () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(soundVolume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

function createHealthPickupSound() {
    return () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(soundVolume * 0.6, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    };
}

function createTrollLandSound() {
    return () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(soundVolume * 0.8, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.8);
    };
}

function createTrollWalkSound() {
    return () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(soundVolume * 0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    };
}

function startBackgroundMusic() {
    if (!audioContext || !musicEnabled || allSoundsMuted) return;
    
    // Create ambient background music
    const createAmbientTone = (freq, delay = 0) => {
        setTimeout(() => {
            if (!gameStarted || !musicEnabled || allSoundsMuted) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(musicVolume, audioContext.currentTime + 2);
            gainNode.gain.linearRampToValueAtTime(musicVolume * 0.4, audioContext.currentTime + 6);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 8);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 8);
            
            // Recursively create next tone
            createAmbientTone(freq + Math.random() * 20 - 10, 6000);
        }, delay);
    };
    
    // Start multiple ambient tones
    createAmbientTone(220, 0);
    createAmbientTone(330, 2000);
    createAmbientTone(165, 4000);
}

function toggleMusic() {
    allSoundsMuted = !allSoundsMuted;
    console.log('All sounds', allSoundsMuted ? 'muted' : 'unmuted');
    
    // Provide visual feedback for mute toggle
    const body = document.body;
    if (allSoundsMuted) {
        body.classList.add('muted-flash');
        // Mute everything
        if (backgroundMusic) {
            backgroundMusic.stop();
            backgroundMusic = null;
        }
    } else {
        body.classList.add('unmuted-flash');
        // Unmute - restart music if it was enabled
        if (musicEnabled && audioContext) {
            startBackgroundMusic();
        }
    }
    
    // Remove flash effect
    setTimeout(() => {
        body.classList.remove('muted-flash', 'unmuted-flash');
    }, 200);
    
    updateUI();
}

function createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
}

function createEnvironment() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    gameObjects.push({ mesh: ground, type: 'ground' });

    // Building
    createBuilding();

    // Trees
    for (let i = 0; i < 20; i++) {
        createTree(
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 150
        );
    }

    // Cars
    for (let i = 0; i < 5; i++) {
        createCar(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
    }

    // Mushrooms
    for (let i = 0; i < 15; i++) {
        createMushroom(
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 120
        );
    }

    // Stones
    for (let i = 0; i < 25; i++) {
        createStone(
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 140
        );
    }
}

function createBuilding() {
    const buildingGroup = new THREE.Group();
    
    // Main building structure
    const buildingGeometry = new THREE.BoxGeometry(20, 15, 30);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(0, 7.5, -20);
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(18, 8, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 19, -20);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    buildingGroup.add(roof);

    scene.add(buildingGroup);
    gameObjects.push({ mesh: buildingGroup, type: 'building' });
}

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(4, 8, 6);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 8;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    gameObjects.push({ mesh: treeGroup, type: 'tree', boundingBox: new THREE.Box3().setFromObject(treeGroup) });
}

function createCar(x, z) {
    const carGroup = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    carGroup.add(body);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(3, 1, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: bodyMaterial.color.clone().multiplyScalar(0.8) });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.25;
    roof.castShadow = true;
    carGroup.add(roof);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    const positions = [
        [-1.5, 0.6, 2.5], [1.5, 0.6, 2.5],
        [-1.5, 0.6, -2.5], [1.5, 0.6, -2.5]
    ];
    
    positions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(...pos);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = Math.random() * Math.PI * 2;
    scene.add(carGroup);
    gameObjects.push({ mesh: carGroup, type: 'car', boundingBox: new THREE.Box3().setFromObject(carGroup) });
}

function createMushroom(x, z) {
    const mushroomGroup = new THREE.Group();
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2);
    const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 1;
    stem.castShadow = true;
    mushroomGroup.add(stem);

    // Cap
    const capGeometry = new THREE.SphereGeometry(1.5, 8, 6);
    const capMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 2.5;
    cap.scale.y = 0.6;
    cap.castShadow = true;
    mushroomGroup.add(cap);

    // Spots on cap
    for (let i = 0; i < 5; i++) {
        const spotGeometry = new THREE.SphereGeometry(0.2, 6, 4);
        const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        spot.position.set(
            (Math.random() - 0.5) * 2,
            2.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 2
        );
        mushroomGroup.add(spot);
    }

    mushroomGroup.position.set(x, 0, z);
    scene.add(mushroomGroup);
    gameObjects.push({ mesh: mushroomGroup, type: 'mushroom', boundingBox: new THREE.Box3().setFromObject(mushroomGroup) });
}

function createStone(x, z) {
    const stoneGeometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5);
    const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
    stone.position.set(x, 1, z);
    stone.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);
    gameObjects.push({ mesh: stone, type: 'stone', boundingBox: new THREE.Box3().setFromObject(stone) });
}

function createGoblins() {
    for (let i = 0; i < 8; i++) {
        createGoblin(
            (Math.random() - 0.5) * 80 + Math.sign(Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 80 + Math.sign(Math.random() - 0.5) * 20
        );
    }
}

function createGoblin(x, z) {
    const goblinGroup = new THREE.Group();
    
    // Body (using cylinder instead of capsule)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.3, 1.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    goblinGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.3;
    head.castShadow = true;
    goblinGroup.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 2.4, 0.5);
    goblinGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 2.4, 0.5);
    goblinGroup.add(rightEye);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 1.5, 0);
    leftArm.rotation.z = 0.5;
    leftArm.castShadow = true;
    goblinGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 1.5, 0);
    rightArm.rotation.z = -0.5;
    rightArm.castShadow = true;
    goblinGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.5, 0);
    leftLeg.castShadow = true;
    goblinGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.5, 0);
    rightLeg.castShadow = true;
    goblinGroup.add(rightLeg);

    goblinGroup.position.set(x, 0, z);
    scene.add(goblinGroup);
    
    const goblin = {
        mesh: goblinGroup,
        health: 50,
        speed: 5,
        lastShot: 0,
        shotCooldown: 2000,
        boundingBox: new THREE.Box3().setFromObject(goblinGroup),
        alive: true
    };
    
    goblins.push(goblin);
}

function startHealthPackSpawning() {
    const spawnHealthPack = () => {
        if (!gameStarted) {
            setTimeout(spawnHealthPack, 2000);
            return;
        }
        
        createHealthPack(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60
        );
        
        // Spawn next health pack in 15-25 seconds
        setTimeout(spawnHealthPack, 15000 + Math.random() * 10000);
    };
    
    // First health pack after 10 seconds
    setTimeout(spawnHealthPack, 10000);
}

function createHealthPack(x, z) {
    const healthPackGroup = new THREE.Group();
    
    // Main cross shape
    const crossGeometry = new THREE.BoxGeometry(1, 0.2, 0.2);
    const crossMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff0000,
        emissive: 0x220000
    });
    
    const crossH = new THREE.Mesh(crossGeometry, crossMaterial);
    crossH.position.y = 0.5;
    healthPackGroup.add(crossH);
    
    const crossV = new THREE.Mesh(crossGeometry, crossMaterial);
    crossV.rotation.z = Math.PI / 2;
    crossV.position.y = 0.5;
    healthPackGroup.add(crossV);
    
    // Base platform
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.3;
    base.castShadow = true;
    base.receiveShadow = true;
    healthPackGroup.add(base);
    
    healthPackGroup.position.set(x, 0, z);
    scene.add(healthPackGroup);
    
    const healthPack = {
        mesh: healthPackGroup,
        position: new THREE.Vector3(x, 0, z),
        rotation: 0,
        boundingBox: new THREE.Box3().setFromObject(healthPackGroup)
    };
    
    healthPacks.push(healthPack);
    
    // Auto-remove after 30 seconds if not collected
    setTimeout(() => {
        const index = healthPacks.indexOf(healthPack);
        if (index > -1) {
            scene.remove(healthPack.mesh);
            healthPacks.splice(index, 1);
        }
    }, 30000);
}

function updateHealthPacks(deltaTime) {
    healthPacks.forEach((pack, index) => {
        // Rotate for visibility
        pack.rotation += deltaTime * 2;
        pack.mesh.rotation.y = pack.rotation;
        
        // Bob up and down
        pack.mesh.position.y = 0.5 + Math.sin(pack.rotation * 2) * 0.2;
        
        // Check collection
        const distanceToPlayer = pack.mesh.position.distanceTo(camera.position);
        if (distanceToPlayer < 2) {
            // Collect health pack
            const healAmount = Math.floor(maxHealth * 0.1); // 10% of max health
            health = Math.min(maxHealth, health + healAmount);
            
            console.log(`Health pack collected! Healed ${healAmount} HP`);
            if (!allSoundsMuted) sounds.healthPickup();
            updateUI();
            
            // Remove health pack
            scene.remove(pack.mesh);
            healthPacks.splice(index, 1);
        }
    });
}

function startTrollSpawning() {
    const spawnTroll = () => {
        if (!gameStarted) {
            setTimeout(spawnTroll, 3000);
            return;
        }
        
        // Spawn troll at random position high above
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        createTroll(x, z);
        
        // Spawn next troll in 20-40 seconds
        setTimeout(spawnTroll, 20000 + Math.random() * 20000);
    };
    
    // First troll after 30 seconds
    setTimeout(spawnTroll, 30000);
}

function createTroll(x, z) {
    const trollGroup = new THREE.Group();
    
    // Body (larger than goblin)
    const bodyGeometry = new THREE.CylinderGeometry(1, 0.8, 3);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    trollGroup.add(body);

    // Head (larger)
    const headGeometry = new THREE.SphereGeometry(1, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 4;
    head.castShadow = true;
    trollGroup.add(head);

    // Eyes (red and glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.15, 6, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        emissive: 0x440000
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 4.2, 0.8);
    trollGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 4.2, 0.8);
    trollGroup.add(rightEye);

    // Arms (massive)
    const armGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2.5);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.5, 2.5, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    trollGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.5, 2.5, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    trollGroup.add(rightArm);

    // Axe (in right hand)
    const axeGroup = new THREE.Group();
    
    // Axe handle
    const handleGeometry = new THREE.CylinderGeometry(0.1, 0.12, 3);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = 1.5;
    axeGroup.add(handle);
    
    // Axe blade
    const bladeGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.1);
    const bladeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xC0C0C0,
        emissive: 0x111111
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 2.8;
    axeGroup.add(blade);
    
    axeGroup.position.set(1.5, 2.5, 0);
    axeGroup.rotation.z = -0.3;
    trollGroup.add(axeGroup);

    // Legs (thick and powerful)
    const legGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.6, 0.8, 0);
    leftLeg.castShadow = true;
    trollGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.6, 0.8, 0);
    rightLeg.castShadow = true;
    trollGroup.add(rightLeg);

    // Start high above the ground
    trollGroup.position.set(x, 50, z);
    scene.add(trollGroup);
    
    const troll = {
        mesh: trollGroup,
        health: 100,
        speed: 3,
        lastAttack: 0,
        attackCooldown: 3000,
        lastWalkSound: 0,
        boundingBox: new THREE.Box3().setFromObject(trollGroup),
        alive: true,
        falling: true,
        fallSpeed: 0,
        landed: false
    };
    
    trolls.push(troll);
}

function updateTrolls(deltaTime) {
    trolls.forEach((troll, index) => {
        if (!troll.alive) return;
        
        if (troll.falling) {
            // Apply gravity while falling
            troll.fallSpeed += 20 * deltaTime; // Faster fall than player
            troll.mesh.position.y -= troll.fallSpeed * deltaTime;
            
            // Check if landed
            if (troll.mesh.position.y <= 2.5) { // Ground level for troll height
                troll.mesh.position.y = 2.5;
                troll.falling = false;
                troll.landed = true;
                
                // Create ground shake effect
                shakeGround(0.5, 1000);
                
                // Play landing sound
                // sounds.trollLand(); // Disabled enemy sounds
                
                console.log('Troll landed with a thud!');
            }
        } else {
            // Move towards player on ground
            const direction = new THREE.Vector3()
                .subVectors(camera.position, troll.mesh.position)
                .normalize();
            direction.y = 0; // Keep on ground
            
            troll.mesh.position.add(direction.multiplyScalar(troll.speed * deltaTime));
            troll.mesh.lookAt(camera.position);
            
            // Play walking sound occasionally
            if (!troll.lastWalkSound || Date.now() - troll.lastWalkSound > 1200) {
                // sounds.trollWalk(); // Disabled enemy sounds
                troll.lastWalkSound = Date.now();
            }
            
            // Attack player if close
            const distanceToPlayer = troll.mesh.position.distanceTo(camera.position);
            const now = Date.now();
            
            if (distanceToPlayer < 4 && now - troll.lastAttack > troll.attackCooldown) {
                // Troll axe attack
                takeDamage(30);
                troll.lastAttack = now;
                console.log('Troll axe attack!');
                
                // Create axe swing effect
                shakeGround(0.3, 500);
            }
        }
        
        // Update bounding box
        troll.boundingBox.setFromObject(troll.mesh);
    });
}

function shakeGround(intensity, duration) {
    cameraShake.intensity = intensity;
    cameraShake.duration = duration;
    cameraShake.x = (Math.random() - 0.5) * intensity;
    cameraShake.y = (Math.random() - 0.5) * intensity;
}

function createLaserGun() {
    const gunGroup = new THREE.Group();
    
    // Gun barrel (more prominent)
    const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.12, 2.5);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.6, -0.2, -1.2);
    gunGroup.add(barrel);

    // Gun body
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.5, 1.2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.4, -0.4, -0.5);
    gunGroup.add(body);

    // Gun handle
    const handleGeometry = new THREE.BoxGeometry(0.25, 1, 0.4);
    const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.4, -0.8, 0.1);
    gunGroup.add(handle);

    // Laser sight (small green light)
    const sightGeometry = new THREE.SphereGeometry(0.03);
    const sightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        emissive: 0x002200
    });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0.6, -0.1, -2.3);
    gunGroup.add(sight);

    camera.add(gunGroup);
    return gunGroup;
}

function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
           window.innerWidth <= 768;
}

function checkOrientation() {
    if (isMobile) {
        isLandscape = window.innerWidth > window.innerHeight;
        const orientationWarning = document.getElementById('orientationWarning');
        
        if (!isLandscape) {
            orientationWarning.style.display = 'flex';
            return false; // Can't start game in portrait
        } else {
            orientationWarning.style.display = 'none';
            return true; // Can start game in landscape
        }
    }
    return true; // Desktop can always start
}

function setupEventListeners() {
    // Detect if mobile device
    isMobile = detectMobile();
    console.log('Mobile device detected:', isMobile);
    
    // Show/hide appropriate controls
    if (isMobile) {
        document.querySelectorAll('.mobile-only').forEach(el => el.style.display = 'block');
        document.getElementById('desktopControls').style.display = 'none';
        setupMobileControls();
    } else {
        document.querySelectorAll('.mobile-only').forEach(el => el.style.display = 'none');
        document.getElementById('desktopControls').style.display = 'block';
    }
    
    // Keyboard events
    document.addEventListener('keydown', (event) => {
        keys[event.code] = true;
        
        // M key for mute works everywhere (desktop and mobile with keyboard)
        if (event.code === 'KeyM') {
            toggleMusic();
            return;
        }
        
        // Other keys only work on desktop or when game started
        if (!isMobile && gameStarted) {
            console.log('Key pressed:', event.code);
            
            if (event.code === 'Space') {
                event.preventDefault();
                if (playerOnGround) {
                    playerVelocity.y = JUMP_FORCE;
                    playerOnGround = false;
                }
            }
            
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                shootLaser();
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });

    // Mouse events (desktop only)
    if (!isMobile) {
        document.addEventListener('mousemove', (event) => {
            if (gameStarted) {
                const locked = document.pointerLockElement || 
                              document.mozPointerLockElement || 
                              document.webkitPointerLockElement;
                
                if (locked) {
                    mouseX -= event.movementX * MOUSE_SENSITIVITY;
                    mouseY -= event.movementY * MOUSE_SENSITIVITY;
                    mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouseY));
                }
            }
        });

        // Click to start game or shoot (desktop only)
        document.addEventListener('click', (event) => {
            if (!gameStarted) {
                startGame();
            } else {
                shootLaser();
            }
        });
    }

    // Touch events for mobile game start
    if (isMobile) {
        document.addEventListener('touchstart', (event) => {
            if (!gameStarted && checkOrientation()) {
                event.preventDefault();
                startGame();
            }
        }, { passive: false });
    }
    
    // Orientation change handling
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            checkOrientation();
        }, 100);
    });

    // Window resize - handle camera, mobile detection, and orientation
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update mobile detection on resize
        const wasMobile = isMobile;
        isMobile = detectMobile();
        if (wasMobile !== isMobile) {
            location.reload(); // Reload if mobile state changes
        }
        
        // Check orientation
        checkOrientation();
    });

    // Pointer lock change (desktop only)
    if (!isMobile) {
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === null && gameStarted) {
                console.log('Pointer lock lost');
            }
        });
        
        // Alternative pointer lock event names for different browsers
        document.addEventListener('mozpointerlockchange', () => {
            if (document.mozPointerLockElement === null && gameStarted) {
                console.log('Pointer lock lost (Mozilla)');
            }
        });
        
        document.addEventListener('webkitpointerlockchange', () => {
            if (document.webkitPointerLockElement === null && gameStarted) {
                console.log('Pointer lock lost (Webkit)');
            }
        });
    }
}

function setupMobileControls() {
    const joystick = document.getElementById('movementJoystick');
    const joystickHandle = document.getElementById('joystickHandle');
    const jumpBtn = document.getElementById('jumpBtn');
    const shootBtn = document.getElementById('shootBtn');
    
    // Calculate joystick center and radius
    const updateJoystickGeometry = () => {
        const rect = joystick.getBoundingClientRect();
        touchControls.joystick.centerX = rect.left + rect.width / 2;
        touchControls.joystick.centerY = rect.top + rect.height / 2;
        touchControls.joystick.maxRadius = rect.width / 2 - 20; // Account for handle size
    };
    
    updateJoystickGeometry();
    window.addEventListener('resize', updateJoystickGeometry);
    
    // Joystick touch events
    joystick.addEventListener('touchstart', (event) => {
        event.preventDefault();
        touchControls.movement.active = true;
        const touch = event.touches[0];
        updateJoystickPosition(touch.clientX, touch.clientY);
    }, { passive: false });
    
    joystick.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (touchControls.movement.active) {
            const touch = event.touches[0];
            updateJoystickPosition(touch.clientX, touch.clientY);
        }
    }, { passive: false });
    
    joystick.addEventListener('touchend', (event) => {
        event.preventDefault();
        touchControls.movement.active = false;
        touchControls.movement.x = 0;
        touchControls.movement.y = 0;
        touchControls.movement.moving = false; // Stop moving forward
        
        // Reset handle to center
        joystickHandle.style.transform = 'translate(-50%, -50%)';
    }, { passive: false });
    
    // Jump button
    jumpBtn.addEventListener('touchstart', (event) => {
        event.preventDefault();
        touchControls.jumpPressed = true;
        if (gameStarted && playerOnGround) {
            playerVelocity.y = JUMP_FORCE;
            playerOnGround = false;
        }
    }, { passive: false });
    
    jumpBtn.addEventListener('touchend', (event) => {
        event.preventDefault();
        touchControls.jumpPressed = false;
    }, { passive: false });
    
    // Shoot button
    shootBtn.addEventListener('touchstart', (event) => {
        event.preventDefault();
        touchControls.shootPressed = true;
        if (gameStarted) {
            shootLaser();
        }
    }, { passive: false });
    
    shootBtn.addEventListener('touchend', (event) => {
        event.preventDefault();
        touchControls.shootPressed = false;
    }, { passive: false });
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (event) => {
        if (isMobile) {
            event.preventDefault();
        }
    });
}

function updateJoystickPosition(touchX, touchY) {
    const deltaX = touchX - touchControls.joystick.centerX;
    const deltaY = touchY - touchControls.joystick.centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance <= touchControls.joystick.maxRadius) {
        // Within joystick area - only use X for rotation, any touch means moving forward
        touchControls.movement.x = deltaX / touchControls.joystick.maxRadius;
        touchControls.movement.y = 0; // Don't use Y for movement anymore
        touchControls.movement.moving = true; // Player is always moving forward when touching
        
        // Update handle position
        const handle = document.getElementById('joystickHandle');
        handle.style.transform = `translate(-50%, -50%) translate(${deltaX}px, 0px)`; // Only move handle horizontally
    } else {
        // Outside joystick area - clamp to horizontal edge only
        const clampedX = Math.sign(deltaX) * touchControls.joystick.maxRadius;
        
        touchControls.movement.x = clampedX / touchControls.joystick.maxRadius;
        touchControls.movement.y = 0;
        touchControls.movement.moving = true;
        
        // Update handle position
        const handle = document.getElementById('joystickHandle');
        handle.style.transform = `translate(-50%, -50%) translate(${clampedX}px, 0px)`;
    }
}

function startGame() {
    console.log('Starting game...');
    
    // Check orientation on mobile before starting
    if (isMobile && !checkOrientation()) {
        console.log('Cannot start game - device not in landscape mode');
        return;
    }
    
    gameStarted = true;
    document.getElementById('instructions').classList.add('hidden');
    
    // Initialize immortality period
    immortalityStart = Date.now();
    isImmortal = true;
    console.log('Player is immortal for', immortalityDuration / 1000, 'seconds');
    
    // Request pointer lock only on desktop
    if (!isMobile) {
        const element = document.body;
        const requestPointerLock = element.requestPointerLock || 
                                   element.mozRequestPointerLock || 
                                   element.webkitRequestPointerLock;
        
        if (requestPointerLock) {
            console.log('Requesting pointer lock...');
            requestPointerLock.call(element);
        } else {
            console.log('Pointer lock not supported');
        }
    } else {
        console.log('Mobile device - skipping pointer lock');
    }
    
    // Add laser gun to camera
    const gun = createLaserGun();
    scene.add(camera);
    
    // Store gun reference for immortality blinking effect
    window.playerGun = gun;
    
    console.log('Game started successfully');
}

function shootLaser() {
    const now = Date.now();
    if (now - (window.lastLaserShot || 0) < 200) return; // Rate limiting
    window.lastLaserShot = now;

    console.log('Shooting laser!');
    
    // Play laser sound
    if (!allSoundsMuted) sounds.laser();

    // Get gun position (offset from camera to simulate gun barrel)
    const gunOffset = new THREE.Vector3(0.6, -0.2, -1.2);
    const gunWorldPosition = new THREE.Vector3();
    gunWorldPosition.copy(gunOffset);
    gunWorldPosition.applyMatrix4(camera.matrixWorld);

    // Get shooting direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.normalize();

    // Cast ray to find hit point
    const raycaster = new THREE.Raycaster(gunWorldPosition, direction);
    let hitPoint = gunWorldPosition.clone().add(direction.clone().multiplyScalar(100));
    let hitDistance = 100;
    
    // Check for goblin hits first
    const goblinHits = [];
    goblins.forEach((goblin, index) => {
        if (!goblin.alive) return;
        const intersects = raycaster.intersectObject(goblin.mesh, true);
        if (intersects.length > 0) {
            goblinHits.push({
                goblin: goblin,
                index: index,
                distance: intersects[0].distance,
                point: intersects[0].point,
                type: 'goblin'
            });
        }
    });

    // Check for troll hits
    const trollHits = [];
    trolls.forEach((troll, index) => {
        if (!troll.alive) return;
        const intersects = raycaster.intersectObject(troll.mesh, true);
        if (intersects.length > 0) {
            trollHits.push({
                troll: troll,
                index: index,
                distance: intersects[0].distance,
                point: intersects[0].point,
                type: 'troll'
            });
        }
    });

    // Check for environment hits
    const environmentHits = [];
    gameObjects.forEach(obj => {
        if (obj.mesh && obj.type !== 'ground') {
            const intersects = raycaster.intersectObject(obj.mesh, true);
            if (intersects.length > 0) {
                environmentHits.push({
                    distance: intersects[0].distance,
                    point: intersects[0].point
                });
            }
        }
    });

    // Find closest hit
    let closestHit = null;
    let closestDistance = 100;

    // Check goblin hits
    goblinHits.forEach(hit => {
        if (hit.distance < closestDistance) {
            closestDistance = hit.distance;
            closestHit = hit;
        }
    });

    // Check troll hits
    trollHits.forEach(hit => {
        if (hit.distance < closestDistance) {
            closestDistance = hit.distance;
            closestHit = hit;
        }
    });

    // Check environment hits
    environmentHits.forEach(hit => {
        if (hit.distance < closestDistance) {
            closestDistance = hit.distance;
            closestHit = { type: 'environment', ...hit };
        }
    });

    // Set hit point
    if (closestHit) {
        hitPoint = closestHit.point;
        hitDistance = closestDistance;
    }

    // Create laser beam from gun to hit point
    const laserDistance = hitDistance;
    const laserGeometry = new THREE.CylinderGeometry(0.02, 0.02, laserDistance);
    const laserMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9,
        emissive: 0x004400
    });
    const laser = new THREE.Mesh(laserGeometry, laserMaterial);
    
    // Position laser beam
    const laserCenter = gunWorldPosition.clone().add(direction.clone().multiplyScalar(laserDistance / 2));
    laser.position.copy(laserCenter);
    
    // Rotate laser to point in shooting direction
    laser.lookAt(hitPoint);
    laser.rotateX(Math.PI / 2);
    
    scene.add(laser);

    // Create hit effect at impact point
    const hitEffectGeometry = new THREE.SphereGeometry(0.2);
    const hitEffectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8
    });
    const hitEffect = new THREE.Mesh(hitEffectGeometry, hitEffectMaterial);
    hitEffect.position.copy(hitPoint);
    scene.add(hitEffect);

    // Handle enemy damage
    if (closestHit && closestHit.type === 'goblin') {
        const goblin = closestHit.goblin;
        goblin.health -= 25;
        console.log('Goblin hit! Health:', goblin.health);
        
        if (goblin.health <= 0) {
            console.log('Goblin killed!');
            goblin.alive = false;
            scene.remove(goblin.mesh);
            goblins.splice(closestHit.index, 1);
            score += 100;
            updateUI();
            
            // Spawn new goblin after delay
            setTimeout(() => {
                createGoblin(
                    (Math.random() - 0.5) * 80 + Math.sign(Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 80 + Math.sign(Math.random() - 0.5) * 30
                );
            }, 3000);
        }
    } else if (closestHit && closestHit.type === 'troll') {
        const troll = closestHit.troll;
        troll.health -= 15; // Trolls are tougher
        console.log('Troll hit! Health:', troll.health);
        
        if (troll.health <= 0) {
            console.log('Troll killed!');
            troll.alive = false;
            scene.remove(troll.mesh);
            trolls.splice(closestHit.index, 1);
            score += 300; // More points for killing a troll
            updateUI();
        }
    }

    // Remove laser and effects after short time
    setTimeout(() => {
        scene.remove(laser);
        scene.remove(hitEffect);
    }, 150);
}


function updateGoblins(deltaTime) {
    goblins.forEach(goblin => {
        if (!goblin.alive) return;
        
        // Move towards player
        const direction = new THREE.Vector3()
            .subVectors(camera.position, goblin.mesh.position)
            .normalize();
        direction.y = 0; // Keep on ground
        
        goblin.mesh.position.add(direction.multiplyScalar(goblin.speed * deltaTime));
        goblin.mesh.lookAt(camera.position);
        
        // Play walking sound occasionally
        if (!goblin.lastWalkSound || Date.now() - goblin.lastWalkSound > 800) {
            // sounds.goblinWalk(); // Disabled enemy sounds
            goblin.lastWalkSound = Date.now();
        }
        
        // Update bounding box
        goblin.boundingBox.setFromObject(goblin.mesh);
        
        // Shoot at player
        const now = Date.now();
        const distanceToPlayer = goblin.mesh.position.distanceTo(camera.position);
        
        if (distanceToPlayer < 20 && now - goblin.lastShot > goblin.shotCooldown) {
            shootGoblinProjectile(goblin);
            goblin.lastShot = now;
        }
        
        // Damage player if too close
        if (distanceToPlayer < 2) {
            takeDamage(5);
        }
    });
}

function shootGoblinProjectile(goblin) {
    const projectileGeometry = new THREE.SphereGeometry(0.3);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    
    projectile.position.copy(goblin.mesh.position);
    projectile.position.y += 2;
    
    const direction = new THREE.Vector3()
        .subVectors(camera.position, projectile.position)
        .normalize();
    
    scene.add(projectile);
    
    projectiles.push({
        mesh: projectile,
        velocity: direction.multiplyScalar(15),
        life: 3
    });
}

function updateProjectiles(deltaTime) {
    projectiles.forEach((projectile, index) => {
        projectile.mesh.position.add(
            projectile.velocity.clone().multiplyScalar(deltaTime)
        );
        projectile.life -= deltaTime;
        
        // Check collision with player
        const distanceToPlayer = projectile.mesh.position.distanceTo(camera.position);
        if (distanceToPlayer < 1) {
            takeDamage(20);
            scene.remove(projectile.mesh);
            projectiles.splice(index, 1);
            return;
        }
        
        // Remove old projectiles
        if (projectile.life <= 0) {
            scene.remove(projectile.mesh);
            projectiles.splice(index, 1);
        }
    });
}

function takeDamage(amount) {
    // Don't take damage if game hasn't started yet
    if (!gameStarted) {
        console.log('Game not started - no damage taken');
        return;
    }
    
    // Don't take damage if immortal
    if (isImmortal) {
        console.log('Player is immortal - no damage taken');
        return;
    }
    
    health -= amount;
    health = Math.max(0, health);
    updateUI();
    
    // Flash effect
    document.body.classList.add('damage-flash');
    setTimeout(() => {
        document.body.classList.remove('damage-flash');
    }, 300);
    
    if (health <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameStarted = false;
    console.log('Game Over! Score:', score);
    
    // Show game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');
    
    finalScoreElement.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.opacity = '1'; // Ensure it's visible
    
    // Add click listener to restart game
    const restartGame = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Restarting game...');
        
        // Remove event listeners
        gameOverScreen.removeEventListener('click', restartGame);
        gameOverScreen.removeEventListener('touchstart', restartGame);
        document.removeEventListener('keydown', restartGameKeyboard);
        
        // Fade out game over screen
        gameOverScreen.style.transition = 'opacity 0.5s ease-out';
        gameOverScreen.style.opacity = '0';
        
        setTimeout(() => {
            location.reload();
        }, 500);
    };
    
    // Keyboard restart for desktop
    const restartGameKeyboard = (event) => {
        if (event.code === 'Space' || event.code === 'Enter' || event.code === 'Escape') {
            restartGame(event);
        }
    };
    
    // Wait for game over animation to complete before allowing restart
    setTimeout(() => {
        console.log('Adding restart listeners');
        gameOverScreen.addEventListener('click', restartGame, { passive: false });
        gameOverScreen.addEventListener('touchstart', restartGame, { passive: false });
        document.addEventListener('keydown', restartGameKeyboard, { passive: false });
    }, 3000); // Wait 3 seconds for the full animation
}

function updateUI() {
    document.getElementById('health').textContent = `Health: ${health}`;
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('ammo').textContent = `Music: ${musicEnabled ? 'ON (M to toggle)' : 'OFF (M to toggle)'}`;
}

function checkCollisions() {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        camera.position,
        new THREE.Vector3(1, player.height, 1)
    );
    
    gameObjects.forEach(obj => {
        if (obj.boundingBox && obj.type !== 'ground') {
            if (playerBox.intersectsBox(obj.boundingBox)) {
                // Simple collision response - push player back
                const direction = new THREE.Vector3()
                    .subVectors(camera.position, obj.mesh.position)
                    .normalize();
                direction.y = 0;
                camera.position.add(direction.multiplyScalar(0.5));
            }
        }
    });
}

function updatePlayer(deltaTime) {
    if (!gameStarted) return;
    
    // Update immortality status
    if (isImmortal) {
        const elapsed = Date.now() - immortalityStart;
        if (elapsed >= immortalityDuration) {
            isImmortal = false;
            console.log('Immortality period ended');
            
            // Stop blinking effect on gun
            if (window.playerGun) {
                window.playerGun.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 1;
                        child.material.transparent = false;
                    }
                });
            }
        } else {
            // Apply blinking effect to gun
            if (window.playerGun) {
                const blinkIntensity = Math.sin(elapsed * 0.01) * 0.5 + 0.5; // Oscillate between 0.5 and 1
                window.playerGun.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 0.3 + blinkIntensity * 0.7;
                        child.material.transparent = true;
                    }
                });
            }
        }
    }
    
    // Apply gravity
    if (!playerOnGround) {
        playerVelocity.y += GRAVITY * deltaTime;
    }
    
    // Movement
    const moveVector = new THREE.Vector3();
    
    if (isMobile) {
        // Mobile touch controls - only forward movement with left/right rotation
        if (touchControls.movement.moving) {
            // Always move forward when joystick is touched
            moveVector.z = -1; // Forward movement
            
            // Use joystick X for camera rotation (left/right looking)
            const rotationSpeed = 3.0; // Adjust sensitivity
            mouseX -= touchControls.movement.x * rotationSpeed * deltaTime;
        }
    } else {
        // Desktop keyboard controls
        if (keys['KeyW']) moveVector.z -= 1;
        if (keys['KeyS']) moveVector.z += 1;
        if (keys['KeyA']) moveVector.x -= 1;
        if (keys['KeyD']) moveVector.x += 1;
    }
    
    if (moveVector.length() > 0) {
        moveVector.normalize();
        moveVector.applyQuaternion(camera.quaternion);
        moveVector.y = 0;
        moveVector.normalize();
        
        const speed = isMobile ? MOVE_SPEED * 0.7 : MOVE_SPEED; // Slower on mobile for better control
        camera.position.add(moveVector.multiplyScalar(speed * deltaTime));
    }
    
    // Apply vertical velocity
    camera.position.y += playerVelocity.y * deltaTime;
    
    // Ground collision
    if (camera.position.y <= player.height) {
        camera.position.y = player.height;
        playerVelocity.y = 0;
        playerOnGround = true;
    } else {
        playerOnGround = false;
    }
    
    // Update camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = mouseX;
    camera.rotation.x = mouseY;
    
    // Apply camera shake effect
    if (cameraShake.duration > 0) {
        cameraShake.duration -= deltaTime * 1000;
        
        const shakeX = (Math.random() - 0.5) * cameraShake.intensity;
        const shakeY = (Math.random() - 0.5) * cameraShake.intensity;
        
        camera.position.x += shakeX;
        camera.position.y += shakeY;
        
        // Reduce intensity over time
        cameraShake.intensity *= 0.95;
    }
    
    // Check collisions
    checkCollisions();
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    updatePlayer(deltaTime);
    updateGoblins(deltaTime);
    updateTrolls(deltaTime);
    updateHealthPacks(deltaTime);
    updateProjectiles(deltaTime);
    
    renderer.render(scene, camera);
}

// Start the game when page loads
window.addEventListener('load', init);