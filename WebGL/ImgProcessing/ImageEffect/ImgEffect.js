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

function computeKernelWeight(kernel) {
    var weight = kernel.reduce(function(prev, curr) {
        return prev + curr;
    });
    return weight <= 0 ? 1.0 : weight;
}

// khởi tạo
var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
var textureSizeUniformLocation = gl.getUniformLocation(program, "u_textureSize");
var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
var flipYLocation = gl.getUniformLocation(program, "u_flipY");

var kernels = {
    normal: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    gaussianBlur: [
        0.045, 0.122, 0.045,
        0.122, 0.332, 0.122,
        0.045, 0.122, 0.045
    ],
    unsharpen: [
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1
    ],
    emboss: [
        -2, -1,  0,
        -1,  1,  1,
        0,  1,  2
    ],
    edgeDetect: [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
    ]
};

var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "unsharpen",
    // "edgeDetect"
];

function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}

function setFramebuffer(fbo, width, height) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.uniform2f(resolutionUniformLocation, width, height);
    gl.viewport(0, 0, width, height);
}

function drawWithKernel(name) {
    gl.uniform1fv(kernelLocation, kernels[name]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

var image = new Image();
image.src = "../img.png";
image.onload = function() {
    render(image);
}

function render(image) {
    gl.useProgram(program);

    // Buffer 1
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, image.width, image.height);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Buffer 2
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

    // khởi tạo texture gốc
    var originalImageTexture = createAndSetupTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // khởi tạo 2 texture và framebuffer để xử lý ping-pong
    var textures = [];
    var framebuffers = [];
    for (var ii = 0; ii < 2; ++ii) {
        var texture = createAndSetupTexture(gl);
        textures.push(texture);

        // Cấp phát bộ nhớ trống
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        var fbo = gl.createFramebuffer();
        framebuffers.push(fbo);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }

    // điều hướng vẽ chuỗi effect
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // Uniform cố định cho kích thước ảnh
    gl.uniform2f(textureSizeUniformLocation, image.width, image.height);

    for (var i = 0; i < effectsToApply.length; ++i) {
        gl.uniform1f(flipYLocation, 1.0); //đang trong xử lý không flip

        // Xoay vòng bộ đệm 0 và 1
        setFramebuffer(framebuffers[i % 2], image.width, image.height);

        // Vẽ hiệu ứng hiện tại
        drawWithKernel(effectsToApply[i]);

        // vẽ xong -> gán texture kết quả vàp
        gl.bindTexture(gl.TEXTURE_2D, textures[i % 2]);
    }

    // --- BƯỚC CUỐI CÙNG: XUẤT RA CANVAS (MÀN HÌNH CHÍNH) ---
    // Cập nhật lại kích thước Canvas thực tế hiển thị
    var displayWidth  = gl.canvas.clientWidth;
    var displayHeight = gl.canvas.clientHeight;
    if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
        gl.canvas.width  = displayWidth;
        gl.canvas.height = displayHeight;
    }

    gl.uniform1f(flipYLocation, -1.0);

    // Bind Framebuffer về null báo hiệu vẽ thẳng lên Canvas màn hình
    setFramebuffer(null, gl.canvas.width, gl.canvas.height);

    // Xóa bộ đệm Canvas cũ trước khi vẽ đè
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Áp dụng bộ lọc "normal" để kết xuất dữ liệu
    drawWithKernel("normal");
}