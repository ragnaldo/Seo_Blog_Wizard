import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BlogPost, GeneratedImage } from "../types";

// Helper to get fresh client (important for Veo key switching)
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSEOArticle = async (topic: string, referenceUrl?: string): Promise<BlogPost> => {
  const ai = getAiClient();
  
  const prompt = `
    Você é um especialista em SEO e Copywriting de classe mundial.
    Sua tarefa é escrever um artigo de blog altamente otimizado para WordPress.
    
    Tópico Principal: "${topic}"
    ${referenceUrl ? `URL de Referência para inspiração (use como base para fatos, mas não copie): ${referenceUrl}` : ''}

    Requisitos:
    1. O conteúdo deve ser rico, informativo e usar a técnica Skyscraper (melhor que o conteúdo existente).
    2. Use tags H2 e H3 para estruturar.
    3. O tom deve ser profissional mas acessível.
    4. O idioma deve ser Português do Brasil (pt-BR).
    5. No meio do texto, onde fizer sentido ter uma imagem ilustrativa, insira exatamente a string: "[[INLINE_IMAGE_PLACEHOLDER]]".

    Retorne APENAS um JSON com a seguinte estrutura:
    {
      "title": "Título chamativo (H1)",
      "slug": "url-amigavel-do-post",
      "metaDescription": "Descrição para o Google (max 160 chars)",
      "keywords": ["array", "de", "palavras-chave"],
      "tags": ["array", "de", "tags", "wordpress"],
      "summary": "Um resumo curto para o excerpt do WordPress",
      "content": "O corpo do artigo em Markdown",
      "imagePrompts": {
        "featured": "Um prompt detalhado em inglês para gerar uma imagem destacada realista sobre o tema",
        "inline": "Um prompt detalhado em inglês para gerar a imagem do meio do texto"
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Search Grounding for accuracy
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          slug: { type: Type.STRING },
          metaDescription: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          content: { type: Type.STRING },
          imagePrompts: {
            type: Type.OBJECT,
            properties: {
              featured: { type: Type.STRING },
              inline: { type: Type.STRING },
            }
          }
        }
      }
    }
  });

  if (!response.text) throw new Error("Falha ao gerar o artigo.");
  return JSON.parse(response.text) as BlogPost;
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
  // Using Gemini 2.5 Flash Image for editing ("Nano banana" request)
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
  // Ensure we have a fresh client with the potentially newly selected key
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

  // Fetch the actual bytes using the API Key
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
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Nice clear voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Áudio não gerado.");

  // Decode audio
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await audioContext.decodeAudioData(bytes.buffer);
};