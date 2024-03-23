import * as THREE from 'three';
import * as CANNON from 'CANNON';

export class PlayerControls {
    constructor(body) {
        this.body = body;
        this.body.angularFactor.set(0, 0, 0);

        this.sensitivity = 10;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseStopped = true;
        this.timer = null;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.moveSpeed = 50;
        this.rotX = 0;
        this.rotY = 0;
        this.grounded = false;

        this.jumpSpeed = 400;
        this.canJump = true;

        this.prevVel = new CANNON.Vec3();
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

    start() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    onDestroy() {
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
    }

    update(deltaTime) {
        if(this.engine.camera == null) return;
        const sensitivity = this.sensitivity / 10 * deltaTime;
        const deltaX = this.mouseX * sensitivity;
        const deltaY = this.mouseY * sensitivity;

        if (!this.mouseStopped) {
            this.rotY -= deltaX;
            this.rotX -= deltaY;
            this.rotX = THREE.MathUtils.clamp(this.rotX, -90 * Math.PI / 180, 90 * Math.PI / 180);
            const euler = new THREE.Euler(this.rotX, this.rotY, 0, 'YXZ');
            this.engine.camera.quaternion.setFromEuler(euler);
            this.gameObject.setRotation(0, this.rotY / 2, 0);
        }
    }

    fixedUpdate() {

        if(this.engine.camera == null) return;
        const moveDirection = new THREE.Vector3();
        const quaternion = new THREE.Quaternion(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
        moveDirection.set(0, 0, -1).applyQuaternion(quaternion);


        const moveSpeed = this.moveSpeed;
        const moveForce = moveDirection.clone().multiplyScalar(moveSpeed);

        var dampingFactor = .9;
        if (this.grounded) {
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
        }

        const currentpos = new CANNON.Vec3(this.gameObject.position.x, this.gameObject.position.y, this.gameObject.position.z);

        const raycastOptions = {
            collisionFilterMask: ~2
        };

        const result = new CANNON.RaycastResult();
        this.engine.physicsWorld.raycastClosest(currentpos, currentpos.vadd(new CANNON.Vec3(0, -2, 0)), raycastOptions, result);
        this.grounded = result.hasHit;

        let velocity = null;
        if (this.grounded) {
            velocity = this.body.velocity;
            velocity.x *= dampingFactor;
            velocity.z *= dampingFactor;
            this.prevVel = velocity;
        }
        else {
            velocity = this.prevVel;
        }

        this.body.velocity = velocity;


        this.engine.camera.position.copy(currentpos.vadd(new CANNON.Vec3(0, 1, 0)));
    }
    
}
