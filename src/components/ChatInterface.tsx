'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2, Download, Copy, Trash2, Sparkles, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { exportToPDF, extractUserInfoFromMessages, type NutritionPlanData } from '@/lib/utils/pdf-export';
import type { Message, UserProfile } from '@/types';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
  userProfile: UserProfile;
}

export function ChatInterface({ 
  onSendMessage, 
  messages, 
  isLoading, 
  userProfile 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const message = input.trim();
      setInput(''); // Limpar imediatamente
      await onSendMessage(message);
    }
  };

  const formatMessage = (content: string) => {
    // Conversão avançada de markdown para HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #059669;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
      .replace(/\n/g, '<br />')
      .replace(/^/, '<p style="margin: 12px 0;">')
      .replace(/$/, '</p>');
  };

  const handleExportPDF = async () => {
    if (messages.length === 0) {
      alert('Nenhum plano para exportar. Converse com o assistente primeiro!');
      return;
    }
    
    try {
      setIsExporting(true);
      setExportStatus('idle');
      
      // Extrair informações do usuário das mensagens
      const userInfo = extractUserInfoFromMessages(messages);
      
      // Encontrar a última resposta do assistente que contenha um plano
      const assistantMessages = messages
        .filter(msg => msg.role === 'assistant')
        .reverse();
      
      let planContent = '';
      
      // Procurar por uma resposta que pareça ser um plano completo
      for (const message of assistantMessages) {
        if (message.content.includes('Plano Alimentar') || 
            message.content.includes('Refeições') || 
            message.content.includes('Café da Manhã') ||
            message.content.includes('### ') ||
            message.content.includes('## ') ||
            message.content.length > 500) {
          planContent = message.content;
          break;
        }
      }

      if (!planContent) {
        alert('Nenhum plano completo encontrado. Peça ao assistente para gerar um plano alimentar completo!');
        setIsExporting(false);
        return;
      }

      // Preparar dados para o PDF
      const planData: NutritionPlanData = {
        ...userInfo,
        plan: planContent,
        generatedAt: new Date(),
      };

      // Gerar e baixar o PDF
      await exportToPDF(planData);
      
      setExportStatus('success');
      
      // Resetar o estado após 3 segundos
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      setExportStatus('error');
      alert('Erro ao exportar PDF. Tente novamente.');
      
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Aqui você pode adicionar uma notificação de sucesso
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const convertMarkdownToHtml = (text: string) => {
    // Converter ## em negrito
    let converted = text.replace(/^## (.+)$/gm, '<strong>$1</strong>');
    // Converter ### em negrito
    converted = converted.replace(/^### (.+)$/gm, '<strong>$1</strong>');
    // Converter quebras de linha
    converted = converted.replace(/\n/g, '<br>');
    return converted;
  };

  const renderQuickOptions = (content: string) => {
    // Não mostrar opções se for um plano alimentar
    if (content.includes('# Plano Alimentar') || content.includes('## Seus Objetivos') || content.includes('### Café da Manhã')) {
      return null;
    }
    
    // Detectar se a mensagem contém perguntas com opções (apenas uma categoria por vez)
    const contentLower = content.toLowerCase();
    let quickOptions: string[] = [];
    let categoryName = '';
    
    // Prioridade: ordem mais específica primeiro
    if (contentLower.includes('atividade física') || (contentLower.includes('exercício') && contentLower.includes('nível'))) {
      quickOptions = [
        'Sedentário (pouco ou nenhum exercício)',
        'Leve (exercícios leves 1-3 dias/semana)',
        'Moderado (exercícios moderados 3-5 dias/semana)',
        'Intenso (exercícios intensos 6-7 dias/semana)'
      ];
      categoryName = 'Nível de Atividade';
    } else if (contentLower.includes('objetivo') && !contentLower.includes('restrição')) {
      quickOptions = [
        'Perder peso de forma saudável',
        'Ganhar massa muscular',
        'Manter o peso atual',
        'Melhorar a saúde geral'
      ];
      categoryName = 'Objetivo Principal';
    } else if (contentLower.includes('restrição') || contentLower.includes('alergia') || contentLower.includes('intolerância')) {
      quickOptions = [
        'Não tenho restrições',
        'Vegetariano/Vegano',
        'Intolerância à lactose',
        'Diabetes',
        'Outras restrições'
      ];
      categoryName = 'Restrições Alimentares';
    } else if ((contentLower.includes('tempo') && contentLower.includes('cozinhar')) || contentLower.includes('preparar refeições')) {
      quickOptions = [
        'Tenho bastante tempo para cozinhar',
        'Tempo moderado (30-45 min/dia)',
        'Pouco tempo (15-30 min/dia)',
        'Prefiro opções práticas e rápidas'
      ];
      categoryName = 'Tempo para Cozinhar';
    }
    
    if (quickOptions.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-2">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">{categoryName} - Opções rápidas:</p>
          <div className="flex flex-wrap gap-1">
            {quickOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(option);
                  // Auto-focus no input após selecionar
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }, 100);
                }}
                className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 hover:bg-green-100 hover:border-green-300 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const clearChat = () => {
    if (confirm('Tem certeza que deseja limpar toda a conversa?')) {
      window.location.reload();
    }
  };

  const hasNutritionPlan = messages.some(msg => 
    msg.role === 'assistant' && 
    (msg.content.includes('Café da Manhã') || 
     msg.content.includes('Almoço') || 
     msg.content.includes('Calorias') ||
     msg.content.includes('### ') ||
     msg.content.includes('## ') ||
     msg.content.length > 500)
  );

  const getExportButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Gerando PDF...
        </>
      );
    }
    
    if (exportStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          PDF Baixado!
        </>
      );
    }
    
    if (exportStatus === 'error') {
      return (
        <>
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Erro ao gerar
        </>
      );
    }
    
    return (
      <>
        <Download className="h-4 w-4 mr-2" />
        Exportar PDF
      </>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header com gradiente e ações */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nutricionista IA</h1>
              <p className="text-green-100 text-sm">
                Planos personalizados com IA
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasNutritionPlan && (
              <Button 
                onClick={handleExportPDF}
                disabled={isExporting}
                variant="secondary"
                size="sm"
                className={`bg-white/20 hover:bg-white/30 text-white border-0 transition-colors ${
                  exportStatus === 'success' ? 'bg-green-500/30' : 
                  exportStatus === 'error' ? 'bg-red-500/30' : ''
                }`}
              >
                {getExportButtonContent()}
              </Button>
            )}
            
            {messages.length > 0 && (
              <Button 
                onClick={clearChat}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="rounded-t-none shadow-xl border-0 h-[650px] flex flex-col">
        <CardContent className="flex-1 flex flex-col gap-3 p-4">
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 h-full max-h-[450px] overflow-y-auto"
        >
          <div className="space-y-3 p-4 min-h-full">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium mb-2">
                    Olá! Sou seu Nutricionista IA
                  </p>
                  <p className="text-gray-500 text-sm">
                    Compartilhe suas informações para criar seu plano personalizado
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={message.id} className="mb-4">
                {message.role === 'user' ? (
                  // Mensagem do usuário - design moderno
                  <div className="flex justify-end items-start gap-2">
                    <div className="max-w-[80%] group">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl rounded-tr-md p-3 shadow-md">
                        <div 
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: convertMarkdownToHtml(message.content)
                          }}
                        />
                        <div className="flex items-center justify-between mt-1 text-xs text-green-100">
                          <span>
                            {message.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <Button
                            onClick={() => copyToClipboard(message.content)}
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ) : (
                  // Mensagem do assistente - estilo elegante
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <div className="max-w-[85%] group">
                      <div className="bg-white rounded-xl rounded-tl-md p-3 shadow-md border border-gray-100">
                        <div 
                          className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: convertMarkdownToHtml(message.content)
                          }}
                        />
                        {/* Botões de opções rápidas */}
                        {renderQuickOptions(message.content)}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {message.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => copyToClipboard(message.content)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100"
                            >
                              <Copy className="h-2.5 w-2.5 text-gray-400" />
                            </Button>
                            {/* Mostrar botão de exportar apenas na última mensagem se for um plano */}
                            {index === messages.length - 1 && hasNutritionPlan && (
                              <Button
                                onClick={handleExportPDF}
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-gray-100"
                                disabled={isExporting}
                              >
                                {isExporting ? (
                                  <Loader2 className="h-2.5 w-2.5 text-gray-400 animate-spin" />
                                ) : (
                                  <Download className="h-2.5 w-2.5 text-gray-400" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-start items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Heart className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="max-w-[80%]">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-gray-600 text-sm">Analisando suas informações e criando seu plano...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Sugestões rápidas (apenas quando não há mensagens) */}
        {messages.length === 0 && (
          <div className="px-4 py-3 border-t bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-2">Sugestões para começar:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Tenho 25 anos, peso 70kg e quero ganhar massa muscular',
                'Preciso de um plano para perder 5kg de forma saudável',
                'Sou vegetariano e quero um plano equilibrado'
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Área de input moderna */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder={messages.length === 0 ? 
                  "Olá! Me conte sua idade, peso, altura e seus objetivos..." : 
                  "Continue nossa conversa..."
                }
                disabled={isLoading}
                className="w-full min-h-[80px] max-h-[50px] p-3 border-2 border-gray-200 focus:border-green-400 rounded-xl transition-colors resize-none bg-white"
                rows={3}
              />
              {input.length > 0 && (
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  {input.length}/500
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          
          {/* Aviso legal */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Este é um assistente de IA. Consulte sempre um nutricionista profissional para acompanhamento personalizado.
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}