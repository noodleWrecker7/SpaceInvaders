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
var PLAYER_SPEED = 150;
var PLAYER_FIRE_TIMEOUT = 0.8; // seconds
var BULLET_LIST = [];
var COINS_LIST = [];
var BULLET_SPEED = 300;
var COIN_YSPEED = 200;
var COIN_ANIM_TIME = 1; // seconds for full cycle
var COIN_VALUE = 1;
var alienDir = 1;
var alienXSpeed = 2;
var ALIEN_SPEED_INCREMENT = 1.2;
var ALIEN_ARRAY = [];
var alienAnimCycleTime = 1 // seconds for full cycle
var NUM_OF_INVADERS_COLUMNS = 10;
var INVADER_X_GAP = 55;
var INVADER_Y_MARGIN = 40;
var INVADER_Y_GAP = 50;
var INVADER_Y_DROP_DIST = 15;
var BARRIER_LIST = [];
var GAME_OVER = false;
var GAME_WON = false;


// Setup variables
var textures;
const IMG_SHEET_PATH = "./assets/sheet.png";
const DATA_SHEET_PATH = "./assets/sheet.json";
var player;
var alienDropY;


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
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);


};

function createInvaders() {
    let totalWidthOfInvaders = (NUM_OF_INVADERS_COLUMNS - 1) * INVADER_X_GAP;
    let margin = (cvs.width - totalWidthOfInvaders) / 2;
    for (let i = 0; i < NUM_OF_INVADERS_COLUMNS; i++) {
        ALIEN_ARRAY[i] = [];
        for (let j = 0; j < 6; j++) {
            let num = j;
            if (num == 5) {
                num = 4;
            }
            ALIEN_ARRAY[i].push(new Alien(margin + (i * INVADER_X_GAP), INVADER_Y_MARGIN + (j * INVADER_Y_GAP), num))
        }

    }
}

function keydown(e) {
    if (GAME_WON || GAME_OVER) {
        reset();
    }
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
        case "l":
            GAME_OVER = true;
            break;
        case "g":
            GAME_WON = true;
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

    constructor(imgSheet, dataSheetPath) {
        console.log("before");
        //this.dataSheet = require(dataSheetPath);
        if (this.dataSheet == null) {
            fetch(dataSheetPath)
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    this.dataSheet=data;
                    reset();
                    globalDraw();
                });
        }
        this.imgSheet = imgSheet;
        this.load();
    }

    load() {
        this.img = new Image();
        this.img.src = this.imgSheet;
    }

    draw(spriteName, x, y, _ctx, scale = 1) {
        if(this.dataSheet == null) return;
        let obj = this.dataSheet.frames[spriteName];
        _ctx.drawImage(this.img, obj.frame.x, obj.frame.y, obj.frame.w, obj.frame.h, Math.floor(x), Math.floor(y), obj.frame.w * scale, obj.frame.h * scale);
    }

    getSprite(spriteName) {
        if(this.dataSheet == null) return;
        let obj = this.dataSheet.frames[spriteName];
        return {w: obj.frame.w, h: obj.frame.h, test: "hi"};
    }
}

class Player {

    constructor() {
        this.x = 40;
        this.y = 750;
        this.left = false;
        this.right = false;
        this.shooting = false;
        this.dx = 0;
        this.bulletSpeed = BULLET_SPEED;
        this.shotTimeout = PLAYER_FIRE_TIMEOUT // seconds
        this.timeSinceShot = 0;
        this.money = 0;
        this.width = textures.getSprite("Turret.png").w;
        this.height = textures.getSprite("Turret.png").h;
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
        this.active = true;
        this.scale = 2;
    }


    update(c) {
        this.y += this.speed * c;
        if (!this.active) return;
        let bW = textures.getSprite(this.spriteName).w * this.scale;
        let bH = textures.getSprite(this.spriteName).h * this.scale;
        if (this.isPlayer) {
            for (let i = 0; i < ALIEN_ARRAY.length; i++) {
                for (let j = 0; j < ALIEN_ARRAY[i].length; j++) {
                    let al = ALIEN_ARRAY[i][j]
                    if (isColliding(this.x, this.y, bW, bH, al.x, al.y, al.width, al.height)) {
                        ALIEN_ARRAY[i].splice(j, 1);
                        if (ALIEN_ARRAY[i].length == 0) {
                            ALIEN_ARRAY.splice(i, 1);
                        }
                        alienXSpeed += ALIEN_SPEED_INCREMENT;
                        this.active = false;
                        return;
                    }
                }
            }
        } else {

            if (isColliding(this.x, this.y, bW, bH, player.x, player.y, player.width, player.height)) {
                console.log("PLAYER HIT");
                GAME_OVER = true;
                this.active = false;
            }
        }
        for (let i = 0; i < BARRIER_LIST.length; i++) {
            let barrier = BARRIER_LIST[i]
            if (isColliding(this.x, this.y, bW, bH, barrier.x, barrier.y, barrier.width, barrier.height)) {
                BARRIER_LIST[i].doDamage();
                this.active = false;
            }
        }
    }

    draw(_ctx) {
        if (this.active)
            textures.draw(this.spriteName, this.x, this.y, _ctx, this.scale);
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.ySpeed = COIN_YSPEED;
        //this.animCycle = 0;
        //this.animTotalTime = COIN_ANIM_TIME;
        this.animElapsed = 0;
    }

    update(calc) {
        this.y += this.ySpeed * calc;
        this.animElapsed += calc;
        if (this.animElapsed > COIN_ANIM_TIME) {
            this.animElapsed = 0;
        }
    }

    draw(_ctx) {
        let timeperanim = COIN_ANIM_TIME / 6;
        let anim = Math.floor(this.animElapsed / timeperanim)
        textures.draw("Coin-" + anim + ".png", this.x, this.y, _ctx, 2);
    }

}

//TODO animation
class Alien {

    constructor(centerX, y, num) {
        this.scale = 4;
        this.width = textures.getSprite("Invader-" + num + "-0.png").w * this.scale;
        this.height = textures.getSprite("Invader-" + num + "-0.png").h * this.scale;
        this.x = centerX - ((this.width) / 2);
        this.centerX = centerX;
        this.y = y;
        this.num = num;
        // this.currentAnim = 0;
        this.animElapsed = 0;
    }

    update(calc) {
        this.animElapsed += calc;
        if (this.animElapsed > alienAnimCycleTime) {
            this.animElapsed = 0;
            let n = Math.floor(Math.random() * 1000);
            if (n == 69) {
                this.dropCoin();
            }
            if (n > 2 && n <= 10) {
                this.dropBullet();
            }
        }
        this.x += alienDir * (alienXSpeed * calc);
        if (alienDropY) {
            this.y += INVADER_Y_DROP_DIST;
        }

        if (this.y + this.height > 700) {
            GAME_OVER = true;
        }
    }

    dropCoin() {
        COINS_LIST.push(new Coin(this.centerX, this.y))
    }

    dropBullet() {
        BULLET_LIST.push(new Bullet("Bullet-Enemy.png", BULLET_SPEED, this.centerX, this.y + this.height, false))
    }

    draw(_ctx) {
        let anim = Math.floor(this.animElapsed / (alienAnimCycleTime / 2));
        textures.draw("Invader-" + this.num + "-" + anim + ".png", this.x, this.y, _ctx, this.scale);
    }

}

class Barrier {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.scale = 3;
        this.damage = 0;
        this.width = textures.getSprite("Barrier-0.png").w * this.scale;
        this.height = textures.getSprite("Barrier-0.png").h * this.scale;
    }

    draw(_ctx) {
        textures.draw("Barrier-" + this.damage + ".png", this.x, this.y, _ctx, this.scale)
    }

    doDamage() {
        this.damage++;
        if (this.damage > 3) {
            killBarrier();
        }
    }
}

function killBarrier() {
    for (let i = 0; i < BARRIER_LIST.length; i++) {
        if (BARRIER_LIST[i].damage > 3) {
            BARRIER_LIST.splice(i, 1);
            return;
        }
    }
}

let num = 0;

function reset() {
    PLAYER_SPEED = 150;
    PLAYER_FIRE_TIMEOUT = 0.8; // seconds
    BULLET_LIST = [];
    COINS_LIST = [];
    BULLET_SPEED = 300;
    COIN_YSPEED = 200;
    COIN_ANIM_TIME = 1; // seconds for full cycle
    COIN_VALUE = 1;
    alienDir = 1;
    alienXSpeed = 8;
    ALIEN_SPEED_INCREMENT = 1;
    ALIEN_ARRAY = [];
    alienAnimCycleTime = 1 // seconds for full cycle
    NUM_OF_INVADERS_COLUMNS = 10;
    INVADER_X_GAP = 55;
    INVADER_Y_MARGIN = 40;
    INVADER_Y_GAP = 50;
    INVADER_Y_DROP_DIST = 15;
    BARRIER_LIST = [];

    player = new Player();
    COINS_LIST.push(new Coin(100, 100));
    createInvaders()
    for (let i = 0; i < 4; i++) {
        BARRIER_LIST.push(new Barrier(75 + (i * 150) - 39, 700));
    }

    GAME_OVER = false;
    GAME_WON = false;
}

function update(calc) {
    if (GAME_OVER) {
        ctx.fillStyle = "white";
        ctx.font = "100px Arial"
        ctx.fillText("YOU SUCK!", 200, 300, 200)
        return;
    }
    if (GAME_WON) {
        ctx.fillStyle = "white";
        ctx.font = "100px Arial"
        ctx.fillText("YOU WIN!", 200, 300, 200)
        return;
    }
    offScreenContext.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    offScreenContext.fillStyle = "black";
    offScreenContext.fillRect(0, 0, cvs.width, cvs.height);

    // PLAYER
    player.update(calc);
    player.draw(offScreenContext);

    /*num++;
    if (num > 5) num = 0;
    textures.draw("Coin-" + num + ".png", 10, 200, offScreenContext, 2);*/

    // COINS
    let cW = textures.getSprite("Coin-0.png").w;
    let cH = textures.getSprite("Coin-0.png").h;
    let p = textures.getSprite("Turret.png");
    for (let i = 0; i < COINS_LIST.length; i++) {
        COINS_LIST[i].update(calc);
        COINS_LIST[i].draw(offScreenContext);
        let c = COINS_LIST[i];
        if (isColliding(c.x, c.y, cW * 2, cH * 2, player.x, player.y, p.w, p.h)) {
            COINS_LIST.splice(i, 1);
            player.money += COIN_VALUE;
            i--;
        }
    }

    // ALIENS
    let alWidth = textures.getSprite("Invader-4-0.png").w * 4;
    if (ALIEN_ARRAY == null) {
        GAME_WON = true;
        //GAME_OVER = true;
    }
    if (ALIEN_ARRAY[0][0].x - 15 + alienDir * (alienXSpeed * calc) < 0 || ALIEN_ARRAY[ALIEN_ARRAY.length - 1][0].x + alWidth + alienDir * (alienXSpeed * calc) > cvs.width) {
        alienDir = -alienDir;
        alienDropY = true;
    } // if goes off screen
    for (let i = 0; i < ALIEN_ARRAY.length; i++) {
        for (let j = 0; j < ALIEN_ARRAY[i].length; j++) {
            ALIEN_ARRAY[i][j].update(calc);
            ALIEN_ARRAY[i][j].draw(offScreenContext);
        }
    }
    alienDropY = false;
    // BULLETS
    for (let i = 0; i < BULLET_LIST.length; i++) {
        let bullet = BULLET_LIST[i];
        if (bullet.y < 0 || bullet.y > cvs.height) {
            BULLET_LIST.splice(i, 1);
            i--;
            continue;
        }

        BULLET_LIST[i].update(calc);
        BULLET_LIST[i].draw(offScreenContext)
    }

    // BARRIERS
    for (let i = 0; i < BARRIER_LIST.length; i++) {
        BARRIER_LIST[i].draw(offScreenContext)
    }

    ctx.drawImage(offScreenCanvas, 0, 0);
}

function isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2) {
        return true;
    } else return false;
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