"use strict";

window.params = function() {
    let params = {};
    let param_array = (window.location.href.split('?')[1] || "").split('&');
    for (let i in param_array) {
        let x = param_array[i].split('=');
        params[x[0]] = x[1];
    }
    return params;
}();

let canvas;
let boardGraphics;
let grid;

const hr = window.innerHeight - 50;
const wr = window.innerWidth - 50;
const w = wr;
const h = hr;
const hpx = parseInt(window.params.size || 20);
const wpx = hpx;
const hg = Math.floor(h / hpx);
const wg = Math.floor(w / wpx);
const PLAY = 1;
const PAUSE = 2;
let state = PAUSE;
let board;
let speedSlider;
let currentSpeed;
let time = 0;
let lastFrame;

function setup() {
    canvas = createCanvas(wr, hr);
    frameRate(60);
    pixelDensity(1);
    speedSlider = document.getElementById('frameRateSlider');
    currentSpeed = 1000 / speedSlider.value;

    document.addEventListener('input', e => {
        currentSpeed = 1000 / parseInt(speedSlider.value);
        updateInfo();
    });

    document.addEventListener('keyup', e => {
        return keyReleasedListener(e.key);
    });

    document.addEventListener('keypress', e => {
        return keyPressedListener(e.key);
    });

    initGame();
    updateInfo();
    lastFrame = Date.now();
}

function initGame() {
    grid = createGrid(w, h);
    board = generateBoard();
    boardGraphics = createGraphics(w, h);
    drawBoard(board);
}

function updateInfo() {
    const status = "speed: " + Math.round(speedSlider.value) +
        ", brush: " + (brushColor === 0 ? 'white' : 'black') +
        ", " + (state === PAUSE ? "PAUSED" : "PLAYING");
    document.getElementById('info').innerText = status;
}

function randomBool() {
    return Math.round(Math.random());
}

function generateBoard(randF) {
    if (!randF)
        randF = randomBool;
    let board = [];
    for (let i = 0; i < wg; i++) {
        board.push([]);
        for (let j = 0; j < hg; j++) {
            board[i].push(randF());
        }
    }
    return board;
}

function nextTurn(old) {
    const neig = [
        [+1, 0],
        [-1, 0],
        [+1, +1],
        [+1, -1],
        [-1, +1],
        [-1, -1],
        [0, +1],
        [0, -1]
    ];
    let board = [];
    for (let i = 0; i < wg; i++) {
        board.push([]);
        for (let j = 0; j < hg; j++) {
            let k = 0;
            for (const l in neig) {
                let x = i + neig[l][0];
                let y = j + neig[l][1];
                if (x < 0 || y < 0 || x >= wg || y >= hg) {
                    continue;
                }
                k += old[x][y];
            }
            if (k < 2 || k > 3) {
                board[i].push(0);
            } else if (k == 2) {
                board[i].push(old[i][j]);
            } else if (k == 3) {
                board[i].push(1);
            }
        }
    }
    return board;
}

function draw() {
    let now = Date.now();
    let delta = now - lastFrame;
    background(255);
    if (state == PLAY) {
        time += delta;
        while (time >= currentSpeed) {
            board = nextTurn(board);
            drawBoard(board);
            time -= currentSpeed;
        }
    }
    image(grid, 0, 0);
    image(boardGraphics, 0, 0);
    lastFrame = now;
}

function drawBoard(board) {
    boardGraphics.background(255);
    boardGraphics.pixelDensity(1);
    boardGraphics.noStroke();
    boardGraphics.fill(0);
    for (let i = 0; i < wg; i++) {
        for (let j = 0; j < hg; j++) {
            if (board[i][j] == 1)
                boardGraphics.rect(i * wpx, j * hpx, wpx, hpx);
        }
    }
}

function createGrid(w, h) {
    let temp = createGraphics(w, h);
    temp.stroke(125);
    temp.strokeWeight(1);
    for (let i = 0; i < hg; i++) {
        temp.line(0, i * hpx, w, i * hpx);
    }
    for (let i = 0; i < wg; i++) {
        temp.line(i * wpx, 0, i * wpx, h);
    }
    return temp;
}

function keyReleasedListener(key) {
    if (key === " ") {
        if (state === PLAY) {
            state = PAUSE;
        } else if (state === PAUSE) {
            state = PLAY;
        }
    }
    updateInfo();
    return true;
}

function keyPressedListener(key) {
    if (key === "c") {
        state = PAUSE;
        board = generateBoard(() => 0);
        drawBoard(board);
    } else if (key === "n") {
        state = PAUSE;
        board = nextTurn(board);
        drawBoard(board);
    } else if (key === "g") {
        state = PAUSE;
        board = generateBoard();
        drawBoard(board);
    } else if (key === "x") {
        brushColor = 1 - brushColor;
    }
    updateInfo();
    return true;
}

function getMouseInGrid(maxX = wg, maxY = hg) {
    let x = Math.floor(mouseX / wpx);
    let y = Math.floor(mouseY / hpx);
    if (x < 0 || y < 0 || x >= maxX || y >= maxY)
        return [];
    return [x, y];
}

let lastMouse;
let drawColor = 0;
let brushColor = 0;

function mousePressed(e) {
    let [x, y] = getMouseInGrid();
    if (x === undefined) {
        lastMouse = null;
        return;
    }
    if (mouseButton !== LEFT) {
        return;
    }
    lastMouse = [x, y];
    board[x][y] = brushColor;
    drawBoard(board);
}

function mouseDragged() {
    if (!lastMouse) {
        return;
    }
    let [x, y] = getMouseInGrid();
    if (x === undefined) {
        lastMouse = null;
        return;
    }
    let [lx, ly] = lastMouse;
    if (x != lx || y != ly) {
        if (Math.abs(x - lx) + Math.abs(y - ly) > 1) {
            let steps = (Math.abs(x - lx) + Math.abs(y - ly)) * 3;
            for (let t = 0; t < steps; t++) {
                let nx = Math.round(lx + (x - lx) / steps * t);
                let ny = Math.round(ly + (y - ly) / steps * t);
                board[nx][ny] = brushColor;
            }
        } else {
            board[x][y] = brushColor;
        }
        drawBoard(board);
        lastMouse = [x, y];
    }
}

function mouseReleased() {
    lastMouse = null;
}