import React, { useState } from 'react';
import { ArticleForm } from './components/ArticleForm';
import { ArticleView } from './components/ArticleView';
import { generateSEOArticle, generateImage } from './services/geminiService';
import { BlogPost, GeneratedImage, GenerationStatus } from './types';

function App() {
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [featuredImage, setFeaturedImage] = useState<GeneratedImage | undefined>(undefined);
  const [inlineImage, setInlineImage] = useState<GeneratedImage | undefined>(undefined);
  
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);

  const handleGenerate = async (topic: string, url: string) => {
    try {
      setStatus(GenerationStatus.GENERATING_TEXT);
      setArticle(null);
      setFeaturedImage(undefined);
      setInlineImage(undefined);

      // 1. Generate Text (Article + Metadata)
      const generatedArticle = await generateSEOArticle(topic, url);
      setArticle(generatedArticle);
      
      // 2. Generate Images
      setStatus(GenerationStatus.GENERATING_IMAGES);
      
      // Parallel image generation
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
      alert("Ocorreu um erro durante a geração. Verifique o console ou tente novamente.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const getStatusMessage = () => {
    switch(status) {
      case GenerationStatus.GENERATING_TEXT: return "Escrevendo artigo otimizado e pesquisando dados...";
      case GenerationStatus.GENERATING_IMAGES: return "Criando imagens exclusivas com IA...";
      case GenerationStatus.GENERATING_VIDEO: return "Renderizando vídeo com Veo (isso pode levar um minuto)...";
      case GenerationStatus.GENERATING_AUDIO: return "Sintetizando áudio natural...";
      case GenerationStatus.EDITING_IMAGE: return "Aplicando edições na imagem...";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">SEO Blog Wizard</h1>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Powered by Gemini
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Loading Overlay */}
        {status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETE && status !== GenerationStatus.ERROR && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-lg font-medium text-slate-700 animate-pulse">{getStatusMessage()}</p>
          </div>
        )}

        {!article ? (
          <ArticleForm 
            onSubmit={handleGenerate} 
            isLoading={status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETE && status !== GenerationStatus.ERROR} 
          />
        ) : (
          <div className="space-y-6">
             <button 
                onClick={() => { setArticle(null); setStatus(GenerationStatus.IDLE); }}
                className="mx-auto block text-sm text-slate-500 hover:text-blue-600 mb-4 underline decoration-dotted"
             >
               &larr; Criar outro artigo
             </button>
             
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

    </div>
  );
}

export default App;