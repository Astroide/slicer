export class Vector {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    constructor(x, y, z) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
        /** @type {number} */
        this.z = z;
    }

    /** @param {Vector} v */
    multiply(v) {
        return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
    }

    /** @param {Vector} v */
    divide(v) {
        return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
    }

    /** @param {Vector} v */
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    /** @param {Vector} v */
    substract(v) {
        return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    /** @param {number} s */
    addScalar(s) {
        return new Vector(this.x + s, this.y + s, this.z + s);
    }

    /** @param {number} s */
    substractScalar(s) {
        return new Vector(this.x - s, this.y - s, this.z - s);
    }

    /** @param {number} s */
    multiplyScalar(s) {
        return new Vector(this.x * s, this.y * s, this.z * s);
    }

    /** @param {number} s */
    divideScalar(s) {
        return new Vector(this.x / s, this.y / s, this.z / s);
    }

    /** @param {Vector} other */
    dotProduct(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        return this.divideScalar(this.magnitude());
    }

    /** @param {number} x */
    setMagnitude(x) {
        return this.normalize().multiplyScalar(x);
    }

    sqrMagnitude() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    setSqrMagnitude(x) {
        return this.normalize().multiplyScalar(Math.sqrt(x));
    }

    static random() {
        return new Vector(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    }

    negate() {
        return new Vector(-this.x, -this.y, -this.z);
    }

    reflect(normal) {
        return this.substract(normal.multiplyScalar(2 * this.dotProduct(normal)));
    }

    crossProduct(other) {
        return new Vector(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    }

    /**
     * @param {Vector} vec1
     * @param {Vector} vec2
     * @param {Vector} vec3
     */
    getSideOfPlane(vec1, vec2, vec3) {
        let a = vec1;
        let b = vec2;
        let c = vec3;
        let x = this;
        let b_ = b.substract(a);
        let c_ = c.substract(a);
        let x_ = x.substract(a);
        let det = b_.x * (c_.y * x_.z - c_.z * x_.y) - b_.y * (c_.x * x_.z - c_.z * x_.x) + b_.z * (c_.x * x_.y - c_.y * x_.x);
        return det < 0 ? -1 : det > 0 ? 1 : 0;
    }
}