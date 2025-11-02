const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: 0x000000,
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, cursors, bullets, enemyBullets, enemies, lastFired = 0;
let score = 0, scoreText, lives = 3, livesText; // Se agrega la variable 'lives'
let gameStarted = false, level = 1, musicOsc;
const maxLevels = 3;

// --- Preload: Sprites generados con apariencia de nave ---
function preload() {
    // Jugador: Nave triangular moderna (Gris/Azul)
    const playerGfx = this.add.graphics();
    playerGfx.fillStyle(0x808080, 1); // Gris
    playerGfx.fillTriangle(8, 0, 0, 16, 16, 16); // Cuerpo principal
    playerGfx.fillStyle(0x00ffff, 1); // Cúpula Cian
    playerGfx.fillRect(6, 4, 4, 4);
    playerGfx.fillStyle(0xff8c00, 1); // Propulsores Naranja
    playerGfx.fillRect(2, 16, 4, 4);
    playerGfx.fillRect(10, 16, 4, 4);
    playerGfx.generateTexture('player', 16, 20);
    playerGfx.destroy();

    // Bala del jugador
    const bulletGfx = this.add.graphics();
    bulletGfx.fillStyle(0xffff00, 1);
    bulletGfx.fillRect(0, 0, 4, 12);
    bulletGfx.generateTexture('bullet', 4, 12);
    bulletGfx.destroy();

    // Enemigo: Nave invasora (Púrpura/Rojo, de una de las referencias)
    const enemyGfx = this.add.graphics();
    enemyGfx.fillStyle(0x800080, 1); // Púrpura
    enemyGfx.fillRect(4, 0, 8, 4); // Parte superior
    enemyGfx.fillRect(0, 4, 16, 8); // Cuerpo principal
    enemyGfx.fillStyle(0xff0000, 1); // Ojos/Detalle Rojos
    enemyGfx.fillRect(2, 6, 3, 4);
    enemyGfx.fillRect(11, 6, 3, 4);
    enemyGfx.fillStyle(0x800080, 1);
    enemyGfx.fillRect(2, 12, 3, 4); // Patas
    enemyGfx.fillRect(11, 12, 3, 4); // Patas
    enemyGfx.generateTexture('enemy', 16, 16);
    enemyGfx.destroy();
    
    // Bala del enemigo
    const enemyBulletGfx = this.add.graphics();
    enemyBulletGfx.fillStyle(0xff0000, 1); // Rojo
    enemyBulletGfx.fillCircle(2, 2, 3); // Pequeña bala redonda
    enemyBulletGfx.generateTexture('enemyBullet', 4, 4);
    enemyBulletGfx.destroy();
}

// --- Create: pantalla de inicio ---
function create() {
    showStartScreen.call(this);
}

function showStartScreen() {
    const centerX = 400;
    const centerY = 300;
    
    // Para el estilo Bitmap, usamos 'monospace' y un grosor de trazo fuerte.

    // --- 1. FONDO LIMPIO Y ESTRELLAS (CON ANIMACIÓN) ---
    this.cameras.main.setBackgroundColor('#000018'); // Fondo azul marino muy oscuro

    // Limpieza de nebulosas (círculos eliminados)
    if (this.nebulaGfx) this.nebulaGfx.destroy();
    this.nebulaGfx = this.add.graphics();
    this.nebulaGfx.setDepth(-1); 
    
    // Dibujo de estrellas
    if (this.starGraphics) this.starGraphics.destroy();
    this.starGraphics = this.add.graphics();
    this.starGraphics.setDepth(-1);
    this.starGraphics.fillStyle(0xFFFFFF, 1);
    for (let i = 0; i < 150; i++) {
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 600);
        this.starGraphics.fillRect(x, y, 1, 1);
    }
    
    // Animación de las estrellas (Movimiento de paralaje muy lento)
    this.tweens.add({
        targets: this.starGraphics,
        y: 10, // Mover 10px hacia abajo (simulando avance)
        duration: 80000, // Duración muy larga para que sea un movimiento sutil
        ease: 'Linear',
        yoyo: true, // Vuelve a subir lentamente
        repeat: -1
    });

    // --- 2. TEXTOS DE PUNTUACIÓN (Bitmap Style) ---
    const uiBitmapStyle = { 
        font: '24px monospace',
        fill: '#00FFFF', 
        stroke: '#000000',
        strokeThickness: 3 // Grosor aumentado
    };
    if (this.scoreTextTop) this.scoreTextTop.destroy();
    if (this.hiScoreTextTop) this.hiScoreTextTop.destroy();

    this.scoreTextTop = this.add.text(20, 20, 'STATUS: ONLINE', uiBitmapStyle);
    this.hiScoreTextTop = this.add.text(780, 20, 'HI-SCORE: 2500', uiBitmapStyle).setOrigin(1, 0);

    // --- 3. TÍTULO "RETROBLAST" (Bitmap GIGANTE) ---
    const retroblastBitmapStyle = {
        font: '96px monospace',
        fill: '#FFFFFF',
        stroke: '#00FFFF',
        strokeThickness: 10,
        shadow: {
            offsetX: 0,
            offsetY: 0,
            color: '#00FFFF',
            blur: 8, 
            stroke: true,
            fill: true
        }
    };

    if (this.titleText) this.titleText.destroy();
    this.titleText = this.add.text(centerX, centerY - 150, 'RETROBLAST', retroblastBitmapStyle).setOrigin(0.5);

    // Animación de pulso
    this.tweens.add({
        targets: this.titleText,
        strokeThickness: { from: 8, to: 12 },
        shadowBlur: { from: 5, to: 12 },
        alpha: { from: 1, to: 0.9 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    
    // --- 4. FRASE DE ORGULLO PARAGUAYO (Bitmap Style) ---
    const paraguayBitmapStyle = {
        font: '18px monospace',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2
    };
    
    if (this.paraguayText) this.paraguayText.destroy();
    this.paraguayText = this.add.text(centerX, centerY - 80, ':: DESARROLLADO EN PY ::', paraguayBitmapStyle).setOrigin(0.5);

    // --- 5. MARCIANOS DE FONDO (ELIMINADOS) ---
    // Aseguramos que se limpia si existía de la versión anterior
    if (this.backgroundInvaders) this.backgroundInvaders.destroy();

    // --- 6. NAVE DEL JUGADOR DETALLADA ---
    if (this.playerShip) this.playerShip.destroy();
    this.playerShip = this.add.graphics({ x: centerX, y: centerY + 50 });

    function drawDetailedShip(g) {
        g.clear();
        g.fillStyle(0x404040, 1);
        g.fillRect(-30, -10, 60, 20);
        g.fillStyle(0x606060, 1);
        g.fillTriangle(-30, 0, -50, 15, -30, 20);
        g.fillTriangle(30, 0, 50, 15, 30, 20);
        g.fillStyle(0x00AAAA, 1);
        g.fillRect(-10, -20, 20, 10);
        g.fillStyle(0xFFFFFF, 1);
        g.fillRect(-2, -25, 4, 5);
        g.fillStyle(0x00FFFF, 0.7);
        g.fillCircle(0, -20, 5);
        g.fillStyle(0x0000FF, 1);
        g.fillTriangle(-15, 10, -5, 10, -10, 25);
        g.fillTriangle(15, 10, 5, 10, 10, 25);
        g.fillStyle(0x00FFFF, 0.9);
        g.fillEllipse(-10, 30, 10, 15);
        g.fillEllipse(10, 30, 10, 15);
    }
    drawDetailedShip(this.playerShip);

    // --- 7. INSTRUCCIONES DEL JUEGO (Bitmap Style) ---
    const instructionsBitmapStyle = { 
        font: '16px monospace',
        fill: '#FFFFFF', 
        align: 'center',
        backgroundColor: '#00000080',
        padding: { x: 10, y: 5 },
        stroke: '#000000',
        strokeThickness: 2
    };
    
    if (this.instructionsText) this.instructionsText.destroy();
    this.instructionsText = this.add.text(centerX, centerY + 120, 
        'Flechas IZQ/DER: Mover | ESPACIO: Disparar', 
        instructionsBitmapStyle
    ).setOrigin(0.5);


    // --- 8. BOTÓN "JUGAR" (Bitmap Style) ---
    
    const drawButton3D = (g, x, y, width, height, color) => {
        g.clear();
        const colorObj = Phaser.Display.Color.ValueToColor(color);
        const lightColor = colorObj.clone().lighten(20).color;
        const darkColor = colorObj.clone().darken(20).color;
        
        g.fillStyle(darkColor, 1);
        g.fillRect(x - width / 2 + 5, y - height / 2 + 5, width, height);

        g.fillStyle(color, 1);
        g.fillRect(x - width / 2, y - height / 2, width, height);
        
        g.fillStyle(lightColor, 1);
        g.fillRect(x - width / 2, y - height / 2, width, 5);
        
        g.fillRect(x - width / 2, y - height / 2, 5, height);
    };

    const JUGAR_COLOR = 0xFFD700;
    const JUGAR_HOVER_COLOR = 0xFFFF00;

    if (this.initiateGfx) this.initiateGfx.destroy();
    this.initiateGfx = this.add.graphics();
    this.initiateGfx.width = 250;
    this.initiateGfx.height = 70;
    drawButton3D(this.initiateGfx, centerX, 520, 250, 70, JUGAR_COLOR);

    if (this.initiateText) this.initiateText.destroy();
    this.initiateText = this.add.text(centerX, 520, 'JUGAR', {
        font: '36px monospace',
        fill: '#8B0000',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, fill: true }
    }).setOrigin(0.5).setInteractive();
    
    // --- 9. INTERACCIÓN DE BOTONES (Sin cambios) ---
    
    const setupButtonInteraction = (gfx, text, defaultColor, hoverColor) => {
        text.on('pointerover', () => {
            drawButton3D(gfx, text.x, text.y, gfx.width, gfx.height, hoverColor);
            text.setScale(1.05);
            this.input.setDefaultCursor('pointer');
        });
        text.on('pointerout', () => {
            drawButton3D(gfx, text.x, text.y, gfx.width, gfx.height, defaultColor);
            text.setScale(1.0);
            this.input.setDefaultCursor('default');
        });
    };
    
    setupButtonInteraction(this.initiateGfx, this.initiateText, JUGAR_COLOR, JUGAR_HOVER_COLOR);


    // --- 10. LÓGICA DE INICIO DEL JUEGO y LIMPIEZA ---
    this.initiateText.once('pointerdown', () => {
        this.events.emit('startGameSignal');
    });

    this.input.keyboard.once('keydown-SPACE', () => {
        this.events.emit('startGameSignal');
    });

    this.events.once('startGameSignal', () => {
        // Limpieza de todos los elementos
        this.nebulaGfx.destroy();
        this.starGraphics.destroy();
        this.scoreTextTop.destroy();
        this.hiScoreTextTop.destroy();
        this.titleText.destroy();
        this.paraguayText.destroy();
        this.playerShip.destroy();
        this.instructionsText.destroy();
        this.initiateGfx.destroy();
        this.initiateText.destroy();

        this.input.keyboard.off('keydown-SPACE');
        this.initiateText.removeAllListeners();

        gameStarted = true;
        level = 1;
        score = 0;
        lives = 3;
        startGame.call(this);
    });
}


// --- Inicio de juego ---
function startGame() {
    // 1. CONFIGURACIÓN DEL FONDO (Cambiando el color del fondo de la escena)
    this.cameras.main.setBackgroundColor('#000000'); // Fondo negro puro

    // 2. CONFIGURACIÓN DEL JUGADOR
    player = this.physics.add.sprite(400, 550, 'player').setCollideWorldBounds(true);
    cursors = this.input.keyboard.createCursorKeys();

    // 3. GRUPOS DE BALAS
    bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 20 });
    enemyBullets = this.physics.add.group({ defaultKey: 'enemyBullet', maxSize: 20 }); // Nuevo grupo para balas enemigas

    // 4. GRUPO DE ENEMIGOS
    enemies = this.physics.add.group();
    createEnemies.call(this);

    // 5. TEXTOS DE INTERFAZ (UI)
    const uiTextStyle = { font: '20px monospace', fill: '#fff' };
    scoreText = this.add.text(10, 10, 'SCORE: 0', uiTextStyle);
    livesText = this.add.text(790, 10, 'LIVES: 3', uiTextStyle).setOrigin(1, 0); // Vidas a la derecha

    // 6. COLISIONES
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemyBullets, hitPlayer, null, this); // Colisión con balas enemigas

    // 7. MÚSICA
    playMusic.call(this);

    // 8. EVENTO PARA EL DISPARO ENEMIGO (Cada 2 segundos)
    this.time.addEvent({
        delay: 2000 - (level * 200), // Dispara más rápido con el nivel
        loop: true,
        callback: shootEnemyBullet,
        callbackScope: this
    });
}

// --- Disparo Enemigo ---
function shootEnemyBullet() {
    if (!gameStarted) return;
    const activeEnemies = enemies.getChildren().filter(e => e.active);
    if (activeEnemies.length > 0) {
        const randomEnemy = Phaser.Utils.Array.GetRandom(activeEnemies);
        const bullet = enemyBullets.get(randomEnemy.x, randomEnemy.y);
        if (bullet) {
            bullet.setActive(true).setVisible(true).body.velocity.y = 200 + (level * 50); // Bala más rápida con el nivel
        }
    }
}

// --- Crear enemigos ---
function createEnemies() {
    const rows = 2 + level;
    const cols = 8;
    const startX = 100, startY = 80, spacingX = 80, spacingY = 60;

    enemies.clear(true, true);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const enemy = enemies.create(startX + c * spacingX, startY + r * spacingY, 'enemy');
            enemy.setData('dir', 1);
        }
    }
}

// --- Update ---
function update(time) {
    if (!gameStarted) return;

    // Movimiento jugador (sin cambios)
    if (cursors.left.isDown) player.setVelocityX(-200);
    else if (cursors.right.isDown) player.setVelocityX(200);
    else player.setVelocityX(0);

    // Disparo del jugador (sin cambios)
    if (cursors.space.isDown && time > lastFired) {
        const bullet = bullets.get(player.x, player.y - 20);
        if (bullet) {
            bullet.setActive(true).setVisible(true).body.velocity.y = -400;
            lastFired = time + 300;
        }
    }

    // Limpieza de balas
    bullets.children.each(b => {
        if (b.active && b.y < -10) bullets.killAndHide(b);
    });
    enemyBullets.children.each(b => { // Limpieza de balas enemigas
        if (b.active && b.y > 610) enemyBullets.killAndHide(b);
    });

    // Movimiento enemigos (sin cambios)
    let hitEdge = false;
    const enemySpeed = 30 + 10 * level;
    enemies.children.each(e => {
        e.x += e.getData('dir') * enemySpeed * (1 / 60);
        if (e.x > 784 || e.x < 16) hitEdge = true;
        if (e.y >= 540) { // Si los enemigos llegan abajo
            gameOver.call(this);
        }
    });

    if (hitEdge) {
        enemies.children.each(e => {
            e.setData('dir', -e.getData('dir'));
            e.y += 10;
        });
    }

    // Verifica si todos los enemigos destruidos
    if (enemies.countActive(true) === 0) {
        if (level < maxLevels) {
            showLevelWin.call(this);
        } else {
            showFinalWin.call(this);
        }
    }
}

// --- Colisión bala-enemigo ---
function hitEnemy(bullet, enemy) {
    bullets.killAndHide(bullet);
    enemy.destroy();
    score += 10;
    scoreText.setText('SCORE: ' + score);
}

// --- Colisión bala-jugador (¡NUEVO!) ---
function hitPlayer(player, bullet) {
    bullet.destroy(); // Destruye la bala enemiga
    
    // 1. Reduce vida
    lives--;
    livesText.setText('LIVES: ' + lives);

    // 2. Parpadeo (inmunidad temporal)
    player.setAlpha(0.5);
    player.setTint(0xff0000);
    this.time.delayedCall(1000, () => {
        player.setAlpha(1);
        player.clearTint();
    });
    
    // 3. Verifica Game Over
    if (lives <= 0) {
        gameOver.call(this);
    }
}

// --- Mensaje de nivel completado (Mantiene estructura, usa Enter) ---
function showLevelWin() {
    gameStarted = false;
    const levelText = this.add.text(400, 250, 'Nivel ' + level + ' Completado!', { font: '36px monospace', fill: '#00ff00' }).setOrigin(0.5);
    const nextText = this.add.text(400, 350, 'Presiona ENTER para siguiente nivel', { font: '24px monospace', fill: '#fff' }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
        level++;
        levelText.destroy();
        nextText.destroy();
        gameStarted = true;
        createEnemies.call(this);
        this.time.delayedCall(100, shootEnemyBullet, null, this); // Reinicia el disparo enemigo
    });
}

// --- Mensaje de victoria final (¡NUEVO!) ---
function showFinalWin() {
    gameStarted = false;
    // Detener la música
    if (musicOsc) { musicOsc.stop(); musicOsc.disconnect(); }
    
    // Pantalla de felicitaciones
    const winText = this.add.text(400, 200, '¡FELICITACIONES!', { font: '48px monospace', fill: '#00ffff' }).setOrigin(0.5);
    const msgText = this.add.text(400, 300, 'Salvaste la Tierra de la invasión alienígena!', { font: '24px monospace', fill: '#fff', align: 'center' }).setOrigin(0.5);
    const restartText = this.add.text(400, 400, 'Presiona ENTER para reiniciar', { font: '24px monospace', fill: '#00ff00' }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
        winText.destroy();
        msgText.destroy();
        restartText.destroy();
        showStartScreen.call(this);
    });
}

// --- Game over (¡MODIFICADO!) ---
function gameOver() {
    gameStarted = false;
    player.setTint(0xff0000); // Tinte rojo al jugador
    
    // Detener la música
    if (musicOsc) { musicOsc.stop(); musicOsc.disconnect(); }

    // Limpiar todos los elementos del juego (balas, enemigos)
    enemies.clear(true, true);
    bullets.clear(true, true);
    enemyBullets.clear(true, true);

    // Pantalla de Game Over con opciones
    const overText = this.add.text(400, 150, '¡GAME OVER!', { font: '48px monospace', fill: '#ff0000' }).setOrigin(0.5);
    
    // Opciones del menú (Reintentar/Home)
    const retryText = this.add.text(400, 250, 'REINTENTAR', { font: '32px monospace', fill: '#00ff00' }).setOrigin(0.5).setInteractive();
    const homeText = this.add.text(400, 350, 'HOME', { font: '32px monospace', fill: '#fff' }).setOrigin(0.5).setInteractive();

    // Lógica del menú
    let selectedOption = retryText;
    selectedOption.setFill('#ffff00'); // Opción inicial seleccionada (amarilla)

    const updateSelection = (newSelection) => {
        selectedOption.setFill('#00ff00'); // Deselecciona la anterior
        selectedOption = newSelection;
        selectedOption.setFill('#ffff00'); // Selecciona la nueva
    };

    // Control por flechas (opcional, para una mejor sensación arcade)
    this.input.keyboard.on('keydown-UP', () => updateSelection(retryText));
    this.input.keyboard.on('keydown-DOWN', () => updateSelection(homeText));

    // Control por clic/tap
    retryText.on('pointerdown', () => updateSelection(retryText));
    homeText.on('pointerdown', () => updateSelection(homeText));

    // Ejecutar opción al presionar ENTER
    this.input.keyboard.once('keydown-ENTER', () => {
        overText.destroy();
        retryText.destroy();
        homeText.destroy();
        player.destroy();
        scoreText.destroy();
        livesText.destroy();
        
        // Limpiar listeners de teclado para evitar disparos múltiples
        this.input.keyboard.off('keydown-UP');
        this.input.keyboard.off('keydown-DOWN');

        if (selectedOption === retryText) {
            // Reinicia la escena
            this.scene.restart();
        } else {
            // Vuelve a la pantalla de inicio
            showStartScreen.call(this);
        }
    });
}

// --- Música procedural (sin cambios) ---
function playMusic() {
    if (musicOsc) { musicOsc.stop(); musicOsc.disconnect(); }

    const ctx = this.sound.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    let noteIndex = 0;
    const melody = [261.63, 329.63, 392.00, 523.25, 659.25]; // C,E,G,C5,E5

    osc.start();
    osc.frequency.setValueAtTime(melody[noteIndex], ctx.currentTime);

    musicOsc = osc;

    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            noteIndex = (noteIndex + 1) % melody.length;
            osc.frequency.setValueAtTime(melody[noteIndex], ctx.currentTime);
        }
    });
}