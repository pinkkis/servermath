'use strict';

const Vector3 = require('./Vector3');
const Sphere = require('./Sphere');

class Box3 {
	constructor(min, max) {
		this.min = (min !== undefined) ? min : new Vector3(+ Infinity, + Infinity, + Infinity);
		this.max = (max !== undefined) ? max : new Vector3(- Infinity, - Infinity, - Infinity);
	}

	set(min, max) {
		this.min.copy(min);
		this.max.copy(max);

		return this;
	}

	setFromArray(array) {
		let minX = + Infinity;
		let minY = + Infinity;
		let minZ = + Infinity;

		let maxX = - Infinity;
		let maxY = - Infinity;
		let maxZ = - Infinity;

		for (let i = 0, l = array.length; i < l; i += 3) {
			let x = array[i];
			let y = array[i + 1];
			let z = array[i + 2];

			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (z < minZ) minZ = z;

			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
			if (z > maxZ) maxZ = z;
		}

		this.min.set(minX, minY, minZ);
		this.max.set(maxX, maxY, maxZ);
	}

	setFromPoints(points) {
		this.makeEmpty();

		for (let i = 0, il = points.length; i < il; i++) {
			this.expandByPoint(points[i]);
		}

		return this;
	}

	setFromCenterAndSize(center, size) {
		let v1 = new Vector3();
		let halfSize = v1.copy(size).multiplyScalar(0.5);

		this.min.copy(center).sub(halfSize);
		this.max.copy(center).add(halfSize);

		return this;
	}

	setFromObject(object) {
		// Computes the world-axis-aligned bounding box of an object (including its children),
		// accounting for both the object's, and children's, world transforms
		let v1 = new Vector3();
		let scope = this;

		object.updateMatrixWorld(true);

		this.makeEmpty();

		object.traverse(function (node) {
			let geometry = node.geometry;

			if (geometry !== undefined) {
				if (geometry instanceof Geometry) {
					let vertices = geometry.vertices;

					for (let i = 0, il = vertices.length; i < il; i++) {
						v1.copy(vertices[i]);
						v1.applyMatrix4(node.matrixWorld);

						scope.expandByPoint(v1);
					}
				} else if (geometry instanceof BufferGeometry && geometry.attributes['position'] !== undefined) {
					let positions = geometry.attributes['position'].array;

					for (let i = 0, il = positions.length; i < il; i += 3) {
						v1.fromArray(positions, i);
						v1.applyMatrix4(node.matrixWorld);

						scope.expandByPoint(v1);
					}
				}
			}
		});

		return this;
	}

	clone() {
		let clone = Object.create(this);
		return clone.copy(this);
	}

	copy(box) {
		this.min.copy(box.min);
		this.max.copy(box.max);

		return this;
	}

	makeEmpty() {
		this.min.x = this.min.y = this.min.z = + Infinity;
		this.max.x = this.max.y = this.max.z = - Infinity;

		return this;
	}

	isEmpty() {
		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes
		return (this.max.x < this.min.x) || (this.max.y < this.min.y) || (this.max.z < this.min.z);
	}

	center(optionalTarget) {
		let result = optionalTarget || new Vector3();
		return result.addVectors(this.min, this.max).multiplyScalar(0.5);
	}

	size(optionalTarget) {
		let result = optionalTarget || new Vector3();
		return result.subVectors(this.max, this.min);
	}

	expandByPoint(point) {
		this.min.min(point);
		this.max.max(point);

		return this;
	}

	expandByVector(vector) {
		this.min.sub(vector);
		this.max.add(vector);

		return this;
	}

	expandByScalar(scalar) {
		this.min.addScalar(- scalar);
		this.max.addScalar(scalar);

		return this;
	}

	containsPoint(point) {
		if (point.x < this.min.x || point.x > this.max.x ||
			point.y < this.min.y || point.y > this.max.y ||
			point.z < this.min.z || point.z > this.max.z) {

			return false;
		}

		return true;
	}

	containsBox(box) {
		if ((this.min.x <= box.min.x) && (box.max.x <= this.max.x) &&
			(this.min.y <= box.min.y) && (box.max.y <= this.max.y) &&
			(this.min.z <= box.min.z) && (box.max.z <= this.max.z)) {

			return true;
		}

		return false;
	}

	getParameter(point, optionalTarget) {
		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.
		let result = optionalTarget || new Vector3();

		return result.set(
			(point.x - this.min.x) / (this.max.x - this.min.x),
			(point.y - this.min.y) / (this.max.y - this.min.y),
			(point.z - this.min.z) / (this.max.z - this.min.z)
		);
	}

	intersectsBox(box) {
		// using 6 splitting planes to rule out intersections.
		if (box.max.x < this.min.x || box.min.x > this.max.x ||
			box.max.y < this.min.y || box.min.y > this.max.y ||
			box.max.z < this.min.z || box.min.z > this.max.z) {

			return false;
		}

		return true;
	}

	intersectsSphere(sphere) {
		// Find the point on the AABB closest to the sphere center.
		this.clampPoint(sphere.center, this.closestPoint);

		// If that point is inside the sphere, the AABB and sphere intersect.
		return closestPoint.distanceToSquared(sphere.center) <= (sphere.radius * sphere.radius);
	}

	intersectsPlane(plane) {
		// We compute the minimum and maximum dot product values. If those values
		// are on the same side (back or front) of the plane, then there is no intersection.
		let min, max;

		if (plane.normal.x > 0) {
			min = plane.normal.x * this.min.x;
			max = plane.normal.x * this.max.x;
		} else {
			min = plane.normal.x * this.max.x;
			max = plane.normal.x * this.min.x;
		}

		if (plane.normal.y > 0) {
			min += plane.normal.y * this.min.y;
			max += plane.normal.y * this.max.y;
		} else {
			min += plane.normal.y * this.max.y;
			max += plane.normal.y * this.min.y;
		}

		if (plane.normal.z > 0) {
			min += plane.normal.z * this.min.z;
			max += plane.normal.z * this.max.z;
		} else {
			min += plane.normal.z * this.max.z;
			max += plane.normal.z * this.min.z;
		}

		return (min <= plane.constant && max >= plane.constant);
	}

	clampPoint(point, optionalTarget) {
		let result = optionalTarget || new Vector3();
		return result.copy(point).clamp(this.min, this.max);
	}

	distanceToPoint(point) {
		let v1 = new Vector3();
		let clampedPoint = v1.copy(point).clamp(this.min, this.max);
		return clampedPoint.sub(point).length();
	}

	getBoundingSphere(optionalTarget) {
		let v1 = new Vector3();
		let result = optionalTarget || new Sphere();

		result.center = this.center();
		result.radius = this.size(v1).length() * 0.5;

		return result;
	}

	intersect(box) {
		this.min.max(box.min);
		this.max.min(box.max);

		// ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
		if (this.isEmpty()) this.makeEmpty();

		return this;
	}

	union(box) {
		this.min.min(box.min);
		this.max.max(box.max);

		return this;
	}

	applyMatrix4(matrix) {
		let points = [
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3(),
			new Vector3()
		];
		// transform of empty box is an empty box.
		if (this.isEmpty()) return this;

		// NOTE: I am using a binary pattern to specify all 2^3 combinations below
		points[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(matrix); // 000
		points[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(matrix); // 001
		points[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(matrix); // 010
		points[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(matrix); // 011
		points[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(matrix); // 100
		points[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(matrix); // 101
		points[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(matrix); // 110
		points[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(matrix);	// 111

		this.setFromPoints(points);

		return this;
	}

	translate(offset) {
		this.min.add(offset);
		this.max.add(offset);

		return this;
	}

	equals(box) {
		return box.min.equals(this.min) && box.max.equals(this.max);
	}

}

let closestPoint = new Vector3();

module.exports = Box3;