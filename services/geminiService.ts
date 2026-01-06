import { GoogleGenAI, Modality } from "@google/genai";
import { BlogPost, GeneratedImage, GenerationOptions } from "../types";

// Helper to get fresh client (important for Veo key switching)
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSEOArticle = async (topic: string, options: GenerationOptions, referenceUrl?: string): Promise<BlogPost> => {
  const ai = getAiClient();
  
  const prompt = `
    Você é um especialista em SEO e Copywriting de classe mundial.
    Sua tarefa é escrever um artigo de blog altamente otimizado para WordPress.
    
    Tópico Principal: "${topic}"
    ${referenceUrl ? `URL de Referência para inspiração: ${referenceUrl}` : ''}
    
    Configurações de Escrita:
    - Tom de Voz: ${options.tone}
    - Tamanho do Texto: ${options.length}
    - Público-Alvo: ${options.targetAudience}

    Requisitos de Formatação:
    1. O conteúdo deve ser rico e informativo.
    2. Use tags H2 e H3 para estruturar.
    3. Idioma: Português do Brasil (pt-BR).
    4. **IMPORTANTE**: Use negrito (**texto**) APENAS para termos extremamente importantes ou palavras-chave. Não abuse do negrito.
    5. No meio do texto, onde fizer sentido ter uma imagem ilustrativa, insira exatamente a string: "[[INLINE_IMAGE_PLACEHOLDER]]".
    6. O texto deve ser fluido e natural, focando em legibilidade.

    Retorne APENAS um JSON válido seguindo estritamente esta estrutura:
    {
      "title": "Título chamativo (H1)",
      "slug": "url-amigavel-do-post",
      "metaDescription": "Descrição para o Google (max 160 chars)",
      "keywords": ["palavra1", "palavra2"],
      "tags": ["tag1", "tag2"],
      "summary": "Um resumo curto para o excerpt do WordPress",
      "content": "O corpo do artigo em Markdown",
      "imagePrompts": {
        "featured": "A detailed descriptive prompt in English for a high-quality featured image about the theme",
        "inline": "A detailed descriptive prompt in English for a high-quality contextual image for the post body"
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
    }
  });

  if (!response.text) throw new Error("Falha ao gerar o artigo.");
  
  let jsonString = response.text.trim();
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(jsonString) as BlogPost;
  } catch (e) {
    console.error("JSON Parse Error", e, jsonString);
    throw new Error("Falha ao processar a resposta da IA. Tente novamente.");
  }
};

export const generateImage = async (prompt: string): Promise<GeneratedImage> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    }
  }
  throw new Error("Imagem não gerada.");
};

export const editImage = async (base64Image: string, prompt: string): Promise<GeneratedImage> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/png',
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    }
  }
  throw new Error("Falha na edição da imagem.");
};

export const generateVideo = async (base64Image: string): Promise<string> => {
  const ai = getAiClient();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    image: {
      imageBytes: base64Image,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }
  
  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("URI do vídeo não encontrada.");

  const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Áudio não gerado.");

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await audioContext.decodeAudioData(bytes.buffer);
};
