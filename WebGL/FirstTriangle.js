var canvas = document.querySelector("#c");
var gl = canvas.getContext("webgl");
if (!gl) {
    console.error("WebGL not supported");
}

// Hàm biên dịch Shader (Vertex hoặc Fragment)
function createShader(gl, type, source) {
    var shader = gl.createShader(type);             //tạo một shader trống trên GPU
    gl.shaderSource(shader, source);                               //nạp glsl
    gl.compileShader(shader);                                   //biên dịch shader trên GPU
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

// Program = Vertex Shader + Fragment Shader
function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);                        //kiểm tra xem có khớp không
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// Lấy mã nguồn GLSL từ các thẻ script HTML
var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Tạo Program
var program = createProgram(gl, vertexShader, fragmentShader);

// Đi tìm vị trí của attribute "a_position" trong Program ( cụ theer là vị trí của biến a_position trong Vertex Shader)
var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// Tạo Buffer
var positionBuffer = gl.createBuffer();

//Buffer hiện tại của ARRAY_BUFFER là positionBuffer
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Mảng tọa độ 2D của 3 đỉnh giá trị không vượt clip space
var positions = [
    0, 0,
    0, 0.5,
    0.7, 0,
];

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

console.log("Already.");

//Chuyển đổi Clip Space sang không gian màn hình Pixel (Screen Space)
var displayWidth  = gl.canvas.clientWidth;
var displayHeight = gl.canvas.clientHeight;
if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
    // Nếu không khớp, cập nhật lại kích thước bản vẽ của canvas
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
}
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

//bật attribute Cho phép: a_position được đọc dữ liệu từ Buffer.
gl.enableVertexAttribArray(positionAttributeLocation);

var size = 2;           //mỗi vertex sẽ có 2 thành phần (x, y)
var type = gl.FLOAT;    //float32
var normalize = false;
var stride = 0;
var offset = 0;         //Bắt đầu đọc từ byte đầu tiên
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 3;
gl.drawArrays(primitiveType, offset, count);