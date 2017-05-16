
class Camera {
	constructor(fov, aspect, near, far) {
		this.viewMat = new Matrix4();
		this.projMat = new Matrix4();
		this.fovy = fov;
		this.aspect = aspect
		this.near = near;
		this.far = far;
		this.viewMat.setLookAt(0, 0, 0, 0, 1, 0, 0, 0, 1);
		this.projMat.setPerspective(fov, aspect, near, far);
		this.position = new Float32Array([0, 0, 0]);
		this.rotation = new Quaternion(0, 0, 0, 1);
		this.up = new Float32Array([0, 0, 1]);
		this.forward = new Float32Array([0, 1, 0]);
		this.right = new Float32Array([1, 0, 0]);
	}
	setPosition(pos) {
		this.position[0] = pos[0];
		this.position[1] = pos[1];
		this.position[2] = pos[2];
		this.updateView();
	}

	translate(vec) {
		this.position[0] += vec[0]*this.right[0] + vec[1]*this.forward[0] + vec[2]*this.up[0];
		this.position[1] += vec[0]*this.right[1] + vec[1]*this.forward[1] + vec[2]*this.up[1];
		this.position[2] += vec[0]*this.right[2] + vec[1]*this.forward[2] + vec[2]*this.up[2];
		this.updateView();
	}

	setRotation(angle, x, y, z) {
		this.forward[0] = 0;
		this.forward[1] = 1;
		this.forward[2] = 0;
		this.up[0] = 0;
		this.up[1] = 0;
		this.up[2] = 1;
		this.right[0] = 1;
		this.right[1] = 0;
		this.right[2] = 0;
		this.rotation.set(0, 0, 0, 1);

		this.rotate(angle, x, y, z);
	}

	rotate(angle, x, y, z) {

		var newUp = new Vector3(this.up);
		var newFoward = new Vector3(this.forward);
		var newRight = new Vector3(this.right);

		newUp.normalize();
		newFoward.normalize();
		newRight.normalize();

		var quat = new Quaternion();
		quat.setFromAxisAngle(x, y, z, angle);
		quat.normalize();

		newUp = quat.multiplyVector3(newUp);
		newUp.normalize();

		this.up[0] = newUp.elements[0];
		this.up[1] = newUp.elements[1];
		this.up[2] = newUp.elements[2];

		newFoward = quat.multiplyVector3(newFoward);
		newFoward.normalize()

		this.forward[0] = newFoward.elements[0];
		this.forward[1] = newFoward.elements[1];
		this.forward[2] = newFoward.elements[2];

		newRight = quat.multiplyVector3(newRight);
		newRight.normalize();

		this.right[0] = newRight.elements[0];
		this.right[1] = newRight.elements[1];
		this.right[2] = newRight.elements[2];

		this.rotation.multiply(quat, this.rotation);

		this.rotation.normalize();



		this.updateView();
	}

	updateView() {
		this.viewMat.setLookAt(this.position[0], this.position[1], this.position[2],

			this.position[0] + this.forward[0],
			this.position[1] + this.forward[1], 
			this.position[2] + this.forward[2],

			this.up[0], this.up[1], this.up[2]);
	}

}


var Controls = new class {
	constructor() {
		this.linSpeed = 9.0;
		this.angSpeed = 70.0;
		this.maxAngle = 90.0;
		this.camAngles = new Float32Array([0, 0, 0]);
	}
	updateCamera(Camera, Keys, dt) {
		var dir = [0.0, 0.0, 0.0];
		if(Keys.keyboard['w'].pressed) {
			dir[1] += 1.0;
		}
		if(Keys.keyboard['s'].pressed) {
			dir[1] -= 1.0;
		}
		if(Keys.keyboard['a'].pressed) {
			dir[0] -= 1.0;
		}
		if(Keys.keyboard['d'].pressed) {
			dir[0] += 1.0;
		}
		if(Keys.keyboard['e'].pressed) {
			dir[2] += 1.0;
		}
		if(Keys.keyboard['q'].pressed) {
			dir[2] -= 1.0;
		}
		if(dir[0]+dir[1]+dir[2] != 0.0) {
			var mag = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);
			dir[0] /= mag;
			dir[1] /= mag;
			dir[2] /= mag;
		}

		var speed = this.linSpeed;
		if(Keys.keyboard["shift_l"].pressed) {
			speed *= 4.0;
		}

		dir[0] *= speed * dt;
		dir[1] *= speed * dt;
		dir[2] *= speed * dt;

		Camera.translate(dir);

		if(Keys.mouse.pressed) {

			var xRot = Keys.mouse.dy*this.angSpeed
			var zRot = -Keys.mouse.dx*this.angSpeed

			if(this.camAngles[0] + xRot > this.maxAngle) {
				xRot = this.maxAngle - this.camAngles[0];
			}
			else if(this.camAngles[0] + xRot < -this.maxAngle) {
				xRot = this.maxAngle + this.camAngles[0];
			}

			this.camAngles[0] += xRot;
			this.camAngles[2] += zRot;


			Camera.setRotation(this.camAngles[2], 0, 0, 1);
			Camera.rotate(this.camAngles[0], Camera.right[0], Camera.right[1], Camera.right[2]);
		}
	}
}();







