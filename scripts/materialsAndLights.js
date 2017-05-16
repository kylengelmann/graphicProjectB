const MAX_RECURSE = 10;

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
}

diffuseShader = function(hit, scene, recursions) {
	var recurse = 0;
	if(recursions) {
		recurse = recursions
	}
	if(recurse > MAX_RECURSE) {
		return Float32Array.from([0, 0, 0]);
	}


	var absorbtion = .3;
	var ambient = .5;
	var diffuse = .5;
	var accum = vec4.create();
	vec3.normalize(hit.normal, hit.normal);
	var gCol = hit.material.getColor(hit, scene);
	for(var i = 0; i < scene.lights.length; i ++) {
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
			if(t <= hl.first.t && vec3.dot(hit.normal, tRay.dir) > 0) {
				var nDotL = Math.max(-vec3.dot(hit.normal, lightDir), 0);
				color[3] = 1;
				vec3.scale(color, gCol, nDotL*diffuse);
				vec3.multiply(color, color, scene.lights[i].color);
			}
			var randDir = vec4.create();
			while(vec3.length(randDir) == 0) {
				randDir = vec3.copy(randDir, roundRand3D());
				vec3.add(randDir, randDir, hit.normal);
			}
			vec3.normalize(randDir, randDir);
			var nRay = new CRay();
			vec3.copy(nRay.orig, hit.position);
			vec3.copy(nRay.dir, randDir);
			nRay.orig[3] = 1;
			nRay.dir[3] = 0;
			var nHit = scene.traceRay(nRay).first;
			if(nHit.t != Infinity) {
				var nCol = nHit.material.shade(nHit, scene, recurse + 1);
				vec3.scale(nCol, nCol, 1 - absorbtion);
			}
			else {
				var nCol = vec3.create();
				vec3.copy(nCol, scene.ambient);
				vec3.scale(nCol, nCol, ambient);
			}
			vec3.multiply(nCol, nCol, gCol);
			vec3.add(color, nCol, color)
			vec3.add(accum, color, accum);
		}
	}
	return accum;
}


reflectiveShader = function(hit, scene, recursions) 
{
	var recurse = 0;
	if(recursions) {
		recurse = recursions
	}
	if(recurse > MAX_RECURSE) {
		return Float32Array.from([0, 0, 0]);
	}


	var rDir = vec3.create();
	vec3.normalize(rDir, hit.ray.dir);
	var rDotN = -vec3.dot(hit.normal, rDir);
	var refl = vec4.create();
	vec3.scale(refl, hit.normal, rDotN*2);
	vec3.add(refl, rDir, refl);
	vec3.normalize(refl, refl);
	var tRay = new CRay();
	tRay.dir = refl;
	tRay.orig = hit.position;
	var hl = scene.traceRay(tRay);

	var accum = vec3.create();
	vec3.multiply(accum, hl.first.material.shade(hl.first, scene, recurse + 1), this.getColor(hit, scene));

	for(var i = 0; i<scene.lights.length; i++) {
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
			var tRay = new CRay();
			vec4.copy(tRay.orig, hit.position);
			vec3.copy(tRay.dir, lightDir);
			vec3.scale(tRay.dir, tRay.dir, -1);
			tRay.dir[3] = 0;
			hl = scene.traceRay(tRay);
			var color = vec4.create();
			while((hl.first.castShadows == false) && (hl.first.t != Infinity)) {
				hl.popFirst();
			}
			if(t <= hl.first.t && vec3.dot(hit.normal, tRay.dir) > 0) {
				var rDotL = vec3.dot(refl, tRay.dir);
				var k = Math.pow(rDotL, this.k);
				vec3.scale(color, scene.lights[i].color, rDotL*k*this.spec);
			}
			vec3.add(accum, color, accum);
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
		return Float32Array.from([0, 0, 0]);
	}

	var reflectRatio = this.reflectRatio;

	var inDir = vec3.create();
	vec3.normalize(inDir, hit.ray.dir);

	var iDotN = vec3.dot(hit.normal, inDir);

	var refl = vec4.create();
	var refr = vec4.create();
	var inNorm = vec3.create();

	vec3.scale(inNorm, inNorm, -2*iDotN);
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
		vec3.scale(refrNorm, hit.normal, Math.sign(iDotN)*Math.cos(theta1));
		vec3.scale(refr, hit.normal, iDotN);
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

	return refrCol;
}





sphereMat = new Material(diffuseShader);

sphereMat.color = Float32Array.from([1, 1, 1, 1]);

gridCol = function(hit, scene) {
	if(hit.texCoord[0] < this.lineThickness/2 || hit.texCoord[1] < this.lineThickness/2 ||
		1 - hit.texCoord[0] < this.lineThickness/2 || 1 - hit.texCoord[1] < this.lineThickness/2) {

		return hit.material.lineCol;
	}
	else {
		return hit.material.betweenCol;
	}
}

gridMat = new Material(diffuseShader);
gridMat.getColor = gridCol;

gridMat.lineCol = Float32Array.from([0, 0, 0, 1]);

gridMat.betweenCol = Float32Array.from([1, 1, 1, 1]);

gridMat.lineThickness = .1;


class Light {
	constructor(color, position) {
		this.color = Float32Array.from(color);
		this.position = Float32Array.from(position);
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
    xball = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
    yball = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
    zball = 2.0*Math.random() -1.0;
    }
  while(xball*xball + yball*yball + zball*zball >= 1.0);    // keep 1st point inside sphere.
  ret = new Array(xball,yball,zball);
  return ret;
}



