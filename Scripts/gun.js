import * as THREE from 'three';
import { GameObject, MeshComponent, Engine } from '../engine.js';
import * as CANNON from "CANNON";


export class gun {
    constructor(gunObj, player) {
        this.gunObj = gunObj;
        this.player = player;
        this.recoil = 10;
        this.currentRot = 0;
        this.distance = 500;
        this.force = 50000;
        this.rotSmoothing = 10;
        this.camRot = new THREE.Quaternion();
        this.bobx = 0;
        this.boby = 0;
        this.shooting = false;
        this.allowShoot = true;
        this.fireRate = 100;

        this.reloading = false;
        this.reloadRate = 2500;

        this.maxAmmo = 30;
        this.ammo;
        this.reloadOffset = 0;
    }

    start() {
        this.ammo = this.maxAmmo;
        this.gunObj.setScale(0.1, 0.1, 0.1);
        document.addEventListener("mousedown", this.onMouseDown.bind(this));
        document.addEventListener("mouseup", this.onMouseUp.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        if(event.key == "r" && !this.reloading){
            this.reloading = true;
            setTimeout(()=>{
                this.reloading = false;
            }, this.reloadRate);
        }
    }
    onKeyUp(event) {

    }
    onMouseDown(event) {
        if (event.button != 0) return;
        this.shooting = true;
    }
    onMouseUp(event) {
        if (event.button != 0) return;
        this.shooting = false;
    }

    async createSphere(position) {
        const Sphere = new GameObject();
        this.engine.addGameObject(Sphere);

        const SphereGeometry = await this.engine.loadMesh("./Models/Primitive/sphere.obj");
        const SphereMat = new THREE.MeshBasicMaterial();
        SphereMat.color = new THREE.Color(1, 0, 0);
        Sphere.addComponent(new MeshComponent(SphereGeometry, [SphereMat]));
        Sphere.setPosition(position.x, position.y, position.z);
        Sphere.setScale(0.25, 0.25, 0.25);
        setTimeout(() => {
            Sphere.destroy();
        }, 1000);
    }

    async shoot() {
        this.ammo -= 1;
        this.allowShoot = false;

        const sound = new THREE.Audio(this.engine.listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('./Sounds/gun.wav', function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
        });


        this.currentRot += this.recoil * Math.PI / 180;

        const raycastOptions = {
            collisionFilterMask: ~2
        };

        let currentpos = new CANNON.Vec3(this.engine.camera.position.x, this.engine.camera.position.y, this.engine.camera.position.z);
        let gunPos = new THREE.Vector3().copy(this.engine.camera.position);


        const gunDir = new THREE.Vector3(0, 0, -1);
        gunDir.applyQuaternion(this.engine.camera.quaternion);
        const newdir = currentpos.vadd(new CANNON.Vec3(gunDir.x * this.distance, gunDir.y * this.distance, gunDir.z * this.distance));

        const result = new CANNON.RaycastResult();
        this.engine.physicsWorld.raycastClosest(currentpos, newdir, raycastOptions, result);
        if (result.hasHit) {
            await this.createSphere(result.hitPointWorld);
            const force = this.force;
            result.body.applyForce(new CANNON.Vec3(gunDir.x * force, gunDir.y * force, gunDir.z * force));
        }



        setTimeout(() => {
            this.allowShoot = true;
        }, this.fireRate);
    }



    fixedUpdate() {

        document.getElementById("guninfo").innerHTML = this.ammo + "/" + this.maxAmmo;

        if (this.shooting === true && this.allowShoot === true && !this.reloading) {
            if(this.ammo >= 1){
                this.shoot();
            }
        }

        if(this.reloading){
            this.ammo = this.maxAmmo;
            this.reloadOffset = THREE.MathUtils.lerp(this.reloadOffset, -3, 5 * 0.02);
        }
        else{
            this.reloadOffset = THREE.MathUtils.lerp(this.reloadOffset, 0, 5 * 0.02);
        }

        this.currentRot -= 75 * 0.02 * Math.PI / 180;
        this.currentRot = THREE.MathUtils.clamp(this.currentRot, 0, this.recoil * Math.PI / 180);
        if (this.engine.camera && this.gunObj) {

            let gunPos = this.engine.camera.position.clone();

            // viewbob
            if (this.player) {
                const playerspeed = Math.round(Math.abs(THREE.MathUtils.clamp(this.player.body.velocity.x * 2 + this.player.body.velocity.z * 4, -1, 1)));

                if (this.player.grounded) {
                    const bobangle = 0.1;
                    const bobspeed = 1;

                    this.bobx = THREE.MathUtils.lerp(this.bobx, Math.sin(playerspeed * Date.now() / 100 * bobspeed) * bobangle, 5 * 0.02);
                    this.boby = THREE.MathUtils.lerp(this.boby, Math.sin(playerspeed * Date.now() / 100 * (bobspeed * 2)) * bobangle, 5 * 0.02);
                }
                else {
                    this.bobx = THREE.MathUtils.lerp(this.bobx, 0, 5 * 0.02);
                    this.boby = THREE.MathUtils.lerp(this.boby, 0, 5 * 0.02);
                }
            }

            const gunOffset = new THREE.Vector3(.15 + this.bobx, -.4 - this.boby +   this.reloadOffset, -.6);
            gunOffset.applyQuaternion(this.engine.camera.quaternion.clone());
            gunPos = gunPos.add(gunOffset);

            this.gunObj.setPosition(gunPos.x, gunPos.y, gunPos.z);

            this.camRot.slerp(this.engine.camera.quaternion, this.rotSmoothing * 0.02);

            let gunRot = new THREE.Euler().setFromQuaternion(this.camRot);
            this.gunObj.setRotation(gunRot.x, gunRot.y, gunRot.z);
            this.gunObj.rotateLocalX(this.currentRot);



        }
    }
}
