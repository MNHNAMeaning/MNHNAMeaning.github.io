const canvas = document.getElementById('lava');
const ctx = canvas.getContext('2d');

resizeCanvas();
window.addEventListener('resize', resizeCanvas);


const circles = [];

for (let i = 0; i < 30; i++) {
    circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 60 + Math.random() * 40,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'lighter';

    for (let c of circles) {
        const gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        gradient.addColorStop(0, 'rgba(255, 0, 102, 0.8)');
        gradient.addColorStop(0.5, 'rgba(9, 255, 0, 0.8)');
        gradient.addColorStop(0.8, 'rgba(0, 26, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');


        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 0, 150, 0.7)";

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.dx;
        c.y += c.dy;

        if (c.x < 0 || c.x > canvas.width) c.dx *= -1;
        if (c.y < 0 || c.y > canvas.height) c.dy *= -1;
    }

    requestAnimationFrame(draw);
}
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // сброс трансформации
    ctx.scale(dpr, dpr);
}


draw();


