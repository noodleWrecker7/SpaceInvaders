// Canvas things
let cvs = document.getElementById("gameCanvas");
let ctx = cvs.getContext("2d");
var offScreenCanvas;
var offScreenContext;

//cvs.width = window.innerWidth
//cvs.height = window.innerHeight

// Clear canvas
ctx.fillStyle = "black";
ctx.fillRect(0, 0, cvs.width, cvs.height);

// Game variables
var PLAYER_SPEED = 100;
var BULLET_LIST = [];
var BULLET_SPEED = 200;

// Setup variables
var textures;
const IMG_SHEET_PATH = "./assets/sheet.png";
const DATA_SHEET_PATH = "./assets/sheet.json";
var player;


window.onload = async function () {
    focus();
    offScreenCanvas = document.createElement("canvas");
    offScreenCanvas.width = cvs.width;
    offScreenCanvas.height = cvs.height;
    offScreenContext = offScreenCanvas.getContext('2d');
    offScreenContext.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    textures = new TextureManager(IMG_SHEET_PATH, DATA_SHEET_PATH)
    console.log("after")
    //console.log(textures.dataSheet.meta.version);
    player = new Player();
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
    globalDraw();
}

function keydown(e) {
    switch (e.key) {
        case "ArrowLeft":
        case "a":
            player.left = true;
            break;
        case "ArrowRight":
        case "d":
            player.right = true;
            break;
        case "w":
        case "ArrowUp":
        case " ":
            player.shooting = true;
            break;
    }
}

function keyup(e) {
    switch (e.key) {
        case "ArrowLeft":
        case "a":
            player.left = false;
            break;
        case "ArrowRight":
        case "d":
            player.right = false;
            break;
        case "w":
        case "ArrowUp":
        case " ":
            player.shooting = false;
            break;
    }
}

class TextureManager {

    constructor(imgSheet, dataSheet) {
        console.log("before");
        this.dataSheet = require(dataSheet);
        this.imgSheet = imgSheet;
        this.load();
    }

    load() {
        this.img = new Image();
        this.img.src = this.imgSheet;
    }

    draw(spriteName, x, y, _ctx, scale = 1) {
        let obj = this.dataSheet.frames[spriteName];
        _ctx.drawImage(this.img, obj.frame.x, obj.frame.y, obj.frame.w, obj.frame.h, Math.floor(x), Math.floor(y), obj.frame.w * scale, obj.frame.h * scale);
    }

    getSprite(spriteName) {
        let obj = this.dataSheet.frames[spriteName];
        return {w: obj.frame.w, h: obj.frame.h, test: "hi"};
    }
}

class Player {

    constructor() {
        this.x = 40;
        this.y = 600;
        this.left = false;
        this.right = false;
        this.shooting = false;
        this.dx = 0;
        this.bulletSpeed = BULLET_SPEED;
        this.shotTimeout = 1 // seconds
        this.timeSinceShot = 1;
    }

    draw(_ctx) {
        textures.draw("Turret.png", this.x, this.y, _ctx, 1);
    }

    update(calc) {
        this.dx = 0;
        if (this.left && !this.right) {
            this.dx = -PLAYER_SPEED;
        }
        if (this.right && !this.left) {
            this.dx = PLAYER_SPEED;
        }

        this.x += this.dx * calc;
        this.timeSinceShot += 1 * calc;
        if (this.shooting && this.timeSinceShot > this.shotTimeout) { // TODO add timeout to shots
            this.shoot();
            this.timeSinceShot = 0;
        }
    }

    shoot() {
        let w = textures.getSprite("Turret.png").w;

        BULLET_LIST.push(new Bullet("Bullet-Player.png", -this.bulletSpeed, this.x + (w / 2) - 1, this.y, true));
        console.log("shot")
    }
}

class Bullet {
    constructor(spriteName, speed, x, y, isPlayer) {
        this.speed = speed;
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.spriteName = spriteName;
    }


    update(c) {
        this.y += this.speed * c;


    }

    draw(_ctx) {
        textures.draw(this.spriteName, this.x, this.y, _ctx, 2);
    }
}

//TODO bullet class
//TODO animation
class Alien {

}

class Barrier {

}

let num = 0;

function update(calc) {
    offScreenContext.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    offScreenContext.fillStyle = "black";
    offScreenContext.fillRect(0, 0, cvs.width, cvs.height);

    for (let i = 0; i < BULLET_LIST.length; i++) {
        let bullet = BULLET_LIST[i];
        if (bullet.y < 0 || bullet.y > cvs.height) {
            BULLET_LIST.splice(i, 1);
            i--;
            continue;
        }

        BULLET_LIST[i].y += bullet.speed * calc;
        BULLET_LIST[i].draw(offScreenContext)
    }

    player.update(calc);
    player.draw(offScreenContext);
    num++;
    if (num > 5) num = 0;
    textures.draw("Coin-" + num + ".png", 10, 200, offScreenContext, 2);
    ctx.drawImage(offScreenCanvas, 0, 0);
}

//var fps = 120;
var now;
var then = Date.now();
//var interval = 1000 / fps;
var delta;
var calc;

//let pastDelta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function globalDraw() {
    //await sleep(4);
    requestAnimationFrame(globalDraw);

    //
    now = Date.now();
    delta = now - then;
    //if (delta > interval) {

    // update time stuffs

    // Just `then = now` is not enough.
    // Lets say we set fps at 10 which means
    // each frame must take 100ms
    // Now frame executes in 16ms (60fps) so
    // the loop iterates 7 times (16*7 = 112ms) until
    // delta > interval === true
    // Eventually this lowers down the FPS as
    // 112*10 = 1120ms (NOT 1000ms).
    // So we have to get rid of that extra 12ms
    // by subtracting delta (112) % interval (100).
    // Hope that makes sense.

    then = now// - (delta % interval);

    // ... Code for Drawing the Frame ...
    calc = delta / 1000;
    update(calc);
    //}
}