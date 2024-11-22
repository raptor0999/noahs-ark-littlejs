/*
    Little JS Hello World Demo
    - Just prints "Hello World!"
    - A good starting point for new projects
*/

'use strict';

// show the LittleJS splash screen
//setShowSplashScreen(true);

let gameStarted, waveNumber, waveStarted, waveTimer, waveFinished, enemySpawnTimer, friendlySpawnTimer, ark, friendlies, enemies;

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

class Ark extends EngineObject {
    constructor(pos) {
        super(pos, vec2(4,5));

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
        this.speed = 1;
        this.damage = 1;
    }
}

class EnemyAnimal extends Animal {
    constructor(pos) {
        super(pos, vec2(1,1));

        this.setCollision();

        this.color = rgb(1, 0, 0, 1);
        this.velocity.x = 0.1;

        snd_enemy_spawn.play();

        enemySpawnTimer = new Timer(enemySpawnTimeDefault);

        if(waveNumber <= enemyHealthModifierByWave.length) {
            // modify enemy health
            this.health += enemyHealthModifierByWave[waveNumber-1];
        }
    }

    collideWithObject(o) {
        if(o instanceof Ark) {
            o.takeDamage(this.damage);

            this.destroy();
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

        this.attackDistance = 5.0;
        this.attackTimer = new Timer(0);
        this.attackTimerDefault = 1.5;
        this.color = rgb(1, 1, 1, 1);

        friendlySpawnTimer = new Timer(friendlySpawnTimeDefault);
    }

    update() {
        // let's not even let animal scan until ready to attack
        if(this.attackTimer.elapsed()) {
            for (let i=0;i<enemies.length;i++) {
                if(this.pos.distance(enemies[i].pos) <= this.attackDistance) {
                    // are we within attack distance?
                    // if so attack and reset attack timer and exit out of loop so only one attack right now
                    enemies[i].takeDamage(this.damage, i);
                    this.attackTimer = new Timer(this.attackTimerDefault);
                    break;
                }
            }
        }

        // update physics
        super.update();
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
            enemies.push(new EnemyAnimal(vec2(1, levelSize.y/2)));
        }

        let friendlyMod = 0;
        if (waveNumber <= friendlyModifierByWave.length) {
            friendlyMod = friendlyModifierByWave[waveNumber-1];
        }

        if(mouseWasPressed(0) && friendlySpawnTimer.elapsed() && friendlies.length < maxFriendliesAllowed + friendlyMod) {
            console.log("Mouse pos: " + mousePos);
            // spawn friendlyAnimal
            if((mousePos.y > 13 || mousePos.y < 10) && mousePos.x < 36) {
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

        ark = new Ark(vec2(levelSize.x-2, levelSize.y/2));
        console.log("Ark made");
    
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
        drawRect(cameraPos, vec2(levelSize.x-4, 2), rgb(0.69, 0.639, 0.451, 1));
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
    }
    
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png']);