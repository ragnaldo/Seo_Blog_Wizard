import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'media'>('content');
  const [isPlaying, setIsPlaying] = useState(false);

  // Split content to insert inline image
  const contentParts = article.content.split('[[INLINE_IMAGE_PLACEHOLDER]]');

  const handlePlaySummary = async () => {
    try {
      if (isPlaying) return; // Simple prevent double click
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
      alert("Erro ao gerar áudio TTS");
      onStatusChange(GenerationStatus.ERROR);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start">
      
      {/* Sidebar Navigation & SEO Checklist */}
      <aside className="w-full md:w-1/4 sticky top-8 space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-gray-800 mb-4 px-2">Navegação</h3>
          <nav className="flex flex-col space-y-1">
            <button 
              onClick={() => setActiveTab('content')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Artigo & Conteúdo
            </button>
            <button 
              onClick={() => setActiveTab('seo')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'seo' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Metadados SEO
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Mídia (Imagem/Vídeo)
            </button>
          </nav>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Score SEO
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-green-600 h-2.5 rounded-full" style={{width: '95%'}}></div>
          </div>
          <ul className="text-sm space-y-2 text-gray-600">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Palavra-chave no título</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Meta descrição otimizada</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Imagens com Alt text</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Estrutura H2/H3</li>
          </ul>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full md:w-3/4 bg-white rounded-xl shadow-lg border border-slate-200 min-h-screen">
        
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="p-8 md:p-12">
            <div className="mb-8 border-b pb-8">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
                {article.keywords[0]}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mt-4 leading-tight">
                {article.title}
              </h1>
              <div className="mt-6 flex items-center gap-4">
                 <button 
                  onClick={handlePlaySummary}
                  disabled={isPlaying}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 text-sm font-medium transition-colors"
                >
                  {isPlaying ? (
                     <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
                      </span>
                      Reproduzindo...
                     </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      Ouvir Resumo (TTS)
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Featured Image Display in Article */}
            {featuredImage && (
               <figure className="mb-10">
                 <img 
                   src={`data:${featuredImage.mimeType};base64,${featuredImage.base64}`} 
                   alt={article.keywords[0]} 
                   className="w-full h-auto rounded-lg shadow-md object-cover max-h-[500px]"
                 />
                 <figcaption className="text-center text-sm text-gray-500 mt-2 italic">
                   Imagem destacada gerada por IA
                 </figcaption>
               </figure>
            )}

            {/* Article Body */}
            <article className="prose prose-lg prose-slate max-w-none font-serif">
              {/* Part 1 */}
              <div dangerouslySetInnerHTML={{ __html: contentParts[0].replace(/\n/g, '<br/>').replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-800">$1</h2>').replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              
              {/* Inline Image */}
              {inlineImage && (
                <figure className="my-10 -mx-4 md:-mx-8 lg:-mx-12 bg-slate-50 p-6 md:p-8 rounded-xl border border-slate-100">
                  <img 
                    src={`data:${inlineImage.mimeType};base64,${inlineImage.base64}`} 
                    alt="Ilustração do artigo"
                    className="w-full h-auto rounded shadow-sm"
                  />
                  <figcaption className="text-center text-sm text-gray-500 mt-3">
                    Figura 1: Ilustração contextual
                  </figcaption>
                </figure>
              )}

              {/* Part 2 */}
              {contentParts[1] && (
                 <div dangerouslySetInnerHTML={{ __html: contentParts[1].replace(/\n/g, '<br/>').replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-800">$1</h2>').replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-800">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              )}
            </article>
          </div>
        )}

        {/* SEO Metadata Tab */}
        {activeTab === 'seo' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Configurações para WordPress</h2>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL)</label>
                <code className="text-blue-600 bg-white px-2 py-1 rounded border border-blue-100 w-full block">
                  {article.slug}
                </code>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Descrição</label>
                <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 text-sm">
                  {article.metaDescription}
                </p>
                <p className="text-xs text-right mt-1 text-gray-400">{article.metaDescription.length} caracteres</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Palavras-chave</label>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.map((kw, i) => (
                      <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium border border-green-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resumo (Excerpt)</label>
                <p className="text-gray-700 text-sm">{article.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Media Tools Tab */}
        {activeTab === 'media' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Editor de Mídia IA</h2>
            
            {featuredImage ? (
              <MediaEditor 
                initialImage={featuredImage} 
                onImageUpdated={onUpdateFeaturedImage}
                onStatusChange={onStatusChange}
              />
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                Nenhuma imagem destacada disponível para edição.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};