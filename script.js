// --- GAME DATA (8 Rounds) ---
// Note: No explicit theory names included in texts.
const scenarios = [
    {
        // Round 1: Trolley / Car
        text: "SECURITY ALERT: Autonomous VIP vehicle brake failure. 5 pedestrians detected ahead. Swerving will hit a wall, killing the passenger (you).",
        choiceA: "SWERVE",
        descA: "Sacrifice the passenger (1) to save the pedestrians (5).",
        choiceB: "STAY",
        descB: "Maintain course. Do not intentionally kill the passenger.",
        type: "util_vs_deon"
    },
    {
        // Round 2: Vaccine
        text: "PANDEMIC PROTOCOL: Only one vaccine dose remains. Two subjects waiting. Subject 1: A Genius Doctor (High potential to save others). Subject 2: Your Father (Homeless, but family).",
        choiceA: "DOCTOR",
        descA: "Administer to the Doctor to maximize future lives saved.",
        choiceB: "FATHER",
        descB: "Administer to your Father. Honor family duty/fairness.",
        type: "util_vs_deon"
    },
    {
        // Round 3: Torture
        text: "TERROR THREAT: A nuclear bomb is hidden in the city. Millions will die. We have the suspect in custody. He refuses to speak.",
        choiceA: "TORTURE",
        descA: "Use torture to extract the code. Save the city.",
        choiceB: "REFUSE",
        descB: "Do not torture. Uphold human rights regardless of consequences.",
        type: "util_vs_deon"
    },
    {
        // Round 4: Lying
        text: "ASSET PROTECTION: You are hiding an innocent friend. An assassin asks: 'Is he inside?'",
        choiceA: "LIE",
        descA: "Say 'No'. Use deception to prevent a murder.",
        choiceB: "TRUTH",
        descB: "Remain silent or tell truth. Do not violate the duty of honesty.",
        type: "util_vs_deon"
    },
    {
        // Round 5: Corporate
        text: "FINANCIAL CRISIS: Your company's product has a minor defect. A recall will bankrupt the firm and fire 5,000 workers.",
        choiceA: "COVER UP",
        descA: "Hide the defect. Pay damages later. Save the jobs.",
        choiceB: "RECALL",
        descB: "Announce the defect. Be transparent despite the ruin.",
        type: "util_vs_deon"
    },
    {
        // Round 6: Omelas
        text: "CITY MANAGEMENT: The city is in a state of perfect bliss. This state is magically sustained ONLY by the eternal suffering of one child in a basement.",
        choiceA: "SUSTAIN",
        descA: "Keep the child imprisoned. Maintain happiness for millions.",
        choiceB: "RELEASE",
        descB: "Free the child. Accept the collapse of the city's happiness.",
        type: "util_vs_deon"
    },
    {
        // Round 7: Luxury
        text: "RESOURCE ALLOCATION: You have $1,000 for a personal luxury item. This amount could save 5 starving children abroad.",
        choiceA: "DONATE",
        descA: "Give the money. Distance does not reduce the value of life.",
        choiceB: "BUY",
        descB: "Buy the item. Exercise your right to your own property.",
        type: "util_vs_deon"
    },
    {
        // Round 8: Plagiarism
        text: "INTEGRITY CHECK: Your friend plagiarized to keep a scholarship. Losing it means their life is ruined. You are the only witness.",
        choiceA: "SILENCE",
        descA: "Do not report. Prevent the suffering of your friend.",
        choiceB: "REPORT",
        descB: "Report the plagiarism. Uphold the rules of the institution.",
        type: "util_vs_deon"
    }
];

// --- VARIABLES ---
let engine, render, runner, world;
let currentRound = 0;
let scoreUtil = 0; // A choices
let scoreDeon = 0; // B choices
let timerInterval;
let timeLeft = 120; // 2 minutes per round
let isGameRunning = false;

// --- PHYSICS SETUP (Matter.js) ---
function initPhysics() {
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Mouse = Matter.Mouse,
        MouseConstraint = Matter.MouseConstraint,
        Events = Matter.Events;

    engine = Engine.create();
    world = engine.world;
    engine.gravity.y = 0.5; // Lower gravity for floaty effect

    // Canvas size
    render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight - 180, // Leave space for bottom panel
            wireframes: false,
            background: 'transparent' // Use body background
        }
    });

    // Boundaries
    const w = window.innerWidth;
    const h = window.innerHeight - 180;
    const wallOptions = { isStatic: true, render: { visible: false } };

    Composite.add(world, [
        Bodies.rectangle(w / 2, h + 25, w, 50, wallOptions), // Ground
        Bodies.rectangle(-25, h / 2, 50, h, wallOptions),    // Left
        Bodies.rectangle(w + 25, h / 2, 50, h, wallOptions)    // Right
    ]);

    // Mouse Control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Composite.add(world, mouseConstraint);

    // CLICK DETECTOR
    Events.on(mouseConstraint, 'mousedown', function (event) {
        const body = event.source.body;
        if (body && body.label && isGameRunning) {
            handleChoice(body.label);
        }
    });

    // TEXT RENDER HOOK
    Events.on(render, 'afterRender', function () {
        const context = render.context;
        const bodies = Matter.Composite.allBodies(engine.world);
        context.font = "bold 20px 'Courier New'";
        context.textAlign = "center";
        context.textBaseline = "middle";

        bodies.forEach(body => {
            if (body.render.text) {
                context.fillStyle = "#000"; // Text color inside block
                context.fillText(body.render.text, body.position.x, body.position.y);

                // Small sub-label
                context.font = "12px 'Courier New'";
                context.fillText(body.render.sub, body.position.x, body.position.y + 20);
                context.font = "bold 20px 'Courier New'"; // Reset
            }
        });
    });

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
}

// --- GAME LOGIC ---

function startGame() {
    document.getElementById('overlay').style.display = 'none';
    initPhysics();
    isGameRunning = true;
    startRound();
}

function startRound() {
    if (currentRound >= scenarios.length) {
        endGame();
        return;
    }

    // Update UI
    document.getElementById('round-display').innerText = `${currentRound + 1} / 8`;
    const data = scenarios[currentRound];

    // Set Bottom Text
    const panel = document.getElementById('scenario-text');
    panel.innerHTML = `<span style="color:#00ff41">[MISSION]</span> ${data.text}`;

    // Reset Timer
    resetTimer();

    // Spawn Blocks
    // Clear previous moving bodies
    const bodies = Matter.Composite.allBodies(world);
    bodies.forEach(b => {
        if (!b.isStatic) Matter.Composite.remove(world, b);
    });

    // Create Option A Block
    setTimeout(() => {
        createBlock(window.innerWidth / 3, -100, data.choiceA, "OPTION A", '#00ff41', 'choiceA');
    }, 200);

    // Create Option B Block
    setTimeout(() => {
        createBlock(window.innerWidth * 2 / 3, -100, data.choiceB, "OPTION B", '#cccccc', 'choiceB');
    }, 500);
}

function createBlock(x, y, text, sub, color, label) {
    const body = Matter.Bodies.rectangle(x, y, 200, 80, {
        label: label,
        restitution: 0.6,
        frictionAir: 0.05,
        render: {
            fillStyle: color,
            strokeStyle: '#fff',
            lineWidth: 2,
            text: text, // Custom property
            sub: sub
        }
    });
    Matter.Composite.add(world, body);
}

function handleChoice(label) {
    // Record score
    if (label === 'choiceA') scoreUtil++;
    else if (label === 'choiceB') scoreDeon++;

    // Highlight text briefly to show selection
    const panel = document.getElementById('scenario-text');
    const data = scenarios[currentRound];
    const desc = (label === 'choiceA') ? data.descA : data.descB;

    panel.innerHTML = `<span style="color:yellow">SELECTED: ${desc}</span>`;

    // Pause briefly then next
    isGameRunning = false; // Prevent double click
    setTimeout(() => {
        currentRound++;
        isGameRunning = true;
        startRound();
    }, 1500);
}

// --- TIMER ---
function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 120; // 2 minutes
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            forceRandomChoice(); // Auto-fail or random
        }
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('timer');
    el.innerText = timeLeft;
    if (timeLeft <= 10) el.classList.add('blink-red');
    else el.classList.remove('blink-red');
}

function forceRandomChoice() {
    // If time runs out, pick random to keep flow (Or you can make it fail)
    const random = Math.random() < 0.5 ? 'choiceA' : 'choiceB';
    handleChoice(random);
}

// --- END GAME & FEEDBACK ---
function endGame() {
    clearInterval(timerInterval);
    isGameRunning = false;

    let wing = "";
    let description = "";
    let theory = "";

    if (scoreUtil > scoreDeon) {
        wing = "EFFICIENCY WING (Utilitarian)";
        theory = "Utilitarianism (Bentham/Mill)";
        description = "Your choices demonstrate a focus on **Consequences** and the **Greatest Happiness Principle**. You consistently sacrificed rights or rules to maximize the overall outcome.";
    } else if (scoreDeon > scoreUtil) {
        wing = "PRINCIPLE BUREAU (Deontologist)";
        theory = "Deontology (Kant)";
        description = "Your choices demonstrate a focus on **Duty** and **Universal Laws**. You refused to treat humans as means to an end, regardless of the consequences.";
    } else {
        wing = "STRATEGIC COMMAND (Balanced)";
        theory = "Mixed System";
        description = "You balanced efficiency with principle. Your decisions reflect a complex struggle between the outcomes and the inherent morality of actions.";
    }

    const overlay = document.getElementById('overlay');
    overlay.innerHTML = `
        <h1 style="color:#00ff41">TEST COMPLETE</h1>
        <h2 style="color:#fff; margin-top:0">ASSIGNMENT: ${wing}</h2>
        <div style="border:1px solid #333; padding:20px; background:rgba(0,0,0,0.8); max-width:600px;">
            <p style="color:#ccc; text-align:left;">
                <strong>ANALYSIS:</strong><br>${description}<br><br>
                <strong>CORE THEORY:</strong> ${theory}
            </p>
        </div>
        <p>Ensure your Game Log accurately reflects the reasoning behind each of your choices.</p>
        <button class="btn" onclick="location.reload()">RESTART SIMULATION</button>
    `;
    overlay.style.display = 'flex';
}
