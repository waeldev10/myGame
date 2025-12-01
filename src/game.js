import { ParticleSystem } from './particles.js';

export class Game {
    constructor(canvas, onGameOver, onVictory, onScoreUpdate, onHealthUpdate) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.onGameOver = onGameOver;
        this.onVictory = onVictory;
        this.onScoreUpdate = onScoreUpdate;
        this.onHealthUpdate = onHealthUpdate;

        this.particles = new ParticleSystem();
        
        this.reset();
    }

    reset() {
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 15,
            color: '#3b82f6',
            speed: 5,
            health: 100,
            maxHealth: 100,
            angle: 0
        };

        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.isActive = false;
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.enemiesDefeated = 0;
        
        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.mouseDown = false;
        this.lastShot = 0;
        this.shootDelay = 150; // ms

        // Level config
        this.currentLevel = null;
    }

    startLevel(level) {
        this.reset();
        this.currentLevel = level;
        this.isActive = true;
        this.resize();
        
        // Initial health update
        this.onHealthUpdate(100);
        this.onScoreUpdate(0);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    handleInput(type, code, x, y) {
        if (type === 'keydown') this.keys[code] = true;
        if (type === 'keyup') this.keys[code] = false;
        if (type === 'mousemove') {
            this.mouse.x = x;
            this.mouse.y = y;
        }
        if (type === 'mousedown') this.mouseDown = true;
        if (type === 'mouseup') this.mouseDown = false;
    }

    update(timestamp) {
        if (!this.isActive) return;

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Player Movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.player.y -= this.player.speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.player.y += this.player.speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.x -= this.player.speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.x += this.player.speed;

        // Clamp player to screen
        this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

        // Player Rotation
        const dx = this.mouse.x - this.player.x;
        const dy = this.mouse.y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);

        // Shooting
        if (this.mouseDown && timestamp - this.lastShot > this.shootDelay) {
            this.shoot();
            this.lastShot = timestamp;
        }

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.x += Math.cos(b.angle) * b.speed;
            b.y += Math.sin(b.angle) * b.speed;

            // Remove if off screen
            if (b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
                this.bullets.splice(i, 1);
            }
        }

        // Spawn Enemies
        if (this.enemiesDefeated + this.enemies.length < this.currentLevel.enemyCount) {
            if (timestamp - this.enemySpawnTimer > this.currentLevel.spawnRate) {
                this.spawnEnemy();
                this.enemySpawnTimer = timestamp;
            }
        } else if (this.enemies.length === 0 && this.enemiesDefeated >= this.currentLevel.enemyCount) {
            this.victory();
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
            e.x += Math.cos(angle) * e.speed;
            e.y += Math.sin(angle) * e.speed;

            // Collision with Player
            const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
            if (dist < this.player.radius + e.radius) {
                this.playerHit(10);
                this.particles.createExplosion(e.x, e.y, e.color);
                this.enemies.splice(i, 1);
                this.enemiesDefeated++; // Count as defeated even if they hit player? Maybe. Let's say yes to progress.
                continue;
            }

            // Collision with Bullets
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j];
                const distB = Math.hypot(b.x - e.x, b.y - e.y);
                if (distB < e.radius + 5) { // 5 is bullet radius approx
                    this.particles.createExplosion(e.x, e.y, e.color);
                    this.enemies.splice(i, 1);
                    this.bullets.splice(j, 1);
                    this.score += 10;
                    this.enemiesDefeated++;
                    this.onScoreUpdate(this.score);
                    break;
                }
            }
        }

        this.particles.update();
        
        // Trail for player
        if (Math.random() < 0.3) {
            this.particles.createTrail(this.player.x, this.player.y, this.player.color);
        }
    }

    draw() {
        // Clear screen with fade effect for trails
        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (!this.isActive) return;

        // Draw Player
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // Ship Body
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(-15, 15);
        this.ctx.lineTo(-10, 0);
        this.ctx.lineTo(-15, -15);
        this.ctx.closePath();
        this.ctx.fillStyle = this.player.color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.player.color;
        this.ctx.fill();
        
        this.ctx.restore();

        // Draw Bullets
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = '#fff';
        for (let b of this.bullets) {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw Enemies
        for (let e of this.enemies) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = e.color;
            this.ctx.fillStyle = e.color;
            this.ctx.beginPath();
            // Draw a diamond shape or circle
            this.ctx.moveTo(e.x + e.radius, e.y);
            this.ctx.lineTo(e.x, e.y + e.radius);
            this.ctx.lineTo(e.x - e.radius, e.y);
            this.ctx.lineTo(e.x, e.y - e.radius);
            this.ctx.fill();
        }

        // Draw Particles
        this.particles.draw(this.ctx);
    }

    shoot() {
        this.bullets.push({
            x: this.player.x + Math.cos(this.player.angle) * 20,
            y: this.player.y + Math.sin(this.player.angle) * 20,
            angle: this.player.angle,
            speed: 12
        });
        // Recoil effect or sound could go here
    }

    spawnEnemy() {
        // Spawn at random edge
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -30 : this.width + 30;
            y = Math.random() * this.height;
        } else {
            x = Math.random() * this.width;
            y = Math.random() < 0.5 ? -30 : this.height + 30;
        }

        this.enemies.push({
            x: x,
            y: y,
            radius: 15,
            color: this.currentLevel.color,
            speed: this.currentLevel.enemySpeed * (0.8 + Math.random() * 0.4) // Variation
        });
    }

    playerHit(damage) {
        this.player.health -= damage;
        this.onHealthUpdate(this.player.health);
        
        // Screen shake or red flash could be triggered here via UI
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isActive = false;
        this.onGameOver(this.score);
    }

    victory() {
        this.isActive = false;
        this.onVictory(this.currentLevel.id);
    }
}
