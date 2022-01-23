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
    gl_FragColor = vec4(diffuse, diffuse, diffuse, 1.0);
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

let currentMesh = null;
let view = [0, 3, -10];

function draw() {
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();

    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    mat4.lookAt(viewMatrix, view, [0, 0, 0], [0, 1, 0]);

    const resultMatrix = mat4.create();
    mat4.multiply(resultMatrix, projectionMatrix, viewMatrix);
    gl.uniformMatrix4fv(matrixUniformLocation, false, resultMatrix);
    gl.clearColor(50 / 255, 168 / 255, 227 / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    currentMesh.draw(gl, positionAttributeLocation, normalAttributeLocation);
}

addEventListener('keydown', e => {
    let key = e.key.toLowerCase();
    if (key == 'w') {
        view[2] += 1;
    } else if (key == 's') {
        view[2] -= 1;
    } else if (key == 'a') {
        view[0] -= 1;
    } else if (key == 'd') {
        view[0] += 1;
    } else if (key == 'q') {
        view[1] -= 1;
    } else if (key == 'e') {
        view[1] += 1;
    }
    draw();
});
function process(url) {
    parseObj(url).then(mesh => {
        console.log('mesh', mesh);
        let ray = new Ray(new Vector(0.01, 5, 0), new Vector(0, -1, 0), mesh, 10);
        // ray.trace();
        console.log('ray', ray);
        if (useWebGL) {
            currentMesh = mesh;
            view = [0, 3, -10];
            draw();
            console.log('done');
        }
    });
}
process('./box.obj');