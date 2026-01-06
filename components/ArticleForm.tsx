import React, { useState } from 'react';
import { GenerationOptions } from '../types';

interface ArticleFormProps {
  onSubmit: (topic: string, url: string, options: GenerationOptions) => void;
  isLoading: boolean;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [tone, setTone] = useState('Amigável');
  const [length, setLength] = useState('Médio (~1000 palavras)');
  const [audience, setAudience] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() || url.trim()) {
      onSubmit(topic, url, {
        tone,
        length,
        targetAudience: audience || 'Público geral interessado no assunto'
      });
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Configurar Novo Artigo</h2>
      <p className="text-gray-500 mb-8">
        Personalize como a IA deve escrever seu conteúdo SEO.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-1">
              Assunto ou Palavra-Chave Principal
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Melhores práticas para SEO em 2025"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="tone" className="block text-sm font-semibold text-gray-700 mb-1">
              Tom de Voz
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
            >
              <option>Profissional</option>
              <option>Amigável</option>
              <option>Persuasivo</option>
              <option>Técnico</option>
              <option>Humorístico</option>
              <option>Informativo</option>
            </select>
          </div>

          <div>
            <label htmlFor="length" className="block text-sm font-semibold text-gray-700 mb-1">
              Tamanho do Texto
            </label>
            <select
              id="length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
            >
              <option>Curto (~500 palavras)</option>
              <option>Médio (~1000 palavras)</option>
              <option>Longo (2000+ palavras)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="audience" className="block text-sm font-semibold text-gray-700 mb-1">
              Público-Alvo
            </label>
            <input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex: Pequenos empreendedores, Experts em tecnologia..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-1">
            URL de Referência (Opcional)
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com/referencia"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || (!topic && !url)}
          className={`w-full py-4 rounded-lg font-bold text-lg text-white shadow-md transition-all transform hover:-translate-y-0.5
            ${isLoading || (!topic && !url)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando sua estratégia...
            </span>
          ) : (
            'Gerar Artigo Profissional'
          )}
        </button>
      </form>
    </div>
  );
};
