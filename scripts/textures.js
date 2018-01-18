function lerp(a, b, t) {
	t = Math.min(t, 1);
	t = Math.max(t, 0);
	return (1-t)*a + t*b;
}

function generatePerlin(size) {
	var noise = new Float32Array(Math.pow(size, 3)*3);
	for(var i = 0; i < size; i++){
		for(var j = 0; j < size; j++) {
			for(var k = 0; k<size; k++) {
				var grad = vec3.create();
				do {
					vec3.copy(grad, roundRand3D());
				} while(vec3.length(grad) == 0);
				vec3.normalize(grad, grad);
				noise[(size*(size*i + j) + k)*3] = grad[0];
				noise[(size*(size*i + j) + k)*3 + 1] = grad[1];
				noise[(size*(size*i + j) + k)*3 + 2] = grad[2];
			}
		}
	}
	return {'noise' : noise, 'size' : size};
}

function samplePerlin(tex, coord) {
	var ret = vec3.create();
	var texCoord = vec3.create();
	for(var i = 0; i < 3; i++) {
		texCoord[i] = (coord[i]%tex.size + tex.size)%tex.size
	}
	ret[0] = tex.noise[(tex.size*(tex.size*texCoord[0] + texCoord[1]) + texCoord[2])*3];
	ret[1] = tex.noise[(tex.size*(tex.size*texCoord[0] + texCoord[1]) + texCoord[2])*3 + 1];
	ret[2] = tex.noise[(tex.size*(tex.size*texCoord[0] + texCoord[1]) + texCoord[2])*3 + 2];
	return ret;
}

function dotPerlin(tex, coord, gridCoord) {
	var dist = vec3.create();
	vec3.subtract(dist, coord, gridCoord);
	// vec3.normalize(dist, dist);
	return vec3.dot(samplePerlin(tex, gridCoord), dist);
}

function getNoise(tex, coord) {
	var pos = vec3.create();
	vec3.copy(pos, coord);
	var lowCoord = vec3.create();
	lowCoord[0] = Math.floor(pos[0]);
	lowCoord[1] = Math.floor(pos[1]);
	lowCoord[2]= Math.floor(pos[2]);

	// x1 = x0 + 1
	// y1 = y0 + 1
	// z1 = z0 + 1

	var t = vec3.create();
	vec3.subtract(t, pos, lowCoord);

	// for(var  i = 0; i < 3; i++) {
	// 	t[i] = Math.pow(t[i], 2)
	// }

	var z = vec2.create();
	for(var i = 0; i < 2; i++){
		var y = vec2.create();
		for(var j = 0; j < 2; j++){
			var x = vec2.create();
			for(var k = 0; k < 2; k++){
				x[k] = (dotPerlin(tex, pos, 
					[lowCoord[0] + k, lowCoord[1] + j, lowCoord[2] + i]) + 1)/2;
			}
			y[j] = lerp(x[0], x[1], t[0]);
		}
		z[i] = lerp(y[0], y[1], t[1]);
	}

	return lerp(z[0], z[1], t[2]);
}

function sig(x, k) {
	var sigB = 1/(1+Math.pow(Math.E, k));
	var sigK = 1/(1/(1+Math.pow(Math.E, -k)) - sigB);
    return sigK*(1/(1+Math.pow(Math.E, -k*(x*2-1)))-sigB);
}

var perlin = generatePerlin(100);

perlinCol = function(hit, scene) {
	var pos = vec3.create();

	var perlinVal = 0;
	var c = 1;
	var scale = this.noiseScale
	var max = 0;
	for(var i = 0; i < 2; i++) {
		vec3.scale(pos, hit.position, scale);
	
		perlinVal += c*getNoise(this.noise, pos);

		max += c;
		c *= 1;
		scale *= 2;
	}
	for(var i = 0; i < 2; i++) {
		vec3.scale(pos, hit.position, scale);
	
		perlinVal += c*getNoise(this.noise, pos);

		max += c;
		c *= .5;
		scale *= 2;
	}

	perlinVal /= max;

	perlinVal = 1 - Math.max(((1 - perlinVal) - .17)/.8, 0);

	perlinVal = sig(perlinVal, 10);


	var col = vec4.create();
	vec4.copy(col, this.color);

	vec3.scale(col, col, perlinVal);
	return col;
}

marbleCol = function(hit, scene){
	var pos = vec3.create();

	var perlinVal = 0;
	var c = 1;
	var scale = this.noiseScale
	var max = 0;
	for(var i = 0; i < 2; i++) {
		vec3.scale(pos, hit.position, scale);
	
		perlinVal += c*getNoise(this.noise, pos);

		max += c;
		c *= .6;
		scale *= 2;
	}
	for(var i = 0; i < 2; i++) {
		vec3.scale(pos, hit.position, scale);
	
		perlinVal += c*getNoise(this.noise, pos);

		max += c;
		c *= .2;
		scale *= 2;
	}

	perlinVal /= max;
	// perlinVal = Math.max((perlinVal - .3)/.7, 0);
	// perlinVal = sig(perlinVal, 5);
	perlinVal = (Math.abs(2*(1-perlinVal) - 1));
	// perlinVal = 1 - Math.max((1-perlinVal - .7)/.3, 0)
	perlinVal = sig(perlinVal+.53, 15);
	perlinVal = Math.max((perlinVal-.4)/.7, 0)
	// perlinVal = sig(perlinVal, 1);


	var col = vec4.create();
	vec4.copy(col, this.color);

	vec3.scale(col, col, perlinVal);
	return col;
}

// marbleCol = function(hit, scene){
// 	var pos = vec3.create();

// 	var perlinVal = 0;
// 	var c = 1;
// 	var scale = this.noiseScale
// 	var max = 0;
// 	for(var i = 0; i < 2; i++) {
// 		vec3.scale(pos, hit.position, scale);
	
// 		perlinVal += c*Math.abs(getNoise(this.noise, pos)*2 - 1);

// 		max += c;
// 		c *= .5;
// 		scale *= 2;
// 	}
// 	// for(var i = 0; i < 2; i++) {
// 	// 	vec3.scale(pos, hit.position, scale);
	
// 	// 	perlinVal += c*Math.abs(getNoise(this.noise, pos)*2 - 1);

// 	// 	max += c;
// 	// 	c *= .3;
// 	// 	scale *= 2;
// 	// }

// 	// perlinVal /= max;
// 	// perlinVal = Math.max((perlinVal - .3)/.7, 0);
// 	// perlinVal = sig(perlinVal, 5);
// 	// perlinVal = (Math.abs(2*(1-perlinVal) - 1));
// 	// perlinVal = 1 - Math.max((1-perlinVal - .7)/.3, 0)
// 	perlinVal = sig(perlinVal+.3, 5);
// 	// perlinVal = Math.max((perlinVal-.5)/.5, 0)
// 	// perlinVal = sig(perlinVal, 1);


// 	var col = vec4.create();
// 	vec4.copy(col, this.color);

// 	vec3.scale(col, col, perlinVal);
// 	return col;
// }



perlinMat = new Material(stochasticShader);
perlinMat.noise = perlin;
perlinMat.color = vec4.fromValues(1, 1, 1, 1);
perlinMat.getColor = marbleCol;
perlinMat.noiseScale = 2;
perlinMat.diffuse = .6;
perlinMat.spec = .4;
perlinMat.k = 80;
perlinMat.direct = 1;
perlinMat.indirect = .3;
perlinMat.softShadows = true;
perlinMat.numSamps = 3;


eggMat = new Material(stochasticShader);
eggMat.noise = perlin;
eggMat.color = vec4.fromValues(.7, .8, 1, 1);
eggMat.getColor = perlinCol;
eggMat.noiseScale = 2;
eggMat.diffuse = .6;
eggMat.spec = .4;
eggMat.k = 80;
eggMat.direct = 1;
eggMat.indirect = .3;
eggMat.softShadows = true;
eggMat.numSamps = 3;





shellShader = function(hit, scene, recursions) {
	var pos = vec3.create();
	vec3.subtract(pos, hit.position, [3, 3, 3]);
	var l = vec3.length(pos);
	l *= 3;
	l = Math.round(l);
	l %= 2;
	if(l == 0) {
		return this.mat[0].shade(hit, scene, recursions);
	}
	return this.mat[1].shade(hit, scene, recursions);
}



gridCol = function(hit, scene) {
	if(hit.texCoord[0] < this.lineThickness/2 || hit.texCoord[1] < this.lineThickness/2 ||
		1 - hit.texCoord[0] < this.lineThickness/2 || 1 - hit.texCoord[1] < this.lineThickness/2) {

		return Float32Array.from(hit.material.lineCol);
	}
	else {
		return Float32Array.from(hit.material.betweenCol);
	}
}

gridMat = new Material(stochasticShader);
gridMat.getColor = gridCol;

// gridMat.absorbtion = .5;
gridMat.diffuse = .7;
// gridMat.ambient = .5;

gridMat.lineCol = Float32Array.from([0, 0, 0, 1]);

gridMat.betweenCol = Float32Array.from([1, 1, 1, 1]);

gridMat.lineThickness = .1;

gridMat.spec = .3;
gridMat.k = 300;
gridMat.direct = .6;
gridMat.indirect = .4;
gridMat.numSamps = 3;
// gridMat.maxAngle = 0;



cloudCol = function(hit, scene) {
	var fx = this.fx;
	var fy = 2*this.fy;
	var c = this.c;
	var t0 = this.t0;
	var x = 0;
	var y = 0;
	var pos = hit.position;
	var xMax = 0;
	var yMax = 0;
	var xMin = 0;
	var yMin = 0;
	for(var i = 0; i < this.n; i++) {
		var pz = Math.sin(fx*pos[3]/2);
		// var pz = 0;
		var px = Math.PI*(.5*Math.sin(fy*pos[1]) + Math.sin(fx*pos[2]/2));
		var py = Math.PI*(.5*Math.sin(fx*pos[0]) + Math.sin(fx*pos[2]/2));
		x += .707*c*Math.sin(fx*pos[0] + px) + t0;
		y += c*Math.sin(fy*pos[1] + py) + t0;
		xMax += .707*c + t0;
		yMax += c + t0;
		xMin += -.707*c + t0;
		yMin += -c + t0;
		fx *= 2;
		fy *= 2;
		c *= .707;
	}
	var tex = x*y/xMax/yMax
	var tShade = vec4.create();
	vec4.copy(tShade, this.color);
	var limbCurve = vec4.create();
	vec4.transformMat4(limbCurve, hit.position, hit.world2model);
	vec3.scale(tShade, tShade, tex);
	var rayDir = vec3.create();
	vec3.normalize(rayDir, hit.ray.dir);
	var ldr = Math.max(-vec3.dot(limbCurve, rayDir), 0);
	var t = this.t1*ldr + this.t2*(1 - ldr)
	t = Math.min(t, 1);
	t = Math.max(t, 0);
	var Dmax = 1 - t;
	var tr = 1 - Math.max((tex-t)/(Dmax), 0);
	// var tr = 1 - (tex - this.t1 - (this.t2 - this.t1)*(vec3.squaredLength(limbCurve)))/D;
	// tShade[3] = (1-tr);
	var eK = .3;
	var sigB = 1/(1+Math.pow(Math.E, eK));
	var sigK = 1/(1/(1+Math.pow(Math.E, -eK)) - sigB);
    tShade[3] = sigK*(1/(1+Math.pow(Math.E, -eK*((1-tr)*2-1)))-sigB);
 	// tShade[3] = 1-tr;
	return tShade;

}

cloudMat = new Material(stochasticShader);
cloudMat.getColor = cloudCol;
cloudMat.fx = 1/200;
cloudMat.fy = 1.4/200;
cloudMat.c = .8;
cloudMat.t0 = 1;
cloudMat.t1 = .1;
cloudMat.t2 = 1.5;
cloudMat.n = 4;

cloudMat.diffuse = .7;
cloudMat.spec = .3;
cloudMat.k = 10;
cloudMat.direct = .8;
cloudMat.indirect = .6;
cloudMat.numSamps = 3;

cloudMat.color = vec4.fromValues(1, 1, 1, 1);


