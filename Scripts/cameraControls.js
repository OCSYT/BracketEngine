import * as THREE from '../node_modules/three/build/three.module.js';
import { PointerLockControls } from '../node_modules/three/examples/jsm/controls/PointerLockControls.js';

export class CameraControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement || document;

        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
        this.mouseStopped = true;
        this.timer = null; // Initialize timer variable

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.moveSpeed = 5;
        this.rotX = 0;
        this.rotY = 0;
        this.controls = null;
    }

    init() {
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onClick(event) {
        try {
            document.getElementsByTagName("canvas")[0].requestPointerLock();
        }
        catch {

        }
    }

    onMouseMove(event) {


        this.mouseStopped = false; // Mouse is moving
        this.mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this.mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        // Reset timer for detecting mouse stoppage
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.mouseStopped = true; // Mouse stopped moving
        }, 50); // Adjust the timeout value as needed
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
            case ' ':
                this.moveUp = true;
                break;
            case 'Control':
                this.moveDown = true;
                break;
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
            case ' ':
                this.moveUp = false;
                break;
            case 'Control':
                this.moveDown = false;
                break;
        }
    }

    update(deltaTime) {
        console.log(this.moveDown, this.moveUp);
        const sensitivity = 1 * deltaTime; // adjust this to control rotation sensitivity
        const deltaX = (this.mouseX) * sensitivity; // Calculate delta from previous position
        const deltaY = (this.mouseY) * sensitivity;

        // Update camera rotation based on mouse movement
        if (!this.mouseStopped) {
            this.rotY -= deltaX;
            this.rotX -= deltaY;
            this.rotX = THREE.MathUtils.clamp(this.rotX, -90 * Math.PI /180, 90* Math.PI /180);
            const euler = new THREE.Euler(this.rotX, this.rotY, 0, 'YXZ');
            this.camera.quaternion.setFromEuler(euler);
        }

        // Update camera position based on WASD movement
        const moveSpeed = this.moveSpeed * deltaTime; // Adjust movement speed based on delta time
        const direction = new THREE.Vector3();
        direction.z = Number(this.moveBackward) - Number(this.moveForward);
        direction.x = Number(this.moveRight) - Number(this.moveLeft);
        direction.y = Number(this.moveUp) - Number(this.moveDown);
        direction.normalize(); // Normalize the direction vector

        if (direction.x || direction.y ||  direction.z) {
            direction.multiplyScalar(moveSpeed);
            this.camera.translateOnAxis(direction, 1);
        }
    }
}
