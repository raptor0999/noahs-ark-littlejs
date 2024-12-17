/*
    Little JS Hello World Demo
    - Just prints "Hello World!"
    - A good starting point for new projects
*/

'use strict';

// show the LittleJS splash screen
//setShowSplashScreen(true);

let gameStarted, spriteAtlas, setupPhase, setupPhaseTimer, waveNumber, waveStarted, waveTimer, waveFinished, enemySpawnTimer, friendlySpawnTimer, noah, ark, friendlies, enemies, spawners;
let grassTiles, treeTiles, grassLayer, treeLayer;
let totalEnemiesKilled, enemiesKilledInWave;
let waterObjects = [];
let endingObjects = [];
let setupTimeDefault = 20.0;
let waveTimeDefault = 25.0;
let enemySize = 1.1;
let enemySpawnTimeDefault = 2.0;

let waterAmount = 0;
let rainParticle;
let rainRate = 0;
let rainIncreaseRate = 500;

let win = false;
let winWave = 11;
let ending = false;

const levelSize = vec2(42, 24);
const friendlySpawnTimeDefault = 2.0;
const maxFriendliesAllowed = 1;

const afterWaveUpgrade = ['Noah Atk Dmg+', 'Noah Atk Spd+', 'Noah Cast Dmg+', 'Noah Cast Spd+', 'Noah Spd+'];
let upgrade1 = '';
let upgrade2 = '';

const enemyHealthModifierByWave = [0,0,0,0,1,1,1,2,3,4];
const friendlyModifierByWave = [0,0,1,1,2,2,2,3,3,3];

const snd_button_click = new Sound([1,,397,.02,.06,.07,,3.4,,,,,,,,,.07,.86,.04]); // Pickup 41
const snd_wave_upgrade = new Sound([0.5,,666,.05,.15,.41,,2.8,,,,,.03,,3,,,.8,.15,,971]); // Powerup 23
const snd_wave_start = new Sound([0.5,,319,.05,.18,.41,,1.9,-9,,,,.07,,,.2,.13,.6,.17,.22]); // Powerup 2
const snd_enemy_spawn = new Sound([0.3,0,261.6256,.1,.62,.37,2,.2,,,,,.1,,,.1,.13,.32,.1,.45,-1044]); // Music 0
const snd_enemy_hit = new Sound([0.2,,209,.01,.02,.18,3,3.1,,1,,,,1.1,,.4,.11,.89,.09,,-1556]); // Hit 6
const snd_enemy_die = new Sound([0.1,,194,.02,.03,.02,3,2.3,-2,30,,,,,,,,.56,.02,.12]); // Blip 5
const snd_ark_hit = new Sound([0.3,,424,.02,.06,.11,,1.7,-4,,,,,1.6,,.5,.11,.83,.03]); // Hit 3
const snd_ark_destroy = new Sound([0.8,,51,.06,.22,.33,4,3.7,,,,,,1.2,,.5,.35,.3,.23]); // Explosion 4
const snd_noah_cast = new Sound([0.3,,529,.08,.44,.39,,3.4,-1,,,,.09,,,.1,.09,.99,.12,.03,-1407]); // Powerup 12
const snd_noah_cast_explosion = new Sound([0.1,,85,.1,.48,.51,4,3.1,4,-1,,,.05,,,.2,,.8,.32,.16]); // Explosion 20
const snd_spawner_place = new Sound([0.1,,568,.02,.13,.32,,.2,,-1,-68,.05,.09,,1,,,.59,.29]); // Powerup 17

let audio = document.createElement("audio");
audio.loop = true;
audio.volume = 1.0;
let msc_title_src, msc_setup_src, msc_wave1_src;

// Initialize music generation (player).
var t0 = new Date();
var setup_player = new CPlayer();
setup_player.init(setup_song);

// Generate music...
var setup_done = false;
setInterval(function () {
    if (setup_done) {
      return;
    }

    setup_done = setup_player.generate() >= 1;

    if (setup_done) {
      var t1 = new Date();
      console.log("msc setup generate done (" + (t1 - t0) + "ms)");

      // Put the generated song in an Audio element.
      var wave = setup_player.createWave();
      msc_setup_src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
    }
});

var title_player = new CPlayer();
title_player.init(title_song);

// Generate music...
var title_done = false;
setInterval(function () {
    if (title_done) {
      return;
    }

    title_done = title_player.generate() >= 1;

    if (title_done) {
      var t1 = new Date();
      console.log("msc title generate done (" + (t1 - t0) + "ms)");

      // Put the generated song in an Audio element.
      var wave = title_player.createWave();
      msc_title_src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
    }
});

var wave1_player = new CPlayer();
wave1_player.init(wave_song_1);

// Generate music...
var wave1_done = false;
setInterval(function () {
    if (wave1_done) {
      return;
    }

    wave1_done = wave1_player.generate() >= 1;

    if (wave1_done) {
      var t1 = new Date();
      console.log("msc wave1 generate done (" + (t1 - t0) + "ms)");

      // Put the generated song in an Audio element.
      var wave = wave1_player.createWave();
      msc_wave1_src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
    }
});

function play_music(type) {
    audio.pause();
    audio.currentTime = 0.0;

    if(type == "title") {
        console.log("title music");
        audio.volume = 0.3;
        audio.src = msc_title_src;
    }

    if(type == "setup") {
        console.log("setup music");
        audio.volume = 1.0;
        audio.src = msc_setup_src;
    }

    if(type == "wave1") {
        console.log("wave music");
        audio.volume = 1.0;
        audio.src =  msc_wave1_src;
    }

    audio.play();
}

function toggle_music() {
    if(audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

function stop_music(type) {
    audio.pause();
    audio.currentTime = 0.0;
}

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
        this.showSpawnRange = false;
        this.spawnersAllowed = 0;
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
        this.castPoint = 0;
        this.castDone = true;
        this.castDamage = 2.0;
        this.castRadius = 10.0;
        this.castTimer = new Timer(0);
        this.castTimerDefault = 10.0;
        this.currentFrame = 0;
        this.frameOffset = 0;
        this.maxFrames = 0;
        this.drawSize = vec2(1,1);
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
            this.drawSize = vec2(1,2);
        } else {
            this.drawSize = vec2(1,1);
        }

        this.renderOrder = 1;

        if(ending) {
            this.renderOrder = 7;
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
        this.health -= dmg;

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
        if(!ending) {
            drawTile(vec2(this.pos.x, this.pos.y-0.2), vec2(0.8,0.8), spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);
        }
        // draw character
        drawTile(this.pos, this.drawSize, this.tileInfo, this.color, this.angle, this.mirror);
        // draw cast icon
        drawTile(vec2(this.pos.x+0.4, this.pos.y+0.2), vec2(0.3,0.3), spriteAtlas.circle, rgb(0,0,1,(this.castTimerDefault+this.castTimer.get())/10*0.7), this.angle, this.mirror);
    }
}

class Rainbow extends EngineObject {
    constructor(pos) {
        super(pos, vec2(32,32), spriteAtlas.rainbow);

        this.alpha = 0.0
        this.color = rgb(1,1,1,this.alpha);
        this.doveSpawnTimer = new Timer(0.0);
        this.doveSpawnTime = 0.6;

    }

    update() {
        this.renderOrder = 8;

        if(this.alpha < 0.5) {
            this.alpha += 0.002;
            this.color = rgb(1,1,1,this.alpha);
        }

        if(this.alpha > 0.3 && this.doveSpawnTimer.elapsed()) {
            endingObjects.push(new Dove(ark.pos));
            this.doveSpawnTimer = new Timer(this.doveSpawnTime);
        }

        super.update();
    }

    render() {
        // draw shadow
        //drawTile(vec2(this.pos.x, this.pos.y-0.4), vec2(8,4), spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);

        super.render();
    }
}



class Ark extends EngineObject {
    constructor(pos) {
        super(pos, vec2(8,4), spriteAtlas.ark);

        this.setCollision();

        this.health = 10;
        this.damage = 10;

        this.shiftTimer = new Timer(0.0);
        this.shiftTime = 1.0;

        this.endingWindowTimer = new Timer(0.0);
        this.endingWindowTime = 10.0;
    }

    collideWithObject(o) {
        if(o instanceof EnemyAnimal) {
            // attack enemy
            o.takeDamage(this.damage);
            this.attackTimer = new Timer(this.attackTimerDefault);
        }
    }

    takeDamage(dmg) {
        this.health -= dmg;

        if(this.health < 1) {
            snd_ark_destroy.play()
            ark = 0;
            this.destroy();
        } else {
            snd_ark_hit.play();
        }
    }

    update() {
        this.renderOrder = 5;

        if (ending) {
            // float around
            if(this.shiftTimer.elapsed()) {
                this.shiftTimer = new Timer(this.shiftTime);

                this.velocity = vec2(randSign()*rand()/10, randSign()*rand()/10);
            } else {
                // stutter just a bit
                //this.pos += randSign()*randVector(1)/30;
            }

            // don't float off screen
            if(this.pos.x - this.size.x/2 < 0) {
                this.velocity = vec2(0,0);
                this.pos.x = this.size.x/2;
            }
            if(this.pos.x + this.size.x/2 > levelSize.x) {
                this.velocity = vec2(0,0);
                this.pos.x = levelSize.x - this.size.x/2;
            }
            if(this.pos.y - this.size.y/2 < 0) {
                this.velocity = vec2(0,0);
                this.pos.y = this.size.y/2;
            }
            if(this.pos.y + this.size.y/2 > levelSize.y) {
                this.velocity = vec2(0,0);
                this.pos.y = levelSize.y - this.size.y/2;
            }
        }

        super.update();
    }

    render() {
        // draw shadow
        if(!ending) {
            drawTile(vec2(this.pos.x, this.pos.y-0.4), vec2(8,4), spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);
        }

        super.render();
    }
}

class Animal extends EngineObject {
    constructor(pos, spriteRef) {
        super(pos, vec2(1,1));

        this.health = 1;
        this.speed = .04;
        this.speed = rand(.04-.01, .04+.02);
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
            if(ending) {
                // move anyway
                this.frameOffset = this.moveAnimationOffset;
                this.maxFrames = this.moveAnimationFrames;
            }
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

        if(ending) {
            this.renderOrder = 6;
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

class Dove extends Animal {
    constructor(pos) {
        super(pos, spriteAtlas.dove);

        this.size = vec2(0.7, 0.7);
        this.drawSize = vec2(0.7, 0.7);
        this.drawOffset = vec2(0, 0.5);

        this.velocity = vec2(randSign()*rand()/5, randSign()*rand()/5);
    }

    update() {
        this.renderOrder = 5;

        if(ending) {
            this.renderOrder = 6;
        }

        if(this.pos.x < 0 || this.pos.x > levelSize.x && this.pos.y < 0 || this.pos.y > levelSize.y) {
            this.destroy();
        }

        super.update();
    }

    render() {
        // draw shadow
        //drawTile(vec2(this.pos.x, this.pos.y-0.4), vec2(8,4), spriteAtlas.shadow, rgb(1,1,1,0.6), this.angle, this.mirror);

        super.render();
    }
}

class EnemyAnimal extends Animal {
    constructor(pos, spriteRef) {
        super(pos, spriteRef);

        this.size = vec2(enemySize);
        this.drawSize = vec2(enemySize);

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
        this.health -= dmg;

        if(this.health < 1) {
            snd_enemy_die.play();

            removeEnemy(this);
            this.destroy();

            enemiesKilledInWave += 1;
            totalEnemiesKilled += 1;
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
        this.targetTimer = new Timer(0);
        this.targetTimerDefault = 1.0;
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
        this.health -= dmg;

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
        super(pos, getRandomAnimal());

        this.health = 2;
    }

    update() {
        // do sanity check for target
        if(this.target) {
            if(this.target.health < 1) {
                // 0 out target
                this.target = 0;
            }
        }

        if(!this.target || this.targetTimer.elapsed()) {
            // find nearest enemy and target
            let curEnemyDistance = 100.0

            for (let i=0;i<enemies.length;i++) {
                let enemyDistance = this.pos.distance(enemies[i].pos);

                if(enemyDistance < curEnemyDistance) {
                    this.target = enemies[i];
                    curEnemyDistance = enemyDistance;
                }
            }

            this.targetTimer = new Timer(this.targetTimerDefault)
        }

        if(this.target) {
            this.velocity = this.target.pos.subtract(this.pos).normalize(this.speed);
        }

        // update physics
        super.update();
    }
}

function getRandomBird() {
    let num = randInt(5);

    if(num == 0) {
        return spriteAtlas.cardinal;
    }
    if(num == 1) {
        return spriteAtlas.bird1;
    }
    if(num == 2) {
        return spriteAtlas.bird2;
    }
    if(num == 3) {
        return spriteAtlas.bird3;
    }
    if(num == 4) {
        return spriteAtlas.bird4;
    }
}

function getRandomAnimal() {
    let num = randInt(5);

    if(num == 0) {
        return spriteAtlas.wolf;
    }
    if(num == 1) {
        return spriteAtlas.animal1;
    }
    if(num == 2) {
        return spriteAtlas.animal2;
    }
    if(num == 3) {
        return spriteAtlas.animal3;
    }
    if(num == 4) {
        return spriteAtlas.animal4;
    }
}

class Cardinal extends FriendlyAnimal {
    constructor(pos) {
        super(pos, getRandomBird());

        this.speed += 0.02;
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
                    curEnemyDistance = enemyDistance;
                }
            }
        }

        if(this.target) {
            this.velocity = this.target.pos.subtract(this.pos).normalize(this.speed);
        }

        this.renderOrder = 3;

        // update physics
        super.update();
    }
}

class Tree extends EngineObject {
    constructor(pos, spriteRef) {
        super(pos, vec2(2,2), spriteRef);
    }

    update() {
        this.renderOrder = 2;

        super.update();
    }
}

class Water extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1,1), spriteAtlas.water);

        this.currentFrame = 0;
        this.frameOffset = 0;
        this.maxFrames = 40;
        this.animationFrame = 0;
        this.frameTime = 0.1;
        this.frameTimer = new Timer(this.frameTime);
    }

    update() {
        this.renderOrder = 0;

        super.update();
    }

    render() {
        let info = spriteAtlas.water.frame(this.animationFrame);
        this.tileInfo = info;

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

        // draw character
        drawTile(this.pos, this.drawSize, this.tileInfo, this.color, this.angle, this.mirror);
    }
}

function spawnWaterObjects(amount) {
    for(var i=0;i<amount;i++) {
        waterObjects.push(new Water(findRandomPosWithoutWater()));
    }
}

function findRandomPosWithoutWater() {
    while(true) {
        let noWaterFound = true;
        let newVec = vec2(randInt(levelSize.x), randInt(levelSize.y));

        for(var i=0;i<waterObjects.length;i++) {
            if(waterObjects[i].pos == newVec) {
                noWaterFound = false;
            }
        }

        if(noWaterFound) {
            return newVec;
        }
    }
}

class Spawner extends EngineObject {
    constructor(pos, spriteRef) {
        super(pos, vec2(1,1), spriteRef);

        this.spawnTime = 8.0;
        this.spawnTimer = 0;
    }
}

class BirdNest extends Spawner {
    constructor(pos) {
        super(pos, spriteAtlas.nest);
    }

    update() {
        if(waveStarted && !this.spawnTimer) {
            this.spawnTimer = new Timer(0);
        }

        if(setupPhase) {
            this.spawnTimer = 0;
        }

        if(this.spawnTimer && this.spawnTimer.elapsed()) {
            friendlies.push(new Cardinal(this.pos));

            this.spawnTimer = new Timer(this.spawnTime);
        }

        this.renderOrder = 2;

        super.update();
    }
}

class WolfDen extends Spawner {
    constructor(pos) {
        super(pos, spriteAtlas.cave);
    }

    update() {
        if(waveStarted && !this.spawnTimer) {
            this.spawnTimer = new Timer(0);
        }

        if(setupPhase) {
            this.spawnTimer = 0;
        }
        
        if(this.spawnTimer && this.spawnTimer.elapsed()) {
            friendlies.push(new Wolf(this.pos));

            this.spawnTimer = new Timer(this.spawnTime);
        }

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
        circle: tile(31,32),
        tree1: tile(32,32),
        tree2: tile(33,32),
        tree3: tile(34,32),
        tree4: tile(35,32),
        nest: tile(36,32),
        cave: tile(37,32),
        playerCast: new TileInfo(vec2(0,160), vec2(32,64)),
        water: tile(0,32,2),
        bird1: tile(0,32,1),
        bird2: tile(4,32,1),
        bird3: tile(8,32,1),
        bird4: tile(12,32,1),
        animal1: tile(16,32,1),
        animal2: tile(20,32,1),
        animal3: tile(24,32,1),
        animal4: tile(28,32,1),
        dove: tile(32,32,1),
        rainbow: tile(0,256,3),

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
        treeLayer[i] = new Tree(vec2(randInt(levelSize.x), randInt(levelSize.y)), treeTiles[randInt(4)]);
    }

    for(var x=0;x<levelSize.x;x+=1) {
        for(var y=0;y<levelSize.y;y+=1) {
            grassLayer[x][y] = grassTiles[randInt(4)];
        }
    }

    friendlies = [];
    enemies = [];
    spawners = [];

    
    
    cameraPos = levelSize.scale(.5);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // called every frame at 60 frames per second
    // handle input and update the game state
    if(!paused) {
        if(ending) {
            
        } else {
            if(waveStarted) {
            // do the wave!
            if (waveTimer.elapsed()) {
                waveFinished = true;
            }

            if(enemySpawnTimer.elapsed()) {
                // spawn enemyAnimal
                // pick a random spot outside of map bounds
                var spawnLocation;
                var oneOrAnother = randInt(2);

                if(randInt(2)) {
                    // we will pick a random x coord and spawn above or below map bounds
                    var theY;

                    if(oneOrAnother == 0) {
                        theY = 0;
                    } else {
                        theY = levelSize.y;
                    }
                    spawnLocation = vec2(randInt(0, levelSize.x+1), theY);
                } else {
                    // we will pick a random y coord and spawn left or right of map bounds
                    var theX;

                    if(oneOrAnother == 0) {
                        theX = 0;
                    } else {
                        theX = levelSize.x;
                    }
                    spawnLocation = vec2(theX, randInt(0, levelSize.y+1));
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

            if(mouseWasPressed(2) && !noah.isCasting && noah.castTimer.elapsed()) {
                noah.isCasting = true;
                noah.castDone = false;
                noah.currentFrame = 0;
                snd_noah_cast.play();
                noah.castPoint = mousePos;
            }

            if(noah.isCasting && noah.currentFrame == 5 && !noah.castDone) {
                snd_noah_cast_explosion.play();
                new ParticleEmitter(noah.castPoint, 0, 0.2, 0.6, 250, 3.14, tile(0, 16), new Color(1, 1, 0, 1), new Color(1, 0.502, 0.251, 1), new Color(1, 0, 0, 0.1), new Color(0.502, 0.251, 0.251, 0.1), 0.8, 0.1, 0.5, 0.15, 0.1, 1, 1, 0.1, 2.6, 0.05, 0.51, 0, 1, 1);

                // find enemies in cast radius and make them take damage
                while(true) {
                    var enemiesComplete = false;

                    for (let i=0;i<enemies.length;i++) {
                        let enemyDistance = noah.castPoint.distance(enemies[i].pos);

                        if(enemyDistance <= noah.castRadius) {
                            // this enemy is within the cast radius, lets f them up
                            if(enemies[i] instanceof EnemyAnimal) {
                                enemies[i].takeDamage(noah.castDamage);
                                console.log("Distance from cast: " + enemyDistance);
                                break;
                            }
                        }

                        if(i == enemies.length-1 || enemies.length == 0 || i >= enemies.length) {
                            enemiesComplete = true;
                        }
                    }

                    if(enemiesComplete || enemies.length < 1) {
                        break;
                    }
                }
                
                noah.castDone = true;
                noah.castTimer = new Timer(noah.castTimerDefault);
            }

            /*if(mouseWasPressed(2) && friendlySpawnTimer.elapsed() && friendlies.length < maxFriendliesAllowed + friendlyMod) {
                // spawn friendlyAnimal if within spawn range
                console.log("Distance from Noah: " + mousePos.distance(noah.pos));

                if(mousePos.distance(noah.pos) <= noah.spawnRange) {
                    if(randInt(2) == 0) {
                        friendlies.push(new Cardinal(mousePos));
                    } else {
                        friendlies.push(new Wolf(mousePos));
                    }
                    
                }
            }*/
            } else {
                if(setupPhase) {
                    if(mouseWasPressed(0)) {
                        noah.target = mousePos;
                    }

                    if(mouseWasPressed(2)) {
                        // let's see if it is in a tree
                        let treeOverlapped = false;
                        for(var i=0;i<treeLayer.length;i++) {
                            if(isOverlapping(mousePos, vec2(0.5,0.5), treeLayer[i].pos, treeLayer[i].size)) {
                                treeOverlapped = true;
                                break;
                            }
                        }

                        if(treeOverlapped && spawners.length < noah.spawnersAllowed) {
                            spawners.push(new BirdNest(mousePos));
                            snd_spawner_place.play();
                        }

                        // let's see if we are in water
                        let waterOverlapped = false;
                        for(var i=0;i<waterObjects.length;i++) {
                            if(isOverlapping(mousePos, vec2(0.5,0.5), waterObjects[i].pos, waterObjects[i].size)) {
                                waterOverlapped = true;
                                break;
                            }
                        }

                        if(!waterOverlapped && !treeOverlapped && spawners.length < noah.spawnersAllowed) {
                            spawners.push(new WolfDen(mousePos));
                            snd_spawner_place.play();
                        }

                        if(spawners.length == noah.spawnersAllowed) {
                            // go ahead and end the setup phase
                            setupPhaseTimer = new Timer(2.0);
                        }

                    }
                }

                if(setupPhase && setupPhaseTimer.elapsed()) {
                    stop_music();
                    startWave();
                }
            }

            if(waveFinished) {
                resetAnimals();

                startLevel();
            }

            if(!gameStarted && !ark && mouseWasPressed(0) && isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1))) {
                newGame();

                snd_button_click.play();
                gameStarted = true;

                
            
                startLevel();
                console.log("Level started");
            } else if(!waveStarted && mouseWasPressed(0) && !setupPhase && !win) {
                // play title music
                play_music("title");

                if(waveNumber > 1) {
                    // upgrade 1 clicked
                    if(isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x-4, cameraPos.y-4), vec2(7,2))) {
                        grantUpgrade(upgrade1);
                        setupPhase = true;
                        setupPhaseTimer = new Timer(setupTimeDefault);
                    }

                    // upgrade 2 clicked
                    if(isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x+4, cameraPos.y-4), vec2(7,2))) {
                        grantUpgrade(upgrade2);
                        setupPhase = true;
                        setupPhaseTimer = new Timer(setupTimeDefault);
                    }
                } else {
                    if(isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1))) {
                        setupPhase = true;
                        setupPhaseTimer = new Timer(setupTimeDefault);
                        play_music("setup");
                    }
                }
                
            } else if(!waveStarted && win && mouseWasPressed(0) && isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1))) {
                // win state!
                snd_button_click.play();
                newGame();
            } else if(gameStarted && waveStarted && !ark && mouseWasPressed(0) && isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1))) {
                snd_button_click.play();
                newGame();
            } else if(gameStarted && !waveStarted && !ark && mouseWasPressed(0) && isOverlapping(mousePos, vec2(0.1,0.1), vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1))) {
                snd_button_click.play();
                newGame();
            }
        }
        
    } else {
        // game paused, do nothing
    }
    
    
}

function startLevel() {
    waveFinished = false;
    waveNumber += 1;
    enemySize += 0.05;

    if (waveNumber > winWave) {
        startEnding();
    }

    if (waveNumber > 1) {
        waterAmount += 50;
        spawnWaterObjects(waterAmount);
    }

    rainRate += rainIncreaseRate;

    waveTimeDefault += 5.0;
    enemySpawnTimeDefault -= 0.1;
    noah.spawnersAllowed += 1;
    waveStarted = false;
    setupPhase = false;

    // establish upgrades to pick from
    upgrade1 = afterWaveUpgrade[randInt(afterWaveUpgrade.length)];
    upgrade2 = afterWaveUpgrade[randInt(afterWaveUpgrade.length)];
    while(upgrade1 == upgrade2) {
        upgrade2 = afterWaveUpgrade[randInt(afterWaveUpgrade.length)];
    }

    //setupPhase = true;
    //setupPhaseTimer = new Timer(setupTimeDefault);

    resetAnimals();
    stopRain();
}

function startEnding() {
    resetAnimals();
    stopRain();

    // for testing make sure that ground is covered with water
    for(var x=0;x<levelSize.x;x+=1) {
        for(var y=0;y<levelSize.y;y+=1) {
            endingObjects.push(new Water(vec2(x,y)));
        }
    }

    endingObjects.push(new Rainbow(cameraPos.add(vec2(0,2))));

    //spawn pairs of animals
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal1), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal1), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal2), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal2), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal3), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal3), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal4), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.animal4), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird1), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird1), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird2), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird2), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird3), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird3), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird4), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));
    ark.addChild(new FriendlyAnimal(ark.pos, spriteAtlas.bird4), vec2(randSign()*randInt(ark.size.x/2), randSign()*randInt(ark.size.y/2)));

    noah.pos = ark.pos;

    ark.endingWindowTimer = new Timer(ark.endingWindowTime);
    ending = true;
}

function startRain(rate) {
    rainParticle = new ParticleEmitter(
  cameraPos, 0,    //position, angle
  50,   // emitSize
  0,    // emitTime
  rate,  // emitRate
  0, // emitConeAngle
  tile(0, 16),  // tileIndex
  new Color(0, 0.251, 1, 1),    // colorStartA
  new Color(0, 0.251, 1, 1),  // colorStartB
  new Color(0, 0, 0.502, 0.9),  // colorEndA
  new Color(0, 0, 0.8, 0.8),  // colorEndB
  1,  // particleTime
  0.4, // sizeStart
  0.2, // sizeEnd
  -0.2, // speed
  0,    // angleSpeed
  0.92, // damping
  0.71, // angleDamping
  -9.8,    // gravityScale
  0,    // particleConeAngle
  0.1, // fadeRate
  0.8,  // randomness
  0,    // collideTiles
  1,    // additive
  1,    // randomColorLinear
); // particle emitter
}

function stopRain() {
    if(rainParticle instanceof ParticleEmitter) {
        rainParticle.destroy();
    }
}

function startWave() {
    setupPhase = false;
    enemiesKilledInWave = 0;
    waveStarted = true;
    console.log("Wave started");
    waveTimer = new Timer(waveTimeDefault);
    enemySpawnTimer = new Timer(3);
    friendlySpawnTimer = new Timer(0);
    snd_wave_start.play();

    play_music("wave1");
    startRain(rainRate);
}

function newGame() {
    win = false;
    ending = false;

    if(ark) {
        ark.destroy();
    }

    ark = new Ark(vec2(levelSize.x/2, levelSize.y/2));
    console.log("Ark made");

    if(noah) {
        noah.destroy();
    }

    noah = new Noah(vec2(levelSize.x/2, levelSize.y/2-5));
    console.log("Noah made");

    resetEnding();
    resetAnimals();
    resetWater();

    totalEnemiesKilled = 0;
    enemiesKilledInWave = 0;
    waveStarted = false;
    gameStarted = false;
    setupPhase = false;
    waveNumber = 0;
    waveTimeDefault = 25.0;
    enemySpawnTimeDefault = 2.0;
    upgrade1 = '';
    upgrade2 = '';

    play_music("title");
}

function resetEnding() {
    for (let i=0;i<endingObjects.length;i++) {
        endingObjects[i].destroy();
    }

    endingObjects = [];
}

function resetAnimals() {
    for (let i=0;i<enemies.length;i++) {
        enemies[i].destroy();
    }
    for (let i=0;i<friendlies.length;i++) {
        friendlies[i].destroy();
    }
    for (let i=0;i<spawners.length;i++) {
        spawners[i].destroy();
    }

    enemies = [];
    friendlies = [];
    spawners = [];
}

function resetWater() {
    for (let i=0;i<waterObjects.length;i++) {
        waterObjects[i].destroy();
    }

    waterObjects = [];
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{
    // called after physics and objects are updated
    // setup camera and prepare for render
    if(keyWasPressed('KeyP')) {
        paused = !paused;
        toggle_music();
    }

    if(keyWasPressed('KeyE')) {
        startEnding();
    }
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
    /*for(var x=0;x<treeLayer.length;x++) {
        drawTile(treeLayer[x].pos, vec2(2,2), treeLayer[x].tile);
    }*/
}

function drawEnemyHealth() {
    for (let i=0;i<enemies.length;i++) {
        drawText(enemies[i].health, enemies[i].pos.add(vec2(0, 0.75)), 0.5);
    }
}

function grantUpgrade(upgrade) {
    snd_wave_upgrade.play();

    if(upgrade == 'Noah Atk Dmg+') {
        noah.damage += 1;
    }

    if(upgrade == 'Noah Atk Spd+') {
        noah.attackTimerDefault -= 0.1;
    }

    if(upgrade == 'Noah Cast Dmg+') {
        noah.castDamage += 1.0;
    }

    if(upgrade == 'Noah Cast Spd+') {
        noah.castTimerDefault -= 0.5;
    }

    if(upgrade == 'Noah Spd+') {
        noah.speed += 0.01;
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // called after objects are rendered
    // draw effects or hud that appear above all objects

    

    if(paused) {
        // paused so draw not much
        drawRect(cameraPos, levelSize, rgb(0,0,0,0.6));
        drawTextScreen('PAUSED', mainCanvasSize.scale(.5), 80);
    } else {
        if (ending) {
            if(ark.endingWindowTimer.elapsed()) {
                // win state!
                drawRect(cameraPos.add(vec2(0,-0.5)), vec2(15,8), rgb(0.9,0.9,0.9,0.6));
                drawRect(cameraPos.add(vec2(0,-0.5)), vec2(14,7), rgb(0.1,0.1,0.1,0.6));
                drawTextScreen('You Win!', mainCanvasSize.scale(.5), 80, rgb(1,1,1,1));
                drawRect(vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1), rgb(0,0.9,0,0.6));
                drawTextScreen('Refresh to play again!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20, rgb(1,1,1,1));
            }
        } else {
            if (!gameStarted) {
                drawRect(cameraPos.add(vec2(0,-0.5)), vec2(21,7), rgb(0.9,0.9,0.9,1));
                drawRect(cameraPos.add(vec2(0,-0.5)), vec2(20,6), rgb(0.1,0.1,0.1,1));
                drawTextScreen('Noah\'s Ark', mainCanvasSize.scale(.5), 80);
                drawRect(vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1), rgb(0,0.9,0,1));
                drawTextScreen('Click to Start!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
            } else if (gameStarted && !waveStarted && !setupPhase) {
                if (!ark) {
                    drawRect(cameraPos.add(vec2(0,-0.5)), vec2(15,8), rgb(0.9,0.9,0.9,1));
                    drawRect(cameraPos.add(vec2(0,-0.5)), vec2(14,7), rgb(0.1,0.1,0.1,1));
                    drawTextScreen('You Lose!', mainCanvasSize.scale(.5), 80);
                    drawRect(vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1), rgb(0,0.9,0,1));
                    drawTextScreen('Click to Play Again!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
                } else {
                     if (win) {
                        // win state!
                        drawRect(cameraPos.add(vec2(0,-0.5)), vec2(15,8), rgb(0.9,0.9,0.9,1));
                        drawRect(cameraPos.add(vec2(0,-0.5)), vec2(14,7), rgb(0.1,0.1,0.1,1));
                        drawTextScreen('You Win!', mainCanvasSize.scale(.5), 80);
                        drawRect(vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1), rgb(0,0.9,0,1));
                        drawTextScreen('Click to Play Again!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
                    } else if(waveNumber > 1) {
                        drawRect(cameraPos, vec2(21,14), rgb(0.9,0.9,0.9,1));
                        drawRect(cameraPos, vec2(20,13), rgb(0.1,0.1,0.1,1));
                        drawTextScreen('Enemies killed during Wave ' + (waveNumber-1) + ': ' + enemiesKilledInWave, mainCanvasSize.scale(.5).add(vec2(0,-160)), 30);
                        drawTextScreen('Total enemies killed this game: ' + totalEnemiesKilled, mainCanvasSize.scale(.5).add(vec2(0,-120)), 30);

                        // upgrade selection
                        drawRect(vec2(cameraPos.x-4, cameraPos.y-4), vec2(7,2), rgb(0.5,0.5,0.5,1));
                        drawTextScreen(upgrade1, mainCanvasSize.scale(.5).add(vec2(-125, 130)), 20);
                        drawRect(vec2(cameraPos.x+4, cameraPos.y-4), vec2(7,2), rgb(0.5,0.5,0.5,1));
                        drawTextScreen(upgrade2, mainCanvasSize.scale(.5).add(vec2(125, 130)), 20);
                    } else {
                        drawRect(cameraPos.add(vec2(0,-0.5)), vec2(15,8), rgb(0.9,0.9,0.9,1));
                        drawRect(cameraPos.add(vec2(0,-0.5)), vec2(14,7), rgb(0.1,0.1,0.1,1));

                        drawRect(vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1), rgb(0,0.9,0,1));
                        drawTextScreen('Click to start setup phase!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
                    }
                    
                    if(!win) {
                        drawTextScreen('Wave ' + waveNumber, mainCanvasSize.scale(.5), 80);
                    }
                    
                }
            } else if (gameStarted && !waveStarted && setupPhase) {
                if(setupPhaseTimer) {
                    drawRect(vec2(cameraPos.x, 22), vec2(14,2), rgb(0.1,0.1,0.1,0.4));
                    drawTextScreen('Spawners Placed: ' + spawners.length + '/' + noah.spawnersAllowed, vec2(mainCanvasSize.x/2, 40), 30);

                    drawRect(vec2(cameraPos.x, 2), vec2(16,2), rgb(0.1,0.1,0.1,0.6));
                    drawTextScreen('Setup Time Remaining: ' + formatTime(abs(setupPhaseTimer.get())), vec2(mainCanvasSize.x/2, mainCanvasSize.y-40), 30);
                }

                //drawRect(mousePos, vec2(0.5, 0.5), rgb(0,1,0,0.8));
            } else if (gameStarted && waveStarted) {
                if (!ark) {
                    drawRect(cameraPos.add(vec2(0,-0.5)), vec2(15,8), rgb(0.9,0.9,0.9,1));
                    drawRect(cameraPos.add(vec2(0,-0.5)), vec2(14,7), rgb(0.1,0.1,0.1,1));
                    drawTextScreen('You Lose!', mainCanvasSize.scale(.5), 80);
                    drawRect(vec2(cameraPos.x,cameraPos.y-1.8), vec2(8,1), rgb(0,0.9,0,1));
                    drawTextScreen('Click to Play Again!', mainCanvasSize.scale(.5).add(vec2(0,60)), 20);
                } else {
                    drawRect(vec2(cameraPos.x, 22), vec2(10,2), rgb(0.1,0.1,0.1,0.4));
                    drawTextScreen('Ark Health: ' + ark.health, vec2(mainCanvasSize.x/2, 40), 30);
                    if(waveTimer) {
                        drawRect(vec2(cameraPos.x, 2), vec2(10,2), rgb(0.1,0.1,0.1,0.4));
                        drawTextScreen('Time Remaining: ' + formatTime(abs(waveTimer.get())), vec2(mainCanvasSize.x/2, mainCanvasSize.y-40), 30);
                    }
                    if(enemySpawnTimer) {
                        drawRect(vec2(cameraPos.x+10, 2), vec2(9,2), rgb(0.1,0.1,0.1,0.4));
                        drawTextScreen('Enemy Spawning In: ' + formatTime(abs(enemySpawnTimer.get())), vec2(mainCanvasSize.x/2+320, mainCanvasSize.y-40), 20);
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
        
    }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png', 'animals.png', 'water.png', 'rainbow.png']);