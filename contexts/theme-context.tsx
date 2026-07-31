import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { obterConfiguracao, definirConfiguracao } from '@/db/configuracoes';

export type TemaModo = 'claro' | 'escuro';

export type Cores = {
  fundo: string;
  fundoCartao: string;
  texto: string;
  textoSecundario: string;
  borda: string;
  primaria: string;
  perigo: string;
  placeholder: string;
};

const coresClaro: Cores = {
  fundo: '#f5f5f5',
  fundoCartao: '#ffffff',
  texto: '#1a1a1a',
  textoSecundario: '#666666',
  borda: '#dddddd',
  primaria: '#2563eb',
  perigo: '#b91c1c',
  placeholder: '#999999',
};

const coresEscuro: Cores = {
  fundo: '#000000',
  fundoCartao: '#1a1a1a',
  texto: '#ffffff',
  textoSecundario: '#aaaaaa',
  borda: '#333333',
  primaria: '#3b82f6',
  perigo: '#ef4444',
  placeholder: '#888888',
};

type ThemeContextType = {
  modo: TemaModo;
  cores: Cores;
  alternarTema: () => void;
  pronto: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<TemaModo>('escuro');
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    obterConfiguracao('tema').then((valor) => {
      if (valor === 'claro' || valor === 'escuro') setModo(valor);
      setPronto(true);
    });
  }, []);

  function alternarTema() {
    const novo: TemaModo = modo === 'claro' ? 'escuro' : 'claro';
    setModo(novo);
    definirConfiguracao('tema', novo);
  }

  const cores = modo === 'claro' ? coresClaro : coresEscuro;

  return (
    <ThemeContext.Provider value={{ modo, cores, alternarTema, pronto }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme deve ser usado dentro de AppThemeProvider');
  return ctx;
}