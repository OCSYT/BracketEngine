import * as THREE from './node_modules/three/build/three.module.js';
import { OBJLoader } from './node_modules/three/examples/jsm/loaders/OBJLoader.js';

export class Engine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = new THREE.WebGLRenderer();
        this.gameObjects = [];
        this.isRunning = false;
        this.lastFrameTime = performance.now();
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
        
        // Update game logic here
        this.gameObjects.forEach(gameObject => {
            gameObject.update(deltaTime);
        });

        this.renderScene();
        requestAnimationFrame(() => this.update());
    }

    renderScene() {
        if (this.camera != null) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.render(this.scene, this.camera);
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
    }

    setPosition(x, y, z) {
        this.position = { x, y, z };
    }

    setRotation(x, y, z) {
        this.rotation = { x, y, z };
    }

    setScale(x, y, z) {
        this.scale = { x, y, z };
    }

    update(deltaTime) {
        this.components.forEach(component => {
            if (component.update) {
                component.update(deltaTime);
            }
        });
    }

    addToScene(scene) {

        this.components.forEach(component => {
            component.gameObject = this;
        });

        this.components.forEach(component => {
            if (component.addToScene) {
                component.addToScene(scene);
            }
        });

        //start function for simplicity
        this.components.forEach(component => {
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