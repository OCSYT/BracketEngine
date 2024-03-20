import { Engine, GameObject, MeshComponent } from './engine.js';
import * as THREE from './node_modules/three/build/three.module.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';
import {CSM} from './node_modules/three/examples/jsm/csm/CSM.js';


import { CameraControls } from './Scripts/cameraControls.js';

export class Program {
    constructor() {
        this.applicationName = "BracketEngine Sample Scene";
    }

    async start() {

        //camera
        this.engine.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera.position.z = 5;

        const cameraControls = new CameraControls(this.engine.camera);
        const CameraObj = new GameObject();
        CameraObj.addComponent(cameraControls);
        this.engine.addGameObject(CameraObj);



        this.setupLighting();
        this.setupScene();

        //Cube
        const cubeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const cubeMaterial = new THREE.MeshStandardMaterial();
        const cubeTex = await this.engine.loadTexture("./Textures/Required/None.png");
        cubeMaterial.map = cubeTex;
        const cubeObject = new GameObject();
        cubeObject.setPosition(0, 5, 0);
        cubeObject.setRotation(0,0,0);
        const cubeShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        cubeObject.initPhysicsBody(this.engine.physicsWorld, cubeShape, 1, 1);
        this.engine.csm.setupMaterial(cubeMaterial);
        cubeObject.addComponent(new MeshComponent(cubeGeometry, [cubeMaterial], true, true));
        this.engine.addGameObject(cubeObject);

        //ground
        const planeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const planeMaterial = new THREE.MeshStandardMaterial();
        const planeObject = new GameObject();
        planeObject.setPosition(0, -2, 0);
        planeObject.setRotation(0,0,0);
        planeObject.setScale(100, 1, 100);
        const planeShape = new CANNON.Box(new CANNON.Vec3(100, 1, 100));
        planeObject.initPhysicsBody(this.engine.physicsWorld, planeShape, 1, 0);
        this.engine.csm.setupMaterial(planeMaterial);
        planeObject.addComponent(new MeshComponent(planeGeometry, [planeMaterial], true, true));
        this.engine.addGameObject(planeObject);
    
    }

    async update(deltaTime) {
        document.getElementById("fps").innerHTML = "FPS: " + this.engine.currentFPS;
    }

    setupLighting() {
        this.engine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.engine.renderer.outputEncoding = THREE.sRGBEncoding;


        const light_ambient = new THREE.AmbientLight(0x616161);
        this.engine.scene.add(light_ambient);



        //shadowmap
        this.engine.renderer.shadowMap.enabled = true;
        this.engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        let csm = new CSM({
            maxFar: this.engine.camera.far,
            cascades: 4,
            shadowMapSize: 4024,
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
    }
}
