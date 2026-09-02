// Curated word list for generating/suggesting readable staff API key passphrases (see
// lib/crypto.ts generateApiKey and components/SuggestKeyButton.tsx). Common, short (3-8 letter),
// unambiguous lowercase English words -- no hyphens, apostrophes, or easily-confused spellings.
// Plain data, no secrets -- safe to import from both server code and client components.
//
// Deduped at module load (RAW_WORDS may contain accidental repeats across categories below) so
// the exported list is guaranteed unique without needing hand-perfect curation.

const RAW_WORDS = [
  // animals
  "tiger", "lion", "panda", "otter", "beaver", "rabbit", "fox", "wolf", "bear", "deer",
  "moose", "elk", "bison", "camel", "zebra", "horse", "donkey", "mule", "goat", "sheep",
  "lamb", "cow", "bull", "pig", "boar", "dog", "puppy", "cat", "kitten", "mouse",
  "rat", "squirrel", "chipmunk", "hedgehog", "badger", "skunk", "raccoon", "possum", "koala", "kangaroo",
  "wombat", "sloth", "monkey", "gorilla", "chimp", "baboon", "lemur", "elephant", "rhino", "hippo",
  "giraffe", "cheetah", "leopard", "jaguar", "panther", "lynx", "cougar", "hyena", "jackal", "coyote",
  "seal", "walrus", "dolphin", "whale", "shark", "orca", "manatee", "otterhound", "ferret", "weasel",
  "mink", "stoat", "mongoose", "armadillo", "anteater", "porcupine", "gopher", "vole", "shrew", "bat",
  "iguana", "gecko", "chameleon", "lizard", "newt", "toad", "frog", "turtle", "tortoise", "crocodile",
  "alligator", "python", "cobra", "viper", "boa", "snake",

  // birds
  "eagle", "hawk", "falcon", "osprey", "kite", "vulture", "owl", "raven", "crow", "magpie",
  "jay", "sparrow", "finch", "robin", "wren", "swallow", "swift", "martin", "lark", "thrush",
  "starling", "cardinal", "oriole", "warbler", "chickadee", "nuthatch", "woodpecker", "kingfisher", "heron", "egret",
  "stork", "crane", "ibis", "flamingo", "pelican", "gull", "tern", "puffin", "penguin", "swan",
  "goose", "duck", "mallard", "teal", "quail", "pheasant", "partridge", "grouse", "turkey", "peacock",

  // fish and sea life
  "salmon", "trout", "bass", "perch", "carp", "cod", "tuna", "marlin", "swordfish", "herring",
  "mackerel", "sardine", "anchovy", "eel", "catfish", "pike", "guppy", "goldfish", "koi", "octopus",
  "squid", "clam", "oyster", "mussel", "shrimp", "crab", "lobster", "starfish", "jellyfish", "urchin",

  // insects
  "ant", "bee", "wasp", "hornet", "beetle", "ladybug", "firefly", "cricket", "grasshopper", "mantis",
  "moth", "butterfly", "dragonfly", "cicada", "termite", "gnat", "aphid", "mosquito", "spider", "scorpion",

  // plants and trees
  "oak", "maple", "birch", "willow", "elm", "ash", "beech", "cedar", "pine", "spruce",
  "fir", "redwood", "sequoia", "cypress", "juniper", "poplar", "aspen", "sycamore", "walnut", "chestnut",
  "hickory", "hazel", "alder", "magnolia", "dogwood", "cherry", "peach", "plum", "apple", "pear",
  "fern", "moss", "ivy", "vine", "shrub", "bush", "hedge", "reed", "rush", "bamboo",
  "palm", "cactus", "aloe", "clover", "thistle", "nettle", "dandelion", "sagebrush", "lichen", "algae",

  // flowers
  "rose", "tulip", "daisy", "lily", "orchid", "iris", "violet", "poppy", "peony", "dahlia",
  "aster", "zinnia", "petunia", "marigold", "jasmine", "lavender", "lotus", "hibiscus", "camellia", "azalea",
  "crocus", "daffodil", "hyacinth", "gardenia", "primrose", "buttercup", "carnation", "chrysanthemum", "sunflower", "bluebell",

  // fruits
  "banana", "orange", "lemon", "lime", "grape", "melon", "mango", "papaya", "guava", "kiwi",
  "fig", "date", "apricot", "nectarine", "pomegranate", "coconut", "pineapple", "cranberry", "blueberry", "raspberry",
  "blackberry", "strawberry", "currant", "gooseberry", "mulberry", "persimmon", "quince", "tangerine", "grapefruit", "avocado",

  // vegetables
  "carrot", "potato", "onion", "garlic", "celery", "spinach", "lettuce", "cabbage", "broccoli", "cauliflower",
  "pepper", "cucumber", "zucchini", "squash", "pumpkin", "radish", "turnip", "beet", "corn", "pea",
  "bean", "lentil", "chickpea", "artichoke", "asparagus", "kale", "leek", "shallot", "parsnip", "yam",

  // foods and dishes
  "bread", "toast", "bagel", "muffin", "pancake", "waffle", "cookie", "biscuit", "cracker", "pretzel",
  "noodle", "pasta", "rice", "cereal", "oatmeal", "porridge", "soup", "stew", "curry", "salad",
  "sandwich", "burger", "pizza", "taco", "burrito", "dumpling", "sushi", "cheese", "butter", "yogurt",
  "cream", "honey", "syrup", "sugar", "salt", "pepper", "spice", "herb", "sauce", "gravy",
  "broth", "pickle", "jam", "jelly", "candy", "chocolate", "caramel", "custard", "pudding", "pastry",

  // colors
  "amber", "crimson", "scarlet", "maroon", "coral", "salmon", "peach", "gold", "silver", "bronze",
  "copper", "ivory", "pearl", "jade", "emerald", "sapphire", "ruby", "topaz", "amethyst", "indigo",
  "violet", "lavender", "lilac", "magenta", "turquoise", "teal", "cyan", "azure", "cobalt", "navy",
  "olive", "khaki", "beige", "tan", "brown", "chestnut", "rust", "mustard", "lemon", "cream",

  // weather and nature
  "storm", "thunder", "lightning", "rain", "drizzle", "shower", "mist", "fog", "haze", "cloud",
  "breeze", "wind", "gale", "gust", "frost", "snow", "sleet", "hail", "ice", "dew",
  "rainbow", "sunshine", "sunrise", "sunset", "twilight", "dawn", "dusk", "moonlight", "starlight", "aurora",
  "tide", "wave", "current", "stream", "creek", "brook", "river", "lake", "pond", "spring",

  // geography and landforms
  "mountain", "valley", "canyon", "plateau", "hill", "ridge", "cliff", "peak", "summit", "slope",
  "meadow", "prairie", "plain", "field", "forest", "jungle", "desert", "oasis", "island", "peninsula",
  "coast", "shore", "beach", "bay", "cove", "harbor", "reef", "cave", "cavern", "glacier",
  "volcano", "crater", "delta", "marsh", "swamp", "wetland", "tundra", "savanna", "steppe", "highland",

  // minerals gems and metals
  "quartz", "granite", "marble", "slate", "basalt", "obsidian", "flint", "chalk", "clay", "sand",
  "gravel", "pebble", "boulder", "crystal", "diamond", "garnet", "opal", "onyx", "jasper", "agate",
  "iron", "steel", "brass", "tin", "zinc", "nickel", "platinum", "titanium", "aluminum", "cobalt",

  // body parts
  "hand", "finger", "thumb", "palm", "wrist", "elbow", "shoulder", "neck", "chin", "cheek",
  "brow", "temple", "ankle", "heel", "knee", "shin", "calf", "hip", "waist", "chest",

  // clothing
  "jacket", "sweater", "scarf", "glove", "mitten", "hat", "cap", "beanie", "boot", "sandal",
  "sneaker", "slipper", "sock", "belt", "buckle", "button", "zipper", "collar", "sleeve", "pocket",
  "vest", "coat", "cloak", "cape", "shawl", "apron", "robe", "gown", "tunic", "kilt",

  // household objects
  "lamp", "candle", "lantern", "mirror", "window", "curtain", "carpet", "rug", "blanket", "pillow",
  "cushion", "basket", "crate", "barrel", "bucket", "kettle", "teapot", "mug", "cup", "saucer",
  "plate", "bowl", "platter", "tray", "spoon", "fork", "knife", "ladle", "whisk", "spatula",
  "broom", "mop", "sponge", "towel", "napkin", "clock", "calendar", "frame", "shelf", "drawer",
  "cabinet", "closet", "hanger", "hook", "latch", "hinge", "handle", "knob", "switch", "socket",
  "cushion", "quilt", "sheet", "mattress", "hammock", "trunk", "chest", "vase", "urn", "jar",

  // furniture
  "chair", "table", "desk", "bench", "stool", "couch", "sofa", "recliner", "bookcase", "wardrobe",
  "dresser", "cradle", "crib", "bunk", "hutch", "sideboard", "ottoman", "rocker", "stand", "rack",

  // tools
  "hammer", "wrench", "screwdriver", "pliers", "chisel", "saw", "drill", "level", "clamp", "vise",
  "anvil", "file", "rasp", "sander", "plane", "axe", "hatchet", "shovel", "spade", "rake",
  "hoe", "trowel", "pickaxe", "crowbar", "ladder", "scaffold", "bolt", "screw", "nail", "rivet",
  "gasket", "washer", "spring", "gear", "pulley", "lever", "piston", "cylinder", "valve", "nozzle",

  // vehicles
  "wagon", "carriage", "cart", "sled", "sleigh", "bicycle", "tricycle", "scooter", "skateboard", "canoe",
  "kayak", "raft", "sailboat", "yacht", "ferry", "barge", "tugboat", "submarine", "glider", "blimp",
  "rocket", "shuttle", "trailer", "caravan", "tractor", "bulldozer", "crane", "forklift", "van", "truck",

  // music instruments
  "guitar", "violin", "cello", "viola", "harp", "banjo", "mandolin", "ukulele", "piano", "organ",
  "flute", "clarinet", "oboe", "bassoon", "trumpet", "trombone", "tuba", "horn", "saxophone", "drum",
  "cymbal", "tambourine", "maraca", "xylophone", "marimba", "harmonica", "accordion", "bagpipe", "chime", "bell",

  // sports and games
  "soccer", "hockey", "cricket", "rugby", "tennis", "badminton", "squash", "golf", "archery", "fencing",
  "boxing", "wrestling", "judo", "karate", "gymnastics", "diving", "surfing", "skiing", "skating", "sledding",
  "bowling", "billiards", "darts", "chess", "checkers", "domino", "puzzle", "marble", "kite", "yoyo",

  // professions
  "farmer", "baker", "butcher", "carpenter", "mason", "plumber", "electrician", "painter", "tailor", "cobbler",
  "weaver", "potter", "blacksmith", "jeweler", "barber", "chef", "waiter", "cashier", "clerk", "teacher",
  "student", "doctor", "nurse", "dentist", "surgeon", "pharmacist", "engineer", "architect", "pilot", "sailor",
  "captain", "soldier", "guard", "officer", "detective", "lawyer", "judge", "banker", "accountant", "manager",
  "director", "editor", "writer", "poet", "artist", "sculptor", "dancer", "actor", "singer", "musician",

  // buildings and places
  "castle", "palace", "cottage", "cabin", "lodge", "manor", "villa", "bungalow", "tower", "fortress",
  "bridge", "tunnel", "harbor", "port", "market", "plaza", "square", "garden", "orchard", "vineyard",
  "farm", "ranch", "stable", "barn", "silo", "mill", "factory", "workshop", "studio", "gallery",
  "museum", "library", "chapel", "temple", "shrine", "monastery", "academy", "college", "campus", "stadium",

  // time words
  "morning", "evening", "midnight", "noon", "sunrise", "sunset", "season", "autumn", "winter", "summer",
  "spring", "century", "decade", "moment", "instant", "epoch", "era", "cycle", "phase", "interval",

  // shapes
  "circle", "square", "triangle", "rectangle", "pentagon", "hexagon", "octagon", "sphere", "cube", "cylinder",
  "cone", "pyramid", "prism", "spiral", "curve", "diamond", "oval", "crescent", "diagonal", "parallel",

  // emotions and simple adjectives
  "happy", "joyful", "cheerful", "gentle", "calm", "peaceful", "brave", "bold", "eager", "curious",
  "clever", "wise", "kind", "honest", "loyal", "patient", "humble", "proud", "graceful", "lively",
  "vivid", "bright", "shiny", "glossy", "smooth", "silky", "soft", "warm", "cozy", "fresh",
  "crisp", "clean", "clear", "sharp", "sturdy", "solid", "sturdy", "steady", "swift", "quick",
  "quiet", "silent", "gentle", "mild", "tender", "tough", "rugged", "rustic", "modern", "classic",
  "ancient", "royal", "noble", "grand", "mighty", "great", "vast", "broad", "narrow", "slim",
  "tall", "short", "deep", "shallow", "wide", "long", "round", "flat", "curved", "straight",
  "golden", "silver", "velvet", "cotton", "woolen", "wooden", "stone", "crystal", "misty", "sunny",
  "cloudy", "windy", "rainy", "snowy", "frosty", "chilly", "breezy", "humid", "dusty", "muddy",
  "rocky", "sandy", "grassy", "leafy", "shady", "sunlit", "starry", "moonlit", "cosmic", "stellar",

  // simple verbs (as nouns/gerunds where useful in a phrase)
  "wander", "explore", "discover", "journey", "voyage", "travel", "roam", "drift", "glide", "soar",
  "climb", "leap", "jump", "sprint", "dash", "race", "chase", "gather", "collect", "harvest",
  "build", "craft", "forge", "carve", "sculpt", "paint", "sketch", "draw", "weave", "stitch",
  "bake", "brew", "roast", "grill", "simmer", "blend", "mix", "whisk", "pour", "spread",
  "plant", "grow", "bloom", "blossom", "sprout", "harvest", "cultivate", "nurture", "shelter", "protect",
  "guard", "defend", "rescue", "shield", "watch", "observe", "listen", "whisper", "echo", "hum",
  "sing", "dance", "play", "laugh", "smile", "dream", "wish", "hope", "trust", "believe",
  "create", "invent", "design", "shape", "mold", "polish", "sharpen", "repair", "mend", "restore",

  // abstract nouns
  "wisdom", "courage", "harmony", "balance", "wonder", "mystery", "legend", "story", "fable", "myth",
  "riddle", "puzzle", "secret", "treasure", "fortune", "destiny", "journey", "quest", "voyage", "horizon",
  "compass", "anchor", "beacon", "lantern", "torch", "flame", "spark", "ember", "glow", "shimmer",

  // space and astronomy
  "planet", "comet", "meteor", "galaxy", "nebula", "orbit", "satellite", "asteroid", "eclipse", "solstice",
  "equinox", "zenith", "horizon", "cosmos", "universe", "stardust", "moonbeam", "sunbeam", "twilight", "daybreak",

  // school and office items
  "pencil", "crayon", "marker", "eraser", "ruler", "compass", "notebook", "journal", "folder", "binder",
  "stapler", "envelope", "stamp", "ledger", "chalk", "blackboard", "textbook", "atlas", "globe", "abacus",

  // kitchen items
  "skillet", "saucepan", "griddle", "colander", "grater", "peeler", "rolling", "cutting", "apron", "oven",
  "stove", "toaster", "blender", "mixer", "grinder", "thermos", "pitcher", "carafe", "canister", "pantry",

  // toys and misc
  "puppet", "marble", "balloon", "kite", "top", "yoyo", "domino", "checker", "jigsaw", "riddle",
  "trinket", "charm", "token", "medal", "badge", "ribbon", "banner", "flag", "pennant", "emblem",
];

export const WORDLIST: readonly string[] = Array.from(new Set(RAW_WORDS)).sort();
