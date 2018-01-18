

class rayGeom {
	constructor(material) {
		if(this.constructor === rayGeom) {
			throw new TypeError('Abstract class "rayGeom" cannot be instantiated directly.');
		}
		else {
			this.material = material;
			this.world2model = mat4.create();
			this.lightMask = 0xff;
			this.castShadows = true;
		}
	}

	identity() {
		mat4.identity(this.world2model);
	}

	translate(vec) {
		var temp = mat4.create();
		mat4.translate(temp, temp, [-vec[0], -vec[1], -vec[2]]);
		mat4.multiply(this.world2model, temp, this.world2model);
	}

	scale(vec) {
		var temp = mat4.create();
		mat4.scale(temp, temp, [1/vec[0], 1/vec[1], 1/vec[2]]);
		mat4.multiply(this.world2model, temp, this.world2model);
	}

	rotate(angle, axis) {
		var temp = mat4.create();
		mat4.rotate(temp, temp, -angle*Math.PI/180, axis);
		mat4.multiply(this.world2model, temp, this.world2model);
	}
}

class rayGrid extends rayGeom {
	constructor(material) {
		super(material);
		this.zGrid = 0;
		this.xgap = 1;
		this.ygap = 1;
		this.lineWidth = 0.1;
		this.lineColor = vec4.fromValues(0.1, 0.5, 0.1, 1);
		this.gapColor = vec4.fromValues(0.9, 0.9, 0.9, 1);
	}

	findHit(inRay) {
		var ray = new CRay();
		vec4.transformMat4(ray.orig, inRay.orig, this.world2model);
		vec4.transformMat4(ray.dir, inRay.dir, this.world2model);

		if(ray.dir[2] == 0) {
			return -1;
		}

		var t = (this.zGrid - ray.orig[2])/(ray.dir[2]);

		if(t <= 0) {
			return -1;
		}

		var hitList = new CHitList();

		var hit = new CHit();
		hit.castShadows = this.castShadows;
		hit.ray = inRay;

		hit.texCoord[0] = (1 + (ray.orig[0] + ray.dir[0]*t)%this.xgap)%this.xgap;
		hit.texCoord[1] = (1 + (ray.orig[1] + ray.dir[1]*t)%this.ygap)%this.ygap;

		vec4.scale(hit.position, inRay.dir, t);
		vec4.add(hit.position, hit.position, inRay.orig);

		var norm = Float32Array.from([0, 0, 1, 0]);
		var invTrans = mat4.create();

		mat4.transpose(invTrans, this.world2model);

		vec4.transformMat4(hit.normal, norm, invTrans);

		hit.material = this.material;

		hit.t = t;
		hit.world2model = this.world2model;

		hitList.addHit(hit);
		return hitList;



	}
}

class raySphere extends rayGeom {
	constructor(material) {
		super(material);
	}

	findHit(inRay) {
		var ray = new CRay();
		vec4.transformMat4(ray.orig, inRay.orig, this.world2model);
		vec4.transformMat4(ray.dir, inRay.dir, this.world2model);

		var diff = vec3.create();

		vec3.scale(diff, ray.orig, -1);

		var l = vec3.length(ray.dir);

		var t0 = vec3.dot(diff, ray.dir)/l/l;

		vec3.scale(diff, ray.dir, t0);
		vec3.add(diff, ray.orig, diff);

		var dist = vec3.length(diff);

		if(dist > 1) {
			return -1;
		}

		var tDiff = Math.sin(Math.acos(dist))/vec3.length(ray.dir);

		// t0 *= l/vec3.length(inRay.dir);

		var t1 = t0 - tDiff;

		var t2 = t0 + tDiff;

		if(t1 < 0 && t2 < 0) {
			return -1;
		}

		// var tMod = l/vec3.length(inRay.dir);

		// t1 *= tMod;
		// t2 *= tMod;

		var hitList = new CHitList();

		var hit = new CHit();
		hit.castShadows = this.castShadows;
		hit.ray = inRay;
		hit.material = this.material;
		vec4.scale(hit.position, inRay.dir, t1 < t2 ? t1 : t2);
		vec4.add(hit.position, hit.position, inRay.orig);

		vec4.scale(hit.normal, ray.dir, t1 < t2 ? t1 : t2);
		vec4.add(hit.normal, hit.normal, ray.orig);
		hit.normal[3] = 0;
		vec3.normalize(hit.normal, hit.normal);

		var normxy = vec2.create();
		vec2.copy(normxy, hit.normal);
		vec2.normalize(normxy, normxy);

		var angle = Math.acos(normxy[1]);
		if(hit.normal[0] < 0) {
			angle = 2*Math.PI-angle;
		}
		hit.texCoord[0] = angle/(2*Math.PI);
		angle = Math.acos(hit.normal[2]);
		hit.texCoord[1] = angle/Math.PI;

		var invTrans = mat4.create();

		mat4.transpose(invTrans, this.world2model);

		vec4.transformMat4(hit.normal, hit.normal, invTrans);

		vec3.normalize(hit.normal, hit.normal);
		hit.normal[3] = 0;

		mat4.copy(hit.world2model, this.world2model);

		hit.lightMask = this.lightMask;
		hit.t = t1 < t2 ? t1 : t2;

		hitList.addHit(hit);

		hit = new CHit();
		hit.ray = inRay;
		hit.castShadows = this.castShadows;
		hit.material = this.material;
		vec4.scale(hit.position, inRay.dir, t1 >= t2 ? t1 : t2);
		vec4.add(hit.position, hit.position, inRay.orig);

		vec4.scale(hit.normal, ray.dir, t1 >= t2 ? t1 : t2);
		vec4.add(hit.normal, hit.normal, ray.orig);
		hit.normal[3] = 0;
		vec3.normalize(hit.normal, hit.normal);

		var normxy = vec2.create();
		vec2.copy(normxy, hit.normal);
		vec2.normalize(normxy, normxy);

		var angle = Math.acos(normxy[1]);
		if(hit.normal[0] > 0) {
			angle += Math.PI;
		}
		hit.texCoord[0] = angle/(2*Math.PI);
		angle = Math.acos(hit.normal[2]);
		hit.texCoord[1] = angle/Math.PI;


		mat4.transpose(invTrans, this.world2model);

		vec4.transformMat4(hit.normal, hit.normal, invTrans);

		vec3.normalize(hit.normal, hit.normal);
		hit.normal[3] = 0;

		mat4.copy(hit.world2model, this.world2model);

		hit.lightMask = this.lightMask;
		hit.t = t1 >= t2 ? t1 : t2;

		hitList.addHit(hit);

		return hitList;

	}
}


class rayCube extends rayGeom {
	constructor(material) {
		super(material);
	}
	findHit(inRay) {
		var ray = new CRay();
		vec4.transformMat4(ray.orig, inRay.orig, this.world2model);
		vec4.transformMat4(ray.dir, inRay.dir, this.world2model);

		var tNear = -Infinity;
		var tFar = Infinity;
		var nNear;
		var nFar;

		for(var i = 0; i < 3; i++) {
			if(ray.dir[i] == 0) {
				if( ray.orig[i] < -1 || ray.orig[i] > 1 ) {
					return -1;
				}
			}
			else {
				var t0 = (-1-ray.orig[i])/ray.dir[i];
				var t1 = (1-ray.orig[i])/ray.dir[i];
				if(t0 > t1) {
					var t = t0;
					t0 = t1;
					t1 = t;
				}
				if(t0 > tNear) {
					tNear = t0;
					nNear = vec4.create();
					nNear[i] = -Math.sign(ray.dir[i]);
				}
				if(t1 < tFar) {
					tFar = t1;
					nFar = vec4.create();
					nFar[i] = Math.sign(ray.dir[i]);
				}
				if(tNear > tFar || tFar < 0) {
					return -1;
				}
			}
		}
		var hitList = new CHitList();

		var hit = new CHit();
		hit.castShadows = this.castShadows;
		hit.ray = inRay;
		hit.material = this.material;
		vec4.scale(hit.position, inRay.dir, tNear);
		vec4.add(hit.position, hit.position, inRay.orig);

		if(!nNear) {
			console.log(nNear);
		}

		vec4.copy(hit.normal, nNear);

		var invTrans = mat4.create();

		mat4.transpose(invTrans, this.world2model);

		vec4.transformMat4(hit.normal, hit.normal, invTrans);

		vec3.normalize(hit.normal, hit.normal);
		hit.normal[3] = 0;

		mat4.copy(hit.world2model, this.world2model);

		hit.lightMask = this.lightMask;
		hit.t = tNear;

		hitList.addHit(hit);

		hit = new CHit();
		hit.ray = inRay;
		hit.castShadows = this.castShadows;
		hit.material = this.material;
		vec4.scale(hit.position, inRay.dir, tFar);
		vec4.add(hit.position, hit.position, inRay.orig);

		vec4.copy(hit.normal, nFar);

		mat4.transpose(invTrans, this.world2model);

		vec4.transformMat4(hit.normal, hit.normal, invTrans);

		vec3.normalize(hit.normal, hit.normal);
		hit.normal[3] = 0;

		mat4.copy(hit.world2model, this.world2model);

		hit.lightMask = this.lightMask;
		hit.t = tFar;

		hitList.addHit(hit);

		return hitList;

	}
}

class rayCircle extends rayGeom {
	constructor(material) {
		super(material);
	}
	findHit(inRay) {
		var ray = new CRay();
		vec4.transformMat4(ray.orig, inRay.orig, this.world2model);
		vec4.transformMat4(ray.dir, inRay.dir, this.world2model);

		if(ray.dir[2] == 0) {
			return -1;
		}

		var t = (-ray.orig[2])/(ray.dir[2]);

		if(t <= 0) {
			return -1;
		}

		var position = vec4.create();
		vec4.scale(position, ray.dir, t);
		vec4.add(position, position, ray.orig);
		position[3] = 1;

		if(vec2.squaredLength(position) > 1) {
			return -1;
		}


		var hitList = new CHitList();

		var hit = new CHit();
		hit.castShadows = this.castShadows;

		hit.texCoord[0] = (1 + (ray.orig[0] + ray.dir[0]*t)%this.xgap)%this.xgap;
		hit.texCoord[1] = (1 + (ray.orig[1] + ray.dir[1]*t)%this.ygap)%this.ygap;

		// vec4.scale(hit.position, inRay.dir, t);
		// vec4.add(hit.position, hit.position, inRay.orig);
		vec4.scale(hit.position, inRay.dir, t);
		vec4.add(hit.position, hit.position, inRay.orig);

		var norm = Float32Array.from([0, 0, 1, 0]);
		var invTrans = mat4.create();

		mat4.transpose(invTrans, this.world2model);

		vec4.transformMat4(hit.normal, norm, invTrans);

		hit.material = this.material;

		hit.t = t;
		hit.world2model = this.world2model;

		hitList.addHit(hit);
		return hitList;

	}
}

class rayIntersect extends rayGeom {
	constructor(material, obj1, obj2) {
		super(material);
		this.objects = [obj1, obj2];
		this.hits = [];
	}
	findHit(inRay) {
		var ray = new CRay();
		vec4.transformMat4(ray.orig, inRay.orig, this.world2model);
		vec4.transformMat4(ray.dir, inRay.dir, this.world2model);
		this.hits = [];
		for(var i = 0; i < 2; i++) {
			this.hits.push(this.objects[i].findHit(ray));
			if(this.hits[i] == -1) return -1;
			this.hits[i].hits.sort(function(a, b) {
				return a.t - b.t;
			});
		}
		var hitList = new CHitList();
		var prevt = Infinity;
		for(var i = 0; i < this.hits[0].hits.length; i++) {
			var dot = vec3.dot(inRay.dir, this.hits[0].hits[i].normal);
			if(dot > 0) {
				while(this.hits[0].hits[i].t > this.hits[1].hits[0].t + .001) {
					hitList.addHit(this.hits[1].hits.shift());
					if(this.hits[1].hits.length == 0) break;
				}
				if(this.hits[1].hits.length == 0) break;
			}
			else prevt = this.hits[0].hits[i].t;
		}
		prevt = Infinity;
		for(var i = 0; i < this.hits[1].hits.length; i++) {
			var dot = vec3.dot(inRay.dir, this.hits[1].hits[i].normal);
			if(dot > 0) {
				while(this.hits[1].hits[i].t > this.hits[0].hits[0].t + .001) {
					hitList.addHit(this.hits[0].hits.shift());
					if(this.hits[0].hits.length == 0) break;
				}
				if(this.hits[0].hits.length == 0) break;
			}
			else prevt = this.hits[1].hits[i].t;
		}
		for(var i = 0; i < hitList.hits.length; i++) {
			hitList.hits[i].material = this.material;
			hitList.hits[i].world2model = this.world2model;
		}
		return hitList;
	}
}




