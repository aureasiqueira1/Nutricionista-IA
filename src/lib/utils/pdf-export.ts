import jsPDF from 'jspdf';

export interface NutritionPlanData {
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  plan: string;
  generatedAt: Date;
}

export async function exportToPDF(planData: NutritionPlanData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);

  let yPosition = 0;
  let currentPage = 1;

  // Função para adicionar nova página
  const addNewPage = () => {
    pdf.addPage();
    currentPage++;
    yPosition = margin;
  };

  // Função para verificar quebra de página
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      addNewPage();
      return true;
    }
    return false;
  };

  // Header simples
  const createHeader = () => {
    // Título
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Plano Alimentar Personalizado', margin, 25);
    
    // Data
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const dateText = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, pageWidth - margin - dateWidth, 25);

    // Linha separadora
    pdf.setLineWidth(0.5);
    pdf.line(margin, 30, pageWidth - margin, 30);

    yPosition = 40;
  };

  // Informações do cliente (apenas se existirem)
  const createClientInfo = () => {
    const hasInfo = planData.name || planData.age || planData.weight || planData.height || planData.goal;
    
    if (!hasInfo) return;

    checkPageBreak(30);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informações do Cliente', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    if (planData.name) {
      pdf.text(`Nome: ${planData.name}`, margin, yPosition);
      yPosition += 6;
    }

    const infoLine = [];
    if (planData.age) infoLine.push(`Idade: ${planData.age} anos`);
    if (planData.weight) infoLine.push(`Peso: ${planData.weight} kg`);
    if (planData.height) infoLine.push(`Altura: ${planData.height} cm`);

    if (infoLine.length > 0) {
      pdf.text(infoLine.join(' | '), margin, yPosition);
      yPosition += 6;
    }

    if (planData.goal) {
      pdf.text(`Objetivo: ${planData.goal}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 8;
  };

  // Processar conteúdo do plano
  const processPlan = () => {
    // Primeiro, limpar o conteúdo removendo parágrafos introdutórios completos
    let cleanedPlan = planData.plan;
    
    // Remover parágrafos que contenham frases introdutórias
    const introductoryPhrases = [
      /.*Ótimo!.*(?:vou elaborar|elaborar o).*\n?/gi,
      /.*Agora que tenho.*informações.*\n?/gi,
      /.*Com todas as informações.*posso criar.*\n?/gi,
      /.*baseado nas suas informações.*\n?/gi,
      /.*baseado nas informações.*\n?/gi,
      /.*Perfeito!.*vou.*\n?/gi,
      /.*Excelente!.*\n?/gi,
      /.*todas as informações necessárias.*\n?/gi
    ];
    
    introductoryPhrases.forEach(phrase => {
      cleanedPlan = cleanedPlan.replace(phrase, '');
    });
    
    const lines = cleanedPlan.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        yPosition += 3;
        continue;
      }
      
      // Ignorar texto introdutório desnecessário
      if (line.includes('Ótimo!') ||
          line.includes('Obrigad') || 
          line.includes('Com todas as informações') || 
          line.includes('posso criar') || 
          line.includes('Vou elaborar') ||
          line.includes('vou elaborar') ||
          line.includes('todas as informações necessárias') ||
          line.includes('informações necessárias') ||
          line.includes('Agora que tenho') ||
          line.includes('agora que tenho') ||
          line.includes('Perfeito!') ||
          line.includes('Excelente!') ||
          line.includes('baseado nas suas') ||
          line.includes('baseado nas informações') ||
          line.includes('suas informações') ||
          line.startsWith('**') ||
          line.includes('Plano Alimentar Personalizado')) {
        continue;
      }
      
      // Títulos principais (### ou ##)
      if (line.startsWith('### ') || line.startsWith('## ')) {
        checkPageBreak(15);
        
        const title = line.replace(/^#{2,3}\s*/, '').trim();
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPosition);
        yPosition += 10;
        continue;
      }
      
      // Títulos de refeição (horários)
      if (line.includes('h') && (line.includes('Café') || line.includes('Almoço') || line.includes('Jantar') || line.includes('Lanche'))) {
        checkPageBreak(10);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line, margin + 3, yPosition);
        yPosition += 8;
        continue;
      }
      
      // Lista com bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        checkPageBreak(6);
        
        const bulletText = line.replace(/^[-•]\s*/, '');
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('•', margin + 6, yPosition);
        
        const wrappedText = pdf.splitTextToSize(bulletText, contentWidth - 15);
        pdf.text(wrappedText, margin + 12, yPosition);
        
        yPosition += wrappedText.length * 5 + 2;
        continue;
      }
      
      // Texto normal
      checkPageBreak(6);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const wrappedText = pdf.splitTextToSize(line, contentWidth);
      pdf.text(wrappedText, margin, yPosition);
      yPosition += wrappedText.length * 5 + 2;
    }
  };

  // Footer simples
  const createFooter = () => {
    const footerY = pageHeight - 15;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Disclaimer
    const disclaimer = 'Este plano foi gerado por IA. Consulte um nutricionista profissional.';
    const disclaimerWidth = pdf.getTextWidth(disclaimer);
    pdf.text(disclaimer, (pageWidth - disclaimerWidth) / 2, footerY);
    
    // Número da página
    pdf.text(`${currentPage}`, pageWidth - margin - 5, footerY);
  };

  // Montagem do PDF
  try {
    createHeader();
    createClientInfo();
    processPlan();
    
    // Adicionar footer em todas as páginas
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      createFooter();
    }
    
    // Download com nome simples
    const userName = planData.name ? planData.name.replace(/\s+/g, '-').toLowerCase() : 'cliente';
    const fileName = `plano-alimentar-${userName}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Erro ao gerar PDF. Tente novamente.');
  }
}

export function extractUserInfoFromMessages(messages: any[]): Partial<NutritionPlanData> {
  const userInfo: Partial<NutritionPlanData> = {};
  
  const userMessages = messages
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.content)
    .join(' ');
    
  const userMessagesLower = userMessages.toLowerCase();

  // Extrair nome
  const namePatterns = [
    /(?:meu nome (?:é|eh|e)\s+|eu sou (?:a|o)?\s*|me chamo\s+)([A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ][a-záàâãäéèêëíìîïóòôõöúùûüç]+(?:\s+[A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ][a-záàâãäéèêëíìîïóòôõöúùûüç]+)*)/i,
  ];
  
  for (const pattern of namePatterns) {
    const nameMatch = userMessages.match(pattern);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      const invalidWords = ['tenho', 'anos', 'peso', 'quero', 'gostaria', 'preciso', 'altura'];
      if (name.length > 2 && !invalidWords.some(word => name.toLowerCase().includes(word))) {
        userInfo.name = name;
        break;
      }
    }
  }

  // Extrair idade
  const agePatterns = [
    /(?:tenho\s+|idade[:\s]+)(\d{1,2})\s*anos?/i,
    /(\d{1,2})\s*anos/i,
  ];
  
  for (const pattern of agePatterns) {
    const ageMatch = userMessagesLower.match(pattern);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (age >= 15 && age <= 100) {
        userInfo.age = age;
        break;
      }
    }
  }

  // Extrair peso
  const weightPatterns = [
    /(?:peso\s+)(\d{1,3}(?:[.,]\d{1,2})?)\s*kg/i,
    /(\d{1,3}(?:[.,]\d{1,2})?)\s*kg/i,
  ];
  
  for (const pattern of weightPatterns) {
    const weightMatch = userMessagesLower.match(pattern);
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1].replace(',', '.'));
      if (weight >= 30 && weight <= 300) {
        userInfo.weight = weight;
        break;
      }
    }
  }

  // Extrair altura
  const heightPatterns = [
    /(\d{1}\.\d{1,2})\s*m/i,
    /(\d{3})\s*cm/i,
  ];
  
  for (const pattern of heightPatterns) {
    const heightMatch = userMessagesLower.match(pattern);
    if (heightMatch) {
      const height = parseFloat(heightMatch[1].replace(',', '.'));
      if (height > 10) {
        userInfo.height = height;
      } else if (height > 1.3 && height < 3) {
        userInfo.height = height * 100;
      }
      break;
    }
  }

  // Extrair objetivo
  const goalPatterns = [
    { pattern: /(?:ganhar\s+peso|ganhar\s+massa|hipertrofia|massa\s+muscular)/i, goal: 'Ganhar massa muscular' },
    { pattern: /(?:perder\s+peso|emagrecer|emagrecimento)/i, goal: 'Perder peso' },
    { pattern: /(?:manter\s+peso|manutenção)/i, goal: 'Manter peso' },
    { pattern: /(?:melhorar\s+saúde|saudável)/i, goal: 'Melhorar saúde' },
  ];

  for (const { pattern, goal } of goalPatterns) {
    if (pattern.test(userMessagesLower)) {
      userInfo.goal = goal;
      break;
    }
  }

  return userInfo;
}