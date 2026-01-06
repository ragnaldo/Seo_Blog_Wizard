import React, { useState } from 'react';
import { ArticleForm } from './components/ArticleForm';
import { ArticleView } from './components/ArticleView';
import { generateSEOArticle, generateImage } from './services/geminiService';
import { BlogPost, GeneratedImage, GenerationStatus, GenerationOptions } from './types';

function App() {
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [featuredImage, setFeaturedImage] = useState<GeneratedImage | undefined>(undefined);
  const [inlineImage, setInlineImage] = useState<GeneratedImage | undefined>(undefined);
  
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);

  const handleGenerate = async (topic: string, url: string, options: GenerationOptions) => {
    try {
      setStatus(GenerationStatus.GENERATING_TEXT);
      setArticle(null);
      setFeaturedImage(undefined);
      setInlineImage(undefined);

      // 1. Generate Text (Article + Metadata) with options
      const generatedArticle = await generateSEOArticle(topic, options, url);
      setArticle(generatedArticle);
      
      // 2. Generate Images
      setStatus(GenerationStatus.GENERATING_IMAGES);
      
      const imagePromises: Promise<void>[] = [];

      if (generatedArticle.imagePrompts.featured) {
        imagePromises.push(
          generateImage(generatedArticle.imagePrompts.featured)
            .then(img => setFeaturedImage(img))
            .catch(e => console.error("Failed to generate featured image", e))
        );
      }

      if (generatedArticle.imagePrompts.inline) {
        imagePromises.push(
          generateImage(generatedArticle.imagePrompts.inline)
            .then(img => setInlineImage(img))
            .catch(e => console.error("Failed to generate inline image", e))
        );
      }

      await Promise.all(imagePromises);
      setStatus(GenerationStatus.COMPLETE);

    } catch (error) {
      console.error("Workflow failed", error);
      alert("Ocorreu um erro durante a geração. Verifique sua chave de API ou tente novamente.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const getStatusMessage = () => {
    switch(status) {
      case GenerationStatus.GENERATING_TEXT: return "A IA está pesquisando fatos e escrevendo seu artigo...";
      case GenerationStatus.GENERATING_IMAGES: return "Criando arte original e otimizada para web...";
      case GenerationStatus.GENERATING_VIDEO: return "Animando seu conteúdo com Veo (IA de Vídeo)...";
      case GenerationStatus.GENERATING_AUDIO: return "Sintetizando narração em alta qualidade...";
      case GenerationStatus.EDITING_IMAGE: return "Aplicando alterações mágicas na imagem...";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2v4a2 2 0 002 2h4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h3m-3 4h10m-10 4h10" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">SEO Blog Wizard</h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">IA Copywriting Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex text-[11px] font-bold text-slate-400 gap-4 uppercase tracking-widest">
              <span>Text</span>
              <span>•</span>
              <span>Image</span>
              <span>•</span>
              <span>Video</span>
              <span>•</span>
              <span>TTS</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
              v2.5 Flash
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Loading Overlay */}
        {status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETE && status !== GenerationStatus.ERROR && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">A Mágica está acontecendo...</h2>
            <p className="text-lg font-medium text-slate-500 max-w-md">{getStatusMessage()}</p>
          </div>
        )}

        {!article ? (
          <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
            <ArticleForm 
              onSubmit={handleGenerate} 
              isLoading={status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETE && status !== GenerationStatus.ERROR} 
            />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
                <button 
                  onClick={() => { setArticle(null); setStatus(GenerationStatus.IDLE); }}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Criar Outro Artigo
                </button>
             </div>
             
             <ArticleView 
               article={article}
               featuredImage={featuredImage}
               inlineImage={inlineImage}
               onUpdateFeaturedImage={setFeaturedImage}
               onStatusChange={setStatus}
             />
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Otimizado para Performance e Conversão</p>
        </div>
      </footer>

    </div>
  );
}

export default App;
