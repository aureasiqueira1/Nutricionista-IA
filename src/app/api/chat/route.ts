import { NextRequest, NextResponse } from 'next/server';
import { NutritionAgent } from '@/lib/agents/nutrition-agent';
import type { Message, UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message, userProfile, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    const agent = new NutritionAgent();
    
    const response = await agent.processMessage(
      message,
      userProfile || {},
      conversationHistory || []
    );

    return NextResponse.json({ 
      response,
      success: true 
    });

  } catch (error) {
    console.error('Erro na API do chat:', error);
    
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
    message: 'API do Chat do Nutricionista IA funcionando!',
    status: 'ok' 
  });
}