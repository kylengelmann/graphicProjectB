


var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For the VBOs & Shaders:-----------------
// preview = new VBObox1();		// For WebGLpreview: holds one VBO and its shaders
// rayView = new VBObox3();		// for displaying the ray-tracing results.

var fov = 60;

var near = .3;
var far = 2000;

var mainCam = new Camera(fov, 1, near, far);


var g_last = Date.now();



var imgXmax = 256;
var imgYmax = 256;

// var Scenes[0] = new CScene();

var antiAliase = false;

var mMat = new Matrix4();

var mirrorScale = Float32Array.from([1, 1, 1]);
var scaleDiff = .02;

var n = 1.522;

var hexPath = "./hexNorm.jpeg"

var busy = false;

var tracing = false;

var currentScene = 0;

var Scenes = [new CScene(), new CScene()];

var mirrorSphere;

function initScene0(){

	Scenes[0].Camera.setPix(imgXmax, imgYmax);
	Scenes[0].imageBuffer = new CImgBuf(imgYmax, imgXmax);


	glassMat = new Material(refractiveShader);
	glassMat.n = n;
	glassMat.color = vec3.fromValues(.98, 1, .985);
	glassMat.reflectRatio = 0;
	glassMat.spec = 1;
	glassMat.k = 100;

	var glassSphere = new raySphere(glassMat);
	glassSphere.translate([-1.5, 1.5, 1.1]);
	glassSphere.scale([1, 1, 1]);
	glassSphere.castShadows = false;

	var glass2 = new raySphere(glassMat);
	glass2.translate([-3, 1.5, 1.1]);
	glass2.scale([1, 1, 1]);
	glass2.castShadows = false;

	var lens = new rayIntersect(glassMat, glass2, glassSphere);
	// lens.scale([3, 3, 3]);
	// glassSphere.material.n = n;

	Scenes[0].Geometry.push(lens);



	greenMat = new Material(diffuseShader);
	greenMat.diffuse = .7;
	greenMat.ambient = .3;
	greenMat.color = vec3.fromValues(.1, 1, .1);
	var greenCube = new rayCube(greenMat);
	greenCube.translate([3, 3, 1.1]);
	greenCube.scale([.3, .3, .3]);
	greenCube.castShadows = false;

	Scenes[0].Geometry.push(greenCube);

	var cubeGlass = new raySphere(glassMat);
	cubeGlass.translate([3, 3, 1.1]);
	cubeGlass.scale([1.3, 1.3, 1.3]);
	cubeGlass.castShadows = false;

	Scenes[0].Geometry.push(cubeGlass);


	blueMat = new Material(diffuseShader);
	blueMat.diffuse = .7;
	blueMat.ambient = .3;
	blueMat.color = vec3.fromValues(.1, .1, 1);
	var blueCube = new rayCube(blueMat);
	blueCube.translate([-2, 4, 1.1]);

	Scenes[0].Geometry.push(blueCube);



	var redSphere = new raySphere(sphereMat);
	sphereMat.softShadows = true;
	// sphereMat.castShadows = false;
	redSphere.translate([1, 1, 1.1]);
	// whiteSphere.castShadows = false;
	// redSphere.castShadows = false;

	Scenes[0].Geometry.push(redSphere);


	mirrorSphere = new raySphere(mirrorMat);
	mirrorSphere.translate([-1, -1, 1.1]);

	Scenes[0].Geometry.push(mirrorSphere);

	var ms2 = new raySphere(mirrorMat);
	ms2.translate([-2.5, -2.5, 1.1]);
	ms2.scale([.7, .7, .7]);

	Scenes[0].Geometry.push(ms2);


	var glassCube = new rayCube(glassMat);
	glassCube.castShadows = false;

	glassCube.translate([2, -1, 1.1]);
	Scenes[0].Geometry.push(glassCube);

	var glassCube2 = new rayCube(glassMat);
	glassCube2.castShadows = false;

	glassCube2.translate([0, 1, 4]);
	glassCube2.rotate(30, [1, 0, 0]);
	glassCube2.rotate(20, [0, 0, 1]);
	glassCube2.scale([1, 1, .2]);
	Scenes[0].Geometry.push(glassCube2);


	var plane = new rayGrid(gridMat);
	gridMat.softShadows = true;
	plane.castShadows = true;

	Scenes[0].Geometry.push(plane);


	Scenes[0].lights.push(new Light([.87, .84, .8], [0, 0, -1, 0]));
	Scenes[0].lights.push(new Light([1, 1,1], [0, 0, 4, 1]));

	makeRayTex(Scenes[0].imageBuffer);
}

function initScene1() {
	Scenes[1].Camera.setPix(imgXmax, imgYmax);
	Scenes[1].imageBuffer = new CImgBuf(imgYmax, imgXmax);

	shellMat = new Material(shellShader);
	shellMat.mat = [mirrorMat, sphereMat];

	var shellCube = new rayCube(shellMat);
	shellCube.translate([1, -1, 1.1]);
	shellCube.scale([.45, .45, .6]);
	shellCube.rotate(30, [1, 0, 0]);
	shellCube.rotate(30, [0, 1, 0]);
	// whiteCube.castShadows = false;

	Scenes[1].Geometry.push(shellCube);


	var marbleCube = new rayCube(perlinMat);
	// glassSphere2.scale([3, 3, 3]);
	marbleCube.translate([1, 1, .9]);
	marbleCube.scale([.8, .8, .8]);
	perlinMat.softShadows = false;
	// glassSphere2.castShadows = false;
	// glassSphere.material.n = n;

	Scenes[1].Geometry.push(marbleCube);

	var cloud1 = new raySphere(cloudMat);
	cloud1.translate([-1000, 0, 200]);
	cloud1.scale([150, 200, 150]);
	cloud1.castShadows = false;
	cloudMat.softShadows = false;
	Scenes[1].Geometry.push(cloud1);

	var cloud2 = new raySphere(cloudMat);
	cloud2.translate([300, 1000, 300]);
	cloud2.scale([250, 150, 150]);
	// cloud2.rotate(45, [0, 0, 1]);
	cloud2.castShadows = false;
	Scenes[1].Geometry.push(cloud2);

	var cloud3 = new raySphere(cloudMat);
	cloud3.translate([-200, 800, 200]);
	cloud3.scale([230, 150, 170]);
	// cloud2.rotate(45, [0, 0, 1]);
	cloud3.castShadows = false;
	Scenes[1].Geometry.push(cloud3);

	var cloud4 = new raySphere(cloudMat);
	cloud4.translate([-800, 800, 600]);
	cloud4.scale([260, 230, 170]);
	// cloud2.rotate(45, [0, 0, 1]);
	cloud4.castShadows = false;
	Scenes[1].Geometry.push(cloud4);


	var mc1 = new rayCube(mirrorMat);
	mc1.translate([-2, -1, 1.1]);
	mc1.rotate(-15, [0, 0, 1]);
	Scenes[1].Geometry.push(mc1)

	var mc2 = new rayCube(mirrorMat);
	mc2.translate([-2, 2, 1.1]);
	// mc2.rotate(-45, [0, 0, 1]);
	Scenes[1].Geometry.push(mc2);


	var egg = new raySphere(eggMat);
	egg.translate([4, -1, 1.2]);
	egg.scale([.65, .65, .8])
	eggMat.softShadows = false

	Scenes[1].Geometry.push(egg);

	var lens0 = new raySphere(glassMat);
	lens0.translate([0, -4, .5]);
	// lens0.scale([, , ]);

	var lens1 = new rayCube(glassMat);
	lens1.translate([0, -5, 1.1]);

	var lens = new rayIntersect(glassMat, lens0, lens1);
	lens.translate([0, 0, 1])

	Scenes[1].Geometry.push(lens);


	var plane = new rayGrid(gridMat);
	gridMat.softShadows = true;
	plane.castShadows = true;

	Scenes[1].Geometry.push(plane);

	Scenes[1].lights.push(new Light([.87, .84, .8], [0, 0, -1, 0]));
	Scenes[1].lights.push(new Light([1, 1,1], [0, 0, 4, 1]));

}


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

	mainCam.setPosition([0, 0, 5]);

	Keys.init(gl, g_canvasID);
	gl.clearColor(0.2, 0.2, 0.2, 1);

	// Initialize each of our 'vboBox' objects: 
	grid.renderer.init(gl, grid.attrs, 7, grid.unifs, gl.STATIC_DRAW);		// VBO + shaders + uniforms + attribs for WebGL grid
	rayview.renderer.init(gl, rayview.attrs, 4, rayview.unifs, gl.STATIC_DRAW);		//  "		"		" to display ray-traced on-screen result.
	sphere.renderer.init(gl, sphere.attrs, 12, sphere.unifs, gl.STATIC_DRAW);
	cube.renderer.init(gl, cube.attrs, 12, cube.unifs, gl.STATIC_DRAW);


	sphere.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);

	mMat.invert();
	mMat.transpose();
	sphere.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	sphere.renderer.setVec3(gl, 'u_lightPos', [0, 0, -1]);


	cube.renderer.setVec4(gl, 'u_Color', [1, 0, 0, 1]);

	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.setVec3(gl, 'u_lightPos', [0, 0, -1]);


	mMat.setTranslate(0, 0, 0);

	grid.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);

	mainCam.setRotation(-90, 1, 0, 0);
	Controls.camAngles[0] = -90;

	u_TextureLoc = gl.createTexture();

	rayview.renderer.setInt(gl, 'u_Sampler', 0);

	// Scenes[0].Camera.setPix(imgXmax, imgYmax);
	// Scenes[0].imageBuffer = new CImgBuf(imgYmax, imgXmax);

	
	


	initScene0();



	initScene1();







	// makeRayTex(Scenes[0].imageBuffer);

	var tick = function() {
		var now = Date.now();
	    var dt = (now - g_last)*.001;
	    g_last = now;

	    if(Keys.keyboard['t'].down) {
	    	trace(tick);
	    }
	    if(Keys.keyboard['r'].down) {
	    	if(antiAliase == true) {
	    		 Scenes[0].imageBuffer.antiAliasing = 0;
	    		 Scenes[1].imageBuffer.antiAliasing = 0;
	    	}
	    	else {
	    		 Scenes[0].imageBuffer.antiAliasing = 4;
	    		 Scenes[1].imageBuffer.antiAliasing = 4;
	    	}
	    	antiAliase = !antiAliase;
	    }
	    if(Keys.keyboard['f'].down) {
	    	sphereMat.softShadows = !sphereMat.softShadows;
	    	gridMat.softShadows = !gridMat.softShadows;
	    	perlinMat.softShadows = !perlinMat.softShadows;
	    }
	    if(Keys.keyboard['z'].down){
	    	 Scenes[0].lights[0].on = ! Scenes[0].lights[0].on;
	    	 Scenes[1].lights[0].on = ! Scenes[1].lights[0].on;
	    }
	    if(Keys.keyboard['x'].down){
	    	 Scenes[0].lights[1].on = ! Scenes[0].lights[1].on;
	    	 Scenes[1].lights[1].on = ! Scenes[1].lights[1].on;
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
	    if(Keys.keyboard['space'].down) {
	    	currentScene = (currentScene + 1)%2;
	    }
	    if(Keys.keyboard['1'].down){
	    	MAX_RECURSE = 1;
	    }
	    if(Keys.keyboard['2'].down){
	    	MAX_RECURSE = 2;
	    }
	    if(Keys.keyboard['3'].down){
	    	MAX_RECURSE = 3;
	    }
	    if(Keys.keyboard['4'].down){
	    	MAX_RECURSE = 4;
	    }
	    if(Keys.keyboard['5'].down){
	    	MAX_RECURSE = 5;
	    }
	    if(Keys.keyboard['6'].down){
	    	MAX_RECURSE = 6;
	    }
	    if(Keys.keyboard['7'].down){
	    	MAX_RECURSE = 7;
	    }
	    if(Keys.keyboard['8'].down){
	    	MAX_RECURSE = 8;
	    }
	    if(Keys.keyboard['9'].down){
	    	MAX_RECURSE = 9;
	    }
	    if(Keys.keyboard['0'].down){
	    	MAX_RECURSE = 10;
	    }
	    mirrorSphere.identity();
	    mirrorSphere.translate([-1, -1, mirrorScale[2] + .1])
	    mirrorSphere.scale(mirrorScale);

	    Controls.updateCamera(mainCam, Keys, dt);

	    grid.renderer.setMat4(gl, 'u_viewMatrix', mainCam.viewMat.elements);
	    grid.renderer.setMat4(gl, 'u_projMatrix', mainCam.projMat.elements);
	    sphere.renderer.setMat4(gl, 'u_viewMatrix', mainCam.viewMat.elements);
	    sphere.renderer.setMat4(gl, 'u_projMatrix', mainCam.projMat.elements);

	    cube.renderer.setMat4(gl, 'u_viewMatrix', mainCam.viewMat.elements);
	    cube.renderer.setMat4(gl, 'u_projMatrix', mainCam.projMat.elements);

		Keys.updateAtEnd();
		drawAll();

		if(tracing == false) {
			requestAnimationFrame(tick, g_canvasID);
		}
	};
	tick();
}

function drawScene0() {

	sphere.renderer.setVec4(gl, 'u_Color', [1, 0, 0, 1]);
	mMat.setTranslate(1, 1, 1.1);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	sphere.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	mMat.setTranslate(-1, -1, mirrorScale[2] + .1);
	mMat.scale(mirrorScale[0], mirrorScale[1], mirrorScale[2])
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-2.5, -2.5, 1.1)
	mMat.scale(.7, .7, .7);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-1.5, 1.5, 1.1);
	// mMat.scale(1, 1.5, .7);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);
	mMat.setTranslate(-3, 1.5, 1.1);
	// mMat.scale(1, 1.5, .7);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(3, 3, 1.1);
	mMat.scale(1.3,1.3,1.3);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(2, -1, 1.1);

	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(0, 1, 4);
	mMat.rotate(30, 1, 0, 0);
	mMat.rotate(20, 0, 0, 1);
	mMat.scale(1, 1, .2);


	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);


	mMat.setTranslate(-2, 4, 1.1);


	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [.1, .1, 1, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);

}

function drawScene1() {
	mMat.setTranslate(1, -1, 1.1);

	mMat.scale(.45, .45, .6);
	mMat.rotate(30, 1, 0, 0);
	mMat.rotate(30, 0, 1, 0);

	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [1, 0, 0, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);

	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);



	mMat.setTranslate(1, 1, .9);
	mMat.scale(.8, .8, .8);

	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-2, 2, 1.1);

	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-2, -1, 1.1);
	mMat.rotate(-15, 0, 0, 1);

	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(0, -5, 2.1);

	mMat.translate(-1, -1, -1);
	mMat.scale(2, 2, 2);


	cube.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	mMat.invert();
	mMat.transpose();
	cube.renderer.setMat4(gl, 'u_invTranspose', mMat.elements);
	cube.renderer.draw(gl, gl.TRIANGLES);


	mMat.setTranslate(0, -4, .5);
	sphere.renderer.setVec4(gl, 'u_Color', [1, 1, 1, 1]);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);


	mMat.setTranslate(-1000, 0, 200);
	mMat.scale(150, 200, 150);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(300, 1000, 300);
	mMat.scale(250, 150, 150);
	// mMat.rotate(45, 0, 0, 1);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-200, 800, 200);
	mMat.scale(230, 150, 170);
	// mMat.rotate(45, 0, 0, 1);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	mMat.setTranslate(-800, 800, 600);
	mMat.scale(260, 230, 170);
	// mMat.rotate(45, 0, 0, 1);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);

	// mMat.setTranslate(-4, -2, 0);
	// mMat.scale(7, 7,7);
	// // mMat.rotate(45, 0, 0, 1);
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);

	// mMat.setTranslate(0, 0, 10);
	// mMat.scale(4, 4,1);
	// // mMat.rotate(45, 0, 0, 1);
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);


	mMat.setTranslate(4, -1, 1.2);
	mMat.scale(.65, .65, .8);
	// mMat.rotate(45, 0, 0, 1);
	sphere.renderer.setVec4(gl, 'u_Color', [.7, .8, 1, 1]);
	sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	sphere.renderer.draw(gl, gl.TRIANGLES);


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

	if(currentScene == 0) drawScene0();
	else drawScene1();

	// mMat.setTranslate(1, 1, 1.1);
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);

	// mMat.setTranslate(-1, -1, mirrorScale[2] + .1);
	// mMat.scale(mirrorScale[0], mirrorScale[1], mirrorScale[2])
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);

	// mMat.setTranslate(-1.5, 1.5, 1.1);
	// // mMat.scale(1, 1.5, .7);
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);
	// mMat.setTranslate(-3, 1.5, 1.1);
	// // mMat.scale(1, 1.5, .7);
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);

	// // mMat.setTranslate(-3,2, 1.1, 3.2);
	// // mMat.scale(.5, .5, .5);
	// // sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// // sphere.renderer.draw(gl, gl.TRIANGLES);

	// mMat.setTranslate(3, 3, 1.1);
	// sphere.renderer.setMat4(gl, 'u_modelMatrix', mMat.elements);
	// sphere.renderer.draw(gl, gl.TRIANGLES);
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
	 Scenes[0].Camera.setPerspective(fov, aspect, near, far);
	  Scenes[1].Camera.setPerspective(fov, aspect, near, far);
}


function trace(tick) {


	 Scenes[currentScene].Camera.uAxis[0] = mainCam.right[0];
	 Scenes[currentScene].Camera.uAxis[1] = mainCam.right[1];
	 Scenes[currentScene].Camera.uAxis[2] = mainCam.right[2];

	 Scenes[currentScene].Camera.vAxis[0] = mainCam.up[0];
	 Scenes[currentScene].Camera.vAxis[1] = mainCam.up[1];
	 Scenes[currentScene].Camera.vAxis[2] = mainCam.up[2];

	 Scenes[currentScene].Camera.nAxis[0] = -mainCam.forward[0];
	 Scenes[currentScene].Camera.nAxis[1] = -mainCam.forward[1];
	 Scenes[currentScene].Camera.nAxis[2] = -mainCam.forward[2];

	 Scenes[currentScene].Camera.eyePt[0] = mainCam.position[0];
	 Scenes[currentScene].Camera.eyePt[1] = mainCam.position[1];
	 Scenes[currentScene].Camera.eyePt[2] = mainCam.position[2];


	 Scenes[currentScene].traceImage(tick);

	// trProg.result.float2int();

	makeRayTex(Scenes[currentScene].imageBuffer);

	// myImg = Scenes[0].imageBuffer.iBuf;

	// // Enable texture unit0 for our use
	// gl.activeTexture(gl.TEXTURE0);
	// // Bind the texture object we made in initTextures() to the target
	// gl.bindTexture(gl.TEXTURE_2D, u_TextureLoc);
	// // allocate memory and load the texture image into the GPU
	// gl.texImage2D(gl.TEXTURE_2D, //  'target'--the use of this texture
	//           0,                  //  MIP-map level (default: 0)
	//           gl.RGB,           // GPU's data format (RGB? RGBA? etc)
	//           imgXmax,            // image width in pixels,
	//           imgYmax,            // image height in pixels,
	//           0,                  // byte offset to start of data
	//           gl.RGB,           // source/input data format (RGB? RGBA?)
	//           gl.UNSIGNED_BYTE, // data type for each color channel       
	//           myImg);        // data source.
	// // Set the WebGL texture-filtering parameters
	// gl.texParameteri(gl.TEXTURE_2D,   // texture-sampling params: 
	//           gl.TEXTURE_MIN_FILTER, 
	//           gl.LINEAR);
}



function makeRayTex(imgBuf) {
	// Enable texture unit0 for our use
	gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object we made in initTextures() to the target
	gl.bindTexture(gl.TEXTURE_2D, u_TextureLoc);
	// allocate memory and load the texture image into the GPU
	gl.texImage2D(gl.TEXTURE_2D, //  'target'--the use of this texture
	          0,                  //  MIP-map level (default: 0)
	          gl.RGB,           // GPU's data format (RGB? RGBA? etc)
	          imgBuf.xSiz,            // image width in pixels,
	          imgBuf.ySiz,            // image height in pixels,
	          0,                  // byte offset to start of data
	          gl.RGB,           // source/input data format (RGB? RGBA?)
	          gl.UNSIGNED_BYTE, // data type for each color channel       
	          imgBuf.iBuf);        // data source.
	// Set the WebGL texture-filtering parameters
	gl.texParameteri(gl.TEXTURE_2D,   // texture-sampling params: 
	          gl.TEXTURE_MIN_FILTER, 
	          gl.LINEAR);
}







