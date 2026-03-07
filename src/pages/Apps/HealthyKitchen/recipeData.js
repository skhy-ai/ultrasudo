export const RECIPES = [
    {
        id: 1,
        name: "Quinoa & Roasted Veggie Bowl",
        cuisine: "Mediterranean",
        tags: ["no-meat", "no-egg", "gluten-free", "vegan"],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Quinoa", amount: "1 cup", image: "https://placehold.co/100x100/A5D6A7/000000?text=Quinoa" },
            { name: "Bell Peppers", amount: "2, chopped", image: "https://placehold.co/100x100/A5D6A7/000000?text=Peppers" },
            { name: "Zucchini", amount: "1, chopped", image: "https://placehold.co/100x100/A5D6A7/000000?text=Zucchini" },
            { name: "Red Onion", amount: "1/2, chopped", image: "https://placehold.co/100x100/A5D6A7/000000?text=Onion" },
            { name: "Chickpeas", amount: "1 can, rinsed", image: "https://placehold.co/100x100/A5D6A7/000000?text=Chickpeas" },
            { name: "Olive Oil", amount: "2 tbsp", image: "https://placehold.co/100x100/A5D6A7/000000?text=Olive+Oil" },
            { name: "Lemon Juice", amount: "1 tbsp", image: "https://placehold.co/100x100/A5D6A7/000000?text=Lemon" },
        ],
        steps: [
            { text: "First, rinse 1 cup of quinoa under cold water. In a saucepan, bring 2 cups of water to a boil, add the quinoa, reduce heat, cover, and simmer for 15 minutes until the water is absorbed.", image: "https://placehold.co/400x300/4CAF50/FFFFFF?text=Cook+Quinoa" },
            { text: "Next, preheat your oven to 400°F or 200°C. On a baking sheet, toss the chopped bell peppers, zucchini, and red onion with 1 tablespoon of olive oil, salt, and pepper.", image: "https://placehold.co/400x300/66BB6A/FFFFFF?text=Prep+Veggies" },
            { text: "Roast the vegetables for 20-25 minutes, until tender and slightly browned. While they roast, prepare the dressing.", image: "https://placehold.co/400x300/81C784/FFFFFF?text=Roast+Veggies" },
            { text: "In a small bowl, whisk together 1 tablespoon of olive oil, lemon juice, and a pinch of salt and pepper for the dressing.", image: "https://placehold.co/400x300/A5D6A7/FFFFFF?text=Make+Dressing" },
            { text: "Finally, in a large bowl, combine the cooked quinoa, roasted vegetables, and rinsed chickpeas. Drizzle with the dressing and toss gently. Serve warm and enjoy!", image: "https://placehold.co/400x300/C8E6C9/FFFFFF?text=Combine+All" },
        ]
    },
    {
        id: 2,
        name: "Spiced Lentil Soup (Dal)",
        cuisine: "Indian",
        tags: ["no-meat", "no-egg", "gluten-free", "vegan"],
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Red Lentils", amount: "1.5 cups", image: "https://placehold.co/100x100/FFCC80/000000?text=Lentils" },
            { name: "Onion", amount: "1, chopped", image: "https://placehold.co/100x100/FFCC80/000000?text=Onion" },
            { name: "Garlic", amount: "3 cloves, minced", image: "https://placehold.co/100x100/FFCC80/000000?text=Garlic" },
            { name: "Ginger", amount: "1 inch, grated", image: "https://placehold.co/100x100/FFCC80/000000?text=Ginger" },
            { name: "Turmeric", amount: "1 tsp", image: "https://placehold.co/100x100/FFCC80/000000?text=Turmeric" },
            { name: "Cumin", amount: "1 tsp", image: "https://placehold.co/100x100/FFCC80/000000?text=Cumin" },
            { name: "Vegetable Broth", amount: "6 cups", image: "https://placehold.co/100x100/FFCC80/000000?text=Broth" },
        ],
        steps: [
            { text: "Rinse the red lentils thoroughly. In a large pot, heat a little oil over medium heat. Sauté the chopped onion until soft, about 5 minutes.", image: "https://placehold.co/400x300/FFB74D/FFFFFF?text=Sauté+Onion" },
            { text: "Add the minced garlic and grated ginger, and cook for another minute until fragrant. Then, stir in the turmeric and cumin.", image: "https://placehold.co/400x300/FFCC80/FFFFFF?text=Add+Spices" },
            { text: "Pour in the rinsed lentils and the vegetable broth. Bring the mixture to a boil.", image: "https://placehold.co/400x300/FFE0B2/FFFFFF?text=Add+Lentils" },
            { text: "Once boiling, reduce the heat, cover, and let it simmer for 20-25 minutes, until the lentils are soft and have broken down. Stir occasionally to prevent sticking.", image: "https://placehold.co/400x300/FFF3E0/FFFFFF?text=Simmer+Soup" },
            { text: "Season with salt and pepper to taste. You can use an immersion blender for a smoother consistency if you like. Serve hot with a sprinkle of fresh cilantro.", image: "https://placehold.co/400x300/FFE0B2/FFFFFF?text=Finish+Soup" },
        ]
    },
    {
        id: 3,
        name: "Chicken & Black Bean Tostadas",
        cuisine: "Mexican",
        tags: ["no-egg", "gluten-free"],
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Corn Tortillas", amount: "4", image: "https://placehold.co/100x100/EF9A9A/000000?text=Tortillas" },
            { name: "Chicken Breast", amount: "1, cooked & shredded", image: "https://placehold.co/100x100/EF9A9A/000000?text=Chicken" },
            { name: "Black Beans", amount: "1 can, rinsed", image: "https://placehold.co/100x100/EF9A9A/000000?text=Beans" },
            { name: "Avocado", amount: "1, mashed", image: "https://placehold.co/100x100/EF9A9A/000000?text=Avocado" },
            { name: "Lime", amount: "1", image: "https://placehold.co/100x100/EF9A9A/000000?text=Lime" },
            { name: "Salsa", amount: "1/2 cup", image: "https://placehold.co/100x100/EF9A9A/000000?text=Salsa" },
        ],
        steps: [
            { text: "Preheat your oven to 375°F or 190°C. Lightly spray corn tortillas with cooking spray and bake directly on the oven rack for 8-10 minutes, until crispy.", image: "https://placehold.co/400x300/E57373/FFFFFF?text=Bake+Tortillas" },
            { text: "While tortillas are baking, mash the black beans in a bowl with a fork. You can add a pinch of cumin for extra flavor.", image: "https://placehold.co/400x300/EF9A9A/FFFFFF?text=Mash+Beans" },
            { text: "In another bowl, mash the avocado and mix with the juice of half a lime and a pinch of salt to make a simple guacamole.", image: "https://placehold.co/400x300/FFCDD2/FFFFFF?text=Make+Guac" },
            { text: "Once the tortillas are crisp, remove them from the oven. Spread a layer of mashed black beans on each tostada.", image: "https://placehold.co/400x300/EF9A9A/FFFFFF?text=Assemble" },
            { text: "Top with shredded chicken, a dollop of guacamole, and your favorite salsa. Serve immediately for the best crunch!", image: "https://placehold.co/400x300/E57373/FFFFFF?text=Serve" },
        ]
    },
    {
        id: 4,
        name: "Tofu and Broccoli Stir-fry",
        cuisine: "Asian",
        tags: ["no-meat", "no-egg", "vegan"],
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "Firm Tofu", amount: "1 block", image: "https://placehold.co/100x100/90CAF9/000000?text=Tofu" },
            { name: "Broccoli", amount: "1 head", image: "https://placehold.co/100x100/90CAF9/000000?text=Broccoli" },
            { name: "Soy Sauce", amount: "3 tbsp", image: "https://placehold.co/100x100/90CAF9/000000?text=Soy+Sauce" },
            { name: "Sesame Oil", amount: "1 tbsp", image: "https://placehold.co/100x100/90CAF9/000000?text=Sesame+Oil" },
            { name: "Garlic", amount: "2 cloves, minced", image: "https://placehold.co/100x100/90CAF9/000000?text=Garlic" },
            { name: "Brown Rice", amount: "For serving", image: "https://placehold.co/100x100/90CAF9/000000?text=Rice" },
        ],
        steps: [
            { text: "Press the tofu for 30 minutes to remove excess water, then cut into 1-inch cubes. Chop the broccoli into bite-sized florets.", image: "https://placehold.co/400x300/64B5F6/FFFFFF?text=Prep+Tofu" },
            { text: "In a small bowl, whisk together soy sauce, sesame oil, and minced garlic to create the sauce.", image: "https://placehold.co/400x300/90CAF9/FFFFFF?text=Make+Sauce" },
            { text: "Heat a large skillet or wok over medium-high heat. Add a little oil and pan-fry the tofu cubes until golden brown on all sides. Remove from the skillet.", image: "https://placehold.co/400x300/BBDEFB/FFFFFF?text=Fry+Tofu" },
            { text: "Add the broccoli florets to the same skillet with a splash of water. Cover and steam for 3-4 minutes until tender-crisp.", image: "https://placehold.co/400x300/90CAF9/FFFFFF?text=Cook+Broccoli" },
            { text: "Return the tofu to the skillet with the broccoli. Pour the sauce over everything and stir to coat. Cook for 1-2 minutes until heated through. Serve hot over brown rice.", image: "https://placehold.co/400x300/64B5F6/FFFFFF?text=Combine" },
        ]
    }
];
