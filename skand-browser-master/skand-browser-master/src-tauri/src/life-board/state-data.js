let rituals=[
  {
    id: 'morning-yoga',
    name: '🌅 Morning Energizer',
    description: 'Start your day with energizing yoga and mindfulness',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    icon: '🧘',
    tasks: [
      'sun-salutation',
      'breathing-exercises',
      'standing-poses',
      'balance-poses',
      'cool-down'
    ]
  },
  {
    id: 'healthy-eating',
    name: '🍎 Healthy Eating',
    description: 'Daily routine for maintaining a balanced and nutritious diet',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    icon: '🥗',
    tasks: [
      'breakfast-boost',
      'mid-morning-snack',
      'nutritious-lunch',
      'afternoon-pick-me-up',
      'light-dinner',
      'evening-tea',
      'grocery-planning'
    ]
  }
],
tasks=[
  {
    id: 'sun-salutation',
    ritualId: 'morning-yoga',
    name: 'Sun Salutation',
    description: '3-5 rounds of Surya Namaskar to warm up the body',
    icon: '☀️',
    type: 'yoga',
    duration: 10,
    reps: 3
  },
  {
    id: 'breathing-exercises',
    ritualId: 'morning-yoga',
    name: 'Breathing Exercises',
    description: '5 minutes of Pranayama to energize and focus the mind',
    icon: '💨',
    type: 'yoga',
    duration: 5
  },
  {
    id: 'standing-poses',
    ritualId: 'morning-yoga',
    name: 'Standing Poses',
    description: 'Warrior series and other standing asanas for strength',
    icon: '🚶',
    type: 'yoga',
    duration: 10
  },
  {
    id: 'balance-poses',
    ritualId: 'morning-yoga',
    name: 'Balance Poses',
    description: 'Tree pose and other balancing asanas for focus',
    icon: '🌳',
    type: 'yoga',
    duration: 5
  },
  {
    id: 'cool-down',
    ritualId: 'morning-yoga',
    name: 'Cool Down',
    description: 'Gentle stretches and Savasana to relax',
    icon: '😌',
    type: 'yoga',
    duration: 5
  },
  {
    id: 'breakfast-boost',
    ritualId: 'healthy-eating',
    name: 'Breakfast Boost',
    description: 'Start your day with protein and fiber to keep you full and energized',
    icon: '🍳',
    type: 'meal',
    duration: 20
  },
  {
    id: 'mid-morning-snack',
    ritualId: 'healthy-eating',
    name: 'Mid-Morning Snack',
    description: 'A light, nutritious snack to maintain energy levels',
    icon: '🥜',
    type: 'snack',
    duration: 10
  },
  {
    id: 'nutritious-lunch',
    ritualId: 'healthy-eating',
    name: 'Nutritious Lunch',
    description: 'Balanced meal with lean protein, whole grains, and vegetables',
    icon: '🥗',
    type: 'meal',
    duration: 30
  },
  {
    id: 'afternoon-pick-me-up',
    ritualId: 'healthy-eating',
    name: 'Afternoon Pick-Me-Up',
    description: 'Healthy snack to beat the afternoon slump',
    icon: '🍎',
    type: 'snack',
    duration: 10
  },
  {
    id: 'light-dinner',
    ritualId: 'healthy-eating',
    name: 'Light Dinner',
    description: 'Light, early dinner for better digestion',
    icon: '🍲',
    type: 'meal',
    duration: 30
  },
  {
    id: 'evening-tea',
    ritualId: 'healthy-eating',
    name: 'Herbal Tea Time',
    description: 'Warm, caffeine-free herbal tea to unwind',
    icon: '🍵',
    type: 'beverage',
    duration: 15
  },
  {
    id: 'grocery-planning',
    ritualId: 'healthy-eating',
    name: 'Weekly Grocery Planning',
    description: 'Plan and shop for healthy meals for the week',
    icon: '🛒',
    type: 'planning',
    duration: 60
  },
  {
    id: 'task-buy-grocery',
    ritualId: 'healthy-eating',
    name: 'Grocery Shopping',
    description: 'Order your planned groceries online',
    icon: '🛍️',
    type: 'shopping'
  }
],
todos=[],
completions={},
journalEntries={},
currentRitualId=null,
selectedIcon="⭐",
timers={},
currentViewDate=new Date,
selectedDate=(new Date).toISOString().split("T")[0],
editingTaskId=null,
editingRitualId=null,
userLocation={lat:null,lon:null,city:null,timezone:"UTC"},
groceryPlanningTaskId='grocery-planning',
userCountry="usa",
activityState={type:null,taskId:null,interval:null,status:"stopped",isNarrationOn:!0},
// Speech synthesis setup
speech = {
  synth: window.speechSynthesis,
  voice: null,
  voices: []
};

// Available icons for tasks and rituals
const availableIcons = [
  '🔗', '🏃‍♂️', '🧘‍♀️', '📚', '🌿', '💖', '🥑', '📝', '🎵', '🌱',
  '✕', '🚽', '🦷', '👔', '💪', '🎯', '🔥', '⌛', '🌄', '🏠',
  '➿', '📈', '🤔', '🧠', '❤️', '🎉', '☕', '🏋️', '👨‍💻', '👩‍🍳',
  '🧩', '💰', '📱', '🎨', '📌', '📅', '🏆', '🍎', '🍌', '🥦', '🍗', '🥗'
];

// Glycemic index food data
const glycemicFoods = [
  { name: "Rolled Oats", type: "low", gi: 55, color: "#e0c8b0" },
  { name: "Quinoa", type: "low", gi: 53, color: "#e8e2d2" },
  { name: "Barley", type: "low", gi: 28, color: "#d4b996" },
  { name: "Lentils", type: "low", gi: 32, color: "#a88562" },
  { name: "Chickpeas", type: "low", gi: 28, color: "#f5deb3" },
  { name: "Kidney Beans", type: "low", gi: 24, color: "#8b0000" },
  { name: "Apples", type: "low", gi: 36, color: "#ff4757" },
  { name: "Oranges", type: "low", gi: 43, color: "#ffa502" },
  { name: "Berries", type: "low", gi: 40, color: "#742283" },
  { name: "Broccoli", type: "low", gi: 15, color: "#009432" },
  { name: "Spinach", type: "low", gi: 15, color: "#20bf6b" },
  { name: "Bell Peppers", type: "low", gi: 15, color: "#f7b731" },
  { name: "Carrots (raw)", type: "low", gi: 16, color: "#fa8231" },
  { name: "Tomatoes", type: "low", gi: 15, color: "#eb4d4b" },
  { name: "Almonds", type: "low", gi: 0, color: "#d3a17d" },
  { name: "Walnuts", type: "low", gi: 0, color: "#a0785a" },
  { name: "Avocado", type: "low", gi: 15, color: "#535c68" },
  { name: "Greek Yogurt", type: "low", gi: 11, color: "#f1f2f6" },
  { name: "Chicken Breast", type: "low", gi: 0, color: "#f9e0bb" },
  { name: "Salmon", type: "low", gi: 0, color: "#ff8c69" },
  { name: "Tofu", type: "low", gi: 15, color: "#fef9e7" },
  { name: "Mushrooms", type: "low", gi: 15, color: "#bcaaa4" },
  { name: "Cauliflower", type: "low", gi: 15, color: "#f5f5f5" },
  { name: "Pears", type: "low", gi: 38, color: "#d1e231" },
  { name: "Plums", type: "low", gi: 40, color: "#581845" },
  { name: "Grapefruit", type: "low", gi: 25, color: "#fd5e53" },
  { name: "Peanuts", type: "low", gi: 7, color: "#f9d423" },
  { name: "Cashews", type: "low", gi: 25, color: "#f1c40f" },
  { name: "Soy Milk", type: "low", gi: 34, color: "#fdf5e6" },
  { name: "Skim Milk", type: "low", gi: 37, color: "#f7f1e3" },
  { name: "Whole Wheat Pasta", type: "low", gi: 48, color: "#c4a661" },
  { name: "Sourdough Bread", type: "low", gi: 54, color: "#d2b48c" },
  { name: "Brown Rice", type: "medium", gi: 68, color: "#a67c52" },
  { name: "Sweet Potato", type: "medium", gi: 63, color: "#f0932b" },
  { name: "Whole Wheat Bread", type: "medium", gi: 69, color: "#b9875d" },
  { name: "Honey", type: "medium", gi: 61, color: "#f9ca24" },
  { name: "Pineapple", type: "medium", gi: 59, color: "#f4d03f" },
  { name: "Beets", type: "medium", gi: 64, color: "#c44569" },
  { name: "Popcorn", type: "medium", gi: 65, color: "#f1f2f6" },
  { name: "Basmati Rice", type: "medium", gi: 58, color: "#f5f0e1" },
  { name: "Couscous", type: "medium", gi: 65, color: "#f9e79f" },
  { name: "Raisins", type: "medium", gi: 64, color: "#594c43" },
  { name: "Mango", type: "medium", gi: 60, color: "#ffc300" },
  { name: "Banana", type: "medium", gi: 62, color: "#f7d794" },
  { name: "Rye Bread", type: "medium", gi: 65, color: "#907860" },
  { name: "Corn", type: "medium", gi: 60, color: "#feca57" }
];

// Delivery services by country
const deliveryServices = {
  usa: [
    { name: "Instacart", url: "https://www.instacart.com/", searchPath: "store/search/" },
    { name: "DoorDash", url: "https://www.doordash.com/en-US", searchPath: "search/store?q=" },
    { name: "Walmart", url: "https://www.walmart.com/", searchPath: "search?q=" },
    { name: "Amazon Fresh", url: "https://www.amazon.com/fmc/m/2025fmc_fresh", searchPath: "?k=" }
  ],
  canada: [
    { name: "Instacart", url: "https://www.instacart.ca/", searchPath: "store/search/" },
    { name: "Loblaws", url: "https://www.loblaws.ca/", searchPath: "search?search-bar=" },
    { name: "Walmart", url: "https://www.walmart.ca/", searchPath: "search?q=" }
  ],
  uk: [
    { name: "Tesco", url: "https://www.tesco.com/groceries/en-GB/", searchPath: "search?query=" },
    { name: "Sainsbury's", url: "https://www.sainsburys.co.uk/", searchPath: "shop/gb/groceries/search?searchTerm=" },
    { name: "Ocado", url: "https://www.ocado.com/", searchPath: "search?entry=" },
    { name: "ASDA", url: "https://groceries.asda.com/", searchPath: "search/" }
  ],
  ireland: [
    { name: "Tesco IE", url: "https://www.tesco.ie/groceries/", searchPath: "search?query=" },
    { name: "SuperValu", url: "https://shop.supervalu.ie/", searchPath: "shopping/search/all/?search=" }
  ],
  germany: [
    { name: "Rewe", url: "https://shop.rewe.de/", searchPath: "search?q=" },
    { name: "Flink", url: "https://www.goflink.com/de/", searchPath: "search?q=" },
    { name: "Gorillas", url: "https://gorillas.io/de", searchPath: "search?q=" }
  ],
  france: [
    { name: "Carrefour", url: "https://www.carrefour.fr/", searchPath: "s?q=" },
    { name: "Auchan", url: "https://www.auchan.fr/", searchPath: "recherche?text=" },
    { name: "Monoprix", url: "https://www.monoprix.fr/", searchPath: "s?q=" }
  ],
  spain: [
    { name: "Glovo", url: "https://glovoapp.com/es/", searchPath: "store-search/" },
    { name: "Mercadona", url: "https://www.mercadona.es/", searchPath: "search-results?query=" },
    { name: "Carrefour ES", url: "https://www.carrefour.es/", searchPath: "?q=" }
  ],
  italy: [
    { name: "Everli", url: "https://it.everli.com/", searchPath: "search?q=" },
    { name: "Glovo", url: "https://glovoapp.com/it/", searchPath: "store-search/" },
    { name: "Carrefour IT", url: "https://www.carrefour.it/", searchPath: "ricerca?q=" }
  ],
  netherlands: [
    { name: "Picnic", url: "https://picnic.app/nl/", searchPath: "search?q=" },
    { name: "Albert Heijn", url: "https://www.ah.nl/", searchPath: "zoeken?query=" },
    { name: "Jumbo", url: "https://www.jumbo.com/", searchPath: "zoeken?searchTerms=" }
  ],
  belgium: [
    { name: "Delhaize", url: "https://www.delhaize.be/", searchPath: "nl-be/shop/zoek?q=" },
    { name: "Colruyt", url: "https://www.collectandgo.be/", searchPath: "colruyt/nl/zoeken?text=" }
  ],
  switzerland: [
    { name: "Migros", url: "https://migros.ch/", searchPath: "de/search?q=" },
    { name: "Coop", url: "https://www.coop.ch/", searchPath: "de/search/?text=" }
  ],
  austria: [
    { name: "BILLA", url: "https://shop.billa.at/", searchPath: "ecommerce/at/search?q=" },
    { name: "Gurkerl", url: "https://www.gurkerl.at/", searchPath: "suchen?q=" }
  ],
  sweden: [
    { name: "ICA", url: "https://handla.ica.se/", searchPath: "search?q=" },
    { name: "MatHem", url: "https://www.mathem.se/", searchPath: "sok?q=" }
  ],
  norway: [
    { name: "Oda", url: "https://oda.com/no/", searchPath: "search/?q=" },
    { name: "Meny", url: "https://meny.no/", searchPath: "sok/?q=" }
  ],
  denmark: [
    { name: "Nemlig", url: "https://www.nemlig.com/", searchPath: "?query=" },
    { name: "Bilka", url: "https://www.bilka.dk/", searchPath: "?query=" }
  ],
  finland: [
    { name: "K-Ruoka", url: "https://www.k-ruoka.fi/", searchPath: "haku?q=" },
    { name: "S-kaupat", url: "https://www.s-kaupat.fi/", searchPath: "haku?q=" }
  ],
  poland: [
    { name: "Carrefour PL", url: "https://www.carrefour.pl/", searchPath: "wyszukaj?q=" },
    { name: "Auchan PL", url: "https://zakupy.auchan.pl/", searchPath: "szukaj?query=" }
  ],
  portugal: [
    { name: "Continente", url: "https://www.continente.pt/", searchPath: "pesquisa/?q=" },
    { name: "Pingo Doce", url: "https://mercadao.pt/store/pingo-doce/", searchPath: "search?q=" }
  ],
  brazil: [
    { name: "iFood", url: "https://www.ifood.com.br/", searchPath: "buscar?q=" },
    { name: "Pão de Açúcar", url: "https://www.paodeacucar.com/", searchPath: "busca?q=" }
  ],
  mexico: [
    { name: "Rappi", url: "https://www.rappi.com.mx/", searchPath: "search?query=" },
    { name: "Walmart MX", url: "https://www.walmart.com.mx/", searchPath: "buscador?buscar=" }
  ],
  australia: [
    { name: "Woolworths", url: "https://www.woolworths.com.au/", searchPath: "shop/search/products?searchTerm=" },
    { name: "Coles", url: "https://www.coles.com.au/", searchPath: "search?q=" }
  ],
  new_zealand: [
    { name: "Countdown", url: "https://www.countdown.co.nz/", searchPath: "shop/searchproducts?search=" },
    { name: "New World", url: "https://www.newworld.co.nz/", searchPath: "search?q=" }
  ],
  singapore: [
    { name: "RedMart", url: "https://www.lazada.sg/shop-redmart/", searchPath: "?q=" },
    { name: "FairPrice", url: "https://www.fairprice.com.sg/", searchPath: "search?query=" }
  ],
  malaysia: [
    { name: "GrabMart", url: "https://mart.grab.com/my/en/", searchPath: "search?keyword=" },
    { name: "Foodpanda", url: "https://www.foodpanda.my/", searchPath: "search?q=" }
  ],
  indonesia: [
    { name: "GoMart", url: "https://gojek.com/", searchPath: "gofood/search?q=" },
    { name: "Tokopedia Fresh", url: "https://www.tokopedia.com/fresh", searchPath: "?q=" }
  ],
  philippines: [
    { name: "GrabMart", url: "https://mart.grab.com/ph/en/", searchPath: "search?keyword=" },
    { name: "WalterMart", url: "https://www.waltermart.com.ph/", searchPath: "search?type=product&q=" }
  ],
  thailand: [
    { name: "HappyFresh", url: "https://www.happyfresh.co.th/", searchPath: "th/search?q=" },
    { name: "Lotus's", url: "https://www.lotuss.com/", searchPath: "th/search?q=" }
  ],
  vietnam: [
    { name: "GrabMart", url: "https://mart.grab.com/vn/en/", searchPath: "search?keyword=" },
    { name: "Bach Hoa Xanh", url: "https://www.bachhoaxanh.com/", searchPath: "tim-kiem?query=" }
  ],
  india: [
    { name: "Blinkit", url: "https://blinkit.com/", searchPath: "s/?q=" },
    { name: "BigBasket", url: "https://www.bigbasket.com/", searchPath: "?q=" },
    { name: "Swiggy Instamart", url: "https://www.swiggy.com/instamart", searchPath: "?q=" },
    { name: "Zepto", url: "https://www.zepto.com/", searchPath: "search?q=" }
  ],
  uae: [
    { name: "Carrefour UAE", url: "https://www.carrefouruae.com/", searchPath: "mafuae/en/search?q=" },
    { name: "Talabat", url: "https://www.talabat.com/uae", searchPath: "search?q=" }
  ],
  saudi_arabia: [
    { name: "Carrefour KSA", url: "https://www.carrefourksa.com/", searchPath: "mafksa/en/search?q=" },
    { name: "Panda", url: "https://www.panda.com.sa/", searchPath: "en/search?q=" }
  ],
  south_africa: [
    { name: "Checkers Sixty60", url: "https://www.sixty60.co.za/", searchPath: "search?q=" },
    { name: "Woolworths SA", url: "https://www.woolworths.co.za/", searchPath: "store/fragments/eshop/search/results?Ntt=" }
  ],
  japan: [
    { name: "Rakuten Seiyu", url: "https://www.rakuten.co.jp/", searchPath: "search/mall?sitem=" },
    { name: "Amazon JP", url: "https://www.amazon.co.jp/", searchPath: "s?k=" }
  ],
  south_korea: [
    { name: "Coupang", url: "https://www.coupang.com/", searchPath: "np/search?q=" },
    { name: "Market Kurly", url: "https://www.kurly.com/", searchPath: "search?sword=" }
  ],
  turkey: [
    { name: "Getir", url: "https://getir.com/", searchPath: "ara/?q=" },
    { name: "Migros Sanal", url: "https://www.migros.com.tr/", searchPath: "arama?q=" }
  ],
  albania: [
    { name: "Hajde", url: "https://hajde.com.al/", searchPath: "search?query=" },
    { name: "Gjirafa50", url: "https://gjirafa50.com/", searchPath: "search?q=" }
  ]
};

// SoundCloud playlists for focus music
const soundCloudPlaylists = {
  lofi: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/chillhopdotcom/sets/chillhop-hangouts-3-jazzy-chilled-hip-hop-2-hour-mix&hide_related=false&show_comments=true&show_user=true&visual=true',
  classical: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/user-187505396/sets/klassieke-musiek&hide_related=false&show_comments=true&show_user=true&visual=true',
  jazz: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/hypemusicnetwork/2-hours-of-new-smooth-jazz-for-summer-nights-mix&hide_related=false&show_comments=true&show_user=true&visual=true',
  ambient: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/ambientmusicalgenre/essential-ambient-mix&hide_related=false&show_comments=true&show_user=true&visual=true'
};

// Sun salutation yoga sequence
const sunSalutationSteps = [
  {
    name: "Prayer Pose",
    instruction: "Stand tall at the top of your mat. Bring your palms together at your heart and take a deep breath.",
    image: "images/pexels-photo-3822623.jpeg"
  },
  {
    name: "Raised Arms",
    instruction: "Inhale and sweep your arms up and back, reaching for the sky. Feel a gentle stretch in your back.",
    image: "images/pexels-photo-4056535.jpeg"
  },
  {
    name: "Hand to Foot",
    instruction: "Exhale and fold forward from your hips. Let your head hang heavy and try to touch your toes.",
    image: "images/pexels-photo-7593973.jpeg"
  },
  {
    name: "Equestrian",
    instruction: "Inhale and step your right leg back into a lunge. Look forward and feel the stretch in your hips.",
    image: "images/pexels-photo-8687573.jpeg"
  },
  {
    name: "Stick Pose",
    instruction: "Hold your breath and step your left leg back to meet the right, coming into a plank pose. Keep your body in a straight line.",
    image: "images/pexels-photo-6005399.jpeg"
  },
  {
    name: "Eight-Limbed",
    instruction: "Exhale and gently lower your knees, chest, and chin to the floor.",
    image: "images/pexels-photo-7285191.jpeg"
  },
  {
    name: "Cobra Pose",
    instruction: "Inhale and slide forward, lifting your chest into Cobra pose. Keep your shoulders relaxed and away from your ears.",
    image: "images/pexels-photo-4056522.jpeg"
  },
  {
    name: "Downward Dog",
    instruction: "Exhale and lift your hips up and back into Downward-Facing Dog. Press your hands firmly into the mat.",
    image: "images/pexels-photo-4056557.jpeg"
  },
  {
    name: "Equestrian",
    instruction: "Inhale and step your right foot forward between your hands, coming back into a lunge.",
    image: "images/pexels-photo-8687573.jpeg"
  },
  {
    name: "Hand to Foot",
    instruction: "Exhale and step your left foot forward to meet your right. Fold forward again.",
    image: "images/pexels-photo-7593973.jpeg"
  },
  {
    name: "Raised Arms",
    instruction: "Inhale and rise up, sweeping your arms wide and high. Gently arch your back.",
    image: "images/pexels-photo-4056535.jpeg"
  },
  {
    name: "Mountain Pose",
    instruction: "Exhale and bring your arms down, returning to the starting position. Feel the energy flowing.",
    image: "images/pexels-photo-3822623.jpeg"
  }
];
