/* http://learningwebgl.com/blog/?p=507
 */
function emptytexture(context, width, height) {
	
	this.texture = null;
	this.image	 = null;
	
	this.gl			 = context;
	
	this.width  = 0;
	this.height = 0;

	this.initialize = function(width, height) {
		this.width  = width;
		this.height = height;
		
		this.texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

		var pixels = new Float32Array(width * height * 4);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.FLOAT, pixels);
		
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
	}
	
	this.bind = function() {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
	}
	
	this.initialize(width, height);
	
	return this.texture;
}