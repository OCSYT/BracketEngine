import * as THREE from '../node_modules/three/build/three.module.js';
import * as CANNON from '../node_modules/cannon-es/dist/cannon-es.js';

export class PlayerControls {
    constructor(engine, camera, body, domElement) {
        this.camera = camera;
        this.engine = engine;
        this.body = body;
        this.body.angularFactor.set(0, 0, 0);

        this.domElement = domElement || document;

        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
        this.mouseStopped = true;
        this.timer = null;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.moveSpeed = 20;
        this.rotX = 0;
        this.rotY = 0;

        this.grounded = false;

        this.jumpSpeed = 400;
        this.canJump = true;
    }

    init() {
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onMouseMove(event) {
        document.body.requestPointerLock();

        this.mouseStopped = false;
        this.mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this.mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.mouseStopped = true;
        }, 10);
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'w':
                this.moveForward = true;
                break;
            case 's':
                this.moveBackward = true;
                break;
            case 'a':
                this.moveLeft = true;
                break;
            case 'd':
                this.moveRight = true;
                break;
        }

        if (event.key === ' ' && this.canJump) {
            this.jump();
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'w':
                this.moveForward = false;
                break;
            case 's':
                this.moveBackward = false;
                break;
            case 'a':
                this.moveLeft = false;
                break;
            case 'd':
                this.moveRight = false;
                break;
        }
    }

    jump() {
        if (this.canJump && this.grounded) {
            this.body.applyForce(new CANNON.Vec3(0, this.jumpSpeed, 0));
            this.canJump = false;
            setTimeout(() => {
                this.canJump = true;
            }, 500);
        }
    }

    update(deltaTime) {
        const sensitivity = 0.5 * deltaTime;
        const deltaX = this.mouseX * sensitivity;
        const deltaY = this.mouseY * sensitivity;

        if (!this.mouseStopped) {
            this.rotY -= deltaX;
            this.rotX -= deltaY;
            this.rotX = THREE.MathUtils.clamp(this.rotX, -90 * Math.PI / 180, 90 * Math.PI / 180);
            const euler = new THREE.Euler(this.rotX, this.rotY, 0, 'YXZ');
            this.camera.quaternion.setFromEuler(euler);
        }

        const moveDirection = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        this.camera.getWorldQuaternion(quaternion);
        moveDirection.set(0, 0, -1).applyQuaternion(quaternion);

        const moveSpeed = this.moveSpeed * 100 * deltaTime;
        const moveForce = moveDirection.clone().multiplyScalar(moveSpeed);

        var dampingFactor = 0.9;
        if (this.moveForward) {
            this.body.applyLocalForce(new CANNON.Vec3(moveForce.x, 0, moveForce.z), new CANNON.Vec3(0, 0, 0));
        }
        if (this.moveBackward) {
            this.body.applyLocalForce(new CANNON.Vec3(-moveForce.x, 0, -moveForce.z), new CANNON.Vec3(0, 0, 0));
        }
        if (this.moveLeft) {
            this.body.applyLocalForce(new CANNON.Vec3(moveForce.z, 0, -moveForce.x), new CANNON.Vec3(0, 0, 0));
        }
        if (this.moveRight) {
            this.body.applyLocalForce(new CANNON.Vec3(-moveForce.z, 0, moveForce.x), new CANNON.Vec3(0, 0, 0));
        }

        const currentpos = this.body.position.clone();
        const raycastOptions = {
            collisionFilterMask: ~this.body.collisionFilterGroup
        };

        let hit = false;
        this.engine.physicsWorld.raycastAll(currentpos, currentpos.vadd(new CANNON.Vec3(0, -2, 0)), raycastOptions, (raycastResult) => {
            hit = true;
        });
        this.grounded = hit;

        const velocity = this.body.velocity;
        velocity.x *= dampingFactor;
        velocity.z *= dampingFactor;
        this.body.velocity = velocity;

        this.camera.position.copy(this.body.position);
    }
}
