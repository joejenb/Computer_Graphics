let VSHADER_SOURCE =
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Normal;\n' + 
  'attribute vec2 a_Texcoord;\n' + 

  'uniform mat4 u_WorldMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +

  'varying vec3 v_Normal;\n' +
  'varying vec4 v_Position;\n' +
  'varying vec3 v_lamps_direction;\n' +
  'varying vec2 v_texcoord;\n' +

  'void main() {\n' +
  '  v_Position = u_WorldMatrix * vec4(a_Position, 1.0);;\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * v_Position;\n' +
  '  v_Normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '  v_lamps_direction = normalize((vec4(0,-1, 0, 1)).xyz);\n' +
  '  v_texcoord = a_Texcoord;\n' +
  '}\n';


let FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +

  'uniform vec3 u_LightColour;\n' +     
  'uniform vec3 u_AmbientColour;\n' +
  'uniform vec3 u_LightDirection;\n' + 
  'uniform vec3 u_Lamp1Colour;\n' +
  'uniform vec3 u_Lamp2Colour;\n' +
  'uniform vec3 u_Lamp3Colour;\n' +
  'uniform bool u_Lamps;\n' +

  'uniform vec4 u_Colour;\n' +
  'uniform vec4 u_Lamp1Position;\n' +
  'uniform vec4 u_Lamp2Position;\n' +
  'uniform vec4 u_Lamp3Position;\n' +
  'uniform sampler2D u_Texture;\n' +
  'uniform sampler2D u_Texture_Normal;\n' +
  'uniform bool u_Has_Normal;\n' +
  'uniform bool u_Has_Texture;\n' +

  'varying vec3 v_Normal;\n' +
  'varying vec4 v_Position;\n' +
  'varying vec3 v_lamps_direction;\n' +
  'varying vec2 v_texcoord;\n' +

  'void main() {\n' +
  '  float inner_lim = 1.0;\n' +
  '  float outer_lim = 0.8;\n' +

  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 surface = u_Colour.rgb;\n' +
  '  if (u_Has_Texture){\n' +
  '    surface = texture2D(u_Texture, v_texcoord).rgb;\n' +
  '  };\n' +
  '  if (u_Has_Normal){\n' +
  '    vec3 text_norm = texture2D(u_Texture_Normal, v_texcoord).rgb;\n' +
  '    normal = normalize(2.0 * (text_norm - 0.5));\n' +
  '  };\n' +
  '  vec3 lamp1_to_surface = normalize(u_Lamp1Position.xyz - v_Position.xyz);\n' +
  '  vec3 lamp2_to_surface = normalize(u_Lamp2Position.xyz - v_Position.xyz);\n' +
  '  vec3 lamp3_to_surface = normalize(u_Lamp3Position.xyz - v_Position.xyz);\n' +
  '  float lamp1_dir_norm = dot(lamp1_to_surface, -v_lamps_direction.xyz);\n' +
  '  float lamp2_dir_norm = dot(lamp2_to_surface, -v_lamps_direction.xyz);\n' +
  '  float lamp3_dir_norm = dot(lamp3_to_surface, -v_lamps_direction.xyz);\n' +
  '  float lamp1_fade = smoothstep(outer_lim, inner_lim, lamp1_dir_norm);\n' +
  '  float lamp2_fade = smoothstep(outer_lim, inner_lim, lamp2_dir_norm);\n' +
  '  float lamp3_fade = smoothstep(outer_lim, inner_lim, lamp3_dir_norm);\n' +

  '  float direct_intensity = max(dot(normal, u_LightDirection), 0.0);\n' +
  '  float lamp1_intensity = dot(normal, lamp1_to_surface);\n' + 
  '  float lamp2_intensity = dot(normal, lamp2_to_surface);\n' + 
  '  float lamp3_intensity = dot(normal, lamp3_to_surface);\n' + 

  '  vec3 ambient = u_AmbientColour * surface;\n' +
  '  vec3 direct_diffuse = u_LightColour * surface * direct_intensity;\n' +
  '  vec3 lamp1_diffuse = u_Lamp1Colour * surface * lamp1_fade * lamp1_intensity;\n' +
  '  vec3 lamp2_diffuse = u_Lamp2Colour * surface * lamp2_fade * lamp2_intensity;\n' +
  '  vec3 lamp3_diffuse = u_Lamp3Colour * surface * lamp3_fade * lamp3_intensity;\n' +
  '  vec3 total_diffuse = direct_diffuse + ambient;\n' +
  '  if (u_Lamps){\n' +
  '    total_diffuse += lamp1_diffuse + lamp2_diffuse + lamp3_diffuse;\n' +
  '  };\n' +
  '  gl_FragColor = vec4(total_diffuse, 1.0);\n' +
  '}\n';


let node = function(localMatrix){
	this.localMatrix = localMatrix || new Matrix4();
	this.worldMatrix = new Matrix4();
};

node.prototype.updateSystem = function(parentSystem){
	if (parentSystem){
		p_s = new Matrix4(parentSystem);
		this.worldMatrix = new Matrix4(p_s.multiply(this.localMatrix));
	} else{
		this.worldMatrix = new Matrix4(this.localMatrix);
	}

	if (this.children){
		for (var child of this.children){
			child.updateSystem(this.worldMatrix);
		};
	}
};

node.prototype.set_parent = function(parent_node, parent_children){
	this.parent_node = parent_node;
};

node.prototype.set_children = function(children){
	this.children = children;
	children.forEach(function(child) {
		child.set_parent(this);
	});
};

node.prototype.set_texture = function(texture, texture_norm){
	this.texture = texture;
	this.texture_norm = texture_norm || false;
	if (this.children){
		this.children.forEach(function(child){
			child.set_texture(texture, texture_norm);
		});
	};
};

node.prototype.set_colour = function(r, g, b, a){
	this.colour = new Vector4([r, g, b, a]);
	if (this.children){
		this.children.forEach(function(child){
			child.set_colour(r, g, b, a);
		});
	};
};

node.prototype.draw = function(gl, n){
	if (this.children){
		this.children.forEach(function(child){
			child.draw(gl, n);
		});
	} else{
		drawbox(gl, this.worldMatrix, n, this.texture, this.texture_norm, this.colour);
	}
};


let textures = [];

let ANGLE_STEP = 2.0;  
let x_angle = 0.0;		 
let y_angle = 160.0;		 
let camera_loc = [0.0, 25.0, 100.0];
let sun_node = new node();


function main() {
	let canvas = document.getElementById('webgl');
	size_to_screen(canvas);
	let gl = getWebGLContext(canvas);
	if (!gl) {
	console.log('Failed to get the rendering context for WebGL');
	return;
	}

	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
	console.log('Failed to intialize shaders.');
	return;
	}

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.enable(gl.DEPTH_TEST);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let u_LightColour = gl.getUniformLocation(gl.program, 'u_LightColour');
	let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
	let u_Lamp1Colour = gl.getUniformLocation(gl.program, 'u_Lamp1Colour');
	let u_Lamp2Colour = gl.getUniformLocation(gl.program, 'u_Lamp2Colour');
	let u_Lamp3Colour = gl.getUniformLocation(gl.program, 'u_Lamp3Colour');
	let u_Lamp1Position = gl.getUniformLocation(gl.program, 'u_Lamp1Position');
	let u_Lamp2Position = gl.getUniformLocation(gl.program, 'u_Lamp2Position');
	let u_Lamp3Position = gl.getUniformLocation(gl.program, 'u_Lamp3Position');
	let u_AmbientColour = gl.getUniformLocation(gl.program, 'u_AmbientColour');
	let u_texture = gl.getUniformLocation(gl.program, 'u_texture');
	let u_lamps = gl.getUniformLocation(gl.program, 'u_Lamps');
	let u_Texture = gl.getUniformLocation(gl.program, 'u_Texture');
	let u_Texture_Normal = gl.getUniformLocation(gl.program, 'u_Texture_Normal');

	let viewMatrix = new Matrix4();
	let projMatrix = new Matrix4();
	let viewNode = new node(viewMatrix);
	let projNode = new node(projMatrix);
	let lightDirection = new Vector3([0.7, 3.0, 4.0]);
	let lamp1Position = new Vector4([-6.0, 6.0, -10.0, 0.0]);
	let lamp2Position = new Vector4([-3.0, 6.0, -10.0, 0.0]);
	let lamp3Position = new Vector4([-9.0, 6.0, -10.0, 0.0]);

	gl.uniform3f(u_LightColour, 0.6, 0.6, 0.6);
	gl.uniform3f(u_Lamp1Colour, 0.3, 0.3, 0.3);
	gl.uniform3f(u_Lamp2Colour, 0.3, 0.3, 0.3);
	gl.uniform3f(u_Lamp3Colour, 0.3, 0.3, 0.3);
	gl.uniform3f(u_AmbientColour, 0.35, 0.35, 0.35);
	lightDirection.normalize();		// Normalize
	gl.uniform3fv(u_LightDirection, lightDirection.elements);
	gl.uniform4fv(u_Lamp1Position, lamp1Position.elements);  
	gl.uniform4fv(u_Lamp2Position, lamp2Position.elements);  
	gl.uniform4fv(u_Lamp3Position, lamp3Position.elements);  
	gl.uniform1i(u_lamps, false);

	viewMatrix.lookAt(camera_loc, [0, 0, 0], [0, 1, 0]);
	projMatrix.setPerspective(20, canvas.width/canvas.height, 1, 200);
	gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

	let main_nodes = make_room();
	main_nodes["view"] = viewNode;
	main_nodes["proj"] = projNode;

	let lamps = document.getElementById("lamps");
	lamps.onclick = turn_on;
	let texture_names = ["Wood_Floor_COL.jpg", "Wood_Floor_NRM.jpg","Marble_Tiles_COL.jpg", "Marble_Tiles_NRM.jpg", "Asphalt_COL.jpg", "Carpet.jpg", "Carpet_NRM.jpg", "rick-and-morty.jpg", "Strange_Pattern_COL.jpg", "Strange_Pattern_NRM.jpg", "clock_face.jpg"]

	load_text_imgs(texture_names);

	let view_1 = document.getElementById("view-1");
	let view_2 = document.getElementById("view-2");
	let view_3 = document.getElementById("view-3");

	view_1.onclick = function () {set_view([0.0, 25.0, 100.0], 0, 160)}
	view_2.onclick = function () {set_view([0.0, 8.0, 30.0], -24, 198)}
	view_3.onclick = function () {set_view([0.0, 18.0, 80.0], 0, 20)}
	
	function set_view(new_loc, x_ang, y_ang){
		camera_loc = new_loc;
		x_angle = x_ang;
		y_angle = y_ang;
	}

	document.onkeydown = function(ev){
		keydown(ev, gl, main_nodes);
	};

	function load_text_imgs(texture_names){
		let text_imgs = [];
		let not_loaded = texture_names.length;

		let on_text_load = function() {
			not_loaded -= 1;
			if (!not_loaded) {
				textures.forEach(texture => {
					load_texture(gl, texture);
				});
				draw(gl, main_nodes);
			};
		};

		texture_names.forEach(text_name => {
			let texture = gl.createTexture();
			texture.image = new Image();
			texture.image.src = "../resources/" + text_name;
			texture.image.onload = on_text_load;
			textures.push(texture);
		});
	};

	let ticker_angle = 0;
	let ticker = new Matrix4();
	let ticker_2 = new Matrix4();
	//ticker.rotate(90, 0, 1, 0);	
	//ticker.translate(0, 0.35, -0.15);
	//ticker_2.rotate(90, 0, 1, 0);	
	ticker_2.translate(3, 0, 0);
	main_nodes["ticker_2"] = new node(ticker_2);
	main_nodes["ticker_2"].set_colour(0.0, 0.0, 0.0, 1.0);
	//main_nodes["sun"].set_colour(1.0, 0.0, 0.0, 1.0);
	main_nodes["sun_obj"] = new node();
	main_nodes["sun_obj"].set_colour(1.0, 0.0, 0.0, 1.0);
	sun_node.set_children([main_nodes["sun_obj"], main_nodes["ticker_2"]]);
	document.onload = clock_tick();

	function clock_tick(){
		let rot_speed = 60;
		ticker_angle = rot_speed/100;

		sun_node.localMatrix.rotate(ticker_angle, 0, 0, 1);
		main_nodes["ticker_2"].localMatrix.rotate(ticker_angle, 0, 1, 0);
		//let world_ticker = new Matrix4(ticker);
		//let world_ticker_2 = new Matrix4(ticker_2);
		//world_ticker.multiply(world_ticker_2)
		 
		//ticker.scale(0.04, 0.7, 0.04);

		draw(gl, main_nodes);
		requestAnimationFrame(clock_tick);
	}

	function turn_on(){
		gl.uniform1i(u_lamps, true);
		draw(gl, main_nodes);
		lamps.innerHTML = "Turn off lamps";
		lamps.onclick = turn_off;
	};

	function turn_off(){
		gl.uniform1i(u_lamps, false);
		draw(gl, main_nodes);
		lamps.innerHTML = "Turn on lamps";
		lamps.onclick = turn_on;
	};

	
	let cabinet_door = document.getElementById("cabinet-doors");
	let door_angle = 0;
	cabinet_door.onclick = function (){open_cabinet()};
	
	function open_cabinet(){
		let rot_speed = 100;
		door_angle += rot_speed / 60;
		if (door_angle < 110){
			[l_rot_mat, l_handle, r_rot_mat, r_handle] = make_doors(door_angle);
			main_nodes["cabinet_doors"][0].children[1].localMatrix = l_rot_mat;
			main_nodes["cabinet_doors"][0].children[0].localMatrix = l_handle;
			main_nodes["cabinet_doors"][1].children[1].localMatrix = r_rot_mat;
			main_nodes["cabinet_doors"][1].children[0].localMatrix = r_handle;
			draw(gl, main_nodes);
			requestAnimationFrame(open_cabinet);
		} else{
			cabinet_door.innerHTML = "Close cabinet";
			cabinet_door.onclick = function (){close_cabinet()};
		};
	};

	function close_cabinet(){
		let rot_speed = 100;
		door_angle -= rot_speed / 60;
		if (door_angle > 0){
			[l_rot_mat, l_handle, r_rot_mat, r_handle] = make_doors(door_angle);
			main_nodes["cabinet_doors"][0].children[1].localMatrix = l_rot_mat;
			main_nodes["cabinet_doors"][0].children[0].localMatrix = l_handle;
			main_nodes["cabinet_doors"][1].children[1].localMatrix = r_rot_mat;
			main_nodes["cabinet_doors"][1].children[0].localMatrix = r_handle;
			draw(gl, main_nodes);
			requestAnimationFrame(close_cabinet);
		} else{
			cabinet_door.innerHTML = "Open cabinet";
			cabinet_door.onclick = function () {open_cabinet()};
		};
	};


	let draw_1 = document.getElementById("draw-1");
	draw_1.onclick = function () {open_draw(draw_1, 2, 0)};
	let draw_2 = document.getElementById("draw-2");
	draw_2.onclick = function () {open_draw(draw_2, 1, 0)};
	let draw_3 = document.getElementById("draw-3");
	draw_3.onclick = function () {open_draw(draw_3, 0, 0)};

	function open_draw(draw_el, draw_num, draw_out){
		let pull_change = 5.5 / 60;
		draw_out += pull_change;
		if (draw_out < 2){
			main_nodes["draws"][draw_num].localMatrix.translate(0, 0, pull_change);
			draw(gl, main_nodes);
			requestAnimationFrame(function () {open_draw(draw_el, draw_num, draw_out)});
		} else{
			draw_el.innerHTML = "Close draw " + (3-draw_num).toString();
			draw_el.onclick = function () {close_draw(draw_el, draw_num, 2)};
		};
	};

	function close_draw(draw_el, draw_num, draw_out){
		let pull_change = 5.5 / 60;
		draw_out -= pull_change;
		if (draw_out > 0){
			main_nodes["draws"][draw_num].localMatrix.translate(0, 0, -pull_change);
			draw(gl, main_nodes);
			requestAnimationFrame(function () {close_draw(draw_el, draw_num, draw_out)});
		} else{
			draw_el.innerHTML = "Open draw " + (3-draw_num).toString();
			draw_el.onclick = function () {open_draw(draw_el, draw_num, 0)};
		};
	};

	let chairs_out = 0;
	let chairs = document.getElementById("chairs");
	chairs.onclick = function (){pull_chairs()}; 
	
	function pull_chairs(){
		let pull_change = 5.5 / 60;
		chairs_out -= pull_change;
		if (chairs_out > -2){
			main_nodes["chairs"].forEach(chair => {
				chair.localMatrix.translate(0, 0, -pull_change);
			});
			draw(gl, main_nodes);
			requestAnimationFrame(pull_chairs);
		} else{
			chairs_out = -2;
			chairs.innerHTML = "Push in chairs";
			chairs.onclick = function (){push_chairs()};
		};
	};

	function push_chairs(){
		let pull_change = 5.5 / 60;
		chairs_out += pull_change;
		if (chairs_out < 0){
			main_nodes["chairs"].forEach(chair => {
				chair.localMatrix.translate(0, 0, pull_change);
			});
			draw(gl, main_nodes);
			requestAnimationFrame(push_chairs);
		} else{
			chairs_out = 0;
			chairs.innerHTML = "Pull out chairs";
			chairs.onclick = function (){pull_chairs()};
		};
	};

}

function size_to_screen(canvas){
	if(canvas.clientWidth != canvas.width || canvas.clientHeight != canvas.height){
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
	}
}

function load_texture(gl, texture){
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
	}

function make_room(){
	let room = new node();
	let table_and_chairs = new node();
	let lamps_node = new node();
	let room_objects = []
	let chairs = [];
	let lamps = [];

	let floor = new Matrix4()
	//4, 10
	floor.translate(0, -0.05, 0);
	floor.scale(30, 0.1, 35);
	let floor_node = new node(floor);
	floor_node.set_texture(0, 1);

	let walls = make_walls();
	let carpet = make_carpet();
	let table = make_table();
	let [clock, ticker] = make_clock();

	let cabinet_node = new node();
	let [cabinet, cabinet_doors] = make_cabinet();
	cabinet_node.set_children(cabinet_doors.concat([cabinet]));

	let tv_node = new node();
	tv_node.localMatrix.translate(-8, 0, 12);
	tv_node.localMatrix.rotate(145, 0, 1, 0);
	let tv = make_tv();
	tv_node.set_children([tv, cabinet_node]);

	let chest_node = new node();
	let [chest, draws] = make_chest();
	chest_node.set_children(draws.concat([chest]));
	chest_node.localMatrix.setTranslate(13, 0, -10);
	chest_node.localMatrix.rotate(-90, 0, 1, 0);

	let sofa_node_1 = make_sofa();
	sofa_node_1.localMatrix.setTranslate(-4, 0, 1);

	let sofa_node_2 = make_sofa();
	sofa_node_2.localMatrix.setTranslate(4, 0, 8);
	sofa_node_2.localMatrix.rotate(-90, 0, 1, 0);

	let coffee_table_node = make_coffee_table();
	coffee_table_node.localMatrix.translate(-2, 0, 7);


	for (let i=0; i<3; i++){
		lamps.push(make_lamp());	
	}
	for (let i=0; i<4; i++){
		chairs.push(make_chair());
	}

	lamps[0].localMatrix.translate(3, 0, 0);
	lamps[1].localMatrix.translate(-3, 0, 0);
	chairs[0].localMatrix.translate(2, 0, -2);
	chairs[1].localMatrix.translate(-2, 0, -2);
	chairs[2].localMatrix.translate(2, 0, 2);
	chairs[2].localMatrix.rotate(180, 0, 1, 0);
	chairs[3].localMatrix.translate(-2, 0, 2);
	chairs[3].localMatrix.rotate(180, 0, 1, 0);

	room_objects = room_objects.concat([clock, floor_node, table_and_chairs, chest_node, tv_node, coffee_table_node, sofa_node_1, sofa_node_2, carpet, walls, sun_node]);
	lamps_node.set_children(lamps);
	table_and_chairs.set_children(chairs.concat([table, lamps_node]));
	table_and_chairs.localMatrix.translate(-6, 0, -10);
	room.set_children(room_objects);

	return {"room": room, "chairs": chairs, "table": table_and_chairs, "cabinet_doors": cabinet_doors, "draws": draws, "ticker": ticker}
}

function keydown(ev, gl, main_nodes) {
	switch (ev.keyCode) {
	case 40:
		x_angle = (x_angle + ANGLE_STEP) % 360;
		break;
	case 38: 
		x_angle = (x_angle - ANGLE_STEP) % 360;
		break;
	case 39: 
		y_angle = (y_angle + ANGLE_STEP) % 360;
		break;
	case 37: 
		y_angle = (y_angle - ANGLE_STEP) % 360;
		break;
	default: return; 
	}

	draw(gl, main_nodes);
}


function initVertexBuffers(gl) {
	let vertices = new Float32Array([
	 0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,	-0.5,-0.5, 0.5,	0.5,-0.5, 0.5,
	 0.5, 0.5, 0.5,		0.5,-0.5, 0.5,	 0.5,-0.5,-0.5,	0.5, 0.5,-0.5,
	 0.5, 0.5, 0.5,		0.5, 0.5,-0.5,	-0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,
	-0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,	-0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,
	-0.5,-0.5,-0.5,		0.5,-0.5,-0.5,	 0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
	 0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,	-0.5, 0.5,-0.5,	0.5, 0.5,-0.5  
	]);


	let colours = new Float32Array([	
	1, 1, 1,	 1, 1, 1,		1, 1, 1,	1, 1, 1,
	1, 1, 1,	 1, 1, 1,		1, 1, 1,	1, 1, 1,
	1, 1, 1,	 1, 1, 1,		1, 1, 1,	1, 1, 1,
	1, 1, 1,	 1, 1, 1,		1, 1, 1,	1, 1, 1,
	1, 1, 1,	 1, 1, 1,		1, 1, 1,	1, 1, 1,
	1, 1, 1,	 1, 1, 1,		1, 1, 1,	1, 1, 1,
 ]);


	let normals = new Float32Array([
	0.0, 0.0, 1.0,	 0.0, 0.0, 1.0,		0.0, 0.0, 1.0,	 0.0, 0.0, 1.0, 
	1.0, 0.0, 0.0,	 1.0, 0.0, 0.0,		1.0, 0.0, 0.0,	 1.0, 0.0, 0.0,
	0.0, 1.0, 0.0,	 0.0, 1.0, 0.0,		0.0, 1.0, 0.0,	 0.0, 1.0, 0.0,
	 -1.0, 0.0, 0.0,	-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,	-1.0, 0.0, 0.0,
	0.0,-1.0, 0.0,	 0.0,-1.0, 0.0,		0.0,-1.0, 0.0,	 0.0,-1.0, 0.0,  
	0.0, 0.0,-1.0,	 0.0, 0.0,-1.0,		0.0, 0.0,-1.0,	 0.0, 0.0,-1.0	
	]);

	let textures_indices = new Float32Array([
		1.0, 1.0,  0.0, 1.0,  0.0, 0.0,  1.0, 0.0,
		0.0, 1.0,  0.0, 0.0,  1.0, 0.0,  1.0, 1.0,
		1.0, 0.0,  1.0, 1.0,  0.0, 1.0,  0.0, 0.0,
		1.0, 1.0,  0.0, 1.0,  0.0, 0.0,  1.0, 0.0,
		0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
		0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0
	]);

	let indices = new Uint8Array([
		 0, 1, 2,	0, 2, 3,
		 4, 5, 6,	4, 6, 7,
		 8, 9,10,	8,10,11,
		12,13,14,  12,14,15,
		16,17,18,  16,18,19,
		20,21,22,  20,22,23	
	 ]);

	if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
	initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT);
	if (!initArrayBuffer(gl, 'a_Texcoord', textures_indices, 2, gl.FLOAT)) return -1;

	let indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
	let buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

	let a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log('Failed to get the storage location of ' + attribute);
		return false;
	}
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	gl.enableVertexAttribArray(a_attribute);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return true;
}


function draw(gl, main_nodes) {
	size_to_screen(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	

	let n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}
	
	main_nodes["view"].localMatrix.setLookAt(camera_loc[0], camera_loc[1], camera_loc[2], 0, 0, -100, 0, 1, 0);
	main_nodes["view"].localMatrix.rotate(y_angle, 0, 1, 0);
	main_nodes["view"].localMatrix.rotate(x_angle, 1, 0, 0);

	let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	gl.uniformMatrix4fv(u_ViewMatrix, false, main_nodes["view"].localMatrix.elements);

	main_nodes["room"].updateSystem();
	main_nodes["room"].draw(gl, n);
}

function drawbox(gl, worldMatrix, n, texture, text_norm, colour) {
	let u_WorldMatrix = gl.getUniformLocation(gl.program, 'u_WorldMatrix');
	let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	let u_Texture = gl.getUniformLocation(gl.program, 'u_Texture');
	let u_Texture_Normal = gl.getUniformLocation(gl.program, 'u_Texture_Normal');
	let u_Has_Texture = gl.getUniformLocation(gl.program, 'u_Has_Texture');
	let u_Has_Normal = gl.getUniformLocation(gl.program, 'u_Has_Normal');
	let u_SurfaceColour = gl.getUniformLocation(gl.program, 'u_Colour');

	gl.uniformMatrix4fv(u_WorldMatrix, false, worldMatrix.elements);

	let normal_matrix = new Matrix4();  
	normal_matrix.setInverseOf(worldMatrix);
	normal_matrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, normal_matrix.elements);
	
	if (texture || text_norm){
		let temp_col = new Vector4(0.0, 0.0, 0.0, 1.0);
		gl.uniform1i(u_Has_Texture, true);
		gl.uniform4fv(u_SurfaceColour, temp_col.elements);
		gl.activeTexture(gl.TEXTURE0+texture);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture]);
		gl.uniform1i(u_Texture, texture);

	} else{
		gl.uniform1i(u_Has_Texture, false);
		gl.uniform4fv(u_SurfaceColour, colour.elements);
	};

	if (text_norm){
		gl.activeTexture(gl.TEXTURE0+text_norm);
		gl.bindTexture(gl.TEXTURE_2D, textures[text_norm]);
		gl.uniform1i(u_Texture_Normal, text_norm);
		gl.uniform1i(u_Has_Normal, true);
	} else {
		gl.uniform1i(u_Has_Normal, false);
	};

	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

}

function make_walls(){
	let left_wall = new Matrix4();
	left_wall.rotate(90, 0, 1, 0);
	left_wall.translate(0, 4.5, 15);
	left_wall.scale(35, 9, 0.3);
	let left_node = new node(left_wall);

	let walls_node = new node();
	walls_node.set_children([left_node]);
	walls_node.set_colour(1.0, 1.0, 1.0, 1.0);

	return walls_node;
}

function make_clock(){
	let face = new Matrix4();
	face.rotate(90, 0, 1, 0);
	face.scale(2, 2, 0.2);
	let face_node = new node(face);
	face_node.set_texture(10);

	let big_hand = new Matrix4();
	big_hand.rotate(90, 0, 1, 0);
	big_hand.translate(0, 0.35, -0.1);
	big_hand.scale(0.07, 0.7, 0.07);
	let big_node = new node(big_hand);

	let small_hand = new Matrix4();
	small_hand.rotate(90, 0, 1, 0);
	small_hand.rotate(90, 0, 0, 1);
	small_hand.translate(0, 0.25, -0.1);
	small_hand.scale(0.07, 0.5, 0.07);
	let small_node = new node(small_hand);

	let ticker = new Matrix4();
	ticker.rotate(90, 0, 1, 0);
	ticker.translate(0, 0.35, -0.15); 
	ticker.scale(0.04, 0.7, 0.04);
	let ticker_node = new node(ticker);

	let clock_node = new node();
	clock_node.set_children([face_node, big_node, small_node, ticker_node]);
	clock_node.localMatrix.translate(14.8, 5, -10);
	clock_node.set_colour(1.0, 1.0, 1.0, 1.0);
	big_node.set_colour(0.0, 0.0, 0.0, 1.0);
	small_node.set_colour(0.0, 0.0, 0.0, 1.0);
	ticker_node.set_colour(1.0, 0.0, 0.0, 1.0);
	return [clock_node, ticker_node];
}

function make_tv(){
	let base = new Matrix4();
	base.translate(0, 0.1, 0);
	base.scale(2, 0.2, 1);
	let base_node = new node(base);

	let strut = new Matrix4();
	strut.translate(0, 1, 0);
	strut.scale(0.3, 2, 0.2);
	let strut_node = new node(strut);

	let screen = new Matrix4();
	screen.translate(0, 2.25, 0.1);
	screen.scale(3.9, 2.4, 0.05); 
	let screen_node = new node(screen);

	let screen_back = new Matrix4();
	screen_back.translate(0, 2.25, 0);
	screen_back.scale(4, 2.5, 0.05); 
	let screen_back_node = new node(screen_back);

	let l_frame = new Matrix4();
	l_frame.translate(-1.9, 2.25, 0.1);
	l_frame.scale(0.2, 2.5, 0.2);
	let l_frame_node = new node(l_frame);

	let r_frame = new Matrix4();
	r_frame.translate(1.9, 2.25, 0.1);
	r_frame.scale(0.2, 2.5, 0.2);
	let r_frame_node = new node(r_frame);

	let t_frame = new Matrix4();
	t_frame.translate(0, 3.4, 0.1);
	t_frame.scale(4, 0.2, 0.2);
	let t_frame_node = new node(t_frame);

	let b_frame = new Matrix4();
	b_frame.translate(0, 1.1, 0.1);
	b_frame.scale(4, 0.2, 0.2);
	let b_frame_node = new node(b_frame);

	let tv_node = new node();
	tv_node.localMatrix.translate(0, 1.95, 0);
	tv_node.set_children([base_node, screen_back_node, strut_node, screen_node, l_frame_node, r_frame_node, t_frame_node, b_frame_node]);
	tv_node.set_colour(0.0, 0.0, 0.0, 0.0);
	screen_node.set_texture(7);
	return tv_node;
}
 
function make_carpet(){
	let carpet = new Matrix4();
	carpet.translate(0, 0.1, 0);
	carpet.scale(23, 0.1, 20);
	let carpet_node = new node(carpet);

	let surface = new Matrix4();
	surface.translate(0, 0.12, 0);
	surface.scale(22, 0.13, 19);
	let surface_node = new node(surface);

	surface_node.set_texture(5, 6);
	carpet_node.set_colour(1.0, 1.0, 1.0, 1.0);
	let whole_carpet = new node();
	whole_carpet.set_children([carpet_node, surface_node]);
	whole_carpet.localMatrix.translate(-3, 0, 6.5);
	return whole_carpet; 
}
	
function make_draws(no_draws){
	let draws = [];
	for (let i=0; i<no_draws; i++){
		let chest_draw = new node();
		let base = new Matrix4();
		base.translate(0, -0.3725, 0);
		base.scale(4.4, 0.05, 2.8);
		let base_node = new node(base);

		let left_side = new Matrix4();
		left_side.translate(2.175, 0, 0);
		left_side.scale(0.05, 0.75, 2.8);
		let l_side_node = new node(left_side);

		let right_side = new Matrix4();
		right_side.translate(-2.175, 0, 0);
		right_side.scale(0.05, 0.75, 2.8);
		let r_side_node = new node(right_side);

		let front = new Matrix4();
		front.translate(0, 0, 1.375); 
		front.scale(4.4, 0.75, 0.05);
		let front_node = new node(front);

		let back = new Matrix4();
		back.translate(0, 0, -1.375); 
		back.scale(4.4, 0.75, 0.05);
		let back_node = new node(back);

		let handle = new Matrix4();
		handle.translate(0, 0, 1.4);
		handle.scale(0.45, 0.1, 0.05);
		let handle_node = new node(handle);
		handle_node.set_texture(0, 1);

		chest_draw.set_children([base_node, l_side_node, r_side_node, back_node, front_node, handle_node]);
		chest_draw.set_colour(144/256, 144/256, 144/256, 1.0);
		draws.push(chest_draw);
	}
	return draws;
}
function make_coffee_table(){
	let coffee_table_node = new node();

	let coffee_table_base = new Matrix4();
	coffee_table_base.translate(0, 0.1, 0);
	coffee_table_base.scale(3.6, 0.2, 3);
	let base_node = new node(coffee_table_base);

	let l_side = new Matrix4();
	l_side.translate(-1.775, 0.935, 0);
	l_side.scale(0.05, 1.87, 3);
	let l_side_node = new node(l_side);

	let divide_1 = new Matrix4();
	divide_1.translate(0, 1, 0);
	divide_1.scale(3.6, 0.05, 3);
	let	div1_node = new node(divide_1);

	let coffee_table_top = new Matrix4();
	coffee_table_top.translate(0, 1.87, 0);
	coffee_table_top.scale(3.6, 0.2, 3);
	let	top_node = new node(coffee_table_top);


	let r_side = new Matrix4();
	r_side.translate(1.775, 0.935, 0);
	r_side.scale(0.05, 1.87, 3);
	let r_side_node = new node(r_side);


	coffee_table_node.set_children([base_node, top_node, l_side_node, r_side_node, div1_node]);
	coffee_table_node.set_texture(8, 9);
	return coffee_table_node;
}

function make_cabinet(){
	let cabinet_node = new node();

	let cabinet_base = new Matrix4();
	cabinet_base.translate(0, 0.1, 0);
	cabinet_base.scale(4.6, 0.2, 3);
	let base_node = new node(cabinet_base);

	let cabinet_back = new Matrix4();
	cabinet_back.translate(0, 0.935, -1.475);
	cabinet_back.scale(4.6, 1.87, 0.05);
	let back_node = new node(cabinet_back);

	let l_side = new Matrix4();
	l_side.translate(-2.275, 0.935, 0);
	l_side.scale(0.05, 1.87, 3);
	let l_side_node = new node(l_side);

	let divide_1 = new Matrix4();
	divide_1.translate(0, 1, 0);
	divide_1.scale(4.6, 0.05, 3);
	let	div1_node = new node(divide_1);

	let cabinet_top = new Matrix4();
	cabinet_top.translate(0, 1.87, 0);
	cabinet_top.scale(4.6, 0.2, 3);
	let	top_node = new node(cabinet_top);

	let r_side = new Matrix4();
	r_side.translate(2.275, 0.935, 0);
	r_side.scale(0.05, 1.87, 3);
	let r_side_node = new node(r_side);

	let left_door = new Matrix4();
	left_door.translate(-1.14, 0.935, 1.475);
	left_door.scale(2.27, 1.67, 0.05);

	let right_door = new Matrix4();
	right_door.translate(1.14, 0.935, 1.475);
	right_door.scale(2.27, 1.67, 0.05);

	let left_handle = new Matrix4();
	left_handle.translate(-0.2, 0.935, 1.525);
	left_handle.scale(0.1, 0.45, 0.05);
	let left_handle_node = new node(left_handle);

	let right_handle = new Matrix4();
	right_handle.translate(0.2, 0.935, 1.525);
	right_handle.scale(0.1, 0.45, 0.05);
	let right_handle_node = new node(right_handle);

	let right_door_node = new node();
	let left_door_node = new node();
	left_door_node.set_children([left_handle_node, new node(left_door)]);
	right_door_node.set_children([right_handle_node, new node(right_door)]);
	cabinet_node.set_children([base_node, top_node, back_node, l_side_node, r_side_node, div1_node]);
	cabinet_node.set_colour(144/256, 144/256, 144/256, 1.0);
	top_node.set_texture(0, 1);
	left_handle_node.set_texture(0, 1);
	right_handle_node.set_texture(0, 1);
	left_door_node.set_colour(144/256, 144/256, 144/256, 1.0);
	right_door_node.set_colour(144/256, 144/256, 144/256, 1.0);
	return [cabinet_node, [left_door_node, right_door_node]];
}

function make_chest(){
	let chest_node = new node();
	let draws = make_draws(3);

	let chest_base = new Matrix4();
	chest_base.translate(0, 0.1, 0);
	chest_base.scale(4.6, 0.2, 3);
	let base_node = new node(chest_base);

	let chest_top = new Matrix4();
	chest_top.translate(0, 2.85, 0);
	chest_top.scale(4.8, 0.2, 3);
	let top_node = new node(chest_top);

	let chest_back = new Matrix4();
	chest_back.translate(0, 1.43, -1.475);
	chest_back.scale(4.6, 2.86, 0.05);
	let back_node = new node(chest_back);

	let l_side = new Matrix4();
	l_side.translate(-2.275, 1.43, 0);
	l_side.scale(0.05, 2.86, 3);
	let l_side_node = new node(l_side);

	let divide_1 = new Matrix4();
	divide_1.translate(0, 1, 0);
	divide_1.scale(4.6, 0.05, 3);
	let	div1_node = new node(divide_1);

	let divide_2 = new Matrix4();
	divide_2.translate(0, 1.87, 0);
	divide_2.scale(4.6, 0.05, 3);
	let	div2_node = new node(divide_2);


	let r_side = new Matrix4();
	r_side.translate(2.275, 1.43, 0);
	r_side.scale(0.05, 2.86, 3);
	let r_side_node = new node(r_side);


	draws[0].localMatrix.translate(0, 0.58, 0);
	draws[1].localMatrix.translate(0, 1.45, 0);
	draws[2].localMatrix.translate(0, 2.32, 0);
	chest_node.set_children([base_node, top_node, back_node, l_side_node, r_side_node, div1_node, div2_node]);
	chest_node.set_colour(144/256, 144/256, 144/256, 1.0);
	top_node.set_texture(0, 1);
	return [chest_node, draws];
}


function make_lamp(){
	let lamp_node = new node();
	let sides = [];	

	for (let i=0; i<4; i++){
		let side = new Matrix4();
		side.rotate(90 * i, 0, 1, 0);
		side.translate(0, 0, 0.325);
		side.rotate(-20, 1, 0, 0);
		side.scale(0.65, 0.5, 0.1);
		let side_node = new node(side);
		sides.push(side_node);
	}

	lamp_node.set_children(sides);
	lamp_node.set_colour(1.0, 1.0, 1.0, 1.0);
	lamp_node.localMatrix.translate(0, 6, 0);
	return lamp_node
}

function make_table(){
	let table_node = new node();

	let table_top = new Matrix4();
	table_top.scale(9, 0.15, 4.5)
	let top_node = new node(table_top);

	let leg_br = new Matrix4();
	leg_br.translate(3.75, -1.3, -1.65);  
	leg_br.scale(0.3, 2.5, 0.5); 
	let leg_br_node = new node(leg_br);

	let leg_fr = new Matrix4();
	leg_fr.translate(3.75, -1.3, 1.65);  
	leg_fr.scale(0.3, 2.5, 0.5); 
	let leg_fr_node = new node(leg_fr);

	let leg_bl = new Matrix4();
	leg_bl.translate(-3.75, -1.3, -1.65);  
	leg_bl.scale(0.3, 2.5, 0.5); 
	let leg_bl_node = new node(leg_bl);

	let leg_fl = new Matrix4();
	leg_fl.translate(-3.75, -1.3, 1.65);  
	leg_fl.scale(0.3, 2.5, 0.5); 
	let leg_fl_node = new node(leg_fl);

	table_node.set_children([top_node, leg_br_node, leg_bl_node, leg_fr_node, leg_fl_node]);
	table_node.set_colour(1.0, 1.0, 1.0, 1.0);
	table_node.localMatrix.translate(0, 2.525, 0);
	return table_node;
}

function make_sofa(){
	sofa_node = new node()

	let seat = new Matrix4();
	seat.translate(0, 1.1, 0);
	seat.scale(6.0, 1.3, 3.0); 
	let seat_node = new node(seat)

	let back = new Matrix4();
	back.rotate(-10, 1, 0, 0);
	back.translate(0, 2.75, -0.9);	
	back.scale(6, 2.0, 0.5); 
	let back_node = new node(back);
	
	let left_side = new Matrix4();
	left_side.translate(3.25, 1.4, 0);
	left_side.scale(0.5, 1.9, 3);
	let left_side_node = new node(left_side);

	let right_side = new Matrix4();
	right_side.translate(-3.25, 1.4, 0);
	right_side.scale(0.5, 1.9, 3);
	let right_side_node = new node(right_side);


	let leg_br = new Matrix4();
	leg_br.translate(2.75, 0.25, -1.2);  
	leg_br.scale(0.2, 0.5, 0.2); 
	let leg_br_node = new node(leg_br);

	let leg_bl = new Matrix4();
	leg_bl.translate(-2.75, 0.25, -1.2);	
	leg_bl.scale(0.2, 0.5, 0.2); 
	let leg_bl_node = new node(leg_bl);

	let leg_fr = new Matrix4();
	leg_fr.translate(2.75, 0.25, 1.2);	
	leg_fr.scale(0.2, 0.5, 0.2); 
	let leg_fr_node = new node(leg_fr);

	let leg_fl = new Matrix4();
	leg_fl.translate(-2.75, 0.25, 1.2);  
	leg_fl.scale(0.2, 0.5, 0.2); 
	let leg_fl_node = new node(leg_fl);

	sofa_node.set_children([seat_node, back_node, leg_br_node, leg_bl_node, leg_fr_node, leg_fl_node, left_side_node, right_side_node]);
	sofa_node.set_texture(4);
	return sofa_node;
}

function make_chair(){
	let chair_node = new node()

	let seat = new Matrix4();
	seat.scale(2.0, 0.5, 2.0); 
	let seat_node = new node(seat)

	let back = new Matrix4();
	back.translate(0, 1.25, -0.75);	
	back.scale(2.0, 2.0, 0.5); 
	let back_node = new node(back);

	let leg_br = new Matrix4();
	leg_br.translate(0.85, -1.0, -0.75);  
	leg_br.scale(0.3, 1.5, 0.5); 
	let leg_br_node = new node(leg_br);

	let leg_bl = new Matrix4();
	leg_bl.translate(-0.85, -1.0, -0.75);	
	leg_bl.scale(0.3, 1.5, 0.5); 
	let leg_bl_node = new node(leg_bl);

	let leg_fr = new Matrix4();
	leg_fr.translate(0.85, -1.0, 0.75);	
	leg_fr.scale(0.3, 1.5, 0.5); 
	let leg_fr_node = new node(leg_fr);

	let leg_fl = new Matrix4();
	leg_fl.translate(-0.85, -1.0, 0.75);  
	leg_fl.scale(0.3, 1.5, 0.5); 
	let leg_fl_node = new node(leg_fl);

	chair_node.set_children([seat_node, back_node, leg_br_node, leg_bl_node, leg_fr_node, leg_fl_node]);
	chair_node.set_colour(1.0, 1.0, 1.0, 1.0);
	chair_node.localMatrix.setTranslate(0, 1.75, 0);
	return chair_node;
}

function make_doors(door_angle){
	let l_rot_mat = new Matrix4();
	let r_rot_mat = new Matrix4();
	l_rot_mat.translate(-2.28, 0.935, 1.475);
	r_rot_mat.translate(2.28, 0.935, 1.475);
	l_rot_mat.rotate(-door_angle, 0,1,0);
	r_rot_mat.rotate(door_angle, 0,1,0);
	l_rot_mat.translate(1.14, 0, 0);
	r_rot_mat.translate(-1.14, 0, 0);
	let l_handle = new Matrix4(l_rot_mat);
	let r_handle = new Matrix4(r_rot_mat);
	l_rot_mat.scale(2.27, 1.67, 0.05);
	r_rot_mat.scale(2.27, 1.67, 0.05);
	l_handle.translate(1, 0, 0.05);
	l_handle.scale(0.1, 0.45, 0.05);
	r_handle.translate(-1, 0, 0.05);
	r_handle.scale(0.1, 0.45, 0.05);
	return [l_rot_mat, l_handle, r_rot_mat, r_handle];
}

