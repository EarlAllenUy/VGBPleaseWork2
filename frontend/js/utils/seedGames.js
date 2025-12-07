import { db } from '../config/firebase.js';

const games = [
  {
    gameId: "gta6",
    title: "Grand Theft Auto VI",
    description: "The next evolution of the legendary open-world series.",
    platform: "PS5, Xbox Series X|S, PC",
    genre: "Action, Open World",
    releaseDate: "2025-12-31",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "zelda_eow",
    title: "The Legend of Zelda: Echoes of Wisdom",
    description: "Princess Zelda takes the lead in this new top-down adventure.",
    platform: "Nintendo Switch",
    genre: "Action-Adventure",
    releaseDate: "2024-09-26",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "dragonage_veilguard",
    title: "Dragon Age: The Veilguard",
    description: "A single-player fantasy RPG from BioWare.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "RPG",
    releaseDate: "2024-10-31",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "silenthills_f",
    title: "Silent Hills f",
    description: "A new psychological horror experience by Kojima Productions.",
    platform: "PS5, PC",
    genre: "Horror",
    releaseDate: "2025-08-08",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "ff7_rebirth",
    title: "Final Fantasy VII Rebirth",
    description: "The second chapter in the FF7 remake trilogy.",
    platform: "PS5",
    genre: "RPG",
    releaseDate: "2024-02-29",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "blackmyth_wukong",
    title: "Black Myth: Wukong",
    description: "An action RPG based on Journey to the West.",
    platform: "PC, PS5",
    genre: "Action RPG",
    releaseDate: "2024-08-20",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "starwars_outlaws",
    title: "Star Wars Outlaws",
    description: "Open-world adventure in the Star Wars universe.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "Action-Adventure",
    releaseDate: "2024-08-30",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "metaphor_refantazio",
    title: "Metaphor: ReFantazio",
    description: "A fantasy RPG from the creators of Persona.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "RPG",
    releaseDate: "2024-10-11",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "assassinscreed_shadows",
    title: "Assassin's Creed Shadows",
    description: "Feudal Japan awaits with dual protagonists.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "Action-Adventure, Stealth",
    releaseDate: "2024-11-15",
    upcoming: false,
    released: true,
    imageBase64: ""
  },
  {
    gameId: "kingdomcome2",
    title: "Kingdom Come: Deliverance II",
    description: "Medieval Bohemia returns — bigger and more brutal.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "RPG, Open World",
    releaseDate: "2025-02-11",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "deathstranding2",
    title: "Death Stranding 2: On The Beach",
    description: "Hideo Kojima's next masterpiece.",
    platform: "PS5",
    genre: "Action, Adventure",
    releaseDate: "2025-12-31",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "ghost_yotei",
    title: "Ghost of Yōtei",
    description: "Sequel to Ghost of Tsushima set 300 years later.",
    platform: "PS5, PC",
    genre: "Action-Adventure",
    releaseDate: "2025-12-31",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "marvels_wolverine",
    title: "Marvel's Wolverine",
    description: "Insomniac's take on the clawed mutant.",
    platform: "PS5",
    genre: "Action",
    releaseDate: "2026-12-31",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "doom_darkages",
    title: "DOOM: The Dark Ages",
    description: "Medieval DOOM with dragons and mechs.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "FPS",
    releaseDate: "2025-12-31",
    upcoming: true,
    released: false,
    imageBase64: ""
  },
  {
    gameId: "eldenring_nightreign",
    title: "Elden Ring: Nightreign",
    description: "Co-op survival action in the Lands Between.",
    platform: "PC, PS5, Xbox Series X|S",
    genre: "Action, Survival",
    releaseDate: "2025-12-31",
    upcoming: true,
    released: false,
    imageBase64: ""
  }
];

const seed = async () => {
  console.log('Seeding 15 games...');
  for (const game of games) {
    await db.ref(`games/${game.gameId}`).set(game);
    console.log(`Added: ${game.title}`);
  }
  console.log('All games seeded successfully!');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});