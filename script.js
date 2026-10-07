/**
 * PAGES OF FATE - User interface and online play
 * Modes:
 *  - 'local': two players on the same device (hot-seat), cards hidden between turns
 *  - 'host' : creates an online match; this browser runs the rules engine
 *  - 'guest': joins an online match with the code; sends actions to the host
 *  - 'cpu'  : one player against the computer (ai.js); this browser runs the engine, the computer is player 1
 * Online play uses PeerJS (WebRTC peer-to-peer, free public broker).
 */
(function () {
  'use strict';

  const E = window.Engine;
  const BY_ID = E.BY_ID;
  const PEER_PREFIX = 'pages-of-fate-v1-';
  const $ = id => document.getElementById(id);

  const app = {
    mode: null, me: 0, state: null, view: null, viewer: null,
    peer: null, conn: null, names: [],
    cpuLevel: 'normal', aiTimer: null, aiTurn: null, aiMoves: 0,
    ui: { mulligan: new Set(), target: null, attack: null, logOpen: true },
  };

  // ============================================================ helpers
  const esc = t => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const meIdx = () => (app.mode === 'local' ? app.viewer : app.me);
  const myTurn = v => v.phase === 'play' && !v.pending && v.current === meIdx();

  let toastTimer = null;
  function toast(msg, kind) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast' + (kind === 'info' ? ' info' : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  function openModal(html) {
    $('modal').dataset.pending = '';
    $('modal').querySelector('.modal-close').hidden = false;
    $('modalBody').innerHTML = html;
    $('modal').hidden = false;
  }
  function closeModal() { $('modal').hidden = true; $('modalBody').innerHTML = ''; }

  function showCover(title, text, buttons) {
    $('coverTitle').textContent = title;
    $('coverText').textContent = text;
    const box = $('coverButtons');
    box.innerHTML = '';
    buttons.forEach(b => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.gold ? 'btn-gold' : '');
      el.textContent = b.label;
      el.onclick = b.onClick;
      box.appendChild(el);
    });
    $('cover').hidden = false;
  }
  function hideCover() { $('cover').hidden = true; }

  function playerName() {
    const n = $('playerName').value.trim();
    return n || 'Player';
  }

  // ============================================================ dispatch / sync
  function dispatch(action) {
    if (app.mode === 'guest') {
      if (!app.conn || !app.conn.open) return toast('Not connected to the host');
      app.conn.send({ t: 'action', a: action });
      return;
    }
    const p = app.mode === 'local' ? app.viewer : 0;
    try {
      E.applyAction(app.state, p, action);
    } catch (err) {
      toast(err.message);
      return;
    }
    sync();
  }

  function hostReceive(action) {
    try {
      E.applyAction(app.state, 1, action);
    } catch (err) {
      if (app.conn) app.conn.send({ t: 'error', msg: err.message });
      return;
    }
    sync();
  }

  function sync() {
    if (app.mode === 'host') {
      if (app.conn && app.conn.open) app.conn.send({ t: 'state', v: E.viewFor(app.state, 1) });
      setView(E.viewFor(app.state, 0));
    } else if (app.mode === 'local') {
      const s = app.state;
      const next = s.phase === 'over' ? app.viewer : E.actingPlayer(s);
      if (next !== app.viewer) {
        app.viewer = next;
        const name = s.players[next].name;
        setView(E.viewFor(s, next), true);
        showCover(`Pass the device to ${name}`, s.pending && s.pending.kind === 'reaction'
          ? `${name}, you are being attacked and can react.` : `It is ${name}'s turn. Don't peek at the other hand!`,
          [{ label: `I am ${name}`, gold: true, onClick: () => { hideCover(); render(); } }]);
        return;
      }
      setView(E.viewFor(s, app.viewer));
    } else if (app.mode === 'cpu') {
      setView(E.viewFor(app.state, 0));
      scheduleAI();
    }
  }

  // ============================================================ computer opponent
  const AI_PLAYER = 1;
  const AI_MAX_MOVES = 40; // safety net against endless turns
  const CPU_LABEL = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

  function scheduleAI() {
    const s = app.state;
    if (app.mode !== 'cpu' || app.aiTimer || !s || s.phase === 'over') return;
    if (E.actingPlayer(s) !== AI_PLAYER) return;
    const fresh = s.current === AI_PLAYER && app.aiTurn !== s.turn;
    app.aiTimer = setTimeout(aiStep, s.pending ? 700 : fresh ? 1100 : 850);
  }

  function aiStep() {
    app.aiTimer = null;
    const s = app.state;
    if (app.mode !== 'cpu' || !s || s.phase === 'over' || E.actingPlayer(s) !== AI_PLAYER) return;
    if (app.aiTurn !== s.turn) { app.aiTurn = s.turn; app.aiMoves = 0; }
    let a = AI.chooseAction(s, AI_PLAYER, app.cpuLevel);
    if (!s.pending && s.current === AI_PLAYER && (!a || ++app.aiMoves > AI_MAX_MOVES)) a = { type: 'end' };
    if (!a) return;
    try {
      E.applyAction(s, AI_PLAYER, a);
    } catch (err) {
      // never leave the human stuck: give up the move and end the turn
      try { E.applyAction(s, AI_PLAYER, s.pending ? { type: 'react', index: -1 } : { type: 'end' }); } catch (e) { /* ignore */ }
    }
    sync();
    flashCards(aiTouched(a));
  }

  // cards involved in the computer's last move, highlighted for a moment
  function aiTouched(a) {
    const uids = [a.uid, a.target, a.discard, a.gaia].concat(a.uids || []);
    if (a.T && Array.isArray(a.T.t)) a.T.t.forEach(step => uids.push(...step));
    return uids.filter(u => typeof u === 'string');
  }

  function flashCards(uids) {
    uids.forEach(u => {
      const el = document.querySelector(`.field .card[data-uid="${u}"]`);
      if (el) el.classList.add('ai-flash');
    });
  }

  function startCpu() {
    const level = $('cpuLevel').value;
    app.mode = 'cpu'; app.me = 0; app.cpuLevel = level;
    app.names = [playerName(), `Computer (${CPU_LABEL[level]})`];
    newCpuGame();
    showScreen('game');
    sync();
  }

  function newCpuGame() {
    clearTimeout(app.aiTimer);
    Object.assign(app, { aiTimer: null, aiTurn: null, aiMoves: 0 });
    app.state = E.newGame(app.names);
    E.applyAction(app.state, AI_PLAYER, AI.chooseAction(app.state, AI_PLAYER, app.cpuLevel)); // the computer redraws first
  }

  function setView(v, silent) {
    app.view = v;
    app.ui.target = null;
    app.ui.attack = null;
    if (!silent) render();
  }

  // ============================================================ lobby & network
  function startLocal() {
    const n1 = playerName();
    const n2 = prompt('Name of the second player?', 'Player 2') || 'Player 2';
    app.mode = 'local';
    app.state = E.newGame([n1, n2]);
    app.viewer = null;
    showScreen('game');
    sync();
  }

  function startHost() {
    if (typeof Peer === 'undefined') return toast('Online play needs an internet connection (PeerJS did not load).');
    const name = playerName();
    const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    $('lobbyChoices').hidden = true;
    $('lobbyWaiting').hidden = false;
    $('hostCode').textContent = code;
    $('lobbyStatus').textContent = 'Connecting to the server…';
    app.mode = 'host'; app.me = 0; app.names = [name];
    const peer = new Peer(PEER_PREFIX + code);
    app.peer = peer;
    peer.on('open', () => { $('lobbyStatus').textContent = 'Waiting for your opponent to join…'; });
    peer.on('error', err => {
      $('lobbyStatus').textContent = 'Connection error: ' + (err.type || err.message);
      if (err.type === 'unavailable-id') { leaveGame(); startHost(); }
    });
    peer.on('connection', conn => {
      if (app.conn && app.conn.open) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 500); }); return; }
      app.conn = conn;
      conn.on('data', msg => {
        if (msg.t === 'hello') {
          app.names = [name, String(msg.name || 'Guest').slice(0, 20)];
          app.state = E.newGame(app.names);
          showScreen('game');
          sync();
        } else if (msg.t === 'action') hostReceive(msg.a);
      });
      conn.on('close', () => toast('Your opponent disconnected.'));
    });
  }

  function startJoin() {
    if (typeof Peer === 'undefined') return toast('Online play needs an internet connection (PeerJS did not load).');
    const code = $('joinCode').value.trim().toUpperCase();
    if (code.length < 5) return toast('Enter the 5-letter match code');
    const name = playerName();
    $('lobbyChoices').hidden = true;
    $('lobbyWaiting').hidden = false;
    $('hostCode').textContent = code;
    $('lobbyStatus').textContent = 'Connecting…';
    app.mode = 'guest'; app.me = 1;
    const peer = new Peer();
    app.peer = peer;
    peer.on('error', err => {
      $('lobbyStatus').textContent = err.type === 'peer-unavailable' ? 'No game found with this code.' : 'Connection error: ' + (err.type || err.message);
    });
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code, { reliable: true });
      app.conn = conn;
      conn.on('open', () => { conn.send({ t: 'hello', name }); $('lobbyStatus').textContent = 'Connected! Starting…'; });
      conn.on('data', msg => {
        if (msg.t === 'state') { showScreen('game'); setView(msg.v); }
        else if (msg.t === 'error') toast(msg.msg);
        else if (msg.t === 'full') { $('lobbyStatus').textContent = 'This match is already full.'; }
      });
      conn.on('close', () => toast('Connection to the host lost.'));
    });
  }

  function leaveGame() {
    clearTimeout(app.aiTimer); app.aiTimer = null;
    try { if (app.conn) app.conn.close(); } catch (e) { /* ignore */ }
    try { if (app.peer) app.peer.destroy(); } catch (e) { /* ignore */ }
    Object.assign(app, { mode: null, state: null, view: null, viewer: null, peer: null, conn: null });
    $('lobbyChoices').hidden = false;
    $('lobbyWaiting').hidden = true;
    hideCover(); closeModal();
    showScreen('lobby');
  }

  // ============================================================ rendering
  const STATUS_ICONS = {
    protect: ['🛡', 'Protected from damage'], stun: ['💫', 'Cannot attack or use abilities'],
    noattack: ['🚫', 'Cannot attack'], exhausted: ['😮‍💨', 'Exhausted: cannot attack'],
    captive: ['⛓', 'Captive of Calypso: cannot attack or use abilities, cannot die'],
    riddle: ['❓', 'Riddle of the Sphinx: discard a card from your field to attack again'],
    bound: ['💞', 'Bound heart: if one dies, both are destroyed'], temporary: ['⏳', 'Returns to the underworld soon'],
    tempAtk: ['⚔', 'Temporary ATK change'], tempDef: ['🛡±', 'Temporary DEF change'], blocked: ['🔒', 'Cannot be played this turn'],
  };

  function statusIcons(i) {
    const kinds = [...new Set(i.statuses.map(st => st.kind))].filter(k => STATUS_ICONS[k] && k !== 'tempAtk' && k !== 'tempDef');
    return kinds.map(k => `<span title="${STATUS_ICONS[k][1]}">${STATUS_ICONS[k][0]}</span>`).join('');
  }

  function statsBadge(v, i) {
    const c = BY_ID[i.id];
    const a = E.getAtk(v, i);
    let d = E.getDef(v, i);
    if (d < 1 && E.cannotDie(v, i)) d = 1;
    const cls = (x, base) => (x > base ? 'up' : x < base ? 'down' : '');
    return `<span class="badge-stats"><span class="${cls(a, c.atk)}">${a}</span>/<span class="${cls(d, c.def)}">${d}</span></span>`;
  }

  function cardHTML(v, i, where, extraCls) {
    if (i.hidden) return `<div class="card back" title="Hidden card"></div>`;
    const c = BY_ID[i.id];
    let inner = `<img src="${c.image}" alt="${esc(c.name)}" loading="lazy" draggable="false">`;
    if (where === 'field') inner += `<div class="status-row">${!E.isReady(v, i) && !i.flags.hasteTurn ? '<span title="Just arrived">💤</span>' : ''}${statusIcons(i)}</div>` + statsBadge(v, i);
    if (where === 'hand' && i.owner !== undefined) {
      const cost = E.costOf(v, meIdx(), c);
      inner += `<span class="badge-cost ${cost < c.cost ? 'cheap' : ''}" title="Cost">${cost}</span>`;
      if (i.statuses && i.statuses.some(st => st.kind === 'blocked')) inner += `<div class="status-row" style="top:30px">${statusIcons(i)}</div>`;
      if (v.phase === 'mulligan' && app.ui.mulligan.has(i.uid)) inner += `<span class="redraw-mark">🔄 Redraw</span>`;
    }
    return `<button class="card ${extraCls || ''}" data-uid="${i.uid}" data-where="${where}" title="${esc(c.name)}">${inner}</button>`;
  }

  function render() {
    const v = app.view;
    if (!v) return;
    const me = meIdx();
    const op = 1 - me;
    const ui = app.ui;
    const P = v.players;

    // header
    const round = Math.max(1, Math.ceil(v.turn / 2));
    $('turnInfo').innerHTML = v.phase === 'mulligan' ? '<b>Redraw phase</b>'
      : v.phase === 'over' ? '<b>Game over</b>'
      : `Round <b>${round}</b> · <b class="pc p${v.current}">${esc(P[v.current].name)}</b>'s turn`;

    // player bars
    $('oppBar').innerHTML = playerBar(v, op, false);
    $('myBar').innerHTML = playerBar(v, me, true);
    ['oppBar', 'oppField'].forEach(id => { $(id).classList.toggle('p0', op === 0); $(id).classList.toggle('p1', op === 1); });
    ['myBar', 'myField'].forEach(id => { $(id).classList.toggle('p0', me === 0); $(id).classList.toggle('p1', me === 1); });
    $('oppBar').classList.toggle('active-turn', v.phase === 'play' && v.current === op);
    $('myBar').classList.toggle('active-turn', v.phase === 'play' && v.current === me);

    // fields
    const targetSet = currentTargets();
    const fieldCls = (i, mine) => {
      const cls = [];
      if (targetSet && targetSet.has(i.uid)) cls.push('targetable');
      if (ui.target && ui.target.picked[ui.target.idx] && ui.target.picked[ui.target.idx].includes(i.uid)) cls.push('selected');
      if (ui.attack && ui.attack.uid === i.uid) cls.push('attacker');
      if (!ui.target && !ui.attack && mine && myTurn(v) && canDoSomething(v, i)) cls.push('can-act');
      return cls.join(' ');
    };
    $('oppField').innerHTML = P[op].field.length ? P[op].field.map(i => cardHTML(v, i, 'field', fieldCls(i, false))).join('') : '<span class="empty">No cards on the field</span>';
    $('myField').innerHTML = P[me].field.length ? P[me].field.map(i => cardHTML(v, i, 'field', fieldCls(i, true))).join('') : '<span class="empty">Play cards from your hand</span>';

    // hand
    if (v.phase === 'mulligan') {
      $('myHand').innerHTML = P[me].hand.map(i => cardHTML(v, i, 'hand', ui.mulligan.has(i.uid) ? 'selected redraw' : '')).join('');
    } else {
      $('myHand').innerHTML = P[me].hand.map(i => {
        const c = BY_ID[i.id];
        const ok = myTurn(v) && !ui.target && !ui.attack && E.costOf(v, me, c) <= P[me].coins && !(i.statuses || []).some(st => st.kind === 'blocked');
        return cardHTML(v, i, 'hand', ok ? 'affordable' : '');
      }).join('');
    }

    renderCenter(v);
    renderBanner(v);
    renderLog(v);
    renderPending(v);
  }

  function playerBar(v, p, mine) {
    const pl = v.players[p];
    const handInfo = mine ? '' : `<span class="stat-chip" title="Cards in hand">Hand <b>${pl.hand.length}</b></span>`;
    let html = `<span class="pname">${esc(pl.name)}${mine && app.mode !== 'local' ? ' (you)' : ''}</span>
      <span class="stat-chip life" title="Life points">❤ <b>${pl.life}</b></span>
      ${coinChip(v, p)}
      ${handInfo}
      <span class="stat-chip" title="Cards left in deck">Deck <b>${pl.deckCount}</b></span>
      <span class="stat-chip chip-btn" data-grave="${p}" title="Click to see the discard pile">Discard <b>${pl.grave.length}</b></span>`;
    if (!mine && pl.hand.some(h => !h.hidden)) html += `<span class="stat-chip chip-btn" data-revealed="${p}" title="Their hand is revealed: click to see it">👁 See hand</span>`;
    if (!mine && app.ui.attack && app.view.players[p].field.length === 0) html += `<button class="btn btn-small btn-gold attack-player" data-action="attackPlayer">Attack ${esc(pl.name)}</button>`;
    return html;
  }

  function coinChip(v, p) {
    const pl = v.players[p];
    if (v.phase !== 'play' || v.current === p) return `<span class="stat-chip coins" title="Coins available this turn">💰 <b>${pl.coins}</b> coins</span>`;
    const next = E.coinsForTurn(v.turn + 1);
    return `<span class="stat-chip coins" title="Coins left from the last turn, and coins at the start of the next turn">💰 <b>${pl.coins}</b> left · <b>${next}</b> next turn</span>`;
  }

  // "Choose ..." becomes "Select ..." in the instructions
  const asSelect = t => t.replace(/\bchoose\b/i, m => (m[0] === 'C' ? 'Select' : 'select'));

  function renderBanner(v) {
    const ui = app.ui;
    let title = '', text = '';
    const buttons = [];
    if (ui.target && ui.target.steps[ui.target.idx]) {
      const step = ui.target.steps[ui.target.idx];
      const got = ui.target.picked[ui.target.idx].length;
      title = ui.target.title || '';
      if (ui.target.steps.length > 1) title += ` · step ${ui.target.idx + 1} of ${ui.target.steps.length}`;
      text = asSelect(step.prompt) + (step.count > 1 ? ` (${got}/${step.count} selected)` : '');
      if (step.count > 1) buttons.push(['Confirm', 'targetConfirm', true]);
      if (ui.target.optional) buttons.push(['Skip', 'targetSkip']);
      buttons.push(['Cancel', 'targetCancel']);
    } else if (ui.attack) {
      title = `⚔ ${BY_ID[ui.attack.id].name} attacks`;
      text = v.players[1 - meIdx()].field.length ? 'Select the enemy card to attack' : 'Their field is empty: attack the player directly';
      buttons.push(['Cancel attack', 'attackCancel']);
    }
    $('targetBanner').hidden = !text;
    $('tbTitle').textContent = title;
    $('tbPrompt').textContent = text;
    $('tbButtons').innerHTML = buttons.map(([l, a, gold]) => `<button class="btn ${gold ? 'btn-gold' : ''}" data-action="${a}">${esc(l)}</button>`).join('');
  }

  function renderCenter(v) {
    const me = meIdx();
    const ui = app.ui;
    let text = '';
    const buttons = [];
    $('endTurnBtn').hidden = !(myTurn(v) && !ui.target && !ui.attack);

    if (v.phase === 'over') {
      text = v.winner === 'draw' ? 'The game ends in a draw.' : `${v.players[v.winner].name} wins!`;
      if (app.mode !== 'guest') buttons.push(['New game', 'rematch', true]);
      buttons.push(['Back to lobby', 'leave']);
    } else if (v.phase === 'mulligan') {
      if (v.players[me].mulliganDone) text = 'Waiting for your opponent to choose their hand…';
      else {
        text = 'Tap a card to read it and choose whether to redraw it, then confirm. You can redraw only once.';
        buttons.push([ui.mulligan.size ? `Redraw ${ui.mulligan.size} card(s)` : 'Keep this hand', 'mulligan', true]);
      }
    } else if (ui.target) {
      const step = ui.target.steps[ui.target.idx];
      const got = ui.target.picked[ui.target.idx].length;
      text = asSelect(step.prompt) + (step.count > 1 ? ` (${got}/${step.count})` : '');
    } else if (ui.attack) {
      text = `Select a target for ${BY_ID[ui.attack.id].name}.`;
    } else if (v.pending) {
      text = v.pending.player === me ? 'Make your choice…' : `Waiting for ${v.players[v.pending.player].name}…`;
    } else if (myTurn(v)) {
      text = 'Your turn: play cards, attack or use abilities. Click a card for details.';
    } else {
      text = app.mode === 'cpu' ? `${v.players[v.current].name} is thinking…` : `Waiting for ${v.players[v.current].name}…`;
    }
    $('prompt').textContent = text;
    $('promptButtons').innerHTML = buttons.map(([l, a, gold]) => `<button class="btn ${gold ? 'btn-gold' : ''}" data-action="${a}">${esc(l)}</button>`).join('');
  }

  function renderLog(v) {
    $('logLegend').innerHTML = v.players.map((pl, p) => `<span class="legend p${p}"><i></i>${esc(pl.name)}${app.mode !== 'local' && p === meIdx() ? ' (you)' : ''}</span>`).join('');
    $('log').innerHTML = v.log.slice().reverse().map(l => `<li class="${l.msg.startsWith('—') ? 'turn-line' : ''} ${l.p === 0 || l.p === 1 ? 'p' + l.p : 'neutral'}">${esc(l.msg)}</li>`).join('');
  }

  function renderPending(v) {
    const me = meIdx();
    const pend = v.pending;
    if (!pend || pend.player !== me || !$('cover').hidden) return;
    if (!$('modal').hidden && $('modal').dataset.pending === 'yes') return;
    if (pend.kind === 'reaction') {
      const A = E.findField(v, pend.attacker), D = E.findField(v, pend.target);
      openModal(`<h2>You are being attacked!</h2>
        <p>${esc(BY_ID[A.id].name)} attacks your ${esc(BY_ID[D.id].name)}. Do you want to react?</p>
        <div class="detail"><img class="detail-img" style="width:180px" src="${BY_ID[A.id].image}" alt=""><img class="detail-img" style="width:180px" src="${BY_ID[D.id].image}" alt=""></div>
        ${pend.options.map((o, k) => `<button class="btn btn-gold" data-react="${k}">${esc(o.label)}</button>`).join('')}
        <button class="btn" data-react="-1">No reaction</button>`);
    } else if (pend.kind === 'pick') {
      app.ui.pick = new Set();
      openModal(`<h2>${esc(pend.title)}</h2>
        <p class="muted">Choose ${pend.min === pend.max ? pend.max : (pend.min + ' to ' + pend.max)} card(s). Tap a card to enlarge it and select it.</p>
        <div class="pick-grid">${pend.options.map(o => gridCard(o.id, `data-pick="${o.uid}"`)).join('')}</div>
        <button class="btn btn-gold" data-action="pickConfirm">Confirm</button>`);
    }
    $('modal').dataset.pending = 'yes';
    $('modal').querySelector('.modal-close').hidden = true;
  }

  // ============================================================ card logic helpers (UI side)
  function canDoSomething(v, i) {
    const me = meIdx();
    if (!E.whyCannotAttack(v, me, i)) return true;
    return BY_ID[i.id].abilities.some(ab => !E.whyCannotUse(v, me, i, ab));
  }

  function currentTargets() {
    const v = app.view, ui = app.ui;
    if (ui.attack) {
      const A = E.findField(v, ui.attack.uid);
      if (!A) return null;
      return new Set(E.attackTargets(v, A).map(c => c.uid));
    }
    if (ui.target) {
      const step = ui.target.steps[ui.target.idx];
      if (step.from !== 'field') return null;
      return new Set(E.candidates(v, ui.target.src, step, ui.target.picked.slice(0, ui.target.idx)).map(c => c.uid));
    }
    return null;
  }

  // generic multi-step targeting; calls done({ t, choice }) or done({ skip: true })
  function startTargeting(src, spec, done, title) {
    app.ui.target = { title: title || '', src, steps: spec.steps || [], choice: spec.choice, optional: !!spec.optional, idx: 0, picked: [[]], done };
    closeModal();
    if (!app.ui.target.steps.length) return finishTargeting();
    advanceTargeting();
  }

  function advanceTargeting() {
    const tg = app.ui.target;
    if (tg.idx >= tg.steps.length) return finishTargeting();
    const step = tg.steps[tg.idx];
    const cands = E.candidates(app.view, tg.src, step, tg.picked.slice(0, tg.idx));
    if (!cands.length) {
      if (tg.optional || tg.idx > 0) { toast('No valid target.'); app.ui.target = null; render(); return tg.optional ? tg.done({ skip: true }) : null; }
      toast('No valid target.'); app.ui.target = null; return render();
    }
    if (step.from === 'grave') {
      openModal(`${tg.title ? `<p class="tb-mini">${esc(tg.title)}</p>` : ''}<h2>${esc(asSelect(step.prompt))}</h2><p class="muted">Tap a card to enlarge it and select it.</p>
        <div class="pick-grid">${cands.map(g => gridCard(g.id, `data-gravepick="${g.uid}"`, tg.picked[tg.idx].includes(g.uid) ? 'selected' : '')).join('')}</div>
        ${tg.optional ? '<button class="btn" data-action="targetSkip">Skip</button>' : ''}<button class="btn" data-action="targetCancel">Cancel</button>`);
      return;
    }
    render();
  }

  function pickTarget(uid) {
    const tg = app.ui.target;
    const step = tg.steps[tg.idx];
    const arr = tg.picked[tg.idx];
    const k = arr.indexOf(uid);
    if (k >= 0) arr.splice(k, 1); else arr.push(uid);
    const count = step.count || 1;
    if (count === 1 || arr.length >= count) return nextStep();
    render();
  }

  function nextStep() {
    const tg = app.ui.target;
    const step = tg.steps[tg.idx];
    if (tg.picked[tg.idx].length < (step.min || step.count || 1)) return toast('Choose more targets');
    tg.idx += 1;
    tg.picked.push([]);
    closeModal();
    advanceTargeting();
  }

  function finishTargeting() {
    const tg = app.ui.target;
    const t = tg.picked.slice(0, tg.steps.length);
    if (tg.choice) {
      openModal(`<h2>${esc(tg.choice.prompt)}</h2>${tg.choice.options.map((o, k) => `<button class="btn btn-gold" data-choice="${k}">${esc(o)}</button>`).join('')}`);
      tg.finalT = t;
      return;
    }
    app.ui.target = null;
    tg.done({ t });
  }

  // ============================================================ card detail modal
  const KIND_LABEL = { active: '🎯 Activated ability', onPlay: '✨ When played', passive: '♾️ Passive effect', reaction: '↩️ Reaction (opponent\'s turn)' };

  // symbols that explain what an ability does, guessed from its text
  const EFFECT_TAGS = [
    ['👁', 'Reveal', 'Look at the opponent\'s hand', /look at your opponent|shows? their hand|show their hand/i],
    ['💀', 'Destroy', 'Destroys or kills cards', /\bdestroy (one|all)\b|instantly destroy|both are destroyed|\bkill|erases all|turned to gold/i],
    ['⚔', 'Attack', 'Extra attacks or extra damage', /attack (directly|twice|two times|three times|when played)|attacks all the cards|attacks three|deals? \+?\d+ (extra )?damage|deals \+|double his ATK|make two enemy cards attack|attacked with a force/i],
    ['⬆', 'Boost', 'Raises ATK or DEF', /(gains?|adding|add|giving it|gives) \+\d|\+\d+ (ATK|DEF)/i],
    ['⬇', 'Weaken', 'Lowers ATK or DEF', /loses? \d|drops by|into a 1\/1|ignore half/i],
    ['🛡', 'Protect', 'Prevents damage or targeting', /protect|immun|does no damage|dodge|cannot die|can be targeted|can be destroyed only|take the damage|must attack .* first|delays one attack/i],
    ['🔒', 'Block', 'Stops cards from attacking or acting', /cannot attack|cannot be played|immobiliz|petrify|skips one turn|trapped|disabled|can return to the field/i],
    ['♻', 'Revive', 'Brings back destroyed cards', /revive|bring back|returns to the field|back from the underworld|defeated monster card back|destroyed Human card that dies again|returns to your hand/i],
    ['🔄', 'Control', 'Steals, swaps or moves cards', /takes control|steals|exchange one|swap one|shuffle one enemy|passes to the opponent|copies a special ability|attacks the weakest ally on their own/i],
    ['🃏', 'Cards', 'Draws or searches cards', /draw (two|one)|search your deck|summon one monster from your deck/i],
    ['💰', 'Cost', 'Changes card costs', /cost of/i],
  ];
  function effectTags(text) {
    return EFFECT_TAGS.filter(t => t[3].test(text)).map(([icon, label, tip]) => `<span class="fx-tag" title="${esc(tip)}">${icon} ${label}</span>`).join('');
  }
  // key words in an ability's text, by highlight colour
  const HIGHLIGHTS = [
    ['hl-up', /[+]\d+ (?:ATK|DEF|damage)|(?:gains?|adds?|gives?) [+]?\d+ (?:ATK|DEF)/gi],
    ['hl-down', /(?:loses?|drops? by) \d+(?: (?:ATK|DEF))?|-\d+ (?:ATK|DEF)|half damage|into a 1\/1/gi],
    ['hl-stat', /\b\d+ (?:ATK|DEF)\b|\bdouble (?:his|her|its) ATK\b/gi],
    ['hl-time', /\b(?:once|twice) per (?:game|turn)\b|\bonce per card's life\b|\bfor (?:\d+|one|two|three) turns?\b|\bfor the next (?:\w+ )?turns?\b|\bnext turn\b|\btwice\b|\bthree times\b|\bpermanently\b|\bwhile [A-Z]\w+ (?:is|remains) (?:in play|on the field)\b|\bwhen played\b/gi],
    ['hl-key', /\b(?:instantly )?destroy(?:s|ed)?\b|\bcannot (?:attack|die|be played|be targeted)\b|\bimmobiliz\w+|\btrapped\b|\bpetrif\w+|\bprotect(?:s|ing)?\b|\brevive\w*|\bbring back\b|\breturns? to (?:the field|your hand)\b|\btakes? control\b|\bsteals?\b|\bsacrifice\b|\bskips? one turn\b|\battacks? directly\b|\bdisabled\b|\blook at your opponent's (?:hand|cards)\b|\bdraw (?:one|two) cards?\b|\bimmune\b|\bsummon \w+ \w+\b|\bswap one \w+ card\b|\bpasses to the opponent's hand\b|\bshuffle one enemy card\b|\battacks all the cards\b|\bdoesn't die\b|\bwhen \w+ (?:enters the field|is played)\b/gi],
    ['hl-type', /\b(?:Gods?|Demigods?|Humans?|Monsters?|female)\b/g],
  ];
  function highlight(text) {
    const marks = [];
    for (const [cls, re] of HIGHLIGHTS) {
      for (const m of text.matchAll(re)) {
        const s = m.index, e = s + m[0].length;
        if (!marks.some(k => s < k.e && e > k.s)) marks.push({ s, e, cls });
      }
    }
    marks.sort((a, b) => a.s - b.s);
    let out = '', pos = 0;
    for (const k of marks) {
      out += esc(text.slice(pos, k.s)) + `<mark class="${k.cls}">${esc(text.slice(k.s, k.e))}</mark>`;
      pos = k.e;
    }
    return out + esc(text.slice(pos));
  }
  function abilityHTML(c, ab, extra) {
    const def = E.ABILITIES[c.id + ':' + ab.id] || {};
    const limit = def.limit === 'game' ? ' · ⏳ once per game' : def.limit === 'life' ? ' · ⏳ once per card\'s life' : def.limit === 'turn' && def.type === 'active' ? ' · 🔁 once per turn' : '';
    return `<div class="ability"><div class="kind">${KIND_LABEL[def.type] || ''}${limit}</div><h4>${esc(ab.name)}</h4><div class="fx-tags">${effectTags(ab.text)}</div><p class="ability-text">${highlight(ab.text)}</p>${extra || ''}</div>`;
  }

  function openCardDetail(uid, where) {
    const v = app.view;
    const me = meIdx();
    let inst = null;
    if (where === 'hand') inst = v.players[me].hand.find(h => h.uid === uid);
    else inst = E.findField(v, uid);
    if (!inst || inst.hidden) return;
    const c = BY_ID[inst.id];
    const mine = inst.ctrl === me || where === 'hand';
    // the card image already prints name, type, source, description and ability text
    let html = `<div class="detail"><img class="detail-img" src="${c.image}" alt="${esc(c.name)}"><div class="detail-info">`;

    if (where === 'field') {
      const a = E.getAtk(v, inst), d = E.getDef(v, inst);
      html += `<p><b>Now:</b> ${a} ATK / ${Math.max(d, E.cannotDie(v, inst) ? 1 : d)} DEF <span class="muted">(printed ${c.atk}/${c.def})</span></p>`;
      const st = inst.statuses.filter(x => STATUS_ICONS[x.kind]);
      if (st.length) html += `<ul class="status-list">${st.map(x => `<li>${STATUS_ICONS[x.kind][0]} ${STATUS_ICONS[x.kind][1]}${x.kind.startsWith('temp') ? ` (${x.data > 0 ? '+' : ''}${x.data})` : ''}</li>`).join('')}</ul>`;
      if (mine && myTurn(v)) {
        const why = E.whyCannotAttack(v, me, inst);
        html += `<button class="btn btn-gold" data-action="attack" data-uid="${uid}" ${why ? 'disabled' : ''}>⚔ Attack</button>${why ? `<div class="ability why">${esc(why)}</div>` : ''}`;
        if (inst.statuses.some(x => x.kind === 'riddle')) html += `<button class="btn" data-action="riddle" data-uid="${uid}">Answer the riddle (discard a card from your field)</button>`;
      }
      if (!mine && inst.id === 'gaia' && myTurn(v)) html += `<button class="btn" data-action="gaia" data-uid="${uid}">Destroy Gaia: sacrifice 3 of your cards (ATK sum ≥ 9)</button>`;
    } else {
      const cost = E.costOf(v, me, c);
      const blocked = (inst.statuses || []).some(x => x.kind === 'blocked');
      if (cost < c.cost) html += `<p><b>Cost now:</b> ${cost} coins (Gift of Fire)</p>`;
      if (v.phase === 'play') {
        const can = myTurn(v) && cost <= v.players[me].coins && !blocked;
        html += `<button class="btn btn-gold" data-action="play" data-uid="${uid}" ${can ? '' : 'disabled'}>Play this card</button>`;
        if (blocked) html += `<div class="ability why">Cassandra's prophecy: cannot be played this turn.</div>`;
        else if (!myTurn(v)) html += `<div class="ability why">You can play cards only on your turn.</div>`;
        else if (cost > v.players[me].coins) html += `<div class="ability why">Not enough coins.</div>`;
      }
    }

    for (const ab of c.abilities) {
      const def = E.ABILITIES[c.id + ':' + ab.id] || {};
      let btn = '';
      if (where === 'field' && def.type === 'active' && mine) {
        const why = E.whyCannotUse(v, me, inst, ab);
        btn = `<button class="btn btn-small btn-gold" data-action="ability" data-uid="${uid}" data-ability="${ab.id}" ${why ? 'disabled' : ''}>Use</button>${why ? ` <span class="why">${esc(why)}</span>` : ''}`;
      }
      html += abilityHTML(c, ab, btn);
    }
    html += `</div></div>`;
    openModal(html);
  }

  function openGrave(p) {
    const v = app.view;
    const g = v.players[p].grave;
    openModal(`<h2>${esc(v.players[p].name)}'s discard pile</h2>${g.length ? `<div class="pick-grid">${g.map(x => `<button class="card" data-zoom="${x.id}"><img src="${BY_ID[x.id].image}" alt="${esc(BY_ID[x.id].name)}"></button>`).join('')}</div>` : '<p class="muted">Empty.</p>'}`);
  }

  function openRules() {
    const C = E.CONFIG;
    openModal(`<div class="rules"><h2>Rules</h2>
      <h3>Setup and hand</h3><ul>
        <li>Each player starts with ${C.START_HAND} cards.</li>
        <li>Before the game begins, each player may redraw once, discarding any number of cards.</li>
        <li>At the beginning of each turn, they draw one card.</li>
        <li>A player can never have more than ${C.MAX_HAND} cards in hand.</li></ul>
      <h3>Cost and coins</h3><ul>
        <li>At the start of each turn, each player has a number of coins equal to the current turn number, up to a maximum of ${C.MAX_COINS} coins.</li>
        <li>To play a card, you must pay its cost in coins. If you cannot pay the cost, you cannot play that card.</li></ul>
      <h3>Special abilities</h3><ul>
        <li>Unless a card says otherwise, its special abilities can be used only if the card has already been on the field for at least one full turn.</li></ul>
      <h3>Card types</h3><ul><li>The symbols at the top of the card show its type: 👤 Humans, 🐍 Creatures &amp; Monsters, ⚡ Deities &amp; Celestial Beings.</li></ul>
      <h3>Stats</h3><ul><li>The numbers at the bottom show the card's attack and defense. The first number is ATK, the second is DEF (1/4 means 1 ATK and 4 DEF).</li></ul>
      <h3>Combat</h3><ul>
        <li>When a card attacks, it also takes damage equal to the ATK of the card it is attacking.</li>
        <li>If a card's received damage is equal to or greater than its DEF, that card is destroyed.</li>
        <li>Example: a 6/4 card attacks a 5/3 card. The 6/4 deals 6 damage to a card with 3 DEF, so the 5/3 is destroyed. The 5/3 deals 5 damage to a card with 4 DEF, so the 6/4 is also destroyed. Both cards die.</li>
        <li>More cards can attack the same card.</li></ul>
      <div class="house"><h3>Online version: extra rules</h3><ul>
        <li>Each player has ${C.LIFE} Life points and a deck of ${C.DECK_SIZE} random cards. You lose when your Life reaches 0.</li>
        <li>You can attack the opponent directly only when their field is empty.</li>
        <li>Damage stays on a card until it is healed.</li>
        <li>A card cannot attack on the turn it is played, unless its text says so.</li>
        <li>Coins follow the round number plus ${C.COIN_BONUS} bonus coin: both players get ${E.coinsForTurn(1)} coins in round 1, ${E.coinsForTurn(3)} in round 2, and so on (max ${C.MAX_COINS}).</li>
        <li>Abilities with no written limit can be used once per turn.</li>
        <li>Reactions (Zeus, Apollo, Pandora, Patroclus, Penelope, Dionysus) are offered to the defender when an attack is declared.</li></ul></div>
    </div>`);
  }

  function openGallery(filter) {
    const types = [['all', 'All'], [CARD_TYPES.HUMAN, '👤 Humans'], [CARD_TYPES.CREATURE, '🐍 Creatures'], [CARD_TYPES.DEITY, '⚡ Deities']];
    const list = CARDS.filter(c => !filter || filter === 'all' || c.type === filter);
    openModal(`<h2>All cards (${list.length})</h2>
      <div class="gallery-filters">${types.map(([k, l]) => `<button class="btn ${(filter || 'all') === k ? 'on' : ''}" data-gallery="${esc(k)}">${l}</button>`).join('')}</div>
      <div class="pick-grid">${list.map(c => `<button class="card" data-zoom="${c.id}"><img src="${c.image}" alt="${esc(c.name)}" loading="lazy"></button>`).join('')}</div>`);
  }

  // btn: optional action button shown next to the enlarged card (Redraw, Select…)
  function zoomCard(id, btn = '') {
    const c = BY_ID[id];
    const n = zoomNav ? navItems().length : 0;
    const nav = n > 1 ? `<button class="zoom-nav prev" data-zoomnav="-1" aria-label="Previous card">‹</button>
      <button class="zoom-nav next" data-zoomnav="1" aria-label="Next card">›</button>
      <div class="zoom-count">${zoomNav.idx + 1} / ${n}</div>` : '';
    $('zoomBody').innerHTML = `${nav}<div class="detail"><img class="detail-img" src="${c.image}" alt="${esc(c.name)}"><div class="detail-info">
      ${btn}${c.abilities.map(ab => abilityHTML(c, ab)).join('')}
    </div></div>`;
    $('zoom').hidden = false;
  }
  function closeZoom() { zoomNav = null; $('zoom').hidden = true; $('zoomBody').innerHTML = ''; }

  // browsing the cards of a grid (or of the opening hand) one by one while enlarged
  let zoomNav = null; // { container: CSS selector of the grid, idx }
  const navItems = () => (zoomNav ? [...document.querySelectorAll(zoomNav.container + ' > .card')] : []);
  function zoomInfo(el) {
    if (el.dataset.pick !== undefined) return [el.dataset.id, selectButton('pick', el.dataset.pick)];
    if (el.dataset.gravepick !== undefined) return [el.dataset.id, selectButton('grave', el.dataset.gravepick)];
    if (el.dataset.uid) {
      const pl = app.view.players[meIdx()];
      return [pl.hand.find(h => h.uid === el.dataset.uid).id, pl.mulliganDone ? '' : redrawButton(el.dataset.uid)];
    }
    return [el.dataset.id || el.dataset.zoom, ''];
  }
  function zoomFromGrid(el, container) {
    zoomNav = { container, idx: 0 };
    zoomNav.idx = Math.max(0, navItems().indexOf(el));
    showZoomNav();
  }
  function showZoomNav() {
    const el = navItems()[zoomNav.idx];
    if (!el) return closeZoom(); // the grid is gone (e.g. the choice is complete)
    const [id, btn] = zoomInfo(el);
    zoomCard(id, btn);
  }
  function stepZoom(d) {
    const n = navItems().length;
    if (n < 2) return;
    zoomNav.idx = (zoomNav.idx + d + n) % n;
    showZoomNav();
  }
  function redrawButton(uid) {
    return app.ui.mulligan.has(uid)
      ? `<button class="btn" data-redraw="${uid}">✓ Keep this card</button>`
      : `<button class="btn btn-gold" data-redraw="${uid}">🔄 Redraw this card</button>`;
  }
  // kind 'pick' = pending choice (e.g. a card from the opponent's hand), 'grave' = target in a discard pile
  function isPicked(kind, uid) {
    if (kind === 'pick') return app.ui.pick.has(uid);
    const tg = app.ui.target;
    return !!tg && tg.picked[tg.idx].includes(uid);
  }
  function selectButton(kind, uid) {
    return isPicked(kind, uid)
      ? `<button class="btn" data-select="${kind}:${uid}">✓ Selected · tap to deselect</button>`
      : `<button class="btn btn-gold" data-select="${kind}:${uid}">☑ Select this card</button>`;
  }
  function toggleSelect(kind, uid) {
    if (kind === 'pick') {
      if (app.ui.pick.has(uid)) app.ui.pick.delete(uid); else app.ui.pick.add(uid);
    } else {
      pickTarget(uid); // may close the grid when the step is complete
    }
    const el = document.querySelector(`#modal [data-${kind === 'pick' ? 'pick' : 'gravepick'}="${uid}"]`);
    if (el) el.classList.toggle('selected', isPicked(kind, uid));
  }

  // a card picture in a modal grid; tapping it enlarges it (with a Select button when attr makes it pickable)
  function gridCard(id, attr, cls) {
    const c = BY_ID[id];
    return `<button class="card ${cls || ''}" data-id="${id}" ${attr || `data-zoom="${id}"`}><img src="${c.image}" alt="${esc(c.name)}" loading="lazy"></button>`;
  }

  // ============================================================ actions from UI
  function doPlay(uid) {
    const v = app.view;
    const me = meIdx();
    const inst = v.players[me].hand.find(h => h.uid === uid);
    const spec = E.onPlaySpec(v, me, inst.id);
    closeModal();
    if (!spec) return dispatch({ type: 'play', uid });
    const src = { uid: '__new', id: inst.id, ctrl: me, owner: me, statuses: [], flags: {} };
    if (spec.steps && !E.candidates(v, src, spec.steps[0], []).length) return dispatch({ type: 'play', uid, T: { skip: true } });
    const ab = BY_ID[inst.id].abilities.find(a => spec.key.endsWith(':' + a.id));
    const copied = inst.id === 'echo' && v.lastAbility ? ` (copying ${v.lastAbility.name})` : '';
    startTargeting(src, spec, T => dispatch({ type: 'play', uid, T }), `${BY_ID[inst.id].name} · ${ab ? ab.name : ''}${copied}`);
  }

  function doAbility(uid, abilityId) {
    const v = app.view;
    const inst = E.findField(v, uid);
    const def = E.ABILITIES[inst.id + ':' + abilityId];
    closeModal();
    if (!def.steps && !def.choice) return dispatch({ type: 'ability', uid, ability: abilityId });
    startTargeting(inst, { steps: def.steps, choice: def.choice }, T => {
      if (T.skip) return;
      dispatch({ type: 'ability', uid, ability: abilityId, T });
    }, `${BY_ID[inst.id].name} · ${BY_ID[inst.id].abilities.find(a => a.id === abilityId).name}`);
  }

  function doAttack(uid) {
    const v = app.view;
    const A = E.findField(v, uid);
    closeModal();
    if (A.id === 'sisyphus' && v.players[1 - meIdx()].field.length) return dispatch({ type: 'attack', uid, target: 'all' });
    if (!E.attackTargets(v, A).length && !E.canAttackPlayer(v, A)) return toast('No valid target');
    app.ui.attack = { uid, id: A.id };
    render();
  }

  function doRiddle(uid) {
    const v = app.view;
    const R = E.findField(v, uid);
    startTargeting(R, { steps: [{ from: 'field', side: 'ally', count: 1, prompt: 'Choose a card of yours to discard' }] },
      T => dispatch({ type: 'riddle', uid, discard: T.t[0][0] }), '❓ Riddle of the Sphinx');
  }

  function doGaia(uid) {
    const v = app.view;
    const me = meIdx();
    const src = { uid: '__gaia', id: 'gaia', ctrl: me, statuses: [], flags: {} };
    startTargeting(src, { steps: [{ from: 'field', side: 'ally', count: 3, min: 3, prompt: 'Choose 3 of your cards to sacrifice (ATK sum ≥ 9)' }] },
      T => dispatch({ type: 'gaia', gaia: uid, uids: T.t[0] }), '🌍 Destroy Gaia');
  }

  // ============================================================ events
  document.addEventListener('click', ev => {
    if (!$('zoom').hidden) {
      const rd = ev.target.closest('[data-redraw]');
      if (rd) {
        const u = rd.dataset.redraw;
        if (app.ui.mulligan.has(u)) app.ui.mulligan.delete(u); else app.ui.mulligan.add(u);
        render();
        return zoomNav ? showZoomNav() : closeZoom();
      }
      const sel = ev.target.closest('[data-select]');
      if (sel) {
        const [kind, u] = sel.dataset.select.split(':');
        const tg = app.ui.target, step = tg && tg.idx;
        toggleSelect(kind, u);
        // a completed discard-pile choice moves on to the next step: stop browsing
        if (kind === 'grave' && (app.ui.target !== tg || !tg || tg.idx !== step)) return closeZoom();
        return zoomNav ? showZoomNav() : closeZoom();
      }
      const nv = ev.target.closest('[data-zoomnav]');
      if (nv) return stepZoom(Number(nv.dataset.zoomnav));
      if (!ev.target.closest('.zoom-box') || ev.target.closest('[data-action="closeZoom"]')) closeZoom();
      return;
    }
    const el = ev.target.closest('[data-action],[data-uid],[data-grave],[data-revealed],[data-react],[data-pick],[data-gravepick],[data-choice],[data-zoom],[data-gallery]');
    if (!el) {
      if (ev.target === $('modal') && $('modal').dataset.pending !== 'yes' && !app.ui.target) closeModal();
      return;
    }
    const v = app.view;
    const ui = app.ui;

    if (el.dataset.react !== undefined) { closeModal(); $('modal').dataset.pending = ''; return dispatch({ type: 'react', index: Number(el.dataset.react) }); }
    if ((el.dataset.pick !== undefined || el.dataset.gravepick !== undefined || el.dataset.zoom !== undefined) && el.closest('#modal .pick-grid')) {
      return zoomFromGrid(el, '#modal .pick-grid');
    }
    if (el.dataset.choice !== undefined) {
      const tg = ui.target; ui.target = null; closeModal();
      return tg.done({ t: tg.finalT, choice: Number(el.dataset.choice) });
    }
    if (el.dataset.zoom !== undefined) return zoomCard(el.dataset.zoom);
    if (el.dataset.gallery !== undefined) return openGallery(el.dataset.gallery);
    if (el.dataset.grave !== undefined) return openGrave(Number(el.dataset.grave));
    if (el.dataset.revealed !== undefined) {
      const h = v.players[Number(el.dataset.revealed)].hand.filter(x => !x.hidden);
      return openModal(`<h2>👁 ${esc(v.players[Number(el.dataset.revealed)].name)}'s revealed hand</h2><p class="muted">Tap a card to read it.</p><div class="pick-grid">${h.map(x => gridCard(x.id)).join('')}</div>`);
    }

    const action = el.dataset.action;
    if (action) {
      switch (action) {
        case 'host': return startHost();
        case 'join': return startJoin();
        case 'local': return startLocal();
        case 'cpu': return startCpu();
        case 'rules': return openRules();
        case 'gallery': return openGallery('all');
        case 'cancel': return leaveGame();
        case 'leave': if (!v || v.phase === 'over' || confirm('Leave this game?')) leaveGame(); return;
        case 'closeModal': closeModal(); if (ui.target) { ui.target = null; render(); } return;
        case 'toggleLog': {
          const lp = $('logPanel');
          if (window.innerWidth <= 1000) lp.classList.toggle('open'); else lp.classList.toggle('closed');
          return;
        }
        case 'endTurn': return dispatch({ type: 'end' });
        case 'mulligan': { const uids = [...ui.mulligan]; ui.mulligan = new Set(); return dispatch({ type: 'mulligan', uids }); }
        case 'play': return doPlay(el.dataset.uid);
        case 'ability': return doAbility(el.dataset.uid, el.dataset.ability);
        case 'attack': return doAttack(el.dataset.uid);
        case 'riddle': closeModal(); return doRiddle(el.dataset.uid);
        case 'gaia': closeModal(); return doGaia(el.dataset.uid);
        case 'attackPlayer': { const a = ui.attack; ui.attack = null; return dispatch({ type: 'attack', uid: a.uid, target: 'player' }); }
        case 'attackCancel': ui.attack = null; return render();
        case 'targetConfirm': return nextStep();
        case 'targetSkip': { const tg = ui.target; ui.target = null; closeModal(); render(); return tg.done({ skip: true }); }
        case 'targetCancel': ui.target = null; closeModal(); return render();
        case 'pickConfirm': { closeModal(); $('modal').dataset.pending = ''; return dispatch({ type: 'pick', uids: [...ui.pick] }); }
        case 'rematch': {
          if (app.mode === 'local') { app.state = E.newGame(app.state.players.map(p => p.name)); app.viewer = null; return sync(); }
          if (app.mode === 'host') { app.state = E.newGame(app.names); return sync(); }
          if (app.mode === 'cpu') { newCpuGame(); return sync(); }
          return;
        }
      }
      return;
    }

    // card clicks
    const uid = el.dataset.uid;
    const where = el.dataset.where;
    if (!v || !uid) return;
    if (v.phase === 'mulligan' && where === 'hand') {
      const inst = v.players[meIdx()].hand.find(h => h.uid === uid);
      if (!inst) return;
      return zoomFromGrid(el, '#myHand');
    }
    if (ui.attack && where === 'field') {
      const targets = currentTargets();
      if (targets.has(uid)) { const a = ui.attack; ui.attack = null; return dispatch({ type: 'attack', uid: a.uid, target: uid }); }
      if (uid === ui.attack.uid) { ui.attack = null; return render(); }
      return toast('Not a valid target');
    }
    if (ui.target && where === 'field') {
      const targets = currentTargets();
      if (targets && targets.has(uid)) return pickTarget(uid);
      return toast('Not a valid target');
    }
    openCardDetail(uid, where);
  });

  // swipe left / right on the enlarged card to browse
  let swipeX = null;
  $('zoom').addEventListener('touchstart', e => { swipeX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  $('zoom').addEventListener('touchend', e => {
    if (swipeX === null || !zoomNav) return;
    const dx = e.changedTouches[0].clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 60) stepZoom(dx < 0 ? 1 : -1);
  });

  document.addEventListener('keydown', ev => {
    if (!$('zoom').hidden && zoomNav && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) return stepZoom(ev.key === 'ArrowLeft' ? -1 : 1);
    if (ev.key === 'Escape') {
      if (!$('zoom').hidden) return closeZoom();
      if (!$('modal').hidden && $('modal').dataset.pending !== 'yes') closeModal();
      if (app.ui.target || app.ui.attack) { app.ui.target = null; app.ui.attack = null; render(); }
    }
  });


  $('joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') startJoin(); });
  try { const n = localStorage.getItem('pof-name'); if (n) $('playerName').value = n; } catch (e) { /* ignore */ }
  $('playerName').addEventListener('change', () => { try { localStorage.setItem('pof-name', $('playerName').value.trim()); } catch (e) { /* ignore */ } });
  try { const l = localStorage.getItem('pof-cpu-level'); if (l && CPU_LABEL[l]) $('cpuLevel').value = l; } catch (e) { /* ignore */ }
  $('cpuLevel').addEventListener('change', () => { try { localStorage.setItem('pof-cpu-level', $('cpuLevel').value); } catch (e) { /* ignore */ } });
})();
