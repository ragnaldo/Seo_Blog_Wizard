import React, { useState } from 'react';
import { GeneratedImage, GenerationStatus } from '../types';
import { editImage, generateVideo } from '../services/geminiService';

interface MediaEditorProps {
  initialImage: GeneratedImage;
  onImageUpdated: (img: GeneratedImage) => void;
  onStatusChange: (status: GenerationStatus) => void;
}

export const MediaEditor: React.FC<MediaEditorProps> = ({ 
  initialImage, 
  onImageUpdated,
  onStatusChange 
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const handleEditImage = async () => {
    if (!editPrompt.trim()) return;
    
    try {
      onStatusChange(GenerationStatus.EDITING_IMAGE);
      const newImg = await editImage(initialImage.base64, editPrompt);
      onImageUpdated(newImg);
      setEditPrompt('');
      onStatusChange(GenerationStatus.IDLE);
    } catch (e) {
      console.error(e);
      alert("Falha ao editar a imagem.");
      onStatusChange(GenerationStatus.ERROR);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      // Check for API Key selection (Veo requirement)
      if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
         try {
           await window.aistudio.openSelectKey();
           // Important: proceed assuming success or let the user click again if they cancel
         } catch (e) {
            console.error("API Key selection failed or cancelled", e);
            return;
         }
      }

      onStatusChange(GenerationStatus.GENERATING_VIDEO);
      const videoUrl = await generateVideo(initialImage.base64);
      setGeneratedVideoUrl(videoUrl);
      onStatusChange(GenerationStatus.IDLE);
    } catch (e) {
      console.error(e);
      alert("Falha ao gerar vídeo com Veo. Verifique se selecionou uma chave de API paga.");
      onStatusChange(GenerationStatus.ERROR);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Current Image Preview */}
      <div className="flex flex-col items-center">
        <div className="relative group max-w-md w-full">
          <img 
            src={`data:${initialImage.mimeType};base64,${initialImage.base64}`} 
            alt="Current asset" 
            className="rounded-lg shadow-lg w-full h-auto"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            Gemini 2.5 Flash Image
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Editar Imagem (Prompt)
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Use linguagem natural para modificar a imagem. Ex: "Adicione um filtro vintage", "Remova o fundo", "Adicione um gato".
          </p>
          <div className="flex flex-col gap-2">
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Descreva a alteração desejada..."
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              rows={3}
            />
            <button
              onClick={handleEditImage}
              disabled={!editPrompt}
              className="self-end px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              Aplicar Edição
            </button>
          </div>
        </div>

        {/* Video Generator Section */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Animar com Veo
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Transforme a imagem estática em um vídeo curto de alta qualidade usando o modelo Veo.
            <br/><span className="text-xs text-orange-600 font-semibold">*Requer chave de API paga.</span>
          </p>
          
          {!generatedVideoUrl ? (
            <button
              onClick={handleGenerateVideo}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Gerar Vídeo
            </button>
          ) : (
            <div className="mt-4">
              <video 
                src={generatedVideoUrl} 
                controls 
                autoPlay 
                loop
                className="w-full rounded-lg shadow-md border border-gray-300"
              />
              <a 
                href={generatedVideoUrl} 
                download="veo-generated-video.mp4"
                className="block text-center mt-2 text-sm text-purple-600 hover:underline"
              >
                Baixar Vídeo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};