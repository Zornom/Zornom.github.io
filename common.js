let scale = 0;
// Box width
let offset = 0;
let textsize = 0;

let snapto = 0.5;
let numPositions = 8;
let inAnimation = false;
let bw = 0;
let bh = 0;
let rectHeight;
let rectWidth;
let noclear = false;

function next() {
    if (current < BILDER.length - 1) {
        current++;
        refresh();
    }
}

function prev() {
    if (current > 0) {
        current--;
        refresh();
    }
}

// Center the coordinate system on canvas
window.onload = function () {
    document.querySelector(':root').style.setProperty('--teamcolor', COLOR);

    canvas = document.getElementById('halle');

    // Wait for BILDER to be loaded from the other script
    setTimeout(function() {
        // Calculate optimal scale and offset - center the coordinate system
        while (bw * 1.1 < innerWidth && bh * 1.3 < innerHeight) {
            offset++;
            scale = offset * 2;
            bw = scale * (2 * FLOORSIZE + 1) + 1 + 2 * offset;
            bh = scale * (2 * FLOORSIZE + 1) + 1 + 2 * offset;
        }
        textsize = Math.ceil(offset / 1.2);
        rectHeight = offset/1.8;
        rectWidth = offset/1.8;

// Listen for mouse moves
        canvas.addEventListener('click', function (event) {
            onclick(gridToCoord(event.clientX - canvas.offsetLeft), gridToCoord(event.clientY - canvas.offsetTop))
        });

        canvas.addEventListener('mousemove', function (event) {
            onmove(gridToCoord(event.clientX - canvas.offsetLeft), gridToCoord(event.clientY - canvas.offsetTop))
        });
        window.addEventListener('keydown', this.onkey, false);


        canvas.setAttribute("height", "" + bh);
        canvas.setAttribute("width", "" + bw);

        refresh();
    }, 500);
};

function drawFloor(context){
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get current theme colors from CSS variables - this will update automatically on theme change
    const root = document.querySelector(':root');
    const bgColor = root.style.getPropertyValue('--canvas-bg').trim() || '#f5f5f5';
    const gridColor = root.style.getPropertyValue('--grid-color').trim() || '#000000';
    const gridThinColor = root.style.getPropertyValue('--grid-thin').trim() || '#cccccc';
    
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = textsize + "px Cambria";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = gridColor;

    for (var i = -FLOORSIZE; i <= FLOORSIZE; i += 1) {
        const gridX = coordToGrid(i);
        const gridY = coordToGrid(i);

        // Draw grid labels
        context.fillText(Math.abs(i), gridX, offset / 2);
        context.fillText(Math.abs(i), gridX, bh - offset / 2);
        context.fillText(Math.abs(i), offset / 2, gridY);
        context.fillText(Math.abs(i), bw - offset / 2, gridY);

        // Draw thick grid lines
        context.strokeStyle = gridColor;
        context.lineWidth = 1;
        
        context.beginPath();
        context.moveTo(0.5 + coordToGrid(i), 0 + offset);
        context.lineTo(0.5 + coordToGrid(i), bh - offset);
        context.stroke();

        context.beginPath();
        context.moveTo(0 + offset, 0.5 + coordToGrid(i));
        context.lineTo(bw - offset, 0.5 + coordToGrid(i));
        context.stroke();

        // Draw thin grid lines between major lines (except at boundaries)
        if (i < FLOORSIZE) {
            const midX = (coordToGrid(i) + coordToGrid(i+1)) / 2;
            context.beginPath();
            context.moveTo(0.5 + midX, 0 + offset);
            context.lineTo(0.5 + midX, bh - offset);
            context.stroke();

            const midY = (coordToGrid(i) + coordToGrid(i+1)) / 2;
            context.beginPath();
            context.moveTo(0 + offset, 0.5 + midY);
            context.lineTo(bw - offset, 0.5 + midY);
            context.stroke();
        }
    }

    // Draw origin point (center) with red cross
    const originX = coordToGrid(0);
    const originY = coordToGrid(0);
    
    context.strokeStyle = '#ff6b6b';
    context.lineWidth = 2;
    
    context.beginPath();
    context.moveTo(originX - 5, originY);
    context.lineTo(originX + 5, originY);
    context.stroke();

    context.beginPath();
    context.moveTo(originX, originY - 5);
    context.lineTo(originX, originY + 5);
    context.stroke();

    // Draw origin label
    context.font = (textsize * 0.8) + "px Cambria";
    context.fillStyle = '#ff6b6b';
    context.fillText('0', originX, originY - 10);


    context.beginPath();
    context.moveTo(0.5 + coordToGrid(0), 0 + offset);
    context.lineTo(0.5 + coordToGrid(0), bh - offset);

    context.moveTo(0 + offset, 0.5 + coordToGrid(0));
    context.lineTo(bw - offset, 0.5 + coordToGrid(0));


    context.strokeStyle = gridThinColor;
    context.lineWidth = 1;
    context.stroke();


}

function drawBoard() {
    const context = canvas.getContext("2d");
    drawFloor(context)

    for (let pointsKey = 0; pointsKey < numPositions; pointsKey++) {
        drawPoint(context, points[pointsKey]);
    }
}

function drawPoint(context, point) {
    if(point.dx !== undefined && point.dy !== undefined && (point.dx !== point.x || point.dy !== point.y)){
        var rectX = coordToGrid(point.dx);
        var rectY = coordToGrid(point.dy);
        drawMan(context, point)
    } else {
        var rectX = coordToGrid(point.x);
        var rectY = coordToGrid(point.y);
    }

    context.fillStyle = COLOR;
    context.beginPath();
    context.moveTo(rectX - rectWidth, rectY);
    context.lineTo(rectX, rectY - rectHeight);
    context.lineTo(rectX + rectWidth, rectY);
    context.lineTo(rectX, rectY + rectHeight);
    context.fill();

    context.font = textsize + "px Cambria";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.fillText(point.p, rectX, rectY);
}

function drawMan(context, point) {
    var rectX = coordToGrid(point.x);
    var rectY = coordToGrid(point.y);
    context.fillStyle = "#073642"; // Darker man figure for better visibility

    context.beginPath();
    context.moveTo(rectX - rectWidth * .7, rectY);
    context.lineTo(rectX, rectY - rectHeight * .7);
    context.lineTo(rectX + rectWidth * .7, rectY);
    context.lineTo(rectX, rectY + rectHeight * .7);
    context.fill();

    context.font = (textsize * .7) + "px Cambria";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.fillText(point.p, rectX, rectY);
}


function gridToCoord(g) {
    return (g - 2 * offset - 0.5) / scale - FLOORSIZE;
}

function coordToGrid(c) {
    return (c + FLOORSIZE) * scale + 2 * offset + 0.5;
}

function snap(p) {
    return Math.round(p / snapto) * snapto;
}
