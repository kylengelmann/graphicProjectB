class Attribute {
	constructor(name, size, offset) {
		this.name = name;
		this.size = size;
		this.offset = offset;
	}
}

class renderObject {
	constructor(vShader, fShader, verts, indices) {
		if(indices) {
			this.indices = Uint16Array.from(indices);
		}
		this.verts = Float32Array.from(verts);
		this.vertBuffLoc;
		this.vShader = vShader;
		this.fShader = fShader;
		this.attrLocs = {};
		this.attrOffsets;
		this.attrSizes;
		this.stride;
		this.unifLocs = {};
		this.numVerts;
		this.FSIZE = this.verts.BYTES_PER_ELEMENT;
		this.shaderLoc;
		this.glEnumTarget;
		this.glDrawType;
		this.glPrimitive;
	}
	init(gl, attrs, Stride, unifs, glDrawType) {
		this.attrLocs = {};
		this.attrOffsets = [];
		this.attrSizes = [];
		for(var i = 0; i<attrs.length; i++) {
			this.attrLocs[attrs[i].name] = -1;
			this.attrOffsets.push(attrs[i].offset);
			this.attrSizes.push(attrs[i].size);
		}
		this.unifLocs = {};
		for(var i = 0; i<unifs.length; i++) {
			this.unifLocs[unifs[i]] = -1;
		}

		this.stride = Stride;

		this.numVerts = this.verts.length/this.stride;
		this.FSIZE = this.verts.BYTES_PER_ELEMENT;
		this.shaderLoc;
		this.glDrawType = glDrawType;


		this.shaderLoc = createProgram(gl, this.vShader, this.fShader);
		gl.program = this.shaderLoc;
		if (!this.shaderLoc) {
    		console.log(this.constructor.name + 
    					'.init() failed to create executable Shaders on the GPU. Bye!');
    		return;
		}

		this.vertBuffLoc = gl.createBuffer();
		if (!this.vertBuffLoc) {
		    console.log(this.constructor.name + 
		    			'.init() failed to create VBO in GPU. Bye!'); 
		    return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffLoc);

		gl.bufferData(gl.ARRAY_BUFFER, this.verts, this.glDrawType);

		var attrNum = 0;

		for (var key in this.attrLocs) {
			if (this.attrLocs.hasOwnProperty(key)) {
				this.attrLocs[key] = gl.getAttribLocation(this.shaderLoc, key);
				if(this.attrLocs[key] < 0) {
    				console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute ' + key);
				    return -1;
  				}
  				gl.vertexAttribPointer(this.attrLocs[key], this.attrSizes[attrNum],
  									   gl.FLOAT, false, this.stride*this.FSIZE, 
  									   this.attrOffsets[attrNum]*this.FSIZE);

  				attrNum ++;

  				gl.enableVertexAttribArray(this.attrLocs[key]);
		 	}
		}

		for (var key in this.unifLocs) {
			if (this.unifLocs.hasOwnProperty(key)) {
				this.unifLocs[key] = gl.getUniformLocation(this.shaderLoc, key);
				if(this.unifLocs[key] < 0) {
    				console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of uniform ' + key);
				    return -1;
  				}
		 	}
		}
		if(this.indices) {
			this.indexBuffer = gl.createBuffer();
			this.numIndices = this.indices.length;
			if (!this.indexBuffer) {
				console.log('Failed to create the index buffer object');
				return -1;
			}
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.glDrawType);
		}
	}

	draw(gl, glPrimitive) {
		gl.useProgram(this.shaderLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffLoc);



		var attrNum = 0;

		for (var key in this.attrLocs) {
			if (this.attrLocs.hasOwnProperty(key)) {

  				gl.vertexAttribPointer(this.attrLocs[key], this.attrSizes[attrNum],
  									   gl.FLOAT, false, this.stride*this.FSIZE, this.attrOffsets[attrNum]*this.FSIZE);

  				attrNum ++;

  				gl.enableVertexAttribArray(this.attrLocs[key]);
		 	}
		}
		if(this.indices) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.drawElements(glPrimitive, this.numIndices, gl.UNSIGNED_SHORT, 0);
		}
		else {
			gl.drawArrays(glPrimitive, 0, this.numVerts);
		}
	}

	setMat4(gl, unif, matValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniformMatrix4fv(this.unifLocs[unif], false, matValues);
	}
	setMat3(gl, unif, matValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniformMatrix3fv(this.unifLocs[unif], false, matValues);
	}
	setMat2(gl, unif, matValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniformMatrix2fv(this.unifLocs[unif], false, matValues);
	}
	setVec4(gl, unif, vecValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniform4fv(this.unifLocs[unif], vecValues);
	}
	setVec3(gl, unif, vecValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniform3fv(this.unifLocs[unif], vecValues);
	}
	setVec2(gl, unif, vecValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniform2fv(this.unifLocs[unif], vecValues);
	}
	setFloat(gl, unif, val) {
		gl.useProgram(this.shaderLoc);
		gl.uniform1f(this.unifLocs[unif], val);
	}
	setInt(gl, unif, val) {
		gl.useProgram(this.shaderLoc);
		gl.uniform1i(this.unifLocs[unif], val);
	}
	getUniform(gl, unif) {
		return gl.getUniform(this.shaderLoc, this.unifLocs[unif]);
	}
	updateVBO(gl, vbo) {
		gl.bindBuffer(this.glEnumTarget, this.vertBuffLoc);
		gl.bufferSubData(this.glEnumTarget, 0, vbo);
	}
}





function initTexture(path, n) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  var image = new Image();
  var loader = {done: false};
  image.onload = function(){ loadTexture(texture, image, n, loader); };
  image.src = path;
  return loader;
}

function loadTexture(texture, image, n, loader) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  switch(n) {
    case 0:
      gl.activeTexture(gl.TEXTURE0);
      break;
    case 1:
      gl.activeTexture(gl.TEXTURE1);
      break;
    case 2:
      gl.activeTexture(gl.TEXTURE2);
      break;
    case 3:
      gl.activeTexture(gl.TEXTURE3);
      break;
    case 4:
      gl.activeTexture(gl.TEXTURE4);
      break;
    case 5:
      gl.activeTexture(gl.TEXTURE5);
      break;
    case 6:
      gl.activeTexture(gl.TEXTURE6);
      break;
    case 7:
      gl.activeTexture(gl.TEXTURE7);
      break;
    case 8:
      gl.activeTexture(gl.TEXTURE8);
      break;
    case 9:
      gl.activeTexture(gl.TEXTURE9);
      break;
    case 10:
      gl.activeTexture(gl.TEXTURE10);
      break;
    case 11:
      gl.activeTexture(gl.TEXTURE11);
      break;
    case 12:
      gl.activeTexture(gl.TEXTURE12);
      break;
    case 13:
      gl.activeTexture(gl.TEXTURE13);
      break;
    case 14:
      gl.activeTexture(gl.TEXTURE14);
      break;
    case 15:
      gl.activeTexture(gl.TEXTURE15);
      break;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  loader.done = true;
}






