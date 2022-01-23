import { Vector } from './vector.js';
import { Mesh } from './mesh.js';
export class Ray {
    /**
     * @param {Vector} origin
     * @param {Vector} direction
     * @param {Mesh} mesh
     * @param {number} maxDistance
     */
    constructor(origin, direction, mesh, maxDistance) {
        this.origin = origin;
        this.direction = direction.normalize().multiplyScalar(0.01);
        this.position = origin.addScalar(0);
        this.mesh = mesh;
        this.sqrMaxDistance = maxDistance * maxDistance;
        this.states = [];
        this.state = 'outside';
        this.sides = mesh.faces.map(face => {
            let side = this.origin.getSideOfPlane(face.vertices[0], face.vertices[1], face.vertices[2]);
            return side;
        });
    }

    trace() {
        while (this.origin.sqrDistanceTo(this.position) < this.sqrMaxDistance) {
            this.position = this.position.add(this.direction);
            let sides = this.mesh.faces.map(face => {
                let side = this.position.getSideOfPlane(face.vertices[0], face.vertices[1], face.vertices[2]);
                return side;
            });
            for (let i = 0; i < sides.length; i++) {
                if (this.sides[i] != sides[i]) {
                    let opposite = this.direction.multiplyScalar(-0.1);
                    while (this.position.getSideOfPlane(this.mesh.faces[i].vertices[0], this.mesh.faces[i].vertices[1], this.mesh.faces[i].vertices[2]) != this.sides[i]) {
                        this.position = this.position.add(opposite);
                    }
                    this.position = this.position.add(this.direction.multiplyScalar(0.1));
                    let [v1, v2, v3] = this.mesh.faces[i].vertices;
                    let O = v1;
                    let n = this.mesh.faces[i].normals[0].normalize();
                    let X = v2.substract(v1).normalize();
                    /** @param {Vector} p */
                    function project(p) {
                        let x = (p.substract(O)).dotProduct(X);
                        let y = (p.substract(O)).dotProduct(n.crossProduct(X));
                        return [x, y];
                    }
                    /** @typedef {[number, number]} Vector2 */
                    /**
                     * @param {Vector2} point
                     * @param {Vector2} v1
                     * @param {Vector2} v2
                     * @param {Vector2} v3
                     */
                    function pointInTriangle(point, v1, v2, v3) {
                        /**
                         * @param {Vector2} p1
                         * @param {Vector2} p2
                         * @param {Vector2} p3
                         */
                        function sign(p1, p2, p3) {
                            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
                        }

                        let d1 = sign(point, v1, v2);
                        let d2 = sign(point, v2, v3);
                        let d3 = sign(point, v3, v1);
                        let hasNegative = (d1 < 0) || (d2 < 0) || (d3 < 0);
                        let hasPositive = (d1 > 0) || (d2 > 0) || (d3 > 0);
                        return !(hasNegative && hasPositive);
                    }
                    let projectedPosition = project(this.position);
                    let projectedV1 = project(v1);
                    let projectedV2 = project(v2);
                    let projectedV3 = project(v3);
                    if (pointInTriangle(projectedPosition, projectedV1, projectedV2, projectedV3)) {
                        this.state = this.state == 'outside' ? 'inside' : 'outside';
                        let distanceFromOrigin = this.position.distanceTo(this.origin);
                        this.states.push([distanceFromOrigin, this.state]);
                    }
                    console.log('meow');
                }
            }
            this.sides = sides;
        }
        return this.states;
    }
}