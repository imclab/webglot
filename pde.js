/* Copyright (c) 2009-2010 King Abdullah University of Science and Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* This class encapsulates the flow primitive.
 */
function pde(string, options) {
	
	this.gl   = null;
	this.f    = string;
	
	/* This is one way in which the WebGL implementation of OpenGLot
	 * differs greatly from the C++ implementatiln.  WebGL (OpenGL 
	 * ES 2.0) does not support display lists, and instead I've moved
	 * the implementation to use vertex-buffer objects.  These are
	 * those.
	 */
	this.vertexVBO  = null;
	this.textureVBO = null;
	this.indexVBO   = null;
	
	/* A more apt name might be "resolution," as count is the number
	 * of samples along each axis (x and y) samples are taken. Being
	 * set to 100 means that it will produce 2 * 100 * 100 triangles.
	 */
	this.count      = 15;
	this.index_ct   = 0;
	
	this.tmp    = null;
	this.ping   = null;
	this.pong   = null;
	this.fbo    = null;
	this.rb     = null;
	
	this.parameters = null;
	
	this.width  = 0;
	this.height = 0;
	this.level  = 0;
	
	this.calc_program = null;
	
	this.texture = null;

	/* This will likely be depricated, but it currently is hidden from
	 * the end programmer.
	 */
	this.initialize = function(gl, scr, parameters) {
		this.width  = scr.width ;
		this.height = scr.height;
		this.parameters = parameters;
		this.gl = gl;
		this.refresh(scr);
		this.gen_program();
	}
	
	/* Refresh is a way for the grapher instance to notify surface of
	 * changes to the viewing environment.  All the new information is
	 * contained in the screen object passed in, including the minimum
	 * and maximum x and y values for the surface. In the 3D implemen-
	 * tation, it's not commonly-used.
	 */
	this.refresh = function(scr) {
		this.gen_vbo(scr);
		
		if (this.ping) {
			// Delete texture
		}
		
		if (this.pong) {
			// Delete texture
		}

        f = function(pixels) {
            var count = scr.width * scr.height * 4;
            for (var i = 0; i < count; i += 4) {
                pixels[i] = ((i + Math.floor(i / 50)) % 256) / 256.0;
                
                //pixels[i] = 1.0;
            }
            return pixels;
        }
        
		this.ping = new emptytexture(this.gl, scr.width, scr.height);
		this.pong = new emptytexture(this.gl, scr.width, scr.height);
		
		// this.ping = new ftexture(this.gl, this.width, this.height, f, this.gl.RGBA);
		// this.pong = new ftexture(this.gl, this.width, this.height, f, this.gl.RGBA);
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
				
		this.fbo = this.gl.createFramebuffer();
	}

	/* All primitives are responsible for knowing how to construct them-
	 * selves and so this is the function that constructs the VBO for
	 * the objects.
	 */
	this.gen_vbo = function(scr) {
    	/* A   C
    	 * |  /|
    	 * | / |
    	 * |/  |
    	 * B   D */
        var vertices = [scr.minx, scr.miny, scr.minx, scr.maxy, scr.maxx, scr.miny, scr.maxx, scr.maxy];
    	var texture = [0, 0, 0, 1, 1, 0, 1, 1];
   		var indices  = [0, 1, 2, 3];
		
		this.vertexVBO = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexVBO);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

		this.textureVBO = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVBO);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texture), this.gl.STATIC_DRAW);
		
		this.indexVBO = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
		
		this.index_ct = indices.length;
	}
	
	this.calculate = function(scr) {
		this.setUniforms(scr, this.calc_program);
		
        this.gl.uniform1i(this.gl.getUniformLocation(this.calc_program, "uSampler"), 0);
		this.gl.uniform1f(this.gl.getUniformLocation(this.calc_program, "width") , scr.width);
		this.gl.uniform1f(this.gl.getUniformLocation(this.calc_program, "height"), scr.height);
		
		this.gl.enableVertexAttribArray(0);
		this.gl.enableVertexAttribArray(1);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexVBO);
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0);
		
		// More texture support
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVBO);
		this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0);
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
		
		this.gl.viewport(0, 0, scr.width, scr.height);
		// First, set up Framebuffer we'll render into
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.ping, 0);
		//this.gl.enable(this.gl.TEXTURE_2D);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.pong);
		this.checkFramebuffer();
        
		// Then drawing the triangle strip using the calc program
		this.gl.drawElements(this.gl.TRIANGLE_STRIP, this.index_ct, this.gl.UNSIGNED_SHORT, 0);
		
		this.gl.disableVertexAttribArray(0);
		this.gl.disableVertexAttribArray(1);
		
		var tmp  = this.ping;
		this.ping = this.pong;
		this.pong = tmp;
	}
	
	/* Every primitive is also responsible for knowing how to draw itself,
	 * and that behavior is encapsulated in this function. It should be 
	 * completely self-contained, returning the context state to what it
	 * was before it's called.
	 */
	this.draw = function(scr) {
    	this.calculate(scr);
    	this.calculate(scr);
    	this.calculate(scr);
		this.calculate(scr);
		
		this.setUniforms(scr, this.program);
		this.gl.uniform1i(this.gl.getUniformLocation(this.program, "uSampler"), 0);
		this.gl.viewport(0, 0, scr.width, scr.height);
		
		this.gl.enableVertexAttribArray(0);
		this.gl.enableVertexAttribArray(1);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexVBO);
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0);
		
		// More texture support
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureVBO);
		this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, this.gl.FALSE, 0, 0);
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
		
		// Now, render into the normal render buffer, referencing
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		
		// the recently-drawn texture
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.ping);
		this.gl.drawElements(this.gl.TRIANGLE_STRIP, this.index_ct, this.gl.UNSIGNED_SHORT, 0);
		
		this.gl.disableVertexAttribArray(0);
		this.gl.disableVertexAttribArray(1);
		
	}
	
	/* Any class who inherits from the primitive class gets free access
	 * to shader compilation and program linking, but only must provide
	 * the fragment and vertex shader sources.  The primitive class also
	 * provides free access to functionality for reading files.
	 */
	this.gen_program = function() {
		//*
		var vertex_source = this.read("shaders/pde.vert");//.replace("USER_FUNCTION", this.f);
		var frag_source   = this.read("shaders/pde.calc.frag");//.replace("USER_FUNCTION", this.f);
		//*/
		
		this.calc_program = this.compile_program(vertex_source, frag_source, { "position": 0, "aTextureCoord": 1 });
		
		frag_source	= this.read("shaders/pde.frag");
		
		this.program = this.compile_program(vertex_source, frag_source, { "position": 0, "aTextureCoord": 1 });
	}
}

pde.prototype = new primitive();
