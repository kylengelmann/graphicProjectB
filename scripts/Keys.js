class Key {
	constructor(){
		this.down = false;
		this.pressed = false;
		this.up = false;
	}
	update(){
		this.down = false;
		this.up = false;
	}
};

class Mouse {
	constructor(){
		this.down = false;
		this.pressed = false;
		this.up = false;
		this.dx = 0.0;
		this.dy = 0.0
		this.pos = new Float32Array(2);
		this.dragged = false;
	}

	update() {
		if(!this.dragged && this.pressed) {
			this.dx = 0.0;
			this.dy = 0.0;
			this.dragged = false;
		}
	}
};


var Keys = new class {

	constructor() {
		this.keyboard = {};
		for(var  i = 0; i < 255; i++) {
			var c = this.keyName(i);
			this.keyboard[c] = new Key();
		}
		this.mouse = new Mouse();
	}

	keyName(kc) {
		var c;
		switch(kc) {
			case 32:
				c = "space";
				break;
			case 16:
				c = "shift_l";
				break;
			case 37:
				c = "left_arrow";
				break;
			case 38:
				c = "up_arrow";
				break;
			case 39:
				c = "right_arrow";
				break;
			case 40:
				c = "down_arrow";
				break;
			default :
				c = String.fromCharCode(kc).toLowerCase();
		}
		return c;
	}


	init(gl, canvas) {
		window.addEventListener("keydown", this.keyDown, false);
		window.addEventListener("keyup", this.keyUp, false);

		this.canvas = canvas;
		this.gl = gl;

		canvas.onmousedown = function(ev){Keys.mouseDown(ev, Keys.gl, Keys.canvas)}; 
  
            // when user's mouse button goes down call mouseDown() function
		canvas.onmousemove = function(ev){Keys.mouseMove(ev, Keys.gl, Keys.canvas)};
		  
		                      // call mouseMove() function          
		canvas.onmouseup = function(ev){Keys.mouseUp(ev, Keys.gl, Keys.canvas)};
	}

	keyDown(ev) {
		var c = Keys.keyName(ev.keyCode);

		if([32, 37, 38, 39, 40].indexOf(ev.keyCode) > -1) {
	        ev.preventDefault();
	    }

		Keys.keyboard[c].down = true;
		Keys.keyboard[c].pressed = true;
	}

	keyUp(ev) {
		var c = Keys.keyName(ev.keyCode);
		Keys.keyboard[c].up = true;
		Keys.keyboard[c].pressed = false;
	}

	mouseDown(ev, gl, canvas) {
		var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
		var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
		var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

		var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
		             (canvas.width/2);      // normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
		             (canvas.height/2);
		
		Keys.mouse.down = true;                      // set our mouse-dragging flag
		Keys.mouse.pressed = true;
		Keys.mouse.pos[0] = x;                         // record where mouse-dragging began
		Keys.mouse.pos[1] = y;
	}

	mouseMove(ev, gl, canvas) {

		// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
		var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
		var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

		var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
		             (canvas.width/2);      // normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
		             (canvas.height/2);

		var xd = (x - Keys.mouse.pos[0]);
		var yd = (y - Keys.mouse.pos[1]);
		Keys.mouse.dx = xd         // Accumulate change-in-mouse-position,&
		Keys.mouse.dy = yd


		Keys.mouse.pos[0] = x;                         // record where mouse-dragging began
		Keys.mouse.pos[1] = y;
	}

	mouseUp(ev, gl, canvas) {
		var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
		var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
		var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
		var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
		             (canvas.width/2);      // normalize canvas to -1 <= x < +1,
		var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
		             (canvas.height/2);
		// console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
		
		// accumulate any final bit of mouse-dragging we did:
		var xd = (x - Keys.mouse.pos[0]);
		var yd = (y - Keys.mouse.pos[1]);
		Keys.mouse.dx = xd         // Accumulate change-in-mouse-position,&
		Keys.mouse.dy = yd

		Keys.mouse.up = true;                      // set our mouse-dragging flag
		Keys.mouse.pressed = false;

		// if(xMdragTot == 0 && yMdragTot == 0) clicked();
		// xMdragTot = 0;
		// yMdragTot = 0;
	}

	updateAtEnd(){
		for(var key in this.keyboard) {
			this.keyboard[key].update();
		}
		this.mouse.dx = 0.0;
		this.mouse.dy = 0.0;
	}
}();


