// Game Configuration
const GAME_CONFIG = {
  INITIAL_HAND_SIZE: 5,
  MAX_HAND_SIZE: 7,
  MAX_COINS: 10,
  CARDS_PER_TURN: 1,
};


const CARD_DATABASE = GREEK_MYTHOLOGY_CARDS;


// FIX PATH IMMAGINI per GitHub Pages
CARD_DATABASE.forEach(card => {
  if (card.imageUrl?.startsWith('/img/')) {
    card.imageUrl = `/PagesofFate-Arena${card.imageUrl}`;
  }
});

// Game State
let gameState = {
  matchCode: '',
  playerId: 'player_' + Date.now(),
  players: [],
  currentPlayerIndex: 0,
  turnNumber: 1,
  phase: 'lobby',
  attackMode: null,
  abilityMode: null,
};

cards.forEach(card => {
  if (card.imageUrl?.startsWith('/img/')) {
    card.imageUrl = `/PagesofFate-Arena${card.imageUrl}`;
  }
});


// Game Functions
function shuffleDeck(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((card, index) => ({
    ...JSON.parse(JSON.stringify(card)),
    instanceId: `${card.id}_${Date.now()}_${index}`,
    turnsOnField: 0,
    tokens: [],
  }));
}

function createGame() {
  const playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Please enter your name');
    return;
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  gameState.matchCode = code;

  const deck = shuffleDeck([...CARD_DATABASE]);
  const hand = deck.splice(0, GAME_CONFIG.INITIAL_HAND_SIZE);

  gameState.players.push({
    id: gameState.playerId,
    name: playerName,
    deck,
    hand,
    field: [],
    coins: 0,
    hasRedrawn: false,
    usedOncePerGameAbilities: [],
  });

  document.getElementById('noMatchSection').style.display = 'none';
  document.getElementById('waitingSection').style.display = 'block';
  document.getElementById('displayMatchCode').textContent = code;
  updatePlayersList();
}

function joinGame() {
  const playerName = document.getElementById('playerName').value.trim();
  const matchCode = document.getElementById('matchCodeInput').value.trim().toUpperCase();
  
  if (!playerName || !matchCode) {
    alert('Please enter your name and match code');
    return;
  }

  gameState.matchCode = matchCode;

  const deck = shuffleDeck([...CARD_DATABASE, ...CARD_DATABASE, ...CARD_DATABASE]);
  const hand = deck.splice(0, GAME_CONFIG.INITIAL_HAND_SIZE);

  gameState.players.push({
    id: gameState.playerId,
    name: playerName,
    deck,
    hand,
    field: [],
    coins: 0,
    hasRedrawn: false,
    usedOncePerGameAbilities: [],
  });

  document.getElementById('noMatchSection').style.display = 'none';
  document.getElementById('waitingSection').style.display = 'block';
  document.getElementById('displayMatchCode').textContent = matchCode;
  
  // Simulate opponent joining
  setTimeout(() => {
    const opponentDeck = shuffleDeck([...CARD_DATABASE, ...CARD_DATABASE, ...CARD_DATABASE]);
    const opponentHand = opponentDeck.splice(0, GAME_CONFIG.INITIAL_HAND_SIZE);

    gameState.players.push({
      id: 'opponent_' + Date.now(),
      name: 'Opponent',
      deck: opponentDeck,
      hand: opponentHand,
      field: [],
      coins: 0,
      hasRedrawn: false,
      usedOncePerGameAbilities: [],
    });

    updatePlayersList();
    document.getElementById('startGameBtn').style.display = 'block';
  }, 1000);
}

function updatePlayersList() {
  const list = document.getElementById('playersList');
  document.getElementById('playerCount').textContent = gameState.players.length;
  list.innerHTML = gameState.players.map(p => `<p>👤 ${p.name}</p>`).join('');

  if (gameState.players.length === 2) {
    document.getElementById('startGameBtn').style.display = 'block';
  }
}

function startGame() {
  gameState.phase = 'redraw';
  showScreen('redrawScreen');
  renderRedrawScreen();
}

function renderRedrawScreen() {
  const myPlayer = getMyPlayer();
  const container = document.getElementById('redrawHand');
  container.innerHTML = '';
  
  myPlayer.hand.forEach(card => {
    container.appendChild(createCardElement(card, 'hand', () => showCardDetail(card)));
  });
}

function redrawHand() {
  const myPlayer = getMyPlayer();
  myPlayer.deck.push(...myPlayer.hand);
  myPlayer.deck = shuffleDeck(myPlayer.deck);
  myPlayer.hand = myPlayer.deck.splice(0, GAME_CONFIG.INITIAL_HAND_SIZE);
  myPlayer.hasRedrawn = true;

  renderRedrawScreen();
  checkRedrawComplete();
}

function skipRedraw() {
  const myPlayer = getMyPlayer();
  myPlayer.hasRedrawn = true;
  checkRedrawComplete();
}

function checkRedrawComplete() {
  const myPlayer = getMyPlayer();
  if (myPlayer.hasRedrawn) {
    document.getElementById('redrawActions').style.display = 'none';
    document.getElementById('waitingForOpponent').style.display = 'block';

    // Simulate opponent finishing
    setTimeout(() => {
      gameState.players.forEach(p => p.hasRedrawn = true);
      gameState.phase = 'play';
      startTurn();
      showScreen('gameScreen');
      renderGame();
    }, 1500);
  }
}

function startTurn() {
  const player = getCurrentPlayer();
  player.coins = Math.min(gameState.turnNumber, GAME_CONFIG.MAX_COINS);
  
  if (player.hand.length < GAME_CONFIG.MAX_HAND_SIZE && player.deck.length > 0) {
    player.hand.push(player.deck.shift());
  }

  player.field.forEach(card => {
    card.turnsOnField++;
    card.tokens = card.tokens.map(token => ({
      ...token,
      turnsRemaining: token.turnsRemaining - 1,
    })).filter(token => token.turnsRemaining > 0);
  });
}

function endTurn() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  if (gameState.currentPlayerIndex === 0) {
    gameState.turnNumber++;
  }
  gameState.attackMode = null;
  gameState.abilityMode = null;
  startTurn();
  renderGame();
}

function playCard(cardInstanceId) {
  const myPlayer = getMyPlayer();
  if (!isMyTurn()) return;

  const cardIndex = myPlayer.hand.findIndex(c => c.instanceId === cardInstanceId);
  if (cardIndex === -1) return;

  const card = myPlayer.hand[cardIndex];
  if (card.cost > myPlayer.coins) return;

  myPlayer.coins -= card.cost;
  myPlayer.hand.splice(cardIndex, 1);
  card.turnsOnField = 0;
  myPlayer.field.push(card);
  renderGame();
}

function initiateAttack(attackerInstanceId) {
  gameState.attackMode = attackerInstanceId;
  gameState.abilityMode = null;
  renderGame();
}

function executeAttack(defenderInstanceId) {
  const attacker = findCardOnField(gameState.attackMode);
  const defender = findCardOnField(defenderInstanceId);

  if (!attacker || !defender) return;
  if (isImmobilized(attacker.card)) return;

  const attackerATK = getEffectiveATK(attacker.card);
  const defenderATK = getEffectiveATK(defender.card);

  attacker.card.def -= defenderATK;
  defender.card.def -= attackerATK;

  if (attacker.card.def <= 0) {
    attacker.player.field = attacker.player.field.filter(c => c.instanceId !== gameState.attackMode);
  }
  if (defender.card.def <= 0) {
    defender.player.field = defender.player.field.filter(c => c.instanceId !== defenderInstanceId);
  }

  gameState.attackMode = null;
  renderGame();
}

function initiateAbility(cardInstanceId, ability) {
  gameState.abilityMode = { cardInstanceId, ability };
  gameState.attackMode = null;
  renderGame();
}

function executeAbility(targetInstanceId = null) {
  const source = findCardOnField(gameState.abilityMode.cardInstanceId);
  if (!source) return;

  const ability = gameState.abilityMode.ability;
  if (ability.requiresTurnOnField && source.card.turnsOnField < 1) return;
  if (ability.oncePerGame && source.player.usedOncePerGameAbilities.includes(ability.id)) return;
  if (isImmobilized(source.card)) return;

  const targets = resolveTargets(ability.targetType, source, targetInstanceId);
  if (!targets) return;

  applyAbilityEffect(ability.effect, targets);

  if (ability.oncePerGame) {
    source.player.usedOncePerGameAbilities.push(ability.id);
  }

  gameState.abilityMode = null;
  renderGame();
}

function resolveTargets(targetType, source, targetInstanceId) {
  switch (targetType) {
    case ABILITY_TARGET_TYPES.SELF:
      return [source.card];
    case ABILITY_TARGET_TYPES.SINGLE_ALLY:
      if (!targetInstanceId) return null;
      const ally = source.player.field.find(c => c.instanceId === targetInstanceId);
      return ally ? [ally] : null;
    case ABILITY_TARGET_TYPES.ALL_ALLIES:
      return source.player.field;
    case ABILITY_TARGET_TYPES.SINGLE_ENEMY:
      if (!targetInstanceId) return null;
      const opponent = getOpponent();
      const enemy = opponent.field.find(c => c.instanceId === targetInstanceId);
      return enemy ? [enemy] : null;
    case ABILITY_TARGET_TYPES.ALL_ENEMIES:
      return getOpponent().field;
    default:
      return null;
  }
}

function applyAbilityEffect(effect, targets) {
  targets.forEach(target => {
    switch (effect.type) {
      case 'damage':
        target.def -= effect.value;
        break;
      case 'heal':
        target.def += effect.value;
        break;
      case 'buff':
        target.tokens.push({
          type: 'buff',
          stat: effect.stat,
          value: effect.value,
          turnsRemaining: effect.duration,
        });
        break;
      case 'debuff':
        target.tokens.push({
          type: 'debuff',
          stat: effect.stat,
          value: effect.value,
          turnsRemaining: effect.duration,
        });
        break;
      case 'immobilize':
        target.tokens.push({
          type: 'immobilize',
          turnsRemaining: effect.duration,
        });
        break;
    }
  });
}

function findCardOnField(instanceId) {
  for (const player of gameState.players) {
    const card = player.field.find(c => c.instanceId === instanceId);
    if (card) return { card, player };
  }
  return null;
}

function getEffectiveATK(card) {
  let atk = card.atk;
  card.tokens.forEach(token => {
    if (token.type === 'buff' && token.stat === 'atk') atk += token.value;
    if (token.type === 'debuff' && token.stat === 'atk') atk -= token.value;
  });
  return Math.max(0, atk);
}

function getEffectiveDEF(card) {
  let def = card.def;
  card.tokens.forEach(token => {
    if (token.type === 'buff' && token.stat === 'def') def += token.value;
    if (token.type === 'debuff' && token.stat === 'def') def -= token.value;
  });
  return def;
}

function isImmobilized(card) {
  return card.tokens.some(token => token.type === 'immobilize');
}

function getMyPlayer() {
  return gameState.players.find(p => p.id === gameState.playerId);
}

function getOpponent() {
  return gameState.players.find(p => p.id !== gameState.playerId);
}

function getCurrentPlayer() {
  return gameState.players[gameState.currentPlayerIndex];
}

function isMyTurn() {
  return getCurrentPlayer()?.id === gameState.playerId;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function createCardElement(card, context, onClick) {
  const div = document.createElement('div');
  div.className = 'card';
  if (isImmobilized(card)) div.classList.add('immobilized');

  const effectiveATK = getEffectiveATK(card);
  const effectiveDEF = getEffectiveDEF(card);

  div.innerHTML = `
    <img src="${card.imageUrl}" alt="${card.name}">

    ${card.tokens.length > 0 ? `
      <div class="card-tokens">
        ${card.tokens.map(token => {
          let text = '';
          if (token.type === 'buff') text = `+${token.value} ${token.stat.toUpperCase()}`;
          if (token.type === 'debuff') text = `-${token.value} ${token.stat.toUpperCase()}`;
          if (token.type === 'immobilize') text = '🚫';
          return `<span class="token">${text} (${token.turnsRemaining})</span>`;
        }).join('')}
      </div>
    ` : ''}
    ${isImmobilized(card) ? '<div class="immobilize-overlay">🚫</div>' : ''}
  `;

  div.onclick = onClick;

  // Add action buttons for cards on my field
  if (context === 'myField' && isMyTurn()) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    if (card.turnsOnField >= 1 && !isImmobilized(card)) {
      const attackBtn = document.createElement('button');
      attackBtn.className = 'btn-attack';
      attackBtn.textContent = 'Attack';
      attackBtn.onclick = (e) => {
        e.stopPropagation();
        initiateAttack(card.instanceId);
      };
      actionsDiv.appendChild(attackBtn);

      card.abilities.forEach(ability => {
        const myPlayer = getMyPlayer();
        const canUse = !ability.requiresTurnOnField || card.turnsOnField >= 1;
        const alreadyUsed = ability.oncePerGame && myPlayer.usedOncePerGameAbilities.includes(ability.id);

        const abilityBtn = document.createElement('button');
        abilityBtn.className = 'btn-ability';
        abilityBtn.textContent = '⚡';
        abilityBtn.title = ability.name;
        abilityBtn.disabled = !canUse || alreadyUsed;
        abilityBtn.onclick = (e) => {
          e.stopPropagation();
          initiateAbility(card.instanceId, ability);
        };
        actionsDiv.appendChild(abilityBtn);
      });
    }

    div.appendChild(actionsDiv);
  }

  // Add play button for cards in hand
  if (context === 'hand' && isMyTurn()) {
    const myPlayer = getMyPlayer();
    if (card.cost <= myPlayer.coins) {
      const playBtn = document.createElement('button');
      playBtn.className = 'btn-play card-actions';
      playBtn.style.bottom = '-30px';
      playBtn.textContent = 'Play';
      playBtn.onclick = (e) => {
        e.stopPropagation();
        playCard(card.instanceId);
      };
      div.appendChild(playBtn);
    }
  }

  return div;
}

function renderGame() {
  const myPlayer = getMyPlayer();
  const opponent = getOpponent();

  // Update header
  document.getElementById('turnNumber').textContent = gameState.turnNumber;
  document.getElementById('gameMatchCode').textContent = gameState.matchCode;
  document.getElementById('coinsAmount').textContent = myPlayer.coins;

  const turnStatus = document.getElementById('turnStatus');
  if (isMyTurn()) {
    turnStatus.textContent = '🟢 Your Turn';
    turnStatus.className = 'turn-status my-turn';
  } else {
    turnStatus.textContent = '🔴 Opponent\'s Turn';
    turnStatus.className = 'turn-status opponent-turn';
  }

  // Update action mode display
  const actionModeDisplay = document.getElementById('actionModeDisplay');
  if (gameState.attackMode) {
    actionModeDisplay.style.display = 'block';
    actionModeDisplay.innerHTML = `
      <p style="font-weight: bold;">⚔️ Select an enemy card to attack</p>
      <button onclick="gameState.attackMode = null; renderGame();" style="margin-top: 10px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
    `;
  } else if (gameState.abilityMode) {
    const ability = gameState.abilityMode.ability;
    actionModeDisplay.style.display = 'block';
    let content = `
      <p style="font-weight: bold;">✨ Using ability: ${ability.name}</p>
      <p style="font-size: 0.9em; margin-top: 5px;">${ability.description}</p>
    `;

    if (ability.targetType === ABILITY_TARGET_TYPES.SELF || 
        ability.targetType === ABILITY_TARGET_TYPES.ALL_ALLIES || 
        ability.targetType === ABILITY_TARGET_TYPES.ALL_ENEMIES) {
      content += `<button onclick="executeAbility();" style="margin-top: 10px; padding: 8px 16px; background: #9333ea; color: white; border: none; border-radius: 6px; cursor: pointer;">Activate</button>`;
    } else {
      content += `<p style="font-size: 0.9em; margin-top: 5px;">Select a target card</p>`;
    }

    content += `<button onclick="gameState.abilityMode = null; renderGame();" style="margin-left: 10px; margin-top: 10px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>`;
    
    actionModeDisplay.innerHTML = content;
  } else {
    actionModeDisplay.style.display = 'none';
  }

  // Update opponent info
  document.getElementById('opponentName').textContent = opponent.name;
  document.getElementById('opponentHandCount').textContent = opponent.hand.length;
  document.getElementById('opponentDeckCount').textContent = opponent.deck.length;

  // Render opponent field
  const opponentField = document.getElementById('opponentField');
  opponentField.innerHTML = '';
  opponent.field.forEach(card => {
    const cardEl = createCardElement(card, 'opponentField', () => {
      if (gameState.attackMode) {
        executeAttack(card.instanceId);
      } else if (gameState.abilityMode && gameState.abilityMode.ability.targetType === ABILITY_TARGET_TYPES.SINGLE_ENEMY) {
        executeAbility(card.instanceId);
      } else {
        showCardDetail(card);
      }
    });
    opponentField.appendChild(cardEl);
  });

  // Render my field
  const myField = document.getElementById('myField');
  myField.innerHTML = '';
  myPlayer.field.forEach(card => {
    const cardEl = createCardElement(card, 'myField', () => {
      if (gameState.abilityMode && gameState.abilityMode.ability.targetType === ABILITY_TARGET_TYPES.SINGLE_ALLY) {
        executeAbility(card.instanceId);
      } else {
        showCardDetail(card);
      }
    });
    myField.appendChild(cardEl);
  });

  // Render my hand
  const myHand = document.getElementById('myHand');
  myHand.innerHTML = '';
  myPlayer.hand.forEach(card => {
    const cardEl = createCardElement(card, 'hand', () => showCardDetail(card));
    myHand.appendChild(cardEl);
  });

  // Enable/disable end turn button
  document.getElementById('endTurnBtn').disabled = !isMyTurn();
}

function showCardDetail(card) {
  const modal = document.getElementById('cardModal');
  const detail = document.getElementById('modalCardDetail');

  const effectiveATK = getEffectiveATK(card);
  const effectiveDEF = getEffectiveDEF(card);

  let html = `
    <h2 style="margin-bottom: 20px;">${card.name}</h2>
    <img src="${card.imageUrl}" alt="${card.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
    <div style="line-height: 1.8;">
  `;

  if (card.turnsOnField !== undefined) {
    html += `<p><strong>Turns on field:</strong> ${card.turnsOnField}</p>`;
  }

  if (card.tokens.length > 0) {
    html += `<p style="margin-top: 15px;"><strong>Active Effects:</strong></p><ul style="list-style: disc; margin-left: 20px;">`;
    card.tokens.forEach(token => {
      let text = '';
      if (token.type === 'buff') text = `+${token.value} ${token.stat.toUpperCase()}`;
      if (token.type === 'debuff') text = `-${token.value} ${token.stat.toUpperCase()}`;
      if (token.type === 'immobilize') text = 'Immobilized';
      html += `<li>${text} (${token.turnsRemaining} turns)</li>`;
    });
    html += `</ul>`;
  }

  if (card.abilities.length > 0) {
    html += `<p style="margin-top: 15px;"><strong>Abilities:</strong></p>`;
    card.abilities.forEach(ability => {
      html += `
        <div class="ability-detail">
          <p style="font-weight: bold; margin-bottom: 5px;">${ability.name}</p>
          <p style="margin-bottom: 5px;">${ability.description}</p>
          <p style="font-size: 0.85em; color: #666;">
            ${ability.requiresTurnOnField ? 'Requires 1 turn on field. ' : ''}
            ${ability.oncePerGame ? 'Once per game.' : ''}
          </p>
        </div>
      `;
    });
  }

  html += `</div>`;
  detail.innerHTML = html;
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('cardModal').classList.remove('active');
}


