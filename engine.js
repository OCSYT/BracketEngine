import * as THREE from './node_modules/three/build/three.module.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';
import { CSM } from './node_modules/three/examples/jsm/csm/CSM.js';
import { EffectComposer } from "EffectComposer";
import { RenderPass } from "RenderPass";
import { ShaderPass } from "ShaderPass";
import { FXAAShader } from "FXAAShader";

export class Engine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.csm = null;
        this.renderer = new THREE.WebGLRenderer();
        this.gameObjects = [];
        this.isRunning = false;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.currentFPS = 0;
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0) // m/s²
        });


        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);



    }

    start() {
        this.isRunning = true;
        this.update();
    }

    stop() {
        this.isRunning = false;
    }

    update() {
        if (!this.isRunning) return;

        const currentTime = performance.now();


        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        this.calculateFPS(deltaTime);


        if (this.camera) {
            if (this.csm) {
                this.csm.update(this.camera.matrix);
            }
        }


        if (this.physicsWorld == null) return;

        this.physicsWorld.fixedStep();

        // Update game logic here
        this.gameObjects.forEach(gameObject => {
            gameObject.update(deltaTime);
        });

        this.renderScene();
        requestAnimationFrame(() => this.update());
    }


    calculateFPS(deltaTime) {
        const elapsedSeconds = deltaTime * this.frameCount;
        if (elapsedSeconds >= 1) { // Calculate FPS every 1 second
            const fps = Math.round(this.frameCount / elapsedSeconds);
            this.currentFPS = fps;
            this.frameCount = 0; // Reset frame count
        }
        this.frameCount++;
    }

    renderScene() {
        if (this.camera != null) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if(!this.renderPass){
                this.composer = new EffectComposer(this.renderer);
                this.renderPass = new RenderPass(this.scene, this.camera);
                this.composer.addPass(this.renderPass);
            }
            else{
                this.composer.render();
            }
        }
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
        gameObject.addToScene(this.scene);
    }

    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index !== -1) {
            this.gameObjects.splice(index, 1);
            gameObject.removeFromScene(this.scene);
        }
    }


    async loadMesh(url) {
        return new Promise((resolve, reject) => {
            const loader = new OBJLoader();

            loader.load(
                url,
                object => {
                    resolve(object);
                },
                undefined,
                error => {
                    reject(error);
                }
            );
        });
    }

    async loadShader(url) {
        let shader = await (await fetch(url)).text();
        return shader;
    }


    // Function to load a texture
    async loadTexture(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                texture => {
                    resolve(texture);
                },
                undefined,
                err => {
                    console.error('An error occurred while loading the main texture. Loading fallback texture...', err);
                    // Attempt to load the fallback texture
                    loader.load(
                        "./Textures/Required/None.png",
                        fallbackTexture => {
                            resolve(fallbackTexture);
                        },
                        undefined,
                        err => {
                            console.error('An error occurred while loading the fallback texture.', err);
                            reject(err); // Reject the promise if the fallback texture also fails to load
                        }
                    );
                }
            );
        });
    }


}

export class GameObject {
    constructor() {
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };
        this.components = [];
        this.physicsBody = null;
    }

    initPhysicsBody(physicsWorld, shape, restitution = 0.5, friction = 1, mass = 0) {
        const { x, y, z } = this.position;
        const { x: rotx, y: roty, z: rotz } = this.rotation;

        const material = new CANNON.Material();
        material.friction = friction;
        material.restitution = restitution;

        const initialQuaternion = new CANNON.Quaternion();
        initialQuaternion.setFromEuler(rotx, roty, rotz, "XYZ");


        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(x, y, z),
            shape: shape,
            material: material,
            quaternion: initialQuaternion
        });

        this.physicsBody = body;

        physicsWorld.addBody(body);
    }


    setPosition(x, y, z) {
        if (!this.physicsBody) {
            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
        else {
            this.physicsBody.x = x;
            this.physicsBody.y = y;
            this.physicsBody.z = z;
        }
    }

    setRotation(x, y, z) {
        if (!this.physicsBody) {
            this.rotation.x = x;
            this.rotation.y = y;
            this.rotation.z = z;
        }
        else {
            const initialQuaternion = new CANNON.Quaternion();
            initialQuaternion.setFromEuler(x, y, z, "XYZ");
            this.physicsBody.quaternion = initialQuaternion;
        }
    }

    setScale(x, y, z) {
        this.scale.x = x;
        this.scale.y = y;
        this.scale.z = z;
    }

    updatePhysics(deltaTime) {
        if (this.physicsBody) {
            this.position = this.physicsBody.position.clone();

            var rot = new CANNON.Vec3();
            const {x,y,z,w} = this.physicsBody.quaternion.clone();
            rot = new THREE.Euler().setFromQuaternion( new THREE.Quaternion(x,y,z,w), "XYZ");
            this.rotation = { x: rot.x, y: rot.y, z: rot.z }
        }
    }

    update(deltaTime) {
        this.components.forEach(component => {
            if (component.update) {
                component.update(deltaTime);
            }
        });
        this.updatePhysics(deltaTime);
    }

    addToScene(scene) {
        this.components.forEach(component => {
            component.gameObject = this;
            if (component.addToScene) {
                component.addToScene(scene);
            }
            if (component.start) {
                component.start();
            }
        });
    }

    removeFromScene(scene) {
        this.components.forEach(component => {
            if (component.removeFromScene) {
                component.removeFromScene(scene);
            }
        });
    }

    addComponent(component) {
        component.gameObject = this;
        this.components.push(component);
    }

    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
        }
    }

    getComponent(type) {
        return this.components.find(component => component instanceof type);
    }
}


export class MeshComponent {
    constructor(geometry, materials, castShadows, recieveShadows) {
        this.materials = materials;
        this.mesh = geometry;
        this.castShadows = castShadows;
        this.recieveShadows = recieveShadows;
    }

    addToScene(scene) {
        let index = 0;
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && this.materials[index]) {
                child.material = this.materials[index];
                child.receiveShadow = this.recieveShadows;
                child.castShadow = this.castShadows;
                index++;
            }
        });
        scene.add(this.mesh);
    }

    removeFromScene(scene) {
        scene.remove(this.mesh);
        delete this.mesh;
    }

    update(deltaTime) {
        if (this.gameObject) {
            const { position, rotation, scale } = this.gameObject;
            if (this.mesh) {
                this.mesh.position.set(position.x, position.y, position.z);
                    this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
                this.mesh.scale.set(scale.x, scale.y, scale.z);
            }
        }
    }
}