var canvas = document.querySelector("#c");
var gl = canvas.getContext("webgl");
if (!gl) { console.error("WebGL not supported"); }

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function setRectangle(gl, x, y, width, height) {
    var x1 = x; var x2 = x + width;
    var y1 = y; var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,  x2, y1,  x1, y2,
        x1, y2,  x2, y1,  x2, y2,
    ]), gl.STATIC_DRAW);
}

// Convolution Kernel
function computeKernelWeight(kernel) {
    var weight = kernel.reduce(function(prev, curr) {
        return prev + curr;
    });
    return weight <= 0 ? 1.0 : weight;
}

var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
var textureSizeUniformLocation = gl.getUniformLocation(program, "u_textureSize");

// Lấy vị trí các biến uniform mới cho Ma trận tích chập
var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
var flipYLocation = gl.getUniformLocation(program, "u_flipY");

var edgeDetectKernel = [
    -1, -1, -1,
    -1,  8, -1,
    -1, -1, -1
];

var image = new Image();
image.src = "../img.png";
image.onload = function() {
    render(image);
}

function render(image) {
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

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(textureSizeUniformLocation, image.width, image.height);

    gl.uniform1f(flipYLocation, -1.0);

    // Nạp dữ liệu Ma trận tích chập và Trọng số lên GPU
    gl.uniform1fv(kernelLocation, edgeDetectKernel);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));

    // buffer 1: Tọa độ hình chữ nhật (Vị trí vẽ)
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, image.width, image.height);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // buffer 2: Tọa độ dán ảnh (Texture Coordinates)
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Khởi tạo Texture
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}