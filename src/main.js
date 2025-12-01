import { Game } from './game.js';
import { levels, saveProgress, loadProgress } from './levels.js';
import { Joystick } from './joystick.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');

    // Load saved progress
    loadProgress();

    // DOM Elements
    const canvas = document.getElementById('gameCanvas');
    const mainMenu = document.getElementById('main-menu');
    const levelSelect = document.getElementById('level-select');
    const hud = document.getElementById('hud');
    const gameOverScreen = document.getElementById('game-over');
    const victoryScreen = document.getElementById('victory-screen');
    const aboutScreen = document.getElementById('about-screen');
    const mobileControls = document.getElementById('mobile-controls');
    const levelsGrid = document.getElementById('levels-grid');

    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const healthBar = document.getElementById('health-bar');
    const healthText = document.getElementById('health-text');
    const finalScore = document.getElementById('final-score');

    // Buttons
    const btnStart = document.getElementById('btn-start');
    const btnLevels = document.getElementById('btn-levels');
    const btnAbout = document.getElementById('btn-about');
    const btnBackLevels = document.getElementById('btn-back-levels');
    const btnBackAbout = document.getElementById('btn-back-about');
    const btnRetry = document.getElementById('btn-retry');
    const btnMenuOver = document.getElementById('btn-menu-over');
    const btnNextLevel = document.getElementById('btn-next-level');
    const btnMenuWin = document.getElementById('btn-menu-win');

    console.log('Buttons found:', { btnStart, btnLevels, btnAbout });

    // Game Instance
    const game = new Game(
        canvas,
        onGameOver,
        onVictory,
        onScoreUpdate,
        onHealthUpdate
    );

    // State
    let currentLevelId = 1;
    let joystickLeft, joystickRight;
    let leftInput = { x: 0, y: 0 };
    let rightInput = { x: 0, y: 0 };

    // Check for touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    console.log('Is touch device:', isTouchDevice);

    if (isTouchDevice) {
        const leftZone = document.getElementById('joystick-left-zone');
        const rightZone = document.getElementById('joystick-right-zone');
        
        if (leftZone && rightZone) {
            joystickLeft = new Joystick('joystick-left-zone', 'joystick-left-knob', (x, y) => {
                leftInput = { x, y };
                game.setJoystickInput(leftInput, rightInput);
            });

            joystickRight = new Joystick('joystick-right-zone', 'joystick-right-knob', (x, y) => {
                rightInput = { x, y };
                game.setJoystickInput(leftInput, rightInput);
            });
            console.log('Joysticks initialized');
        }
    }

    // Event Listeners
    window.addEventListener('resize', () => game.resize());

    window.addEventListener('keydown', e => game.handleInput('keydown', e.code));
    window.addEventListener('keyup', e => game.handleInput('keyup', e.code));
    window.addEventListener('mousemove', e => game.handleInput('mousemove', null, e.clientX, e.clientY));
    window.addEventListener('mousedown', e => game.handleInput('mousedown'));
    window.addEventListener('mouseup', e => game.handleInput('mouseup'));

    // Menu Navigation
    btnStart.addEventListener('click', (e) => {
        console.log('Start button clicked');
        e.preventDefault();
        e.stopPropagation();
        startGame(1);
    });

    btnLevels.addEventListener('click', (e) => {
        console.log('Levels button clicked');
        e.preventDefault();
        e.stopPropagation();
        showLevelSelect();
    });

    btnAbout.addEventListener('click', (e) => {
        console.log('About button clicked');
        e.preventDefault();
        e.stopPropagation();
        showScreen(aboutScreen);
    });

    btnBackLevels.addEventListener('click', () => {
        showScreen(mainMenu);
    });

    btnBackAbout.addEventListener('click', () => {
        showScreen(mainMenu);
    });

    btnRetry.addEventListener('click', () => {
        startGame(currentLevelId);
    });

    btnMenuOver.addEventListener('click', () => {
        showScreen(mainMenu);
    });

    btnNextLevel.addEventListener('click', () => {
        const nextId = currentLevelId + 1;
        if (nextId <= levels.length) {
            startGame(nextId);
        } else {
            // All levels done
            showScreen(mainMenu);
        }
    });

    btnMenuWin.addEventListener('click', () => {
        showScreen(mainMenu);
    });

    // Functions
    function showScreen(screen) {
        console.log('Showing screen:', screen.id);
        [mainMenu, levelSelect, aboutScreen, hud, gameOverScreen, victoryScreen].forEach(s => s.classList.add('hidden'));
        mobileControls.classList.add('hidden');
        
        screen.classList.remove('hidden');
        
        // Show mobile controls only during gameplay (HUD)
        if (screen === hud && isTouchDevice) {
            mobileControls.classList.remove('hidden');
        }
    }

    function startGame(levelId) {
        const level = levels.find(l => l.id === levelId);
        if (!level) return;
        
        currentLevelId = levelId;
        
        showScreen(hud);
        levelDisplay.textContent = levelId;
        
        game.startLevel(level);
    }

    function showLevelSelect() {
        levelsGrid.innerHTML = '';
        levels.forEach(level => {
            const div = document.createElement('div');
            div.className = `p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 cursor-pointer
                ${level.unlocked 
                    ? 'border-blue-500 bg-blue-900/20 hover:bg-blue-800/40 hover:scale-105' 
                    : 'border-gray-700 bg-gray-900/50 opacity-50 cursor-not-allowed'}`;
            
            div.innerHTML = `
                <div class="text-3xl font-bold ${level.unlocked ? 'text-white' : 'text-gray-500'}">${level.id}</div>
                <div class="text-sm ${level.unlocked ? 'text-blue-300' : 'text-gray-600'}">${level.name}</div>
                ${!level.unlocked ? '<div class="text-xs text-red-500">مغلق</div>' : ''}
            `;

            if (level.unlocked) {
                div.addEventListener('click', () => startGame(level.id));
            }

            levelsGrid.appendChild(div);
        });
        showScreen(levelSelect);
    }

    // Callbacks
    function onGameOver(score) {
        finalScore.textContent = `النقاط: ${score}`;
        showScreen(gameOverScreen);
    }

    function onVictory(levelId) {
        saveProgress(levelId);
        // Refresh levels state
        loadProgress();
        
        // Check if there is a next level
        if (levelId >= levels.length) {
            btnNextLevel.classList.add('hidden');
        } else {
            btnNextLevel.classList.remove('hidden');
        }
        
        showScreen(victoryScreen);
    }

    function onScoreUpdate(score) {
        scoreDisplay.textContent = score;
    }

    function onHealthUpdate(health) {
        const percent = Math.max(0, health);
        healthBar.style.width = `${percent}%`;
        healthText.textContent = `${Math.ceil(percent)}%`;
        
        if (percent < 30) {
            healthBar.className = 'h-full w-full transition-all duration-200 bg-gradient-to-r from-red-600 to-red-400';
        } else {
            healthBar.className = 'h-full w-full transition-all duration-200 bg-gradient-to-r from-green-500 to-blue-500';
        }
    }

    // Animation Loop
    function loop(timestamp) {
        game.update(timestamp);
        game.draw();
        requestAnimationFrame(loop);
    }

    // Init
    game.resize();
    requestAnimationFrame(loop);
    
    console.log('Game initialized successfully');
});
