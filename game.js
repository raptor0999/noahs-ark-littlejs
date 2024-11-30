/*
    Little JS Hello World Demo
    - Just prints "Hello World!"
    - A good starting point for new projects
*/

'use strict';

// show the LittleJS splash screen
//setShowSplashScreen(true);

let gameStarted, waveNumber, waveStarted, waveTimer, waveFinished, enemySpawnTimer, friendlySpawnTimer, noah, ark, friendlies, enemies;

const levelSize = vec2(40, 23);
let waveTimeDefault = 5.0;
let enemySpawnTimeDefault = 2.0;
const friendlySpawnTimeDefault = 2.0;
const maxFriendliesAllowed = 1;

const enemyHealthModifierByWave = [0,0,1,1,2,3,4,5];
const friendlyModifierByWave = [0,0,1,1,2,3,4,5];

const snd_wave_start = new Sound([2.1,,319,.05,.18,.41,,1.9,-9,,,,.07,,,.2,.13,.6,.17,.22]); // Powerup 2
const snd_enemy_spawn = new Sound([1.8,0,261.6256,.1,.62,.37,2,.2,,,,,.1,,,.1,.13,.32,.1,.45,-1044]); // Music 0
const snd_enemy_hit = new Sound([3.3,,209,.01,.02,.18,3,3.1,,1,,,,1.1,,.4,.11,.89,.09,,-1556]); // Hit 6
const snd_enemy_die = new Sound([,,194,.02,.03,.02,3,2.3,-2,30,,,,,,,,.56,.02,.12]); // Blip 5
const snd_ark_hit = new Sound([2,,424,.02,.06,.11,,1.7,-4,,,,,1.6,,.5,.11,.83,.03]); // Hit 3
const snd_ark_destroy = new Sound([2.1,,51,.06,.22,.33,4,3.7,,,,,,1.2,,.5,.35,.3,.23]); // Explosion 4

class Noah extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1,1));

        this.setCollision();

        this.health = 10;
        this.speed = 0.05;
        this.state = 'idle';
        this.target = 0;
        this.damage = 1;
        this.attackTimer = new Timer(0);
        this.attackTimerDefault = 0.8;
        this.spawnRange = 3.0;
        this.showSpawnRange = true;
        this.color = rgb(1, 1, 1, 1);
    }

    update() {
        if(this.state == 'idle') {
            // do nothing
        } else if(this.state == 'moving') {
            // move towards target
        } else if(this.state == 'attacking') {
            // attack
        }

        // find target and move toward
        if(this.target) {
            this.dir = this.target.subtract(this.pos).normalize(this.speed);
            this.velocity = this.dir;

            if(this.target.distance(this.pos) < 0.2) {
                this.target = 0;
                this.velocity = vec2(0,0);
            }
        }

        super.update();
    }

    collideWithObject(o) {
        if(this.attackTimer.elapsed() && o instanceof EnemyAnimal) {
            // attack enemy
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }

        /*if(o instanceof Ark) {
            this.pos.subtract(this.dir);
            this.target = 0;
            this.velocity = vec2(0,0);
        }*/
    }

    takeDamage(dmg) {
        console.log("Health was " + this.health);
        this.health -= dmg;
        console.log("Health is " + this.health);

        if(this.health < 1) {
            //snd_ark_destroy.play()
            ark = 0;
            this.destroy();
        } else {
            //snd_ark_hit.play();
        }
    }
}

class Ark extends EngineObject {
    constructor(pos) {
        super(pos, vec2(2,2));

        this.setCollision();

        this.health = 5;
        this.color = rgb(0.522, 0.467, 0.278, 1);
    }

    takeDamage(dmg) {
        console.log("Health was " + this.health);
        this.health -= dmg;
        console.log("Health is " + this.health);

        if(this.health < 1) {
            snd_ark_destroy.play()
            ark = 0;
            this.destroy();
        } else {
            snd_ark_hit.play();
        }
    }
}

class Animal extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1,1));

        this.health = 1;
        this.speed = .04;
        this.damage = 1;
    }
}

class EnemyAnimal extends Animal {
    constructor(pos) {
        super(pos, vec2(1,1));

        this.setCollision();

        this.attackTimer = new Timer(0);
        this.attackTimerDefault = 1.5;

        this.color = rgb(1, 0, 0, 1);

        snd_enemy_spawn.play();

        enemySpawnTimer = new Timer(enemySpawnTimeDefault);

        if(waveNumber <= enemyHealthModifierByWave.length) {
            // modify enemy health
            this.health += enemyHealthModifierByWave[waveNumber-1];
        }
    }

    update() {
        // find ark and move toward
        if(ark) {
            this.velocity = ark.pos.subtract(this.pos).normalize(this.speed);
        }

        super.update();
    }

    collideWithObject(o) {
        if(o instanceof Ark) {
            o.takeDamage(this.damage);

            this.destroy();
        }

        if(this.attackTimer.elapsed() && o instanceof FriendlyAnimal) {
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }
    }

    takeDamage(dmg, i) {
        console.log("Health was " + this.health);
        this.health -= dmg;
        console.log("Health is " + this.health);

        if(this.health < 1) {
            snd_enemy_die.play()

            this.destroy();
            enemies.splice(i, 1);
        } else {
            snd_enemy_hit.play();
        }
    }
}

class FriendlyAnimal extends Animal {
    constructor(pos) {
        super(pos, vec2(1,1));

        this.setCollision();

        this.attackDistance = 5.0;
        this.attackTimer = new Timer(0);
        this.attackTimerDefault = 1.5;
        this.target = 0;
        this.color = rgb(1, 1, 1, 1);

        friendlySpawnTimer = new Timer(friendlySpawnTimeDefault);
    }

    update() {
        // let's not even let animal scan until ready to attack
        /*if(this.attackTimer.elapsed()) {
            for (let i=0;i<enemies.length;i++) {
                if(this.pos.distance(enemies[i].pos) <= this.attackDistance) {
                    // are we within attack distance?
                    // if so attack and reset attack timer and exit out of loop so only one attack right now
                    enemies[i].takeDamage(this.damage, i);
                    this.attackTimer = new Timer(this.attackTimerDefault);
                    break;
                }
            }
        }*/

        // find nearest enemy and move toward
        let curEnemyDistance = 100.0

        for (let i=0;i<enemies.length;i++) {
            let enemyDistance = this.pos.distance(enemies[i].pos);

            if(enemyDistance < curEnemyDistance) {
                this.target = enemies[i].pos;
            }
        }

        if(this.target) {
            this.velocity = this.target.subtract(this.pos).normalize(this.speed);
        }

        // update physics
        super.update();
    }

    collideWithObject(o) {
        if(this.attackTimer.elapsed() && o instanceof EnemyAnimal) {
            // attack enemy
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }
    }

    takeDamage(dmg, i) {
        console.log("Health was " + this.health);
        this.health -= dmg;
        console.log("Health is " + this.health);

        if(this.health < 1) {
            snd_enemy_die.play()

            this.destroy();
            friendlies.splice(i, 1);
        } else {
            snd_enemy_hit.play();
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // called once after the engine starts up
    // setup the game
    canvasFixedSize = vec2(1280, 720); // 720p

    gameStarted = false;
    waveStarted = false;
    waveNumber = 0;
    waveTimer = 0.0;
    waveFinished = false;

    friendlies = [];
    enemies = [];
    
    
    cameraPos = levelSize.scale(.5);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // called every frame at 60 frames per second
    // handle input and update the game state
    if(waveStarted) {
        // do the wave!
        if (waveTimer.elapsed()) {
            waveFinished = true;
        }

        if(enemySpawnTimer.elapsed()) {
            // spawn enemyAnimal
            // pick a random spot outside of map bounds
            var spawnLocation;

            if(randInt(2)) {
                // we will pick a random x coord and spawn above or below map bounds
                spawnLocation = vec2(randInt(-1, levelSize.x+1), 1*randSign());
            } else {
                // we will pick a random x coord and spawn above or below map bounds
                spawnLocation = vec2(1*randSign(), randInt(-1, levelSize.y+1));
            }
            enemies.push(new EnemyAnimal(spawnLocation));
        }

        if(mouseWasPressed(0)) {
            noah.target = mousePos;
        }

        let friendlyMod = 0;
        if (waveNumber <= friendlyModifierByWave.length) {
            friendlyMod = friendlyModifierByWave[waveNumber-1];
        }

        if(mouseWasPressed(2) && friendlySpawnTimer.elapsed() && friendlies.length < maxFriendliesAllowed + friendlyMod) {
            // spawn friendlyAnimal if within spawn range
            console.log("Distance from Noah: " + mousePos.distance(noah.pos));

            if(mousePos.distance(noah.pos) <= noah.spawnRange) {
                friendlies.push(new FriendlyAnimal(mousePos));
            }
        }
    }

    if(waveFinished) {
        resetAnimals();

        startLevel();
    }

    if(!gameStarted && !ark && mouseWasPressed(0)) {
        gameStarted = true;

        ark = new Ark(vec2(levelSize.x/2, levelSize.y/2));
        console.log("Ark made");

        noah = new Noah(vec2(levelSize.x/2, levelSize.y/2-5));
        console.log("Noah made");
    
        startLevel();
        console.log("Level started");
    } else if(!waveStarted && mouseWasPressed(0)) {
        startWave();
    } else if(gameStarted && waveStarted && !ark && mouseWasPressed(0)) {
        newGame();
    }
}

function startLevel() {
    waveFinished = false;

    waveNumber += 1;
    waveTimeDefault += 5.0;
    enemySpawnTimeDefault -= 0.1;

    waveStarted = false;
}

function startWave() {
    waveStarted = true;
    console.log("Wave started");
    waveTimer = new Timer(waveTimeDefault);
    enemySpawnTimer = new Timer(3);
    friendlySpawnTimer = new Timer(0);
    snd_wave_start.play();
}

function newGame() {
    resetAnimals();

    waveStarted = false;
    gameStarted = false;
    waveNumber = 0;
    waveTimeDefault = 5.0;
    enemySpawnTimeDefault = 2.0;
}

function resetAnimals() {
    for (let i=0;i<enemies.length;i++) {
        enemies[i].destroy();
    }
    for (let i=0;i<friendlies.length;i++) {
        friendlies[i].destroy();
    }

    enemies = [];
    friendlies = [];
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{
    // called after physics and objects are updated
    // setup camera and prepare for render
}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // called before objects are rendered
    // draw any background effects that appear behind objects
    drawRect(cameraPos, levelSize.scale(2), rgb(1,1,1,1)); // background
    drawRect(cameraPos, levelSize, rgb(0.38823529411764707,0.8196078431372549,0.06666666666666667,1)); // grass
    if (gameStarted) {
        //drawRect(cameraPos, vec2(levelSize.x-4, 2), rgb(0.69, 0.639, 0.451, 1)); // road
    }
}

function drawEnemyHealth() {
    for (let i=0;i<enemies.length;i++) {
        drawText(enemies[i].health, enemies[i].pos.add(vec2(0, 1)), 1);
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // called after objects are rendered
    // draw effects or hud that appear above all objects
    if (!gameStarted) {
        drawTextScreen('Noah\'s Ark', mainCanvasSize.scale(.5), 80);
        drawTextScreen('Click to Start!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
    } else if (gameStarted && !waveStarted) {
        if (!ark) {
            drawTextScreen('You Lose!', mainCanvasSize.scale(.5), 80);
            drawTextScreen('Click to Play Again!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
        } else {
            drawTextScreen('Wave ' + waveNumber, mainCanvasSize.scale(.5), 80);
            drawTextScreen('Click to Start Wave!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
        }
    } else if (gameStarted && waveStarted) {
        if (!ark) {
            drawTextScreen('You Lose!', mainCanvasSize.scale(.5), 80);
            drawTextScreen('Click to Play Again!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
        } else {
            drawTextScreen('Ark Health: ' + ark.health, vec2(mainCanvasSize.x/2, 20), 30);
            if(waveTimer) {
                drawTextScreen('Time Remaining: ' + formatTime(abs(waveTimer.get())), vec2(mainCanvasSize.x/2, mainCanvasSize.y-20), 30);
            }
            if(enemySpawnTimer) {
                drawTextScreen('Enemy Spawning In: ' + formatTime(abs(enemySpawnTimer.get())), vec2(mainCanvasSize.x/2+300, mainCanvasSize.y-20), 20);
            }
            if(enemies.length > 0) {
                drawEnemyHealth();
            }
        }

        // draw spawn range
        if(noah.showSpawnRange) {
            // indicator green if in range and ready to spawn animal and red if out of
            var spawnRangeColor = rgb(1,0,0,0.8);

            let friendlyMod = 0;
            if (waveNumber <= friendlyModifierByWave.length) {
                friendlyMod = friendlyModifierByWave[waveNumber-1];
            }

            if(mousePos.distance(noah.pos) <= noah.spawnRange && friendlySpawnTimer.elapsed() && friendlies.length < maxFriendliesAllowed + friendlyMod) {
                spawnRangeColor = rgb(0,1,0,0.8)
            } 

            drawRect(mousePos, vec2(0.5, 0.5), spawnRangeColor);
        }
    }


    
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png']);