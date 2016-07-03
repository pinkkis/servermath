'use strict';

const Quaternion = require('./Quaternion');
const Matrix4 = require('./Matrix4');
const Euler = require('./Euler');
const Smath = require('./Smath');

class Vector3 {
	constructor(x, y, z) {

		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;

	}

	set(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	setScalar(scalar) {
		this.x = scalar;
		this.y = scalar;
		this.z = scalar;

		return this;
	}

	setX(x) {
		this.x = x;

		return this;
	}

	setY(y) {
		this.y = y;

		return this;
	}

	setZ(z) {
		this.z = z;

		return this;
	}

	setComponent(index, value) {
		switch (index) {
			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error('index is out of range: ' + index);
		}
	}

	getComponent(index) {
		switch (index) {
			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error('index is out of range: ' + index);
		}
	}

	clone() {
		return new Vector3(this.x, this.y, this.z);
	}

	copy(v) {
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;
	}

	addScalar(s) {
		this.x += s;
		this.y += s;
		this.z += s;

		return this;
	}

	addVectors(a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;
	}

	addScaledVector(v, s) {
		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;

		return this;
	}

	sub(v) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;
	}

	subScalar(s) {
		this.x -= s;
		this.y -= s;
		this.z -= s;

		return this;
	}

	subVectors(a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;
	}

	multiply(v) {
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;
	}

	multiplyScalar(scalar) {
		if (isFinite(scalar)) {
			this.x *= scalar;
			this.y *= scalar;
			this.z *= scalar;
		} else {
			this.x = 0;
			this.y = 0;
			this.z = 0;
		}

		return this;
	}

	multiplyVectors(a, b) {
		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;
	}

	applyEuler(euler) {
		if (euler instanceof Euler === false) {
			console.error('THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.');
		}

		let quaternion = new Quaternion();

		return this.applyQuaternion(quaternion.setFromEuler(euler));
	}

	pplyAxisAngle(axis, angle) {
		let quaternion = new Quaternion();

		return this.applyQuaternion(quaternion.setFromAxisAngle(axis, angle));
	}

	applyMatrix3(m) {
		let x = this.x, y = this.y, z = this.z;
		let e = m.elements;

		this.x = e[0] * x + e[3] * y + e[6] * z;
		this.y = e[1] * x + e[4] * y + e[7] * z;
		this.z = e[2] * x + e[5] * y + e[8] * z;

		return this;
	}

	applyMatrix4(m) {
		// input: THREE.Matrix4 affine matrix
		let x = this.x, y = this.y, z = this.z;
		let e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
		this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
		this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

		return this;
	}

	applyProjection(m) {
		// input: THREE.Matrix4 projection matrix
		let x = this.x, y = this.y, z = this.z;
		let e = m.elements;
		let d = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]); // perspective divide

		this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * d;
		this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * d;
		this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * d;

		return this;
	}

	applyQuaternion(q) {
		let x = this.x, y = this.y, z = this.z;
		let qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		// calculate quat * vector
		let ix = qw * x + qy * z - qz * y;
		let iy = qw * y + qz * x - qx * z;
		let iz = qw * z + qx * y - qy * x;
		let iw = - qx * x - qy * y - qz * z;

		// calculate result * inverse quat
		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

		return this;
	}

	project(camera) {
		let matrix = new Matrix4();

		matrix.multiplyMatrices(camera.projectionMatrix, matrix.getInverse(camera.matrixWorld));
		return this.applyProjection(matrix);
	}

	unproject(camera) {
		let matrix = new Matrix4();

		matrix.multiplyMatrices(camera.matrixWorld, matrix.getInverse(camera.projectionMatrix));
		return this.applyProjection(matrix);
	}

	transformDirection(m) {
		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction
		let x = this.x, y = this.y, z = this.z;
		let e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8] * z;
		this.y = e[1] * x + e[5] * y + e[9] * z;
		this.z = e[2] * x + e[6] * y + e[10] * z;

		return this.normalize();
	}

	divide(v) {
		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;
	}

	divideScalar(scalar) {
		return this.multiplyScalar(1 / scalar);
	}

	min(v) {
		this.x = Math.min(this.x, v.x);
		this.y = Math.min(this.y, v.y);
		this.z = Math.min(this.z, v.z);

		return this;
	}

	max(v) {
		this.x = Math.max(this.x, v.x);
		this.y = Math.max(this.y, v.y);
		this.z = Math.max(this.z, v.z);

		return this;
	}

	clamp(min, max) {
		// This function assumes min < max, if this assumption isn't true it will not operate correctly
		this.x = Math.max(min.x, Math.min(max.x, this.x));
		this.y = Math.max(min.y, Math.min(max.y, this.y));
		this.z = Math.max(min.z, Math.min(max.z, this.z));

		return this;
	}

	clampScalar(minVal, maxVal) {
		let min = new Vector3();
		let max = new Vector3();

		min.set(minVal, minVal, minVal);
		max.set(maxVal, maxVal, maxVal);

		return this.clamp(min, max);
	}

	clampLength(min, max) {
		let length = this.length();

		return this.multiplyScalar(Math.max(min, Math.min(max, length)) / length);
	}

	floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		this.z = Math.floor(this.z);

		return this;
	}

	ceil() {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		this.z = Math.ceil(this.z);

		return this;
	}

	round() {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		this.z = Math.round(this.z);

		return this;
	}

	roundToZero() {
		this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
		this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
		this.z = (this.z < 0) ? Math.ceil(this.z) : Math.floor(this.z);

		return this;
	}

	negate() {
		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;
	}

	dot(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	lengthSq() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	lengthManhattan() {
		return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
	}

	normalize() {
		return this.divideScalar(this.length());
	}

	setLength(length) {
		return this.multiplyScalar(length / this.length());
	}

	lerp(v, alpha) {
		this.x += (v.x - this.x) * alpha;
		this.y += (v.y - this.y) * alpha;
		this.z += (v.z - this.z) * alpha;

		return this;
	}

	lerpVectors(v1, v2, alpha) {
		return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
	}

	cross(v) {
		let x = this.x, y = this.y, z = this.z;

		this.x = y * v.z - z * v.y;
		this.y = z * v.x - x * v.z;
		this.z = x * v.y - y * v.x;

		return this;
	}

	crossVectors(a, b) {
		let ax = a.x, ay = a.y, az = a.z;
		let bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;
	}

	projectOnVector(vector) {
		let scalar = vector.dot(this) / vector.lengthSq();

		return this.copy(vector).multiplyScalar(scalar);
	}

	projectOnPlane(planeNormal) {
		let v1 = new Vector3();

		v1.copy(this).projectOnVector(planeNormal);

		return this.sub(v1);
	}

	reflect(normal) {
		// reflect incident vector off plane orthogonal to normal
		// normal is assumed to have unit length
		let v1 = new Vector3();

		return this.sub(v1.copy(normal).multiplyScalar(2 * this.dot(normal)));
	}

	angleTo(v) {
		let theta = this.dot(v) / (Math.sqrt(this.lengthSq() * v.lengthSq()));

		// clamp, to handle numerical problems
		return Math.acos(Smath.clamp(theta, - 1, 1));
	}

	distanceTo(v) {
		return Math.sqrt(this.distanceToSquared(v));
	}

	distanceToSquared(v) {
		let dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;
	}

	setFromSpherical(s) {
		let sinPhiRadius = Math.sin(s.phi) * s.radius;

		this.x = sinPhiRadius * Math.sin(s.theta);
		this.y = Math.cos(s.phi) * s.radius;
		this.z = sinPhiRadius * Math.cos(s.theta);

		return this;
	}

	setFromMatrixPosition(m) {
		return this.setFromMatrixColumn(m, 3);
	}

	setFromMatrixScale(m) {
		let sx = this.setFromMatrixColumn(m, 0).length();
		let sy = this.setFromMatrixColumn(m, 1).length();
		let sz = this.setFromMatrixColumn(m, 2).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;
	}

	setFromMatrixColumn(m, index) {
		return this.fromArray(m.elements, index * 4);
	}

	equals(v) {
		return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z));
	}

	fromArray(array, offset) {
		if (offset === undefined) offset = 0;

		this.x = array[offset];
		this.y = array[offset + 1];
		this.z = array[offset + 2];

		return this;
	}

	toArray(array, offset) {
		if (array === undefined) array = [];
		if (offset === undefined) offset = 0;

		array[offset] = this.x;
		array[offset + 1] = this.y;
		array[offset + 2] = this.z;

		return array;
	}

	fromAttribute(attribute, index, offset) {
		if (offset === undefined) offset = 0;

		index = index * attribute.itemSize + offset;

		this.x = attribute.array[index];
		this.y = attribute.array[index + 1];
		this.z = attribute.array[index + 2];

		return this;
	}
}

module.exports = Vector3;