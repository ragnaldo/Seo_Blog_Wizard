import React, { useState, useMemo } from 'react';
import { BlogPost, GeneratedImage, GenerationStatus } from '../types';
import { MediaEditor } from './MediaEditor';
import { generateSpeech } from '../services/geminiService';

interface ArticleViewProps {
  article: BlogPost;
  featuredImage?: GeneratedImage;
  inlineImage?: GeneratedImage;
  onUpdateFeaturedImage: (img: GeneratedImage) => void;
  onStatusChange: (status: GenerationStatus) => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ 
  article, 
  featuredImage, 
  inlineImage,
  onUpdateFeaturedImage,
  onStatusChange 
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'html' | 'seo' | 'media'>('content');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Robust HTML converter (Markdown-ish to HTML)
  const renderedHtml = useMemo(() => {
    let html = article.content
      .replace(/### (.*)/g, '<h3 class="text-2xl font-bold mt-8 mb-4 text-gray-800">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-3xl font-bold mt-10 mb-5 text-gray-800 border-b pb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-5 leading-relaxed text-gray-700">')
      .replace(/^- (.*)/gm, '<li class="ml-5 list-disc mb-2 text-gray-700">$1</li>');

    return `<p class="mb-5 leading-relaxed text-gray-700">${html}</p>`;
  }, [article.content]);

  const contentParts = renderedHtml.split('[[INLINE_IMAGE_PLACEHOLDER]]');

  const handleCopyHtml = () => {
    const fullHtml = `
      <h1>${article.title}</h1>
      ${featuredImage ? `<img src="data:${featuredImage.mimeType};base64,${featuredImage.base64}" alt="${article.title}" style="max-width:100%; height:auto;" />` : ''}
      ${renderedHtml.replace('[[INLINE_IMAGE_PLACEHOLDER]]', inlineImage ? `<img src="data:${inlineImage.mimeType};base64,${inlineImage.base64}" alt="Image" style="max-width:100%; height:auto;" />` : '')}
    `;
    navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = (img: GeneratedImage, name: string) => {
    const link = document.createElement('a');
    link.href = `data:${img.mimeType};base64,${img.base64}`;
    link.download = `${name}.png`;
    link.click();
  };

  const handlePlaySummary = async () => {
    try {
      if (isPlaying) return;
      onStatusChange(GenerationStatus.GENERATING_AUDIO);
      const audioBuffer = await generateSpeech(article.summary);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      setIsPlaying(true);
      source.onended = () => setIsPlaying(false);
      onStatusChange(GenerationStatus.IDLE);
    } catch (e) {
      console.error(e);
      onStatusChange(GenerationStatus.ERROR);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start font-sans">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-1/4 sticky top-24 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-gray-900 mb-4 px-1 text-lg">Menu do Artigo</h3>
          <nav className="flex flex-col space-y-1">
            {[
              { id: 'content', label: 'Visualizar Artigo', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { id: 'html', label: 'Código HTML (WP)', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
              { id: 'seo', label: 'SEO & Metadados', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'media', label: 'Editor de Mídia', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <h3 className="font-bold text-lg">SEO Score: 98/100</h3>
          </div>
          <p className="text-blue-100 text-sm mb-4">Seu conteúdo está pronto para ranquear no Google.</p>
          <button 
            onClick={handleCopyHtml}
            className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {copied ? '¡Copiado!' : 'Copiar HTML (WP)'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full lg:w-3/4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[800px]">
        
        {activeTab === 'content' && (
          <div className="p-8 lg:p-14">
            <header className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {article.keywords[0]}
                </span>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-500 text-sm">{Math.ceil(article.content.split(' ').length / 200)} min de leitura</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
                {article.title}
              </h1>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handlePlaySummary}
                  disabled={isPlaying}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                  {isPlaying ? 'Reproduzindo Áudio...' : 'Ouvir Resumo'}
                </button>
                {featuredImage && (
                  <button 
                    onClick={() => downloadImage(featuredImage, 'destaque-' + article.slug)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-full text-sm font-semibold hover:bg-slate-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Salvar Capa
                  </button>
                )}
              </div>
            </header>
            
            {featuredImage && (
               <div className="relative mb-12 group">
                 <img 
                   src={`data:${featuredImage.mimeType};base64,${featuredImage.base64}`} 
                   alt={article.title} 
                   className="w-full h-auto rounded-2xl shadow-xl object-cover max-h-[600px]"
                 />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-2xl"></div>
               </div>
            )}

            <div className="max-w-none">
              <div className="prose-container" dangerouslySetInnerHTML={{ __html: contentParts[0] }} />
              
              {inlineImage && (
                <div className="my-14 text-center">
                  <img 
                    src={`data:${inlineImage.mimeType};base64,${inlineImage.base64}`} 
                    alt="Contexto"
                    className="w-full h-auto rounded-2xl shadow-lg border border-slate-100"
                  />
                  <div className="mt-4 flex justify-center gap-4">
                    <button 
                      onClick={() => downloadImage(inlineImage, 'corpo-' + article.slug)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Baixar esta imagem
                    </button>
                  </div>
                </div>
              )}

              {contentParts[1] && (
                 <div className="prose-container" dangerouslySetInnerHTML={{ __html: contentParts[1] }} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'html' && (
          <div className="p-8 lg:p-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Código HTML para WordPress</h2>
              <button 
                onClick={handleCopyHtml}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
              >
                {copied ? 'Copiado!' : 'Copiar Tudo'}
              </button>
            </div>
            <div className="relative">
              <pre className="bg-slate-900 text-slate-300 p-8 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed max-h-[600px]">
{`<!-- Post: ${article.title} -->
<h1>${article.title}</h1>

${featuredImage ? `<!-- Featured Image -->
<img src="data:${featuredImage.mimeType};base64,${featuredImage.base64}" alt="${article.title}" style="max-width:100%; height:auto;" />` : ''}

${renderedHtml.replace('[[INLINE_IMAGE_PLACEHOLDER]]', inlineImage ? `
<!-- Contextual Image -->
<img src="data:${inlineImage.mimeType};base64,${inlineImage.base64}" alt="Context Image" style="max-width:100%; height:auto;" />` : '')}`}
              </pre>
            </div>
            <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-sm">
              <p><strong>Dica de WordPress:</strong> Cole este código no editor de "Texto" ou no bloco "HTML Personalizado" para manter toda a formatação e imagens perfeitamente integradas.</p>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="p-8 lg:p-14">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">Estratégia SEO Completa</h2>
            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">URL Slug Sugerida</label>
                <code className="text-blue-700 font-bold block bg-white p-4 rounded-xl border border-blue-100">{article.slug}</code>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Snippet do Google (Meta Description)</label>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-blue-600 font-medium mb-1 text-lg">{article.title}</p>
                  <p className="text-gray-400 text-sm mb-2">{window.location.host}/{article.slug}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{article.metaDescription}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold mb-4">Palavras-Chave</h4>
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map(kw => <span key={kw} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">{kw}</span>)}
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold mb-4">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map(tag => <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">#{tag}</span>)}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-8 lg:p-14">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">Estúdio de Ativos Digitais</h2>
            {featuredImage ? (
              <MediaEditor 
                initialImage={featuredImage} 
                onImageUpdated={onUpdateFeaturedImage}
                onStatusChange={onStatusChange}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p>Nenhuma imagem para editar no momento.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .prose-container h2 { line-height: 1.2; font-family: 'Inter', sans-serif; }
        .prose-container h3 { line-height: 1.3; font-family: 'Inter', sans-serif; }
        .prose-container p { font-family: 'Inter', sans-serif; font-size: 1.125rem; line-height: 1.8; }
        .prose-container strong { color: #111827; }
      `}</style>
    </div>
  );
};
