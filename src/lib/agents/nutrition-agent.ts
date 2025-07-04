import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import type { UserProfile, Message } from "@/types";

export class NutritionAgent {
  private llm: ChatOpenAI;
  private conversationChain: RunnableSequence;

  constructor() {
    this.llm = new ChatOpenAI({
      temperature: 0.7,
      modelName: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.conversationChain = this.createConversationChain();
  }

  private createConversationChain() {
    const prompt = PromptTemplate.fromTemplate(`
      Você é um nutricionista especializado virtual que ajuda as pessoas a criar planos alimentares personalizados e saudáveis.

REGRAS IMPORTANTES:
- FAÇA APENAS UMA PERGUNTA POR VEZ
- NÃO REPITA PERGUNTAS JÁ FEITAS
- Analise o histórico antes de fazer nova pergunta
- Seja empático e acolhedor
- Quando tiver informações suficientes, CRIE O PLANO ALIMENTAR

INFORMAÇÕES MÍNIMAS PARA CRIAR PLANO:
- Idade (aproximada se não exata)
- Peso (aproximado se não exato)
- Objetivo principal (perder/ganhar/manter peso)
- Nível de atividade física

SEQUÊNCIA DE PERGUNTAS (uma por vez, se ainda não foi perguntado):
1. Nome e idade
2. Peso atual
3. Altura
4. Nível de atividade física
5. Objetivo principal (perder/ganhar/manter peso)
6. Restrições alimentares (se houver)
7. Tempo disponível para cozinhar

PERFIL ATUAL DO USUÁRIO:
{userProfile}

HISTÓRICO DA CONVERSA:
{conversationHistory}

ANÁLISE CRÍTICA ANTES DE RESPONDER:
1. LEIA TODO O HISTÓRICO e identifique EXATAMENTE quais informações já foram fornecidas
2. VERIFIQUE se já tem (procure por estes padrões EXATOS):
   - NOME: "eu sou", "meu nome é", "me chamo", "sou a/o" = JÁ TEM NOME
   - IDADE: números + "anos", "tenho X anos" = JÁ TEM IDADE  
   - PESO: números + "kg", "peso X", "X quilos" = JÁ TEM PESO
   - ALTURA: números + "cm", "metro", "1,X", "altura", "meço" = JÁ TEM ALTURA
   - OBJETIVO: "ganhar", "perder", "emagrecer", "massa", "definir" = JÁ TEM OBJETIVO
   - ATIVIDADE: "sedentário", "ativo", "exercício", "academia", "treino" = JÁ TEM ATIVIDADE
   - RESTRIÇÕES: "vegetariano", "vegano", "alergia", "intolerância" = JÁ TEM RESTRIÇÕES

3. REGRA ANTI-REPETIÇÃO:
   - Se ALTURA já foi mencionada (cm, metro, 1,X, "meço", "altura") = NÃO PERGUNTE ALTURA NOVAMENTE
   - Se PESO já foi mencionado (kg, quilos, "peso") = NÃO PERGUNTE PESO NOVAMENTE
   - Se IDADE já foi mencionada (anos, "tenho X") = NÃO PERGUNTE IDADE NOVAMENTE

4. Se histórico VAZIO: pergunte APENAS "Qual é o seu nome?"
5. Se tem TODAS as informações essenciais: CRIE O PLANO COMPLETO
6. Se falta UMA informação: pergunte APENAS essa informação
7. JAMAIS repita perguntas sobre dados já coletados
8. Se mensagem confusa: "Para começar, me conte seus objetivos"

FORMATO DAS PERGUNTAS:
[Pergunta específica e clara]

FORMATO DO PLANO ALIMENTAR (quando criar):
### Plano Alimentar Personalizado para [Nome]

Objetivo: [objetivo do cliente]

## Suas Necessidades
- Calorias diárias: [valor estimado]
- Distribuição: Carboidratos, Proteínas, Gorduras

## Seu Plano

### Café da Manhã (7h00)
[Alimentos específicos com quantidades]

### Lanche da Manhã (10h00)
[Opções]

### Almoço (12h30)
[Prato completo]

### Lanche da Tarde (15h30)
[Opções]

### Jantar (19h00)
[Refeição]

### Ceia (21h30) - Se necessário
[Opção leve]

## Dicas Importantes
[Orientações personalizadas]

## Hidratação
[Recomendações de água]

Mensagem do usuário: {userMessage}

Resposta do nutricionista:
    `);

    return RunnableSequence.from([
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);
  }

  async processMessage(
    userMessage: string,
    userProfile: UserProfile,
    conversationHistory: Message[]
  ): Promise<string> {
    try {
      const response = await this.conversationChain.invoke({
        userMessage,
        userProfile: JSON.stringify(userProfile),
        conversationHistory: conversationHistory
          .slice(-10) // Últimas 10 mensagens para contexto
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n'),
      });

      return response;
    } catch (error) {
      console.error('Erro no agente de nutrição:', error);
      throw new Error('Desculpe, houve um erro ao processar sua mensagem. Tente novamente.');
    }
  }

  async generateNutritionPlan(userProfile: UserProfile): Promise<string> {
    const planPrompt = PromptTemplate.fromTemplate(`
      Crie um plano alimentar detalhado e personalizado baseado no perfil do usuário.

      PERFIL DO USUÁRIO:
      {userProfile}

      INSTRUÇÕES:
      1. Calcule as necessidades calóricas baseadas no perfil
      2. Distribua macronutrientes apropriadamente
      3. Crie 5-6 refeições por dia com horários
      4. Inclua alimentos variados e nutritivos
      5. Considere restrições e preferências
      6. Adicione dicas de hidratação
      7. Forneça orientações importantes

      FORMATO:
      # Plano Alimentar Personalizado

      ## Objetivos
      [Descreva os objetivos baseados no perfil]

      ## Necessidades Nutricionais
      - Calorias diárias: [valor] kcal
      - Carboidratos: [valor]g ([porcentagem]%)
      - Proteínas: [valor]g ([porcentagem]%)
      - Gorduras: [valor]g ([porcentagem]%)

      ## Refeições

      ### Café da Manhã (7h00)
      [Alimentos detalhados com quantidades]

      ### Lanche da Manhã (10h00)
      [Alimentos detalhados com quantidades]

      ### Almoço (12h30)
      [Alimentos detalhados com quantidades]

      ### Lanche da Tarde (15h30)
      [Alimentos detalhados com quantidades]

      ### Jantar (19h00)
      [Alimentos detalhados com quantidades]

      ### Ceia (21h30) [se apropriado]
      [Alimentos detalhados com quantidades]

      ## Hidratação
      [Recomendações de hidratação]

      ## Dicas Importantes
      [Dicas personalizadas e relevantes]

      ## Acompanhamento
      [Orientações sobre monitoramento e ajustes]

      Gere o plano agora:
    `);

    try {
      const planChain = RunnableSequence.from([
        planPrompt,
        this.llm,
        new StringOutputParser(),
      ]);

      const plan = await planChain.invoke({
        userProfile: JSON.stringify(userProfile),
      });

      return plan;
    } catch (error) {
      console.error('Erro ao gerar plano nutricional:', error);
      throw new Error('Não foi possível gerar o plano nutricional. Tente novamente.');
    }
  }

  async validateNutritionPlan(plan: string): Promise<boolean> {
    // Implementar validação básica do plano
    return plan.includes('Calorias diárias') && 
           plan.includes('Café da Manhã') && 
           plan.includes('Almoço') && 
           plan.includes('Jantar');
  }
}