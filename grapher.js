// This class will encapsulate the grapher
function grapher() {

	this.scr = new screen();
	this.axes_dl = 0;
	this.grid_dl = 0;
	this.gl = null;

	this.getContext = function() {
		// It would seem that all this context stuff is handled in this,
		// so no need to fuss with things like getting glutContext, etc.
		// At least, that's my understanding at this point.
		var canvas = document.getElementById("glot");
	
		/* I hope that this works.  I'd like to be able to have a short
		 * handle for referencing the context for certain initialization
		 * things, but after that, I'd just like to have the "this.context"
		 * handle.  If WebGL behaves in the traditional OpenGL-manner,
		 * this SHOULD just be an integer, but I'm thinking now it might
		 * be ported to more of an object model.
		 */
	  //this.context = canvas.getContext("moz-webgl");\
		var gl = null;
	  try { 
	    if (!gl)
	      gl = canvas.getContext("moz-webgl");
	  } catch (e) { }

	  try { 
	    if (!gl)
	      gl = canvas.getContext("webkit-3d");
	  } catch (e) { }

	  try { 
	    if (!gl)
	      gl = canvas.getContext("webgl");
	  } catch (e) { }

		try { 
	    if (!gl)
	      gl = canvas.getContext("experimental-webgl");
	  } catch (e) { }
	
		return gl;
	}

	this.initialize = function() {
	
		/* This is some initialization that the OpenGL / GLUT version of
		 * openGLot did programatically after creating the context. But,
		 * in WebGL, they are passed in as parameters into the initial-
		 * ization phase, but I'm not yet sure as to the syntax.  Add this
		 * in for later versions.  Provisionally disabled.
		 */
		/*
		// Set the color mode (double with alpha)
		glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGBA);
		// Set the window size and position
		glutInitWindowSize(scr.width, scr.height);
		glutInitWindowPosition(0, 0);
		// Title the window
		glutCreateWindow("Glot");
		*/
	
		var gl = this.getContext();

	  if (!gl) {
	    alert("Can't find a WebGL context; is it enabled?");
	    return null;
	  }

		/* There is a slight, but unititive syntactic change between OpenGL
		 * and WebGL.  glEnable becomes gl.enable, uncapitalizig the first
		 * character of the function call, and "gl." referes to the context
		 * provided by getContext()
		 */
		// Enable smoothness and blending
		gl.enable(gl.LINE_SMOOTH);
		gl.enable(gl.POINT_SMOOTH);
		gl.enable(gl.BLEND);
		gl.enable(gl.VERTEX_ARRAY);
		gl.enable(gl.DEPTH_TEST);
	
		// Other smoothness and blending options
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.hint(gl.LINE_SMOOTH_HINT, gl.DONT_CARE);
	
		// Set the line width and point size
		gl.lineWidth(1.5);
		//gl.pointSize(7);
	
		// Default color is white
		gl.clearColor(0.0, 0.0, 0.0, 0.5);

		// This was included in the webkit examples, but my JavaScript
		// is weak, and I'm not quite sure what exactly this means.
	  // Add a console
		var canvas = document.getElementById("glot");
	  gl.console = ("console" in window) ? window.console : { log: function() { } };
	
		/* The Provisional WebGL spec has something to say on maniuplating
		 * the view size programatically.  It's tied to the canvas element
		 * size, and certain conditions and post-conditions must be satis-
		 * fied, so proceed with caution.
		 *
		 * WARNING! Some primitives depend on screen having the properly-
		 * filled values in screen for determination of vertex positions.
		 * Thus, it is CRITICAL that this be dynamically queried at run-
		 * time so that this data can be accurate.
		 */
		this.scr.width = this.scr.height = 500;

		/* Again, it would seem that all the initialization heavy lifting
		 * is handled by the WebGL canvas initialization, so I don't think
		 * this line is required.
		 */
		// Initialize OpenGL
		// init_open_gl();
	
		/* The callback registration for WebGL is either not intuitive,
		 * undocumented, or unavailable to me.  As such, this is provision-
		 * ally removed from the WebGL implementation.
		 */
		// Register callback functions with GLUT
		/*
		glutReshapeFunc(reshape);
		glutDisplayFunc(display);
		glutKeyboardFunc(keyboard);
		glutMouseFunc(mouse);
		glutMotionFunc(motion);
		glutIdleFunc(idle);
		*/
	
		// Determine the axes and grid
		this.axes_dl = this.axes_dl_gen();
		//this.grid_dl = this.grid_dl_gen();
	
		// Shit.  Well, shit.
		/* I've not heard of / happened upon an extension wrangler for
		 * WebGL, and so I will have to figure out how to do this the 
		 * old-school, hardcore C way.  Consult Marcus for more details,
		 * though I think it is safe to assume for the time being that
		 * the required supported functions are available.
		 */
		/*
		glewInit();
	
		if (!(GLEW_ARB_vertex_shader && GLEW_ARB_fragment_shader && GLEW_EXT_geometry_shader4)) {
			printf("Not totally ready :( \n");
			exit(1);
		}
		*/
	
		this.framecount = 0;
	
		// Consult JavaScript timing documentation
		//wall.start();
	
		this.context = gl;
	
		// In the future, this ought to return some encoded value of success or failure.
		return 0;
	}

	this.axes_dl_gen = function() {
		var gl = this.getContext();
	
	  var geometryData = [ ];
		var textureData = [ ];
    var indexData = [ ];

    geometryData.push(this.scr.minx);
		geometryData.push(this.scr.miny);
    textureData.push(this.scr.minx);
		textureData.push(this.scr.miny);

    geometryData.push(this.scr.minx);
    geometryData.push(this.scr.maxy);
    textureData.push(this.scr.minx);
		textureData.push(this.scr.maxy);

    geometryData.push(this.scr.maxx);
    geometryData.push(this.scr.maxy);
    textureData.push(this.scr.maxx);
		textureData.push(this.scr.maxy);

    geometryData.push(this.scr.maxx);
    geometryData.push(this.scr.miny);
    textureData.push(this.scr.maxx);
		textureData.push(this.scr.miny);

		indexData.push(0);
		indexData.push(1);
		indexData.push(2);
		indexData.push(3);
		    
    var retval = { };

    retval.vertexObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, retval.vertexObject);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(geometryData), gl.STATIC_DRAW);

    retval.textureObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, retval.textureObject);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(textureData), gl.STATIC_DRAW);
    
    retval.numIndices = indexData.length;
    retval.indexObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, retval.indexObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new WebGLUnsignedShortArray(indexData), gl.STREAM_DRAW);
    
    return retval;
	}

	this.grid_dl_gen = function() {
		var gl = this.getContext();
		var dl = gl.genLists(1);
	
		glNewList(dl, GL_COMPILE);
	
			glColor4d(0.0, 0.0, 0.0, 0.14);
	
			glBegin(GL_LINES);
		
				// How does typecasting work in JavaScript?
				for ( var i = this.scr.miny; i <= this.scr.maxy; ++i) {
					glVertex3d(this.scr.minx, i, 1);
					glVertex3d(this.scr.maxx, i, 1);
				}
	
				for ( var i = this.scr.minx; i <= this.scr.maxx; ++i) {
					glVertex3d(i, this.scr.miny, 1);
					glVertex3d(i, this.scr.maxy, 1);
				}
		
			glEnd();
		
		glEndList();
	
		return dl;
	}

	this.display = function() {
		var gl = this.getContext();
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.enableVertexAttribArray(0);
		//gl.enableVertexAttribArray(1);
		//gl.enableVertexAttribArray(2);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.axes_dl.vertexObject);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 0, 0);

    //gl.bindBuffer(gl.ARRAY_BUFFER, this.axes_dl.textureObject);
    //gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 0, 0);

		/*
    gl.bindBuffer(gl.ARRAY_BUFFER, this.axes_dl.texCoordObject);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
		*/

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.axes_dl.indexObject);

		var mvMat_location = gl.getUniformLocation(gl.program, "u_modelViewMatrix");
		var prMat_location = gl.getUniformLocation(gl.program, "u_projectionMatrix");
		
		//console.log(gl.projectionMatrix.getAsWebGLFloatArray());
		
    gl.uniformMatrix4fv(mvMat_location, false, gl.modelviewMatrix.getAsWebGLFloatArray());
    gl.uniformMatrix4fv(prMat_location, false, gl.projectionMatrix.getAsWebGLFloatArray());

		gl.drawElements(gl.TRIANGLE_STRIP, this.axes_dl.numIndices, gl.UNSIGNED_SHORT, 0);
		
		gl.flush();

		// bind with 0, so, switch back to normal pointer operation
		/*
		gl.bindBuffer(gl.ARRAY_BUFFER_ARB, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER_ARB, 0);
		*/
		
		/* In this preliminary version, all options are temporarily defaulted
		 * to true.  List in the future iterations.
		 */
		/*
		// If Axes-drawing is enabled, draw them
		if (AXES_ON & display_options) {
			glCallList(axes_dl);
		}
	
		// If grid-drawing is enabled, draw it
		if (GRID_ON & display_options) {
			glCallList(grid_dl);
		}
		//*/

		// Determine timing stuff
		//float t = float(wall.time());
		//scr.time = wall.time();
	
		// For use in shader programs
		// GLint location;
	
		/* This section will require massive structural changes.  I think
		 * that JavaScript's dynamic typing will work to our advantage here
		 * but that's uncertain at this point.  I'm not sure if JavaScript
		 * supports inheritance (in which case the current model will likely
		 * suffice) or if there will even have to be any inheritance at all.
		 */
		/*
		map<primitive*, GLint>::iterator it;
		// For every curve, ...
		for (it = primitives.begin(); it != primitives.end(); ++it) {
		
			// Call it's shader program, defaulted to 0
			glUseProgram(it->first->p);
		
			location = glGetUniformLocation(it->first->p, "t");
		
			glUniform1f(location, t);
		
			glColor4d(it->first->c.r, it->first->c.g, it->first->c.b, it->first->c.a);
			// Call the actual draw list
			glCallList(it->second);
			//it->first->dl_gen(scr);
		
			// Re-set the shader program to 0
			glUseProgram(0);
		}
	
		list<point*>::iterator pit;
		glBegin(GL_POINTS);
			// For every point, ...
			for (pit = points.begin(); pit != points.end(); ++pit) {
				glColor4d((*pit)->c.r, (*pit)->c.g, (*pit)->c.b, (*pit)->c.a);
			
				// Draw the point
				glVertex3d((*pit)->x, (*pit)->y, (*pit)->z);
			}
		glEnd();
		*/
	
		/* From the initial reading of the WebGL spec, it seems like WebGL
		 * guarantees the swapping of buffers, and flushing, etc.
		 */
		// Finish up
		//glutSwapBuffers();
	}

	this.refresh_dls = function() {
		this.axes_dl = this.axes_dl_gen();
		//this.grid_dl = grid_dl_gen(); 
	}

	this.run = function() {
		/* How does MainLoop work in WebGL? */
		return 0; 
	}

	this.reshape = function() {
		var canvas = document.getElementById("glot");
		var context = this.getContext();
	
		var w = canvas.clientWidth;
		var h = canvas.clientHeight;
	
		/* If the width and height of the resized canvas are already
		 * the stored sizes, return and do nothing.
		 */
		if (w == this.scr.width && h == this.scr.height) {
			return;
		}

		context.projectionMatrix = new CanvasMatrix4();
		context.modelviewMatrix = new CanvasMatrix4();
	
		context.viewport(0, 0, w, h);

		/** Determine the new max x and y based on the
		  * current scale.  This does not shrink or expand
		  * the plot - only changes what's visible.
		  */
		this.scr.maxx = this.scr.minx + (this.scr.maxx - this.scr.minx) * w / this.scr.width;
		this.scr.maxy = this.scr.miny + (this.scr.maxy - this.scr.miny) * h / this.scr.height;

		// Set the projection
		context.projectionMatrix.ortho(this.scr.minx, this.scr.maxx, this.scr.miny, this.scr.maxy, -10, 10);

		// Re-calculate the draw lists if we've expanded the view
		if (w > this.scr.width || h > this.scr.height) {
			this.refresh_dls();
		}
	
		this.scr.width = w;
		this.scr.height = h;

		//glutPostRedisplay();
	}
	
	this.reshape2 = function() {
		var canvas = document.getElementById('glot');
		var ctx = this.getContext();

    width = canvas.clientWidth;
    height = canvas.clientHeight;
    
    ctx.viewport(0, 0, width, height);

    ctx.projectionMatrix = new CanvasMatrix4();
    ctx.projectionMatrix.lookat(0,0,6, 0, 0, 0, 0, 1, 0);
    ctx.projectionMatrix.perspective(30, width/height, 1, 10000);

		var scale = 1.0;
		var angle = 0.0;

		ctx.modelviewMatrix = new CanvasMatrix4();
		ctx.modelviewMatrix.scale(scale, scale, scale);
    ctx.modelviewMatrix.rotate(angle, 0,1,0);
    ctx.modelviewMatrix.rotate(30, 1,0,0);
	}
}