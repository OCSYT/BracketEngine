import { Engine, GameObject, MeshComponent } from './engine.js';
import * as THREE from './node_modules/three/build/three.module.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';
import { CameraControls } from './Scripts/cameraControls.js';

export class Program {
    constructor() {
        this.applicationName = "BracketEngine Sample Scene";
    }

    async start() {
        this.setupLighting();
        this.setupScene();


        const cubeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const cubeMaterial = new THREE.MeshStandardMaterial();
        const cubeTex = await this.engine.loadTexture("./Textures/Required/None.png");
        cubeMaterial.map = cubeTex;
        const cubeObject = new GameObject();
        cubeObject.setPosition(0, 5, 0);
        const cubeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        cubeObject.initPhysicsBody(this.engine.physicsWorld, cubeShape, 1);
        cubeObject.addComponent(new MeshComponent(cubeGeometry, [cubeMaterial], true, true));
        this.engine.addGameObject(cubeObject);

        const planeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const planeMaterial = new THREE.MeshStandardMaterial();
        const planeObject = new GameObject();
        planeObject.setPosition(0, -2, 0);
        planeObject.setScale(100, 1, 100);
        const planeShape = new CANNON.Box(new CANNON.Vec3(100, 1, 100));
        planeObject.initPhysicsBody(this.engine.physicsWorld, planeShape, 0);
        planeObject.addComponent(new MeshComponent(planeGeometry, [planeMaterial], true, true));
        this.engine.addGameObject(planeObject);


        //camera
        this.engine.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera.position.z = 5;
        
        const cameraControls = new CameraControls(this.engine.camera);
        const CameraObj = new GameObject();
        CameraObj.addComponent(cameraControls);
        this.engine.addGameObject(CameraObj);
    }

    async update(deltaTime) {

    }

    setupLighting() {
        this.engine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.engine.renderer.outputEncoding = THREE.sRGBEncoding;


        const light_ambient = new THREE.AmbientLight(0x616161);
        this.engine.scene.add(light_ambient);

        //directional
        const light = new THREE.DirectionalLight(0x404040, 20);
        light.position.set(100, 100, 100);

        //shadowmap
        this.engine.renderer.shadowMap.enabled = true;
        this.engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        light.castShadow = true;
        this.engine.scene.add(light);

        //shadow settings
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500;
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
    }
}
