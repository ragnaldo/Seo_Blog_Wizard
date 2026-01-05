export interface BlogPost {
  title: string;
  slug: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  summary: string;
  content: string; // Markdown
  imagePrompts: {
    featured: string;
    inline: string;
  };
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export enum GenerationStatus {
  IDLE = 'idle',
  GENERATING_TEXT = 'generating_text',
  GENERATING_IMAGES = 'generating_images',
  GENERATING_VIDEO = 'generating_video',
  GENERATING_AUDIO = 'generating_audio',
  EDITING_IMAGE = 'editing_image',
  COMPLETE = 'complete',
  ERROR = 'error',
}

// Extend Window interface for Veo key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}