// WebGL Metaballs Renderer
const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// GLSL vertex shader
const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// GLSL fragment shader
const fragmentShaderSource = `
precision mediump float;
#define MAX_BALLS 32

uniform vec2 u_resolution;
uniform int u_numBalls;
uniform vec3 u_balls[MAX_BALLS]; // x, y, radius

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float x = gl_FragCoord.x;
  float y = u_resolution.y - gl_FragCoord.y; // Flip Y

  float sum = 0.0;
  for (int i = 0; i < MAX_BALLS; i++) {
    if (i >= u_numBalls) break;
    vec3 ball = u_balls[i];
    float dx = x - ball.x;
    float dy = y - ball.y;
    float dist = dx * dx + dy * dy;
    sum += (ball.z * ball.z) / dist;
  }

  if (sum > 1.0) {
  float intensity = clamp((sum - 1.0) * 0.5, 0.0, 1.0); 
  vec3 baseColor = vec3(1.0, 0.0, 0.6); // Розовый
  vec3 color = mix(vec3(0.2), baseColor, intensity);
  gl_FragColor = vec4(color, 1.0);
} else {
  gl_FragColor = vec4(0.0);
}
    
}`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Program link error: " + gl.getProgramInfoLog(program));
    }
    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);
const positionLocation = gl.getAttribLocation(program, "a_position");
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const ballsLocation = gl.getUniformLocation(program, "u_balls");
const numBallsLocation = gl.getUniformLocation(program, "u_numBalls");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const quad = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
]);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const NUM_BALLS = 12;
const balls = [];
for (let i = 0; i < NUM_BALLS; i++) {
    let r = 60 + Math.random() * 40;
    balls.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: r,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        mass: Math.pow(r / 100, 2) + 0.5,
        temperature: 0.5,
        heatRate: 0.002
    });

}

function render() {
    for (let b of balls) {
        const mass = b.mass;

        // Температура
        if (b.y > canvas.height * 0.8) {
            b.temperature += b.heatRate * 0.5;  
        } else if (b.y < canvas.height * 0.2) {
            b.temperature -= b.heatRate * 0.5;
        }
        b.temperature = Math.max(0, Math.min(1, b.temperature));

        // Силы
        const buoyancy = (b.temperature - 0.5) * 2;
        const gravity = 0.05;

        // Теперь силы будут видимыми, но эффект — более реалистичный:
        b.vy -= (buoyancy * 0.2) / mass;  // раньше было 0.05
        b.vy += (gravity * 1.5) / mass;


        // Трение зависит от массы
        let friction = 0.97 + 0.01 * (1 - b.r / 100); // большие — инертнее
        b.vx *= friction;
        b.vy *= friction;

        // Ограничение скорости
        const maxSpeed = 1.5;
        b.vx = Math.max(-maxSpeed, Math.min(maxSpeed, b.vx));
        b.vy = Math.max(-maxSpeed, Math.min(maxSpeed, b.vy));

        // Движение
        b.x += b.vx;
        b.y += b.vy;

        // Стенки
        if (b.x < 0 || b.x > canvas.width) b.vx *= -0.8;
        if (b.y < 0 || b.y > canvas.height) b.vy *= -0.8;
    }
    /*Слияние
    for (let i = 0; i < balls.length; i++) {
        let a = balls[i];
        for (let j = i + 1; j < balls.length; j++) {
            let b = balls[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let dist = Math.hypot(dx, dy);

            // Если шары пересекаются сильно — сливаем
            if (dist < (a.r + b.r) * 0.1) {
                // Новый объём (пропорционален r^3)
                let volumeA = Math.pow(a.r, 3);
                let volumeB = Math.pow(b.r, 3);
                let totalVolume = volumeA + volumeB;

                // Новые параметры
                let newX = (a.x * volumeA + b.x * volumeB) / totalVolume;
                let newY = (a.y * volumeA + b.y * volumeB) / totalVolume;
                let newVX = (a.vx * volumeA + b.vx * volumeB) / totalVolume;
                let newVY = (a.vy * volumeA + b.vy * volumeB) / totalVolume;
                let newTemp = (a.temperature * volumeA + b.temperature * volumeB) / totalVolume;
                let newR = Math.cbrt(totalVolume); // обратно к радиусу
                let newMass = Math.pow(newR / 100, 2) + 0.5;

                // Создаем новый шар
                balls[i] = {
                    x: newX,
                    y: newY,
                    vx: newVX,
                    vy: newVY,
                    r: newR,
                    temperature: newTemp,
                    heatRate: (a.heatRate + b.heatRate) / 2,
                    mass: newMass
                };

                // Удаляем второй шар
                balls.splice(j, 1);
                j--; // перескакиваем назад, т.к. массив изменился
            }
        }
    }*/
    /*Деление
    for (let i = 0; i < balls.length; i++) {
        let b = balls[i];

        // Условие для деления
        if (b.r > 80 && b.temperature > 0.8 && Math.random() < 0.002) {
            // Новый объем — половина текущего
            let volume = Math.pow(b.r, 3) / 2;
            let newR = Math.cbrt(volume);

            // Температура и скорость с небольшим разбросом
            let temp1 = b.temperature * 0.95;
            let temp2 = b.temperature * 0.95;

            let vx1 = b.vx + (Math.random() - 0.5) * 0.5;
            let vy1 = b.vy + (Math.random() - 0.5) * 0.5;
            let vx2 = b.vx + (Math.random() - 0.5) * 0.5;
            let vy2 = b.vy + (Math.random() - 0.5) * 0.5;

            // Создаем два новых шара
            let ball1 = {
                x: b.x - newR / 2,
                y: b.y,
                vx: vx1,
                vy: vy1,
                r: newR,
                temperature: temp1,
                heatRate: b.heatRate,
                mass: Math.pow(newR / 100, 2) + 0.5
            };

            let ball2 = {
                x: b.x + newR / 2,
                y: b.y,
                vx: vx2,
                vy: vy2,
                r: newR,
                temperature: temp2,
                heatRate: b.heatRate,
                mass: Math.pow(newR / 100, 2) + 0.5
            };

            // Заменяем текущий шар на один из новых, добавляем второй
            balls[i] = ball1;
            balls.push(ball2);
        }
    }*/


    const data = [];
    for (let b of balls) {
        data.push(b.x, b.y, b.r);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1i(numBallsLocation, balls.length);
    gl.uniform3fv(ballsLocation, new Float32Array(data));
    gl.drawArrays(gl.TRIANGLES, 0, 6);



    updateFPS();
    requestAnimationFrame(render);
}
// FPS tracking
let fpsCounter = document.getElementById("fps");
let lastTime = performance.now();
let frames = 0;
let fps = 0;

function updateFPS() {
    const now = performance.now();
    frames++;
    if (now - lastTime >= 1000) {
        fps = frames;
        frames = 0;
        lastTime = now;
        fpsCounter.textContent = `FPS: ${fps}`;
    }
}


render();
