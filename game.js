/*
    Little JS Hello World Demo
    - Just prints "Hello World!"
    - A good starting point for new projects
*/

'use strict';

// show the LittleJS splash screen
//setShowSplashScreen(true);

let gameStarted, spriteAtlas, waveNumber, waveStarted, waveTimer, waveFinished, enemySpawnTimer, friendlySpawnTimer, noah, ark, friendlies, enemies;
let grassTiles, treeTiles, grassLayer, treeLayer;
const levelSize = vec2(42, 24);
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
const snd_noah_cast = new Sound([3.3,,529,.08,.44,.39,,3.4,-1,,,,.09,,,.1,.09,.99,.12,.03,-1407]); // Powerup 12

class Noah extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1.5,1.5));

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
        this.animationFrame = 0;
        this.frameTime = 0.1;
        this.frameTimer = new Timer(this.frameTime);
        this.idleAnimationOffset = 0;
        this.idleAnimationFrames = 2;
        this.moveAnimationOffset = 2;
        this.moveAnimationFrames = 6;
        this.castAnimationOffset = 0;
        this.castAnimationFrames = 6;
        this.isCasting = false;
        this.currentFrame = 0;
        this.frameOffset = 0;
        this.maxFrames = 0;
        this.drawSize = vec2(1.5,1.5);
    }

    update() {
        if(this.state == 'idle') {
            this.frameOffset = this.idleAnimationOffset;
            this.maxFrames = this.idleAnimationFrames;
            this.frameTime = 0.2;
        } else if(this.state == 'moving') {
            this.frameOffset = this.moveAnimationOffset;
            this.maxFrames = this.moveAnimationFrames;
            this.frameTime = 0.1;
        } else if(this.state == 'casting') {
            this.frameOffset = this.castAnimationOffset;
            this.maxFrames = this.castAnimationFrames;
            this.frameTime = 0.2;
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

        if(this.velocity.length() == 0) {
            this.state = 'idle';
        } else {
            this.state = 'moving';
        }

        if(this.isCasting) {
            this.state = 'casting';
            this.drawSize = vec2(1.5,3);
        } else {
            this.drawSize = vec2(1.5,1.5);
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
            noah = 0;
            this.destroy();
        } else {
            //snd_ark_hit.play();
        }
    }

    render() {
        

        if(this.isCasting) {
            this.tileInfo = spriteAtlas.playerCast.frame(this.animationFrame);
        } else {
            this.tileInfo = spriteAtlas.player.frame(this.animationFrame);
        }

        // figure out what animation and then draw the frame
        if(this.frameTimer.elapsed()) {
            // increment frame
            if(this.currentFrame < this.maxFrames-1) {
                this.currentFrame += 1;
                this.animationFrame = this.currentFrame + this.frameOffset;
            } else {
                this.currentFrame = 0;
                this.animationFrame = this.currentFrame + this.frameOffset;

                if(this.isCasting) {
                    this.isCasting = false;
                }
            }

            this.frameTimer = new Timer(this.frameTime);
        }

        if(this.velocity.x < 0) {
            this.mirror = true;        
        } 
        if(this.velocity.x > 0) {
            this.mirror = false;
        }

        // draw shadow
        drawTile(vec2(this.pos.x, this.pos.y-0.4), vec2(1.2,1.2), spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);
        // draw character
        drawTile(this.pos, this.drawSize, this.tileInfo, this.color, this.angle, this.mirror);
        
    }
}

class Ark extends EngineObject {
    constructor(pos) {
        super(pos, vec2(8,4), spriteAtlas.ark);

        this.setCollision();

        this.health = 5;
        this.damage = 10;
    }

    collideWithObject(o) {
        if(o instanceof EnemyAnimal) {
            // attack enemy
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }
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

    render() {
        // draw shadow
        drawTile(vec2(this.pos.x, this.pos.y-0.4), vec2(8,4), spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);

        super.render();
    }
}

class Animal extends EngineObject {
    constructor(pos, spriteRef) {
        super(pos, vec2(1,1));

        this.health = 1;
        this.speed = .04;
        this.damage = 1;

        this.animationFrame = 0;
        this.drawSize = vec2(1,1);
        this.drawOffset = vec2(0,0);
        this.spriteReference = spriteRef;
        this.frameTime = 0.1;
        this.frameTimer = new Timer(this.frameTime);
        this.moveAnimationOffset = 0;
        this.moveAnimationFrames = 4;
        this.currentFrame = 0;
        this.frameOffset = 0;
        this.maxFrames = 0;
    }

    update() {
        if(this.state == 'idle') {
            // idle
        } else if(this.state == 'moving') {
            this.frameOffset = this.moveAnimationOffset;
            this.maxFrames = this.moveAnimationFrames;
        } else if(this.state == 'attacking') {
            // attack
        }

        if(this.velocity.length() == 0) {
            this.state = 'idle';
        } else {
            this.state = 'moving';
        }

        super.update();
    }

    render() {
        // figure out what animation and then draw the frame
        if(this.frameTimer.elapsed()) {
            // increment frame
            if(this.currentFrame < this.maxFrames-1) {
                this.currentFrame += 1;
                this.animationFrame = this.currentFrame + this.frameOffset;
            } else {
                this.currentFrame = 0;
                this.animationFrame = this.currentFrame + this.frameOffset;
            }

            this.frameTimer = new Timer(this.frameTime);
        }

        this.tileInfo = this.spriteReference.frame(this.animationFrame);

        if(this.velocity.x < 0) {
            this.mirror = true;        
        } else {
            this.mirror = false;
        }

        // draw shadow
        drawTile(vec2(this.pos.x, this.pos.y-0.2), this.drawSize, spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);

        drawTile(this.pos.add(this.drawOffset), this.drawSize, this.tileInfo, this.color, this.angle, this.mirror);
    }
}

class EnemyAnimal extends Animal {
    constructor(pos, spriteRef) {
        super(pos, spriteRef);

        this.id = randInt(32000);

        this.setCollision();

        this.attackTimer = new Timer(0);
        this.attackTimerDefault = 1.5;

        this.color = rgb(1, 1, 1, 1);

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
        if(this.attackTimer.elapsed() && o instanceof Ark) {
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }

        if(this.attackTimer.elapsed() && o instanceof FriendlyAnimal) {
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }
    }

    takeDamage(dmg) {
        console.log("Health was " + this.health);
        this.health -= dmg;
        console.log("Health is " + this.health);

        if(this.health < 1) {
            snd_enemy_die.play();

            removeEnemy(this);
            this.destroy();
        } else {
            snd_enemy_hit.play();
        }
    }
}

class Boar extends EnemyAnimal {
    constructor(pos) {
        super(pos, spriteAtlas.boar);
    }
    
}

class Skunk extends EnemyAnimal {
    constructor(pos) {
        super(pos, spriteAtlas.skunk);
    }
    
}

function findEnemyById(id) {
    for (let i=0;i<enemies.length;i++) {
        if(enemies[i].id == id) {
            return enemies[i];
        }
    }
}

function removeEnemy(enemy) {
    for (let i=0;i<enemies.length;i++) {
        if(enemies[i].id == enemy.id) {
            enemies.splice(i, 1);
        }
    }
}

class FriendlyAnimal extends Animal {
    constructor(pos, spriteRef) {
        super(pos, spriteRef);

        this.id = randInt(32000);

        this.setCollision();

        this.attackDistance = 5.0;
        this.attackTimer = new Timer(0);
        this.attackTimerDefault = 1.5;
        this.target = 0;
        this.color = rgb(1, 1, 1, 1);

        friendlySpawnTimer = new Timer(friendlySpawnTimeDefault);
    }

    collideWithObject(o) {
        if(this.attackTimer.elapsed() && o instanceof EnemyAnimal) {
            // attack enemy
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }
    }

    takeDamage(dmg) {
        console.log("Health was " + this.health);
        this.health -= dmg;
        console.log("Health is " + this.health);

        if(this.health < 1) {
            snd_enemy_die.play()

            removeFriendly(this);
            this.destroy();
        } else {
            snd_enemy_hit.play();
        }
    }
}

class Wolf extends FriendlyAnimal {
    constructor(pos) {
        super(pos, spriteAtlas.wolf);
    }

    update() {
        // do sanity check for target
        if(this.target) {
            if(this.target.health < 1) {
                // 0 out target
                this.target = 0;
            }
        }

        if(!this.target) {
            // find nearest enemy and target
            let curEnemyDistance = 100.0

            for (let i=0;i<enemies.length;i++) {
                let enemyDistance = this.pos.distance(enemies[i].pos);

                if(enemyDistance < curEnemyDistance) {
                    this.target = enemies[i];
                    break;
                }
            }
        }

        if(this.target) {
            this.velocity = this.target.pos.subtract(this.pos).normalize(this.speed);
        }

        // update physics
        super.update();
    }
}

class Cardinal extends FriendlyAnimal {
    constructor(pos) {
        super(pos, spriteAtlas.cardinal);

        this.speed = 0.06;
        this.size = vec2(0.7, 0.7);
        this.drawSize = vec2(0.7, 0.7);
        this.drawOffset = vec2(0, 0.5);
    }

    update() {
        // do sanity check for target
        if(this.target) {
            if(this.target.health < 1) {
                // 0 out target
                this.target = 0;
            }
        }

        if(!this.target) {
            // find nearest enemy and target
            let curEnemyDistance = 100.0

            for (let i=0;i<enemies.length;i++) {
                let enemyDistance = this.pos.distance(enemies[i].pos);

                if(enemyDistance < curEnemyDistance) {
                    this.target = enemies[i];
                    break;
                }
            }
        }

        if(this.target) {
            this.velocity = this.target.pos.subtract(this.pos).normalize(this.speed);
        }

        // update physics
        super.update();
    }
}

function findFriendlyById(id) {
    for (let i=0;i<friendlies.length;i++) {
        if(friendlies[i].id == id) {
            return friendlies[i];
        }
    }
}

function removeFriendly(friendly) {
    for (let i=0;i<friendlies.length;i++) {
        if(friendlies[i].id == friendly.id) {
            friendlies.splice(i, 1);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // called once after the engine starts up
    // setup the game
    canvasFixedSize = vec2(1280, 720); // 720p

    // create a table of all sprites
    spriteAtlas =
    {
        // large tiles
        player:  tile(0,32),
        wolf:  tile(8,32),
        cardinal:  tile(12,32),
        boar:  tile(16,32),
        skunk: tile(20,32),
        shadow: tile(24,32),
        ark: new TileInfo(vec2(32,96), vec2(64,32)),
        grass1: tile(27,32),
        grass2: tile(28,32),
        grass3: tile(29,32),
        grass4: tile(30,32),
        tree1: tile(31,32),
        tree2: tile(32,32),
        tree3: tile(33,32),
        tree4: tile(34,32),
        playerCast: new TileInfo(vec2(0,160), vec2(32,64)),

        // small tiles
        //gun:     tile(2,8),
        //grenade: tile(3,8),
    };

    grassTiles = [spriteAtlas.grass1, spriteAtlas.grass2, spriteAtlas.grass3, spriteAtlas.grass4];
    treeTiles = [spriteAtlas.tree1, spriteAtlas.tree2, spriteAtlas.tree3, spriteAtlas.tree4];
    
    grassLayer = new Array(levelSize.x);
    for(var i=0;i<grassLayer.length;i++) {
        grassLayer[i] = new Array(levelSize.y);
    }
    
    treeLayer = new Array(50);
    for(var i=0;i<treeLayer.length;i++) {
        treeLayer[i] = {
            pos: vec2(randInt(levelSize.x), randInt(levelSize.y)),
            tile: treeTiles[randInt(4)],
        };
    }

    for(var x=0;x<levelSize.x;x+=1) {
        for(var y=0;y<levelSize.y;y+=1) {
            grassLayer[x][y] = grassTiles[randInt(4)];
        }
    }

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

            if(randInt(2) == 0) {
                enemies.push(new Boar(spawnLocation));
            } else {
                enemies.push(new Skunk(spawnLocation));
            }
        }

        if(mouseWasPressed(0)) {
            noah.target = mousePos;
        }

        let friendlyMod = 0;
        if (waveNumber <= friendlyModifierByWave.length) {
            friendlyMod = friendlyModifierByWave[waveNumber-1];
        }

        if(mouseWasPressed(1) && !noah.isCasting) {
            noah.isCasting = true;
            noah.currentFrame = 0;
            snd_noah_cast.play();
        }

        if(mouseWasPressed(2) && friendlySpawnTimer.elapsed() && friendlies.length < maxFriendliesAllowed + friendlyMod) {
            // spawn friendlyAnimal if within spawn range
            console.log("Distance from Noah: " + mousePos.distance(noah.pos));

            if(mousePos.distance(noah.pos) <= noah.spawnRange) {
                if(randInt(2) == 0) {
                    friendlies.push(new Cardinal(mousePos));
                } else {
                    friendlies.push(new Wolf(mousePos));
                }
                
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

    // draw background
    //drawRect(cameraPos, levelSize.scale(2), rgb(1,1,1,1));
    
    // draw grass
    for(var x=0;x<levelSize.x;x+=1) {
        for(var y=0;y<levelSize.y;y+=1) {
            drawTile(vec2(x,y), vec2(1,1), grassLayer[x][y]);
        }
    }
    
    // draw trees 
    for(var x=0;x<treeLayer.length;x++) {
        drawTile(treeLayer[x].pos, vec2(2,2), treeLayer[x].tile);
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
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png', 'ark.png', 'grass.png']);