let quantity = Math.floor(Math.random() * (20 - 5) + 5);
let currentCount = quantity;
let components = [];

class Component {
    constructor(width, height, color, x, y) {
        this.width = width;
        this.height = height;
        this.color = color;
        this.x = x;
        this.y = y;
        this.speed_x = generateSpeed();
        this.speed_y = generateSpeed();
        this.isVisible = true;
    }

    update() {
        if (!this.isVisible) {
            return;
        }
        let ctx = gameArea.context;
        //ctx.save();
        //ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + this.width / -2, this.y + this.height / -2, this.width, this.height);
        //ctx.restore();
    }

    newPos() {
        if (this.x - this.width / 2 < 0)
            this.speed_x = generateSpeed();
        else if ((this.x + this.width / 2) >= gameArea.context.canvas.width)
            this.speed_x = -generateSpeed();
        if (this.y - this.height / 2 < 0)
            this.speed_y = -generateSpeed();
        else if ((this.y + this.height / 2) >= gameArea.context.canvas.height)
            this.speed_y = generateSpeed();
        this.x += this.speed_x;
        this.y -= this.speed_y;
    }

    hitTest(x, y) {
        console.log("x ", x, "this x", this.x)
        console.log("y ", y, "this y", this.y)
        return x <= this.x + this.width / 2 && x >= this.x - this.width / 2 && y <= this.y + this.height / 2 && y >= this.y - this.height / 2;

    }
}

let gameArea = {}

function startGame() {
    gameArea = {
        canvas: document.getElementById('gameCanvas'), //document.createElement("canvas"),
        start: function () {
            this.canvas.width = window.innerWidth - 100;
            this.canvas.height = window.innerHeight - 100;
            this.context = this.canvas.getContext("2d");
            document.body.insertBefore(this.canvas, document.body.childNodes[0]);
            //this.frameNo = 0;
            this.interval = setInterval(updateGameArea, 20);
        },
        stop: function () {
            clearInterval(this.interval);
        },
        clear: function () {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };

    for (let i = 0; i < quantity; i++) {
        components[i] = new Component(100, 70, "#00ffea", generatePosition('w'), generatePosition('h'));

    }
    gameArea.start();

    gameArea.canvas.onclick = function (event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left; //x position within the element.
        const y = event.clientY - rect.top;  //y position within the element.
        console.log("Canvas click", x, y);
        for (let i = 0; i < quantity; i++) {
            let comp = components[i];
            if (comp.hitTest(x, y)) {
                // Yes clicked on "i"
                if (comp.isVisible) {
                    comp.isVisible = false; // whatever
                    currentCount--;
                }
            }
        }
    }
}

function generateSpeed() {
    return Math.floor(Math.random() * (10 - 1) + 1);
}

function generateDeltaSpeed() {
    return Math.random() * 4 - 2
}

function generatePosition(flag) {
    let pos;
    if (flag === 'w') {
        pos = Math.floor(Math.random() * (window.innerWidth - 100 - 100)) + 50;
    } else {
        pos = Math.floor(Math.random() * (window.innerHeight - 100 - 70)) + 35;
    }
    return pos;
}

function updateGameArea() {
    gameArea.clear();
    for (i = 0; i < quantity; i++) {
        components[i].newPos();
        components[i].update();
    }
    let ctx = gameArea.context;
    ctx.font = "30px Comic Sans MS";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Generated: " + quantity.toString(), window.innerWidth - 250, 50);
    ctx.fillText("Remaining: " + currentCount.toString(), window.innerWidth - 250, 100);
}

