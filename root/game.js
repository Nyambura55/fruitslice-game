const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

// Resize canvas to fill window dynamically
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// GLOBAL GAME STATE VARIABLES
// ==========================================
let score = 0;
let fruits = [];
let slashTrail = [];
let particles = [];         // Array holding dynamic splash squares
let missedFruitsCounter = 0; // Tracks consecutive uncut fruits dropped
let isPaused = false;
let isGameOver = false;

// ==========================================
// ENTITY CLASS DEFINITIONS
// ==========================================

class Fruit {
    constructor(type) {
        this.type = type; // Object 1: "Apple", Object 2: "Orange"
        this.radius = 40;
        
        // --- 1. APPLICATION STAGE (Initial Physics State Setting) ---
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = canvas.height + this.radius;
        this.vx = (Math.random() - 0.5) * 6; // Horizontal velocity
        this.vy = -(Math.random() * 5 + 12); // Vertical upward thrust
        this.gravity = 0.2;
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.isSliced = false;
    }

    update() {
        // --- 1. APPLICATION STAGE (Physics/State Updates) ---
        this.vy += this.gravity; // Apply gravity forces
        this.x += this.vx;       // Move horizontally
        this.y += this.vy;       // Move vertically
        this.angle += this.rotationSpeed; // Update spin orientation
    }

    draw() {
        ctx.save(); 

        // --- 2. GEOMETRY STAGE (Space Transformations) ---
        // We translate the origin to the object's world position and apply rotation matrix
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // --- 3. RASTERIZATION STAGE (Vector-to-Pixel Generation) ---
        // The path math is calculated here to fill concrete physical screen pixels
        ctx.beginPath();
        if (!this.isSliced) {
            // Draw whole fruit shape
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.type === "Apple" ? "#ff2a2a" : "#ffa500";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#fff";
            ctx.stroke();
        } else {
            // Draw left half
            ctx.beginPath();
            ctx.arc(-10, 0, this.radius, Math.PI * 0.5, Math.PI * 1.5);
            ctx.fillStyle = this.type === "Apple" ? "#d42020" : "#e69500";
            ctx.fill();
            
            // Draw right half
            ctx.beginPath();
            ctx.arc(10, 0, this.radius, Math.PI * 1.5, Math.PI * 0.5);
            ctx.fillStyle = this.type === "Apple" ? "#d42020" : "#e69500";
            ctx.fill();
        }
        ctx.closePath();
        ctx.restore(); 
    }
}

class SplashParticle {
    constructor(x, y, color) {
        // --- 1. APPLICATION STAGE (Particle Physics Initialization) ---
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;        // Square dimensions
        this.vx = (Math.random() - 0.5) * 8;      // Random horizontal burst
        this.vy = (Math.random() - 0.5) * 8 - 3;  // Random upward burst
        this.gravity = 0.25;
        this.color = color;
        this.alpha = 1.0;                         // Dynamic opacity fade value
        this.decay = Math.random() * 0.02 + 0.015;
    }

    update() {
        // --- 1. APPLICATION STAGE (Particle State Translation) ---
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay; // Gradually decay alpha over time
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        // --- 2. GEOMETRY STAGE (Translating Particle Matrix) ---
        ctx.translate(this.x, this.y);

        // --- 3. RASTERIZATION STAGE (Drawing the Square Pixels) ---
        ctx.fillStyle = this.color;
        // Draw square centered perfectly relative to shifted vector position matrix
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        ctx.restore();
    }
}

// ==========================================
// ENGINE MECHANICS & LIFE CYCLE LOOPS
// ==========================================

function spawnFruits() {
    // --- 1. APPLICATION STAGE (Procedural Spawning Lifecycle) ---
    if (Math.random() < 0.02 && fruits.length < 5) {
        let chosenType = Math.random() > 0.5 ? "Apple" : "Orange"; 
        fruits.push(new Fruit(chosenType));
    }
}

function checkSlashes(mouseX, mouseY) {
    if (isPaused || isGameOver) return; 

    // --- 1. APPLICATION STAGE (Collision Logic, Hit Reset, & Particle Triggers) ---
    fruits.forEach(fruit => {
        if (!fruit.isSliced) {
            let dist = Math.hypot(fruit.x - mouseX, fruit.y - mouseY);
            if (dist < fruit.radius) {
                fruit.isSliced = true;
                fruit.vx *= 1.5; // Split slices accelerate outward
                score += 10;
                scoreElement.innerText = score;
                missedFruitsCounter = 0; // Reset consecutive miss tracking chain on hit!

                // Capture structural theme properties to configure fragment coloration rules
                let splashColor = fruit.type === "Apple" ? "#ff2a2a" : "#ffa500";
                
                // Construct 15 distinctive square layout pixel entities
                for (let i = 0; i < 15; i++) {
                    particles.push(new SplashParticle(fruit.x, fruit.y, splashColor));
                }
            }
        }
    });
}

function gameLoop() {
    // --- 1. APPLICATION STAGE (Simulation Engine Conditional Advancement) ---
    if (!isPaused && !isGameOver) {
        spawnFruits();

        // Advance simulation mechanics for all active components
        fruits.forEach(fruit => {
            fruit.update();
            
            // Track if a whole untouched fruit completely bypassed the viewport lower bound
            if (fruit.y > canvas.height + fruit.radius && !fruit.isSliced) {
                missedFruitsCounter++;
                if (missedFruitsCounter >= 5) {
                    isGameOver = true;
                }
            }
        });

        particles.forEach(p => p.update());

        // Process lifecycle array garbage collection filters
        fruits = fruits.filter(f => f.y < canvas.height + 100);
        particles = particles.filter(p => p.alpha > 0);
        
        // Decay the interactive sweep slash elements
        slashTrail.forEach(p => p.alpha -= 0.05);
        slashTrail = slashTrail.filter(p => p.alpha > 0);
    }

    // --- 3. RASTERIZATION STAGE (Clearing Frame Buffer & Compiling New Display Layers) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rasterize standard scene objects (even when paused)
    fruits.forEach(fruit => fruit.draw());
    particles.forEach(p => p.draw());

    // Rasterize the Interactive Trail Stroke Overlay
    if (slashTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(slashTrail[0].x, slashTrail[0].y);
        for (let i = 1; i < slashTrail.length; i++) {
            ctx.lineTo(slashTrail[i].x, slashTrail[i].y);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.stroke();
    }

    // --- 3. RASTERIZATION STAGE (Instruction & Warning Text Box HUD) ---
    if (!isGameOver) {
        ctx.save();
        // Geometry layout parameters for instruction frame box
        let boxWidth = 320;
        let boxHeight = 85;
        let boxX = canvas.width - boxWidth - 20; // Top right positioning layout 
        let boxY = 20;

        // Render transparent container rectangle
        ctx.fillStyle = "rgba(30, 30, 30, 0.75)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Render text strings inside the box bounds
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("HOW TO PLAY:", boxX + 15, boxY + 25);
        
        ctx.font = "13px sans-serif";
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("• Drag mouse across fruit to slash them.", boxX + 15, boxY + 45);
        ctx.fillText("• Press SPACEBAR to pause/resume.", boxX + 15, boxY + 65);

        // Draw Warning Status (changes to blinking red if threshold is close)
        let structuralRemaining = 5 - missedFruitsCounter;
        ctx.textAlign = "right";
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = structuralRemaining <= 2 ? "#ef4444" : "#4ade80";
        ctx.fillText(`Misses Allowed: ${structuralRemaining}/5`, boxX + boxWidth - 15, boxY + 25);
        ctx.restore();
    }

    // Rasterize UI HUD Text Layer Overlays
    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Dark background masking veil
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME PAUSED", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px sans-serif";
        ctx.fillText("Press Space to Resume", canvas.width / 2, canvas.height / 2 + 40);
    }

    if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)"; // Enhanced contrast dark block layer
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff2a2a";
        ctx.font = "bold 50px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("YOU LOSE", canvas.width / 2, canvas.height / 2 - 80);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);

        // Draw structural UI button geometry bounds box
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(canvas.width / 2 - 80, canvas.height / 2 + 20, 160, 50);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("REPLAY", canvas.width / 2, canvas.height / 2 + 52);
    }

    requestAnimationFrame(gameLoop);
}

// ==========================================
// SYSTEM INPUT EVENT LISTENERS
// ==========================================

window.addEventListener("mousemove", (e) => {
    // --- 1. APPLICATION STAGE (User Movement Input Capturing) ---
    if (!isPaused && !isGameOver) {
        slashTrail.push({ x: e.clientX, y: e.clientY, alpha: 1 });
        checkSlashes(e.clientX, e.clientY);
    }
});

window.addEventListener("keydown", (e) => {
    // --- 1. APPLICATION STAGE (Interpreting Keyboard Control Inputs) ---
    if (e.code === "Space" && !isGameOver) {
        isPaused = !isPaused;
    }
});

window.addEventListener("click", (e) => {
    if (isGameOver) {
        // Re-establish structural click boundary criteria matching rasterized canvas coordinates
        let btnX = canvas.width / 2 - 80;
        let btnY = canvas.height / 2 + 20;
        let btnW = 160;
        let btnH = 50;

        // --- 1. APPLICATION STAGE (Evaluating Interaction Bounding Boxes & Reset Action) ---
        if (e.clientX >= btnX && e.clientX <= btnX + btnW &&
            e.clientY >= btnY && e.clientY <= btnY + btnH) {
            
            // Complete state engine factory variable wipe sequence
            score = 0;
            scoreElement.innerText = score;
            fruits = [];
            particles = [];
            slashTrail = [];
            missedFruitsCounter = 0;
            isGameOver = false;
            isPaused = false;
        }
    }
});

// Kickstart active execution loop
gameLoop();