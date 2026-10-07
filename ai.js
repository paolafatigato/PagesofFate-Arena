/**
 * PAGES OF FATE - Computer opponent
 * Pure logic (no DOM). Uses the rules engine to simulate moves on copies of the state.
 *
 * How the computer thinks:
 *  - It lists every legal move (play a card with each possible target, use an ability,
 *    attack each target, answer the Sphinx, sacrifice for Gaia).
 *  - Each move is simulated on a copy of the game and the result is scored by evaluate().
 *  - It plays the best move while it improves its position, then ends the turn.
 *  - It does not cheat: before simulating, the opponent's hidden hand is replaced with
 *    random cards and both decks are shuffled (unless a card has revealed the hand).
 * Levels:
 *  - easy  : noisy scores, ignores threats, sometimes ends the turn early.
 *  - normal: greedy best move, considers the opponent's counter-attack.
 *  - hard  : plans ahead (2-ply): for its best moves it plays out the rest of its turn and the
 *            opponent's greedy reply, and expects the opponent's best reaction to attacks.
 */
(function (global) {
  'use strict';

  const E = global.Engine;
  const BY_ID = E.BY_ID;

  const LEVELS = {
    easy:   { noise: 6,   threat: 0,   endEarly: 0.25, rollout: 0, smartReact: false },
    normal: { noise: 0.4, threat: 0.6, endEarly: 0,    rollout: 0, smartReact: false },
    hard:   { noise: 0,   threat: 1,   endEarly: 0,    rollout: 3, smartReact: true },
  };
  const ROLLOUT_WIDTH = 6;   // how many top moves the hard level explores further
  const MAX_TARGETS = 30;    // cap on target combinations per move

  const clone = s => JSON.parse(JSON.stringify(s));
  const DISABLED = ['stun', 'captive', 'noattack', 'riddle'];

  function shuffle(a) {
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  }

  // ============================================================ evaluation
  function lifeScore(l) {
    if (l <= 0) return -200;
    return l - Math.max(0, 8 - l) * 0.6; // low life is worth protecting more
  }

  function cardValue(s, i) {
    const c = BY_ID[i.id];
    const a = E.getAtk(s, i);
    let d = E.getDef(s, i);
    if (E.cannotDie(s, i)) d = Math.max(d, 8);
    let v = 1 + a * 1.1 + Math.max(0, d) * 0.75 + c.cost * 0.2;
    if (i.id === 'atlas') v -= a * 0.8;
    if (i.statuses.some(st => DISABLED.includes(st.kind))) v -= a * 0.5;
    if (E.hasStatus(i, 'riddle')) v -= a * 0.3;
    if (E.hasStatus(i, 'protect')) v += 1.2;
    if (E.hasStatus(i, 'temporary')) v *= 0.35;
    if (i.flags.dieAtEnd) v = 0.3;
    return v;
  }

  // unused once-per-game abilities are worth keeping for a good moment
  function conserve(s, p) {
    let v = 0;
    for (const i of s.players[p].field) {
      for (const ab of BY_ID[i.id].abilities) {
        const key = i.id + ':' + ab.id;
        const def = E.ABILITIES[key];
        if (!def || (def.type !== 'active' && def.type !== 'reaction')) continue;
        if (def.limit !== 'game' && def.limit !== 'life') continue;
        const used = (def.limit === 'game' ? s.players[p].usedGame[key] : i.usedLife[key]) || 0;
        if (used < (def.uses || 1)) v += 0.7;
      }
    }
    return v;
  }

  const fieldAtk = (s, p) => s.players[p].field.reduce((t, i) => t + (i.id === 'atlas' ? 0 : E.getAtk(s, i)), 0);

  function evaluate(s, p, lv) {
    if (s.winner !== null) return s.winner === p ? 1e4 : s.winner === 'draw' ? -500 : -1e4;
    const o = 1 - p;
    const me = s.players[p], op = s.players[o];
    let score = lifeScore(me.life) - lifeScore(op.life);
    for (const i of me.field) score += cardValue(s, i);
    for (const i of op.field) score -= cardValue(s, i);
    score += 1.6 * (me.hand.length - op.hand.length);
    score += conserve(s, p) - conserve(s, o);

    // lasting player effects
    if (op.effects.some(e => e.kind === 'noAttack' && e.until > s.turn)) score += 0.6 * fieldAtk(s, o);
    if (me.effects.some(e => e.kind === 'noAttack' && e.until > s.turn)) score -= 0.6 * fieldAtk(s, p);
    if (me.effects.some(e => e.kind === 'humanCost1' && e.until > s.turn))
      score += 0.8 * Math.min(3, me.hand.filter(h => BY_ID[h.id].type === CARD_TYPES.HUMAN && BY_ID[h.id].cost > 1).length);

    // pressure: an empty enemy field means our cards can hit the player directly
    if (op.field.length === 0 && me.field.length) {
      const atk = fieldAtk(s, p);
      score += 0.5 * Math.min(atk, op.life);
      // lethal next turn: almost a win if they have no card left to block with
      if (atk >= op.life) score += op.hand.length ? 8 : 40;
    }

    // threat: an empty field leaves us open to direct attacks on the next turn
    if (lv.threat && s.current === p && me.field.length === 0) {
      const dmg = fieldAtk(s, o);
      score -= dmg * 0.7 * lv.threat;
      if (dmg >= me.life) score -= 50 * lv.threat;
    }
    return score;
  }

  // ============================================================ hidden information
  // the computer sees only what a human in its seat would see
  function determinize(s, p) {
    const d = clone(s);
    d.log = [];
    const o = 1 - p;
    const op = d.players[o];
    const sees = s.players[p].effects.some(e => e.kind === 'reveal' && e.until >= s.turn);
    if (!sees) {
      // opponent's deck has no duplicates: their hand comes from cards not seen on their field/discard
      const seen = new Set(op.field.map(i => i.id).concat(op.grave.map(g => g.id)));
      const pool = shuffle(Object.keys(BY_ID).filter(id => !seen.has(id)));
      op.hand = op.hand.map((h, k) => {
        const id = pool[k % pool.length];
        return Object.assign(h, { id, atk: BY_ID[id].atk, def: BY_ID[id].def });
      });
      const rest = pool.slice(op.hand.length);
      op.deck = rest.slice(0, op.deck.length);
    }
    shuffle(op.deck);
    shuffle(d.players[p].deck);
    return d;
  }

  // ============================================================ move generation
  function combos(list, size, out, cap) {
    const rec = (start, acc) => {
      if (out.length >= cap) return;
      if (acc.length === size) { out.push(acc.slice()); return; }
      for (let k = start; k < list.length; k++) { acc.push(list[k]); rec(k + 1, acc); acc.pop(); }
    };
    rec(0, []);
    return out;
  }

  function stepPicks(cands, step) {
    const count = step.count || 1, min = step.min || count;
    const size = Math.min(count, cands.length);
    if (size < min) return [];
    if (size === 1) return cands.map(u => [u]);
    if (size === 2) { // order can matter (Eris: the first attacks the second)
      const out = [];
      for (const a of cands) for (const b of cands) if (a !== b && out.length < MAX_TARGETS) out.push([a, b]);
      return out;
    }
    return combos(cands, size, [], MAX_TARGETS);
  }

  // every target object T ({ t, choice }) for a spec with steps/choice
  function enumTargets(s, src, spec) {
    const steps = spec.steps || [];
    const out = [];
    const rec = (k, picked) => {
      if (out.length >= MAX_TARGETS) return;
      if (k === steps.length) {
        if (spec.choice) spec.choice.options.forEach((_, c) => out.push({ t: picked, choice: c }));
        else out.push({ t: picked });
        return;
      }
      const cands = E.candidates(s, src, steps[k], picked).map(c => c.uid);
      for (const pick of stepPicks(cands, steps[k])) rec(k + 1, picked.concat([pick]));
    };
    rec(0, []);
    return out;
  }

  function legalMoves(s, p) {
    const pl = s.players[p];
    const moves = [];

    // play cards
    for (const inst of pl.hand) {
      if (E.costOf(s, p, BY_ID[inst.id]) > pl.coins) continue;
      if ((inst.statuses || []).some(st => st.kind === 'blocked')) continue;
      const spec = E.onPlaySpec(s, p, inst.id);
      if (!spec) { moves.push({ type: 'play', uid: inst.uid }); continue; }
      const src = Object.assign({}, inst, { ctrl: p, owner: p });
      if (spec.steps && !E.candidates(s, src, spec.steps[0], []).length) { moves.push({ type: 'play', uid: inst.uid, T: { skip: true } }); continue; }
      enumTargets(s, src, spec).forEach(T => moves.push({ type: 'play', uid: inst.uid, T }));
      if (spec.optional) moves.push({ type: 'play', uid: inst.uid, T: { skip: true } });
    }

    for (const i of pl.field) {
      // abilities
      for (const ab of BY_ID[i.id].abilities) {
        if (E.whyCannotUse(s, p, i, ab)) continue;
        const def = E.ABILITIES[i.id + ':' + ab.id];
        if (!def.steps && !def.choice) moves.push({ type: 'ability', uid: i.uid, ability: ab.id });
        else enumTargets(s, i, def).forEach(T => moves.push({ type: 'ability', uid: i.uid, ability: ab.id, T }));
      }
      // attacks
      if (!E.whyCannotAttack(s, p, i)) {
        if (i.id === 'sisyphus' && s.players[1 - p].field.length) moves.push({ type: 'attack', uid: i.uid, target: 'all' });
        else {
          E.attackTargets(s, i).forEach(D => moves.push({ type: 'attack', uid: i.uid, target: D.uid }));
          if (E.canAttackPlayer(s, i)) moves.push({ type: 'attack', uid: i.uid, target: 'player' });
        }
      }
      // Sphinx's riddle
      if (E.hasStatus(i, 'riddle') && s.current === p) {
        pl.field.filter(x => x !== i).forEach(x => moves.push({ type: 'riddle', uid: i.uid, discard: x.uid }));
      }
    }

    // Gaia: sacrifice 3 cards with ATK sum >= 9
    const gaia = s.players[1 - p].field.find(i => i.id === 'gaia');
    if (gaia && pl.field.length >= 3) {
      combos(pl.field, 3, [], 20)
        .filter(c => c.reduce((t, i) => t + E.getAtk(s, i), 0) >= 9)
        .forEach(c => moves.push({ type: 'gaia', gaia: gaia.uid, uids: c.map(i => i.uid) }));
    }
    return moves;
  }

  // ============================================================ choices inside a move
  function pickValue(s, p, id) {
    const c = BY_ID[id];
    const next = E.coinsForTurn(s.turn + 2);
    return c.atk * 1.1 + c.def * 0.75 + c.cost * 0.3 + c.abilities.length * 0.5 - (c.cost > next + 1 ? 3 : 0);
  }

  function choosePick(s, pend) {
    const opts = pend.options.slice();
    if (pend.handler === 'cassandra') {
      // block the strongest card the opponent can afford next turn
      const next = E.coinsForTurn(s.turn + 1);
      const rank = x => { const c = BY_ID[x.id]; return (c.cost <= next ? 100 : 0) + c.cost; };
      opts.sort((a, b) => rank(b) - rank(a));
      return opts.slice(0, Math.max(1, pend.min)).map(x => x.uid);
    }
    opts.sort((a, b) => pickValue(s, pend.player, b.id) - pickValue(s, pend.player, a.id));
    return opts.slice(0, pend.max).map(x => x.uid);
  }

  // finish any pending choice created by a simulated move
  function resolvePending(sim, p, lv) {
    for (let guard = 0; guard < 6 && sim.pending && sim.phase === 'play'; guard++) {
      const pend = sim.pending;
      if (pend.kind === 'pick') {
        E.applyAction(sim, pend.player, { type: 'pick', uids: choosePick(sim, pend) });
      } else if (pend.kind === 'reaction') {
        let index = -1;
        if (lv.smartReact && pend.player !== p) {
          // expect the opponent to pick the reaction that hurts us the most
          let worst = Infinity;
          for (let k = -1; k < pend.options.length; k++) {
            const t = clone(sim);
            try { E.applyAction(t, pend.player, { type: 'react', index: k }); } catch (e) { continue; }
            const sc = evaluate(t, p, lv);
            if (sc < worst) { worst = sc; index = k; }
          }
        }
        E.applyAction(sim, pend.player, { type: 'react', index });
      } else break;
    }
  }

  function simulate(base, p, move, lv) {
    const sim = clone(base);
    try {
      E.applyAction(sim, p, move);
      resolvePending(sim, p, lv);
    } catch (e) { return null; }
    return sim;
  }

  function scoredMoves(base, p, lv) {
    const out = [];
    for (const move of legalMoves(base, p)) {
      const sim = simulate(base, p, move, lv);
      if (sim) out.push({ move, sim, score: evaluate(sim, p, lv) });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  // greedily play moves for `who` while they improve their score
  function greedyTurn(sim, who, lv, maxSteps) {
    let val = evaluate(sim, who, lv);
    for (let d = 0; d < maxSteps && sim.phase === 'play' && sim.current === who && !sim.pending; d++) {
      const next = scoredMoves(sim, who, lv)[0];
      if (!next || next.score <= val + 0.1) break;
      sim = next.sim; val = next.score;
    }
    return sim;
  }

  // value for p of: finishing this turn greedily, then the opponent's greedy reply
  function planValue(sim, p, lv, ownSteps) {
    const fast = LEVELS.normal;
    let s = greedyTurn(sim, p, fast, ownSteps);
    if (s.phase === 'over') return evaluate(s, p, lv);
    s = clone(s);
    try {
      E.applyAction(s, p, { type: 'end' });
      if (s.phase === 'play') {
        const before = evaluate(s, p, lv);
        s = greedyTurn(s, 1 - p, fast, lv.rollout);
        if (s.pending) resolvePending(s, 1 - p, fast);
        // the reply is only an estimate (their hand is guessed): blend it with the position before it
        return 0.6 * evaluate(s, p, lv) + 0.4 * before;
      }
    } catch (e) { /* fall through */ }
    return evaluate(s, p, lv);
  }

  // ============================================================ decisions
  function chooseTurnMove(s, p, lv) {
    const base = determinize(s, p);
    const now = evaluate(base, p, lv);
    const list = scoredMoves(base, p, lv);
    if (!list.length) return { type: 'end' };

    if (lv.noise) list.forEach(m => { m.score += (Math.random() - 0.5) * lv.noise; });
    list.sort((a, b) => b.score - a.score);

    if (lv.rollout) {
      // 2-ply planning: finish the turn greedily after each top move, then let the
      // opponent answer with their best greedy turn, and judge the position after that
      const endNow = planValue(base, p, lv, 0);
      let best = null;
      for (const m of list.slice(0, ROLLOUT_WIDTH)) {
        if (m.score < now - 1.2) continue; // allow a small set-up cost, never a real loss
        m.ahead = planValue(m.sim, p, lv, lv.rollout);
        if (!best || m.ahead > best.ahead) best = m;
      }
      return best && best.ahead > endNow + 0.1 ? best.move : { type: 'end' };
    }

    const best = list[0];
    if (best.score <= now + 0.1) return { type: 'end' };
    if (lv.endEarly && Math.random() < lv.endEarly) return { type: 'end' };
    return best.move;
  }

  function chooseReaction(s, p, lv) {
    const pend = s.pending;
    if (lv === LEVELS.easy && Math.random() < 0.5) return { type: 'react', index: -1 };
    const base = determinize(s, p);
    let best = -1, bestScore = -Infinity;
    for (let k = -1; k < pend.options.length; k++) {
      const sim = simulate(base, p, { type: 'react', index: k }, lv);
      if (!sim) continue;
      const sc = evaluate(sim, p, lv);
      if (sc > bestScore + 0.01) { bestScore = sc; best = k; }
    }
    return { type: 'react', index: best };
  }

  function chooseMulligan(s, p, lv) {
    const hand = s.players[p].hand;
    if (lv === LEVELS.easy) return { type: 'mulligan', uids: hand.filter(() => Math.random() < 0.2).map(h => h.uid) };
    // keep a playable curve: throw back very expensive cards, make sure there is an early play
    const back = new Set(hand.filter(h => BY_ID[h.id].cost >= 7).map(h => h.uid));
    const keep = hand.filter(h => !back.has(h.uid));
    if (!keep.some(h => BY_ID[h.id].cost <= 2) && keep.length) {
      back.add(keep.slice().sort((a, b) => BY_ID[b.id].cost - BY_ID[a.id].cost)[0].uid);
    }
    return { type: 'mulligan', uids: [...back] };
  }

  /** The next action for player p, or null if p has nothing to do now. */
  function chooseAction(s, p, level) {
    const lv = LEVELS[level] || LEVELS.normal;
    if (s.phase === 'over') return null;
    if (s.phase === 'mulligan') return s.players[p].mulliganDone ? null : chooseMulligan(s, p, lv);
    if (s.pending) {
      if (s.pending.player !== p) return null;
      if (s.pending.kind === 'pick') return { type: 'pick', uids: choosePick(s, s.pending) };
      if (s.pending.kind === 'reaction') return chooseReaction(s, p, lv);
      return null;
    }
    if (s.current !== p) return null;
    return chooseTurnMove(s, p, lv);
  }

  global.AI = { chooseAction, evaluate, legalMoves, LEVELS };
})(typeof window !== 'undefined' ? window : globalThis);
