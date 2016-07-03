'use strict';

const Box3 = require('./Box3');
const Vector3 = require('./Vector3');

class Sphere {

	constructor(center, radius) {
		this.center = (center !== undefined) ? center : new Vector3();
		this.radius = (radius !== undefined) ? radius : 0;
	}

	set(center, radius) {
		this.center.copy(center);
		this.radius = radius;

		return this;
	}

	setFromPoints(points, optionalCenter) {
		let box = new Box3();
		let center = this.center;

		if (optionalCenter !== undefined) {
			center.copy(optionalCenter);
		} else {
			box.setFromPoints(points).center(center);
		}

		let maxRadiusSq = 0;

		for (let i = 0, il = points.length; i < il; i++) {
			maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
		}

		this.radius = Math.sqrt(maxRadiusSq);

		return this;
	}

	clone() {
		let clone = Object.create(this);
		return clone.copy(this);
	}

	copy(sphere) {
		this.center.copy(sphere.center);
		this.radius = sphere.radius;

		return this;
	}

	empty() {
		return (this.radius <= 0);
	}

	containsPoint(point) {
		return (point.distanceToSquared(this.center) <= (this.radius * this.radius));
	}

	distanceToPoint(point) {
		return (point.distanceTo(this.center) - this.radius);
	}

	intersectsSphere(sphere) {
		let radiusSum = this.radius + sphere.radius;

		return sphere.center.distanceToSquared(this.center) <= (radiusSum * radiusSum);
	}

	intersectsBox(box) {
		return box.intersectsSphere(this);
	}

	intersectsPlane(plane) {
		return Math.abs(this.center.dot(plane.normal) - plane.constant) <= this.radius;
	}

	clampPoint(point, optionalTarget) {
		let deltaLengthSq = this.center.distanceToSquared(point);
		let result = optionalTarget || new Vector3();

		result.copy(point);

		if (deltaLengthSq > (this.radius * this.radius)) {
			result.sub(this.center).normalize();
			result.multiplyScalar(this.radius).add(this.center);
		}

		return result;
	}

	getBoundingBox(optionalTarget) {
		let box = optionalTarget || new Box3();

		box.set(this.center, this.center);
		box.expandByScalar(this.radius);

		return box;
	}

	applyMatrix4(matrix) {
		this.center.applyMatrix4(matrix);
		this.radius = this.radius * matrix.getMaxScaleOnAxis();

		return this;
	}

	translate(offset) {
		this.center.add(offset);

		return this;
	}

	equals(sphere) {
		return sphere.center.equals(this.center) && (sphere.radius === this.radius);
	}
}

module.exports = Sphere;