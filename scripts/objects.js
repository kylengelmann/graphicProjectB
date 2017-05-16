var grid = new class {
	constructor() {
		this.vertShader = 
	'attribute vec4 a_Position;\n' +	
	'attribute vec4 a_Color;\n' +
	'uniform mat4 u_modelMatrix;\n' +
	'uniform mat4 u_viewMatrix;\n' +
	'uniform mat4 u_projMatrix;\n' +
	'varying vec4 v_colr;\n' +
	//
	'void main() {\n' +
	'  gl_Position = u_projMatrix * u_viewMatrix * u_modelMatrix * a_Position;\n' +
	'  v_colr = a_Color;\n' +
	'}\n';

		this.fragShader = 
	'precision mediump float;\n' +							// req'd for floats in frag shader
	//
	'varying vec4 v_colr;\n' +
	'void main() {\n' +
	'	 	 gl_FragColor = v_colr; \n' +
	'}\n';

		this.vboContents = makeGroundGrid();

		this.attrs = [new Attribute('a_Position', 4, 0), new Attribute('a_Color', 3, 4)];

		this.unifs = ['u_modelMatrix', 'u_viewMatrix', 'u_projMatrix'];

    this.renderer = new renderObject(this.vertShader, this.fragShader, this.vboContents);
	}
}();

var rayview = new class {

	constructor() {
		this.vertShader = 
	'attribute vec4 a_Position;\n' +  
	'attribute vec2 a_TexCoord;\n' +
	'varying vec2 v_TexCoord;\n' +
	//
	'void main() {\n' +
	'  gl_Position = a_Position;\n' +
	'  v_TexCoord = a_TexCoord;\n' +
	'}\n';
		this.fragShader = 
	'precision mediump float;\n' +              // set default precision
	//
	'uniform sampler2D u_Sampler;\n' +
	'varying vec2 v_TexCoord;\n' +
	//
	'void main() {\n' +
	'  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
	// '  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n' +
	'}\n';
		this.vboContents = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    -1,  1,     0.0, 1.0,       // upper left corner (with a small border)
    -1, -1,     0.0, 0.0,       // lower left corner,
     1,  1,     1.0, 1.0,       // upper right corner,
     1, -1,     1.0, 0.0,       // lower left corner.
     ]);

  		this.attrs = [new Attribute('a_Position', 2, 0), new Attribute('a_TexCoord', 2, 2)]

  		this.unifs = ['u_Sampler'];
      this.renderer = new renderObject(this.vertShader, this.fragShader, this.vboContents);
	}

}();

var sphere = new class {
  constructor() {
    this.vertShader = 
  'attribute vec4 a_Position;\n' +  
  // 'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform vec4 u_Color;\n' +
  'uniform mat4 u_modelMatrix;\n' +
  'uniform mat4 u_viewMatrix;\n' +
  'uniform mat4 u_projMatrix;\n' +
  'uniform mat4 u_invTranspose;\n' +
  'varying vec4 v_worldPos;\n' +
  'varying vec4 v_colr;\n' +
  'varying vec3 v_norm;\n' +
  //
  'void main() {\n' +
  '  v_worldPos = u_modelMatrix * a_Position;\n' +
  '  gl_Position = u_projMatrix * u_viewMatrix * v_worldPos;\n' +
  '  v_colr = u_Color;\n' +
  '  v_norm = normalize((u_invTranspose * a_Normal).xyz);\n' +
  '}\n';

    this.fragShader = 
  'precision mediump float;\n' +              // req'd for floats in frag shader
  'varying vec4 v_worldPos;\n' +
  'varying vec4 v_colr;\n' +
  'varying vec3 v_norm;\n' +
  'uniform vec3 u_lightPos;\n' +
  'void main() {\n' +
  '  vec3 lightDir = u_lightPos;\n' +
  '  float nDotL = dot(-v_norm, lightDir);\n' +
  '  vec3 light = vec3(1.0, 1.0, 1.0)*nDotL;\n' +
  '  gl_FragColor = vec4(v_colr.rgb*light, 1.0); \n' +
  '}\n';

    var x = makeSphere([1, 0, 0, 1]);

    this.vboContents = x[0];

    this.indices = x[1];

    this.attrs = [new Attribute('a_Position', 4, 0),
                  new Attribute('a_Normal', 4, 4)];

    this.unifs = ['u_Color', 'u_modelMatrix', 'u_viewMatrix', 'u_projMatrix', 'u_invTranspose', 'u_lightPos'];

    this.renderer = new renderObject(this.vertShader, this.fragShader, this.vboContents, this.indices);
  }
}();


function makeGroundGrid() {

  var xcount = 1201;     // # of lines to draw in x,y to make the grid.
  var ycount = 1201;   
  var xymax = 600.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([.5, .5, 0.8]);  // bright yellow
  var yColr = new Float32Array([.5, .5, 1.0]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  var gndVerts = new Float32Array(7*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= 7) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = 1.0;
    gndVerts[j+4] = xColr[0];     // red
    gndVerts[j+5] = xColr[1];     // grn
    gndVerts[j+6] = xColr[2];     // blu
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= 7) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = 1.0;
    gndVerts[j+4] = yColr[0];     // red
    gndVerts[j+5] = yColr[1];     // grn
    gndVerts[j+6] = yColr[2];     // blu
  }
  return gndVerts
}

function makeSphere(col) {
  var SPHERE_DIV = 17;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var sphereVerts = [];
  var sphereIndices = [];

  for (j = 0.0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0.0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      sphereVerts.push(si * sj);
      sphereVerts.push(cj);
      sphereVerts.push(ci * sj);
      sphereVerts.push(1);

      sphereVerts.push(si * sj);
      sphereVerts.push(cj);
      sphereVerts.push(ci * sj);
      sphereVerts.push(0);

      sphereVerts.push(col[0]);
      sphereVerts.push(col[1]);
      sphereVerts.push(col[2]);
      sphereVerts.push(col[3]);
    }
  }

  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      sphereIndices.push(p1);
      sphereIndices.push(p2);
      sphereIndices.push(p1 + 1);

      sphereIndices.push(p1 + 1);
      sphereIndices.push(p2);
      sphereIndices.push(p2 + 1);
    }
  }
  return [sphereVerts, sphereIndices];
}




