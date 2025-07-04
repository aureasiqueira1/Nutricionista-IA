export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }
  
  export interface UserProfile {
    age?: number;
    gender?: 'masculino' | 'feminino' | 'outro';
    weight?: number;
    height?: number;
    activityLevel?: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
    dietaryRestrictions?: string[];
    healthConditions?: string[];
    goals?: string[];
    preferences?: string[];
  }
  
  export interface NutritionPlan {
    id: string;
    userId: string;
    title: string;
    description: string;
    calories: number;
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
    meals: Meal[];
    recommendations: string[];
    createdAt: Date;
  }
  
  export interface Meal {
    id: string;
    name: string;
    time: string;
    foods: Food[];
    calories: number;
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
  }
  
  export interface Food {
    id: string;
    name: string;
    quantity: string;
    calories: number;
    macros: {
      carbs: number;
      protein: number;
      fat: number;
    };
  }
  
  export interface ChatSession {
    id: string;
    messages: Message[];
    userProfile: UserProfile;
    currentPlan?: NutritionPlan;
    status: 'active' | 'completed' | 'abandoned';
    createdAt: Date;
    updatedAt: Date;
  }