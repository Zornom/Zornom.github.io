let points = [];
let canvas;
let current = 0;
let spur = false;
let speed = 10;


function onclick(x, y) {
}

let touchstartX = 0
let touchstartY = 0

document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
})

document.addEventListener('touchend', e => {
    let swipeX = e.changedTouches[0].screenX - touchstartX;
    let swipeY = e.changedTouches[0].screenY - touchstartY;
    if (Math.abs(swipeX) > Math.abs(swipeY)) {
        if (swipeX < -2) next();
        if (swipeX > 2) prev();
    }
})

function onmove(x, y) {

}

function onkey(e) {
    e = e || window.event;

    if (e.keyCode == '38') {
        prev();
    } else if (e.keyCode == '40') {
        next();
    } else if (e.keyCode == '37') {
        prev();
    } else if (e.keyCode == '39') {
        next();
    }
}

function refresh() {
    points = BILDER[current].points;
    document.getElementById("bildname").innerText = BILDER[current].name;
    document.getElementById("tanz").innerText = BILDER[current].tanz;
    document.getElementById("drittel").innerText = BILDER[current].drittel;
    drawBoard();
}

function prevdrittel() {
    inAnimation = false;
    if (current > 0) {
        if (BILDER[current].drittel !== BILDER[current - 1].drittel) {
            current--;
        }
        while (current > 0 && BILDER[current].drittel === BILDER[current - 1].drittel) {
            current--;
        }
        refresh();
    }
}

function nextdrittel() {
    inAnimation = false;
    if (current < BILDER.length - 1) {
        while (current < BILDER.length - 1 && BILDER[current].drittel === BILDER[current + 1].drittel) {
            current++;
        }
        if (current < BILDER.length - 1) {
            current++;
        }
        refresh();
    }
}

function prevtanz() {
    inAnimation = false;
    if (current > 0) {
        if (BILDER[current].tanz !== BILDER[current - 1].tanz) {
            current--;
        }
        while (current > 0 && BILDER[current].tanz === BILDER[current - 1].tanz) {
            current--;
        }
        refresh();
    }
}

function nexttanz() {
    inAnimation = false;
    if (current < BILDER.length - 1) {
        while (current < BILBER.length - 1 && BILDER[current].tanz === BILDER[current + 1].tanz) {
            current++;
        }
        if (current < BILDER.length - 1) {
            current++;
        }
        refresh();
    }
}

function getPoint(positions, number) {
    for (const i in positions) {
        if (positions[i].p == number) {
            return positions[i];
        }
    }
}

// Animation functions
function animateNext(playmode) {
    if (inAnimation || current >= BILDER.length - 1) {
        return;
    }
    const context = canvas.getContext("2d");
    let steps = 100;
    let start = BILDER[current].points;
    let target = BILDER[current + 1].points;

    let startO = [];
    let targetO = [];
    let maxdistsq = 0;
    for (let i = 0; i < numPositions; i++) {
        startO[i] = getPoint(start, i + 1);
        targetO[i] = getPoint(target, i + 1);
        let distsq = (targetO[i].x - startO[i].x) * (targetO[i].x - startO[i].x) + (targetO[i].y - startO[i].y) * (targetO[i].y - startO[i].y);
        if(targetO[i].dx !== undefined || targetO[i].dy !== undefined || startO[i].dx !== undefined || startO[i].dy !== undefined) {
            if (targetO[i].dx === undefined || targetO[i].dy === undefined) {
                targetO[i].dx = targetO[i].x;
                targetO[i].dy = targetO[i].y;
            }
            if (startO[i].dx === undefined || startO[i].dy === undefined) {
                startO[i].dx = startO[i].x;
                startO[i].dy = startO[i].y;
            }
            let distsqD = (targetO[i].dx - startO[i].dx) * (targetO[i].dx - startO[i].dx) + (targetO[i].dy - startO[i].dy) * (targetO[i].dy - startO[i].dy);
            if (maxdistsq < distsqD) {
                maxdistsq = distsqD;
            }
        }
        if (maxdistsq < distsq) {
            maxdistsq = distsq;
        }
    }
    steps = (Math.sqrt(maxdistsq)+2) * (30/speed);


    inAnimation = true;
    animationStep(startO, targetO, 0, steps, context, playmode);

}

function animationStep(startO, targetO, w, steps, context, playmode) {
    if (!inAnimation) {
        return;
    }
    if (w >= steps) {
        inAnimation = false;
        next();
        if (playmode) {
            setTimeout(() => animateNext(true), 200);
        }
        return;
    }

    points = [];
    for (let i = 0; i < numPositions; i++) {
        let linPoint = {
            "p": startO[i].p,
            "x": ((targetO[i].x * w) + (startO[i].x * (steps - w))) / steps,
            "y": ((targetO[i].y * w) + (startO[i].y * (steps - w))) / steps
        }
        if(targetO[i].dx !== undefined || targetO[i].dy !== undefined || startO[i].dx !== undefined || startO[i].dy !== undefined) {
            if(targetO[i].dx === undefined || targetO[i].dy === undefined) {
                targetO[i].dx = targetO[i].x;
                targetO[i].dy = targetO[i].y;
            }
            if(startO[i].dx === undefined || startO[i].dy === undefined) {
                startO[i].dx = startO[i].x;
                startO[i].dy = startO[i].y;
            }
            linPoint.dx = ((targetO[i].dx * w) + (startO[i].dx * (steps - w))) / steps;
            linPoint.dy = ((targetO[i].dy * w) + (startO[i].dy * (steps - w))) / steps;
        }
        points[i] = linPoint;
    }
    drawBoard();
    if (spur) {
        context.beginPath();
        for (let i = 0; i < numPositions; i++) {
            context.moveTo(0.5 + coordToGrid(startO[i].x), 0.5 + coordToGrid(startO[i].y));
            context.lineTo(0.5 + coordToGrid(targetO[i].x), 0.5 + coordToGrid(targetO[i].y));
        }
        context.strokeStyle = COLOR;
        context.stroke();
    }
    setTimeout(() => animationStep(startO, targetO, w + 1, steps, context, playmode), 16);
}

// Expose functions globally for HTML buttons
window.nextImage = function() {
    if (current < BILDER.length - 1) {
        current++;
        refresh();
    }
};
