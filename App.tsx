
import React, { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google'; // Real Google Hook
import { Step, ProductData, GeneratedModel, GeneratedVideo, Language, SavedProject, GeneratedScript, AppRoute, LabCategory, Tool, GalleryItem } from './types';
import { StepWizard } from './components/StepWizard';
import { Button } from './components/Button';
import { AudioPlayer } from './components/AudioPlayer';
import { 
  analyzeProductUrl, 
  generateModelImage, 
  generateScript, 
  modifyScript,
  generateAudio, 
  generateVeoVideo,
  getAudioDuration,
  generatePixelBatch
} from './services/geminiService';
import { backendApi } from './services/apiClient'; // Import backend API

// Translations
const TRANSLATIONS = {
  id: {
    title: "ContentLabs",
    subtitle: "by AvataraLabs",
    welcome: "Project",
    new_project: "Project Baru",
    past_projects: "Riwayat",
    input_title: "Product Link",
    input_placeholder: "https://toko.com/produk/xyz",
    analyze_btn: "Analisa",
    analyzing_note: "AI akan menganalisis konten halaman produk.",
    kb_title: "Product Knowledge",
    visual_analysis: "Visual Analysis",
    select_model: "Pilih Model",
    male: "Pria",
    female: "Wanita",
    confirm_generate: "Generate Assets",
    gen_model_title: "Generated Model",
    script_title: "Commercial Script",
    regenerate_image: "Regenerate Image",
    regenerate_script: "Regenerate Script",
    shorten: "Shorten",
    expand: "Expand",
    voice_male: "Pria",
    voice_female: "Wanita",
    gen_voice: "Generate Voice",
    create_video_vars: "Buat Variasi Video",
    video_vars_title: "Video Variations",
    video_vars_subtitle: "Pilih video untuk final render.",
    start_new: "Baru",
    gen_failed: "Gagal",
    regen_video: "Ulang",
    waiting: "Antrian",
    gen_veo: "Membuat...",
    download: "Unduh",
    add_var: "Tambah",
    next_editor: "Editor",
    editor_title: "Final Compose",
    bgm_upload: "Background Music",
    bgm_select: "Pilih Musik",
    bgm_vol: "Volume",
    bgm_start: "Mulai (detik)",
    render_preview: "Render Video",
    rendering: "Rendering...",
    hyper_mode: "HyperAutomated Mode",
    hyper_desc: "Otomatisasi penuh dari link hingga video final.",
    hyper_status: "Sedang memproses HyperAutomated...",
    save_changes: "Simpan Perubahan",
    today: "Hari Ini",
    last_week: "Minggu Ini",
    older: "Lebih Lama",
    preview_audio: "Preview Audio",
    stop_preview: "Stop Preview",
    back_dashboard: "Kembali ke Dashboard",
    or_upload: "atau Upload File Sendiri"
  },
  en: {
    title: "ContentLabs",
    subtitle: "by AvataraLabs",
    welcome: "Projects",
    new_project: "New Project",
    past_projects: "History",
    input_title: "Product Link",
    input_placeholder: "https://store.com/product/xyz",
    analyze_btn: "Analyze",
    analyzing_note: "AI will analyze page content.",
    kb_title: "Product Knowledge",
    visual_analysis: "Visual Analysis",
    select_model: "Select Model",
    male: "Male",
    female: "Female",
    confirm_generate: "Generate Assets",
    gen_model_title: "Generated Model",
    script_title: "Commercial Script",
    regenerate_image: "Regenerate Image",
    regenerate_script: "Regenerate Script",
    shorten: "Shorten",
    expand: "Expand",
    voice_male: "Male",
    voice_female: "Female",
    gen_voice: "Generate Voice",
    create_video_vars: "Create Variations",
    video_vars_title: "Video Variations",
    video_vars_subtitle: "Select videos for final render.",
    start_new: "New",
    gen_failed: "Failed",
    regen_video: "Retry",
    waiting: "Queued",
    gen_veo: "Generating...",
    download: "Download",
    add_var: "Add",
    next_editor: "Editor",
    editor_title: "Final Compose",
    bgm_upload: "Background Music",
    bgm_select: "Select Music",
    bgm_vol: "Volume",
    bgm_start: "Start (sec)",
    render_preview: "Render Video",
    rendering: "Rendering...",
    hyper_mode: "HyperAutomated Mode",
    hyper_desc: "Full automation from link to final video.",
    hyper_status: "Processing HyperAutomated...",
    save_changes: "Save Changes",
    today: "Today",
    last_week: "This Week",
    older: "Older",
    preview_audio: "Preview Audio",
    stop_preview: "Stop Preview",
    back_dashboard: "Back to Dashboard",
    or_upload: "or Upload Your Own"
  }
};

// --- STOCK MUSIC DATA ---
const STOCK_MUSIC = [
  {
    id: 'stock1',
    title: 'Upbeat Corporate',
    genre: 'Business',
    duration: '2:15',
    url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    )
  },
  {
    id: 'stock2',
    title: 'Chill Lo-Fi',
    genre: 'Lifestyle',
    duration: '1:45',
    url: 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
    )
  },
  {
    id: 'stock3',
    title: 'Cinematic Ambient',
    genre: 'Luxury',
    duration: '3:00',
    url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
    )
  }
];

interface ProjectCardProps {
  p: SavedProject;
  onLoad: (p: SavedProject) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ p, onLoad }) => (
  <div 
    onClick={() => onLoad(p)}
    className="group flex items-center p-3 bg-[#1C1D1F]/60 backdrop-blur-md border border-[#2E3033] rounded-lg cursor-pointer hover:border-indigo-500/50 transition-all hover:bg-[#252628]"
  >
    <div className="w-10 h-10 rounded bg-[#3E4044] flex items-center justify-center mr-3 flex-shrink-0 relative overflow-hidden">
      {p.generatedModel?.imageUrl ? (
          <img src={p.generatedModel.imageUrl} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-[#E8E8E8] truncate group-hover:text-indigo-300 transition-colors">{p.productData.name || 'Untitled Project'}</h4>
      <p className="text-xs text-gray-500 truncate">{new Date(p.lastModified).toLocaleString()}</p>
    </div>
  </div>
);

// Toast Component
const Toast: React.FC<{ message: string, type: 'error' | 'success', onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md flex items-center gap-3 animate-slide-up ${
      type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' : 'bg-green-900/80 border-green-500/50 text-green-100'
    }`}>
      {type === 'error' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
    </div>
  );
};

// --- DATA: LABS & TOOLS ---
const LABS_DATA: LabCategory[] = [
  {
    id: 'av_labs',
    title: 'AV Labs',
    description: 'Generative Audio & Video for high-impact visual storytelling.',
    color: 'from-indigo-500 to-violet-500',
    tools: [
      {
        id: 'link_to_video',
        title: 'Link to Video',
        description: 'Transform a product URL into a commercial video. Best for Reels, TikTok, Shorts.',
        tags: ['Nano Banana', 'Veo', 'Flash'],
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>,
        route: 'tool:link-to-video'
      },
      {
        id: 'script_to_video',
        title: 'Script to Video',
        description: 'Generate cinematic scenes from your text screenplay.',
        tags: ['Coming Soon'],
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>,
        disabled: true
      }
    ]
  },
  {
    id: 'pixel_labs',
    title: 'Pixel Labs',
    description: 'Advanced image generation and editing.',
    color: 'from-pink-500 to-rose-500',
    tools: [
      {
        id: 'product_image',
        title: 'Link to Product Image',
        description: 'Generate 4 stunning professional product photography shots from a URL.',
        tags: ['New'],
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>,
        route: 'tool:pixel-product-image'
      },
      {
        id: 'product_model',
        title: 'Link to Product Model',
        description: 'Visualize your product on AI models. 4 variations based on product knowledge.',
        tags: ['New'],
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
        route: 'tool:pixel-product-model'
      }
    ]
  },
  {
    id: 'script_labs',
    title: 'Script Labs',
    description: 'AI-powered copywriting and screenwriting.',
    color: 'from-emerald-500 to-teal-500',
    tools: [
      {
        id: 'copywriter',
        title: 'Ad Copy Pro',
        description: 'Generate high-conversion ad copy for FB, IG, and Google.',
        tags: ['Coming Soon'],
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>,
        disabled: true
      }
    ]
  },
  {
    id: 'sonic_labs',
    title: 'Sonic Labs',
    description: 'Next-gen voice synthesis and audio engineering.',
    color: 'from-amber-500 to-orange-500',
    tools: [
      {
        id: 'voice_clone',
        title: 'Voice Studio',
        description: 'Clone voices or generate expressive speech.',
        tags: ['Coming Soon'],
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>,
        disabled: true
      }
    ]
  }
];

// --- MOCK GALLERY DATA ---
const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Nike Air Zoom - Commercial',
    author: 'CreativeStudioX',
    labId: 'av_labs',
    type: 'Link to Video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    likes: 245,
    views: 1200,
    timestamp: '2 hours ago'
  },
  {
    id: 'g2',
    title: 'Organic Coffee Campaign',
    author: 'BaristaMarketing',
    labId: 'script_labs',
    type: 'Ad Copy Pro',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80',
    likes: 180,
    views: 850,
    timestamp: '5 hours ago'
  },
  {
    id: 'g3',
    title: 'Tech Gadget 3D Render',
    author: 'FutureVis',
    labId: 'pixel_labs',
    type: 'Link to Product Image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80',
    likes: 532,
    views: 4500,
    timestamp: '1 day ago'
  },
  {
    id: 'g4',
    title: 'Summer Fashion Lookbook',
    author: 'StyleIcon',
    labId: 'av_labs',
    type: 'Link to Video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
    likes: 310,
    views: 2100,
    timestamp: '2 days ago'
  },
  {
    id: 'g5',
    title: 'Luxury Watch Voiceover',
    author: 'GoldenVoice',
    labId: 'sonic_labs',
    type: 'Voice Studio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&q=80',
    likes: 89,
    views: 400,
    timestamp: '3 days ago'
  },
  {
    id: 'g6',
    title: 'Neon Energy Drink',
    author: 'CyberPunkAds',
    labId: 'pixel_labs',
    type: 'Link to Product Image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
    likes: 842,
    views: 10500,
    timestamp: '4 days ago'
  },
  {
    id: 'g7',
    title: 'Eco Friendly Tote',
    author: 'GreenLife',
    labId: 'av_labs',
    type: 'Link to Video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&q=80',
    likes: 150,
    views: 900,
    timestamp: '1 week ago'
  },
  {
    id: 'g8',
    title: 'Daily Tech News Brief',
    author: 'AI_Anchor',
    labId: 'sonic_labs',
    type: 'Voice Studio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?w=600&q=80',
    likes: 320,
    views: 5200,
    timestamp: '1 week ago'
  }
];

// --- COMPONENT: LinkToVideoTool ---
const LinkToVideoTool: React.FC<{ 
  onBack: () => void, 
  language: Language,
  setLanguage: (l: Language) => void
}> = ({ onBack, language, setLanguage }) => {
  const [step, setStep] = useState<Step>(Step.INPUT_URL);
  const [maxReachedStep, setMaxReachedStep] = useState<Step>(Step.INPUT_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [url, setUrl] = useState('');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [gender, setGender] = useState<'male'|'female'>('female');
  const [generatedModel, setGeneratedModel] = useState<GeneratedModel | null>(null);
  const [script, setScript] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Editor State
  const [bgmBlob, setBgmBlob] = useState<Blob | null>(null);
  const [bgmName, setBgmName] = useState<string | null>(null);
  const [bgmPreviewUrl, setBgmPreviewUrl] = useState<string | null>(null); // For playing selected stock/upload

  const t = TRANSLATIONS[language];

  const advanceStep = (nextStep: Step) => {
    if (nextStep > maxReachedStep) {
        setMaxReachedStep(nextStep);
    }
    setStep(nextStep);
  };

  const handleAnalyze = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
        const data = await analyzeProductUrl(url, language);
        setProductData(data);
        advanceStep(Step.REVIEW_PRODUCT);
    } catch (e: any) {
        setError(e.message || "Analysis failed");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateModel = async () => {
    if (!productData) return;
    setIsLoading(true);
    setError(null);
    try {
        const model = await generateModelImage(productData, gender);
        setGeneratedModel(model);
        advanceStep(Step.GENERATE_VIDEOS); 
    } catch (e: any) {
        setError(e.message || "Model generation failed");
    } finally {
        setIsLoading(false);
    }
  };
  
  // Initialize Script when entering Video step
  useEffect(() => {
    if (step === Step.GENERATE_VIDEOS && !script && productData && !isLoading) {
        const initScript = async () => {
             setIsLoading(true);
             try {
                const s = await generateScript(productData, gender, language, 'short');
                setScript(s);
             } catch(e) { console.error(e); }
             setIsLoading(false);
        };
        initScript();
    }
  }, [step, productData]);

  const handleGenVideo = async () => {
     if (!generatedModel) return;
     setIsLoading(true);
     setError(null);
     try {
        const details = `${productData?.name}, ${productData?.visualFeatures}`;
        const vUrl = await generateVeoVideo(generatedModel.rawBase64, generatedModel.mimeType, details);
        setVideoUrl(vUrl);
     } catch (e: any) {
        setError(e.message || "Video generation failed");
     } finally {
        setIsLoading(false);
     }
  };

  const handleTTS = async () => {
    if(!script) return;
    setIsLoading(true);
    try {
        const audio = await generateAudio(script);
        setAudioBase64(audio);
    } catch(e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  // Music Handling
  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setBgmBlob(file);
       setBgmName(file.name);
       // Create preview URL
       if (bgmPreviewUrl) URL.revokeObjectURL(bgmPreviewUrl);
       setBgmPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleStockBgmSelect = async (stock: typeof STOCK_MUSIC[0]) => {
    setIsLoading(true);
    try {
      // For playing in UI
      if (bgmPreviewUrl) URL.revokeObjectURL(bgmPreviewUrl);
      
      // For final mix, we need a Blob
      const response = await fetch(stock.url);
      const blob = await response.blob();
      
      setBgmBlob(blob);
      setBgmName(stock.title);
      setBgmPreviewUrl(stock.url);
      
    } catch (e) {
      console.error("Failed to load stock music", e);
      setError("Failed to load music. Please try another or upload your own.");
    } finally {
      setIsLoading(false);
    }
  };

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = () => {
      if(!audioRef.current || !bgmPreviewUrl) return;
      if(isPlayingPreview) {
          audioRef.current.pause();
          setIsPlayingPreview(false);
      } else {
          audioRef.current.play();
          setIsPlayingPreview(true);
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E8E8E8] flex flex-col">
       {/* Header */}
       <header className="border-b border-[#2E3033] bg-[#08090A] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-[#1C1D1F] rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
             </button>
             <h1 className="text-lg font-semibold text-white">Link to Video</h1>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setLanguage('id')} className={`px-2 py-1 text-xs rounded ${language === 'id' ? 'bg-[#3E4044] text-white' : 'text-gray-500'}`}>ID</button>
             <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs rounded ${language === 'en' ? 'bg-[#3E4044] text-white' : 'text-gray-500'}`}>EN</button>
          </div>
       </header>

       <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          <StepWizard currentStep={step} onStepClick={setStep} lang={language} maxReachedStep={maxReachedStep} />
          
          <div className="bg-[#1C1D1F] border border-[#2E3033] rounded-xl p-6 md:p-8 min-h-[400px]">
             
             {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {error}
                </div>
             )}

             {/* STEP 1: INPUT URL */}
             {step === Step.INPUT_URL && (
                 <div className="max-w-xl mx-auto py-10 text-center">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-[#252628] rounded-full flex items-center justify-center mx-auto mb-4">
                           <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t.input_title}</h2>
                        <p className="text-gray-400">{t.analyzing_note}</p>
                    </div>
                    
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={url}
                         onChange={(e) => setUrl(e.target.value)}
                         placeholder={t.input_placeholder}
                         className="flex-1 bg-[#08090A] border border-[#2E3033] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                       />
                       <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!url} className="px-6">
                          {t.analyze_btn}
                       </Button>
                    </div>
                    
                    <div className="mt-8 flex justify-center gap-4 text-xs text-gray-500">
                        <span>supported: Tokopedia, Shopee, Amazon, Shopify, etc.</span>
                    </div>
                 </div>
             )}
             
             {/* STEP 2: REVIEW PRODUCT */}
             {step === Step.REVIEW_PRODUCT && productData && (
                 <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-4">{productData.name}</h2>
                            <div className="bg-[#252628] rounded-lg p-4 mb-6 text-sm text-gray-300 leading-relaxed border border-[#3E4044]">
                                {productData.description}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Selling Points</h3>
                                    <ul className="space-y-2">
                                        {productData.sellingPoints.map((sp, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                {sp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Target Audience</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        {productData.targetAudience}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end pt-6 border-t border-[#2E3033]">
                       <Button onClick={() => advanceStep(Step.GENERATE_MODEL)}>
                          Next: Generate Model <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                       </Button>
                    </div>
                 </div>
             )}

             {/* STEP 3: GENERATE MODEL */}
             {step === Step.GENERATE_MODEL && (
                 <div className="max-w-2xl mx-auto text-center animate-fade-in">
                     <h2 className="text-2xl font-bold text-white mb-6">Create Virtual Model</h2>
                     <p className="text-gray-400 mb-8">Generate a hyper-realistic AI model presenting your product.</p>
                     
                     <div className="flex justify-center gap-6 mb-10">
                         <div 
                           onClick={() => setGender('female')}
                           className={`cursor-pointer w-40 h-48 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${gender === 'female' ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#3E4044] bg-[#252628] hover:border-gray-500'}`}
                         >
                            <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                            <span className="font-medium text-white">Female</span>
                         </div>
                         <div 
                           onClick={() => setGender('male')}
                           className={`cursor-pointer w-40 h-48 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${gender === 'male' ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#3E4044] bg-[#252628] hover:border-gray-500'}`}
                         >
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                            <span className="font-medium text-white">Male</span>
                         </div>
                     </div>

                     <Button onClick={handleGenerateModel} isLoading={isLoading} className="w-full max-w-sm mx-auto !py-3">
                        Generate Model
                     </Button>
                 </div>
             )}

             {/* STEP 4: GENERATE VIDEOS (and scripts) */}
             {(step === Step.GENERATE_VIDEOS || step === Step.FINAL_EDITOR) && generatedModel && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    {/* Left: Visual Asset */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Visual Asset</h3>
                        <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden border border-[#3E4044] shadow-2xl">
                             {videoUrl ? (
                                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                             ) : (
                                <img src={generatedModel.imageUrl} className="w-full h-full object-cover" />
                             )}
                             
                             {/* Overlay for generation status */}
                             {isLoading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <span className="text-white font-medium animate-pulse">Processing...</span>
                                </div>
                             )}
                        </div>
                        
                        {!videoUrl && (
                            <div className="mt-4">
                                <Button onClick={handleGenVideo} isLoading={isLoading} className="w-full">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    Generate Veo Video
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {/* Right: Script & Audio & Editor */}
                    <div className="flex flex-col h-full">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Commercial Script</h3>
                            <div className="bg-[#08090A] border border-[#2E3033] rounded-lg p-4 mb-3">
                                <textarea 
                                    value={script} 
                                    onChange={(e) => setScript(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full bg-transparent text-gray-200 text-sm leading-relaxed resize-none focus:outline-none min-h-[120px]"
                                    placeholder="Generating script..."
                                />
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#2E3033]/50">
                                    <span className="text-xs text-gray-500">{script.split(/\s+/).filter(w => w.length > 0).length} words</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setScript(s => s)} className="text-xs text-indigo-400 hover:text-indigo-300">Shorten</button>
                                        <button onClick={() => setScript(s => s)} className="text-xs text-indigo-400 hover:text-indigo-300">Regenerate</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between bg-[#252628] p-3 rounded-lg border border-[#3E4044]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">Voiceover</span>
                                        <span className="text-xs text-gray-500">Kore • Energetic</span>
                                    </div>
                                </div>
                                
                                {audioBase64 ? (
                                    <AudioPlayer base64Audio={audioBase64} />
                                ) : (
                                    <Button onClick={handleTTS} isLoading={isLoading} variant="secondary" className="text-xs">
                                        Generate Audio
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* --- FINAL EDITOR: BGM SELECTION --- */}
                        {step === Step.FINAL_EDITOR && (
                          <div className="mb-6 pt-6 border-t border-[#2E3033] animate-fade-in">
                             <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">{t.bgm_select}</h3>
                             
                             {/* Stock Music Grid */}
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                {STOCK_MUSIC.map((track) => {
                                  const isSelected = bgmName === track.title;
                                  const isPlaying = isPlayingPreview && bgmPreviewUrl === track.url;
                                  
                                  return (
                                    <div 
                                      key={track.id} 
                                      onClick={() => handleStockBgmSelect(track)}
                                      className={`
                                        relative p-3 rounded-lg border cursor-pointer transition-all
                                        ${isSelected 
                                          ? 'bg-indigo-500/10 border-indigo-500' 
                                          : 'bg-[#252628] border-[#3E4044] hover:border-gray-500'}
                                      `}
                                    >
                                       <div className="flex items-center justify-between mb-2">
                                          {track.icon}
                                          {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                       </div>
                                       <div className="text-xs font-medium text-white truncate">{track.title}</div>
                                       <div className="text-[10px] text-gray-500">{track.genre} • {track.duration}</div>
                                    </div>
                                  );
                                })}
                             </div>

                             {/* Upload or Preview */}
                             <div className="flex items-center gap-3 bg-[#1C1D1F] p-3 rounded-lg border border-[#2E3033]">
                                {bgmPreviewUrl ? (
                                    <div className="flex-1 flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                           <button 
                                              onClick={togglePreview}
                                              className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400"
                                           >
                                              {isPlayingPreview ? (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                              ) : (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                              )}
                                           </button>
                                           <div className="flex flex-col min-w-0">
                                              <span className="text-xs font-medium text-white truncate">{bgmName}</span>
                                              <span className="text-[10px] text-indigo-400">Selected</span>
                                           </div>
                                        </div>
                                        <audio ref={audioRef} src={bgmPreviewUrl || ''} onEnded={() => setIsPlayingPreview(false)} className="hidden" />
                                        
                                        <div className="relative">
                                            <input type="file" accept="audio/*" onChange={handleBgmUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                                            <button className="text-xs text-gray-400 hover:text-white underline">{t.or_upload}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full relative border-dashed border border-gray-600 rounded-lg p-3 text-center hover:bg-[#252628] transition-colors cursor-pointer">
                                        <input type="file" accept="audio/*" onChange={handleBgmUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                        <span className="text-xs text-gray-400 flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                            {t.bgm_upload}
                                        </span>
                                    </div>
                                )}
                             </div>
                          </div>
                        )}

                        {videoUrl && audioBase64 && (
                            <div className="mt-auto pt-6 border-t border-[#2E3033]">
                                {step !== Step.FINAL_EDITOR ? (
                                  <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg text-center">
                                      <h4 className="text-green-400 font-medium mb-1">Assets Ready!</h4>
                                      <p className="text-xs text-gray-400 mb-4">Video and Audio have been generated successfully.</p>
                                      <Button onClick={() => advanceStep(Step.FINAL_EDITOR)} className="w-full">
                                          Go to Final Editor
                                      </Button>
                                  </div>
                                ) : (
                                  <Button className="w-full" disabled={!bgmBlob && !bgmName} variant={bgmBlob ? 'primary' : 'secondary'}>
                                      {bgmBlob ? 'Render Final Video' : 'Select Music to Continue'}
                                  </Button>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
             )}
          </div>
       </main>
    </div>
  );
};


// --- COMPONENT: PixelLabsTool (New Feature) ---
const PixelLabsTool: React.FC<{ 
  mode: 'product' | 'model',
  onBack: () => void, 
  language: Language,
  setLanguage: (l: Language) => void
}> = ({ mode, onBack, language, setLanguage }) => {
    const [step, setStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [productData, setProductData] = useState<ProductData | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedModel[]>([]);

    const title = mode === 'product' ? 'Link to Product Image' : 'Link to Product Model';

    const handleAnalyze = async () => {
        if (!url) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await analyzeProductUrl(url, language);
            setProductData(data);
            
            // Auto proceed to generation
            setIsLoading(true); // Keep loading
            const images = await generatePixelBatch(data, mode);
            setGeneratedImages(images);
            setStep(2);
        } catch (e: any) {
            setError(e.message || "Operation failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (base64: string, filename: string) => {
        const link = document.createElement("a");
        // base64 already has mime type prefix from service
        link.href = base64; 
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#E8E8E8] flex flex-col">
            <header className="border-b border-[#2E3033] bg-[#08090A] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-[#1C1D1F] rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h1 className="text-lg font-semibold text-white">{title}</h1>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
                {step === 1 && (
                    <div className="max-w-xl mx-auto py-10 text-center animate-fade-in">
                         <div className="mb-8">
                            <div className="w-16 h-16 bg-[#252628] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3E4044]">
                               {mode === 'product' ? (
                                 <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                               ) : (
                                 <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                               )}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Generate {mode === 'product' ? 'Product Shots' : 'Model Shots'}</h2>
                            <p className="text-gray-400">Enter your product URL to automatically generate 4 professional variations.</p>
                        </div>
                        
                        <div className="flex gap-2 mb-6">
                           <input 
                             type="text" 
                             value={url}
                             onChange={(e) => setUrl(e.target.value)}
                             placeholder="https://store.com/product/xyz"
                             className="flex-1 bg-[#08090A] border border-[#2E3033] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                           />
                           <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!url} className="px-6">
                              Generate
                           </Button>
                        </div>
                        
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-400 animate-pulse">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p>Analyzing product content & generating images...</p>
                                <p className="text-xs mt-2">This may take up to 30 seconds.</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">{productData?.name}</h2>
                                <p className="text-sm text-gray-400">Generated 4 variations based on product analysis.</p>
                            </div>
                            <Button onClick={() => setStep(1)} variant="secondary" className="text-sm">
                                Start Over
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {generatedImages.map((img, idx) => (
                                <div key={idx} className="bg-[#1C1D1F] border border-[#2E3033] rounded-xl overflow-hidden group">
                                    <div className="aspect-[4/5] relative bg-black">
                                        <img src={img.imageUrl} alt={`Variation ${idx}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button onClick={() => handleDownload(img.imageUrl, `${mode}_shot_${idx+1}.png`)}>
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs text-gray-500 line-clamp-2" title={img.promptUsed}>
                                            {img.promptUsed.split('Style:')[1] || img.promptUsed}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};


// --- MAIN COMPONENTS ---

const NeuralBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number, y: number, vx: number, vy: number, size: number }> = [];
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            // Density based on screen size
            const count = Math.floor((canvas.width * canvas.height) / 15000);
            
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 0.5
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Mouse Influence Radius
            const connectionDistance = 150;
            const mouseDistance = 250;

            // Parallax factor (subtle movement of field opposite to mouse)
            const offsetX = (mouseRef.current.x - canvas.width / 2) * 0.02;
            const offsetY = (mouseRef.current.y - canvas.height / 2) * 0.02;

            particles.forEach((p, i) => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Bounce
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                const dx = p.x + offsetX;
                const dy = p.y + offsetY;

                // Draw Particle
                ctx.beginPath();
                ctx.arc(dx, dy, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(165, 180, 252, ${0.3 + (Math.abs(Math.sin(Date.now() * 0.001 + i))) * 0.2})`; // Indigo tint
                ctx.fill();

                // Connect to nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const p2x = p2.x + offsetX;
                    const p2y = p2.y + offsetY;
                    
                    const distX = dx - p2x;
                    const distY = dy - p2y;
                    const dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(165, 180, 252, ${0.15 * (1 - dist / connectionDistance)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(dx, dy);
                        ctx.lineTo(p2x, p2y);
                        ctx.stroke();
                    }
                }

                // Connect to Mouse
                const mDistX = dx - mouseRef.current.x;
                const mDistY = dy - mouseRef.current.y;
                const mDist = Math.sqrt(mDistX * mDistX + mDistY * mDistY);

                if (mDist < mouseDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.4 * (1 - mDist / mouseDistance)})`; // Stronger connection to mouse
                    ctx.lineWidth = 1;
                    ctx.moveTo(dx, dy);
                    ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};


// --- LANDING SHOWCASE ---
const LandingShowcase: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Made with ContentLabs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {MOCK_GALLERY.slice(0, 6).map((item, i) => (
                    <div key={i} className="group relative aspect-[9/16] md:aspect-video rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500">
                         <img src={item.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                         <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                             <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{item.type}</div>
                             <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                             <p className="text-sm text-gray-400">by {item.author}</p>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const showcaseRef = useRef<HTMLDivElement>(null);

  const scrollToShowcase = () => {
      showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans selection:bg-indigo-500/30">
      
      {/* --- COSMIC NEURAL BACKGROUND --- */}
      
      {/* Styles for custom animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
           background-size: 40px 40px;
           background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                             linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
      `}</style>

      {/* 1. Moving Gradient Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
          <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* 2. Interactive Canvas Layer */}
      <NeuralBackground />

      {/* 3. Noise Overlay for Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-[1] pointer-events-none mix-blend-overlay"></div>

      {/* 4. Perspective Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] z-[1] pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-[2] pointer-events-none"></div>

      {/* --- CONTENT --- */}

      <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">ContentLabs</span>
         </div>
         <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
            <a href="#" className="hover:text-white transition-all hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Solutions</a>
         </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto text-center pt-32 pb-20 px-6">
          
          {/* Version Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md text-xs font-medium text-indigo-200 mb-10 shadow-[0_0_20px_rgba(79,70,229,0.2)] animate-fade-in-up">
             <span className="relative flex h-2 w-2 mr-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
             </span>
             Powered by Veo 3.1 & Gemini 2.5
          </div>
          
          {/* Hero Title with Gradient & Glow */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-white leading-tight animate-fade-in-up delay-100 drop-shadow-2xl">
             The Future of <br/> 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 relative">
               Generative Media
             </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200">
             Transform simple product links into professional-grade commercial assets. 
             Scripts, Voiceovers, and Video Generation—all in one studio.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
             <button 
                onClick={onStart}
                className="group relative flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] overflow-hidden"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                Get Started
             </button>
          </div>
      </div>
      
      {/* Showcase Section */}
      <div ref={showcaseRef} className="relative z-10 bg-black/40 backdrop-blur-sm border-t border-white/5 mt-20">
          <LandingShowcase />
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-indigo-900/20 to-transparent z-[5] pointer-events-none"></div>
    </div>
  );
};

// --- NEW COMPONENT: Community Gallery ---
const CommunityGallery: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');

  const filteredItems = filter === 'all' 
    ? MOCK_GALLERY 
    : MOCK_GALLERY.filter(item => item.labId === filter);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Community Gallery</h2>
          <p className="text-gray-400">Discover what others are creating with ContentLabs.</p>
        </div>
        <div className="flex gap-2 p-1 bg-[#1C1D1F] rounded-lg border border-[#2E3033]">
          <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-[#3E4044] text-white' : 'text-gray-400 hover:text-white'}`}>All</button>
          <button onClick={() => setFilter('av_labs')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'av_labs' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white'}`}>AV Labs</button>
          <button onClick={() => setFilter('script_labs')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'script_labs' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:text-white'}`}>Script</button>
          <button onClick={() => setFilter('pixel_labs')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'pixel_labs' ? 'bg-pink-500/20 text-pink-300' : 'text-gray-400 hover:text-white'}`}>Pixel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="group bg-[#1C1D1F]/40 border border-[#2E3033] rounded-xl overflow-hidden hover:border-gray-500/50 transition-all hover:-translate-y-1 hover:shadow-xl">
             <div className="aspect-video relative overflow-hidden bg-gray-800">
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2">
                   <span className="px-2 py-1 bg-black/60 backdrop-blur text-[10px] font-bold text-white rounded uppercase tracking-wider">{item.type}</span>
                </div>
             </div>
             <div className="p-4">
                <h3 className="text-white font-medium truncate mb-1">{item.title}</h3>
                <div className="flex justify-between items-center text-xs text-gray-500">
                   <span>by <span className="text-gray-300">{item.author}</span></span>
                   <span>{item.timestamp}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2E3033] flex justify-between items-center">
                   <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg> {item.likes}</span>
                      <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> {item.views}</span>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- NEW COMPONENT: User Profile ---
const UserProfile: React.FC<{ onLogout: () => void, user: any }> = ({ onLogout, user }) => {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
       <div className="flex items-center gap-6 mb-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-blue-500 p-[2px]">
              {user.picture ? (
                   <img src={user.picture} className="w-full h-full rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl font-bold text-white">
                    {user.name?.charAt(0) || 'U'}
                </div>
              )}
          </div>
          <div>
             <h1 className="text-3xl font-bold text-white">{user.name || 'User Demo'}</h1>
             <p className="text-gray-400">{user.email}</p>
             <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-medium">{user.plan || 'Free Plan'}</span>
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded text-xs">Member since 2024</span>
             </div>
          </div>
       </div>

       <div className="bg-[#1C1D1F]/50 border border-[#2E3033] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Credit Usage</h3>
          <div className="space-y-4">
             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-400">Monthly Credits</span>
                   <span className="text-white">450 / 1000</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[45%]"></div>
                </div>
             </div>
             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-400">Storage (GB)</span>
                   <span className="text-white">12.5 / 50</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[25%]"></div>
                </div>
             </div>
          </div>
       </div>

       <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-[#1C1D1F]/30 hover:bg-[#1C1D1F] border border-[#2E3033] rounded-lg transition-colors group">
             <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="text-gray-300 group-hover:text-white">Account Settings</span>
             </div>
             <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-[#1C1D1F]/30 hover:bg-[#1C1D1F] border border-[#2E3033] rounded-lg transition-colors group">
             <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                <span className="text-gray-300 group-hover:text-white">Billing & Subscription</span>
             </div>
             <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
          
          <div className="pt-6">
              <Button onClick={onLogout} variant="danger" className="w-full !justify-center !py-3">
                  Log Out
              </Button>
          </div>
       </div>
    </div>
  );
};


// --- WRAPPER COMPONENT: Dashboard (Updated Navigation) ---
const Dashboard: React.FC<{ 
  currentRoute: AppRoute,
  onNavigate: (route: AppRoute) => void, 
  onLogout: () => void,
  user: any
}> = ({ currentRoute, onNavigate, onLogout, user }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#E8E8E8] font-sans bg-gradient-to-b from-[#050505] to-[#0f1012]">
       <nav className="border-b border-[#2E3033] bg-[#08090A]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                 <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                 </div>
                 <span className="font-bold text-lg">ContentLabs</span>
             </div>
             
             <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <button onClick={() => onNavigate('dashboard')} className={`${currentRoute === 'dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'} transition-colors`}>Labs</button>
                <button onClick={() => onNavigate('gallery')} className={`${currentRoute === 'gallery' ? 'text-white' : 'text-gray-400 hover:text-white'} transition-colors`}>Gallery</button>
                <button className="text-gray-400 hover:text-white transition-colors cursor-not-allowed opacity-50">Community</button>
             </div>

             <div className="flex items-center gap-4">
                 <button onClick={() => onNavigate('profile')} className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 p-[1px] hover:scale-105 transition-transform">
                     {user?.picture ? (
                        <img src={user.picture} className="w-full h-full rounded-full" />
                     ) : (
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                     )}
                 </button>
             </div>
          </div>
       </nav>

       <main className="max-w-7xl mx-auto px-6 py-12">
          {currentRoute === 'dashboard' && (
             <div className="animate-fade-in">
                <div className="mb-12">
                   <h1 className="text-3xl font-bold text-white mb-2">Welcome back.</h1>
                   <p className="text-gray-400">Select a lab to begin creating.</p>
                </div>

                <div className="space-y-12">
                   {LABS_DATA.map(lab => (
                      <div key={lab.id}>
                         <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-semibold text-white">{lab.title}</h2>
                            <span className="h-px flex-1 bg-gradient-to-r from-[#2E3033] to-transparent"></span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lab.tools.map(tool => (
                               <div 
                                 key={tool.id}
                                 onClick={() => !tool.disabled && tool.route && onNavigate(tool.route)}
                                 className={`group relative p-6 bg-[#1C1D1F]/40 border border-[#2E3033] rounded-xl hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 overflow-hidden ${tool.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                               >
                                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${lab.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                  
                                  <div className="flex justify-between items-start mb-4">
                                     <div className={`p-3 rounded-lg bg-[#252628] text-gray-300 group-hover:text-white group-hover:bg-[#3E4044] transition-colors`}>
                                        {tool.icon}
                                     </div>
                                     {tool.tags.includes('Coming Soon') && (
                                         <span className="px-2 py-0.5 text-[10px] font-medium bg-[#252628] text-gray-400 rounded-full border border-[#3E4044]">Soon</span>
                                     )}
                                     {tool.tags.includes('New') && (
                                         <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">New</span>
                                     )}
                                  </div>
                                  
                                  <h3 className="text-lg font-medium text-white mb-2 group-hover:text-indigo-300 transition-colors">{tool.title}</h3>
                                  <p className="text-sm text-gray-400 leading-relaxed">{tool.description}</p>
                                  
                                  {!tool.disabled && (
                                     <div className="mt-4 flex items-center text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        Launch Tool <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                     </div>
                                  )}
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {currentRoute === 'gallery' && <CommunityGallery />}
          
          {currentRoute === 'profile' && <UserProfile onLogout={onLogout} user={user} />}

       </main>
    </div>
  );
};


// --- MAIN APP ROUTER ---

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');
  const [language, setLanguage] = useState<Language>('id');
  const [toasts, setToasts] = useState<Array<{ id: number, message: string, type: 'error' | 'success' }>>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // Store authenticated user

  const addToast = (message: string, type: 'error' | 'success' = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Direct Access (Bypass Login)
  const handleDirectStart = () => {
    // Mock user for direct access
    const mockUser = {
      name: 'Guest User',
      email: 'guest@contentlabs.ai',
      plan: 'Trial',
      picture: ''
    };
    
    // Set a dummy token so backend api calls pass the auth check (if they check for presence of header)
    localStorage.setItem('auth_token', 'guest-token-123');
    
    setUser(mockUser);
    setCurrentRoute('dashboard');
    addToast('Welcome to ContentLabs!', 'success');
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentRoute('dashboard');
    setIsLoginModalOpen(false);
    addToast(`Welcome back, ${userData.name || 'User'}`, 'success');
  };

  const handleLogout = () => {
     setUser(null);
     localStorage.removeItem('auth_token');
     setCurrentRoute('landing');
  };

  return (
    <>
      {/* Login Modal disabled for now based on request */}
      {/* 
      <LoginModal 
         isOpen={isLoginModalOpen} 
         onClose={() => setIsLoginModalOpen(false)} 
         onLogin={handleLogin} 
      /> 
      */}

      {currentRoute === 'landing' && (
         <LandingPage onStart={handleDirectStart} />
      )}
      
      {(currentRoute === 'dashboard' || currentRoute === 'gallery' || currentRoute === 'profile') && (
        <Dashboard 
          currentRoute={currentRoute} 
          onNavigate={setCurrentRoute} 
          onLogout={handleLogout}
          user={user}
        />
      )}
      
      {currentRoute === 'tool:link-to-video' && (
        <LinkToVideoTool 
           onBack={() => setCurrentRoute('dashboard')} 
           language={language}
           setLanguage={setLanguage}
        />
      )}

      {currentRoute === 'tool:pixel-product-image' && (
        <PixelLabsTool 
           mode="product"
           onBack={() => setCurrentRoute('dashboard')} 
           language={language}
           setLanguage={setLanguage}
        />
      )}

      {currentRoute === 'tool:pixel-product-model' && (
        <PixelLabsTool 
           mode="model"
           onBack={() => setCurrentRoute('dashboard')} 
           language={language}
           setLanguage={setLanguage}
        />
      )}
      
      {/* Global Toasts */}
      <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col gap-2">
           {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />)}
      </div>
    </>
  );
};

export default App;
