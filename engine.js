/**
 * PAGES OF FATE - Rules engine
 * Pure game logic: no DOM access. The host runs it; clients use it only for previews/targeting.
 *
 * Official rules (from the rule sheets) + house rules needed to make a complete game:
 *  - Each player starts with 6 cards and may redraw once (mulligan) before the game begins.
 *  - At the beginning of each turn the player draws one card. Max 8 cards in hand (extra draws are discarded).
 *  - Coins at the start of each turn = turn number (round), max 10. Playing a card costs its coins.
 *    HOUSE RULE: +1 bonus coin every turn (2 coins in round 1), otherwise the first turns are almost always passed.
 *  - Abilities can be used as soon as the card is played, unless the card says otherwise
 *    (an ability that must wait one full turn sets `needsTurn: true` in the ABILITIES table).
 *    Abilities that only boost the card's own attack this turn need the card to be able to attack now.
 *  - Combat: both cards deal damage equal to their ATK. Damage >= DEF destroys the card.
 *    Several cards can attack the same card. Damage stays on the card.
 *  HOUSE RULES (not written on the rule sheet):
 *  - Each player has 20 Life points. You can attack the opponent directly only when their field is empty.
 *  - A card cannot attack on the turn it is played (unless its text says so).
 *  - Abilities without a usage limit can be used once per turn.
 *  - Deck: 30 random cards from the 79-card collection.
 */
(function (global) {
  'use strict';

  const CONFIG = {
    START_HAND: 6,
    MAX_HAND: 8,
    MAX_COINS: 10,
    COIN_BONUS: 1,
    LIFE: 20,
    DECK_SIZE: 30,
  };

  const BY_ID = {};
  CARDS.forEach(c => { BY_ID[c.id] = c; });

  // ---------------------------------------------------------------- helpers
  const opp = p => 1 - p;
  const card = i => BY_ID[i.id];
  const typeOf = i => card(i).type;
  const isHuman = i => typeOf(i) === CARD_TYPES.HUMAN;
  const isCreature = i => typeOf(i) === CARD_TYPES.CREATURE;
  const isDeity = i => typeOf(i) === CARD_TYPES.DEITY;
  const hasTag = (i, t) => card(i).tags.includes(t);
  const isDemigod = i => hasTag(i, 'demigod');
  const isHumanOrDemigod = i => isHuman(i) || isDemigod(i);
  const isFemale = i => hasTag(i, 'female');
  const nameOf = i => card(i).name;

  function shuffle(a) {
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  }

  function log(s, msg, p) {
    s.log.push({ turn: s.turn, msg, p: p !== undefined ? p : (s.phase === 'play' || s.phase === 'over' ? s.current : null) });
    if (s.log.length > 200) s.log.shift();
  }

  // visual events for the interface (fights, direct hits, deaths): s.fx, numbered by s.fxSeq
  function fx(s, e) {
    s.fxSeq = (s.fxSeq || 0) + 1;
    e.seq = s.fxSeq;
    (s.fx = s.fx || []).push(e);
    if (s.fx.length > 30) s.fx.shift();
  }

  // why cards lose DEF or die, explained to the players:
  // CAUSE describes what is hurting cards right now, ACT numbers the action being applied
  let CAUSE = '';
  let ACT = 0;
  function setCause(i, text, force) { i.flags.cause = { text, force: !!force, act: ACT }; }
  function deathReason(s, i) {
    const c = i.flags.cause && i.flags.cause.act === ACT ? i.flags.cause : null;
    if (i.flags.forceDie) return c && c.force ? c.text : (CAUSE || 'destroyed by an effect');
    const base = c ? c.text : CAUSE;
    const d = Math.max(0, getDef(s, i));
    return base ? `${base}, its DEF fell to ${d}` : `its DEF fell to ${d} (a bonus ended or its protector left)`;
  }

  function makeInst(s, id, owner) {
    const c = BY_ID[id];
    return {
      uid: 'c' + (s.nextUid++), id, owner, ctrl: owner,
      atk: c.atk, def: c.def,
      enteredTurn: null, attacksUsed: 0,
      statuses: [], usedLife: {}, usedTurn: {}, flags: {},
    };
  }

  function allField(s) { return s.players[0].field.concat(s.players[1].field); }
  function findField(s, uid) { return allField(s).find(i => i.uid === uid) || null; }
  function onField(s, p, id) { return s.players[p].field.filter(i => i.id === id); }
  function anyOnField(s, id) { return allField(s).filter(i => i.id === id); }

  function addStatus(i, kind, until, data, src) { i.statuses.push({ kind, until, data: data || 0, src: src || null }); }
  function hasStatus(i, kind) { return i.statuses.some(st => st.kind === kind); }
  function sumStatus(i, kind) { return i.statuses.filter(st => st.kind === kind).reduce((a, st) => a + st.data, 0); }
  function playerEffect(s, p, kind) {
    return s.players[p].effects.find(e => e.kind === kind && s.turn >= (e.from || 0) && s.turn <= e.until);
  }

  // Ariadne: while she is in play, all enemy Creature abilities are disabled.
  function ariadneBlocks(s, i) {
    return isCreature(i) && onField(s, opp(i.ctrl), 'ariadne').length > 0;
  }
  // a passive/aura/trigger source works only if not disabled by Ariadne
  function passiveOn(s, i) { return !ariadneBlocks(s, i); }
  function passiveSources(s, id, p) {
    const list = p === undefined ? anyOnField(s, id) : onField(s, p, id);
    return list.filter(i => passiveOn(s, i));
  }

  // ---------------------------------------------------------------- stats & auras
  function auraAtk(s, i) {
    let a = 0;
    // Echidna, Monstrous Legacy: all other Monster cards gain +1 ATK, even enemies'
    if (isCreature(i)) a += passiveSources(s, 'echidna').filter(e => e !== i).length;
    // Chiron, Master of Heroes
    if (['achilles', 'heracles', 'asclepius'].includes(i.id) && passiveSources(s, 'chiron', i.ctrl).length) a += 1;
    // Menelaus, War for Helen
    if (i.id === 'menelaus' && anyOnField(s, 'helen').length) a += 2;
    // Athena, Wisdom of War (+2 ATK target)
    a += 2 * passiveSources(s, 'athena').filter(x => x.flags.wisdomAtk === i.uid).length;
    return a;
  }

  function auraDef(s, i) {
    let d = 0;
    const p = i.ctrl;
    // Hector, Defender of the City
    if (hasTag(i, 'trojan') && i.id !== 'hector' && passiveSources(s, 'hector', p).length) d += 2;
    // Homer, Memory of the Odyssey
    if (['achilles', 'odysseus', 'ajax', 'agamemnon', 'menelaus'].includes(i.id) && passiveSources(s, 'homer', p).length) d += 1;
    // Rhea, Mother's Protection
    if (['zeus', 'poseidon', 'hades'].includes(i.id) && passiveSources(s, 'rhea', p).length) d += 1;
    // Nausicaa, Pure Heart
    if ((i.id === 'nausicaa' && onField(s, p, 'odysseus').length) || (i.id === 'odysseus' && onField(s, p, 'nausicaa').length)) d += 1;
    // Naiads, Healing Spring
    d += 3 * passiveSources(s, 'naiads').filter(x => x.flags.springTarget === i.uid).length;
    // Athena, Wisdom of War (+2 DEF target)
    d += 2 * passiveSources(s, 'athena').filter(x => x.flags.wisdomDef === i.uid).length;
    // Andromache, Wife's Warning
    if (i.id === 'hector' && onField(s, p, 'andromache').some(a => a.flags.warning === i.uid)) d += 3;
    // Kronos, Fall of the Titan
    if (i.id === 'kronos' && anyOnField(s, 'zeus').length) d -= 2;
    // Minotaur, Theseus' Shadow
    if (i.id === 'minotaur' && anyOnField(s, 'theseus').length && passiveOn(s, i)) d -= 2;
    return d;
  }

  function getAtk(s, i) { return Math.max(0, i.atk + sumStatus(i, 'tempAtk') + auraAtk(s, i)); }
  function getDef(s, i) { return i.def + sumStatus(i, 'tempDef') + auraDef(s, i); }

  function cannotDie(s, i) {
    if (i.flags.forceDie) return false;
    if (hasStatus(i, 'captive')) return true;             // Calypso
    if (i.id === 'gaia') return true;                      // Gaia, Earth's Endurance
    if (i.id === 'sisyphus' && !i.flags.hitDirect) return true; // Sisyphus, Endless Effort
    return false;
  }

  function costOf(s, p, c) {
    if (c.type === CARD_TYPES.HUMAN && playerEffect(s, p, 'humanCost1')) return 1;
    return c.cost;
  }

  // ---------------------------------------------------------------- damage & death
  function dealDamage(s, i, n, killer, direct) {
    if (n <= 0 || !findField(s, i.uid)) return 0;
    if (hasStatus(i, 'protect')) { log(s, `${nameOf(i)} is protected and takes no damage.`); return 0; }
    if (i.id === 'gaia') { log(s, `Gaia endures the blow: she can only be destroyed by sacrifice.`); return 0; }
    if (i.id === 'sisyphus' && !direct) return 0;
    if (direct && i.id === 'sisyphus') i.flags.hitDirect = true;
    let left = n;
    // temporary DEF bonuses absorb damage first
    for (const st of i.statuses) {
      if (st.kind === 'tempDef' && st.data > 0 && left > 0) {
        const take = Math.min(st.data, left);
        st.data -= take; left -= take;
      }
    }
    i.def -= left;
    setCause(i, CAUSE || 'damage');
    // Cupid, Bound Hearts: the linked card shares the loss
    const bond = i.statuses.find(st => st.kind === 'bound');
    if (bond) {
      const partner = findField(s, bond.data);
      if (partner) { partner.def -= n; setCause(partner, `it shares the ${n} damage taken by its bound heart ${nameOf(i)}`); }
    }
    i.flags.killer = killer;
    return n;
  }

  function forceDie(i, killer) { i.flags.forceDie = true; i.flags.killer = killer; setCause(i, CAUSE || 'destroyed by an effect', true); }

  function sendToGrave(s, i) {
    s.players[i.owner].grave.push({ uid: i.uid, id: i.id });
  }

  function removeFromField(s, i) {
    const f = s.players[i.ctrl].field;
    const k = f.indexOf(i);
    if (k >= 0) f.splice(k, 1);
  }

  function addToHand(s, p, id, why) {
    const pl = s.players[p];
    const inst = makeInst(s, id, p);
    if (pl.hand.length >= CONFIG.MAX_HAND) {
      pl.grave.push({ uid: inst.uid, id });
      log(s, `${pl.name}'s hand is full: ${BY_ID[id].name} is discarded.`);
      return null;
    }
    pl.hand.push(inst);
    if (why) log(s, why);
    return inst;
  }

  function draw(s, p, n) {
    const pl = s.players[p];
    for (let k = 0; k < (n || 1); k++) {
      if (!pl.deck.length) { log(s, `${pl.name}'s deck is empty.`); return; }
      const id = pl.deck.pop();
      addToHand(s, p, id);
    }
  }

  function killNow(s, i) {
    const p = i.ctrl;
    const pl = s.players[p];
    const killer = i.flags.killer === undefined ? s.current : i.flags.killer;
    fx(s, { k: 'death', uid: i.uid, id: i.id, p, why: deathReason(s, i) });
    removeFromField(s, i);

    // Odysseus, Voyage of Ten Years (once per game)
    if (i.id === 'odysseus' && !i.flags.erased && !pl.usedGame['odysseus:voyage_of_ten_years'] && passiveOn(s, i)) {
      pl.usedGame['odysseus:voyage_of_ten_years'] = true;
      const back = addToHand(s, i.owner, 'odysseus');
      log(s, back ? `Odysseus would be destroyed, but returns to ${s.players[i.owner].name}'s hand (Voyage of Ten Years).` : `Odysseus could not return to a full hand.`);
      return;
    }

    sendToGrave(s, i);
    log(s, `${nameOf(i)} is destroyed.`);

    // Cupid, Bound Hearts
    const bond = i.statuses.find(st => st.kind === 'bound');
    if (bond) {
      const partner = findField(s, bond.data);
      if (partner) { const was = CAUSE; CAUSE = `its bound heart ${nameOf(i)} died`; forceDie(partner, killer); CAUSE = was; log(s, `${nameOf(partner)} shares the fate of its bound heart.`); }
    }
    // Furies, Curse of Guilt
    if (isHumanOrDemigod(i) && passiveSources(s, 'furies').length) {
      const victim = s.players[killer];
      victim.life -= 3;
      log(s, `The Furies punish ${victim.name}: 3 damage (Curse of Guilt).`);
    }
    // Hades, Claim the Dead
    for (const h of passiveSources(s, 'hades')) {
      if (h.atk < 9) { h.atk += 1; log(s, `Hades claims the dead: +1 ATK.`); }
    }
    // Atlas, The Fall of the Sky
    if (i.id === 'atlas' && passiveOn(s, i)) {
      log(s, `The sky falls! Every card on the field is hit with 3 ATK.`);
      const was = CAUSE;
      CAUSE = 'the sky fell when Atlas died (3 damage)';
      for (const c of allField(s)) dealDamage(s, c, 3, p, false);
      CAUSE = was;
    }
    // Iphigenia, Martyr's Gift
    if (i.id === 'iphigenia') { log(s, `Iphigenia's sacrifice: ${s.players[i.owner].name} draws two cards.`); draw(s, i.owner, 2); }
    // Patroclus, Fallen Companion
    if (i.id === 'patroclus') {
      for (const a of onField(s, p, 'achilles')) { a.atk += 2; log(s, `Achilles' wrath is unleashed: +2 ATK for the rest of the game.`); }
    }
    // Paris dies: stolen cards go back to their original master
    for (const c of allField(s)) {
      if (c.flags.stolenBy === i.uid) {
        removeFromField(s, c);
        c.ctrl = c.flags.prevCtrl;
        delete c.flags.stolenBy;
        s.players[c.ctrl].field.push(c);
        log(s, `${nameOf(c)} returns to ${s.players[c.ctrl].name}.`);
      }
    }
    // Calypso dies: her captives are free
    for (const c of allField(s)) c.statuses = c.statuses.filter(st => !(st.kind === 'captive' && st.src === i.uid));
  }

  // state-based effects that are checked continuously
  function stateChecks(s) {
    // Daedalus, Labyrinth Mastery: takes control of the opponent's Minotaur
    for (const d of allField(s).filter(x => x.id === 'daedalus')) {
      for (const m of onField(s, opp(d.ctrl), 'minotaur')) {
        removeFromField(s, m);
        m.ctrl = d.ctrl;
        s.players[d.ctrl].field.push(m);
        log(s, `Daedalus takes control of the Minotaur (Labyrinth Mastery).`);
      }
    }
    // Demeter, Call of the Mother: Persephone returns from any discard pile (once per Demeter)
    for (const d of allField(s).filter(x => x.id === 'demeter' && !x.usedLife.call_of_the_mother)) {
      for (const pl of s.players) {
        const k = pl.grave.findIndex(g => g.id === 'persephone');
        if (k >= 0 && !reviveBlocked(s)) {
          pl.grave.splice(k, 1);
          d.usedLife.call_of_the_mother = true;
          const inst = makeInst(s, 'persephone', d.ctrl);
          enterField(s, d.ctrl, inst, true);
          log(s, `Demeter brings Persephone back from the underworld!`);
          break;
        }
      }
    }
  }

  function checkWin(s) {
    if (s.winner !== null) return;
    const dead = s.players.map(pl => pl.life <= 0);
    if (dead[0] && dead[1]) s.winner = 'draw';
    else if (dead[0]) s.winner = 1;
    else if (dead[1]) s.winner = 0;
    if (s.winner !== null) {
      s.phase = 'over';
      log(s, s.winner === 'draw' ? 'The game ends in a draw.' : `${s.players[s.winner].name} wins the game!`);
    }
  }

  function cleanup(s) {
    for (let guard = 0; guard < 60; guard++) {
      stateChecks(s);
      const dying = allField(s).filter(i => i.flags.forceDie || (getDef(s, i) <= 0 && !cannotDie(s, i)));
      if (!dying.length) break;
      for (const i of dying) if (findField(s, i.uid)) killNow(s, i);
    }
    checkWin(s);
  }

  // Cerberus, Infernal Guard: no destroyed card can return to the field
  function reviveBlocked(s) { return passiveSources(s, 'cerberus').length > 0; }

  function enterField(s, p, inst, silent) {
    inst.ctrl = p;
    inst.enteredTurn = s.turn;
    inst.attacksUsed = 0;
    s.players[p].field.push(inst);
    if (!silent) log(s, `${s.players[p].name} plays ${nameOf(inst)}.`);
  }

  function reviveFromGrave(s, p, graveOwner, graveUid, defMode) {
    if (reviveBlocked(s)) { log(s, `Cerberus guards the underworld: nothing can return.`); return null; }
    const g = s.players[graveOwner].grave;
    const k = g.findIndex(x => x.uid === graveUid);
    if (k < 0) return null;
    const [entry] = g.splice(k, 1);
    const inst = makeInst(s, entry.id, graveOwner);
    if (defMode === 'half') inst.def = Math.ceil(inst.def / 2);
    enterField(s, p, inst, true);
    return inst;
  }

  // ---------------------------------------------------------------- abilities
  // target step: { from: 'field'|'grave', side: 'enemy'|'ally'|'any', count, min, filter(s, cand, src, prev, viewer), prompt }
  // ability: { type: 'active'|'onPlay'|'passive'|'reaction', limit: 'game'|'life'|'turn', uses, steps, choice, can(s,src), needsAttack(s,defender), run(s,src,T) }
  // needsAttack: the ability boosts this card's attack for this turn only, so it can be used only when the card
  // can attack now and at least one enemy card it can attack matches the filter
  // revives: the ability brings a destroyed card back, so it is blocked while Cerberus is in play

  // Artemis, Protector of Women: no female Human card can be targeted by enemy abilities
  function shielded(s, target, src) {
    return target.ctrl !== src.ctrl && isHuman(target) && isFemale(target) && passiveSources(s, 'artemis', target.ctrl).length > 0;
  }

  const enemyCard = (prompt, filter) => ({ from: 'field', side: 'enemy', count: 1, prompt, filter });
  const allyCard = (prompt, filter) => ({ from: 'field', side: 'ally', count: 1, prompt, filter });
  const stun = (s, t, src, label) => { addStatus(t, 'stun', s.turn + 1, 0, src.uid); log(s, `${nameOf(t)} cannot attack or use abilities for 1 turn (${label}).`); };

  const ABILITIES = {
    // ---------- HUMANS
    'achilles:rage_of_achilles': { type: 'active', limit: 'game', needsAttack: (s, d) => isHumanOrDemigod(d), run(s, src) {
      src.flags.rageTurn = s.turn;
      addStatus(src, 'tempDef', s.turn + 2, -2, src.uid);
      log(s, `Rage of Achilles: +3 damage against Humans and Demigods this turn, -2 DEF for the next two turns.`);
    } },
    'agamemnon:kings_command': { type: 'active', limit: 'game', run(s, src) {
      for (const c of s.players[src.ctrl].field.filter(isHuman)) { addStatus(c, 'tempAtk', s.turn, 1, src.uid); c.flags.hasteTurn = s.turn; }
      log(s, `King's Command: every Human ally gains +1 ATK and can attack this turn.`);
    } },
    'ajax:tower_shield': { type: 'active', limit: 'turn',
      steps: [allyCard('Choose an adjacent ally to protect', (s, c, src) => {
        const f = s.players[src.ctrl].field; return c !== src && Math.abs(f.indexOf(c) - f.indexOf(src)) === 1;
      })],
      run(s, src, T) { const t = findField(s, T.t[0][0]); addStatus(t, 'protect', s.turn + 1, 0, src.uid); log(s, `Ajax raises his shield over ${nameOf(t)} until your next turn.`); } },
    'andromache:wifes_warning': { type: 'onPlay', run(s, src) {
      const h = onField(s, src.ctrl, 'hector')[0];
      if (h) { src.flags.warning = h.uid; log(s, `Andromache keeps Hector from battle: he cannot attack and gains +3 DEF while she is in play.`); }
    } },
    'ariadne:thread_of_clarity': { type: 'passive' },
    'atalanta:swift_arrow': { type: 'passive' },
    'cassandra:prophecy_ignored': { type: 'active', limit: 'game',
      can: s => true,
      run(s, src) {
        const o = s.players[opp(src.ctrl)];
        if (!o.hand.length) { log(s, `Cassandra sees an empty hand.`); return; }
        s.pending = { kind: 'pick', player: src.ctrl, handler: 'cassandra', title: 'Prophecy Ignored: choose a card that cannot be played next turn', options: o.hand.map(h => ({ uid: h.uid, id: h.id })), min: 1, max: 1 };
      } },
    'daedalus:ingenious_design': { type: 'active', limit: 'game',
      steps: [allyCard('Choose a Human ally to improve', (s, c) => isHuman(c))],
      choice: { prompt: 'Improve ATK or DEF?', options: ['+3 ATK', '+3 DEF'] },
      run(s, src, T) { const t = findField(s, T.t[0][0]); if (T.choice === 0) t.atk += 3; else t.def += 3; log(s, `Daedalus improves ${nameOf(t)}: ${T.choice === 0 ? '+3 ATK' : '+3 DEF'}.`); } },
    'daedalus:labyrinth_mastery': { type: 'passive' },
    'daphne:flight': { type: 'passive' },
    'diomedes:godslayer': { type: 'active', limit: 'game', needsAttack: (s, d) => isDeity(d), run(s, src) { src.flags.godslayerTurn = s.turn; log(s, `Godslayer: Diomedes' next attack against a God ignores half its defense.`); } },
    'echo:mirror_voice': { type: 'onPlay', copy: true, run(s, src, T) {
      const last = s.lastAbility;
      if (!last || s.turn - last.turn > 1) { log(s, `Echo finds no voice to repeat.`); return; }
      const ab = ABILITIES[last.key];
      log(s, `Echo repeats ${last.name}!`);
      ab.run(s, src, T);
      src.flags.fading = true;
    } },
    'eurydice:return_from_shadows': { type: 'active', limit: 'game', revives: true,
      steps: [{ from: 'grave', side: 'ally', count: 1, prompt: 'Choose a destroyed Human card', filter: (s, g) => BY_ID[g.id].type === CARD_TYPES.HUMAN },
              enemyCard('Choose the enemy to attack')],
      run(s, src, T) {
        const g = s.players[src.ctrl].grave.find(x => x.uid === T.t[0][0]);
        const t = findField(s, T.t[1][0]);
        const ghost = makeInst(s, g.id, src.ctrl);
        log(s, `${BY_ID[g.id].name} returns from the shadows to strike ${nameOf(t)}, then fades again.`);
        dealDamage(s, t, ghost.atk, src.ctrl, true);
      } },
    'hector:defender_of_the_city': { type: 'passive' },
    'helen:beauty_of_chaos': { type: 'onPlay', run(s) {
      const [a, b] = s.players;
      if (!a.hand.length || !b.hand.length) { log(s, `Helen enters, but a hand is empty: no swap.`); return; }
      const ia = Math.floor(Math.random() * a.hand.length), ib = Math.floor(Math.random() * b.hand.length);
      const ca = a.hand[ia], cb = b.hand[ib];
      ca.owner = 1; ca.ctrl = 1; cb.owner = 0; cb.ctrl = 0;
      a.hand[ia] = cb; b.hand[ib] = ca;
      log(s, `Helen's beauty confuses all hearts: both players swap a random card from their hands.`);
    } },
    'heracles:master_of_beasts': { type: 'active', limit: 'game', revives: true,
      cant: 'No defeated Monster in any discard pile', can: s => s.players.some(pl => pl.grave.some(g => BY_ID[g.id].type === CARD_TYPES.CREATURE)),
      steps: [{ from: 'grave', side: 'any', count: 1, prompt: 'Choose a defeated Monster', filter: (s, g) => BY_ID[g.id].type === CARD_TYPES.CREATURE }],
      run(s, src, T) {
        const uid = T.t[0][0];
        const ownerP = s.players[0].grave.some(g => g.uid === uid) ? 0 : 1;
        const inst = reviveFromGrave(s, src.ctrl, ownerP, uid);
        if (inst) { addStatus(inst, 'temporary', s.turn + 2, 0, src.uid); log(s, `Heracles drags ${nameOf(inst)} back from Hades: it fights for you next turn, then returns below.`); }
      } },
    'homer:memory_of_the_odyssey': { type: 'passive' },
    'icarus:wax_wings': { type: 'active', limit: 'game', needsAttack: () => true, run(s, src) { src.flags.waxTurn = s.turn; log(s, `Wax Wings: Icarus doubles his ATK for his next attack this turn.`); } },
    'iphigenia:martyrs_gift': { type: 'passive' },
    'jason:the_argonauts': { type: 'onPlay', run(s, src) {
      const pl = s.players[src.ctrl];
      const opts = pl.deck.map((id, k) => ({ uid: 'd' + k, id })).filter(o => BY_ID[o.id].type === CARD_TYPES.HUMAN);
      if (!opts.length) { log(s, `Jason finds no Human in the deck.`); return; }
      s.pending = { kind: 'pick', player: src.ctrl, handler: 'deckToHand', title: 'The Argonauts: choose up to 2 Human cards for your crew', options: opts, min: 0, max: 2 };
    } },
    'midas:golden_touch': { type: 'active', limit: 'life', run(s, src) {
      const o = s.players[opp(src.ctrl)];
      if (o.hand.length) {
        const k = Math.floor(Math.random() * o.hand.length);
        const [c] = o.hand.splice(k, 1);
        o.grave.push({ uid: c.uid, id: c.id });
        log(s, `Golden Touch: ${BY_ID[c.id].name} in ${o.name}'s hand turns to gold and is destroyed.`);
      } else log(s, `Golden Touch finds nothing to touch.`);
      src.flags.dieAtEnd = true;
      log(s, `Midas will die at the end of this turn.`);
    } },
    'medea:ultimate_betrayal': { type: 'active', limit: 'game', run(s, src) {
      const o = s.players[opp(src.ctrl)];
      if (!o.hand.length) { log(s, `Medea finds no victim.`); return; }
      const score = c => BY_ID[c.id].atk + BY_ID[c.id].def;
      const min = Math.min(...o.hand.map(score));
      const weak = shuffle(o.hand.filter(c => score(c) === min))[0];
      o.hand.splice(o.hand.indexOf(weak), 1);
      o.grave.push({ uid: weak.uid, id: weak.id });
      log(s, `Ultimate Betrayal: Medea kills ${BY_ID[weak.id].name}, the weakest card in ${o.name}'s hand.`);
    } },
    'menelaus:war_for_helen': { type: 'passive' },
    'nausicaa:pure_heart': { type: 'passive' },
    'odysseus:voyage_of_ten_years': { type: 'passive' },
    'odysseus:trojan_horse': { type: 'active', limit: 'life', run(s, src) {
      const o = s.players[opp(src.ctrl)];
      reveal(s, src.ctrl, s.turn);
      const doomed = o.hand.filter(c => BY_ID[c.id].def < 3);
      o.hand = o.hand.filter(c => BY_ID[c.id].def >= 3);
      doomed.forEach(c => o.grave.push({ uid: c.uid, id: c.id }));
      log(s, `Trojan Horse: ${o.name} shows their hand. ${doomed.length ? doomed.map(c => BY_ID[c.id].name).join(', ') + ' destroyed.' : 'No card has DEF lower than 3.'}`);
    } },
    'oedipus:blind_insight': { type: 'passive' },
    'orpheus:song_of_life': { type: 'onPlay', optional: true, revives: true,
      steps: [{ from: 'grave', side: 'ally', count: 1, prompt: 'Song of Life: choose a destroyed Human to revive (or skip)', filter: (s, g) => BY_ID[g.id].type === CARD_TYPES.HUMAN }],
      run(s, src, T) {
        const inst = reviveFromGrave(s, src.ctrl, src.ctrl, T.t[0][0], 'half');
        if (inst) log(s, `Orpheus' song brings ${nameOf(inst)} back with half its DEF.`);
      } },
    'pandora:forbidden_jar': { type: 'onPlay', run(s) {
      for (const c of allField(s)) c.def -= 1;
      log(s, `Pandora opens the jar: every card on the field loses 1 DEF.`);
    } },
    'pandora:hope_within': { type: 'reaction', limit: 'game' },
    'paris:apple_of_discord': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose a female Human card to steal', (s, c) => isHuman(c) && isFemale(c))],
      run(s, src, T) {
        const t = findField(s, T.t[0][0]);
        removeFromField(s, t);
        t.flags.prevCtrl = t.ctrl; t.flags.stolenBy = src.uid; t.flags.hasteTurn = s.turn; t.attacksUsed = 0;
        t.ctrl = src.ctrl;
        s.players[src.ctrl].field.push(t);
        log(s, `Paris steals ${nameOf(t)}! She may attack immediately.`);
      } },
    'patroclus:borrowed_armor': { type: 'reaction', limit: 'turn' },
    'patroclus:fallen_companion': { type: 'passive' },
    'penelope:endless_weaving': { type: 'reaction', limit: 'game' },
    'perseus:head_of_medusa': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose an enemy to petrify')],
      run(s, src, T) { const t = findField(s, T.t[0][0]); addStatus(t, 'noattack', s.turn + 1, 0, src.uid); log(s, `Head of Medusa: ${nameOf(t)} is petrified and cannot attack for one turn.`); } },
    'philemon:sacred_hospitality': { type: 'active', limit: 'game', run(s, src) {
      for (const c of s.players[src.ctrl].field) addStatus(c, 'tempDef', s.turn + 1, 2, src.uid);
      log(s, `Sacred Hospitality: all allies gain +2 DEF until the beginning of your next turn.`);
    } },
    'priam:royal_blood': { type: 'onPlay', run(s, src) {
      reveal(s, 0, s.turn); reveal(s, 1, s.turn);
      const pool = allField(s).concat(s.players[0].hand, s.players[1].hand).filter(c => c !== src && hasTag(c, 'trojan'));
      src.def += pool.length;
      log(s, `Royal Blood: both hands are revealed. ${pool.length} Trojan card(s) found: Priam gains +${pool.length} DEF.`);
    } },
    'psyche:heap_of_grains': { type: 'onPlay', optional: true,
      steps: [enemyCard('Heap of Grains: choose an enemy card to shuffle into its deck (or skip)')],
      run(s, src, T) {
        const t = findField(s, T.t[0][0]);
        removeFromField(s, t);
        const d = s.players[t.owner].deck;
        d.splice(Math.floor(Math.random() * (d.length + 1)), 0, t.id);
        log(s, `${nameOf(t)} is shuffled back into ${s.players[t.owner].name}'s deck.`);
      } },
    'sisyphus:endless_effort': { type: 'passive' },
    'telemachus:protector_of_women': { type: 'passive' },
    'theseus:labyrinth_duel': { type: 'passive' },

    // ---------- CREATURES & MONSTERS
    'arachne:web_trap': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose an enemy (not a God) to trap', (s, c) => !isDeity(c))],
      run(s, src, T) { stun(s, findField(s, T.t[0][0]), src, 'Web Trap'); } },
    'cerberus:infernal_guard': { type: 'passive' },
    'cerberus:triple_bite': { type: 'passive' },
    'chimera:infernal_breath': { type: 'active', limit: 'game',
      steps: [{ from: 'field', side: 'enemy', count: 3, min: 1, prompt: 'Choose up to 3 enemy cards' }],
      run(s, src, T) {
        for (const uid of T.t[0]) { const t = findField(s, uid); if (t) addStatus(t, 'tempDef', s.turn + 1, -2, src.uid); }
        log(s, `Infernal Breath: ${T.t[0].length} enemy card(s) lose 2 DEF for 1 turn.`);
      } },
    'chiron:healing_wisdom': { type: 'active', limit: 'turn',
      steps: [allyCard('Choose an ally to heal')],
      run(s, src, T) { const t = findField(s, T.t[0][0]); t.def += 3; log(s, `Chiron heals ${nameOf(t)}: +3 DEF.`); } },
    'chiron:master_of_heroes': { type: 'passive' },
    'echidna:spawn_of_terror': { type: 'active', limit: 'turn', run(s, src) {
      // a living Monster from the deck or a dead one from the discard pile
      const pl = s.players[src.ctrl];
      const isMonster = o => BY_ID[o.id].type === CARD_TYPES.CREATURE;
      const opts = pl.deck.map((id, k) => ({ uid: 'd' + k, id, from: 'deck' })).filter(isMonster)
        .concat(reviveBlocked(s) ? [] : pl.grave.map(g => ({ uid: 'g:' + g.uid, id: g.id, from: 'discard pile' })).filter(isMonster));
      if (!opts.length) { log(s, `Echidna finds no monster in the deck or in the discard pile.`); return; }
      s.pending = { kind: 'pick', player: src.ctrl, handler: 'echidnaSummon', reveal: true, title: 'Spawn of Terror: choose one Monster (from your deck or your discard pile) to add to your hand', options: opts, min: 0, max: 1 };
    } },
    'echidna:monstrous_legacy': { type: 'passive' },
    'medusa:petrifying_gaze': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose an enemy to petrify')],
      run(s, src, T) { stun(s, findField(s, T.t[0][0]), src, 'Petrifying Gaze'); } },
    'medusa:perseus_mirror': { type: 'passive' },
    'minotaur:theseus_shadow': { type: 'passive' },
    'minotaur:rage_of_the_labyrinth': { type: 'passive' },
    'polyphemus:crushing_strength': { type: 'passive' },
    'sirens:song_of_temptation': { type: 'active', limit: 'game',
      steps: [{ from: 'field', side: 'enemy', count: 2, min: 1, prompt: 'Choose two Human or Demigod cards (Odysseus is immune)', filter: (s, c) => isHumanOrDemigod(c) && c.id !== 'odysseus' }],
      run(s, src, T) {
        for (const uid of T.t[0]) { const t = findField(s, uid); if (t) addStatus(t, 'noattack', s.turn + 1, 0, src.uid); }
        log(s, `Song of Temptation: the chosen cards cannot attack for one turn.`);
      } },
    'sphinx:riddle_of_doom': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose an enemy card to riddle')],
      run(s, src, T) { const t = findField(s, T.t[0][0]); addStatus(t, 'riddle', 9999, 0, src.uid); log(s, `Riddle of Doom: ${nameOf(t)} cannot attack until its controller discards a card from the field.`); } },

    // ---------- DEITIES & CELESTIAL BEINGS
    'aphrodite:charm_of_desire': { type: 'active', limit: 'game', run(s, src) {
      s.players[opp(src.ctrl)].effects.push({ kind: 'noAttack', until: s.turn + 1 });
      log(s, `Charm of Desire: ${s.players[opp(src.ctrl)].name} forgets the fight and skips their next attack turn.`);
    } },
    'apollo:healing_light': { type: 'reaction', limit: 'game' },
    'apollo:prophecy_of_delphi': { type: 'active', limit: 'game', run(s, src) {
      reveal(s, src.ctrl, s.turn);
      log(s, `Prophecy of Delphi: ${s.players[src.ctrl].name} looks at the opponent's hand.`);
    } },
    'ares:battle_frenzy': { type: 'onPlay', limit: 'game', run(s, src) {
      for (const c of s.players[src.ctrl].field) if (c !== src) c.atk += 2;
      log(s, `Battle Frenzy: every ally on the field gains +2 ATK.`);
    } },
    'artemis:protector_of_women': { type: 'passive' },
    'athena:wisdom_of_war': { type: 'onPlay',
      steps: [allyCard('Wisdom of War: choose the ally that gains +2 ATK'), allyCard('Wisdom of War: choose the ally that gains +2 DEF')],
      run(s, src, T) {
        src.flags.wisdomAtk = T.t[0][0]; src.flags.wisdomDef = T.t[1][0];
        log(s, `Athena advises her allies: +2 ATK to ${nameOf(findField(s, T.t[0][0]))}, +2 DEF to ${nameOf(findField(s, T.t[1][0]))} while she is on the field.`);
      } },
    'atlas:unbearable_weight': { type: 'passive' },
    'atlas:the_fall_of_the_sky': { type: 'passive' },
    'bellerophon:hero_of_the_sky': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose a Monster to destroy', (s, c) => isCreature(c))],
      run(s, src, T) { const t = findField(s, T.t[0][0]); forceDie(t, src.ctrl); src.flags.weary = true; log(s, `Hero of the Sky: Bellerophon destroys ${nameOf(t)}. From now on he loses 1 DEF after each attack.`); } },
    'calypso:captive_love': { type: 'active', limit: 'game',
      steps: [{ from: 'field', side: 'any', count: 1, prompt: 'Choose a Human or Demigod to keep captive', filter: (s, c) => isHumanOrDemigod(c) }],
      run(s, src, T) { const t = findField(s, T.t[0][0]); addStatus(t, 'captive', s.turn + 13, 0, src.uid); log(s, `Captive Love: ${nameOf(t)} is trapped on Ogygia for 7 turns. It cannot attack or use abilities, but it cannot die.`); } },
    'charon:coin_for_passage': { type: 'active', limit: 'game', revives: true,
      steps: [allyCard('Choose one of your cards to sacrifice', (s, c, src) => c !== src),
              { from: 'grave', side: 'ally', count: 1, prompt: 'Choose a destroyed card with the same value (cost)', filter: (s, g, src, prev) => {
                const sac = findField(s, prev[0][0]); return sac && BY_ID[g.id].cost === card(sac).cost; } }],
      run(s, src, T) {
        const sac = findField(s, T.t[0][0]);
        if (reviveBlocked(s)) { log(s, `Cerberus guards the underworld: nothing can return.`); return; }
        forceDie(sac, src.ctrl);
        cleanup(s);
        const inst = reviveFromGrave(s, src.ctrl, src.ctrl, T.t[1][0]);
        if (!inst) return;
        // restoring its special effects: its once-per-game abilities can be used again
        const used = s.players[src.ctrl].usedGame;
        for (const ab of card(inst).abilities) delete used[abilityKey(inst, ab)];
        log(s, `Charon takes his coin: ${nameOf(inst)} crosses back from the Styx with its special effects restored.`);
      } },
    'circe:transformation_potion': { type: 'active', limit: 'game', uses: 2,
      steps: [enemyCard('Choose a Human to transform', (s, c, src) => isHuman(c) && !(src.flags.potionTargets || []).includes(c.uid))],
      run(s, src, T) {
        const t = findField(s, T.t[0][0]);
        (src.flags.potionTargets = src.flags.potionTargets || []).push(t.uid);
        stun(s, t, src, 'Transformation Potion');
      } },
    'circe:loves_weakness': { type: 'passive' },
    'cupid:bound_hearts': { type: 'active', limit: 'game',
      steps: [allyCard('Choose one of your cards'), enemyCard('Choose an enemy card')],
      run(s, src, T) {
        const a = findField(s, T.t[0][0]), b = findField(s, T.t[1][0]);
        const da = getDef(s, a), db = getDef(s, b);
        a.def += db; b.def += da;
        addStatus(a, 'bound', 9999, b.uid, src.uid); addStatus(b, 'bound', 9999, a.uid, src.uid);
        log(s, `Bound Hearts: ${nameOf(a)} and ${nameOf(b)} now share ${da + db} DEF. If one dies, both are destroyed.`);
      } },
    'demeter:call_of_the_mother': { type: 'passive' },
    'dionysus:bacchic_frenzy': { type: 'reaction', limit: 'game' },
    'eris:golden_apple_of_discord': { type: 'active', limit: 'game',
      steps: [{ from: 'field', side: 'enemy', count: 2, min: 2, prompt: 'Choose two enemy cards: the first attacks the second' }],
      run(s, src, T) {
        const a = findField(s, T.t[0][0]), b = findField(s, T.t[0][1]);
        log(s, `Golden Apple of Discord: ${nameOf(a)} attacks ${nameOf(b)}!`);
        fight(s, a, b, src.ctrl);
      } },
    'furies:curse_of_guilt': { type: 'passive' },
    'gaia:earths_endurance': { type: 'passive' },
    'hades:claim_the_dead': { type: 'passive' },
    'hecate:crossroads': { type: 'onPlay', optional: true,
      steps: [allyCard('Crossroads: choose one of your cards to exchange (or skip)', (s, c, src) => c !== src), enemyCard('Choose the enemy card to take')],
      run(s, src, T) {
        const a = findField(s, T.t[0][0]), b = findField(s, T.t[1][0]);
        removeFromField(s, a); removeFromField(s, b);
        const pa = a.ctrl; a.ctrl = b.ctrl; b.ctrl = pa;
        // both cards are ready for their new masters: they can attack and use abilities right away
        for (const c of [a, b]) { c.enteredTurn = Math.min(c.enteredTurn, s.turn - 2); c.attacksUsed = 0; c.usedTurn = {}; }
        s.players[a.ctrl].field.push(a); s.players[b.ctrl].field.push(b);
        log(s, `Crossroads: ${nameOf(a)} and ${nameOf(b)} change masters forever.`);
      } },
    'hephaestus:divine_forge': { type: 'active', limit: 'game',
      steps: [allyCard('Choose an ally to receive the armor')],
      run(s, src, T) { const t = findField(s, T.t[0][0]); t.def += 3; log(s, `Divine Forge: ${nameOf(t)} gains +3 DEF permanently.`); } },
    'hera:jealous_wrath': { type: 'active', limit: 'game',
      steps: [{ from: 'field', side: 'any', count: 1, prompt: 'Choose a woman card to turn into a beast', filter: (s, c, src) => isFemale(c) && c !== src }],
      run(s, src, T) {
        const t = findField(s, T.t[0][0]);
        t.atk = 1; t.def = 1; t.statuses = t.statuses.filter(st => st.kind !== 'tempAtk' && st.kind !== 'tempDef');
        log(s, `Jealous Wrath: Hera turns ${nameOf(t)} into a beast (1/1).`);
      } },
    'hermes:divine_speed': { type: 'passive' },
    'iris:divine_message': { type: 'onPlay', run(s, src) {
      const pl = s.players[src.ctrl];
      if (!pl.deck.length) { log(s, `Iris finds an empty deck.`); return; }
      s.pending = { kind: 'pick', player: src.ctrl, handler: 'deckToHand', reveal: true, title: 'Divine Message: choose any card from your deck', options: pl.deck.map((id, k) => ({ uid: 'd' + k, id })), min: 1, max: 1 };
    } },
    'kronos:devour_time': { type: 'active', limit: 'turn',
      steps: [{ from: 'field', side: 'ally', count: 3, min: 3, prompt: 'Choose three God cards to sacrifice', filter: (s, c, src) => c !== src && isDeity(c) }],
      run(s, src, T) {
        for (const uid of T.t[0]) forceDie(findField(s, uid), src.ctrl);
        for (const c of s.players[opp(src.ctrl)].field) if (c.id !== 'gaia') { c.flags.erased = true; forceDie(c, src.ctrl); }
        log(s, `Devour Time: Kronos erases every card on the opponent's field!`);
      } },
    'kronos:fall_of_the_titan': { type: 'passive' },
    'moirai:cut_the_thread': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose the enemy whose thread is cut')],
      run(s, src, T) { const t = findField(s, T.t[0][0]); forceDie(t, src.ctrl); log(s, `Cut the Thread: Atropos cuts ${nameOf(t)}'s thread.`); } },
    'moirai:measure_of_fate': { type: 'active', limit: 'turn',
      steps: [{ from: 'field', side: 'any', count: 1, prompt: 'Choose an ally (+3 DEF) or an enemy (-3 DEF)' }],
      run(s, src, T) {
        const t = findField(s, T.t[0][0]);
        if (t.ctrl === src.ctrl) { t.def += 3; log(s, `Measure of Fate: ${nameOf(t)} gains +3 DEF.`); }
        else { t.def -= 3; log(s, `Measure of Fate: ${nameOf(t)} loses 3 DEF.`); }
      } },
    'naiads:healing_spring': { type: 'onPlay',
      steps: [allyCard('Healing Spring: choose an ally to gain +3 DEF', (s, c, src) => c !== src)],
      run(s, src, T) { src.flags.springTarget = T.t[0][0]; log(s, `Healing Spring: ${nameOf(findField(s, T.t[0][0]))} gains +3 DEF while the Naiads are on the field.`); } },
    'persephone:seeds_of_return': { type: 'active', limit: 'game', revives: true,
      steps: [{ from: 'grave', side: 'ally', count: 1, prompt: 'Choose a defeated ally to revive' }],
      run(s, src, T) { const inst = reviveFromGrave(s, src.ctrl, src.ctrl, T.t[0][0], 'half'); if (inst) log(s, `Seeds of Return: ${nameOf(inst)} returns with half DEF.`); } },
    'poseidon:tidal_wrath': { type: 'active', limit: 'game', run(s, src) {
      for (const c of s.players[opp(src.ctrl)].field) addStatus(c, 'tempAtk', s.turn + 1, -3, src.uid);
      log(s, `Tidal Wrath: all enemy cards lose 3 ATK for 1 turn.`);
    } },
    'prometheus:gift_of_fire': { type: 'active', limit: 'turn', run(s, src) {
      s.players[src.ctrl].effects.push({ kind: 'humanCost1', from: s.turn + 2, until: s.turn + 2 });
      log(s, `Gift of Fire: all Human cards will cost 1 during your next turn.`);
    } },
    'rhea:mothers_protection': { type: 'passive' },
    'thetis:divine_protection': { type: 'active', limit: 'game',
      steps: [{ from: 'field', side: 'any', count: 1, prompt: 'Choose a Demigod card to protect', filter: (s, c) => isDemigod(c) }],
      run(s, src, T) { const t = findField(s, T.t[0][0]); addStatus(t, 'protect', s.turn + 1, 0, src.uid); log(s, `Divine Protection: ${nameOf(t)} is immune to damage for one turn.`); } },
    'uranus:castration': { type: 'passive' },
    'zeus:olympian_thunderbolt': { type: 'active', limit: 'game',
      steps: [enemyCard('Choose the enemy to strike')],
      run(s, src, T) { const t = findField(s, T.t[0][0]); forceDie(t, src.ctrl); log(s, `Olympian Thunderbolt strikes ${nameOf(t)}!`); } },
    'zeus:transformation': { type: 'reaction', limit: 'game' },
  };

  function abilityKey(i, ab) { return i.id + ':' + ab.id; }
  function abilityDef(key) { return ABILITIES[key]; }

  function reveal(s, viewer, until) { s.players[viewer].effects.push({ kind: 'reveal', until }); }

  // --- can an ability be activated right now?
  function usedCount(s, i, key, def) {
    if (def.limit === 'game') return s.players[i.ctrl].usedGame[key] || 0;
    if (def.limit === 'life') return i.usedLife[key] || 0;
    if (def.limit === 'turn') return i.usedTurn[key] || 0;
    return 0;
  }
  function markUsed(s, i, key, def) {
    const bump = o => { o[key] = (o[key] || 0) + 1; };
    if (def.limit === 'game') bump(s.players[i.ctrl].usedGame);
    else if (def.limit === 'life') bump(i.usedLife);
    if (def.limit === 'turn' || def.limit === undefined) bump(i.usedTurn);
  }
  function hasUsesLeft(s, i, key, def) {
    if (def.limit === 'game' && def.uses) return usedCount(s, i, key, def) < def.uses && !(i.usedTurn[key]);
    return usedCount(s, i, key, def) < 1;
  }
  function isReady(s, i) { return i.enteredTurn !== null && s.turn >= i.enteredTurn + 2; }
  // abilities work as soon as the card is on the field, unless the ability says otherwise
  function abilityReady(s, i, def) { return i.enteredTurn !== null && (!(def && def.needsTurn) || isReady(s, i)); }
  function silenced(s, i) { return hasStatus(i, 'stun') || hasStatus(i, 'captive') || ariadneBlocks(s, i); }

  // returns null if usable, otherwise a reason string
  function whyCannotUse(s, p, i, ab) {
    const key = abilityKey(i, ab);
    const def = ABILITIES[key];
    if (!def) return 'Not implemented';
    if (def.type !== 'active') return def.type === 'onPlay' ? 'Triggers when played' : def.type === 'reaction' ? 'Triggers during the opponent\'s attack' : 'Always active';
    if (s.phase !== 'play' || s.pending) return 'Not now';
    if (s.current !== p || i.ctrl !== p) return 'Only on your turn';
    if (!abilityReady(s, i, def)) return 'Needs one full turn on the field';
    if (silenced(s, i)) return 'This card cannot use abilities now';
    if (def.revives && reviveBlocked(s)) return 'Cerberus guards the underworld: no destroyed card can return';
    if (!hasUsesLeft(s, i, key, def)) return def.limit === 'game' ? 'Already used this game' : def.limit === 'life' ? 'Already used' : 'Already used this turn';
    if (def.can && !def.can(s, i)) return def.cant || 'Not possible right now';
    if (def.steps && !stepsPossible(s, i, def)) return 'No valid target for: ' + def.steps[0].prompt;
    // attack boosts that last only this turn: don't let them be wasted when the card cannot attack
    if (def.needsAttack) {
      if (whyCannotAttack(s, p, i)) return 'This card cannot attack this turn: keep the ability for later';
      if (!attackTargets(s, i).some(d => def.needsAttack(s, d))) return 'No enemy card this ability works against';
    }
    return null;
  }

  // ---- targeting (shared with UI)
  function candidates(s, src, step, prev) {
    if (step.from === 'field') {
      let list = [];
      if (step.side === 'ally' || step.side === 'any') list = list.concat(s.players[src.ctrl].field);
      if (step.side === 'enemy' || step.side === 'any') list = list.concat(s.players[opp(src.ctrl)].field);
      return list.filter(c => !shielded(s, c, src) && (!step.filter || step.filter(s, c, src, prev || [])));
    }
    if (step.from === 'grave') {
      let list = [];
      if (step.side === 'ally' || step.side === 'any') list = list.concat(s.players[src.ctrl].grave);
      if (step.side === 'enemy' || step.side === 'any') list = list.concat(s.players[opp(src.ctrl)].grave);
      return list.filter(g => !step.filter || step.filter(s, g, src, prev || []));
    }
    return [];
  }
  function stepsPossible(s, src, def) {
    const first = def.steps[0];
    return candidates(s, src, first, []).length >= (first.min || 1);
  }
  function validateTargets(s, src, def, T) {
    if (!def.steps) return;
    if (!T || !Array.isArray(T.t)) throw new Error('Missing targets');
    def.steps.forEach((step, k) => {
      const picked = T.t[k] || [];
      const min = step.min || step.count || 1;
      if (picked.length < min || picked.length > (step.count || 1)) throw new Error('Wrong number of targets');
      if (new Set(picked).size !== picked.length) throw new Error('Duplicate targets');
      const ok = candidates(s, src, step, T.t.slice(0, k)).map(c => c.uid);
      picked.forEach(u => { if (!ok.includes(u)) throw new Error('Invalid target'); });
    });
    if (def.choice && !(T.choice >= 0 && T.choice < def.choice.options.length)) throw new Error('Choose an option');
  }

  function recordAbility(s, i, key, def) {
    if (def.copy) return;
    const ab = card(i).abilities.find(a => key.endsWith(':' + a.id));
    s.lastAbility = { key, turn: s.turn, name: ab ? ab.name : key, by: i.ctrl };
  }

  // why an on-play ability would have no effect if the card were played now (null = it works)
  function whyNoOnPlay(s, p, cardId, abId) {
    const key = cardId + ':' + abId;
    const def = ABILITIES[key];
    if (!def || def.type !== 'onPlay') return null;
    if (def.limit === 'game' && s.players[p].usedGame[key]) return 'Already used this game: it will not trigger again';
    if (def.revives && reviveBlocked(s)) return 'Cerberus is in play: no destroyed card can return, so this ability has no effect';
    if (def.copy) {
      const last = s.lastAbility;
      return !last || s.turn - last.turn > 1 ? 'No ability was used in the last turn: there is nothing to repeat' : null;
    }
    const src = { uid: '__new', id: cardId, ctrl: p, owner: p, statuses: [], flags: {} };
    if (def.steps && candidates(s, src, def.steps[0], []).length < (def.steps[0].min || 1)) return 'No valid target right now: this ability will have no effect';
    return null;
  }

  // the spec a client should prompt for when playing a card (onPlay with steps / Echo copying)
  function onPlaySpec(s, p, cardId) {
    const c = BY_ID[cardId];
    for (const ab of c.abilities) {
      const key = cardId + ':' + ab.id;
      const def = ABILITIES[key];
      if (!def || def.type !== 'onPlay') continue;
      if (def.revives && reviveBlocked(s)) continue;
      if (def.copy) {
        const last = s.lastAbility;
        if (!last || s.turn - last.turn > 1) return null;
        const src = ABILITIES[last.key];
        return src.steps || src.choice ? { key, steps: src.steps, choice: src.choice, optional: true } : null;
      }
      if (def.steps || def.choice) return { key, steps: def.steps, choice: def.choice, optional: !!def.optional };
    }
    return null;
  }

  // ---------------------------------------------------------------- combat
  function maxAttacks(s, i) {
    if (i.id === 'hermes' && passiveOn(s, i)) return 2;
    if (i.id === 'cerberus' && passiveOn(s, i)) return 3;
    return 1;
  }

  function whyCannotAttack(s, p, i) {
    if (s.phase !== 'play' || s.pending) return 'Not now';
    if (s.current !== p || i.ctrl !== p) return 'Only on your turn';
    if (i.id === 'atlas') return 'Atlas is forever holding the sky';
    if (playerEffect(s, p, 'noAttack')) return 'Charmed: you skip this attack turn';
    if (hasStatus(i, 'stun') || hasStatus(i, 'captive')) return 'This card cannot attack now';
    if (hasStatus(i, 'noattack') || hasStatus(i, 'exhausted')) return 'This card cannot attack this turn';
    if (hasStatus(i, 'riddle')) return 'Answer the Sphinx\'s riddle first';
    if (i.id === 'hector' && onField(s, p, 'andromache').some(a => a.flags.warning === i.uid)) return 'Andromache keeps Hector from battle';
    const haste = i.flags.hasteTurn === s.turn || (i.id === 'polyphemus' && passiveOn(s, i)) || i.flags.swiftTurn === s.turn;
    if (!haste && !isReady(s, i)) return 'Cards cannot attack on the turn they are played';
    if (i.attacksUsed >= maxAttacks(s, i)) return 'No attacks left this turn';
    return null;
  }

  function attackTargets(s, i) {
    const enemy = s.players[opp(i.ctrl)].field;
    let list = enemy.slice();
    // Menelaus must attack Paris first
    if (i.id === 'menelaus' && list.some(c => c.id === 'paris')) list = list.filter(c => c.id === 'paris');
    // Telemachus protects female Humans
    if (enemy.some(c => c.id === 'telemachus' && passiveOn(s, c))) list = list.filter(c => !(isHuman(c) && isFemale(c)));
    return list;
  }

  function canAttackPlayer(s, i) { return s.players[opp(i.ctrl)].field.length === 0; }

  // the ATK a card strikes with (Cerberus, Triple Bite: each of his strikes deals half damage)
  function strikeAtk(s, A) {
    const atk = getAtk(s, A);
    return A.id === 'cerberus' && passiveOn(s, A) ? Math.ceil(atk / 2) : atk;
  }
  function attackDamage(s, A, D) {
    let dmg = strikeAtk(s, A);
    if (A.id === 'theseus' && isCreature(D)) dmg += 1;
    if (A.id === 'minotaur' && passiveOn(s, A)) dmg += 2;
    if (A.id === 'achilles' && A.flags.rageTurn === s.turn && isHumanOrDemigod(D)) dmg += 3;
    if (A.id === 'icarus' && A.flags.waxTurn === s.turn) dmg *= 2;
    if (A.id === 'diomedes' && A.flags.godslayerTurn === s.turn && isDeity(D)) dmg += Math.floor(Math.max(0, getDef(s, D)) / 2);
    return dmg;
  }
  function counterDamage(s, D, A) {
    let dmg = getAtk(s, D);
    if (D.id === 'theseus' && isCreature(A)) dmg += 3;
    return dmg;
  }

  function afterAttack(s, A) {
    if (!findField(s, A.uid)) return;
    if (A.id === 'minotaur' && passiveOn(s, A)) { A.def -= 1; setCause(A, 'the Minotaur tires after attacking (-1 DEF)'); }
    if (A.flags.weary) { A.def -= 1; setCause(A, 'Bellerophon tires after attacking (-1 DEF)'); }
    if (A.flags.swiftTurn === s.turn) addStatus(A, 'exhausted', s.turn + 2, 0, A.uid);
    if (A.id === 'icarus' && A.flags.waxTurn === s.turn) {
      A.flags.waxTurn = null;
      if (!onField(s, A.ctrl, 'daedalus').length) { forceDie(A, A.ctrl); setCause(A, 'the sun melted his wax wings', true); log(s, `The sun melts Icarus' wings.`); }
    }
    if (A.id === 'diomedes') A.flags.godslayerTurn = null;
  }

  // a single fight: A attacks D
  function fight(s, A, D, actor) {
    if (A.id === 'kronos' && D.id === 'uranus') {
      forceDie(D, A.ctrl); setCause(D, 'overthrown by Kronos', true); A.atk += 2;
      fx(s, { k: 'fight', a: A.uid, aId: A.id, aP: A.ctrl, d: D.uid, dId: D.id, dP: D.ctrl, atkA: getAtk(s, A), atkD: getAtk(s, D), toD: 0, toA: 0, note: 'Kronos overthrows Uranus' });
      log(s, `Kronos overthrows Uranus! Uranus is destroyed and Kronos gains +2 ATK permanently.`);
      return;
    }
    let toD = attackDamage(s, A, D);
    const toA = counterDamage(s, D, A);
    if (D.id === 'daphne' && (isDeity(A) || isDemigod(A)) && passiveOn(s, D) && !s.players[D.ctrl].usedGame['daphne:flight']) {
      s.players[D.ctrl].usedGame['daphne:flight'] = 1;
      toD = 0;
      log(s, `Daphne escapes ${nameOf(A)}: the attack does no damage (Flight).`);
    }
    log(s, `${nameOf(A)} (${strikeAtk(s, A)}) attacks ${nameOf(D)} (${getAtk(s, D)}): deals ${toD}, takes ${toA}.`);
    const atkA = strikeAtk(s, A), atkD = getAtk(s, D);
    const defD = getDef(s, D), defA = getDef(s, A);
    const was = CAUSE;
    CAUSE = `after the attack of ${nameOf(A)} (${toD} damage)`;
    const gotD = dealDamage(s, D, toD, A.ctrl, true);
    CAUSE = `after ${nameOf(D)} hit back (${toA} damage)`;
    const gotA = dealDamage(s, A, toA, D.ctrl, true);
    CAUSE = was;
    fx(s, { k: 'fight', a: A.uid, aId: A.id, aP: A.ctrl, d: D.uid, dId: D.id, dP: D.ctrl, atkA, atkD,
      toD: gotD, toA: gotA, defD: [defD, getDef(s, D)], defA: [defA, getDef(s, A)] });
    if (A.id === 'oedipus' && getDef(s, D) <= 0 && !cannotDie(s, D)) {
      log(s, `Blind Insight: truth comes at a cost, ${s.players[D.ctrl].name} draws a card.`);
      draw(s, D.ctrl, 1);
    }
  }

  // reaction options for the defending player
  function reactionOptions(s, A, D) {
    const p = D.ctrl;
    const pl = s.players[p];
    const ready = i => abilityReady(s, i) && !silenced(s, i);
    const opts = [];
    if (D.id === 'zeus' && !pl.usedGame['zeus:transformation'] && !silenced(s, D))
      opts.push({ key: 'zeus:transformation', src: D.uid, label: 'Zeus — Transformation: dodge this attack' });
    const incoming = attackDamage(s, A, D);
    for (const ap of onField(s, p, 'apollo').filter(ready))
      if (!pl.usedGame['apollo:healing_light'] && incoming >= getDef(s, D)) { opts.push({ key: 'apollo:healing_light', src: ap.uid, label: `Apollo — Healing Light: +3 DEF to ${nameOf(D)}` }); break; }
    for (const pa of onField(s, p, 'pandora').filter(ready))
      if (!pl.usedGame['pandora:hope_within']) { opts.push({ key: 'pandora:hope_within', src: pa.uid, label: `Pandora — Hope Within: +2 DEF to ${nameOf(D)}` }); break; }
    for (const pt of onField(s, p, 'patroclus').filter(ready))
      if (pt !== D && !pt.usedTurn['patroclus:borrowed_armor']) { opts.push({ key: 'patroclus:borrowed_armor', src: pt.uid, label: `Patroclus — Borrowed Armor: take the attack instead of ${nameOf(D)}` }); break; }
    for (const pe of onField(s, p, 'penelope').filter(ready))
      if (!pl.usedGame['penelope:endless_weaving'] && isHumanOrDemigod(D)) { opts.push({ key: 'penelope:endless_weaving', src: pe.uid, label: `Penelope — Endless Weaving: delay this attack` }); break; }
    for (const di of onField(s, p, 'dionysus').filter(ready))
      if (!pl.usedGame['dionysus:bacchic_frenzy']) { opts.push({ key: 'dionysus:bacchic_frenzy', src: di.uid, label: `Dionysus — Bacchic Frenzy: ${nameOf(A)} attacks the weakest card on its own field` }); break; }
    return opts;
  }

  function resolveAttack(s, A, D, reaction) {
    const p = D.ctrl;
    if (reaction) {
      const pl = s.players[p];
      const src = findField(s, reaction.src);
      const k = reaction.key;
      if (k === 'patroclus:borrowed_armor') src.usedTurn[k] = 1; else pl.usedGame[k] = 1;
      if (k === 'zeus:transformation') { log(s, `Zeus transforms and dodges the attack!`); afterAttack(s, A); return; }
      if (k === 'penelope:endless_weaving') { log(s, `Penelope weaves and unweaves: the attack on ${nameOf(D)} is delayed.`); return; }
      if (k === 'apollo:healing_light') { D.def += 3; log(s, `Healing Light: ${nameOf(D)} gains +3 DEF.`); }
      if (k === 'pandora:hope_within') { D.def += 2; log(s, `Hope Within: ${nameOf(D)} gains +2 DEF.`); }
      if (k === 'patroclus:borrowed_armor') { log(s, `Patroclus steps in front of ${nameOf(D)}!`); D = src; }
      if (k === 'dionysus:bacchic_frenzy') {
        const own = s.players[A.ctrl].field.filter(c => c !== A);
        if (!own.length) { log(s, `Bacchic Frenzy: ${nameOf(A)} is lost in madness and does not attack.`); afterAttack(s, A); return; }
        const weakest = own.slice().sort((x, y) => getDef(s, x) - getDef(s, y) || getAtk(s, x) - getAtk(s, y))[0];
        log(s, `Bacchic Frenzy: ${nameOf(A)} turns on ${nameOf(weakest)}!`);
        D = weakest;
      }
    }
    fight(s, A, D, A.ctrl);
    afterAttack(s, A);
  }

  // ---------------------------------------------------------------- game setup
  function newGame(names) {
    const s = {
      v: 1, nextUid: 1, turn: 0, current: 0, first: Math.random() < 0.5 ? 0 : 1,
      phase: 'mulligan', pending: null, winner: null, lastAbility: null, log: [], fx: [], fxSeq: 0,
      players: names.map(n => ({ name: n, life: CONFIG.LIFE, coins: 0, deck: [], hand: [], field: [], grave: [], effects: [], usedGame: {}, mulliganDone: false })),
    };
    s.players.forEach((pl, p) => {
      pl.deck = shuffle(CARDS.map(c => c.id)).slice(0, CONFIG.DECK_SIZE);
      for (let k = 0; k < CONFIG.START_HAND; k++) pl.hand.push(makeInst(s, pl.deck.pop(), p));
    });
    log(s, `New game: ${names[0]} vs ${names[1]}. Each player may redraw once.`);
    return s;
  }

  // coins a player receives at the start of the given turn number
  function coinsForTurn(turn) {
    return Math.min(Math.ceil(turn / 2) + CONFIG.COIN_BONUS, CONFIG.MAX_COINS);
  }

  function startTurn(s) {
    const p = s.current;
    const pl = s.players[p];
    pl.coins = coinsForTurn(s.turn);
    log(s, `— Turn ${s.turn}: ${pl.name} (${pl.coins} coin${pl.coins === 1 ? '' : 's'}) —`);
    if (!pl.deck.length && !pl.hand.length && !pl.field.length) {
      pl.life = 0; log(s, `${pl.name} has no cards left.`); checkWin(s); return;
    }
    draw(s, p, 1);
    for (const c of pl.field) {
      // Circe, Love's Weakness
      if (c.id === 'circe' && anyOnField(s, 'odysseus').length) { c.def -= 1; setCause(c, 'Circe weakens before Odysseus (-1 DEF each turn)'); log(s, `Circe's magic weakens before true love: -1 DEF.`); }
      // Echo fades after using her voice
      if (c.id === 'echo' && c.flags.fading) { c.def -= 1; setCause(c, 'Echo\'s voice fades (-1 DEF each turn)'); log(s, `Echo's voice fades: -1 DEF.`); }
    }
    cleanup(s);
  }

  function endTurn(s) {
    const t = s.turn;
    for (const c of allField(s)) {
      if (c.flags.dieAtEnd && c.ctrl === s.current) { forceDie(c, c.ctrl); setCause(c, 'Midas cannot eat or drink gold', true); log(s, `Midas cannot eat or drink gold, and dies.`); }
      if (c.statuses.some(st => st.kind === 'temporary' && st.until <= t)) { forceDie(c, c.ctrl); setCause(c, 'its borrowed time ran out: it returns to the underworld', true); log(s, `${nameOf(c)} returns to the underworld.`); }
    }
    cleanup(s);
    if (s.phase === 'over') return;
    for (const c of allField(s)) {
      c.statuses = c.statuses.filter(st => st.until > t || st.kind === 'temporary');
      c.usedTurn = {};
      c.attacksUsed = 0;
    }
    for (const pl of s.players) {
      pl.effects = pl.effects.filter(e => e.until > t);
      for (const h of pl.hand) h.statuses = h.statuses.filter(st => st.until > t);
    }
    cleanup(s);
    s.turn += 1;
    s.current = opp(s.current);
    startTurn(s);
  }

  // ---------------------------------------------------------------- actions
  const PICK_HANDLERS = {
    cassandra(s, pend, chosen) {
      const o = s.players[opp(pend.player)];
      const c = o.hand.find(h => h.uid === chosen[0]);
      addStatus(c, 'blocked', s.turn + 1);
      log(s, `Prophecy Ignored: one card in ${o.name}'s hand cannot be played next turn.`);
    },
    deckToHand(s, pend, chosen) {
      const pl = s.players[pend.player];
      const ids = chosen.map(u => pl.deck[Number(u.slice(1))]);
      const idx = chosen.map(u => Number(u.slice(1))).sort((a, b) => b - a);
      idx.forEach(k => pl.deck.splice(k, 1));
      ids.forEach(id => addToHand(s, pend.player, id));
      shuffle(pl.deck);
      log(s, pend.reveal ? `${pl.name} adds ${ids.map(id => BY_ID[id].name).join(', ')} to their hand and shuffles the deck.` : `${pl.name} adds ${ids.length} card(s) to their hand and shuffles the deck.`);
    },
    echidnaSummon(s, pend, chosen) {
      if (!chosen.length) { log(s, `Spawn of Terror: ${s.players[pend.player].name} summons no monster.`); return; }
      if (!chosen[0].startsWith('g:')) return PICK_HANDLERS.deckToHand(s, pend, chosen);
      const pl = s.players[pend.player];
      const k = pl.grave.findIndex(g => g.uid === chosen[0].slice(2));
      if (k < 0) return;
      const [g] = pl.grave.splice(k, 1);
      if (addToHand(s, pend.player, g.id)) log(s, `Spawn of Terror: ${pl.name} calls ${BY_ID[g.id].name} back from the discard pile to their hand.`);
    },
  };

  function applyAction(s, p, a) {
    if (s.phase === 'over') throw new Error('The game is over');
    const pl = s.players[p];
    ACT += 1;
    CAUSE = '';

    if (a.type === 'mulligan') {
      if (s.phase !== 'mulligan' || pl.mulliganDone) throw new Error('Not now');
      const back = pl.hand.filter(h => (a.uids || []).includes(h.uid));
      pl.hand = pl.hand.filter(h => !back.includes(h));
      back.forEach(h => pl.deck.push(h.id));
      shuffle(pl.deck);
      for (let k = 0; k < back.length; k++) pl.hand.push(makeInst(s, pl.deck.pop(), p));
      pl.mulliganDone = true;
      log(s, back.length ? `${pl.name} redraws ${back.length} card(s).` : `${pl.name} keeps their hand.`, p);
      if (s.players.every(x => x.mulliganDone)) {
        s.phase = 'play'; s.turn = 1; s.current = s.first;
        log(s, `${s.players[s.first].name} goes first.`, s.first);
        startTurn(s);
      }
      return;
    }

    if (a.type === 'pick') {
      const pend = s.pending;
      if (!pend || pend.kind !== 'pick' || pend.player !== p) throw new Error('Nothing to choose');
      const chosen = (a.uids || []).filter(u => pend.options.some(o => o.uid === u));
      if (chosen.length < pend.min || chosen.length > pend.max) throw new Error(`Choose ${pend.min === pend.max ? pend.min : pend.min + '-' + pend.max} card(s)`);
      s.pending = null;
      PICK_HANDLERS[pend.handler](s, pend, chosen);
      cleanup(s);
      return;
    }

    if (a.type === 'react') {
      const pend = s.pending;
      if (!pend || pend.kind !== 'reaction' || pend.player !== p) throw new Error('Nothing to react to');
      s.pending = null;
      const A = findField(s, pend.attacker), D = findField(s, pend.target);
      const opt = a.index >= 0 ? pend.options[a.index] : null;
      if (A && D) resolveAttack(s, A, D, opt);
      cleanup(s);
      return;
    }

    if (s.phase !== 'play') throw new Error('The game has not started');
    if (s.pending) throw new Error('Waiting for a choice');
    if (s.current !== p) throw new Error('It is not your turn');

    if (a.type === 'end') { log(s, `${pl.name} ends the turn.`); endTurn(s); return; }

    if (a.type === 'play') {
      const inst = pl.hand.find(h => h.uid === a.uid);
      if (!inst) throw new Error('Card not in hand');
      const c = BY_ID[inst.id];
      if (hasStatus(inst, 'blocked')) throw new Error('Cassandra\'s prophecy: this card cannot be played this turn');
      const cost = costOf(s, p, c);
      if (pl.coins < cost) throw new Error(`Not enough coins (${cost} needed)`);
      const spec = onPlaySpec(s, p, inst.id);
      const T = a.T || null;
      if (spec && T && !T.skip) validateTargets(s, Object.assign({}, inst, { ctrl: p }), { steps: spec.steps, choice: spec.choice }, T);
      if (spec && !spec.optional && !(T && !T.skip) && spec.steps && stepsPossible(s, Object.assign({}, inst, { ctrl: p }), spec)) throw new Error('Choose the targets');
      pl.coins -= cost;
      pl.hand.splice(pl.hand.indexOf(inst), 1);
      inst.statuses = [];
      enterField(s, p, inst);
      if (inst.id === 'atalanta') { inst.flags.swiftTurn = s.turn; log(s, `Swift Arrow: Atalanta can attack right away.`); }
      if (inst.id === 'polyphemus') log(s, `Crushing Strength: Polyphemus can attack when played.`);
      // Medusa, Perseus' Mirror
      if (inst.id === 'perseus') {
        for (const m of onField(s, opp(p), 'medusa').filter(m => passiveOn(s, m))) {
          removeFromField(s, m);
          addToHand(s, p, 'medusa', `Perseus' Mirror: Medusa passes into ${pl.name}'s hand.`);
        }
      }
      // on-play abilities
      for (const ab of c.abilities) {
        const key = inst.id + ':' + ab.id;
        const def = ABILITIES[key];
        if (!def || def.type !== 'onPlay') continue;
        if (def.limit === 'game' && pl.usedGame[key]) continue;
        if (def.revives && reviveBlocked(s)) { log(s, `Cerberus guards the underworld: ${ab.name} has no effect.`); continue; }
        const needs = (spec && spec.key === key);
        if (needs && (!T || T.skip)) continue;
        if (!needs && def.steps) continue;
        if (def.limit === 'game') pl.usedGame[key] = 1;
        CAUSE = `${nameOf(inst)}'s ${ab.name}`;
        def.run(s, inst, T || {});
        recordAbility(s, inst, key, def);
        if (s.pending) break;
      }
      // Echidna, Spawn of Terror: offered right away when she enters the field (counts as this turn's use)
      if (inst.id === 'echidna' && !s.pending) {
        const ab = c.abilities.find(x => x.id === 'spawn_of_terror');
        if (!whyCannotUse(s, p, inst, ab)) {
          const key = abilityKey(inst, ab), def = ABILITIES[key];
          markUsed(s, inst, key, def);
          def.run(s, inst, {});
          recordAbility(s, inst, key, def);
        }
      }
      cleanup(s);
      return;
    }

    if (a.type === 'ability') {
      const inst = pl.field.find(i => i.uid === a.uid);
      if (!inst) throw new Error('Card not on your field');
      const ab = card(inst).abilities.find(x => x.id === a.ability);
      if (!ab) throw new Error('Unknown ability');
      const why = whyCannotUse(s, p, inst, ab);
      if (why) throw new Error(why);
      const key = abilityKey(inst, ab);
      const def = ABILITIES[key];
      validateTargets(s, inst, def, a.T);
      markUsed(s, inst, key, def);
      log(s, `${pl.name} uses ${nameOf(inst)}: ${ab.name}.`);
      CAUSE = `${nameOf(inst)}'s ${ab.name}`;
      def.run(s, inst, a.T || {});
      recordAbility(s, inst, key, def);
      cleanup(s);
      return;
    }

    if (a.type === 'attack') {
      const A = pl.field.find(i => i.uid === a.uid);
      if (!A) throw new Error('Card not on your field');
      const why = whyCannotAttack(s, p, A);
      if (why) throw new Error(why);
      if (a.target === 'player') {
        if (!canAttackPlayer(s, A)) throw new Error('You can attack the player only when their field is empty');
        A.attacksUsed += 1;
        const dmg = strikeAtk(s, A);
        s.players[opp(p)].life -= dmg;
        log(s, `${nameOf(A)} attacks ${s.players[opp(p)].name} directly: ${dmg} damage.`);
        fx(s, { k: 'direct', a: A.uid, aId: A.id, aP: p, p: opp(p), dmg });
        afterAttack(s, A);
        cleanup(s);
        return;
      }
      if (A.id === 'sisyphus' && passiveOn(s, A)) {
        A.attacksUsed += 1;
        log(s, `Endless Effort: Sisyphus attacks every card on the enemy field.`);
        CAUSE = `hit by Sisyphus' Endless Effort (${getAtk(s, A)} damage)`;
        const hit = s.players[opp(p)].field.slice();
        fx(s, { k: 'sweep', a: A.uid, aId: A.id, aP: p, targets: hit.map(D => D.uid), dmg: getAtk(s, A) });
        for (const D of hit) dealDamage(s, D, getAtk(s, A), p, true);
        afterAttack(s, A);
        cleanup(s);
        return;
      }
      const D = attackTargets(s, A).find(i => i.uid === a.target);
      if (!D) throw new Error('Invalid attack target');
      A.attacksUsed += 1;
      const opts = (A.id === 'kronos' && D.id === 'uranus') ? [] : reactionOptions(s, A, D);
      if (opts.length) {
        s.pending = { kind: 'reaction', player: D.ctrl, attacker: A.uid, target: D.uid, options: opts };
        log(s, `${nameOf(A)} declares an attack on ${nameOf(D)}…`);
        return;
      }
      resolveAttack(s, A, D, null);
      cleanup(s);
      return;
    }

    if (a.type === 'riddle') {
      const R = pl.field.find(i => i.uid === a.uid && hasStatus(i, 'riddle'));
      const X = pl.field.find(i => i.uid === a.discard);
      if (!R || !X) throw new Error('Choose a card to discard');
      R.statuses = R.statuses.filter(st => st.kind !== 'riddle');
      CAUSE = 'discarded to answer the Sphinx\'s riddle';
      forceDie(X, p);
      log(s, `${pl.name} answers the Sphinx's riddle by discarding ${nameOf(X)}.`);
      cleanup(s);
      return;
    }

    if (a.type === 'gaia') {
      const G = s.players[opp(p)].field.find(i => i.uid === a.gaia && i.id === 'gaia');
      if (!G) throw new Error('Gaia is not on the enemy field');
      // the 3 cards can come from the field (current ATK) or the hand (printed ATK)
      const onField = (a.uids || []).map(u => pl.field.find(i => i.uid === u)).filter(Boolean);
      const inHand = (a.uids || []).map(u => pl.hand.find(i => i.uid === u)).filter(Boolean);
      if (onField.length + inHand.length !== 3 || new Set(a.uids).size !== 3) throw new Error('Choose exactly 3 of your cards');
      const sum = onField.reduce((t, i) => t + getAtk(s, i), 0) + inHand.reduce((t, i) => t + BY_ID[i.id].atk, 0);
      if (sum < 9) throw new Error(`Their ATK sum is ${sum}: it must be 9 or more`);
      CAUSE = 'sacrificed to destroy Gaia';
      onField.forEach(i => forceDie(i, p));
      inHand.forEach(i => { pl.hand.splice(pl.hand.indexOf(i), 1); pl.grave.push({ uid: i.uid, id: i.id }); });
      CAUSE = `destroyed by the sacrifice of three cards (ATK ${sum})`;
      forceDie(G, p);
      log(s, `${pl.name} sacrifices three cards (ATK ${sum}) to break the Earth: Gaia is destroyed.`);
      cleanup(s);
      return;
    }

    throw new Error('Unknown action');
  }

  // which player must act now (for hot-seat mode)
  function actingPlayer(s) {
    if (s.phase === 'mulligan') return s.players[0].mulliganDone ? 1 : 0;
    if (s.pending) return s.pending.player;
    return s.current;
  }

  // ---------------------------------------------------------------- per-player view (hides secret info)
  function viewFor(s, viewer) {
    const v = JSON.parse(JSON.stringify(s));
    v.viewer = viewer;
    v.players.forEach((pl, p) => {
      pl.deckCount = pl.deck.length;
      delete pl.deck;
      const canSee = p === viewer || s.players[viewer].effects.some(e => e.kind === 'reveal' && e.until >= s.turn);
      if (!canSee) pl.hand = pl.hand.map(h => ({ uid: h.uid, hidden: true }));
    });
    if (v.pending && v.pending.kind === 'pick' && v.pending.player !== viewer) v.pending.options = [];
    return v;
  }

  global.Engine = {
    CONFIG, BY_ID, ABILITIES, coinsForTurn, newGame, applyAction, viewFor, actingPlayer,
    getAtk, getDef, costOf, whyCannotUse, whyCannotAttack, attackTargets, canAttackPlayer,
    candidates, onPlaySpec, whyNoOnPlay, abilityKey, isReady, findField, hasStatus, cannotDie, playerEffect, opp,
  };
})(typeof window !== 'undefined' ? window : globalThis);
