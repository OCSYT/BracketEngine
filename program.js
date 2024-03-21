import { Engine, GameObject, MeshComponent } from './engine.js';
import * as THREE from 'three';
import * as CANNON from 'CANNON';
import { CSM } from 'three/addons/csm/CSM.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

//post processing
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

//custom scripts
import { PlayerControls } from './Scripts/playerControls.js';

export class Program {
    constructor() {
        this.applicationName = "BracketEngine Sample Scene";
    }


    async start() {

        //camera
        this.engine.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 1000);
        const listener = new THREE.AudioListener();
        this.engine.camera.add( listener );


        this.setupLighting();
        this.setupScene();

        //ground
        await this.AddGround();

        //Cube
        await this.AddCube(new THREE.Color(0, 0.5, 1), new THREE.Vector3(0, 5, 0), new THREE.Vector3(), new THREE.Vector3(1,1,1), 1);
        await this.AddCube(new THREE.Color(1, 0, 0), new THREE.Vector3(5, 5, -5), new THREE.Vector3(1, 2, 1), new THREE.Vector3(1,1,1), 1);


        //player
        await this.addPlayer(new THREE.Vector3(0, 5, 5));

    }

    async update(deltaTime) {       
        document.getElementById("fps").innerHTML = "FPS: " + this.engine.currentFPS;
    }

    async fixedUpdate(){

    }

    async AddGround(){
        const planeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const planeMaterial = new THREE.MeshStandardMaterial();
        const planeTex = await this.engine.loadTexture("./Textures/Required/Checkerboard.png");
        planeTex.repeat.set(100, 100);
        planeTex.wrapS = THREE.RepeatWrapping;
        planeTex.wrapT = THREE.RepeatWrapping;

        planeMaterial.map = planeTex;
        const planeObject = new GameObject();
        planeObject.setPosition(0, -2, 0);
        planeObject.setRotation(0, 0, 0);
        planeObject.setScale(100, 1, 100);
        const planeShape = new CANNON.Box(new CANNON.Vec3(100, 1, 100));
        planeObject.initPhysicsBody(this.engine.physicsWorld, planeShape, 0.5, 1, 0);
        this.engine.csm.setupMaterial(planeMaterial);
        this.engine.addGameObject(planeObject);
        planeObject.addComponent(new MeshComponent(planeGeometry, [planeMaterial], true, true));
    }

    async AddCube(color, position, rotation, scale, mass) {
        const cubeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const cubeMaterial = new THREE.MeshStandardMaterial();
        const cubeTex = await this.engine.loadTexture("./Textures/Required/Checkerboard.png");
        cubeMaterial.map = cubeTex;
        cubeMaterial.color.set(color);
        const cubeObject = new GameObject();
        cubeObject.setPosition(position.x, position.y, position.z);
        cubeObject.setRotation(rotation.x, rotation.y, rotation.z);
        cubeObject.setScale(scale.x, scale.y, scale.z);
        const cubeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        cubeObject.initPhysicsBody(this.engine.physicsWorld, cubeShape, 0.5, 1, mass);
        this.engine.csm.setupMaterial(cubeMaterial)
        
        this.engine.addGameObject(cubeObject);;
        cubeObject.addComponent(new MeshComponent(cubeGeometry, [cubeMaterial], true, true));
    }

    async addPlayer(position) {
        const capsuleGeometry = await this.engine.loadMesh("./Models/Primitive/capsule.obj");
        const capsuleMaterial = new THREE.MeshStandardMaterial();
        const capsuleObject = new GameObject();
        capsuleObject.setPosition(position.x, position.y, position.z);
        const capsuleShape = new CANNON.Cylinder(1, 1, 4, 16);
        capsuleObject.initPhysicsBody(this.engine.physicsWorld, capsuleShape, 0, 0, 1);
        capsuleObject.physicsBody.collisionFilterGroup = 2;
        this.engine.csm.setupMaterial(capsuleMaterial);

        this.engine.addGameObject(capsuleObject);

        capsuleObject.addComponent(new MeshComponent(capsuleGeometry, [capsuleMaterial], true, true));

        const _playerControls = new PlayerControls(capsuleObject.physicsBody);
        capsuleObject.addComponent(_playerControls);

    }


    setupLighting() {
        const light_ambient = new THREE.AmbientLight(0x616161);
        this.engine.scene.add(light_ambient);

        //shadowmap
        this.engine.renderer.shadowMap.enabled = true;
        this.engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        let csm = new CSM({
            maxFar: 250,
            cascades: 4,
            shadowMapSize: 1028,
            lightDirection: new THREE.Vector3(1, -1, 1).normalize(),
            camera: this.engine.camera,
            parent: this.engine.scene,
            lightIntensity: 1
        });
        this.engine.csm = csm;
    }

    setupScene() {
        //skybox
        const loader = new THREE.CubeTextureLoader();
        const textureCube = loader.load([
            './Textures/Skybox/Daylight Box_Right.bmp', './Textures/Skybox/Daylight Box_Left.bmp',
            './Textures/Skybox/Daylight Box_Top.bmp', './Textures/Skybox/Daylight Box_Bottom.bmp',
            './Textures/Skybox/Daylight Box_Front.bmp', './Textures/Skybox/Daylight Box_Back.bmp',
        ]);
        this.engine.scene.background = textureCube;


        //post processing

        //tonemapping
        this.engine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.engine.renderer.toneMappingExposure = 1.3;


        const AO = new GTAOPass(this.engine.scene, this.engine.camera, window.innerWidth, window.innerHeight);

        this.engine.composer.addPass(AO);
        const aoParameters = {
            radius: 0.25,
            distanceExponent: 1.,
            thickness: 1.,
            scale: 5.,
            samples: 16,
            distanceFallOff: 1.,
            screenSpaceRadius: true,
        };
        const pdParameters = {
            lumaPhi: 10.,
            depthPhi: 2.,
            normalPhi: 3.,
            radius: 4.,
            radiusExponent: 1.,
            rings: 2.,
            samples: 16,
        };
        AO.updateGtaoMaterial( aoParameters );
        AO.updatePdMaterial( pdParameters );
        

        //bloom
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = .1;
        bloomPass.radius = 0;
        this.engine.composer.addPass(bloomPass);


        //pass
        this.engine.composer.addPass(new OutputPass());


    }
}
