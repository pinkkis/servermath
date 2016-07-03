'use strict';

const Vector3 = require('./Vector3');
const Smath = require('./Smath');

class Line3 {
	constructor(start, end) {
		this.start = (start !== undefined) ? start : new Vector3();
		this.end = (end !== undefined) ? end : new Vector3();
	}

	set(start, end) {
		this.start.copy(start);
		this.end.copy(end);

		return this;
	}

	clone() {
		let clone = Object.create(this);
		return clone.copy(this);
	}

	copy(line) {
		this.start.copy(line.start);
		this.end.copy(line.end);

		return this;
	}

	center(optionalTarget) {
		let result = optionalTarget || new Vector3();
		return result.addVectors(this.start, this.end).multiplyScalar(0.5);
	}

	delta(optionalTarget) {
		let result = optionalTarget || new Vector3();
		return result.subVectors(this.end, this.start);
	}

	distanceSq() {
		return this.start.distanceToSquared(this.end);
	}

	distance() {
		return this.start.distanceTo(this.end);
	}

	at(t, optionalTarget) {
		let result = optionalTarget || new Vector3();
		return this.delta(result).multiplyScalar(t).add(this.start);
	}

	closestPointToPointParameter(point, clampToLine) {
		let startP = new Vector3();
		let startEnd = new Vector3();

		startP.subVectors(point, this.start);
		startEnd.subVectors(this.end, this.start);

		let startEnd2 = startEnd.dot(startEnd);
		let startEnd_startP = startEnd.dot(startP);
		let t = startEnd_startP / startEnd2;

		if (clampToLine) {
			t = Smath.clamp(t, 0, 1);
		}

		return t;
	}

	closestPointToPoint(point, clampToLine, optionalTarget) {
		let t = this.closestPointToPointParameter(point, clampToLine);

		let result = optionalTarget || new Vector3();

		return this.delta(result).multiplyScalar(t).add(this.start);
	}

	applyMatrix4(matrix) {
		this.start.applyMatrix4(matrix);
		this.end.applyMatrix4(matrix);

		return this;
	}

	equals(line) {
		return line.start.equals(this.start) && line.end.equals(this.end);
	}
}

module.exports = Line3;