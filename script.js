'use strict';

/**
 * ============================================================================
 * MODULE 1: CONFIGURATION & DATA (CẤU HÌNH)
 * ============================================================================
 */
const CONST = {
    COLORS: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
    HEX: { 'RED': '#ff1744', 'GREEN': '#00e676', 'BLUE': '#2979ff', 'YELLOW': '#ffea00' },
    // Câu thoại "Cà khịa"
    TAUNTS: [
        "Non quá em ơi!", "Về chuồng gà đi!", "Cay không cưng?", 
        "Nhân phẩm kém!", "Ahihi đồ ngốc!", "Khóc đi em!", 
        "Về nhà bú tí mẹ!", "Đen thôi đỏ quên đi!", "Gà vãi nồi!", "Biết chơi không thế?"
    ],
    // Bản đồ chuẩn (Start tại 7,1)
    PATH_TEMPLATE: [
        {r:7,c:1},{r:7,c:2},{r:7,c:3},{r:7,c:4},{r:7,c:5},{r:7,c:6}, 
        {r:6,c:7},{r:5,c:7},{r:4,c:7},{r:3,c:7},{r:2,c:7},{r:1,c:7}, 
        {r:1,c:8}, 
        {r:1,c:9},{r:2,c:9},{r:3,c:9},{r:4,c:9},{r:5,c:9},{r:6,c:9}, 
        {r:7,c:10},{r:7,c:11},{r:7,c:12},{r:7,c:13},{r:7,c:14},{r:7,c:15}, 
        {r:8,c:15}, 
        {r:9,c:15},{r:9,c:14},{r:9,c:13},{r:9,c:12},{r:9,c:11},{r:9,c:10}, 
        {r:10,c:9},{r:11,c:9},{r:12,c:9},{r:13,c:9},{r:14,c:9},{r:15,c:9}, 
        {r:15,c:8}, 
        {r:15,c:7},{r:14,c:7},{r:13,c:7},{r:12,c:7},{r:11,c:7},{r:10,c:7}, 
        {r:9,c:6},{r:9,c:5},{r:9,c:4},{r:9,c:3},{r:9,c:2},{r:9,c:1}, 
        {r:8,c:1}
    ],
    BASES: {'RED':{r:2,c:2}, 'GREEN':{r:2,c:13}, 'BLUE':{r:13,c:13}, 'YELLOW':{r:13,c:2}},
    LADDERS: {
        'RED': [{r:0,c:0}, {r:8,c:2}, {r:8,c:3}, {r:8,c:4}, {r:8,c:5}, {r:8,c:6}, {r:8,c:7}],
        'GREEN': [{r:0,c:0}, {r:2,c:8}, {r:3,c:8}, {r:4,c:8}, {r:5,c:8}, {r:6,c:8}, {r:7,c:8}],
        'BLUE': [{r:0,c:0}, {r:8,c:14}, {r:8,c:13}, {r:8,c:12}, {r:8,c:11}, {r:8,c:10}, {r:8,c:9}],
        'YELLOW': [{r:0,c:0}, {r:14,c:8}, {r:13,c:8}, {r:12,c:8}, {r:11,c:8}, {r:10,c:8}, {r:9,c:8}]
    },
    // Góc xoay 3D cho xúc xắc (X, Y)
    DICE_ROTATION: {
        1: [0, 0],      // Front
        2: [0, -90],    // Right
        3: [0, -180],   // Back
        4: [0, 90],     // Left
        5: [-90, 0],    // Top
        6: [90, 0]      // Bottom
    }
};

/**
 * ============================================================================
 * MODULE 2: UTILITIES & HELPERS
 * ============================================================================
 */
const Utils = {
    // Xoay tọa độ bản đồ cho 4 màu
    rotate: (r, c, times) => {
        let nr = r, nc = c;
        for(let i=0; i<times; i++) { let temp = nr; nr = nc; nc = 16 - temp; }
        return {r: nr, c: nc};
    },
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    getTaunt: () => CONST.TAUNTS[Utils.rand(0, CONST.TAUNTS.length - 1)]
};

// Khởi tạo Maps (Cache sẵn để tối ưu hiệu năng)
const PATHS = {
    'RED': CONST.PATH_TEMPLATE,
    'GREEN': CONST.PATH_TEMPLATE.map(p => Utils.rotate(p.r, p.c, 1)),
    'BLUE': CONST.PATH_TEMPLATE.map(p => Utils.rotate(p.r, p.c, 2)),
    'YELLOW': CONST.PATH_TEMPLATE.map(p => Utils.rotate(p.r, p.c, 3))
};

/**
 * ============================================================================
 * MODULE 3: VFX ENGINE (CANVAS PARTICLES)
 * ============================================================================
 */
const VFX = {
    canvas: document.getElementById('fxCanvas'),
    ctx: document.getElementById('fxCanvas').getContext('2d'),
    particles: [],
    
    init: () => {
        const resize = () => {
            VFX.canvas.width = VFX.canvas.offsetWidth;
            VFX.canvas.height = VFX.canvas.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize();
        VFX.loop();
    },

    // Hiệu ứng nổ (Khi đá)
    explode: (x, y, color) => {
        for(let i=0; i<20; i++) {
            VFX.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0, color: color, size: Math.random() * 5 + 2
            });
        }
    },

    // Hiệu ứng pháo hoa (Khi ra 6 hoặc thắng)
    confetti: () => {
        const w = VFX.canvas.width, h = VFX.canvas.height;
        for(let i=0; i<50; i++) {
            VFX.particles.push({
                x: w/2, y: h/2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 2.0, 
                color: Object.values(CONST.HEX)[Utils.rand(0,3)],
                size: Math.random() * 6 + 3,
                gravity: 0.2
            });
        }
    },

    loop: () => {
        VFX.ctx.clearRect(0, 0, VFX.canvas.width, VFX.canvas.height);
        for (let i = VFX.particles.length - 1; i >= 0; i--) {
            let p = VFX.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if(p.gravity) p.vy += p.gravity;
            p.life -= 0.02;
            
            VFX.ctx.globalAlpha = p.life;
            VFX.ctx.fillStyle = p.color;
            VFX.ctx.beginPath();
            VFX.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            VFX.ctx.fill();

            if (p.life <= 0) VFX.particles.splice(i, 1);
        }
        requestAnimationFrame(VFX.loop);
    }
};

/**
 * ============================================================================
 * MODULE 4: GAME LOGIC (CONTROLLER)
 * ============================================================================
 */
const Game = {
    players: {},
    horses: [],
    turn: 0,
    dice: 1,
    phase: 'WAIT', // States: WAIT, SHAKE, OPEN, MOVE, ANIM

    // Lấy tọa độ vật lý của ngựa trên lưới
    getPos: (h) => {
        if(h.pos === -1) { 
            let b = CONST.BASES[h.color]; 
            return {r: b.r + Math.floor(h.id/2), c: b.c + (h.id%2)};
        }
        if(h.rank > 0) return CONST.LADDERS[h.color][h.rank];
        return PATHS[h.color][h.pos];
    },

    // Tìm ngựa tại ô (r, c)
    findHorse: (r, c) => {
        return Game.horses.find(h => {
            let p = Game.getPos(h);
            return p && p.r === r && p.c === c;
        });
    },

    // Kiểm tra luật chơi (Luật chặt chẽ)
    checkMove: (h, dice) => {
        // 1. Ra quân
        if(h.pos === -1) {
            if(dice === 1 || dice === 6) {
                let s = PATHS[h.color][0];
                let occ = Game.findHorse(s.r, s.c);
                if(occ) {
                    if(occ.color === h.color) return {ok:true, type:'START', stack:true};
                    return {ok:true, type:'KICK', target:occ, dest:0};
                }
                return {ok:true, type:'START'};
            }
            return {ok:false};
        }
        
        // 2. Leo thang (Phải đúng số)
        if(h.rank > 0) {
            if(dice === h.rank + 1 && h.rank < 6) return {ok:true, type:'CLIMB', dest: h.rank + 1};
            return {ok:false, msg:"Sai nấc thang"};
        }

        // 3. Vào cửa (Cần 1)
        if(h.pos === 55) {
            if(dice === 1) return {ok:true, type:'CLIMB', dest: 1};
            return {ok:false, msg:"Cần 1 vào cửa"};
        }

        // 4. Đi thường
        let next = h.pos + dice;
        if(next > 55) return {ok:false, msg:"Dư bước"};

        // Check va chạm trên đường
        for(let i=1; i<=dice; i++) {
            let idx = h.pos + i;
            let p = PATHS[h.color][idx];
            let occ = Game.findHorse(p.r, p.c);
            
            if(occ) {
                if(occ.color === h.color) return {ok:false, msg:"Quân mình chặn"};
                if(occ.color !== h.color) {
                    if(i < dice) return {ok:false, msg:"Địch chặn đường"};
                    // Đá địch
                    let eStart = PATHS[occ.color][0];
                    // Check bất tử tại Start địch
                    if(p.r === eStart.r && p.c === eStart.c) return {ok:false, msg:"Địch bất tử"};
                    return {ok:true, type:'KICK', target:occ, dest: next};
                }
            }
        }
        return {ok:true, type:'MOVE', dest: next};
    },

    // Thực hiện di chuyển (Animation Sequence)
    execute: async (h, res) => {
        // Clear highlights
        document.querySelectorAll('.can-move').forEach(e => e.classList.remove('can-move'));
        Game.phase = 'ANIM';
        h.el.style.zIndex = 100;

        if (res.type === 'START') {
            h.pos = 0; h.rank = 0;
            View.updateHorse(h);
            await Utils.sleep(300);
        } 
        else if (res.type === 'CLIMB') {
            h.rank = res.dest;
            View.updateHorse(h);
            await Utils.sleep(300);
        }
        else {
            // Hiệu ứng nhảy từng bước (Hopping)
            let start = h.pos, end = res.dest;
            for(let i = start + 1; i <= end; i++) {
                h.pos = i;
                View.updateHorse(h);
                // Âm thanh 'Cộp' (Nếu có Audio)
                await Utils.sleep(200); 
            }
            // Xử lý đá
            if (res.type === 'KICK') {
                let enemy = res.target;
                
                // Hiệu ứng nổ tại vị trí đá
                let rect = enemy.el.getBoundingClientRect();
                VFX.explode(rect.left + rect.width/2, rect.top + rect.height/2, CONST.HEX[enemy.color]);
                
                enemy.pos = -1; enemy.rank = 0;
                View.updateHorse(enemy);
                View.showTaunt(enemy); // Cà khịa
                View.shakeBoard();     // Rung màn hình
                await Utils.sleep(800);
            }
        }

        h.el.style.zIndex = 20;
        
        // Kiểm tra lượt tiếp theo
        if (Game.dice === 6) {
            View.toast("6! Sướng nhé! Xóc tiếp");
            VFX.confetti(); // Pháo hoa
            Input.resetRound();
        } else {
            Game.nextTurn((Game.turn + 1) % 4);
        }
    },

    nextTurn: (idx) => {
        Game.turn = idx;
        let c = CONST.COLORS[idx];
        let p = Game.players[c];
        
        // Update UI
        let turnInd = document.getElementById('turnIndicator');
        turnInd.style.borderColor = CONST.HEX[c];
        document.getElementById('turnName').innerText = p.name;
        document.getElementById('turnName').style.color = CONST.HEX[c];
        
        Input.resetRound();
    }
};

/**
 * ============================================================================
 * MODULE 5: VIEW MANAGER (HIỂN THỊ)
 * ============================================================================
 */
const View = {
    board: document.getElementById('board'),
    
    // Vẽ bàn cờ
    renderBoard: () => {
        CONST.PATH_TEMPLATE.forEach(p => View.createCell(p.r, p.c, ''));
        CONST.COLORS.forEach(c => {
            let s = PATHS[c][0];
            let cell = document.querySelector(`.cell[data-id="${s.r}-${s.c}"]`);
            if(cell) { 
                cell.classList.add(`s-${c.toLowerCase()}`, 'start'); 
                cell.innerHTML = '<div class="dot">★</div>'; 
            } else { 
                View.createCell(s.r, s.c, `s-${c.toLowerCase()} start`, '★'); 
            }
        });
        // Vẽ Thang
        for(let c of CONST.COLORS) {
            for(let i=1; i<=6; i++) View.createDest(CONST.LADDERS[c][i], c, i);
        }
    },

    createCell: (r, c, cls, txt='') => {
        let d = document.createElement('div'); d.className = `cell ${cls}`;
        d.dataset.id = `${r}-${c}`;
        d.style.gridArea = `${r}/${c}/${r+1}/${c+1}`;
        d.innerHTML = `<div class="dot">${txt}</div>`;
        View.board.appendChild(d);
    },

    createDest: (p, c, i) => {
        let d = document.createElement('div'); d.className = `cell dest bg-${c.toLowerCase()}`;
        d.style.gridArea = `${p.r}/${p.c}/${p.r+1}/${p.c+1}`;
        d.innerHTML = `<div class="dot">${i}</div>`;
        View.board.appendChild(d);
    },

    // Vẽ ngựa
    renderHorses: () => {
        Game.horses.forEach(h => {
            let el = document.createElement('div');
            el.className = `horse h-${h.color.toLowerCase()}`;
            el.innerText = h.id + 1;
            h.el = el; // Link Element
            View.board.appendChild(el);
            View.updateHorse(h);
        });

        // Click Event (Ủy quyền)
        View.board.addEventListener('click', (e) => {
            if (Game.phase !== 'MOVING') return;
            let t = e.target.closest('.horse');
            if (!t) return;
            
            let h = Game.horses.find(x => x.el === t);
            if (h && h.color === CONST.COLORS[Game.turn]) {
                let res = Game.checkMove(h, Game.dice);
                if (res.ok) Game.execute(h, res);
                else if (res.msg) View.toast(res.msg);
            }
        });
    },

    // Cập nhật vị trí ngựa
    updateHorse: (h) => {
        let p = Game.getPos(h);
        if (!p) return;
        
        let step = 100/15;
        h.el.style.top = ((p.r-1)*step + step/2) + '%';
        h.el.style.left = ((p.c-1)*step + step/2) + '%';
        
        // Stacking (Tránh đè nhau)
        let tx = '-50%', ty = '-50%';
        if (h.pos === -1 || h.pos === 0) {
            let sibs = Game.horses.filter(s => s.color===h.color && s.pos===h.pos && s.rank===h.rank && s.id!==h.id);
            if(sibs.length > 0) {
                let off = h.id%2===0 ? -5 : 5;
                tx = `calc(-50% + ${off}px)`;
                ty = `calc(-50% + ${off}px)`;
            }
        }
        h.el.style.setProperty('--tx', tx);
        h.el.style.setProperty('--ty', ty);
        h.el.style.transform = `translate(${tx}, ${ty}) scale(0.9)`;
    },

    // Hiệu ứng Xúc xắc 3D
    rollDice3D: (val) => {
        let d = document.getElementById('dice3D');
        // Render chấm bi cho các mặt (Simplification: Chỉ cập nhật kết quả cuối)
        // Trong Level Max thực sự, ta sẽ map texture cho từng mặt. 
        // Ở đây ta xoay cube đến đúng góc.
        let rot = CONST.DICE_ROTATION[val];
        // Thêm vài vòng quay ngẫu nhiên cho đẹp
        let rx = rot[0] + 720 + Utils.rand(0,1)*360;
        let ry = rot[1] + 720 + Utils.rand(0,1)*360;
        
        d.style.transition = 'transform 0.5s ease-out';
        d.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${Utils.rand(-10,10)}deg)`;
    },

    // Bong bóng chat Cà Khịa
    showTaunt: (h) => {
        let t = document.createElement('div');
        t.className = 'taunt';
        t.innerText = Utils.getTaunt();
        h.el.parentNode.appendChild(t);
        t.style.top = h.el.style.top;
        t.style.left = h.el.style.left;
        setTimeout(() => t.remove(), 2000);
    },

    shakeBoard: () => {
        let b = document.querySelector('.board-frame');
        b.classList.add('shake-screen');
        setTimeout(() => b.classList.remove('shake-screen'), 300);
    },

    toast: (msg) => {
        document.getElementById('statusMsg').innerText = msg;
    }
};

/**
 * ============================================================================
 * MODULE 6: BOT & INPUT (CONTROLLER)
 * ============================================================================
 */
const Input = {
    bowl: document.getElementById('bowl'),
    drag: { on: false, startX: 0 },

    init: () => {
        // Setup Button Shake
        document.getElementById('btnAction').onclick = Input.onShakeClick;
        
        // Setup Drag Bowl (Horizontal)
        const b = Input.bowl;
        b.onpointerdown = (e) => {
            if(Game.phase === 'OPENING') {
                Input.drag.on = true;
                Input.drag.startX = e.clientX;
                b.setPointerCapture(e.pointerId);
                b.style.transition = 'none';
            }
        };
        b.onpointermove = (e) => {
            if(Input.drag.on) {
                let dx = e.clientX - Input.drag.startX;
                b.style.transform = `translate(${dx}px, 0)`;
            }
        };
        b.onpointerup = (e) => {
            if(Input.drag.on) {
                Input.drag.on = false;
                b.releasePointerCapture(e.pointerId);
                let dx = e.clientX - Input.drag.startX;
                b.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                
                if (Math.abs(dx) > 80) { // Kéo đủ xa
                    let endX = dx > 0 ? 200 : -200;
                    b.style.transform = `translate(${endX}px, 0)`;
                    Input.onBowlOpen();
                } else {
                    b.style.transform = `translate(0, 0)`; // Đóng lại
                }
            }
        };
    },

    onShakeClick: () => {
        if (Game.phase !== 'WAIT') return;
        document.getElementById('btnAction').disabled = true;
        Game.phase = 'SHAKING';
        
        let b = Input.bowl;
        let iv = setInterval(() => { 
            b.style.transform = `translate(${Utils.rand(-3,3)}px, ${Utils.rand(-3,3)}px)`; 
        }, 50);
        
        setTimeout(() => {
            clearInterval(iv);
            b.style.transform = 'translate(0,0)';
            Game.dice = Utils.rand(1, 6);
            View.rollDice3D(Game.dice);
            View.toast("Kéo ngang để mở >>");
            Game.phase = 'OPENING';
        }, 800);
    },

    onBowlOpen: () => {
        Game.phase = 'MOVING';
        let c = CONST.COLORS[Game.turn];
        let canMove = false;
        
        // Highlight possible moves
        Game.horses.filter(h => h.color === c).forEach(h => {
            let res = Game.checkMove(h, Game.dice);
            if (res.ok) { h.el.classList.add('can-move'); canMove = true; }
        });

        if (canMove) {
            View.toast(`Ra ${Game.dice}. Chọn quân đi!`);
        } else {
            View.toast(Game.dice === 6 ? "Kẹt! 6 được xóc lại" : "Không có nước đi");
            setTimeout(() => Game.dice === 6 ? Input.resetRound() : Game.nextTurn((Game.turn + 1) % 4), 2000);
        }
    },

    resetRound: () => {
        Game.phase = 'WAIT';
        let b = Input.bowl;
        b.style.transition = 'transform 0.3s';
        b.style.transform = 'translate(0, 0)'; // Đóng bát
        
        let p = Game.players[CONST.COLORS[Game.turn]];
        
        if (!p.isHuman) {
            setTimeout(Bot.play, 1000);
        } else {
            document.getElementById('btnAction').disabled = false;
            View.toast("Đến lượt bạn");
        }
    }
};

const Bot = {
    play: () => {
        View.toast("Bot đang xóc...");
        let b = Input.bowl;
        // Animation Fake Shake
        let iv = setInterval(() => b.style.transform = `translate(${Utils.rand(-2,2)}px,0)`, 50);
        
        setTimeout(() => {
            clearInterval(iv); b.style.transform = 'translate(0,0)';
            Game.dice = Utils.rand(1, 6);
            View.rollDice3D(Game.dice);
            
            // Auto Open
            b.style.transition = 'transform 0.4s';
            b.style.transform = 'translate(180px, 0)';
            
            setTimeout(async () => {
                try {
                    let c = CONST.COLORS[Game.turn];
                    let myHorses = Game.horses.filter(h => h.color === c);
                    let chosen = null, chosenRes = null;

                    // AI Priority: Kick > Start > Climb > Move
                    for (let h of myHorses) {
                        let res = Game.checkMove(h, Game.dice);
                        if (res.ok) {
                            if (res.type === 'KICK') { chosen = h; chosenRes = res; break; }
                            if (res.type === 'START' && !chosen) { chosen = h; chosenRes = res; }
                            if (!chosen) { chosen = h; chosenRes = res; }
                        }
                    }

                    if (chosen) {
                        await Game.execute(chosen, chosenRes);
                    } else {
                        View.toast(Game.dice === 6 ? "Kẹt! 6 xóc lại" : "Bỏ lượt");
                        if (Game.dice === 6) Input.resetRound();
                        else setTimeout(() => Game.nextTurn((Game.turn + 1) % 4), 1500);
                    }
                } catch (e) { console.error(e); Game.nextTurn((Game.turn+1)%4); }
            }, 1000);
        }, 800);
    }
};

// --- APP ENTRY ---
const App = {
    renderSetup: () => {
        let n = parseInt(document.getElementById('numHumans').value);
        let html = '';
        CONST.COLORS.forEach((c, i) => {
            let h = i < n;
            html += `
            <div class="player-row" style="border-left:5px solid ${CONST.HEX[c]}">
                <input id="n_${c}" value="${h?'Người '+(i+1):'Bot '+c}" ${h?'':'disabled'} style="background:transparent;border:none;color:white;width:100%">
                <small style="color:#888">${h?'(Player)':'(AI)'}</small>
            </div>`;
        });
        document.getElementById('playerConfig').innerHTML = html;
    },

    start: () => {
        let n = parseInt(document.getElementById('numHumans').value);
        CONST.COLORS.forEach((c, i) => {
            let name = document.getElementById(`n_${c}`).value;
            Game.players[c] = { name: name, isHuman: i < n };
            for(let j=0; j<4; j++) Game.horses.push({id:j, color:c, pos:-1, rank:0, el:null});
        });
        
        document.getElementById('setupModal').style.display = 'none';
        VFX.init();
        View.initBoard();
        View.renderHorses();
        Input.init();
        Game.nextTurn(0);
    }
};

// Bind Events
document.getElementById('btnStartGame').onclick = App.start;
App.renderSetup(); // Render initial setup
