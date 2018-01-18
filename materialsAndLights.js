var MAX_RECURSE = 3;

class Material {
	constructor(shade) {
		if(shade) {
			this.shade = shade;
		}
	}

	shade(hit, scene, recursions) {
		return this.getColor(hit, scene);
	}

	getColor(hit, scene) {
		if(this.color) {
			return Float32Array.from(this.color);
		}
		else return Float32Array.from([1, .5, .5, 1]);
	}
	sample(hit, scene, recursions) {
		col = this.shade(hit, scene, recursions);
		if(this.absorbtion) {
			vec3.scale(col, col, 1-this.absorbtion);
		}
		return col;
	}
	getNormal(hit, scene) {
		if(this.normMap) {
			return calcNorm(hit.normal, this.getTexture(hit, this.normMap));
		}
		return hit.normal;
	}
	getTexture(hit, tex) {
		var x = Math.round((hit.texCoord[0]%1)*this.texDimX);
		var y = Math.round((hit.texCoord[1]%1)*this.texDimY);
		var ind = (y*this.texDimX + x)*4;
		var col = new Float32Array([tex[ind]/255, tex[ind+1]/255, tex[ind+2]/255, tex[ind+3]/255]);
		return col;
	}
}

stochasticShader = function(hit, scene, recursions) {

	if(vec3.dot(hit.ray.dir, hit.normal) > 0) {
		var aRay = new CRay();
		vec4.copy(aRay.orig, hit.position);
		vec4.copy(aRay.dir, hit.ray.dir);
		var hl = scene.traceRay(aRay);
		// hl.popFirst();
		return hl.first.material.shade(hl.first, scene, recursions);
	}

	var recurse = 0;
	if(recursions) {
		recurse = recursions
	}
	var numSamps = this.numSamps;
	if(recurse > MAX_RECURSE) {
		numSamps = 0;
	}

	if(!this.threshold){
		this.threshold = .1;
	}

	// var ambient = this.ambient;
	// var diffuse = this.diffuse;
	var accum = vec4.create();
	var normal = this.getNormal(hit, scene);
	vec3.normalize(normal, normal);
	var gCol = hit.material.getColor(hit, scene);
	if(!this.maxAngle) {
		this.maxAngle = Math.acos(Math.pow(this.threshold, 1/this.k));
	}


	var rDir = vec3.create();
	vec3.normalize(rDir, hit.ray.dir);
	rDir[3] = 0;
	var rDotN = -vec3.dot(normal, rDir);
	var refl = vec4.create();
	vec3.scale(refl, normal, rDotN*2);
	vec3.add(refl, rDir, refl);
	vec3.normalize(refl, refl);

	for(var i = 0; i < scene.lights.length; i ++) {
		if(scene.lights[i].on == true) {
			if((((0x1 << i) & hit.lightMask)>>i) == 1) {
				var lightDir = vec3.create();
				var t = Infinity;
				if(scene.lights[i].position[3] == 0) {
					vec3.copy(lightDir, scene.lights[i].position);
				}
				else {
					vec3.subtract(lightDir, hit.position, scene.lights[i].position);
				}
				vec3.normalize(lightDir, lightDir);
				var tRay = new CRay();
				vec4.copy(tRay.orig, hit.position);
				vec3.copy(tRay.dir, lightDir);
				vec3.scale(tRay.dir, tRay.dir, -1);
				tRay.dir[3] = 0;
				var hl = scene.traceRay(tRay);
				var color = vec4.create();
				while((hl.first.castShadows == false) && (hl.first.t != Infinity)) {
					hl.popFirst();
				}
				if(t <= hl.first.t && vec3.dot(normal, tRay.dir) > 0) {
					var nDotL = Math.max(-vec3.dot(normal, lightDir), 0);
					color[3] = 1;
					vec3.scale(color, scene.lights[i].color, nDotL*this.diffuse);
					vec3.multiply(color, color, gCol);

					var rDotL = Math.max(vec3.dot(refl, tRay.dir), 0);
					var c = Math.pow(rDotL, this.k);
					var spec = vec3.create();
					vec3.scale(spec, scene.lights[i].color, c*this.spec);
					// vec3.multiply(color, color, gCol);
					vec3.add(color, color, spec);
					vec3.scale(color, color, this.direct);
				}
				vec3.add(accum, color, accum);
			}
		}
	}
	if(this.softShadows) {
		var randDir = vec4.create();
		var rand;
		var nCol;
		for(var nSamp = 0; nSamp < numSamps; nSamp++) {
			rand = Math.random();
			if(rand < this.diffuse) {
				do {
					randDir = vec3.copy(randDir, roundRand3D());
					// vec3.add(randDir, randDir, normal);
				} while(vec3.length(randDir) == 0);
				vec3.normalize(randDir, randDir);
				var nDotRand = vec3.dot(randDir, normal);
				if(nDotRand < 0) {
					nDotRand *= -1;
					var normScaled = vec3.create();
					vec3.scale(normScaled, normal, 2*nDotRand);
					vec3.add(randDir, randDir, normScaled);
				}
				var nRay = new CRay();
				vec3.copy(nRay.orig, hit.position);
				vec3.copy(nRay.dir, randDir);
				nRay.orig[3] = 1;
				nRay.dir[3] = 0;
				var nHit = scene.traceRay(nRay).first;
				if(nHit.t != Infinity) {
					nCol = nHit.material.shade(nHit, scene, recurse + 1);
					vec3.scale(nCol, nCol, nDotRand);
				}
				else {
					nCol = vec3.create();
					vec3.copy(nCol, scene.ambient);
					// vec3.scale(nCol, nCol, vec3.dot(normal, randDir));
					// vec3.scale(nCol, nCol, ambient);
				}
				vec3.scale(nCol, nCol, 1/numSamps);
				vec3.multiply(nCol, nCol, gCol);
				vec3.scale(nCol, nCol, this.indirect);
				vec3.add(accum, nCol, accum);
			}
			else if(rand < this.diffuse + this.spec) {
				vec3.copy(randDir, randomCone(this.maxAngle, refl));
				var rDotRand = vec3.dot(randDir, refl);
				var nRay = new CRay();
				vec3.copy(nRay.orig, hit.position);
				vec3.copy(nRay.dir, randDir);
				nRay.orig[3] = 1;
				nRay.dir[3] = 0;
				var nHit = scene.traceRay(nRay).first;
				if(nHit.t != Infinity) {
					nCol = nHit.material.shade(nHit, scene, recurse + 1);
					vec3.scale(nCol, nCol, Math.pow(rDotRand, this.k));
				}
				else {
					nCol = vec3.create();
					vec3.copy(nCol, scene.ambient);
				}
				// vec3.multiply(nCol, nCol, gCol);
				vec3.scale(nCol, nCol, 1/numSamps);
				vec3.scale(nCol, nCol, this.indirect);
				vec3.add(accum, nCol, accum);
			}
		}
	}
	else {
		var nCol = vec3.create();
		vec3.copy(nCol, scene.ambient);
		vec3.scale(nCol, nCol, this.indirect);
		vec3.multiply(nCol, nCol, gCol);
		vec3.add(accum, nCol, accum);
	}
	if(gCol[3] < 1) {
		var hl = scene.traceRay(hit.ray);
		hl.popFirst();
		var next;
		if(recurse > MAX_RECURSE) next = hl.first.material.getColor(hit, scene);
		else next = hl.first.material.shade(hl.first, scene, recurse + 1);
		vec3.lerp(accum, accum, next, 1-gCol[3] );
	}
	return accum;
}

diffuseShader = function(hit, scene, recursions) {
	var recurse = 0;
	if(recursions) {
		recurse = recursions
	}
	var numSamps = 3;
	if(recurse > MAX_RECURSE) {
		numSamps = 0;
	}
	var ambient = this.ambient;
	var diffuse = this.diffuse;
	var accum = vec4.create();
	var normal = this.getNormal(hit, scene);
	vec3.normalize(normal, normal);
	var gCol = hit.material.getColor(hit, scene);
	for(var i = 0; i < scene.lights.length; i ++) {
		if(scene.lights[i].on == true) {
			if((((0x1 << i) & hit.lightMask)>>i) == 1) {
				var lightDir = vec3.create();
				var t = Infinity;
				if(scene.lights[i].position[3] == 0) {
					vec3.copy(lightDir, scene.lights[i].position);
				}
				else {
					vec3.subtract(lightDir, hit.position, scene.lights[i].position);
				}
				vec3.normalize(lightDir, lightDir);
				var tRay = new CRay();
				vec4.copy(tRay.orig, hit.position);
				vec3.copy(tRay.dir, lightDir);
				vec3.scale(tRay.dir, tRay.dir, -1);
				tRay.dir[3] = 0;
				var hl = scene.traceRay(tRay);
				var color = vec4.create();
				while((hl.first.castShadows == false) && (hl.first.t != Infinity)) {
					hl.popFirst();
				}
				if(t <= hl.first.t && vec3.dot(normal, tRay.dir) > 0) {
					var nDotL = Math.max(-vec3.dot(normal, lightDir), 0);
					color[3] = 1;
					vec3.scale(color, scene.lights[i].color, nDotL*diffuse);
					// vec3.multiply(color, color, scene.lights[i].color);
				}
				vec3.add(accum, color, accum);
			}
		}
	}
	if(this.softShadows) {
		for(var nSamp = 0; nSamp < numSamps; nSamp++) {
			var randDir = vec4.create();
			while(vec3.length(randDir) == 0) {
				randDir = vec3.copy(randDir, roundRand3D());
				// vec3.add(randDir, randDir, normal);
			}
			vec3.normalize(randDir, randDir);
			var nDotRand = vec3.dot(randDir, normal);
			if(nDotRand < 0) {
				nDotRand *= -1;
				var normScaled = vec3.create();
				vec3.scale(normScaled, normal, 2*nDotRand);
				vec3.add(randDir, randDir, normScaled);
			}
			var nRay = new CRay();
			vec3.copy(nRay.orig, hit.position);
			vec3.copy(nRay.dir, randDir);
			nRay.orig[3] = 1;
			nRay.dir[3] = 0;
			var nHit = scene.traceRay(nRay).first;
			if(nHit.t != Infinity) {
				var nCol = nHit.material.shade(nHit, scene, recurse + 1);
				vec3.scale(nCol, nCol, nDotRand);
			}
			else {
				var nCol = vec3.create();
				vec3.copy(nCol, scene.ambient);
				// vec3.scale(nCol, nCol, vec3.dot(normal, randDir));
				// vec3.scale(nCol, nCol, ambient);
			}
			vec3.scale(nCol, nCol, ambient/numSamps);
			vec3.add(accum, nCol, accum);
		}
	}
	else {
		var nCol = vec3.create();
		vec3.copy(nCol, scene.ambient);
		vec3.scale(nCol, nCol, ambient);
		vec3.add(accum, nCol, accum);
	}
	vec3.multiply(accum, accum, gCol);
	return accum;
}


reflectiveShader = function(hit, scene, recursions) 
{
	var recurse = 0;
	if(recursions) {
		recurse = recursions
	}
	if(recurse > MAX_RECURSE) {
		return Float32Array.from(this.color);
	}

	var normal = this.getNormal(hit, scene);
	vec3.normalize(normal, normal);
	// return normal;
	var rayOrig = vec4.create();
	vec3.scale(rayOrig, normal, .001);
	vec3.add(rayOrig, hit.position, rayOrig);
	rayOrig[3] = 1;
	var rDir = vec3.create();
	vec3.normalize(rDir, hit.ray.dir);
	rDir[3] = 0;
	var rDotN = -vec3.dot(normal, rDir);
	var refl = vec4.create();
	vec3.scale(refl, normal, rDotN*2);
	vec3.add(refl, rDir, refl);
	vec3.normalize(refl, refl);
	var tRay = new CRay();
	vec4.copy(tRay.dir, refl);
	vec4.copy(tRay.orig, rayOrig);
	var hl = scene.traceRay(tRay);

	var accum = vec3.create();
	vec3.multiply(accum, hl.first.material.shade(hl.first, scene, recurse + 1), this.getColor(hit, scene));

	for(var i = 0; i<scene.lights.length; i++) {
		if(scene.lights[i].on == true) {
			if((((0x1 << i) & hit.lightMask)>>i) == 1) {
				var lightDir = vec3.create();
				var t = Infinity;
				if(scene.lights[i].position[3] == 0) {
					vec3.copy(lightDir, scene.lights[i].position);
				}
				else {
					vec3.subtract(lightDir, hit.position, scene.lights[i].position);
					vec3.normalize(lightDir, lightDir);
				}
				// var tRay = new CRay();
				// vec4.copy(tRay.orig, rayOrig);
				vec3.copy(tRay.dir, lightDir);
				vec3.scale(tRay.dir, tRay.dir, -1);
				tRay.dir[3] = 0;
				hl = scene.traceRay(tRay);
				var color = vec4.create();
				while((hl.first.castShadows == false) && (hl.first.t != Infinity)) {
					hl.popFirst();
				}
				if(t <= hl.first.t && vec3.dot(normal, tRay.dir) > 0) {
					var rDotL = vec3.dot(refl, tRay.dir);
					var k = Math.pow(rDotL, this.k);
					vec3.scale(color, scene.lights[i].color, k*this.spec);
				}
				vec3.add(accum, color, accum);
			}
		}
	}

	return accum;
}

refractiveShader = function(hit, scene, recursions) 
{
	var recurse = 0;
	if(recursions) {
		recurse = recursions
	}
	if(recurse > MAX_RECURSE) {
		return Float32Array.from(this.color);
	}
	var normal = this.getNormal(hit, scene);
	vec3.normalize(normal, normal);

	var reflectRatio = this.reflectRatio;

	var inDir = vec3.create();
	vec3.normalize(inDir, hit.ray.dir);

	var iDotN = vec3.dot(normal, inDir);

	var refl = vec4.create();
	var refr = vec4.create();
	var inNorm = vec3.create();

	vec3.scale(inNorm, normal, -2*iDotN);
	vec3.add(refl, inDir, inNorm);
	vec3.normalize(refl, refl);

	var theta0;
	var theta1;
	// vec3.scale(outNorm, outNorm, -1);

	if(iDotN > 0) {
		theta0 = Math.acos(iDotN);
		theta1 = Math.sin(theta0)*n;
	}
	else {
		theta0 = Math.acos(-iDotN);
		theta1 = Math.sin(theta0)/n;
	}

	if(theta1 > 1) {
		reflectRatio = 1;
	}


	var reflCol = vec3.create();
	var refrCol = vec3.create();
	var tRay = new CRay();
	tRay.orig = hit.position;
	var hl;
	if(reflectRatio > 0) {
		tRay.dir = refl;
		hl = scene.traceRay(tRay);
		vec3.copy(reflCol, hl.first.material.shade(hl.first, scene, recurse + 1));
	}
	if(reflectRatio < 1) {
		theta1 = Math.asin(theta1);
		var refrNorm = vec3.create();
		vec3.scale(refrNorm, normal, Math.sign(iDotN)*Math.cos(theta1));
		vec3.scale(refr, normal, iDotN);
		vec3.subtract(refr, inDir, refr);
		vec3.normalize(refr, refr);
		vec3.scale(refr, refr, Math.sin(theta1))
		vec3.add(refr, refr, refrNorm);
		vec3.normalize(refr, refr);
		tRay.dir = refr;
		hl = scene.traceRay(tRay);
		vec3.copy(refrCol, hl.first.material.shade(hl.first, scene, recurse + 1));
	}
	vec3.lerp(refrCol, refrCol, reflCol, reflectRatio);

	vec3.multiply(refrCol, refrCol, this.getColor(hit, scene));

	if(iDotN<0) {
		for(var i = 0; i<scene.lights.length; i++) {
			if(scene.lights[i].on == true) {
				if((((0x1 << i) & hit.lightMask)>>i) == 1) {
					var lightDir = vec3.create();
					var t = Infinity;
					if(scene.lights[i].position[3] == 0) {
						vec3.copy(lightDir, scene.lights[i].position);
					}
					else {
						vec3.subtract(lightDir, hit.position, scene.lights[i].position);
						vec3.normalize(lightDir, lightDir);
					}
					// var tRay = new CRay();
					// vec4.copy(tRay.orig, rayOrig);
					vec3.copy(tRay.dir, lightDir);
					vec3.scale(tRay.dir, tRay.dir, -1);
					tRay.dir[3] = 0;
					hl = scene.traceRay(tRay);
					var color = vec4.create();
					while((hl.first.castShadows == false) && (hl.first.t != Infinity)) {
						hl.popFirst();
					}
					if(t <= hl.first.t && vec3.dot(normal, tRay.dir) > 0) {
						var rDotL = vec3.dot(refl, tRay.dir);
						var k = Math.pow(rDotL, this.k);
						vec3.scale(color, scene.lights[i].color, k*this.spec);
					}
					vec3.add(refrCol, color, refrCol);
				}
			}
		}
	}

	return refrCol;
}


sphereMat = new Material(diffuseShader);

sphereMat.color = Float32Array.from([1, .1, .2, 1]);
sphereMat.diffuse = .7;
sphereMat.ambient = .5;




var mirrorMat = new Material(reflectiveShader);
mirrorMat.color = vec3.fromValues(.9, 1, .96);
mirrorMat.k = 100;
mirrorMat.spec = .6


// cloudMat.castShadows = false;

// shellShader = function(hit, scene, recursions) {
// 	var l = vec3.length(hit.position);
// 	l *= 3;
// 	l = Math.round(l);
// 	l %= 2;
// 	if(l == 0) {
// 		return this.mat[0].shade(hit, scene, recursions);
// 	}
// 	return this.mat[1].shade(hit, scene, recursions);
// }


class Light {
	constructor(color, position) {
		this.color = Float32Array.from(color);
		this.position = Float32Array.from(position);
		this.on = true;
	}
}

function roundRand3D() {
//==============================================================================
// On each call, find a different 3D point (xball, yball, zball) chosen 
// 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
// More formally: 
//    --xball*xball + yball*yball + zball*zball < 1.0, and 
//    --uniform probability density function inside this radius=1 circle.
//    (within this sphere, all regions of equal volume are equally likely to
//    contain the the point (xball,yball,zball)).
  do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
    var xball = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
    var yball = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
    var zball = 2.0*Math.random() -1.0;
    }
  while(xball*xball + yball*yball + zball*zball >= 1.0);    // keep 1st point inside sphere.
  var ret = new Array(xball,yball,zball);
  return ret;
}

function calcNorm(hitNorm, mapCol) {
	var result = vec3.create();
	var mapNorm = vec3.create();
	vec3.copy(mapNorm, mapCol);
	vec3.scale(mapNorm, mapNorm, 2);
	vec3.subtract(mapNorm, mapNorm, [1, 1, 1]);
	if(hitNorm[2] == 1 || hitNorm[2] == -1) {
		vec3.scale(result, mapNorm, Math.sign(hitNorm[2]));
	}
	else {
		var x = vec3.create();
		var y = vec3.create();
		vec3.cross(x, [0, 0, 1], hitNorm);
		vec3.normalize(x, x);
		vec3.cross(y, hitNorm, x);
		vec3.normalize(y, y);
		vec3.scale(result, hitNorm, mapNorm[2]);
		vec3.scale(x, x, mapNorm[0]);
		vec3.scale(y, y, mapNorm[1]);
		vec3.add(result, result, x);
		vec3.add(result, result, y);
	}
	return result;
}

function randomCone(maxAngle, dir) {
	var ang = Math.random()*maxAngle;
	var ret = vec3.create();
	do {
	    ret[0] = 2.0*Math.random() -1.0;
	    ret[1] = 2.0*Math.random() -1.0;
    } while(ret[0]*ret[0] + ret[1]*ret[1] >= 1.0);
    vec2.normalize(ret, ret);
    vec2.scale(ret, ret, Math.sin(ang));
    ret[2] = Math.cos(ang);
    if(dir != [0, 0, 1]) {
    	var y = vec3.fromValues(0, 0, 1);
    	var x = vec3.create();
    	vec3.cross(x, y, dir);
    	vec3.normalize(x, x);
    	vec3.cross(y, dir, x);
    	vec3.normalize(y, y);
    	vec3.scale(x, x, ret[0]);
    	vec3.scale(y, y, ret[1]);
    	vec3.scale(ret, dir, ret[2]);
    	vec3.add(ret, ret, x);
    	vec3.add(ret, ret, y);
    	vec3.normalize(ret, ret);
    }
	return ret;
}
