/**
 * CARD DATABASE - Greek Mythology Edition
 * 
 * This file contains all card definitions based on Greek mythology.
 * Each card follows a strict schema for consistency and extensibility.
 * 
 * CARD SCHEMA:
 * {
 *   id: string (unique identifier)
 *   name: string (card name)
 *   category: string (HUMAN | CREATURE | DEITY)
 *   description: string (lore/flavor text)
 *   cost: number (coins required to play)
 *   atk: number (attack power)
 *   def: number (defense/health)
 *   imageUrl: string (path or URL to card image)
 *   source: string (literary source)
 *   abilities: array of ability objects
 * }
 * 
 * ABILITY SCHEMA:
 * {
 *   id: string (unique identifier)
 *   name: string (ability name)
 *   description: string (what the ability does)
 *   effect: object (effect definition)
 *   target: string (TARGET_SELF | TARGET_SINGLE_ALLY | TARGET_ALL_ALLIES | TARGET_SINGLE_ENEMY | TARGET_ALL_ENEMIES)
 *   requiresTurnOnField: boolean (must card be on field for 1+ turns?)
 *   usageLimit: string (UNLIMITED | ONCE_PER_GAME)
 *   conditions: object (optional special conditions)
 * }
 */

// ==================== CONSTANTS ====================

const CARD_TYPES = {
  HUMAN: 'Humans',
  CREATURE: 'Creatures & Monsters',
  DEITY: 'Deities & Celestial Beings',
};

const ABILITY_TARGET_TYPES = {
  TARGET_SELF: 'self',
  TARGET_SINGLE_ALLY: 'single_ally',
  TARGET_ALL_ALLIES: 'all_allies',
  TARGET_SINGLE_ENEMY: 'single_enemy',
  TARGET_ALL_ENEMIES: 'all_enemies',
  TARGET_SPECIFIC: 'specific', // For abilities that target specific card types
};

const USAGE_LIMITS = {
  UNLIMITED: 'unlimited',
  ONCE_PER_GAME: 'once_per_game',
  ONCE_PER_TURN: 'once_per_turn',
};

const EFFECT_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  IMMOBILIZE: 'immobilize',
  DESTROY: 'destroy',
  TRANSFORM: 'transform',
  STEAL: 'steal',
  SUMMON: 'summon',
  REVIVE: 'revive',
  PROTECT: 'protect',
  SWAP: 'swap',
  SEARCH: 'search',
  SACRIFICE: 'sacrifice',
  CONTROL: 'control',
  REDIRECT: 'redirect',
  PETRIFY: 'petrify',
  DISABLE: 'disable',
};

// ==================== CARD DEFINITIONS ====================

const GREEK_MYTHOLOGY_CARDS = [

  {
    id: 'hera',
    name: 'Hera',
    type: CARD_TYPES.DEITY,
    description: 'Queen of the gods, protector of marriage. Famous for her jealousy and for punishing the lovers and children of Zeus.',
    cost: 6,
    atk: 5,
    def: 6,
    imageUrl: '/img/hera.jpg',
    abilities: [
      {
        id: 'jealous_wrath',
        name: 'Jealous Wrath',
        description: 'Once per game, transform a female Human card into a 1/1 creature.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'debuff',
          stat: 'atk',
          value: 4,
          duration: 999
        }
      }
    ]
  },

  {
    id: 'zeus',
    name: 'Zeus',
    type: CARD_TYPES.DEITY,
    description: 'King of the gods, ruler of the sky. The most powerful of all Olympians.',
    cost: 9,
    atk: 9,
    def: 6,
    imageUrl: '/img/zeus.jpg',
    abilities: [
      {
        id: 'thunderbolt',
        name: 'Olympian Thunderbolt',
        description: 'Once per game, destroy one enemy card, ignoring DEF.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 99
        }
      },
      {
        id: 'transformation',
        name: 'Transformation',
        description: 'Once per game, Zeus may dodge one incoming attack.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 1
        }
      }
    ]
  },

  {
    id: 'poseidon',
    name: 'Poseidon',
    type: CARD_TYPES.DEITY,
    description: 'God of the sea and earthquakes. His anger can sink entire cities.',
    cost: 7,
    atk: 6,
    def: 6,
    imageUrl: '/img/poseidon.jpg',
    abilities: [
      {
        id: 'tidal_wrath',
        name: 'Tidal Wrath',
        description: 'Once per game, all enemy cards lose 3 ATK for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'debuff',
          stat: 'atk',
          value: 3,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'athena',
    name: 'Athena',
    type: CARD_TYPES.DEITY,
    description: 'Goddess of wisdom and war strategy.',
    cost: 6,
    atk: 4,
    def: 4,
    imageUrl: '/img/athena.jpg',
    abilities: [
      {
        id: 'wisdom_of_war',
        name: 'Wisdom of War',
        description: 'When played, one ally gains +2 ATK and one ally gains +2 DEF.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'ares',
    name: 'Ares',
    type: CARD_TYPES.DEITY,
    description: 'God of war and bloodlust.',
    cost: 6,
    atk: 4,
    def: 2,
    imageUrl: '/img/ares.jpg',
    abilities: [
      {
        id: 'battle_frenzy',
        name: 'Battle Frenzy',
        description: 'Once per game, all allies gain +2 ATK.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 2,
          duration: 2
        }
      }
    ]
  }  ,
  {
    id: 'apollo',
    name: 'Apollo',
    type: CARD_TYPES.DEITY,
    description: 'God of the sun, prophecy, music, and healing.',
    cost: 8,
    atk: 5,
    def: 4,
    imageUrl: '/img/apollo.jpg',
    abilities: [
      {
        id: 'healing_light',
        name: 'Healing Light',
        description: 'Once per game, heal one ally for +3 DEF.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ALLY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'heal',
          value: 3
        }
      }
    ]
  },

  {
    id: 'artemis',
    name: 'Artemis',
    type: CARD_TYPES.DEITY,
    description: 'Goddess of the hunt and the moon, protector of the wild.',
    cost: 8,
    atk: 6,
    def: 5,
    imageUrl: '/img/artemis.jpg',
    abilities: [
      {
        id: 'hunter_mark',
        name: 'Hunter’s Mark',
        description: 'Once per game, deal 4 damage to one enemy card.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 4
        }
      }
    ]
  },

  {
    id: 'hephaestus',
    name: 'Hephaestus',
    type: CARD_TYPES.DEITY,
    description: 'God of fire and the forge, creator of divine weapons.',
    cost: 4,
    atk: 2,
    def: 3,
    imageUrl: '/img/Hephaestus.jpg',
    abilities: [
      {
        id: 'divine_forge',
        name: 'Divine Forge',
        description: 'Once per game, give one ally +3 DEF for 3 turns.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ALLY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 3,
          duration: 3
        }
      }
    ]
  },

  {
    id: 'aphrodite',
    name: 'Aphrodite',
    type: CARD_TYPES.DEITY,
    description: 'Goddess of love and beauty, who bends hearts and minds.',
    cost: 5,
    atk: 4,
    def: 4,
    imageUrl: '/img/aphrodite.jpg',
    abilities: [
      {
        id: 'charm',
        name: 'Charm',
        description: 'Once per game, immobilize one enemy card for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 1
        }
      }
    ]
  },

  {
    id: 'hermes',
    name: 'Hermes',
    type: CARD_TYPES.DEITY,
    description: 'Messenger of the gods, swift and cunning.',
    cost: 5,
    atk: 3,
    def: 6,
    imageUrl: '/img/hermes.jpg',
    abilities: [
      {
        id: 'divine_speed',
        name: 'Divine Speed',
        description: 'Hermes gains +2 ATK for this turn.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  }  ,
  {
    id: 'demeter',
    name: 'Demeter',
    type: CARD_TYPES.DEITY,
    description: 'Goddess of harvest and fertility, bringer of abundance and famine.',
    cost: 2,
    atk: 2,
    def: 2,
    imageUrl: '/img/demeter.jpg',
    abilities: [
      {
        id: 'fertile_blessing',
        name: 'Fertile Blessing',
        description: 'Once per game, all allies gain +1 DEF for 2 turns.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 1,
          duration: 2
        }
      }
    ]
  },

  {
    id: 'hestia',
    name: 'Hestia',
    type: CARD_TYPES.DEITY,
    description: 'Goddess of the hearth and home, guardian of peace.',
    cost: 3,
    atk: 1,
    def: 4,
    imageUrl: '/img/hestia.jpg',
    abilities: [
      {
        id: 'sacred_hearth',
        name: 'Sacred Hearth',
        description: 'Once per game, heal all allies for +1 DEF.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'heal',
          value: 1
        }
      }
    ]
  },

  {
    id: 'hades',
    name: 'Hades',
    type: CARD_TYPES.DEITY,
    description: 'Lord of the underworld, ruler of the dead.',
    cost: 6,
    atk: 2,
    def: 6,
    imageUrl: '/img/hades.jpg',
    abilities: [
      {
        id: 'lord_of_dead',
        name: 'Lord of the Dead',
        description: 'Whenever an enemy card is destroyed, Hades gains +1 ATK (max +3).',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: false,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 1,
          duration: 3
        }
      }
    ]
  },

  {
    id: 'persephone',
    name: 'Persephone',
    type: CARD_TYPES.DEITY,
    description: 'Queen of the underworld, goddess of the seasons.',
    cost: 7,
    atk: 4,
    def: 4,
    imageUrl: '/img/persephone.jpg',
    abilities: [
      {
        id: 'cycle_of_seasons',
        name: 'Cycle of Seasons',
        description: 'Once per game, revive one defeated ally with 2 DEF.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ALLY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'heal',
          value: 2
        }
      }
    ]
  }  ,
  {
    id: 'kronos',
    name: 'Kronos',
    type: CARD_TYPES.DEITY,
    description: 'Titan of time, The ruler of the Golden Age, Kronos devoured his own children to prevent them from taking his throne. Time itself bends to his will.',
    cost: 8,
    atk: 9,
    def: 5,
    imageUrl: '/img/kronos.jpg',
    abilities: [
      {
        id: 'devour_time',
        name: 'Devour Time',
        description: 'To use this power, you must sacrifice three God cards. He erases all cards on your opponent’s field. Consumed by time.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 6
        }
      },
       {
        id: 'fall_titan',
        name: 'Fall of the Titan',
        description: 'If Zeus is on the field, Kronos loses 2 DEF.',
        targetType: ABILITY_TARGET_TYPES.TARGET_SELF,
        requiresTurnOnField: true,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 2,
        }
      }
    ]
  },

  {
    id: 'rhea',
    name: 'Rhea',
    type: CARD_TYPES.DEITY,
    description: 'Titaness and mother of the Olympian gods.',
    cost: 6,
    atk: 3,
    def: 7,
    imageUrl: '/img/rhea.jpg',
    abilities: [
      {
        id: 'mothers_protection',
        name: 'Mother’s Protection',
        description: 'Once per game, all allies gain +2 DEF for 2 turns.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 2,
          duration: 2
        }
      }
    ]
  },

  {
    id: 'gaia',
    name: 'Gaia',
    type: CARD_TYPES.DEITY,
    description: 'Primordial goddess of the Earth, source of all life.',
    cost: 7,
    atk: 1,
    def: 9,
    imageUrl: '/img/gaia.jpg',
    abilities: [
      {
        id: 'earth_endurance',
        name: 'Earth’s Endurance',
        description: 'Gaia gains +2 DEF for 3 turns.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: false,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 2,
          duration: 3
        }
      }
    ]
  },

  {
    id: 'uranus',
    name: 'Uranus',
    type: CARD_TYPES.DEITY,
    description: 'Primordial god of the sky, father of the Titans.',
    cost: 6,
    atk: 7,
    def: 5,
    imageUrl: '/img/uranus.jpg',
    abilities: [
      {
        id: 'fall_of_sky',
        name: 'Fall of the Sky',
        description: 'Once per game, deal 5 damage to one enemy card.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 5
        }
      }
    ]
  },
 {
    id: 'prometheus',
    name: 'Prometheus',
    type: CARD_TYPES.DEITY,
    description: 'Titan',
    cost: 7,
    atk: 5,
    def: 4,
    imageUrl: '/img/prometheus.jpg',
    abilities: [
      {
        id: 'gift-fire',
        name: 'Gift of fire',
      }
    ]
  }  ,
  {
    id: 'atlas',
    name: 'Atlas',
    type: CARD_TYPES.DEITY,
    description: 'Titan condemned to hold up the sky for eternity.',
    cost: 6,
    atk: 6,
    def: 9,
    imageUrl: '/img/atlas.jpg',
    abilities: [
      {
        id: 'unbearable_weight',
        name: 'Unbearable Weight',
        description: 'Atlas cannot attack. While on field, all enemies lose 1 ATK.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: false,
        oncePerGame: false,
        effect: {
          type: 'debuff',
          stat: 'atk',
          value: 1,
          duration: 999
        }
      }
    ]
  }  ,
  {
    id: 'heracles',
    name: 'Heracles',
    type: CARD_TYPES.HUMAN,
    description: 'Greatest of Greek heroes, known for his twelve labors and unmatched strength.',
    cost: 6,
    atk: 7,
    def: 5,
    imageUrl: '/img/heracles.jpg',
    abilities: [
      {
        id: 'heroic_strength',
        name: 'Heroic Strength',
        description: 'Once per game, Heracles gains +4 ATK for this turn.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 4,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'achilles',
    name: 'Achilles',
    type: CARD_TYPES.HUMAN,
    description: 'The greatest warrior of the Trojan War, nearly invincible.',
    cost: 6,
    atk: 6,
    def: 4,
    imageUrl: '/img/achilles.jpg',
    abilities: [
      {
        id: 'invincible_hero',
        name: 'Invincible Hero',
        description: 'Once per game, ignore all damage dealt to Achilles this turn.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 99,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'odysseus',
    name: 'Odysseus',
    type: CARD_TYPES.HUMAN,
    description: 'King of Ithaca, famed for his cunning and clever strategies.',
    cost: 5,
    atk: 4,
    def: 5,
    imageUrl: '/img/odysseus.jpg',
    abilities: [
      {
        id: 'cunning_plan',
        name: 'Cunning Plan',
        description: 'Once per game, immobilize one enemy card for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 1
        }
      }
    ]
  },

  {
    id: 'perseus',
    name: 'Perseus',
    type: CARD_TYPES.HUMAN,
    description: 'Hero who defeated Medusa using wit and divine gifts.',
    cost: 5,
    atk: 5,
    def: 4,
    imageUrl: '/img/perseus.jpg',
    abilities: [
      {
        id: 'gorgon_slayer',
        name: 'Gorgon Slayer',
        description: 'Once per game, deal 5 damage to one enemy card.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 5
        }
      }
    ]
  },

  {
    id: 'theseus',
    name: 'Theseus',
    type: CARD_TYPES.HUMAN,
    description: 'King of Athens, slayer of the Minotaur.',
    cost: 5,
    atk: 5,
    def: 5,
    imageUrl: '/img/theseus.jpg',
    abilities: [
      {
        id: 'labyrinth_master',
        name: 'Labyrinth Master',
        description: 'Once per game, one enemy card loses 2 ATK and 2 DEF for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'debuff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'atalanta',
    name: 'Atalanta',
    type: CARD_TYPES.HUMAN,
    description: 'Swift huntress and unmatched runner.',
    cost: 4,
    atk: 4,
    def: 3,
    imageUrl: '/img/atalanta.jpg',
    abilities: [
      {
        id: 'swift_strike',
        name: 'Swift Strike',
        description: 'Atalanta gains +2 ATK for this turn.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'jason',
    name: 'Jason',
    type: CARD_TYPES.HUMAN,
    description: 'Leader of the Argonauts in the quest for the Golden Fleece.',
    cost: 4,
    atk: 3,
    def: 4,
    imageUrl: '/img/jason.jpg',
    abilities: [
      {
        id: 'argonaut_leader',
        name: 'Argonaut Leader',
        description: 'Once per game, all allies gain +1 ATK for 2 turns.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 1,
          duration: 2
        }
      }
    ]
  },

  {
    id: 'orpheus',
    name: 'Orpheus',
    type: CARD_TYPES.HUMAN,
    description: 'Legendary musician whose song could charm gods and monsters.',
    cost: 4,
    atk: 2,
    def: 4,
    imageUrl: '/img/orpheus.jpg',
    abilities: [
      {
        id: 'enchanting_song',
        name: 'Enchanting Song',
        description: 'Once per game, immobilize all enemy cards for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 1
        }
      }
    ]
  }  ,
  {
    id: 'medusa',
    name: 'Medusa',
    type: CARD_TYPES.CREATURE,
    description: 'Gorgon whose gaze turns mortals to stone.',
    cost: 6,
    atk: 5,
    def: 4,
    imageUrl: '/img/medusa.jpg',
    abilities: [
      {
        id: 'petrifying_gaze',
        name: 'Petrifying Gaze',
        description: 'Once per game, immobilize one enemy card for 2 turns.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 2
        }
      }
    ]
  },

  {
    id: 'minotaur',
    name: 'Minotaur',
    type: CARD_TYPES.CREATURE,
    description: 'Savage beast of the Labyrinth, half man and half bull.',
    cost: 5,
    atk: 6,
    def: 5,
    imageUrl: '/img/minotaur.jpg',
    abilities: [
      {
        id: 'labyrinth_rage',
        name: 'Labyrinth Rage',
        description: 'Minotaur gains +2 ATK when attacking.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'hydra',
    name: 'Hydra',
    type: CARD_TYPES.CREATURE,
    description: 'Serpent monster that grows two heads for each one cut off.',
    cost: 7,
    atk: 6,
    def: 7,
    imageUrl: '/img/hydra.jpg',
    abilities: [
      {
        id: 'regenerate_heads',
        name: 'Regenerate Heads',
        description: 'Once per game, heal Hydra for +3 DEF.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'heal',
          value: 3
        }
      }
    ]
  },

  {
    id: 'cerberus',
    name: 'Cerberus',
    type: CARD_TYPES.CREATURE,
    description: 'Three-headed hound guarding the gates of the underworld.',
    cost: 6,
    atk: 5,
    def: 6,
    imageUrl: '/img/cerberus.jpg',
    abilities: [
      {
        id: 'underworld_guard',
        name: 'Underworld Guard',
        description: 'Once per game, deal 3 damage to an attacking enemy card.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 3
        }
      }
    ]
  },

  {
    id: 'chimera',
    name: 'Chimera',
    type: CARD_TYPES.CREATURE,
    description: 'Fire-breathing hybrid beast of lion, goat, and serpent.',
    cost: 6,
    atk: 6,
    def: 4,
    imageUrl: '/img/chimera.jpg',
    abilities: [
      {
        id: 'fire_breath',
        name: 'Fire Breath',
        description: 'Once per game, deal 4 damage to all enemy cards.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 4
        }
      }
    ]
  },

  {
    id: 'cyclops',
    name: 'Cyclops',
    type: CARD_TYPES.CREATURE,
    description: 'One-eyed giant of immense strength.',
    cost: 5,
    atk: 7,
    def: 3,
    imageUrl: '/img/cyclops.jpg',
    abilities: [
      {
        id: 'brute_force',
        name: 'Brute Force',
        description: 'Cyclops gains +3 ATK for this turn.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: false,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 3,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'sirens',
    name: 'Sirens',
    type: CARD_TYPES.CREATURE,
    description: 'Enchanting beings whose song lures sailors to doom.',
    cost: 4,
    atk: 3,
    def: 3,
    imageUrl: '/img/sirens.jpg',
    abilities: [
      {
        id: 'siren_song',
        name: 'Siren Song',
        description: 'Once per game, immobilize all enemy cards for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 1
        }
      }
    ]
  },

  {
    id: 'scylla',
    name: 'Scylla',
    type: CARD_TYPES.CREATURE,
    description: 'Sea monster lurking in narrow straits.',
    cost: 6,
    atk: 6,
    def: 5,
    imageUrl: '/img/scylla.jpg',
    abilities: [
      {
        id: 'devour_sailors',
        name: 'Devour Sailors',
        description: 'Once per game, deal 3 damage to two enemy cards.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'damage',
          value: 3
        }
      }
    ]
  },

  {
    id: 'charybdis',
    name: 'Charybdis',
    type: CARD_TYPES.CREATURE,
    description: 'Living whirlpool that swallows ships whole.',
    cost: 6,
    atk: 5,
    def: 6,
    imageUrl: '/img/charybdis.jpg',
    abilities: [
      {
        id: 'raging_whirlpool',
        name: 'Raging Whirlpool',
        description: 'Once per game, all enemy cards lose 2 ATK for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'debuff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  }  ,
  {
    id: 'arachne',
    name: 'Arachne',
    type: CARD_TYPES.HUMAN,
    description: 'A mortal woman who challenged Athena in weaving and was transformed into a spider.',
    cost: 2,
    atk: 2,
    def: 2,
    imageUrl: '/img/arachne.jpg',
    abilities: [
      {
        id: 'web_trap',
        name: 'Web Trap',
        description: 'Once per game, immobilize one enemy card for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 1
        }
      }
    ]
  },

  {
    id: 'baucis_philemon',
    name: 'Baucis & Philemon',
    type: CARD_TYPES.HUMAN,
    description: 'An old couple rewarded by the gods for their kindness and hospitality.',
    cost: 3,
    atk: 1,
    def: 4,
    imageUrl: '/img/baucis_philemon.jpg',
    abilities: [
      {
        id: 'sacred_hospitality',
        name: 'Sacred Hospitality',
        description: 'Once per game, all allies gain +2 DEF until your next turn.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'def',
          value: 2,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'pandora',
    name: 'Pandora',
    type: CARD_TYPES.HUMAN,
    description: 'The first woman, whose curiosity released all evils into the world.',
    cost: 4,
    atk: 2,
    def: 3,
    imageUrl: '/img/pandora.jpg',
    abilities: [
      {
        id: 'open_the_box',
        name: 'Open the Box',
        description: 'Once per game, all cards on the field lose 1 DEF.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'debuff',
          stat: 'def',
          value: 1,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'daedalus',
    name: 'Daedalus',
    type: CARD_TYPES.HUMAN,
    description: 'Brilliant inventor and architect, creator of the Labyrinth.',
    cost: 4,
    atk: 2,
    def: 4,
    imageUrl: '/img/daedalus.jpg',
    abilities: [
      {
        id: 'master_inventor',
        name: 'Master Inventor',
        description: 'Once per game, give one ally +2 ATK and +2 DEF for 1 turn.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ALLY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 2,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'icarus',
    name: 'Icarus',
    type: CARD_TYPES.HUMAN,
    description: 'Son of Daedalus, who flew too close to the sun.',
    cost: 3,
    atk: 3,
    def: 2,
    imageUrl: '/img/icarus.jpg',
    abilities: [
      {
        id: 'wax_wings',
        name: 'Wax Wings',
        description: 'Once per game, Icarus gains +3 ATK for this turn.',
        targetType: ABILITY_TARGET_TYPES.SELF,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'buff',
          stat: 'atk',
          value: 3,
          duration: 1
        }
      }
    ]
  },

  {
    id: 'midas',
    name: 'King Midas',
    type: CARD_TYPES.HUMAN,
    description: 'King cursed with the power to turn everything he touched into gold.',
    cost: 4,
    atk: 2,
    def: 3,
    imageUrl: '/img/midas.jpg',
    abilities: [
      {
        id: 'golden_touch',
        name: 'Golden Touch',
        description: 'Once per game, immobilize one enemy card for 2 turns.',
        targetType: ABILITY_TARGET_TYPES.SINGLE_ENEMY,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'immobilize',
          duration: 2
        }
      }
    ]
  },

  {
    id: 'cassandra',
    name: 'Cassandra',
    type: CARD_TYPES.HUMAN,
    description: 'Prophetess cursed to utter true prophecies that no one believes.',
    cost: 3,
    atk: 1,
    def: 3,
    imageUrl: '/img/cassandra.jpg',
    abilities: [
      {
        id: 'foreseen_doom',
        name: 'Foreseen Doom',
        description: 'Once per game, all enemy cards lose 1 ATK for 2 turns.',
        targetType: ABILITY_TARGET_TYPES.ALL_ENEMIES,
        requiresTurnOnField: true,
        oncePerGame: true,
        effect: {
          type: 'debuff',
          stat: 'atk',
          value: 1,
          duration: 2
        }
      }
    ]
  },

  {
    id: 'tiresias',
    name: 'Tiresias',
    type: CARD_TYPES.HUMAN,
    description: 'Blind prophet who saw past, present, and future.',
    cost: 3,
    atk: 1,
    def: 4,
    imageUrl: '/img/tiresias.jpg',
    abilities: [
      {
        id: 'true_vision',
        name: 'True Vision',
        description: 'Once per game, heal all allies for +1 DEF.',
        targetType: ABILITY_TARGET_TYPES.ALL_ALLIES,
        requiresTurnOnField: false,
        oncePerGame: true,
        effect: {
          type: 'heal',
          value: 1
        }
      }
    ]
  }



];
