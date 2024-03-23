import * as THREE from 'three';
import { GameObject, MeshComponent, Engine } from '../engine.js';
import * as CANNON from "CANNON";


export class gun {
    constructor(gunObj){
        this.gunObj = gunObj;
        this.recoil = 10;
        this.currentRot = 0;
        this.distance = 500;
        this.force = 500;
    }

    start(){
        this.gunObj.setScale(0.1,0.1,0.1);
        document.addEventListener("click", this.onClick.bind(this));
    }

    async createSphere(position){
        const Sphere = new GameObject();
        this.engine.addGameObject(Sphere);

        const SphereGeometry = await this.engine.loadMesh("./Models/Primitive/sphere.obj");
        const SphereMat = new THREE.MeshBasicMaterial();
        SphereMat.color = new THREE.Color(1,0,0);
        Sphere.addComponent(new MeshComponent(SphereGeometry, [SphereMat]));
        Sphere.setPosition(position.x, position.y, position.z);
        Sphere.setScale(0.25,0.25,0.25);
        setTimeout(()=>{
            Sphere.destroy();
        }, 1000);
    }

    async onClick(event){
        if (!this.shotCooldown) { 

            const sound = new THREE.Audio(this.engine.listener);
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load( './Sounds/gun.wav', function( buffer ) {
                sound.setBuffer( buffer );
                sound.setLoop( false );
                sound.setVolume( 0.5 );
                sound.play();
            });


            this.currentRot += this.recoil * Math.PI / 180; 
            this.shotCooldown = true; 
            const raycastOptions = {
                collisionFilterMask: ~2
            };

            let currentpos = new CANNON.Vec3(this.engine.camera.position.x, this.engine.camera.position.y, this.engine.camera.position.z);
            let gunPos = new THREE.Vector3().copy(this.engine.camera.position);


            const gunDir = new THREE.Vector3(0,0,-1);
            gunDir.applyQuaternion(this.engine.camera.quaternion);
            const newdir = currentpos.vadd(new CANNON.Vec3(gunDir.x * this.distance, gunDir.y * this.distance, gunDir.z * this.distance));

            const result = new CANNON.RaycastResult();
            this.engine.physicsWorld.raycastClosest(currentpos, newdir, raycastOptions, result);
            if(result.hasHit){
                await this.createSphere(result.hitPointWorld);   
                console.log(result);
                if(result.body){
                    const force = this.force;
                    result.body.applyForce(new CANNON.Vec3(gunDir.x * force, gunDir.y * force, gunDir.z * force));
                }
            }

            setTimeout(() => {
                this.shotCooldown = false;
            }, 100);
        }
    }

    fixedUpdate(){
        this.currentRot -= 75 * 0.01 * Math.PI / 180 ;
        this.currentRot = THREE.MathUtils.clamp(this.currentRot, 0, this.recoil * Math.PI / 180);
        if(this.engine.camera && this.gunObj){
            const camRot = this.engine.camera.rotation;

            let gunPos = this.engine.camera.position.clone();
            const gunOffset = new THREE.Vector3(.15,-.4,-.6);
            gunOffset.applyQuaternion(this.engine.camera.quaternion.clone());
            gunPos = gunPos.add(gunOffset);
            
            this.gunObj.setPosition(gunPos.x, gunPos.y, gunPos.z);

            let gunRot = new THREE.Vector3(camRot.x, camRot.y, camRot.z);
            this.gunObj.setRotation(gunRot.x, gunRot.y, gunRot.z);
            this.gunObj.rotateLocalX(this.currentRot);
        }
    }
}
