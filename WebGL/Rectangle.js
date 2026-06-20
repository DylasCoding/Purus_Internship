var canvas = document.querySelector("#c");
var gl = canvas.getContext("webgl");
if (!gl) { console.error("WebGL not supported"); }

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function randomInt(range) {
    return Math.floor(Math.random() * range);
}

// Hàm nạp tọa độ hình chữ nhật vào Buffer
function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2
    ]), gl.STATIC_DRAW);
}

var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
var colorUniformLocation = gl.getUniformLocation(program, "u_color");

var positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

var displayWidth  = gl.canvas.clientWidth;
var displayHeight = gl.canvas.clientHeight;
if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
}
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

// Truyền độ phân giải cho trục X và Y
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

gl.enableVertexAttribArray(positionAttributeLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Vẽ 50 hình chữ nhật ngẫu nhiên
for (var ii = 0; ii < 50; ++ii) {
    // Ghi đè tọa độ ngẫu nhiên mới vào positionBuffer
    setRectangle(gl, randomInt(400), randomInt(400), randomInt(300), randomInt(300));

    // Thay đổi màu sắc
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}