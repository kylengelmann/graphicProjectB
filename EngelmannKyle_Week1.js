


var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For the VBOs & Shaders:-----------------
// preview = new VBObox1();		// For WebGLpreview: holds one VBO and its shaders
// rayView = new VBObox3();		// for displaying the ray-tracing results.

var fov = 60;

var near = .3;
var far = 1000;

var mainCam = new Camera(fov, 1, near, far);


var g_last = Date.now();



var imgXmax = 256;
var imgYmax = 256;

var Scene = new CScene();

var antiAliase = false;

var mMat = new Matrix4();

var mirrorScale = Float32Array.from([1, 1, 1]);
var scaleDiff = .02;

var n = 1;

function main() {
//==============================================================================
//  test_glMatrix();		// make sure that the fast vector/matrix library we use
  										// is available and working properly.\
	g_canvasID = document.getElementById('webgl');   // Retrieve <canvas> element.
	browserResize();			// Re-size this canvas before we use it. (ignore the 
	// size settings from our HTML file; fill all but a 20-pixel border with a 
	// canvas whose width is twice its height.)

	// Create the the WebGL rendering context: one giant JavaScript object that
	// contains the WebGL state machine adjusted by large sets of WebGL functions,
	// built-in variables & parameters, and member data. Every WebGL function call
	// will follow this format:  gl.WebGLfunctionName(args);
	gl = getWebGLContext(g_canvasID);
	if (!gl) {
	  console.log('Failed to get the rendering context for WebGL');
	  return;
	}

	gl.enable(gl.DEPTH_TEST);

	mainCam.setPosition([2.2, -4.5, 2.5]);
	mainCam.setRotation(-12, 1, 0, 0);
	Controls.camAngles[0] = -12;
	mainCam.rotate(25, 0, 0, 1);
	Controls.camAngles[2] = 25;


	Keys.init(gl, g_canvasID);
	gl.clearColor(0.2, 0.2, 0.2, 1);

	// Initialize each of our 'vboBox' objects: 
	grid.renderer.init(gl, grid.attrs, 7, grid.unifs, gl.STATIC_DRAW);		// VBO + shaders + uniforms + attribs for WebGL grid
	rayview.renderer.init(gl, rayview.attrs, 4, rayview.unifs, gl.STATIC_DRAW);		//  "		"		" to display ray-traced on-screen result.
	sphere.renderer.init(gl, sphere.attrs, 12, sphere.unifs, gl.STATIC_DRAW);
	console.log(sphere.renderer.attrLocs);


	sphere.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);

	mMat.invert();
	mMat.transpose();
	sphere.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	sphere.renderer.setVec3(gl, 'u_lightPos', [0, 0, -1]);

	mMat.setTranslate(0, 0, 0);

	grid.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);

	u_TextureLoc = gl.createTexture();

	rayview.renderer.setInt(gl, 'u_Sampler', 0);

	Scene.Camera.setPix(imgXmax, imgYmax);
	Scene.imageBuffer = new CImgBuf(imgYmax, imgXmax);

	


	var whiteSphere = new raySphere(sphereMat);
	whiteSphere.translate([1, 1, 1.1]);

	Scene.Geometry.push(whiteSphere);


	var mirrorMat = new Material(reflectiveShader);
	mirrorMat.color = vec3.fromValues(.9, 1, .96);
	mirrorMat.k = 100;
	mirrorMat.spec = .6

	var mirrorSphere = new raySphere(mirrorMat);
	mirrorSphere.translate([-1, -1, 1.1]);

	Scene.Geometry.push(mirrorSphere);

	var plane = new rayGrid(gridMat);
	plane.castShadows = true;

	Scene.Geometry.push(plane);


	Scene.lights.push(new Light([.84, .87, .8], [0, 0, -1, 0]));


	var tick = function() {
		var now = Date.now();
	    var dt = (now - g_last)*.001;
	    g_last = now;

	    if(Keys.keyboard['t'].down) {
	    	trace();
	    }
	    if(Keys.keyboard['r'].down) {
	    	if(antiAliase == true) {
	    		Scene.imageBuffer.antiAliasing = 0;
	    	}
	    	else {
	    		Scene.imageBuffer.antiAliasing = 4;
	    	}
	    	antiAliase = !antiAliase;
	    }
	    if(Keys.keyboard['up_arrow'].pressed) {
	    	mirrorScale[2] += scaleDiff;
	    }
	    if(Keys.keyboard['down_arrow'].pressed) {
	    	mirrorScale[2] -= scaleDiff;
	    }
	    if(Keys.keyboard['left_arrow'].pressed) {
	    	mirrorScale[0] -= scaleDiff;
	    	mirrorScale[1] -= scaleDiff;
	    }
	    if(Keys.keyboard['right_arrow'].pressed) {
	    	mirrorScale[0] += scaleDiff;
	    	mirrorScale[1] += scaleDiff;
	    }
	    mirrorSphere.identity();
	    mirrorSphere.translate([-1, -1, mirrorScale[2] + .1])
	    mirrorSphere.scale(mirrorScale);

	    Controls.updateCamera(mainCam, Keys, dt);

	    grid.renderer.setMat4(gl, 'u_viewMatrix', mainCam.viewMat.elements);
	    grid.renderer.setMat4(gl, 'u_projMatrix', mainCam.projMat.elements);
	    sphere.renderer.setMat4(gl, 'u_viewMatrix', mainCam.viewMat.elements);
	    sphere.renderer.setMat4(gl, 'u_projMatrix', mainCam.projMat.elements);


		Keys.updateAtEnd();
		requestAnimationFrame(tick, g_canvasID);
		drawAll();
	};
	trace();
	tick();

}

function drawAll() {
//==============================================================================
// Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Use OpenGL/ WebGL 'viewports' to map the CVV to the 'drawing context',
	// (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
	// Details? see
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the LEFT viewport:
  //------------------------------------------
	// CHANGE from our default viewport:
	// myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);
	// to a smaller one:
	gl.viewport(0,														// Viewport lower-left corner
							0,														// (x,y) location(in pixels)
  						g_canvasID.width/2, 			// viewport width, height.
  						g_canvasID.height);

  // select fixed-color drawing: 
	grid.renderer.draw(gl, gl.LINES);

	mMat.setTranslate(1, 1, 1.1);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-1, -1, mirrorScale[2] + .1);
	mMat.scale(mirrorScale[0], mirrorScale[1], mirrorScale[2])
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);
  // Draw in the RIGHT viewport:
  //------------------------------------------
	// CHANGE from our default viewport:
	// myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);
	// to a smaller one:
	gl.viewport(g_canvasID.width/2, 			// Viewport lower-left corner
							0, 														// location(in pixels)
  						g_canvasID.width/2, 			// viewport width, height.
  						g_canvasID.height);
	rayview.renderer.draw(gl, gl.TRIANGLE_STRIP);						// Draw our VBObox2 object:
}

function browserResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="browserResize()">

  /* SOLUTION to a pesky problem: ---------------------------------------------
  The main() function retrieves our WebGL drawing context as the variable 'gl', 
  then shares it as an argument to other functions.  
  That's awkward -- How can we access the 'gl' canvas within functions that 
  main() will NEVER call, such as the mouse and keyboard-handling functions, or 
  winResize()? 
	METHOD 1: Re-create our own local references to the current canvas and WebGL 
						drawing context, like this:
	---------
	var myCanvas = document.getElementById('webgl');	// get current canvas
	var myGL = getWebGLContext(myCanvas);							// and its current context:
 	//Report our current browser-window contents:
 	 console.log('myCanvas width,height=', myCanvas.width, myCanvas.height);		
 console.log('Browser window: innerWidth,innerHeight=', 
																innerWidth, innerHeight);	
										// See: http://www.w3schools.com/jsref/obj_window.asp
	---------
	METHOD 2: Why not make 'gl' and 'canvas' into global variables? The 'gl' 
	object gives unified access to the entire WebGL state machine, and 'canvas' 
	to the HTML-5 object that displays our WebGL-rendered result.
	---------
	*/
	//Make a square canvas/CVV fill the SMALLER of the width/2 or height:
	if(innerWidth > 3/2*innerHeight) {  // fit to brower-window height
		g_canvasID.width = 3/2*innerHeight-20;
		g_canvasID.height = 3/4*innerHeight-20;
	  }
	else {	// fit canvas to browser-window width
		g_canvasID.width = innerWidth-20;
		g_canvasID.height = 0.5*innerWidth-20;
	  }	 	
	// g_canvasID.width = innerWidth;
	// g_canvasID.height = 3/4*innerHeight;

	var aspect = (g_canvasID.width/2)/(g_canvasID.height)

	mainCam.projMat.setPerspective(fov, aspect, near, far);
	Scene.Camera.setPerspective(fov, aspect, near, far);
}


function trace() {


	Scene.Camera.uAxis[0] = mainCam.right[0];
	Scene.Camera.uAxis[1] = mainCam.right[1];
	Scene.Camera.uAxis[2] = mainCam.right[2];

	Scene.Camera.vAxis[0] = mainCam.up[0];
	Scene.Camera.vAxis[1] = mainCam.up[1];
	Scene.Camera.vAxis[2] = mainCam.up[2];

	Scene.Camera.nAxis[0] = -mainCam.forward[0];
	Scene.Camera.nAxis[1] = -mainCam.forward[1];
	Scene.Camera.nAxis[2] = -mainCam.forward[2];

	Scene.Camera.eyePt[0] = mainCam.position[0];
	Scene.Camera.eyePt[1] = mainCam.position[1];
	Scene.Camera.eyePt[2] = mainCam.position[2];


	Scene.traceImage();

	// trProg.result.float2int();

	myImg = Scene.imageBuffer.iBuf;

	// Enable texture unit0 for our use
	gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object we made in initTextures() to the target
	gl.bindTexture(gl.TEXTURE_2D, u_TextureLoc);
	// allocate memory and load the texture image into the GPU
	gl.texImage2D(gl.TEXTURE_2D, //  'target'--the use of this texture
	          0,                  //  MIP-map level (default: 0)
	          gl.RGB,           // GPU's data format (RGB? RGBA? etc)
	          imgXmax,            // image width in pixels,
	          imgYmax,            // image height in pixels,
	          0,                  // byte offset to start of data
	          gl.RGB,           // source/input data format (RGB? RGBA?)
	          gl.UNSIGNED_BYTE, // data type for each color channel       
	          myImg);        // data source.
	// Set the WebGL texture-filtering parameters
	gl.texParameteri(gl.TEXTURE_2D,   // texture-sampling params: 
	          gl.TEXTURE_MIN_FILTER, 
	          gl.LINEAR);
}






