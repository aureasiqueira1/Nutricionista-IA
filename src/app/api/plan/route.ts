import { NextRequest, NextResponse } from 'next/server';
import { NutritionAgent } from '@/lib/agents/nutrition-agent';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userProfile } = await request.json();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Perfil do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const agent = new NutritionAgent();
    
    const plan = await agent.generateNutritionPlan(userProfile);
    const isValid = await agent.validateNutritionPlan(plan);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Não foi possível gerar um plano válido' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      plan,
      success: true 
    });

  } catch (error) {
    console.error('Erro na API do plano:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API do Plano Nutricional funcionando!',
    status: 'ok' 
  });
}