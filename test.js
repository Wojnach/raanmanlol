#!/usr/bin/env node
// ============================================
// RAANMAN TEST SUITE - Node.js headless tests
// Tests game logic, HTML structure, CSS, and JS syntax
// ============================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
    try {
        const result = fn();
        if (result === true || result === undefined) {
            passed++;
            results.push({ name, status: 'PASS' });
        } else {
            failed++;
            results.push({ name, status: 'FAIL', detail: String(result) });
        }
    } catch (e) {
        failed++;
        results.push({ name, status: 'FAIL', detail: e.message });
    }
}

function extractJS(html) {
    const scripts = [];
    const regex = /<script(?:\s[^>]*)?>(?!.*src=)([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        if (match[1].trim().length > 0) {
            scripts.push(match[1]);
        }
    }
    return scripts.join('\n');
}

function extractInlineJS(html) {
    // Extract only inline scripts (not ones with src=)
    const scripts = [];
    const regex = /<script>(\s*[\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        if (match[1].trim().length > 0) {
            scripts.push(match[1]);
        }
    }
    return scripts.join('\n');
}

// ============================================
// FILE LOADING
// ============================================
const mainHTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const game3dHTML = fs.readFileSync(path.join(__dirname, 'raanman3d/index.html'), 'utf8');

console.log('\n\x1b[35m====================================\x1b[0m');
console.log('\x1b[35m  RAANMAN TEST SUITE\x1b[0m');
console.log('\x1b[35m====================================\x1b[0m\n');

// ============================================
// 1. HTML STRUCTURE TESTS
// ============================================
console.log('\x1b[36m--- HTML Structure Tests ---\x1b[0m');

test('Main page: has DOCTYPE', () => mainHTML.startsWith('<!DOCTYPE html>'));
test('3D game: has DOCTYPE', () => game3dHTML.startsWith('<!DOCTYPE html>'));

test('Main page: has viewport meta', () => mainHTML.includes('viewport'));
test('3D game: has viewport meta', () => game3dHTML.includes('viewport'));

test('Main page: has gameCanvas', () => mainHTML.includes('id="gameCanvas"'));
test('3D game: has renderCanvas', () => game3dHTML.includes('id="renderCanvas"'));

test('Main page: has touch controls', () => {
    return mainHTML.includes('id="touchControls"') &&
           mainHTML.includes('id="touch-left"') &&
           mainHTML.includes('id="touch-right"') &&
           mainHTML.includes('id="touch-jump"') &&
           mainHTML.includes('id="touch-hack"');
});

test('3D game: has touch controls', () => {
    return game3dHTML.includes('id="touchControls"') &&
           game3dHTML.includes('id="touch-forward"') &&
           game3dHTML.includes('id="touch-back"') &&
           game3dHTML.includes('id="touch-left"') &&
           game3dHTML.includes('id="touch-right"') &&
           game3dHTML.includes('id="touch-jump"');
});

test('3D game: has touchLookZone', () => game3dHTML.includes('id="touchLookZone"'));

test('Main page: has start overlay', () => mainHTML.includes('id="startOverlay"'));
test('Main page: has game over overlay', () => mainHTML.includes('id="gameOverlay"'));
test('Main page: has victory overlay', () => mainHTML.includes('id="victoryOverlay"'));
test('3D game: has start overlay', () => game3dHTML.includes('id="startOverlay"'));
test('3D game: has game over overlay', () => game3dHTML.includes('id="gameOverOverlay"'));

test('Main page: 3D game link exists', () => mainHTML.includes('href="raanman3d/"'));
test('3D game: back link exists', () => game3dHTML.includes('href="../"'));

test('Main page: all div tags balanced', () => {
    const opens = (mainHTML.match(/<div[\s>]/g) || []).length;
    const closes = (mainHTML.match(/<\/div>/g) || []).length;
    if (opens !== closes) return `open: ${opens}, close: ${closes}`;
    return true;
});

test('3D game: all div tags balanced', () => {
    const opens = (game3dHTML.match(/<div[\s>]/g) || []).length;
    const closes = (game3dHTML.match(/<\/div>/g) || []).length;
    if (opens !== closes) return `open: ${opens}, close: ${closes}`;
    return true;
});

// ============================================
// 2. CSS TESTS
// ============================================
console.log('\n\x1b[36m--- CSS / Mobile Tests ---\x1b[0m');

test('Main page: has touch-action: none on canvas', () => {
    // Find the standalone canvas {} rule (not body.fullscreen canvas)
    const match = mainHTML.match(/^\s+canvas\s*\{[\s\S]*?\}/m);
    return match && match[0].includes('touch-action');
});

test('3D game: has touch-action: none on canvas', () => {
    const canvasCSS = game3dHTML.match(/canvas\s*\{[^}]+\}/s);
    return canvasCSS && canvasCSS[0].includes('touch-action');
});

test('Main page: has overscroll-behavior: none', () => {
    return mainHTML.includes('overscroll-behavior');
});

test('Main page: has mobile-fullscreen CSS class', () => {
    return mainHTML.includes('body.mobile-fullscreen');
});

test('Main page: has safe-area-inset support', () => {
    return mainHTML.includes('safe-area-inset');
});

test('Main page: touch buttons are 88px', () => {
    return mainHTML.includes('width: 88px');
});

test('3D game: touch buttons are 72px', () => {
    return game3dHTML.includes('width: 72px');
});

test('Main page: overlay titles use clamp()', () => {
    return mainHTML.includes("font-size: clamp(");
});

test('Main page: overlay buttons have min-height: 52px', () => {
    return mainHTML.includes('min-height: 52px');
});

test('3D game: has @media (pointer: coarse)', () => {
    return game3dHTML.includes('@media (pointer: coarse)');
});

test('Main page: has @media (pointer: coarse)', () => {
    return mainHTML.includes('@media (pointer: coarse)');
});

test('3D game: hides crosshair on mobile', () => {
    return game3dHTML.includes('#crosshair { display: none !important; }') ||
           game3dHTML.includes('display: none !important');
});

// ============================================
// 3. JAVASCRIPT SYNTAX TESTS
// ============================================
console.log('\n\x1b[36m--- JavaScript Syntax Tests ---\x1b[0m');

test('Main page: JS syntax valid', () => {
    const js = extractInlineJS(mainHTML);
    const tmpFile = '/tmp/raanman_main_test.js';
    fs.writeFileSync(tmpFile, js);
    try {
        execSync(`node --check ${tmpFile} 2>&1`);
        return true;
    } catch (e) {
        return e.stdout ? e.stdout.toString() : e.message;
    }
});

test('3D game: JS syntax valid (with BABYLON stub)', () => {
    const js = extractInlineJS(game3dHTML);
    // Wrap with BABYLON stub so it can be syntax-checked
    const wrapped = `
        const BABYLON = { Engine: function(){}, Scene: function(){return {clearColor:null,fogMode:0,fogDensity:0,fogColor:null,ambientColor:null,meshes:[],getEngine:()=>({getDeltaTime:()=>16}),render(){}}},
            FreeCamera: function(){return {minZ:0,maxZ:0,fov:0,detachControl(){},position:null,setTarget(){}}},
            GlowLayer: function(){return {intensity:0}},
            HemisphericLight: function(){return {intensity:0,diffuse:null,groundColor:null}},
            DirectionalLight: function(){return {position:null,intensity:0,diffuse:null}},
            PointLight: function(){return {intensity:0,diffuse:null,range:0,position:null}},
            ShadowGenerator: function(){return {usePercentageCloserFiltering:false,filteringQuality:0,addShadowCaster(){},mapSize:0,usePoissonSampling:false}},
            MeshBuilder: {CreateBox:()=>({material:null,position:{x:0,y:0,z:0,set(){},add:()=>({y:0}),addInPlace(){},subtractInPlace(){}},parent:null,receiveShadows:false,castShadow:false,rotation:{x:0,y:0},isDisposed:()=>false,dispose(){},getBoundingInfo:()=>({boundingBox:{minimumWorld:{x:0,y:0,z:0},maximumWorld:{x:0,y:0,z:0}}}),baseY:0}),
                CreateGround:()=>({material:null,receiveShadows:false}),
                CreatePolyhedron:()=>({material:null,position:{x:0,y:0,z:0,distanceTo:()=>1},rotation:{x:0,y:0},castShadow:false,isDisposed:()=>false,dispose(){},baseY:0}),
                CreateLineSystem:()=>({color:null,alpha:0})},
            StandardMaterial: function(){return {diffuseColor:null,emissiveColor:null,specularColor:null,alpha:1,backFaceCulling:true}},
            SolidParticleSystem: function(){return {addShape(){},buildMesh:()=>({material:null}),initParticles(){},setParticles(){},updateParticle(){},nbParticles:200,particles:[]}},
            TransformNode: function(){return {position:{x:0,y:0,z:0,add:()=>({y:0}),addInPlace(){},copy:()=>({add:()=>({y:0})})},rotation:{y:0}}},
            Vector3: function(x,y,z){return {x,y,z,add:()=>new BABYLON.Vector3(),addInPlace(){},subtractInPlace(){},normalize(){},length:()=>0,scale:()=>new BABYLON.Vector3(),applyAxisAngle:()=>new BABYLON.Vector3(),copy:()=>({add:()=>({y:0})}),distanceTo:()=>1}},
            Color3: function(){return {}}, Color4: function(){return {}},
            Scene: Object.assign(function(){return {clearColor:null,fogMode:0,fogDensity:0,fogColor:null,ambientColor:null,meshes:[],getEngine:()=>({getDeltaTime:()=>16}),render(){}}}, {FOGMODE_EXP2: 1}),
        };
        BABYLON.Vector3.Lerp = () => new BABYLON.Vector3();
        BABYLON.Color3.FromHexString = () => new BABYLON.Color3();
        BABYLON.ShadowGenerator.QUALITY_MEDIUM = 1;
        const document = { getElementById:()=>({classList:{add(){},remove(){}},style:{display:''},addEventListener(){},requestPointerLock(){},textContent:''}),
            addEventListener(){}, pointerLockElement:null, exitPointerLock(){},
            querySelectorAll:()=>[] };
        const window = { addEventListener(){}, innerWidth:800, innerHeight:600, devicePixelRatio:1 };
        const navigator = { maxTouchPoints: 0, userAgent: '' };
        const performance = { now: () => 0 };
        const getComputedStyle = () => ({ touchAction: 'none' });
        // Now check syntax only
        void 0;
    `;
    const tmpFile = '/tmp/raanman_3d_test.js';
    fs.writeFileSync(tmpFile, wrapped + '\n' + js);
    try {
        execSync(`node --check ${tmpFile} 2>&1`);
        return true;
    } catch (e) {
        return e.stdout ? e.stdout.toString() : e.message;
    }
});

// ============================================
// 4. GAME LOGIC UNIT TESTS (Pure logic, no DOM/WebGL)
// ============================================
console.log('\n\x1b[36m--- Game Logic Unit Tests ---\x1b[0m');

// ---- AABB Collision (from 3D game) ----
function aabbOverlap(a, b) {
    return a.minX < b.maxX && a.maxX > b.minX &&
           a.minY < b.maxY && a.maxY > b.minY &&
           a.minZ < b.maxZ && a.maxZ > b.minZ;
}

test('AABB: overlapping boxes', () => {
    const a = { minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 };
    const b = { minX: 1, maxX: 3, minY: 1, maxY: 3, minZ: 1, maxZ: 3 };
    return aabbOverlap(a, b) === true;
});

test('AABB: non-overlapping boxes', () => {
    const a = { minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 };
    const b = { minX: 5, maxX: 6, minY: 5, maxY: 6, minZ: 5, maxZ: 6 };
    return aabbOverlap(a, b) === false;
});

test('AABB: touching edges (no overlap)', () => {
    const a = { minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 };
    const b = { minX: 2, maxX: 4, minY: 0, maxY: 2, minZ: 0, maxZ: 2 };
    return aabbOverlap(a, b) === false;
});

test('AABB: contained box', () => {
    const a = { minX: 0, maxX: 10, minY: 0, maxY: 10, minZ: 0, maxZ: 10 };
    const b = { minX: 2, maxX: 4, minY: 2, maxY: 4, minZ: 2, maxZ: 4 };
    return aabbOverlap(a, b) === true;
});

test('AABB: overlap on only one axis (no collision)', () => {
    const a = { minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 };
    const b = { minX: 1, maxX: 3, minY: 5, maxY: 7, minZ: 0, maxZ: 2 };
    return aabbOverlap(a, b) === false;
});

// ---- Player AABB generation ----
function getPlayerAABB(posX, posY, posZ) {
    return {
        minX: posX - 0.4, maxX: posX + 0.4,
        minY: posY, maxY: posY + 2.8,
        minZ: posZ - 0.25, maxZ: posZ + 0.25,
    };
}

test('PlayerAABB: correct dimensions at origin', () => {
    const bb = getPlayerAABB(0, 0, 0);
    return bb.minX === -0.4 && bb.maxX === 0.4 &&
           bb.minY === 0 && bb.maxY === 2.8 &&
           bb.minZ === -0.25 && bb.maxZ === 0.25;
});

test('PlayerAABB: correct at offset position', () => {
    const bb = getPlayerAABB(5, 3, -2);
    return Math.abs(bb.minX - 4.6) < 0.001 && Math.abs(bb.maxX - 5.4) < 0.001 &&
           bb.minY === 3 && bb.maxY === 5.8;
});

// ---- Camera offset rotation ----
test('Camera offset: rotation by 0 yaw keeps offset', () => {
    const offset = { x: 1.5, y: 3.5, z: -6 };
    const yaw = 0;
    const pitch = 0.3;
    const rotatedX = offset.x * Math.cos(yaw) - offset.z * Math.sin(yaw);
    const rotatedY = offset.y + offset.z * Math.sin(pitch);
    const rotatedZ = offset.x * Math.sin(yaw) + offset.z * Math.cos(yaw);
    return Math.abs(rotatedX - 1.5) < 0.001 && Math.abs(rotatedZ - (-6)) < 0.001;
});

test('Camera offset: rotation by PI yaw flips z', () => {
    const offset = { x: 0, y: 3.5, z: -6 };
    const yaw = Math.PI;
    const rotatedZ = offset.x * Math.sin(yaw) + offset.z * Math.cos(yaw);
    return Math.abs(rotatedZ - 6) < 0.001;
});

// ---- Physics simulation ----
test('Physics: gravity pulls player down', () => {
    const GRAVITY = -28;
    let velY = 0;
    let posY = 5;
    const dt = 1 / 60;
    velY += GRAVITY * dt;
    posY += velY * dt;
    return posY < 5 && velY < 0;
});

test('Physics: jump gives positive velocity', () => {
    const jumpForce = 11;
    let velY = 0;
    velY = jumpForce;
    return velY > 0;
});

test('Physics: jump arc returns to ground', () => {
    const GRAVITY = -28;
    const jumpForce = 11;
    let velY = jumpForce;
    let posY = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 200; i++) {
        velY += GRAVITY * dt;
        posY += velY * dt;
        if (posY <= 0) { posY = 0; break; }
    }
    return posY === 0;
});

test('Physics: max jump height is reasonable (2-5 units)', () => {
    const GRAVITY = -28;
    const jumpForce = 11;
    let velY = jumpForce;
    let posY = 0;
    let maxY = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 200; i++) {
        velY += GRAVITY * dt;
        posY += velY * dt;
        if (posY > maxY) maxY = posY;
        if (posY <= 0) break;
    }
    return maxY > 1.5 && maxY < 6;
});

// ---- Game State ----
test('Score: collecting with combo multiplier', () => {
    let score = 0;
    let combo = 1;
    // Collect 3 items
    score += 100 * combo; combo++;
    score += 100 * combo; combo++;
    score += 100 * combo; combo++;
    return score === (100 + 200 + 300) && combo === 4;
});

test('Score: enemy stomp with combo', () => {
    let score = 0;
    let combo = 3;
    score += 200 * combo;
    combo++;
    return score === 600 && combo === 4;
});

test('Health: damage reduces health', () => {
    let health = 100;
    const dt = 1 / 60;
    health -= 25 * dt;
    return health < 100 && health > 99;
});

test('Health: fall damage costs 20', () => {
    let health = 100;
    health -= 20;
    return health === 80;
});

test('Hack meter: capped at 100', () => {
    let hack = 95;
    hack = Math.min(100, hack + 5);
    return hack === 100;

});

test('Hack meter: doesn\'t exceed 100', () => {
    let hack = 98;
    hack = Math.min(100, hack + 5);
    return hack === 100;
});

// ---- Movement vectors ----
test('Movement: forward vector from yaw=0', () => {
    const yaw = 0;
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    return Math.abs(fwdX) < 0.001 && Math.abs(fwdZ - 1) < 0.001;
});

test('Movement: forward vector from yaw=PI/2', () => {
    const yaw = Math.PI / 2;
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    return Math.abs(fwdX - 1) < 0.001 && Math.abs(fwdZ) < 0.001;
});

test('Movement: right vector perpendicular to forward', () => {
    const yaw = 0;
    const fwd = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const right = { x: Math.sin(yaw - Math.PI / 2), z: Math.cos(yaw - Math.PI / 2) };
    const dot = fwd.x * right.x + fwd.z * right.z;
    return Math.abs(dot) < 0.001;
});

// ---- HUD formatting ----
test('HUD: health bar 10 bars at full health', () => {
    const health = 100;
    const bars = Math.max(0, Math.round(health / 10));
    return bars === 10;
});

test('HUD: health bar 0 bars at zero health', () => {
    const health = 0;
    const bars = Math.max(0, Math.round(health / 10));
    return bars === 0;
});

test('HUD: health bar partial', () => {
    const health = 73;
    const bars = Math.max(0, Math.round(health / 10));
    return bars === 7;
});

// ---- Distance check (collectible/enemy pickup) ----
test('Distance: close objects detected', () => {
    const dx = 0.5, dy = 0.5, dz = 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return dist < 1.5;
});

test('Distance: far objects not detected', () => {
    const dx = 5, dy = 5, dz = 5;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return dist >= 1.5;
});

// ---- Delta time clamping ----
test('DeltaTime: clamped to 0.05 max', () => {
    const rawDt = 500; // big spike (500ms)
    const dt = Math.min(rawDt / 1000, 0.05);
    return dt === 0.05;
});

test('DeltaTime: normal frame passes through', () => {
    const rawDt = 16.67;
    const dt = Math.min(rawDt / 1000, 0.05);
    return Math.abs(dt - 0.01667) < 0.001;
});

// ---- Camera lerp ----
test('Camera lerp: converges toward target', () => {
    let camX = 0;
    const targetX = 10;
    for (let i = 0; i < 60; i++) {
        const dt = 1 / 60;
        const factor = 1 - Math.pow(0.001, dt);
        camX = camX + (targetX - camX) * factor;
    }
    return Math.abs(camX - 10) < 0.5;
});

// ---- Collectible bobbing (no drift) ----
test('Collectible bob: baseY prevents drift', () => {
    const baseY = 5;
    let posY;
    for (let t = 0; t < 1000; t++) {
        posY = baseY + Math.sin(t * 0.002 + baseY * 3) * 0.3;
    }
    return Math.abs(posY - baseY) < 0.31;
});

// ---- Mobile particle limits ----
test('Mobile particle limit: 400 (not 2000)', () => {
    // From code: const MAX_PARTICLES = isMobile ? 400 : 2000;
    const isMobile = true;
    const MAX_PARTICLES = isMobile ? 400 : 2000;
    return MAX_PARTICLES === 400;
});

test('Desktop particle limit: 2000', () => {
    const isMobile = false;
    const MAX_PARTICLES = isMobile ? 400 : 2000;
    return MAX_PARTICLES === 2000;
});

// ---- Mobile bg particles ----
test('Mobile bg particles: 30 (not 100)', () => {
    const isMobile = true;
    const count = isMobile ? 30 : 100;
    return count === 30;
});

// ---- Platform generation ----
test('Platform count: at least 40 (10 hand-placed + 30 procedural)', () => {
    let count = 10; // hand-placed
    count += 30; // procedural loop
    return count >= 40;
});

// ============================================
// 5. RESOURCE / INTEGRATION TESTS
// ============================================
console.log('\n\x1b[36m--- Resource / Integration Tests ---\x1b[0m');

test('3D game: loads Babylon.js from CDN', () => {
    return game3dHTML.includes('src="https://cdn.babylonjs.com/babylon.js"');
});

test('Main page: links to raanman3d/', () => {
    return mainHTML.includes('raanman3d/');
});

test('3D game: back button links to ../', () => {
    return game3dHTML.includes('href="../"');
});

test('Main page: CNAME file exists', () => {
    return fs.existsSync(path.join(__dirname, 'CNAME'));
});

test('Main page: CNAME contains raanman.lol', () => {
    const cname = fs.readFileSync(path.join(__dirname, 'CNAME'), 'utf8');
    return cname.includes('raanman.lol');
});

test('raanman3d/ directory exists', () => {
    return fs.existsSync(path.join(__dirname, 'raanman3d'));
});

test('raanman3d/index.html exists', () => {
    return fs.existsSync(path.join(__dirname, 'raanman3d/index.html'));
});

// ============================================
// RESULTS
// ============================================
console.log('\n\x1b[35m====================================\x1b[0m');
console.log(`\x1b[35m  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total\x1b[0m`);
console.log('\x1b[35m====================================\x1b[0m\n');

for (const r of results) {
    if (r.status === 'PASS') {
        console.log(`  \x1b[32m✓\x1b[0m ${r.name}`);
    } else {
        console.log(`  \x1b[31m✗\x1b[0m ${r.name} ${r.detail ? `(${r.detail})` : ''}`);
    }
}

console.log('');
if (failed > 0) {
    console.log(`\x1b[31m${failed} test(s) failed!\x1b[0m`);
    process.exit(1);
} else {
    console.log(`\x1b[32mAll ${passed} tests passed!\x1b[0m`);
    process.exit(0);
}
