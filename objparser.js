import { Vector } from './vector.js';
import { Mesh } from './mesh.js';
export async function parseObj(url) {
    let response = await fetch(url);
    let text = await response.text();
    let lines = text.split('\n');
    let vertices = [];
    let faces = [];
    let normals = [];
    for (let currentLineNumber = 0; currentLineNumber < lines.length; currentLineNumber++) {
        let line = lines[currentLineNumber];
        line = line.trim();
        if (line.startsWith('#')) {
            continue;
        }

        let parts = line.split(' ');
        if (parts[0] === 'v') {
            vertices.push(new Vector(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])));
        } else if (parts[0] === 'f') {
            let face = [];
            let faceNormals = [];
            for (let i = 1; i < parts.length; i++) {
                let indices = parts[i].split('/');
                let vertexIndex = parseInt(indices[0]) - 1;
                let normalIndex = parseInt(indices[2]) - 1;
                if (normalIndex > normals.length) {
                    console.warn('[objparser] ' + url + ':' + currentLineNumber + ' Normal index out of bounds: ' + normalIndex + ' (max: ' + normals.length + ')');
                }
                if (vertexIndex > vertices.length) {
                    console.warn('[objparser] ' + url + ':' + currentLineNumber + ' Vertex index out of bounds: ' + vertexIndex + ' (max: ' + vertices.length + ')');
                }
                face.push(vertices[vertexIndex]);
                faceNormals.push(normals[normalIndex]);
            }
            faces.push({
                vertices: face,
                normals: faceNormals
            });
        } else if (parts[0] === 'vn') {
            let normal = new Vector(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            normals.push(normal.normalize());
        } else {
            console.warn('[objparser] ' + url + ':' + currentLineNumber + ' Unsupported declaration: ' + parts[0]);
        }
    }
    let mesh = new Mesh(vertices, faces, normals);
    mesh.draw(null, 0, 0);
    return mesh;
}