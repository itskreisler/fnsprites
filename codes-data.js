/**
 * @file codes-data.js
 * @description Master data configuration sheet for lobby hack codes and categories.
 *
 * ORDER: newest code first. Within each category the newest code comes first,
 * so `renderCodes()` in codes-app.js lists them from most recent to oldest.
 */

/**
 * Category title mapping for code rewards.
 * @type {Record<string, string>}
 */
const codeCategories = {
    cat1: "Sprites",
    cat2: "Loading Screens & Locker Items",
    cat3: "Consumable Resources",
    cat4: "Fun Effects",
    cat5: "Miscellaneous"
};

/**
 * Category ordering preference.
 * @type {string[]}
 */
const CATEGORY_ORDER = ["cat1", "cat2", "cat3", "cat4", "cat5"];

/**
 * Code data sheet definition.
 * @type {Array<{code: string, reward: string, internalreward: string|null, category: string, active: boolean}>}
 */
const baseCodes = [
    // --- cat1: Sprites (newest -> oldest)
    { code: "9YEARS", reward: "9th Birthday Sprite Spray", internalreward: null, category: "cat1", active: true },
    { code: "JONESYISGOLDEN", reward: "JONESY Golden Sprite", internalreward: "jonesy_gold", category: "cat1", active: true },
    { code: "Born2Play", reward: "Cheat Master Adventure Sprite", internalreward: "adventure_cheat", category: "cat1", active: true },
    { code: "8BitBlast", reward: "Cheat Master 8-Bit Sprite", internalreward: "8bit_cheat", category: "cat1", active: true },
    { code: "Play4All", reward: "Cheat Master Jonesy Sprite", internalreward: "jonesy_cheat", category: "cat1", active: true },
    { code: "IWannaFlyHigh", reward: "Cheat Master Tails Sprite", internalreward: "tails_cheat", category: "cat1", active: true },
    { code: "GottaGoFast", reward: "Cheat Master Sonic Sprite", internalreward: "sonic_cheat", category: "cat1", active: true },
    { code: "GatherAndCraft", reward: "Cheat Master Bush Sprite (Requires Quest Completion)", internalreward: "bush_cheat", category: "cat1", active: true },

    // --- cat2: Loading Screens & Locker Items (newest -> oldest)
    { code: "WeAreTheWorldChampionsToday", reward: "FNCS Back Bling", internalreward: null, category: "cat2", active: true },
    { code: "SAYH12WR1X3L", reward: "Wrixel's Hero Portrait Spray", internalreward: null, category: "cat2", active: true },
    { code: "ReachYourImpossible", reward: "Block Party Loading Screen", internalreward: null, category: "cat2", active: true },
    { code: "BeMoreAlien", reward: "Override Ready Loading Screen", internalreward: null, category: "cat2", active: true },

    // --- cat3: Consumable Resources (newest -> oldest)
    { code: "VeryScaryPumpkin", reward: "3 Pumpkin Baskets", internalreward: null, category: "cat3", active: true },
    { code: "runSystemOverride", reward: "5,000 Sprite Dust (Requires Geno Quest Completion)", internalreward: null, category: "cat3", active: true },
    { code: "ImTheRealEdgelord", reward: "5,000 Sprite Dust (Requires Wrixel Quest Completion)", internalreward: null, category: "cat3", active: true },
    { code: "IThinkTheKeyFoundMeChat", reward: "1 Extraction Accelerator", internalreward: null, category: "cat3", active: true },
    { code: "BoneRattler", reward: "4 Spicy Tacos", internalreward: null, category: "cat3", active: true },
    { code: "WhoCrackedTheCode", reward: "40,000 XP", internalreward: null, category: "cat3", active: true },
    { code: "DustySprites", reward: "5,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "AlmostScaringSeason", reward: "2 Cheat Code Locators", internalreward: null, category: "cat3", active: true },
    { code: "MagicIsReal", reward: "5,000 Sprite Dust (Requires Bastian Quest Completion)", internalreward: null, category: "cat3", active: true },
    { code: "ChatFindMeAnotherCode", reward: "2 Cheat Code Locators", internalreward: null, category: "cat3", active: true },
    { code: "BLINKYINKYPINKYCLYDE", reward: "5,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "NOCTURNEOP55N1", reward: "2 Extraction Accelerators", internalreward: null, category: "cat3", active: true },
    { code: "DestinyAwaits", reward: "2 Llama Supply Drops", internalreward: null, category: "cat3", active: true },
    { code: "PLAYTOLEVELUP", reward: "2,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "BeamMeUp", reward: "2 Extraction Accelerators", internalreward: null, category: "cat3", active: true },
    { code: "DustInTheWind", reward: "5,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "NoProLlama", reward: "1 Llama Supply Drop", internalreward: null, category: "cat3", active: true },
    { code: "whereisthedustytree", reward: "5,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "ChatWhereDoYouFindTheKey", reward: "2 Extraction Accelerators", internalreward: null, category: "cat3", active: true },
    { code: "INVALIDCHEAT", reward: "2 Cheat Code Locators", internalreward: null, category: "cat3", active: true },
    { code: "Abgestaubt", reward: "2,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "Perlimpinpin", reward: "2,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "Chispambo", reward: "2,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "Magilume", reward: "2,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "OverrideXP", reward: "40,000 XP", internalreward: null, category: "cat3", active: true },
    { code: "O2Override", reward: "1 Llama Supply Drop & 5 Portable Extractors", internalreward: null, category: "cat3", active: true },
    { code: "PerfectOrder", reward: "4 Spicy Tacos", internalreward: null, category: "cat3", active: true },
    { code: "FindItChat", reward: "2 Cheat Code Locators", internalreward: null, category: "cat3", active: true },
    { code: "SurviveTheNight", reward: "2 Cheat Code Locators", internalreward: null, category: "cat3", active: true },
    { code: "TakeYourHeart", reward: "2 Extraction Accelerators", internalreward: null, category: "cat3", active: true },
    { code: "H0P0NVC", reward: "2,000 Sprite Dust", internalreward: null, category: "cat3", active: true },
    { code: "YourThoughtsAreMine", reward: "5,000 Sprite Dust (Requires Quest Completion - Known Issue)", internalreward: null, category: "cat3", active: true },

    // --- cat4: Fun Effects (newest -> oldest)
    { code: "s7h-50p-r03", reward: "Voice and screen glitches", internalreward: null, category: "cat4", active: true },
    { code: "PUMPKINSPICELIFE", reward: "Turns you into a pumpkin.", internalreward: null, category: "cat4", active: true },
    { code: "CrowsAreAfraid", reward: "Turns you into a scarecrow.", internalreward: null, category: "cat4", active: true },
    { code: "POWEROUT", reward: "Five Nights at Freddy's jumpscare", internalreward: null, category: "cat4", active: true },
    { code: "BRB", reward: "Turns you into a toilet.", internalreward: null, category: "cat4", active: true },
    { code: "InsertCoinToContinue", reward: "Turns you into an arcade machine.", internalreward: null, category: "cat4", active: true },
    { code: "LetsBlockAndRoll", reward: "Turns you into a Tetrimino.", internalreward: null, category: "cat4", active: true },
    { code: "DontBlockMe", reward: "Turns you into a Tetrimino.", internalreward: null, category: "cat4", active: true }
];
