const bg = document.getElementById('background');
const ctx = bg.getContext('2d');
bg.width = window.innerWidth;
bg.height = window.innerHeight;

let t = 0;

function drawLiquidBackground() {
    ctx.clearRect(0, 0, bg.width, bg.height);

    const gradient = ctx.createLinearGradient(
        0, 0,
        bg.width, bg.height
    );

    // Волнообразные цвета
    let r = Math.floor(100 + 50 * Math.sin(t * 0.002));
    let g = Math.floor(40 + 40 * Math.sin(t * 0.003 + 2));
    let b = Math.floor(100 + 100 * Math.sin(t * 0.004 + 1));

    gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(1, `rgb(${255 - r}, ${255 - g}, ${255 - b})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, bg.width, bg.height);

    t++;
    requestAnimationFrame(drawLiquidBackground);
}

drawLiquidBackground();
