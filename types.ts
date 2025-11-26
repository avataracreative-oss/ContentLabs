
import React from 'react';

export interface ProductData {
  url: string;
  name: string;
  description: string;
  visualFeatures: string;
  targetAudience: string;
  sellingPoints: string[];
  referenceImages: string[]; // URLs from search grounding
  timestamp?: number;
}

export interface SavedProject {
  id: string;
  lastModified: number;
  productData: ProductData;
  generatedModel: GeneratedModel | null;
  generatedScript: string;
  generatedVideos: GeneratedVideo[];
  audioBase64: string | null;
  audioDuration: number;
  step: Step;
}

export enum Step {
  API_CHECK = 0,
  INPUT_URL = 1,
  REVIEW_PRODUCT = 2,
  GENERATE_MODEL = 3,
  GENERATE_VIDEOS = 4,
  FINAL_EDITOR = 5
}

export interface GeneratedModel {
  imageUrl: string; // Base64 data URL
  rawBase64: string;
  mimeType: string;
  promptUsed: string;
}

export interface GeneratedScript {
  text: string;
  audioUrl?: string; // Blob URL for playback
}

export interface GeneratedVideo {
  id: string;
  url: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  isSelected?: boolean;
}

export type Language = 'id' | 'en';

// Dashboard & Navigation Types
export type AppRoute = 'landing' | 'dashboard' | 'gallery' | 'profile' | 'tool:link-to-video';

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  route?: AppRoute;
  disabled?: boolean;
}

export interface LabCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  tools: Tool[];
}

// Gallery Types
export interface GalleryItem {
  id: string;
  title: string;
  author: string;
  labId: string; // matches LabCategory.id
  type: string;
  thumbnailUrl: string;
  likes: number;
  views: number;
  timestamp: string;
}

// Backend Types
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        plan: string;
    }
}
