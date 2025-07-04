import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nutricionista IA - Plano Alimentar Personalizado',
  description: 'Crie seu plano alimentar personalizado com inteligência artificial. Nutricionista IA especializado em criar dietas sob medida para seus objetivos.',
  keywords: ['nutrição', 'dieta', 'plano alimentar', 'inteligência artificial', 'saúde'],
  authors: [{ name: 'Nutricionista IA' }],
  openGraph: {
    title: 'Nutricionista IA - Plano Alimentar Personalizado',
    description: 'Crie seu plano alimentar personalizado com inteligência artificial',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}