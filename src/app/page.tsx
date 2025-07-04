'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import type { Message, UserProfile } from '@/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          userProfile,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na resposta do servidor');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Atualizar perfil do usuário baseado na conversa
      // Aqui você poderia implementar lógica para extrair informações
      // do perfil do usuário a partir das mensagens

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Header Hero Section */}
      <div className="container mx-auto px-4 pt-8 pb-4 flex-1">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">🥗</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Nutricionista IA
              </h1>
              <div className="flex items-center gap-2 justify-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Inteligência Artificial Avançada</span>
              </div>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Crie seu plano alimentar personalizado com tecnologia de ponta. 
            Receba recomendações baseadas em suas necessidades únicas.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="text-2xl font-bold text-green-600">10K+</div>
              <div className="text-sm text-gray-600">Planos Criados</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">Satisfação</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <div className="text-sm text-gray-600">Disponível</div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          onSendMessage={handleSendMessage}
          messages={messages}
          isLoading={isLoading}
          userProfile={userProfile}
        />

        {/* Features Section */}
        {messages.length === 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Por que escolher nosso Nutricionista IA?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Personalizado</h3>
                <p className="text-sm text-gray-600">Planos adaptados ao seu perfil, objetivos e preferências alimentares.</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Baseado em Ciência</h3>
                <p className="text-sm text-gray-600">Recomendações fundamentadas em estudos nutricionais.</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Rápido</h3>
                <p className="text-sm text-gray-600">Receba seu plano em segundos, quando quiser.</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Exportável</h3>
                <p className="text-sm text-gray-600">Baixe seus planos em PDF para acompanhar offline.</p>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Footer fixo */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-green-100 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
          <p>© 2025 Nutricionista IA. Desenvolvido com ❤️ para sua saúde.</p>
          <p className="mt-1">Lembre-se: Este é um assistente virtual. Consulte sempre um profissional.</p>
        </div>
      </footer>
    </div>
  );
}