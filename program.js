import { Engine, GameObject, MeshComponent } from './engine.js';
import * as THREE from './node_modules/three/build/three.module.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';

//CustomScripts
import { CameraControls } from './Scripts/cameraControls.js';

export class Program {
    constructor() {
        this.applicationName = "BracketEngine Sample Scene";
    }

    async start() {
        //tonemapping
        this.engine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.engine.renderer.outputEncoding = THREE.sRGBEncoding;
      
        //lighting
        var light_ambient = new THREE.AmbientLight(0x616161);
        this.engine.scene.add(light_ambient);
        var light = new THREE.DirectionalLight(0x404040, 20);
        light.position.set(100,100,100)

        //shadows
        this.engine.renderer.shadowMap.enabled = true;
        this.engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        light.castShadow = true;
        this.engine.scene.add(light);

        //shadow settings
        light.shadow.mapSize.width = 512; // default
        light.shadow.mapSize.height = 512; // default
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 500;

        //skybox
        const loader = new THREE.CubeTextureLoader();
        const textureCube = loader.load([
            './Textures/Skybox/Daylight Box_Right.bmp', './Textures/Skybox/Daylight Box_Left.bmp',
            './Textures/Skybox/Daylight Box_Top.bmp', './Textures/Skybox/Daylight Box_Bottom.bmp',
            './Textures/Skybox/Daylight Box_Front.bmp', './Textures/Skybox/Daylight Box_Back.bmp',
        ]);
        this.engine.scene.background = textureCube;

        //camera
        this.engine.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera.position.z = 5;

        //camera controls
        const cameraControls = new CameraControls(this.engine.camera);
        const CameraObj = new GameObject();
        CameraObj.addComponent(cameraControls);
        this.engine.addGameObject(CameraObj);

        
        const cubeGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const cubeMaterial = new THREE.MeshStandardMaterial();
        const cubeTex = await this.engine.loadTexture("./Textures/Required/None.png");
        cubeMaterial.map = cubeTex;
        const cubeObject = new GameObject();
        cubeObject.setPosition(0, 0, 0);
        cubeObject.addComponent(new MeshComponent(cubeGeometry, [cubeMaterial], true, true));
        this.engine.addGameObject(cubeObject);
        

        const PlaneGeometry = await this.engine.loadMesh("./Models/Primitive/cube.obj");
        const PlaneMaterial = new THREE.MeshStandardMaterial();
        const PlaneObject = new GameObject();
        PlaneObject.setPosition(0, -2, 0);
        PlaneObject.setScale(100, 1, 100);
        PlaneObject.addComponent(new MeshComponent(PlaneGeometry, [PlaneMaterial], true, true));
        this.engine.addGameObject(PlaneObject);
    }

    async update(deltaTime) {

    }
}