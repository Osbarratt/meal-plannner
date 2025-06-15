
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Ingredient, MealType, Recipe, GrocerySuggestionResponse, TraderJoeItemCost, SuggestedRecipe } from '../types';
import { GEMINI_MODEL_TEXT, ALL_MEAL_TYPES } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please set the process.env.API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const parseJsonFromText = <T,>(text: string, context?: string): T => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    const errorContext = context ? `Context: ${context}. ` : "";
    console.error(`Failed to parse JSON response. ${errorContext}Error: `, e, "Original text:", text);
    throw new Error(`Failed to parse AI's JSON response. ${errorContext}Raw output: ${text.substring(0, 300)}...`);
  }
};


export const generateRecipes = async (ingredients: Ingredient[], mealTypes: MealType[]): Promise<Recipe[]> => {
  if (!API_KEY) throw new Error("API Key for Gemini not configured.");
  
  const ingredientNames = ingredients.map(i => i.name).join(', ');
  const mealTypesString = mealTypes.join(', ');
  const availableMealTypesEnum = Object.values(MealType).join(', ');


  const prompt = `
    You are a helpful culinary assistant. I have the following ingredients: ${ingredientNames || 'various common items'}.
    Please suggest 3-5 recipes suitable for these meal types: ${mealTypesString}.
    Assume I have common spices (salt, pepper, garlic powder, onion powder, paprika, oregano, basil), cooking oil (olive, vegetable), butter, flour, sugar, eggs, milk, soy sauce, and standard kitchen equipment.
    
    For each recipe, provide:
    1. "name": A creative and appealing name for the dish.
    2. "cuisine": The primary cuisine style (e.g., "Italian", "Mexican", "American", "Chinese", "Indian", "Mediterranean").
    3. "mealType": The most appropriate meal type for this recipe from my selection (${mealTypesString}). Choose one from these specific values: ${availableMealTypesEnum}.
    4. "ingredientsFromMyList": An array of strings listing ingredients specifically from my provided list (${ingredientNames}) that are used in this recipe. If an ingredient from my list is used, its name here MUST EXACTLY MATCH one of the names in my list.
    5. "additionalCommonIngredients": An array of strings listing any other common kitchen staples (like "Olive Oil", "Garlic", "Onion", "Salt", "Black Pepper", specific spices if crucial beyond basics, vinegar, etc.) needed for this recipe. Do not list items from my provided ingredient list here. These should be generic common items.
    6. "instructions": A string containing clear, step-by-step cooking instructions. Number the steps.

    Format the response strictly as a JSON array of recipe objects.
    CRITICAL: The response MUST be ONLY the JSON array, with no other text, explanations, or comments before, after, or interspersed within the JSON.
    Example object:
    {
      "name": "Quick Garlic Herb Chicken",
      "cuisine": "American",
      "mealType": "Dinner", 
      "ingredientsFromMyList": ["Chicken Breast"],
      "additionalCommonIngredients": ["Olive Oil", "Garlic Powder", "Dried Oregano", "Salt", "Pepper"],
      "instructions": "1. Preheat oven to 200°C. 2. Rub chicken with olive oil and spices. 3. Bake for 20-25 minutes."
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const parsedRecipes = parseJsonFromText<Recipe[]>(response.text, "generateRecipes");
    if (!parsedRecipes || !Array.isArray(parsedRecipes)) {
        console.error("Parsed response is not an array:", parsedRecipes);
        throw new Error("AI response was not in the expected array format for recipes.");
    }
    // Validate meal types
    return parsedRecipes.map(recipe => ({
        ...recipe,
        mealType: Object.values(MealType).includes(recipe.mealType) ? recipe.mealType : MealType.Dinner, // Default if invalid
        ingredientsFromMyList: recipe.ingredientsFromMyList || [],
        additionalCommonIngredients: recipe.additionalCommonIngredients || [],
    }));

  } catch (error) {
    console.error("Error generating recipes:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error for recipe generation: ${error.message}`);
    }
    throw new Error("Unknown error occurred while generating recipes.");
  }
};

export const suggestGroceries = async (currentIngredients: Ingredient[], budget: number, mealTypes: MealType[]): Promise<GrocerySuggestionResponse> => {
  if (!API_KEY) throw new Error("API Key for Gemini not configured.");

  const ingredientNames = currentIngredients.map(i => i.name).join(', ');
  const mealTypesString = mealTypes.join(', ');
  const allMealTypesEnumString = Object.values(MealType).join(', ');
  
  const prompt = `
    You are a Trader Joe's shopping assistant. I currently have these groceries: ${ingredientNames || 'a few basic items'}.
    My budget for new Trader Joe's groceries is approximately $${budget}.
    I am looking for recipe ideas for these meal types: ${mealTypesString.length > 0 ? mealTypesString : 'any meal type will do'}.

    Please suggest:
    1. "traderJoesSuggestions": An array of 5-7 specific Trader Joe's product names that would complement my current items and fit within the budget. Be creative and suggest items that offer good value or unique flavors.
    2. "suggestedRecipes": An array of AT LEAST 4 new, simple recipe ideas. Each recipe should primarily use items from "traderJoesSuggestions" and optionally items from "fromMyList" or "commonStaple".
       For each recipe, provide:
       a. "name": The recipe name.
       b. "mealType": The most appropriate meal type for this recipe. If specific meal types were requested (${mealTypesString}), choose one from those. Otherwise, choose one from ${allMealTypesEnumString}. This value MUST be one of the exact enum values provided.
       c. "cuisine": A general cuisine style (e.g., "American", "Italian", "Fusion", "Trader Joe's Inspired").
       d. "ingredientsNeeded": An array of objects, where each object has "item" (string, e.g., "Trader Joe's Unexpected Cheddar") and "source" (string, one of: "fromMyList", "newTraderJoesItem", "commonStaple").
       e. "estimatedNewItemsCost": A string representing the estimated cost of ONLY the "newTraderJoesItem" ingredients used in THIS specific recipe (e.g., "$5-$7", "$10.50", "approx. $8"). This should only account for the new TJ's items for this recipe.
       f. "instructions": Clear, step-by-step cooking instructions (numbered).

    Format the response strictly as a single JSON object.
    CRITICAL: The response MUST be ONLY the JSON object, with no other text, explanations, or comments before, after, or interspersed within the JSON.
    Example for one suggested recipe within the "suggestedRecipes" array:
    {
      "name": "Quick TJ's Chicken & Veggie Stir-fry",
      "mealType": "Dinner",
      "cuisine": "Asian-Inspired",
      "ingredientsNeeded": [
        {"item": "Trader Joe's Organic Chicken Thighs", "source": "newTraderJoesItem"},
        {"item": "Trader Joe's Stir-Fry Vegetables", "source": "newTraderJoesItem"},
        {"item": "Trader Joe's Soyaki Sauce", "source": "newTraderJoesItem"},
        {"item": "Brown Rice", "source": "fromMyList"},
        {"item": "Sesame Oil", "source": "commonStaple"}
      ],
      "estimatedNewItemsCost": "$12-$15",
      "instructions": "1. Cook brown rice. 2. Slice chicken and stir-fry. 3. Add veggies and cook until tender-crisp. 4. Add Soyaki sauce and serve over rice."
    }
    The full response will be an object like: {"traderJoesSuggestions": [], "suggestedRecipes": [/* example above */]}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8, 
      }
    });
    
    const parsedSuggestions = parseJsonFromText<GrocerySuggestionResponse>(response.text, "suggestGroceries");
    
    if (!parsedSuggestions || typeof parsedSuggestions.traderJoesSuggestions === 'undefined' || typeof parsedSuggestions.suggestedRecipes === 'undefined') {
        console.error("Parsed response is not a valid GrocerySuggestionResponse object:", parsedSuggestions);
        throw new Error("AI response was not in the expected object format for grocery suggestions.");
    }
    if(!Array.isArray(parsedSuggestions.traderJoesSuggestions)) parsedSuggestions.traderJoesSuggestions = [];
    if(!Array.isArray(parsedSuggestions.suggestedRecipes)) parsedSuggestions.suggestedRecipes = [];
    
    parsedSuggestions.suggestedRecipes = parsedSuggestions.suggestedRecipes.map((recipe: SuggestedRecipe) => ({
        ...recipe,
        mealType: Object.values(MealType).includes(recipe.mealType) ? recipe.mealType : (mealTypes[0] || MealType.Dinner), // Default if invalid
        cuisine: recipe.cuisine || "Miscellaneous",
        ingredientsNeeded: Array.isArray(recipe.ingredientsNeeded) ? recipe.ingredientsNeeded : [],
        estimatedNewItemsCost: recipe.estimatedNewItemsCost || "N/A",
    }));

    return parsedSuggestions;

  } catch (error) {
    console.error("Error suggesting groceries:", error);
     if (error instanceof Error) {
        throw new Error(`Gemini API error for grocery suggestions: ${error.message}`);
    }
    throw new Error("Unknown error occurred while suggesting groceries.");
  }
};

export const getIngredientCostsForRecipe = async (neededIngredients: string[]): Promise<TraderJoeItemCost[]> => {
  if (!API_KEY) throw new Error("API Key for Gemini not configured.");
  if (neededIngredients.length === 0) return [];

  const ingredientListString = neededIngredients.map(name => `"${name}"`).join(', ');

  const prompt = `
    You are a Trader Joe's pricing assistant. For the following list of grocery items: [${ingredientListString}],
    estimate their current approximate price if purchased at a typical Trader Joe's store in the USA.
    Some items might be generic (e.g., "Onion") while others might be specific if the user implies it.
    
    For each item in the provided list, respond with:
    1. "name": The EXACT ingredient name as it was provided in the input list.
    2. "price": A string representing the estimated price (e.g., "$2.99", "$4.99/lb", "Varies", or null if truly unpriceable or not a typical grocery item).
    3. "atTraderJoes": A boolean (true/false) indicating if this item or a very close equivalent is commonly found at Trader Joe's. If it's a generic item like "Onion", assume true if Trader Joe's sells onions.

    Format the response strictly as a JSON array of objects, with one object per ingredient from the input list.
    Ensure the 'name' in your response MATCHES the 'name' from the input list for easy mapping.
    
    CRITICAL: The response MUST be ONLY the JSON array. Do NOT include any additional text, explanations, notes, or comments before, after, or interspersed within the JSON objects or the array itself.
    The output must be a clean, parsable JSON array.

    Example input: ["Trader Joe's Organic Blueberries", "Large Onion", "Unobtanium Spice"]
    Correct JSON output structure:
    [
      { "name": "Trader Joe's Organic Blueberries", "price": "$4.49", "atTraderJoes": true },
      { "name": "Large Onion", "price": "$0.79", "atTraderJoes": true },
      { "name": "Unobtanium Spice", "price": null, "atTraderJoes": false }
    ]
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Very low temperature for factual recall and strict formatting
      }
    });

    const parsedCosts = parseJsonFromText<TraderJoeItemCost[]>(response.text, `getIngredientCostsForRecipe - Ingredients: ${ingredientListString}`);
    if (!parsedCosts || !Array.isArray(parsedCosts)) {
      console.error("Parsed costs response is not an array:", parsedCosts);
      throw new Error("AI response for ingredient costs was not in the expected array format.");
    }
    // Ensure all requested ingredients are covered, even if API fails for some
    const resultWithAllIngredients: TraderJoeItemCost[] = neededIngredients.map(requestedName => {
        const found = parsedCosts.find(p => p.name === requestedName);
        if (found) return found;
        return { name: requestedName, price: null, atTraderJoes: false }; // Default if not found in response
    });


    return resultWithAllIngredients;

  } catch (error) {
    console.error("Error fetching ingredient costs:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error for ingredient costs: ${error.message}`);
    }
    // Fallback: return all ingredients as not found/priced if API fails globally
    return neededIngredients.map(name => ({ name, price: null, atTraderJoes: false }));
  }
};