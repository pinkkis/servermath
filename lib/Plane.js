'use stict';

const Vector3 = require('./Vector3');

class Plane {
	constructor(normal, constant) {
		this.normal = (normal !== undefined) ? normal : new Vector3(1, 0, 0);
		this.constant = (constant !== undefined) ? constant : 0;
	}

	set(normal, constant) {
		this.normal.copy(normal);
		this.constant = constant;

		return this;
	}

	setComponents(x, y, z, w) {
		this.normal.set(x, y, z);
		this.constant = w;

		return this;
	}

	setFromNormalAndCoplanarPoint(normal, point) {
		this.normal.copy(normal);
		this.constant = - point.dot(this.normal);	// must be this.normal, not normal, as this.normal is normalized

		return this;
	}

	setFromCoplanarPoints(a, b, c) {
		let v1 = new Vector3();
		let v2 = new Vector3();
		let normal = v1.subVectors(c, b).cross(v2.subVectors(a, b)).normalize();

		this.setFromNormalAndCoplanarPoint(normal, a);

		return this;
	}

	clone() {
		let clone = Object.create(this);
		return clone.copy(this);
	}

	copy(plane) {
		this.normal.copy(plane.normal);
		this.constant = plane.constant;

		return this;
	}

	normalize() {
		// Note: will lead to a divide by zero if the plane is invalid.
		let inverseNormalLength = 1.0 / this.normal.length();
		this.normal.multiplyScalar(inverseNormalLength);
		this.constant *= inverseNormalLength;

		return this;
	}

	negate() {
		this.constant *= - 1;
		this.normal.negate();

		return this;
	}

	distanceToPoint(point) {
		return this.normal.dot(point) + this.constant;
	}

	distanceToSphere(sphere) {
		return this.distanceToPoint(sphere.center) - sphere.radius;
	}

	projectPoint(point, optionalTarget) {
		return this.orthoPoint(point, optionalTarget).sub(point).negate();
	}

	orthoPoint(point, optionalTarget) {
		let perpendicularMagnitude = this.distanceToPoint(point);

		let result = optionalTarget || new THREE.Vector3();
		return result.copy(this.normal).multiplyScalar(perpendicularMagnitude);
	}

	intersectLine(line, optionalTarget) {
		let v1 = new Vector3();
		let result = optionalTarget || new Vector3();
		let direction = line.delta(v1);
		let denominator = this.normal.dot(direction);

		if (denominator === 0) {
			// line is coplanar, return origin
			if (this.distanceToPoint(line.start) === 0) {
				return result.copy(line.start);
			}

			// Unsure if this is the correct method to handle this case.
			return undefined;
		}

		let t = - (line.start.dot(this.normal) + this.constant) / denominator;

		if (t < 0 || t > 1) {
			return undefined;
		}

		return result.copy(direction).multiplyScalar(t).add(line.start);
	}

	intersectsLine(line) {
		// Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.
		let startSign = this.distanceToPoint(line.start);
		let endSign = this.distanceToPoint(line.end);

		return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
	}

	intersectsBox(box) {
		return box.intersectsPlane(this);
	}

	intersectsSphere(sphere) {
		return sphere.intersectsPlane(this);
	}

	coplanarPoint(optionalTarget) {
		let result = optionalTarget || new Vector3();
		return result.copy(this.normal).multiplyScalar(- this.constant);
	}

	applyMatrix4(matrix, optionalNormalMatrix) {
		let v1 = new Vector3();
		let m1 = new Matrix3();
		let referencePoint = this.coplanarPoint(v1).applyMatrix4(matrix);

		// transform normal based on theory here:
		// http://www.songho.ca/opengl/gl_normaltransform.html
		let normalMatrix = optionalNormalMatrix || m1.getNormalMatrix(matrix);
		let normal = this.normal.applyMatrix3(normalMatrix).normalize();

		// recalculate constant (like in setFromNormalAndCoplanarPoint)
		this.constant = - referencePoint.dot(normal);

		return this;
	}

	translate(offset) {
		this.constant = this.constant - offset.dot(this.normal);

		return this;
	}

	equals(plane) {
		return plane.normal.equals(this.normal) && (plane.constant === this.constant);
	}
}

module.exports = Plane;