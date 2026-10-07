/**
 * PAGES OF FATE - Card database (Greek Mythology)
 * Note: the King Midas card shows no type icon and no cost: Human and cost 4 are assumptions.
 * Every value below was transcribed from the card images in /img:
 * name, type icon, cost, ATK/DEF, title, literary source, description and abilities.
 * Game logic for each ability lives in engine.js (ABILITIES table), keyed by "cardId:abilityId".
 */
const CARD_TYPES = { HUMAN: 'Human', CREATURE: 'Creature & Monster', DEITY: 'Deity & Celestial Being' };

const CARDS = [
  {
    "id": "achilles",
    "name": "Achilles",
    "type": CARD_TYPES.HUMAN,
    "cost": 7,
    "atk": 5,
    "def": 4,
    "title": "Hero of the Trojan War",
    "source": "Iliad - Homer",
    "description": "Son of the sea nymph Thetis, Achilles was dipped in the River Styx and became invulnerable, except for his heel. In battle he was unmatched.",
    "image": "img/achilles.jpg",
    "tags": [
      "demigod"
    ],
    "abilities": [
      {
        "id": "rage_of_achilles",
        "name": "Rage of Achilles",
        "text": "Against Humans or Demigods, he deals +3 damage, but his defense drops by 2 for the next two turns. Usable once per game."
      }
    ]
  },
  {
    "id": "agamemnon",
    "name": "Agamemnon",
    "type": CARD_TYPES.HUMAN,
    "cost": 7,
    "atk": 5,
    "def": 6,
    "title": "Leader of the Greeks",
    "source": "Iliad - Homer",
    "description": "King of Mycenae and commander of the Greek forces at Troy. His pride and poor decisions sparked Achilles' rage. He sacrificed his daughter Iphigenia for favorable winds.",
    "image": "img/agamemnon.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "kings_command",
        "name": "King's Command",
        "text": "Once per game, Agamemnon can make all your Human cards on the field attack in the same turn, even if they just arrived on the field, each gaining +1 ATK."
      }
    ]
  },
  {
    "id": "ajax",
    "name": "Ajax",
    "type": CARD_TYPES.HUMAN,
    "cost": 6,
    "atk": 5,
    "def": 6,
    "title": "The shield of the Greeks",
    "source": "Iliad - Homer",
    "description": "The greatest Greek warrior after Achilles, Ajax wielded a massive shield like a wall. When Achilles died, Ajax expected his armor but lost it to Odysseus, driving him to madness.",
    "image": "img/ajax.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "tower_shield",
        "name": "Tower Shield",
        "text": "Ajax can protect one adjacent ally card from all damage for one turn. Decide which card he protects at the end of each turn."
      }
    ]
  },
  {
    "id": "andromache",
    "name": "Andromache",
    "type": CARD_TYPES.HUMAN,
    "cost": 1,
    "atk": 1,
    "def": 1,
    "title": "Trojan: Wife of Hector",
    "source": "Iliad - Homer",
    "description": "Hector's devoted wife who begged him not to fight. After Troy fell, she watched the Greeks throw her infant son from the walls and was taken as a slave.",
    "image": "img/andromache.jpg",
    "tags": [
      "female",
      "trojan"
    ],
    "abilities": [
      {
        "id": "wifes_warning",
        "name": "Wife's Warning",
        "text": "When played, if Hector is on the field, Andromache can prevent him from attacking while she is in play, protecting him from danger. He gains +3 DEF while resting."
      }
    ]
  },
  {
    "id": "aphrodite",
    "name": "Aphrodite",
    "type": CARD_TYPES.DEITY,
    "cost": 5,
    "atk": 4,
    "def": 4,
    "title": "Goddess of love and beauty",
    "source": "Theogony - Hesiod",
    "description": "Born from the sea foam, she enchants gods and mortals alike with her beauty and charm. Her power can turn conflict into desire.",
    "image": "img/aphrodite.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "charm_of_desire",
        "name": "Charm of Desire",
        "text": "With a single look, Aphrodite makes her enemy forget the fight. The opponent skips one turn of attack. Once per game."
      }
    ]
  },
  {
    "id": "apollo",
    "name": "Apollo",
    "type": CARD_TYPES.DEITY,
    "cost": 8,
    "atk": 5,
    "def": 4,
    "title": "God of the sun, music, and prophecy",
    "source": "Homeric Hymns - Anonymous",
    "description": "He is the bright god of light and arts, guiding the sun across the sky and inspiring poets and healers.",
    "image": "img/apollo.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "healing_light",
        "name": "Healing Light",
        "text": "Apollo was also god of medicine. Add +3 DEF to one dying card, after the enemy declares their attack. Once per game."
      },
      {
        "id": "prophecy_of_delphi",
        "name": "Prophecy of Delphi",
        "text": "He reveals the truth through his oracle. You can look at your opponent's cards. Once per game."
      }
    ]
  },
  {
    "id": "arachne",
    "name": "Arachne",
    "type": CARD_TYPES.CREATURE,
    "cost": 2,
    "atk": 2,
    "def": 2,
    "title": "The cursed weaver",
    "source": "Metamorphoses - Ovid",
    "description": "A mortal woman who challenged Athena in weaving and won, but her pride angered the goddess, who turned her into a spider forever.",
    "image": "img/arachne.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "web_trap",
        "name": "Web Trap",
        "text": "Once per game, Arachne immobilizes one enemy card (excluding Gods); it cannot attack or use abilities for 1 turn."
      }
    ]
  },
  {
    "id": "ares",
    "name": "Ares",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 4,
    "def": 2,
    "title": "God of war and bloodlust",
    "source": "Iliad - Homer",
    "description": "Son of Zeus and Hera, Ares revels in the chaos of battle. Unlike Athena's tactical warfare, he represents raw violence and the fury of combat. Even his parents dislike him.",
    "image": "img/ares.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "battle_frenzy",
        "name": "Battle Frenzy",
        "text": "When played, Ares gives +2 ATK to each ally card on the field. Usable once per game."
      }
    ]
  },
  {
    "id": "ariadne",
    "name": "Ariadne",
    "type": CARD_TYPES.HUMAN,
    "cost": 2,
    "atk": 1,
    "def": 1,
    "title": "The princess of Crete",
    "source": "Bibliotheca - Apollodorus",
    "description": "Daughter of King Minos, she helped Theseus defeat the Minotaur by giving him a ball of thread to find his way out of the Labyrinth.",
    "image": "img/ariadne.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "thread_of_clarity",
        "name": "Thread of Clarity",
        "text": "While Ariadne is in play, all monster enemy special abilities are disabled. Her wisdom cuts through illusion and chaos."
      }
    ]
  },
  {
    "id": "artemis",
    "name": "Artemis",
    "type": CARD_TYPES.DEITY,
    "cost": 8,
    "atk": 6,
    "def": 5,
    "title": "Goddess of the hunt and the moon",
    "source": "Homeric Hymns - Anonymous",
    "description": "Daughter of Zeus and Leto, twin sister of Apollo, Artemis guards the wilderness and punishes those who harm it. She protects women.",
    "image": "img/artemis.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "protector_of_women",
        "name": "Protector of Women",
        "text": "As patron of maidens and avenger of wronged women, no female Human card can be targeted by enemy abilities while Artemis is in play."
      }
    ]
  },
  {
    "id": "atalanta",
    "name": "Atalanta",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 5,
    "def": 3,
    "title": "The swift huntress",
    "source": "Bibliotheca - Apollodorus",
    "description": "Abandoned as a child and raised by hunters, Atalanta became the fastest mortal alive. She challenged her suitors to a race: only those who beat her could marry her.",
    "image": "img/atalanta.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "swift_arrow",
        "name": "Swift Arrow",
        "text": "Atalanta can attack directly from her holder's hand. After the attack, she enters the field exhausted and cannot attack next turn."
      }
    ]
  },
  {
    "id": "athena",
    "name": "Athena",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 4,
    "def": 4,
    "title": "Goddess of wisdom and war strategy",
    "source": "Theogony - Hesiod",
    "description": "She was born fully armed from Zeus's head and is known for her wisdom, justice, and skill in battle.",
    "image": "img/athena.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "wisdom_of_war",
        "name": "Wisdom of War",
        "text": "When played, Athena gives tactical advice to her allies. One ally gains +2 ATK and one gains +2 DEF while she is on the field."
      }
    ]
  },
  {
    "id": "atlas",
    "name": "Atlas",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 6,
    "def": 9,
    "title": "Bearer of the heavens",
    "source": "Theogony - Hesiod",
    "description": "A Titan punished by Zeus to hold up the sky for eternity. His strength is unmatched, but his burden is endless.",
    "image": "img/atlas.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "unbearable_weight",
        "name": "Unbearable Weight",
        "text": "Atlas cannot attack, he is forever holding the sky."
      },
      {
        "id": "the_fall_of_the_sky",
        "name": "The Fall of the Sky",
        "text": "If Atlas dies, all the cards on the field are attacked with a force of 3 ATK."
      }
    ]
  },
  {
    "id": "bellerophon",
    "name": "Bellerophon",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 4,
    "def": 5,
    "title": "The slayer of the Chimera",
    "source": "Iliad - Homer",
    "description": "Riding the winged horse Pegasus, Bellerophon defeated the Chimera and became a hero of the gods. But when pride led him to fly toward Olympus, Zeus cast him down to earth.",
    "image": "img/bellerophon.jpg",
    "tags": [
      "demigod"
    ],
    "abilities": [
      {
        "id": "hero_of_the_sky",
        "name": "Hero of the Sky",
        "text": "Once per game, Bellerophon may instantly destroy one Monster card. After using this ability, Bellerophon loses 1 DEF after each attack."
      }
    ]
  },
  {
    "id": "calypso",
    "name": "Calypso",
    "type": CARD_TYPES.DEITY,
    "cost": 3,
    "atk": 2,
    "def": 5,
    "title": "The nymph of Ogygia",
    "source": "Odyssey - Homer",
    "description": "A lonely sea nymph who kept Odysseus on her island for seven years, offering him love and immortality if he stayed.",
    "image": "img/calypso.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "captive_love",
        "name": "Captive Love",
        "text": "Choose one Human or Demigod. For 7 turns it is trapped: it cannot attack or use one-time abilities. But it cannot die during this time. Usable once per game, even on your own cards. The effect ends if she dies."
      }
    ]
  },
  {
    "id": "cassandra",
    "name": "Cassandra",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 3,
    "def": 3,
    "title": "The cursed prophet of Troy",
    "source": "Iliad - Homer; Oresteia - Aeschylus",
    "description": "Gifted by Apollo with the power of prophecy, then cursed so that no one would believe her, Cassandra sees every disaster before it happens.",
    "image": "img/cassandra.jpg",
    "tags": [
      "female",
      "trojan"
    ],
    "abilities": [
      {
        "id": "prophecy_ignored",
        "name": "Prophecy Ignored",
        "text": "Once per game, you may look at your opponent's hand and choose one card. That card cannot be played next turn."
      }
    ]
  },
  {
    "id": "cerberus",
    "name": "Cerberus",
    "type": CARD_TYPES.CREATURE,
    "cost": 5,
    "atk": 4,
    "def": 6,
    "title": "The guardian of the underworld",
    "source": "Theogony - Hesiod",
    "description": "The monstrous dog of Hades guards the gates of the underworld. No living soul may enter, or escape, without his master's will.",
    "image": "img/cerberus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "infernal_guard",
        "name": "Infernal Guard",
        "text": "While Cerberus is in play, no destroyed cards can return to the field."
      },
      {
        "id": "triple_bite",
        "name": "Triple Bite",
        "text": "After being on the field for one turn, it attacks three times in one turn, each strike dealing half damage."
      }
    ]
  },
  {
    "id": "charon",
    "name": "Charon",
    "type": CARD_TYPES.DEITY,
    "cost": 3,
    "atk": 4,
    "def": 4,
    "title": "The ferryman of the underworld",
    "source": "Greek Mythology",
    "description": "The silent ferryman who carries souls across the river Styx. Only those who pay his toll may pass; the rest wander forever on the shore.",
    "image": "img/charon.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "coin_for_passage",
        "name": "Coin for Passage",
        "text": "Once per game, you may sacrifice one of your cards to bring back one destroyed card from your graveyard of the same value, restoring its special effects."
      }
    ]
  },
  {
    "id": "chimera",
    "name": "Chimera",
    "type": CARD_TYPES.CREATURE,
    "cost": 7,
    "atk": 6,
    "def": 5,
    "title": "The beast of fire and terror",
    "source": "Theogony - Hesiod; Iliad - Homer",
    "description": "Born from the monsters Typhon and Echidna, the Chimera has the head of a lion, the body of a goat, and the tail of a serpent. It breathes fire and spreads terror across the land of Lycia.",
    "image": "img/chimera.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "infernal_breath",
        "name": "Infernal Breath",
        "text": "3 enemy cards lose 2 DEF for 1 turn. Usable once per game."
      }
    ]
  },
  {
    "id": "chiron",
    "name": "Chiron",
    "type": CARD_TYPES.CREATURE,
    "cost": 4,
    "atk": 5,
    "def": 4,
    "title": "The wise centaur and healer",
    "source": "Iliad - Homer",
    "description": "The immortal centaur who taught heroes like Achilles, Asclepius, and Heracles. Known for his wisdom, medicine, and skill in battle.",
    "image": "img/chiron.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "healing_wisdom",
        "name": "Healing Wisdom",
        "text": "He adds +3 DEF to one ally."
      },
      {
        "id": "master_of_heroes",
        "name": "Master of Heroes",
        "text": "If Achilles, Heracles, or Asclepius is on the field, that card gains +1 ATK while Chiron remains in play."
      }
    ]
  },
  {
    "id": "circe",
    "name": "Circe",
    "type": CARD_TYPES.DEITY,
    "cost": 4,
    "atk": 4,
    "def": 4,
    "title": "The enchantress of Aiaia",
    "source": "Odyssey - Homer",
    "description": "A powerful sorceress who lives alone on her island.",
    "image": "img/circe.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "transformation_potion",
        "name": "Transformation Potion",
        "text": "Like she did with Odysseus's men, Circe transforms one Human card into a harmless animal; it cannot attack or use abilities for 1 turn. She can use this ability twice on different targets."
      },
      {
        "id": "loves_weakness",
        "name": "Love's Weakness",
        "text": "If Odysseus is on the field, Circe loses 1 DEF each turn: her magic weakens before true love."
      }
    ]
  },
  {
    "id": "cupid",
    "name": "Cupid",
    "type": CARD_TYPES.DEITY,
    "cost": 3,
    "atk": 1,
    "def": 1,
    "title": "The mischievous god of love",
    "source": "Metamorphoses - Ovid",
    "description": "Son of Aphrodite, Cupid strikes hearts with his golden arrows, making gods and mortals fall in love, or lose control.",
    "image": "img/cupid.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "bound_hearts",
        "name": "Bound Hearts",
        "text": "Once per game, Cupid links one of your cards with one enemy card of your choice. Their DEF values are added together, but if one dies, both are destroyed."
      }
    ]
  },
  {
    "id": "daedalus",
    "name": "Daedalus",
    "type": CARD_TYPES.HUMAN,
    "cost": 5,
    "atk": 3,
    "def": 2,
    "title": "The master inventor of Crete",
    "source": "Bibliotheca - Apollodorus",
    "description": "A brilliant craftsman who built the Labyrinth for King Minos and later escaped using wings of his own design. His mind creates both prisons and solutions.",
    "image": "img/daedalus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "ingenious_design",
        "name": "Ingenious Design",
        "text": "Once per game, Daedalus improves a Human card, adding +3 ATK or DEF."
      },
      {
        "id": "labyrinth_mastery",
        "name": "Labyrinth Mastery",
        "text": "If Minotaur is on the opponent's field, Daedalus takes control of it."
      }
    ]
  },
  {
    "id": "daphne",
    "name": "Daphne",
    "type": CARD_TYPES.HUMAN,
    "cost": 2,
    "atk": 1,
    "def": 3,
    "title": "The nymph of the laurel tree",
    "source": "Metamorphoses - Ovid",
    "description": "A river nymph pursued by Apollo, she prayed to her father to save her and was turned into a laurel tree.",
    "image": "img/daphne.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "flight",
        "name": "Flight",
        "text": "When attacked by a God or Demigod, Daphne escapes: the attack does no damage. Usable once per game."
      }
    ]
  },
  {
    "id": "demeter",
    "name": "Demeter",
    "type": CARD_TYPES.DEITY,
    "cost": 2,
    "atk": 2,
    "def": 2,
    "title": "Goddess of harvest and fertility",
    "source": "Homeric Hymns - Anonymous",
    "description": "She makes the earth bloom and feeds humankind. When her daughter Persephone is in the underworld, she lets the world fall into winter; when Persephone returns, spring begins again.",
    "image": "img/Demeter.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "call_of_the_mother",
        "name": "Call of the Mother",
        "text": "Demeter brings her daughter back from the underworld. If Persephone is in the discard pile (ally or enemy), she returns to the field."
      }
    ]
  },
  {
    "id": "diomedes",
    "name": "Diomedes",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 4,
    "def": 4,
    "title": "The warrior who wounded gods",
    "source": "Iliad - Homer",
    "description": "One of the greatest Greek heroes at Troy, blessed by Athena to see through divine disguises. He wounded both Aphrodite and Ares in battle, the only mortal to harm two gods in one day.",
    "image": "img/diomedes.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "godslayer",
        "name": "Godslayer",
        "text": "Once per game, Diomedes can attack a God card and ignore half its defense."
      }
    ]
  },
  {
    "id": "dionysus",
    "name": "Dionysus",
    "type": CARD_TYPES.DEITY,
    "cost": 5,
    "atk": 1,
    "def": 4,
    "title": "God of wine, joy, and madness",
    "source": "The Bacchae - Euripides",
    "description": "He brings both ecstasy and chaos, teaching men to forget their worries through wine and dance.",
    "image": "img/dionysus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "bacchic_frenzy",
        "name": "Bacchic Frenzy",
        "text": "Once per game, when your opponent declares an attack, Dionysus drives the attacking card into wild madness: it attacks the weakest ally on their own field instead of its original target."
      }
    ]
  },
  {
    "id": "echidna",
    "name": "Echidna",
    "type": CARD_TYPES.CREATURE,
    "cost": 6,
    "atk": 5,
    "def": 3,
    "title": "The mother of monsters",
    "source": "Theogony - Hesiod",
    "description": "Half woman and half serpent, Echidna lives deep beneath the earth. She gave birth to the most terrifying creatures of Greece.",
    "image": "img/echidna.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "spawn_of_terror",
        "name": "Spawn of Terror",
        "text": "She may summon one monster from your deck or from your discard pile to your hand. Show your choice to your opponent and shuffle."
      },
      {
        "id": "monstrous_legacy",
        "name": "Monstrous Legacy",
        "text": "While Echidna is in play, all other Monster cards gain +1 ATK, even enemies'."
      }
    ]
  },
  {
    "id": "echo",
    "name": "Echo",
    "type": CARD_TYPES.HUMAN,
    "cost": 5,
    "atk": 1,
    "def": 3,
    "title": "The nymph who speaks in echoes",
    "source": "Metamorphoses - Ovid",
    "description": "A mountain nymph cursed by Hera to only repeat the words of others. She wanders unseen, answering every voice with an echo.",
    "image": "img/echo.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "mirror_voice",
        "name": "Mirror Voice",
        "text": "When played, Echo copies a special ability used on the field in the last turn (by either player) and applies it as her own. After using her ability, she loses 1 DEF per turn, her voice fades into silence."
      }
    ]
  },
  {
    "id": "eris",
    "name": "Eris",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 1,
    "def": 4,
    "title": "Goddess of discord and chaos",
    "source": "Iliad - Homer",
    "description": "She delights in conflict and confusion, bringing quarrels even among the gods.",
    "image": "img/eris.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "golden_apple_of_discord",
        "name": "Golden Apple of Discord",
        "text": "At the wedding of Peleus and Thetis, Eris threw a golden apple marked \"To the fairest.\" It made Hera, Athena, and Aphrodite fight, leading to the Trojan War. Make two enemy cards attack each other. Usable once per game."
      }
    ]
  },
  {
    "id": "eurydice",
    "name": "Eurydice",
    "type": CARD_TYPES.HUMAN,
    "cost": 2,
    "atk": 1,
    "def": 1,
    "title": "The lost bride of Orpheus",
    "source": "Metamorphoses - Ovid",
    "description": "Bitten by a serpent on her wedding day, Eurydice was taken to the Underworld. Her husband Orpheus tried to bring her back, but lost her forever when he turned to look behind him.",
    "image": "img/eurydice.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "return_from_shadows",
        "name": "Return from Shadows",
        "text": "Once per game, you may attack with one destroyed Human card that dies again soon afterwards."
      }
    ]
  },
  {
    "id": "furies",
    "name": "Furies",
    "type": CARD_TYPES.DEITY,
    "cost": 5,
    "atk": 5,
    "def": 5,
    "title": "Spirits of revenge and punishment",
    "source": "Oresteia - Aeschylus",
    "description": "Born from the blood of Uranus, the Furies pursue anyone guilty of murder, betrayal, or impiety. Their anger grows the longer justice is denied.",
    "image": "img/furies.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "curse_of_guilt",
        "name": "Curse of Guilt",
        "text": "When any player destroys a Human or Demigod card, the Furies appear to punish the crime. They immediately deal 3 damage to that card's controller."
      }
    ]
  },
  {
    "id": "gaia",
    "name": "Gaia",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 1,
    "def": 9,
    "title": "The Earth Mother, origin of all",
    "source": "Theogony - Hesiod",
    "description": "The personification of Earth itself, born from Chaos. She gave birth to Uranus, the mountains, and the sea. She is the grandmother of the Olympians.",
    "image": "img/gaia.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "earths_endurance",
        "name": "Earth's Endurance",
        "text": "Gaia can be destroyed only by sacrificing 3 cards (from the field or the hand) whose ATK points' sum is 9 or more. The earth itself cannot be easily broken."
      }
    ]
  },
  {
    "id": "hades",
    "name": "Hades",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 2,
    "def": 6,
    "title": "God of the underworld and the dead",
    "source": "Theogony - Hesiod",
    "description": "Brother of Zeus and Poseidon, he rules the realm of the dead with strict justice. He rarely leaves his dark kingdom, but his power reaches every soul.",
    "image": "img/hades.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "claim_the_dead",
        "name": "Claim the Dead",
        "text": "When any card dies, Hades gains +1 ATK permanently. Up to 9 points ATK."
      }
    ]
  },
  {
    "id": "hecate",
    "name": "Hecate",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 3,
    "def": 4,
    "title": "Goddess of magic and crossroads",
    "source": "Theogony - Hesiod",
    "description": "Guardian of the night and mistress of witchcraft, Hecate stands at every crossroads, seeing all paths and choices. She commands ghosts and shadows.",
    "image": "img/hecate.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "crossroads",
        "name": "Crossroads",
        "text": "When played, Hecate may exchange one of your cards already on the field with one of your opponent's cards. The change is permanent: both cards now fight for their new masters."
      }
    ]
  },
  {
    "id": "hector",
    "name": "Hector",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 4,
    "def": 4,
    "title": "Defender of Troy",
    "source": "Iliad - Homer",
    "description": "Prince of Troy and its greatest defender. Unlike Paris, Hector fights with honor. He killed Patroclus but was slain by Achilles in revenge.",
    "image": "img/hector.jpg",
    "tags": [
      "trojan"
    ],
    "abilities": [
      {
        "id": "defender_of_the_city",
        "name": "Defender of the City",
        "text": "While Hector is on the field, all other Trojan cards (Paris, Helen, Priam, Cassandra) gain +2 DEF."
      }
    ]
  },
  {
    "id": "helen",
    "name": "Helen",
    "type": CARD_TYPES.HUMAN,
    "cost": 1,
    "atk": 1,
    "def": 1,
    "title": "Queen of Sparta and Troy",
    "source": "Iliad - Homer",
    "description": "Daughter of Zeus and Leda, Helen's beauty was so divine that men and kings went to war for her. Wherever she goes, loyalty and reason collapse.",
    "image": "img/helen.jpg",
    "tags": [
      "female",
      "trojan",
      "demigod"
    ],
    "abilities": [
      {
        "id": "beauty_of_chaos",
        "name": "Beauty of Chaos",
        "text": "When Helen enters the field, both players must swap one random card from their hands: her presence confuses all hearts."
      }
    ]
  },
  {
    "id": "hephaestus",
    "name": "Hephaestus",
    "type": CARD_TYPES.DEITY,
    "cost": 4,
    "atk": 2,
    "def": 3,
    "title": "God of fire and the forge",
    "source": "Homeric Hymns - Anonymous",
    "description": "The divine blacksmith, cast from Olympus by Hera for being lame. He creates unbreakable weapons and magical objects for gods and heroes.",
    "image": "img/Hephaestus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "divine_forge",
        "name": "Divine Forge",
        "text": "Once per game, Hephaestus can create armor for one ally card, giving it +3 DEF permanently."
      }
    ]
  },
  {
    "id": "hera",
    "name": "Hera",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 5,
    "def": 6,
    "title": "Queen of the gods, protector of marriage",
    "source": "Theogony - Hesiod",
    "description": "She is famous for her jealousy and for punishing the lovers and children of Zeus.",
    "image": "img/hera.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "jealous_wrath",
        "name": "Jealous Wrath",
        "text": "Hera turns her rival into a beast, just as she changed Io into a cow and Callisto into a bear. She transforms a woman card into a 1/1. Usable once per game."
      }
    ]
  },
  {
    "id": "heracles",
    "name": "Heracles",
    "type": CARD_TYPES.HUMAN,
    "cost": 8,
    "atk": 7,
    "def": 7,
    "title": "Hero of strength and endurance",
    "source": "The Trachiniae - Sophocles",
    "description": "Son of Zeus and a mortal woman, he was forced by Hera to complete 12 impossible labors. His courage and strength made him the greatest of all heroes.",
    "image": "img/heracles.jpg",
    "tags": [
      "demigod"
    ],
    "abilities": [
      {
        "id": "master_of_beasts",
        "name": "Master of Beasts",
        "text": "He descended to Hades and brought Cerberus to the surface. Summon one defeated monster card back to fight for one turn, next turn. Once per game."
      }
    ]
  },
  {
    "id": "hermes",
    "name": "Hermes",
    "type": CARD_TYPES.DEITY,
    "cost": 5,
    "atk": 3,
    "def": 6,
    "title": "Messenger of the gods",
    "source": "Homeric Hymns - Anonymous",
    "description": "He moves faster than the wind, carrying Zeus's messages between Olympus, Earth, and the Underworld. Clever and quick, he protects merchants and thieves alike.",
    "image": "img/hermes.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "divine_speed",
        "name": "Divine Speed",
        "text": "Using his winged sandals, he can strike twice before the enemy reacts. He can attack two times in the same turn."
      }
    ]
  },
  {
    "id": "homer",
    "name": "Homer",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 2,
    "def": 5,
    "title": "The poet of heroes",
    "source": "Homer",
    "description": "The blind poet who sang of the wrath of Achilles and the long journey of Odysseus. His words give immortality to the deeds of gods and men.",
    "image": "img/homer.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "memory_of_the_odyssey",
        "name": "Memory of the Odyssey",
        "text": "When Homer is in play, the following heroes gain +1 DEF: Achilles, Odysseus, Ajax, Agamemnon, and Menelaus."
      }
    ]
  },
  {
    "id": "icarus",
    "name": "Icarus",
    "type": CARD_TYPES.HUMAN,
    "cost": 2,
    "atk": 2,
    "def": 1,
    "title": "The boy who flew too high",
    "source": "Metamorphoses - Ovid",
    "description": "Son of Daedalus, he escaped Crete on wings made of wax and feathers, but flew too close to the sun and fell into the sea.",
    "image": "img/icarus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "wax_wings",
        "name": "Wax Wings",
        "text": "Once per game, Icarus can double his ATK for one attack. After attacking, he is destroyed: his wings melt in the sun. Unless Daedalus is on the field."
      }
    ]
  },
  {
    "id": "iphigenia",
    "name": "Iphigenia",
    "type": CARD_TYPES.HUMAN,
    "cost": 1,
    "atk": 1,
    "def": 1,
    "title": "The sacrificed daughter",
    "source": "Bibliotheca - Apollodorus",
    "description": "Daughter of Agamemnon and Clytemnestra, Iphigenia was offered to Artemis so the winds would favor the Greek ships. Her sacrifice brought both sorrow and divine favor.",
    "image": "img/Iphigenia.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "martyrs_gift",
        "name": "Martyr's Gift",
        "text": "When Iphigenia dies, draw two cards: her sacrifice changes fate and grants insight from the gods."
      }
    ]
  },
  {
    "id": "iris",
    "name": "Iris",
    "type": CARD_TYPES.DEITY,
    "cost": 5,
    "atk": 1,
    "def": 4,
    "title": "Goddess of the rainbow",
    "source": "Iliad - Homer",
    "description": "The swift goddess who travels between heaven and earth, carrying messages through the rainbow's light. She brings peace where conflict begins.",
    "image": "img/iris.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "divine_message",
        "name": "Divine Message",
        "text": "When played, Iris lets you search your deck for any card, reveal it, add it to your hand, and then shuffle your deck."
      }
    ]
  },
  {
    "id": "jason",
    "name": "Jason",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 3,
    "def": 3,
    "title": "Leader of the Argonauts",
    "source": "Bibliotheca - Apollodorus",
    "description": "He led the quest for the Golden Fleece with the greatest heroes of his age. He won the fleece with Medea's magic, but later abandoned her for another woman.",
    "image": "img/jason.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "the_argonauts",
        "name": "The Argonauts",
        "text": "When Jason is played, you may search your deck for up to 2 Human cards and add them to your hand (his crew)."
      }
    ]
  },
  {
    "id": "midas",
    "name": "King Midas",
    "type": CARD_TYPES.HUMAN,
    "cost": 2,
    "atk": 1,
    "def": 3,
    "title": "The man with the golden touch",
    "source": "Metamorphoses - Ovid",
    "description": "Granted a wish by Dionysus, Midas wished that everything he touched would turn to gold, and doomed himself by that same gift.",
    "image": "img/midas.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "golden_touch",
        "name": "Golden Touch",
        "text": "Touch a random card from your opponent's hand; that card is turned to gold and instantly destroyed. After using this power, Midas dies at the end of your turn, unable to eat or drink what he has turned to gold."
      }
    ]
  },
  {
    "id": "kronos",
    "name": "Kronos",
    "type": CARD_TYPES.DEITY,
    "cost": 8,
    "atk": 9,
    "def": 5,
    "title": "The Titan of Time",
    "source": "Theogony - Hesiod",
    "description": "The ruler of the Golden Age, Kronos devoured his own children to prevent them from taking his throne. Time itself bends to his will.",
    "image": "img/kronos.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "devour_time",
        "name": "Devour Time",
        "text": "To use this power, you must sacrifice three God cards. He erases all cards on your opponent's field. Consumed by time."
      },
      {
        "id": "fall_of_the_titan",
        "name": "Fall of the Titan",
        "text": "If Zeus is on the field, Kronos loses 2 DEF."
      }
    ]
  },
  {
    "id": "medea",
    "name": "Medea",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 4,
    "def": 2,
    "title": "The betrayed sorceress",
    "source": "Medea - Euripides",
    "description": "A princess and powerful witch who betrayed her father and killed her brother to help Jason win the Golden Fleece. When he abandoned her, she murdered his new bride and their own children in revenge.",
    "image": "img/medea.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "ultimate_betrayal",
        "name": "Ultimate Betrayal",
        "text": "Once per game, Medea can kill the weakest card from your opponent's hand, like she killed her defenceless children."
      }
    ]
  },
  {
    "id": "medusa",
    "name": "Medusa",
    "type": CARD_TYPES.CREATURE,
    "cost": 5,
    "atk": 5,
    "def": 4,
    "title": "The cursed Gorgon",
    "source": "Metamorphoses - Ovid",
    "description": "Once a beautiful maiden, she was cursed by Athena and turned into a monster with snakes for hair.",
    "image": "img/medusa.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "petrifying_gaze",
        "name": "Petrifying Gaze",
        "text": "One enemy card cannot attack or use abilities for one turn. Usable once per game."
      },
      {
        "id": "perseus_mirror",
        "name": "Perseus' Mirror",
        "text": "If the opponent plays Perseus, Medusa passes to the opponent's hand."
      }
    ]
  },
  {
    "id": "menelaus",
    "name": "Menelaus",
    "type": CARD_TYPES.HUMAN,
    "cost": 5,
    "atk": 4,
    "def": 4,
    "title": "King of Sparta",
    "source": "Iliad - Homer",
    "description": "King of Sparta and husband of Helen, Menelaus fought for honor and vengeance when Paris took his wife to Troy. His wrath burns cold and relentless.",
    "image": "img/menelaus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "war_for_helen",
        "name": "War for Helen",
        "text": "If Helen is on the field, Menelaus gains +2 ATK; if Paris is on the field, Menelaus must attack him first."
      }
    ]
  },
  {
    "id": "minotaur",
    "name": "Minotaur",
    "type": CARD_TYPES.CREATURE,
    "cost": 5,
    "atk": 5,
    "def": 4,
    "title": "The beast of the Labyrinth",
    "source": "Bibliotheca - Apollodorus",
    "description": "Born from the curse of Minos, the Minotaur is a creature half man and half bull, trapped forever in the twisting Labyrinth beneath Crete. It lives only to hunt and kill, until the hero Theseus faces it.",
    "image": "img/minotaur.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "theseus_shadow",
        "name": "Theseus' Shadow",
        "text": "If Theseus is on the field, the Minotaur loses 2 DEF."
      },
      {
        "id": "rage_of_the_labyrinth",
        "name": "Rage of the Labyrinth",
        "text": "When the Minotaur attacks, it deals +2 extra damage, but loses 1 DEF after each attack: rage consumes its strength."
      }
    ]
  },
  {
    "id": "moirai",
    "name": "Moirai",
    "type": CARD_TYPES.DEITY,
    "cost": 9,
    "atk": 0,
    "def": 6,
    "title": "The Fates who rule destiny",
    "source": "Theogony - Hesiod",
    "description": "They are the three sisters: Clotho spins the thread of life, Lachesis measures it, and Atropos cuts it. No god or mortal can escape their design.",
    "image": "img/Moirai.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "cut_the_thread",
        "name": "Cut the Thread",
        "text": "Instantly destroy one enemy card, ignoring defense. Usable once per game."
      },
      {
        "id": "measure_of_fate",
        "name": "Measure of Fate",
        "text": "They can alter the length of destiny itself. One ally gains +3 DEF or one enemy loses 3 DEF."
      }
    ]
  },
  {
    "id": "naiads",
    "name": "Naiads",
    "type": CARD_TYPES.DEITY,
    "cost": 3,
    "atk": 1,
    "def": 1,
    "title": "The nymphs of the fresh waters",
    "source": "Theogony - Hesiod",
    "description": "Spirits of rivers and springs, the Naiads bring life wherever their waters flow. They protect nature and heal those who respect the purity of the streams.",
    "image": "img/naiads.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "healing_spring",
        "name": "Healing Spring",
        "text": "Add +3 DEF to one ally of your choice while this card is on the field."
      }
    ]
  },
  {
    "id": "nausicaa",
    "name": "Nausicaa",
    "type": CARD_TYPES.HUMAN,
    "cost": 1,
    "atk": 1,
    "def": 4,
    "title": "The princess of Phaeacia",
    "source": "Odyssey - Homer",
    "description": "Daughter of King Alcinous, she found the shipwrecked Odysseus and helped him reach safety without asking for anything in return.",
    "image": "img/nausicaa.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "pure_heart",
        "name": "Pure Heart",
        "text": "If Odysseus is on the field, both gain +1 DEF: their meeting is guided by the gods."
      }
    ]
  },
  {
    "id": "odysseus",
    "name": "Odysseus",
    "type": CARD_TYPES.HUMAN,
    "cost": 6,
    "atk": 3,
    "def": 5,
    "title": "King of Ithaca",
    "source": "Odyssey - Homer",
    "description": "The cleverest of Greek heroes, he built the Trojan Horse and wandered for ten years before reaching Ithaca. His mind is sharper than any sword.",
    "image": "img/odysseus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "voyage_of_ten_years",
        "name": "Voyage of Ten Years",
        "text": "If he'd be destroyed, he returns to your hand instead. Once per game."
      },
      {
        "id": "trojan_horse",
        "name": "Trojan Horse",
        "text": "The opponent shows their hand; every card with DEF lower than 3 is instantly destroyed. Once per card's life."
      }
    ]
  },
  {
    "id": "oedipus",
    "name": "Oedipus",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 5,
    "def": 3,
    "title": "The seeker of truth",
    "source": "Oedipus Rex - Sophocles",
    "description": "He solved the riddle of the Sphinx and saved Thebes, but his search for truth led him to a terrible discovery: he had killed his father and married his mother. His wisdom became his curse.",
    "image": "img/oedipus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "blind_insight",
        "name": "Blind Insight",
        "text": "If Oedipus destroys an enemy card, your opponent may draw one card: truth always comes at a cost."
      }
    ]
  },
  {
    "id": "orpheus",
    "name": "Orpheus",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 2,
    "def": 2,
    "title": "The poet who charmed the Underworld",
    "source": "Metamorphoses - Ovid",
    "description": "With his lyre and his voice, Orpheus could move trees, calm beasts, and soften the hearts of gods. He descended to Hades to bring back his beloved Eurydice.",
    "image": "img/orpheus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "song_of_life",
        "name": "Song of Life",
        "text": "When played, Orpheus may revive one destroyed Human card with half its DEF: his music defies death."
      }
    ]
  },
  {
    "id": "pandora",
    "name": "Pandora",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 4,
    "def": 4,
    "title": "The first woman and bringer of hope",
    "source": "Works and Days - Hesiod",
    "description": "Created by the gods and given a jar she was forbidden to open, Pandora's curiosity released all evils into the world, yet hope remained inside.",
    "image": "img/pandora.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "forbidden_jar",
        "name": "Forbidden Jar",
        "text": "When Pandora enters the field, all cards lose 1 DEF, symbolizing the release of chaos."
      },
      {
        "id": "hope_within",
        "name": "Hope Within",
        "text": "Once per game, she can add +2 DEF to one ally under attack, representing the last light left in the jar."
      }
    ]
  },
  {
    "id": "paris",
    "name": "Paris",
    "type": CARD_TYPES.HUMAN,
    "cost": 5,
    "atk": 4,
    "def": 3,
    "title": "The prince of Troy",
    "source": "Iliad - Homer",
    "description": "Prince of Troy, son of King Priam, Paris was chosen by the gods to judge who was the fairest: Hera, Athena, or Aphrodite. His choice changed the fate of the world.",
    "image": "img/paris.jpg",
    "tags": [
      "trojan"
    ],
    "abilities": [
      {
        "id": "apple_of_discord",
        "name": "Apple of Discord",
        "text": "Once per game, Paris steals one female Human card from his opponent's field. She may attack immediately, but returns to her original owner when Paris dies."
      }
    ]
  },
  {
    "id": "patroclus",
    "name": "Patroclus",
    "type": CARD_TYPES.HUMAN,
    "cost": 5,
    "atk": 4,
    "def": 4,
    "title": "The loyal companion of Achilles",
    "source": "Iliad - Homer",
    "description": "Achilles's closest friend and lover. He fought wearing his armor and was killed by Hector.",
    "image": "img/patroclus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "borrowed_armor",
        "name": "Borrowed Armor",
        "text": "Patroclus protects his beloved. He can take the damage meant for another card. He declares his intention after the opponent has declared the attacks."
      },
      {
        "id": "fallen_companion",
        "name": "Fallen Companion",
        "text": "If Patroclus dies while Achilles is on the field, Achilles gains +2 ATK for the rest of the game: his wrath is unleashed."
      }
    ]
  },
  {
    "id": "penelope",
    "name": "Penelope",
    "type": CARD_TYPES.HUMAN,
    "cost": 2,
    "atk": 1,
    "def": 3,
    "title": "The faithful queen of Ithaca",
    "source": "Odyssey - Homer",
    "description": "Wife of Odysseus, she waited twenty years for his return, weaving by day and unweaving by night to delay her suitors. Her patience became a symbol of loyalty and wisdom.",
    "image": "img/penelope.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "endless_weaving",
        "name": "Endless Weaving",
        "text": "During the opponent's turn, they list their attacks and she delays one attack against any Human or Demigod card for one turn. Usable once per game."
      }
    ]
  },
  {
    "id": "persephone",
    "name": "Persephone",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 4,
    "def": 4,
    "title": "Queen of the underworld",
    "source": "Homeric Hymns - Anonymous",
    "description": "Daughter of Demeter, she was taken by Hades to the underworld. Because she ate six pomegranate seeds, she must spend half the year below and half on Earth, bringing the cycle of seasons.",
    "image": "img/persephone.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "seeds_of_return",
        "name": "Seeds of Return",
        "text": "She can revive one defeated ally with half DEF. Usable once per game."
      }
    ]
  },
  {
    "id": "perseus",
    "name": "Perseus",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 4,
    "def": 4,
    "title": "Slayer of Medusa and savior of Andromeda",
    "source": "Bibliotheca - Apollodorus",
    "description": "Perseus defeated the Gorgon Medusa using Athena's shield and Hermes's winged sandals. Later, he saved Andromeda from a sea monster.",
    "image": "img/perseus.jpg",
    "tags": [
      "demigod"
    ],
    "abilities": [
      {
        "id": "head_of_medusa",
        "name": "Head of Medusa",
        "text": "Perseus carries the Gorgon's head as a weapon. He can petrify one enemy, making it unable to attack for one turn. Usable once per game."
      }
    ]
  },
  {
    "id": "philemon",
    "name": "Philemon & Baucis",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 1,
    "def": 2,
    "title": "The faithful hosts",
    "source": "Metamorphoses - Ovid",
    "description": "An old couple who welcomed Zeus and Hermes when all others refused. For their kindness, the gods spared them and transformed them into trees growing side by side forever.",
    "image": "img/philemon.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "sacred_hospitality",
        "name": "Sacred Hospitality",
        "text": "Once per game, they protect all allies from damage, adding +2 DEF until the beginning of your next turn: under their roof, no harm is done."
      }
    ]
  },
  {
    "id": "polyphemus",
    "name": "Polyphemus",
    "type": CARD_TYPES.CREATURE,
    "cost": 4,
    "atk": 5,
    "def": 3,
    "title": "The Cyclops of the cave",
    "source": "Odyssey - Homer",
    "description": "A giant with one eye, Polyphemus is the son of Poseidon. He trapped Odysseus and his men in a cave, eating them one by one, until the clever hero escaped by blinding him.",
    "image": "img/poliphemus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "crushing_strength",
        "name": "Crushing Strength",
        "text": "Polyphemus smashes enemies with boulders as he sees them. He can attack when played."
      }
    ]
  },
  {
    "id": "poseidon",
    "name": "Poseidon",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 6,
    "def": 6,
    "title": "God of the sea and earthquakes",
    "source": "Theogony - Hesiod",
    "description": "Brother of Zeus and Hades, Poseidon rules the oceans with his mighty trident. His anger can shake the earth and sink whole cities.",
    "image": "img/poseidon.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "tidal_wrath",
        "name": "Tidal Wrath",
        "text": "With a strike of his trident, Poseidon raises huge waves and storms. All enemy cards lose 3 ATK for 1 turn. Usable once per game."
      }
    ]
  },
  {
    "id": "priam",
    "name": "Priam",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 1,
    "def": 4,
    "title": "King of Troy, father of fifty sons",
    "source": "Iliad - Homer",
    "description": "The aged king of Troy, father of Hector and Paris. He begged Achilles for Hector's body in one of the most moving scenes in literature. He was killed when Troy fell.",
    "image": "img/priam.jpg",
    "tags": [
      "trojan"
    ],
    "abilities": [
      {
        "id": "royal_blood",
        "name": "Royal Blood",
        "text": "When played, both players have to show their hand and reveal how many Trojan cards are in their hands. Priam gains +1 DEF for each Trojan card on the field or in the hands."
      }
    ]
  },
  {
    "id": "prometheus",
    "name": "Prometheus",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 5,
    "def": 4,
    "title": "The Titan who gave fire to mankind",
    "source": "Theogony - Hesiod",
    "description": "He shaped men from clay and stole fire from Olympus to give them knowledge and progress. As punishment, Zeus chained him to a rock where an eagle ate his liver every day.",
    "image": "img/prometheus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "gift_of_fire",
        "name": "Gift of Fire",
        "text": "Reduce the cost of all Human cards to 1 for the next turn."
      }
    ]
  },
  {
    "id": "psyche",
    "name": "Psyche",
    "type": CARD_TYPES.HUMAN,
    "cost": 3,
    "atk": 1,
    "def": 3,
    "title": "The soul of love",
    "source": "Metamorphoses - Apuleius",
    "description": "A mortal woman so beautiful that even Aphrodite grew jealous. Loved by Cupid, she endured divine trials to prove that love is stronger than anything.",
    "image": "img/Psyche.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "heap_of_grains",
        "name": "Heap of Grains",
        "text": "One of the tasks she faced was to sort an impossible heap of mixed grains and, with the help of tiny ants, she succeeded. When Psyche is played, you may shuffle one enemy card back into your opponent's deck."
      }
    ]
  },
  {
    "id": "rhea",
    "name": "Rhea",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 3,
    "def": 7,
    "title": "Mother of the Olympians",
    "source": "Theogony - Hesiod",
    "description": "Wife of Kronos and mother of Zeus, Poseidon, Hades, Hera, Demeter, and Hestia. She saved Zeus from being devoured by hiding him and giving Kronos a stone wrapped in swaddling clothes instead.",
    "image": "img/rhea.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "mothers_protection",
        "name": "Mother's Protection",
        "text": "While Rhea is on the field, Zeus, Poseidon, and Hades gain +1 DEF."
      }
    ]
  },
  {
    "id": "sirens",
    "name": "Sirens",
    "type": CARD_TYPES.CREATURE,
    "cost": 3,
    "atk": 3,
    "def": 4,
    "title": "The singers of the sea",
    "source": "Odyssey - Homer",
    "description": "Half women and half birds, the Sirens lure sailors to their deaths with songs too beautiful to resist. Even Odysseus had to be tied to his ship's mast to survive their voices.",
    "image": "img/sirens.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "song_of_temptation",
        "name": "Song of Temptation",
        "text": "Once per game, choose two Human or Demigod cards. Those cards cannot attack for one turn, their mind is trapped by the song. Odysseus is immune."
      }
    ]
  },
  {
    "id": "sisyphus",
    "name": "Sisyphus",
    "type": CARD_TYPES.HUMAN,
    "cost": 4,
    "atk": 2,
    "def": 1,
    "title": "The eternal laborer",
    "source": "Odyssey - Homer",
    "description": "King of Corinth, he tricked Death itself, and for his deceit, the gods condemned him to roll a boulder uphill for all eternity. His struggle never ends, nor does his punishment.",
    "image": "img/sisyphus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "endless_effort",
        "name": "Endless Effort",
        "text": "He attacks all the cards on the enemy field and doesn't die unless attacked directly. He keeps pushing the stone, again and again."
      }
    ]
  },
  {
    "id": "sphinx",
    "name": "Sphinx",
    "type": CARD_TYPES.CREATURE,
    "cost": 5,
    "atk": 5,
    "def": 5,
    "title": "The guardian of riddles",
    "source": "Oedipus Rex - Sophocles",
    "description": "A creature with the body of a lion, the wings of an eagle, and the face of a woman. She asks deadly riddles to all who pass, devouring those who fail to answer.",
    "image": "img/sphynx.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "riddle_of_doom",
        "name": "Riddle of Doom",
        "text": "Once per game, choose one enemy card. That card cannot attack until its controller discards a card of their choice from the field."
      }
    ]
  },
  {
    "id": "telemachus",
    "name": "Telemachus",
    "type": CARD_TYPES.HUMAN,
    "cost": 1,
    "atk": 1,
    "def": 3,
    "title": "Prince of Ithaca",
    "source": "Odyssey - Homer",
    "description": "Son of Odysseus and Penelope, Telemachus guarded Ithaca and his mother's honor while waiting for his father's return.",
    "image": "img/telemachus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "protector_of_women",
        "name": "Protector of Women",
        "text": "If there are Human female cards on your field, your opponent must attack Telemachus first before they can attack any of them."
      }
    ]
  },
  {
    "id": "theseus",
    "name": "Theseus",
    "type": CARD_TYPES.HUMAN,
    "cost": 5,
    "atk": 4,
    "def": 5,
    "title": "Slayer of the Minotaur, king of Athens",
    "source": "Bibliotheca - Apollodorus",
    "description": "He defeated the Minotaur in the Labyrinth of Crete and later became king of Athens. Guided by Ariadne's thread, he escaped the maze and brought peace to his city.",
    "image": "img/theseus.jpg",
    "tags": [
      "demigod"
    ],
    "abilities": [
      {
        "id": "labyrinth_duel",
        "name": "Labyrinth Duel",
        "text": "Theseus gains strength when facing monsters. If attacked by a Monster card, he deals +3 damage. If he is the one attacking a Monster card, he deals +1."
      }
    ]
  },
  {
    "id": "thetis",
    "name": "Thetis",
    "type": CARD_TYPES.DEITY,
    "cost": 7,
    "atk": 3,
    "def": 6,
    "title": "Sea nymph and mother of Achilles",
    "source": "Iliad - Homer",
    "description": "A sea goddess among the Nereids, Thetis could change her shape at will. She dipped her son Achilles in the River Styx to make him nearly invulnerable, leaving only his heel untouched.",
    "image": "img/thetis.jpg",
    "tags": [
      "female"
    ],
    "abilities": [
      {
        "id": "divine_protection",
        "name": "Divine Protection",
        "text": "Once per game, Thetis grants immunity to damage for one turn to any Demigod card: the gift of the Styx."
      }
    ]
  },
  {
    "id": "uranus",
    "name": "Uranus",
    "type": CARD_TYPES.DEITY,
    "cost": 6,
    "atk": 7,
    "def": 5,
    "title": "The Sky Father, first ruler",
    "source": "Theogony - Hesiod",
    "description": "The personification of the sky, father of the Titans. He imprisoned his children in Tartarus until his son Kronos overthrew him with a sickle, ending his reign.",
    "image": "img/uranus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "castration",
        "name": "Castration",
        "text": "If Kronos attacks Uranus, Uranus is instantly destroyed regardless of stats, and Kronos becomes the new ruler (gains +2 ATK permanently)."
      }
    ]
  },
  {
    "id": "zeus",
    "name": "Zeus",
    "type": CARD_TYPES.DEITY,
    "cost": 9,
    "atk": 9,
    "def": 6,
    "title": "King of the gods, ruler of the sky",
    "source": "Theogony - Hesiod",
    "description": "He is the most powerful of all gods and often intervenes in human affairs.",
    "image": "img/zeus.jpg",
    "tags": [],
    "abilities": [
      {
        "id": "olympian_thunderbolt",
        "name": "Olympian Thunderbolt",
        "text": "Zeus throws his lightning and kills, ignoring defense. Usable once per game."
      },
      {
        "id": "transformation",
        "name": "Transformation",
        "text": "Zeus took many forms to reach mortals unseen (a swan, a bull, or even a golden shower). He can dodge one attack by transforming. Once per game."
      }
    ]
  }
];
