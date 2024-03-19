uniform sampler2D texture1;

    varying vec2 vUv;

    void main() {
        gl_FragColor = vec4(vec3(pow(gl_FragCoord.z, 50.0)),1);
    }