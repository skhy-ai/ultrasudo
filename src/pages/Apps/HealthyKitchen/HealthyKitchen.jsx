import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import { RECIPES } from './recipeData';
import './HealthyKitchen.css';

export default function HealthyKitchen({ embedded = false }) {
    const [filter, setFilter] = useState({ cuisine: 'all', dietary: [] });
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [cookingStep, setCookingStep] = useState(null); // null means not cooking, or index
    
    const filteredRecipes = useMemo(() => {
        return RECIPES.filter(r => {
            const cuisineMatch = filter.cuisine === 'all' || r.cuisine === filter.cuisine;
            const dietaryMatch = filter.dietary.every(tag => r.tags.includes(tag));
            return cuisineMatch && dietaryMatch;
        });
    }, [filter]);

    const toggleDietary = (tag) => {
        setFilter(f => ({
            ...f,
            dietary: f.dietary.includes(tag) ? f.dietary.filter(t => t !== tag) : [...f.dietary, tag]
        }));
    };

    const narrate = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    const startCooking = (recipe) => {
        setCookingStep(0);
        setSelectedRecipe(recipe);
        narrate(recipe.steps[0].text);
    };

    const nextStep = () => {
        if (cookingStep < selectedRecipe.steps.length - 1) {
            const next = cookingStep + 1;
            setCookingStep(next);
            narrate(selectedRecipe.steps[next].text);
        }
    };

    const prevStep = () => {
        if (cookingStep > 0) {
            const prev = cookingStep - 1;
            setCookingStep(prev);
            narrate(selectedRecipe.steps[prev].text);
        }
    };

    const content = (
        <div className="kitchen-app">
            <header className="kitchen-header">
                <h1>Mindful Kitchen</h1>
                <p>Low-glycemic living made easy and delicious.</p>
            </header>

            <div className="kitchen-filters">
                <div className="filter-group">
                    <label>Cuisine</label>
                    <select value={filter.cuisine} onChange={e => setFilter({...filter, cuisine: e.target.value})}>
                        <option value="all">All Cuisines</option>
                        <option value="Mediterranean">Mediterranean</option>
                        <option value="Indian">Indian</option>
                        <option value="Mexican">Mexican</option>
                        <option value="Asian">Asian</option>
                    </select>
                </div>
                <div className="filter-group diet-labels">
                    {['no-meat', 'no-egg', 'vegan', 'gluten-free'].map(tag => (
                        <label key={tag} className={filter.dietary.includes(tag) ? 'active' : ''}>
                            <input type="checkbox" checked={filter.dietary.includes(tag)} onChange={() => toggleDietary(tag)} />
                            {tag.replace('-', ' ')}
                        </label>
                    ))}
                </div>
            </div>

            <div className="recipe-grid">
                {filteredRecipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                        <div className="card-img" style={{ backgroundImage: `url(${recipe.image})` }}></div>
                        <div className="card-info">
                            <h3>{recipe.name}</h3>
                            <span className="cuisine-tag">{recipe.cuisine}</span>
                        </div>
                    </div>
                ))}
            </div>

            {selectedRecipe && cookingStep === null && (
                <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
                    <div className="recipe-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedRecipe(null)}>&times;</button>
                        <div className="modal-hero" style={{ backgroundImage: `url(${selectedRecipe.image})` }}></div>
                        <div className="modal-body">
                            <h2>{selectedRecipe.name}</h2>
                            <p className="cuisine-desc">{selectedRecipe.cuisine}</p>
                            
                            <h3>Ingredients</h3>
                            <div className="ingredients-grid">
                                {selectedRecipe.ingredients.map((ing, i) => (
                                    <div key={i} className="ing-item">
                                        <img src={ing.image} alt={ing.name} />
                                        <div>
                                            <strong>{ing.name}</strong>
                                            <p>{ing.amount}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="start-btn" onClick={() => startCooking(selectedRecipe)}>
                                <i className="fas fa-fire"></i> Start Cooking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cookingStep !== null && (
                <div className="cooking-overlay">
                    <div className="cooking-header">
                        <button className="back-btn" onClick={() => { setCookingStep(null); window.speechSynthesis.cancel(); }}>
                            <i className="fas fa-chevron-left"></i> End Session
                        </button>
                        <span>Step {cookingStep + 1} of {selectedRecipe.steps.length}</span>
                    </div>
                    <div className="step-card">
                        <div className="step-img" style={{ backgroundImage: `url(${selectedRecipe.steps[cookingStep].image})` }}></div>
                        <p className="step-text">{selectedRecipe.steps[cookingStep].text}</p>
                        <div className="step-controls">
                            <button disabled={cookingStep === 0} onClick={prevStep}>Previous</button>
                            <button className="voice-btn" onClick={() => narrate(selectedRecipe.steps[cookingStep].text)}>
                                <i className="fas fa-volume-up"></i>
                            </button>
                            <button disabled={cookingStep === selectedRecipe.steps.length - 1} onClick={nextStep}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (embedded) return content;

    return (
        <AppShell title="Healthy Kitchen" icon="fas fa-utensils">
            {content}
        </AppShell>
    );
}
