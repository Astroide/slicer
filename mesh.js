import { mat4 } from './node_modules/gl-matrix/esm/index.js';
export class Mesh {
    constructor(vertices, faces, normals) {
        this.vertices = vertices;
        this.faces = faces;
        this.normals = normals;
        this.glData = {
            dataBuffer: null,
            dataFloat32Array: null,
            initialized: false
        };
    }

    /**
     * @param {WebGLRenderingContext} gl
     * @param {GLuint} vertexPositionAttribute
     * @param {GLuint} vertexNormalAttribute
     */
    draw(gl, vertexPositionAttribute, vertexNormalAttribute) {
        if (!this.glData.initialized) {
            this.glData.initialized = true;
            this.glData.dataBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glData.dataBuffer);
            this.glData.dataFloat32Array = new Float32Array(this.faces.length * 6 * 3);
            for (let i = 0; i < this.faces.length; i++) {
                for (let j = 0; j < 3; j++) {
                    let vertex = this.faces[i].vertices[j];
                    let normal = this.faces[i].normals[j];
                    this.glData.dataFloat32Array[i * 6 * 3 + j * 6 + 0] = vertex.x;
                    this.glData.dataFloat32Array[i * 6 * 3 + j * 6 + 1] = vertex.y;
                    this.glData.dataFloat32Array[i * 6 * 3 + j * 6 + 2] = vertex.z;
                    this.glData.dataFloat32Array[i * 6 * 3 + j * 6 + 3] = normal.x;
                    this.glData.dataFloat32Array[i * 6 * 3 + j * 6 + 4] = normal.y;
                    this.glData.dataFloat32Array[i * 6 * 3 + j * 6 + 5] = normal.z;
                }
            }
            gl.bufferData(gl.ARRAY_BUFFER, this.glData.dataFloat32Array, gl.STATIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glData.dataBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 6 * 3 * 4, 0);
        gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 6 * 3 * 4, 3 * 4);
        gl.drawArrays(gl.TRIANGLES, 0, this.faces.length * 3);
    }
}