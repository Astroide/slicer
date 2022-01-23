import { parseObj } from './objparser.js';
import { mat4 } from './node_modules/gl-matrix/esm/index.js';
import { Ray } from './ray.js';
import { Vector } from './vector.js';

/** @type {HTMLInputElement} */
const fileInput = document.getElementById('file');
fileInput.addEventListener('change', e => {
    let file = fileInput.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = e => {
        let text = reader.result;
        process(`data:text/plain;base64,${btoa(text)}`);
    };
    reader.onerror = e => {
        console.error(e);
    };
    reader.readAsText(file);
});

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('input');
const gl = canvas.getContext('webgl', { alpha: false });
let useWebGL = true;
if (!gl) {
    useWebGL = false;
    console.error('WebGL is not available. Previews will be disabled.');
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 */
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    throw gl.getShaderInfoLog(shader);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        throw gl.getProgramInfoLog(program);
    }
    return program;
}

const vertexShaderSource = `
#pragma vscode_glsllint_stage: vert
attribute vec4 a_position;
attribute vec4 a_normal;
uniform mat4 u_matrix;
varying vec4 v_normal;

void main() {
    gl_Position = u_matrix * a_position;
    v_normal = a_normal;
}
`;
const fragmentShaderSource = `
#pragma vscode_glsllint_stage: frag
precision mediump float;
uniform vec3 u_light;
varying vec4 v_normal;

void main() {
    vec3 light = normalize(u_light);
    vec3 normal = normalize(v_normal.xyz);
    float diffuse = max(dot(light, normal), 0.0) + 0.1;
    vec4 color = vec4(normal, 0.0) * 0.5 + 0.5;
    gl_FragColor = vec4(color.xyz * diffuse, 1.0);
    // gl_FragColor = vec4(diffuse, diffuse, diffuse, 1.0);
}
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);
const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
const normalAttributeLocation = gl.getAttribLocation(program, 'a_normal');
const matrixUniformLocation = gl.getUniformLocation(program, 'u_matrix');
const lightUniformLocation = gl.getUniformLocation(program, 'u_light');

gl.useProgram(program);
gl.uniform3f(lightUniformLocation, 0, 3, -10);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.DEPTH_TEST);
// gl.enable(gl.CULL_FACE);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

function horizontalVerticalDistanceToXYZ(h, v, d) {
    let x, y, z;
    x = d * -Math.sin(h);
    z = d * -Math.cos(h);
    y = d * Math.sin(v);
    x *= Math.cos(v);
    z *= Math.cos(v);
    return [x, y, z];
}

let currentMesh = null;
let view = [0, 0, 2];
let pitch = 0;
let yaw = 0;

function draw() {
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();

    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, null);
    mat4.translate(viewMatrix, viewMatrix, view);
    mat4.rotateY(viewMatrix, viewMatrix, yaw);
    mat4.rotateX(viewMatrix, viewMatrix, pitch);
    mat4.invert(viewMatrix, viewMatrix);
    // mat4.lookAt(viewMatrix, view, [0, 0, 0], [0, 1, 0]);

    const resultMatrix = mat4.create();
    mat4.multiply(resultMatrix, projectionMatrix, viewMatrix);
    gl.uniformMatrix4fv(matrixUniformLocation, false, resultMatrix);
    gl.uniform3f(lightUniformLocation, view[0], view[1], view[2]);
    gl.clearColor(50 / 255, 168 / 255, 227 / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    currentMesh.draw(gl, positionAttributeLocation, normalAttributeLocation);
}
let w = false;
let s = false;
let a = false;
let d = false;
let q = false;
let e = false;
addEventListener('keydown', event => {
    let key = event.key.toLowerCase();
    if (key == 'w') {
        w = true;
    } else if (key == 's') {
        s = true;
    } else if (key == 'a') {
        a = true;
    } else if (key == 'd') {
        d = true;
    } else if (key == 'q') {
        q = true;
    } else if (key == 'e') {
        e = true;
    }
    console.log(`e ${e ? 'on' : 'off'}`);
});
addEventListener('keyup', event => {
    let key = event.key.toLowerCase();
    if (key == 'w') {
        w = false;
    } else if (key == 's') {
        s = false;
    } else if (key == 'a') {
        a = false;
    } else if (key == 'd') {
        d = false;
    } else if (key == 'q') {
        q = false;
    } else if (key == 'e') {
        e = false;
    }
    console.log(`e ${e ? 'on' : 'off'}`);
});
let lastTime = Date.now();
function drawLoop() {
    let now = Date.now();
    let delta = now - lastTime;
    lastTime = now;
    let distance = delta / 1000 * 1.5;
    if (w) {
        let [x, y, z] = horizontalVerticalDistanceToXYZ(yaw, pitch, distance);
        view[0] += x;
        view[1] += y;
        view[2] += z;
    }
    if (s) {
        let [x, y, z] = horizontalVerticalDistanceToXYZ(yaw + Math.PI, pitch, distance);
        view[0] += x;
        view[1] += y;
        view[2] += z;
    }
    if (d) {
        let [x, y, z] = horizontalVerticalDistanceToXYZ(yaw + Math.PI * 1.5, pitch, distance);
        view[0] += x;
        view[1] += y;
        view[2] += z;
    }
    if (a) {
        let [x, y, z] = horizontalVerticalDistanceToXYZ(yaw + Math.PI * 0.5, pitch, distance);
        view[0] += x;
        view[1] += y;
        view[2] += z;
    }
    if (q) {
        let [x, y, z] = horizontalVerticalDistanceToXYZ(yaw, pitch - Math.PI / 2, distance);
        view[0] += x;
        view[1] += y;
        view[2] += z;
    }
    if (e) {
        let [x, y, z] = horizontalVerticalDistanceToXYZ(yaw, pitch + Math.PI / 2, distance);
        view[0] += x;
        view[1] += y;
        view[2] += z;
    }
    draw();
    requestAnimationFrame(drawLoop);
}

canvas.addEventListener('click', e => {
    canvas.requestPointerLock();
});

addEventListener('mousemove', e => {
    if (document.pointerLockElement) {
        yaw -= e.movementX / 100;
        pitch -= e.movementY / 100;
        if (pitch < -Math.PI / 2) {
            pitch = -Math.PI / 2;
        }
        if (pitch > Math.PI / 2) {
            pitch = Math.PI / 2;
        }
    }
});
function process(url) {
    return new Promise(resolve => {
        parseObj(url).then(mesh => {
            console.log('mesh', mesh);
            let ray = new Ray(new Vector(0.01, 5, 0), new Vector(0, -1, 0), mesh, 10);
            // ray.trace();
            console.log('ray', ray);
            if (useWebGL) {
                currentMesh = mesh;
                view = [0, 3, -10];
                resolve();
                console.log('done');
            }
        });
    });
}
process('./box.obj').then(() => {
    lastTime = Date.now();
    drawLoop();
});