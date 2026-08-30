/**
 * Centralized Recipes Data Module
 * Source: HealthyKitchen / HealthHub
 */
export const RECIPES = [
    {
        id: 1,
        name: "Quinoa & Roasted Veggie Bowl",
        cuisine: "Mediterranean",
        tags: ["no-meat", "no-egg", "gluten-free", "vegan", "low-gi"],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Quinoa", amount: "1 cup" },
            { name: "Bell Peppers", amount: "2, chopped" },
            { name: "Zucchini", amount: "1, chopped" },
            { name: "Red Onion", amount: "1/2, chopped" },
            { name: "Chickpeas", amount: "1 can, rinsed" },
            { name: "Olive Oil", amount: "2 tbsp" },
            { name: "Lemon Juice", amount: "1 tbsp" }
        ],
        steps: [
            { text: "Rinse 1 cup of quinoa under cold water. Simmer in 2 cups of water for 15 minutes." },
            { text: "Preheat oven to 400°F (200°C). Toss bell peppers, zucchini, and red onion with olive oil." },
            { text: "Roast vegetables for 20-25 minutes until caramelized." },
            { text: "Combine quinoa, roasted veggies, and chickpeas. Drizzle with lemon dressing and serve warm." }
        ]
    },
    {
        id: 2,
        name: "Spiced Lentil Soup (Dal)",
        cuisine: "Indian",
        tags: ["no-meat", "no-egg", "gluten-free", "vegan", "low-gi", "high-protein"],
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Red Lentils", amount: "1.5 cups" },
            { name: "Onion", amount: "1, chopped" },
            { name: "Garlic & Ginger", amount: "1 tbsp minced" },
            { name: "Turmeric & Cumin", amount: "1 tsp each" },
            { name: "Vegetable Broth", amount: "6 cups" }
        ],
        steps: [
            { text: "Sauté chopped onion, garlic, and ginger in olive oil for 5 minutes until translucent." },
            { text: "Stir in turmeric, cumin, and red lentils." },
            { text: "Pour in vegetable broth and bring to a boil. Reduce heat and simmer for 25 minutes." },
            { text: "Garnish with fresh cilantro and lemon juice before serving." }
        ]
    },
    {
        id: 3,
        name: "Chicken & Black Bean Tostadas",
        cuisine: "Mexican",
        tags: ["no-egg", "gluten-free", "high-protein"],
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Corn Tortillas", amount: "4" },
            { name: "Chicken Breast", amount: "1, cooked & shredded" },
            { name: "Black Beans", amount: "1 can, rinsed" },
            { name: "Avocado", amount: "1, mashed" },
            { name: "Salsa", amount: "1/2 cup" }
        ],
        steps: [
            { text: "Bake corn tortillas at 375°F (190°C) for 8 minutes until crispy." },
            { text: "Warm black beans and mash slightly with cumin and sea salt." },
            { text: "Spread mashed beans over crunchy tortillas, top with chicken, avocado, and salsa." }
        ]
    },
    {
        id: 4,
        name: "Tofu & Broccoli Sesame Stir-Fry",
        cuisine: "Asian",
        tags: ["no-meat", "no-egg", "vegan", "high-protein"],
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Firm Tofu", amount: "1 block, cubed" },
            { name: "Broccoli Florets", amount: "2 cups" },
            { name: "Tamari Soy Sauce", amount: "2 tbsp" },
            { name: "Sesame Oil & Seeds", amount: "1 tbsp" }
        ],
        steps: [
            { text: "Pan-fry cubed firm tofu in sesame oil until golden brown on all sides." },
            { text: "Steam broccoli florets for 3 minutes until vibrant green." },
            { text: "Toss tofu and broccoli together with tamari sauce and sprinkle sesame seeds." }
        ]
    },
    {
        id: 5,
        name: "Palak Paneer / Tofu Curry",
        cuisine: "Indian",
        tags: ["no-meat", "gluten-free", "low-gi"],
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Spinach", amount: "4 cups" },
            { name: "Paneer or Tofu", amount: "200g cubed" },
            { name: "Garlic & Ginger", amount: "1 tbsp" },
            { name: "Garam Masala", amount: "1 tsp" }
        ],
        steps: [
            { text: "Blanch spinach for 2 minutes, plunge into cold water, and blend into a smooth puree." },
            { text: "Sauté ginger, garlic, and spices in a pan. Add spinach puree." },
            { text: "Simmer cubed paneer or tofu for 8 minutes and serve hot." }
        ]
    },
    {
        id: 6,
        name: "Greek Avocado Salad",
        cuisine: "Mediterranean",
        tags: ["no-meat", "no-egg", "gluten-free", "keto"],
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Cucumber", amount: "1, sliced" },
            { name: "Cherry Tomatoes", amount: "1 cup" },
            { name: "Kalamata Olives", amount: "1/2 cup" },
            { name: "Feta Cheese", amount: "100g crumble" },
            { name: "Extra Virgin Olive Oil", amount: "2 tbsp" }
        ],
        steps: [
            { text: "Combine sliced cucumber, halved tomatoes, and Kalamata olives in a bowl." },
            { text: "Top with crumbled feta cheese and drizzle extra virgin olive oil." },
            { text: "Season with oregano and sea salt before serving." }
        ]
    },
    {
        id: 7,
        name: "Thai Green Curry Veggie Pot",
        cuisine: "Asian",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free"],
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Green Curry Paste", amount: "2 tbsp" },
            { name: "Coconut Milk", amount: "1 can light" },
            { name: "Bamboo Shoots & Peas", amount: "1 cup" },
            { name: "Thai Basil", amount: "1/4 cup fresh" }
        ],
        steps: [
            { text: "Sauté green curry paste in a skillet until fragrant." },
            { text: "Pour in coconut milk and bring to a gentle simmer." },
            { text: "Add mixed vegetables and cook for 10 minutes. Stir in fresh Thai basil." }
        ]
    },
    {
        id: 8,
        name: "Grilled Salmon with Asparagus",
        cuisine: "Mediterranean",
        tags: ["no-egg", "gluten-free", "keto", "high-protein"],
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Wild Salmon Fillet", amount: "2 fillets" },
            { name: "Fresh Asparagus", amount: "1 bunch" },
            { name: "Lemon", amount: "1, sliced" },
            { name: "Dill & Olive Oil", amount: "1 tbsp" }
        ],
        steps: [
            { text: "Season salmon fillets with lemon juice, sea salt, dill, and olive oil." },
            { text: "Grill salmon for 4-5 minutes per side until flaky." },
            { text: "Roast asparagus alongside for 8 minutes and serve warm." }
        ]
    },
    {
        id: 9,
        name: "Middle Eastern Hummus & Falafel Plate",
        cuisine: "Middle Eastern",
        tags: ["no-meat", "no-egg", "vegan", "high-protein"],
        image: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Baked Falafels", amount: "6 pieces" },
            { name: "Homemade Hummus", amount: "1/2 cup" },
            { name: "Tabbouleh Salad", amount: "1 cup" },
            { name: "Whole Grain Pita", amount: "1" }
        ],
        steps: [
            { text: "Bake chickpea falafels at 400°F (200°C) for 15 minutes until golden." },
            { text: "Plate with smooth garlic hummus, parsley tabbouleh, and warm pita slices." }
        ]
    },
    {
        id: 10,
        name: "Caprese Salad with Basil & Mozzarella",
        cuisine: "Italian",
        tags: ["no-meat", "gluten-free", "keto", "low-gi"],
        image: "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Fresh Mozzarella", amount: "200g sliced" },
            { name: "Ripe Heirloom Tomatoes", amount: "2 sliced" },
            { name: "Fresh Basil Leaves", amount: "1/2 cup" },
            { name: "Balsamic Glaze", amount: "1 tbsp" }
        ],
        steps: [
            { text: "Alternate slices of ripe tomato and mozzarella on a plate." },
            { text: "Tuck fresh basil leaves between slices." },
            { text: "Drizzle extra virgin olive oil and balsamic glaze right before serving." }
        ]
    },
    {
        id: 11,
        name: "Chana Masala (Chickpea Curry)",
        cuisine: "Indian",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free", "high-protein"],
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Chickpeas", amount: "2 cans, drained" },
            { name: "Tomato Puree", amount: "1 cup" },
            { name: "Garam Masala & Coriander", amount: "1 tbsp" },
            { name: "Cilantro", amount: "For garnish" }
        ],
        steps: [
            { text: "Sauté onions, ginger, and garlic with Indian spices until aromatic." },
            { text: "Add tomato puree and simmer chickpeas for 15 minutes." },
            { text: "Serve with brown basmati rice and fresh coriander." }
        ]
    },
    {
        id: 12,
        name: "Edamame & Seaweed Protein Noodle Bowl",
        cuisine: "Asian",
        tags: ["no-meat", "no-egg", "vegan", "low-gi"],
        image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Soba Buckwheat Noodles", amount: "150g" },
            { name: "Shelled Edamame", amount: "1 cup" },
            { name: "Nori Seaweed Strips", amount: "2 sheets" },
            { name: "Miso Broth", amount: "3 cups" }
        ],
        steps: [
            { text: "Boil buckwheat soba noodles for 4 minutes and rinse under cold water." },
            { text: "Whisk miso paste into warm vegetable broth." },
            { text: "Combine noodles, edamame, and broth. Garnish with nori strips." }
        ]
    },
    {
        id: 13,
        name: "Avocado Toast with Poached Egg",
        cuisine: "American",
        tags: ["no-meat", "low-gi", "high-protein"],
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Sourdough Bread", amount: "2 slices" },
            { name: "Ripe Avocado", amount: "1" },
            { name: "Free-range Eggs", amount: "2" },
            { name: "Red Pepper Flakes", amount: "1 pinch" }
        ],
        steps: [
            { text: "Toast sourdough slices until crispy." },
            { text: "Mash avocado with sea salt and lemon juice, then spread evenly on toast." },
            { text: "Poach eggs in simmering water for 3 minutes. Place on top and sprinkle red pepper flakes." }
        ]
    },
    {
        id: 14,
        name: "Black Lentil & Kale Superfood Salad",
        cuisine: "Mediterranean",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free", "low-gi"],
        image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Beluga Black Lentils", amount: "1 cup cooked" },
            { name: "Tuscan Kale", amount: "2 cups, massaged" },
            { name: "Pomegranate Seeds", amount: "1/2 cup" },
            { name: "Walnuts", amount: "1/4 cup" }
        ],
        steps: [
            { text: "Massage kale with olive oil until soft and tender." },
            { text: "Toss with cooked black lentils, pomegranate seeds, and toasted walnuts." },
            { text: "Drizzle with apple cider vinaigrette." }
        ]
    },
    {
        id: 15,
        name: "Shakshuka (Poached Eggs in Tomato Sauce)",
        cuisine: "Middle Eastern",
        tags: ["no-meat", "gluten-free", "keto", "high-protein"],
        image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Eggs", amount: "4" },
            { name: "Crushed Tomatoes", amount: "1 can" },
            { name: "Bell Peppers & Cumin", amount: "1 cup" },
            { name: "Fresh Parsley", amount: "1/4 cup" }
        ],
        steps: [
            { text: "Simmer crushed tomatoes with bell peppers, garlic, cumin, and paprika." },
            { text: "Make 4 wells in the sauce and crack an egg into each well." },
            { text: "Cover skillet and cook for 6 minutes until egg whites are set." }
        ]
    },
    {
        id: 16,
        name: "Vietnamese Fresh Spring Rolls",
        cuisine: "Asian",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free", "low-gi"],
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Rice Paper Wrappers", amount: "6" },
            { name: "Shredded Carrots & Cucumber", amount: "1 cup" },
            { name: "Fresh Mint & Cilantro", amount: "1/2 cup" },
            { name: "Peanut Dipping Sauce", amount: "3 tbsp" }
        ],
        steps: [
            { text: "Dip rice paper in warm water for 5 seconds until pliable." },
            { text: "Layer veggies, mint, and cilantro in the center and roll tightly." },
            { text: "Serve with spicy peanut dipping sauce." }
        ]
    },
    {
        id: 17,
        name: "Minestrone Tuscan Vegetable Soup",
        cuisine: "Italian",
        tags: ["no-meat", "no-egg", "vegan", "low-gi"],
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Cannellini Beans", amount: "1 can" },
            { name: "Diced Zucchini & Carrots", amount: "2 cups" },
            { name: "Diced Tomatoes", amount: "1 can" },
            { name: "Whole Grain Pasta", amount: "1/2 cup" }
        ],
        steps: [
            { text: "Sauté carrots, celery, and garlic in olive oil." },
            { text: "Add vegetable broth, diced tomatoes, zucchini, and beans." },
            { text: "Simmer for 20 minutes, adding pasta in the last 8 minutes." }
        ]
    },
    {
        id: 18,
        name: "Baked Turkey & Spinach Meatballs",
        cuisine: "American",
        tags: ["no-egg", "gluten-free", "high-protein", "keto"],
        image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Lean Ground Turkey", amount: "400g" },
            { name: "Finely Chopped Spinach", amount: "1 cup" },
            { name: "Almond Flour", amount: "1/4 cup" },
            { name: "Italian Seasoning", amount: "1 tbsp" }
        ],
        steps: [
            { text: "Mix ground turkey, spinach, almond flour, and herbs in a bowl." },
            { text: "Roll into 12 meatballs and place on a lined baking sheet." },
            { text: "Bake at 400°F (200°C) for 18 minutes until cooked through." }
        ]
    },
    {
        id: 19,
        name: "Berry Acai Anti-Oxidant Smoothie Bowl",
        cuisine: "American",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free"],
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Frozen Acai / Mixed Berries", amount: "1.5 cups" },
            { name: "Unsweetened Almond Milk", amount: "1/2 cup" },
            { name: "Chia Seeds & Granola", amount: "2 tbsp" },
            { name: "Sliced Banana", amount: "1/2" }
        ],
        steps: [
            { text: "Blend frozen acai and berries with almond milk until thick and creamy." },
            { text: "Pour into a bowl and top with chia seeds, granola, and fresh banana slices." }
        ]
    },
    {
        id: 20,
        name: "Roasted Cauliflower & Chickpea Shawarma",
        cuisine: "Middle Eastern",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free", "low-gi"],
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Cauliflower Florets", amount: "1 head" },
            { name: "Chickpeas", amount: "1 can" },
            { name: "Shawarma Spice Blend", amount: "1 tbsp" },
            { name: "Tahini Dressing", amount: "2 tbsp" }
        ],
        steps: [
            { text: "Toss cauliflower florets and chickpeas with shawarma spices and olive oil." },
            { text: "Roast at 425°F (220°C) for 25 minutes until crispy and browned." },
            { text: "Drizzle generously with garlic tahini sauce." }
        ]
    },
    {
        id: 21,
        name: "Mexican Quinoa Stuffed Bell Peppers",
        cuisine: "Mexican",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free", "high-protein"],
        image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Bell Peppers", amount: "4 whole" },
            { name: "Cooked Quinoa", amount: "1.5 cups" },
            { name: "Black Beans & Corn", amount: "1 cup" },
            { name: "Nutritional Yeast / Cheese", amount: "1/4 cup" }
        ],
        steps: [
            { text: "Halve bell peppers and remove seeds." },
            { text: "Stuff with cooked quinoa, black beans, corn, and spices." },
            { text: "Bake at 375°F (190°C) for 25 minutes until peppers are tender." }
        ]
    },
    {
        id: 22,
        name: "Golden Turmeric Ginger Detox Soup",
        cuisine: "Indian",
        tags: ["no-meat", "no-egg", "vegan", "gluten-free", "low-gi"],
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Fresh Turmeric & Ginger", amount: "1 tbsp each" },
            { name: "Coconut Milk & Broth", amount: "3 cups" },
            { name: "Sweet Potato & Carrots", amount: "2 cups" }
        ],
        steps: [
            { text: "Sauté ginger, garlic, and fresh turmeric root." },
            { text: "Add sweet potato cubes and broth. Simmer for 20 minutes." },
            { text: "Blend until silky smooth and top with toasted pumpkin seeds." }
        ]
    },
    {
        id: 23,
        name: "Wild Blueberry & Walnut Oatmeal",
        cuisine: "American",
        tags: ["no-meat", "no-egg", "vegan", "low-gi"],
        image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Rolled Oats", amount: "1 cup" },
            { name: "Wild Blueberries", amount: "1/2 cup" },
            { name: "Crushed Walnuts", amount: "2 tbsp" },
            { name: "Cinnamon & Maple", amount: "1 tsp" }
        ],
        steps: [
            { text: "Simmer rolled oats in water or oat milk for 8 minutes." },
            { text: "Stir in wild blueberries, cinnamon, and crushed walnuts." },
            { text: "Drizzle pure maple syrup and serve warm." }
        ]
    },
    {
        id: 24,
        name: "Pesto Zucchini Noodle (Zoodles) Bowl",
        cuisine: "Italian",
        tags: ["no-meat", "no-egg", "gluten-free", "keto", "low-gi"],
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Spiralized Zucchini", amount: "3 medium" },
            { name: "Fresh Basil Pesto", amount: "3 tbsp" },
            { name: "Pine Nuts", amount: "2 tbsp" },
            { name: "Cherry Tomatoes", amount: "1/2 cup" }
        ],
        steps: [
            { text: "Spiralize fresh zucchini into thin noodle strands." },
            { text: "Sauté zoodles in olive oil for 2 minutes (keep crisp!)." },
            { text: "Toss with basil pesto, cherry tomatoes, and toasted pine nuts." }
        ]
    },
    {
        id: 25,
        name: "Edamame & Tofu Protein Poke Bowl",
        cuisine: "Asian",
        tags: ["no-meat", "no-egg", "vegan", "high-protein", "low-gi"],
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Brown Rice / Cauliflower Rice", amount: "1 cup" },
            { name: "Marinated Tofu Cubes", amount: "150g" },
            { name: "Edamame & Avocado", amount: "1 cup" },
            { name: "Sesame Ginger Vinaigrette", amount: "2 tbsp" }
        ],
        steps: [
            { text: "Assemble brown rice base in a wide bowl." },
            { text: "Arrange marinated tofu cubes, edamame, cucumber, and sliced avocado." },
            { text: "Drizzle sesame ginger vinaigrette and sprinkle furikake seasoning." }
        ]
    }
];
