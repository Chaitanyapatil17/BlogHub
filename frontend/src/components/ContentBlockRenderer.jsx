import { useState } from 'react';
import { 
  Check, 
  Copy, 
  Quote, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  Maximize2,
  X,
  Play,
  ImageOff
} from 'lucide-react';
export { getBlogUrl, slugifyCategory } from '../utils/urlHelper';

// Extract YouTube ID
export function getYouTubeId(url = '') {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

// Extract Vimeo ID
export function getVimeoId(url = '') {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  return match ? match[1] : null;
}

// Helper to convert YouTube, Vimeo, or Direct Video URLs into embeddable URLs
export function getEmbedUrl(url = '') {
  if (!url) return null;
  const cleanUrl = url.trim();

  // YouTube
  const ytId = getYouTubeId(cleanUrl);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}`;
  }

  // Vimeo
  const vimeoId = getVimeoId(cleanUrl);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return cleanUrl;
}

// Check if URL is a direct video file
function isDirectVideoUrl(url = '') {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
}

// Smart Cover Extraction Helper
export function getBlogCover(blog) {
  if (!blog) return null;

  // 1. Explicit cover image (checks if it is a video URL or image)
  if (blog.cover_image && blog.cover_image.trim()) {
    const rawCover = blog.cover_image.trim();
    const ytId = getYouTubeId(rawCover);
    if (ytId) {
      return {
        type: 'video',
        url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        videoUrl: rawCover,
      };
    }
    const vimeoId = getVimeoId(rawCover);
    if (vimeoId) {
      return {
        type: 'video',
        url: null,
        videoUrl: rawCover,
      };
    }
    if (isDirectVideoUrl(rawCover)) {
      return {
        type: 'video',
        url: null,
        videoUrl: rawCover,
      };
    }
    return { type: 'image', url: rawCover };
  }

  // 2. Parse blocks if string
  let parsedBlocks = [];
  if (typeof blog.blocks === 'string') {
    try {
      parsedBlocks = JSON.parse(blog.blocks);
    } catch (e) {
      parsedBlocks = [];
    }
  } else if (Array.isArray(blog.blocks)) {
    parsedBlocks = blog.blocks;
  }

  // 3. Find image in blocks
  const imgBlock = parsedBlocks.find((b) => b.type === 'image' && b.url && b.url.trim());
  if (imgBlock) {
    return { type: 'image', url: imgBlock.url.trim() };
  }

  // 4. Find gallery in blocks
  const galleryBlock = parsedBlocks.find((b) => b.type === 'gallery' && Array.isArray(b.images) && b.images.length > 0 && b.images[0]);
  if (galleryBlock) {
    return { type: 'image', url: galleryBlock.images[0].trim() };
  }

  // 5. Find video in blocks
  const videoBlock = parsedBlocks.find((b) => b.type === 'video' && b.url && b.url.trim());
  if (videoBlock) {
    const ytId = getYouTubeId(videoBlock.url);
    if (ytId) {
      return {
        type: 'video',
        url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        videoUrl: videoBlock.url,
      };
    }
    return { type: 'video', url: null, videoUrl: videoBlock.url };
  }

  return null;
}

// Code Block with Copy Button
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg group">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono uppercase font-bold tracking-wider text-[11px] text-indigo-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Image Gallery Lightbox Modal
function GalleryLightbox({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-4xl w-full flex flex-col items-center">
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl"
        />
        <div className="flex items-center gap-2 mt-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                currentIndex === idx ? 'border-indigo-500 scale-105' : 'border-transparent opacity-60'
              }`}
            >
              <img src={img} alt="thumb" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper to strip all HTML tags, decode entities, and strip markdown symbols for clean excerpts
export function stripHtml(html = '') {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[#*`_\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to sanitize scraped or rich HTML to maintain editorial broadsheet typography
export function sanitizeRichHtml(html = '') {
  if (!html) return '';
  return html
    .replace(/\sstyle=(["']).*?\1/gi, '')
    .replace(/\sclass=(["']).*?\1/gi, '')
    .replace(/&quot;/g, '"');
}

export default function ContentBlockRenderer({ blocks, fallbackContent }) {
  const [lightbox, setLightbox] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  // Parse blocks safely if passed as string
  let parsedBlocks = blocks;
  if (typeof blocks === 'string') {
    try {
      parsedBlocks = JSON.parse(blocks);
    } catch (e) {
      parsedBlocks = [];
    }
  }

  // If no structured blocks provided, fallback to plain text/paragraphs
  if (!parsedBlocks || !Array.isArray(parsedBlocks) || parsedBlocks.length === 0) {
    if (!fallbackContent) return null;
    const hasHtml = /<[a-z][\s\S]*>/i.test(fallbackContent || '');
    if (hasHtml) {
      const cleanFallback = sanitizeRichHtml(fallbackContent);
      return (
        <div
          className="text-slate-800 leading-relaxed text-base sm:text-lg space-y-4 font-normal blog-rich-paragraph font-serif"
          dangerouslySetInnerHTML={{ __html: cleanFallback }}
        />
      );
    }
    return (
      <div className="text-slate-800 leading-relaxed text-base sm:text-lg space-y-4 whitespace-pre-wrap font-normal font-serif">
        {fallbackContent}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      {parsedBlocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 3) {
              return (
                <h3 key={block.id || idx} className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-8 mb-3">
                  {block.content}
                </h3>
              );
            }
            return (
              <h2 key={block.id || idx} className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-10 mb-4 pb-2 border-b border-slate-100">
                {block.content}
              </h2>
            );
          }

          case 'paragraph': {
            const hasHtml = /<[a-z][\s\S]*>/i.test(block.content || '');
            if (hasHtml) {
              const cleanHtml = sanitizeRichHtml(block.content);
              return (
                <div
                  key={block.id || idx}
                  className="text-base sm:text-lg text-slate-800 leading-relaxed font-normal blog-rich-paragraph my-4 space-y-4 font-serif"
                  dangerouslySetInnerHTML={{ __html: cleanHtml }}
                />
              );
            }
            return (
              <p key={block.id || idx} className="text-base sm:text-lg text-slate-800 leading-relaxed whitespace-pre-line font-normal my-4 font-serif">
                {block.content}
              </p>
            );
          }

          case 'image': {
            if (!block.url || !block.url.trim()) return null;
            const hasFailed = failedImages[block.id || idx];

            return (
              <figure key={block.id || idx} className="my-8">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  {hasFailed ? (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                      <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">Unable to load image from URL</span>
                    </div>
                  ) : (
                    <img
                      src={block.url.trim()}
                      alt={block.caption || 'Blog image'}
                      onError={() => setFailedImages((prev) => ({ ...prev, [block.id || idx]: true }))}
                      className="w-full h-auto max-h-[550px] object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                {block.caption && (
                  <figcaption className="text-center text-xs text-slate-500 mt-2 font-medium">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'gallery': {
            const images = (block.images || []).filter((img) => img && img.trim());
            if (images.length === 0) return null;
            const cols = images.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

            return (
              <figure key={block.id || idx} className="my-8">
                <div className={`grid ${cols} gap-3`}>
                  {images.map((imgUrl, imgIdx) => (
                    <div
                      key={imgIdx}
                      onClick={() => setLightbox({ images, index: imgIdx })}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer aspect-video bg-slate-100"
                    >
                      <img
                        src={imgUrl.trim()}
                        alt={`Gallery photo ${imgIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
                {block.caption && (
                  <figcaption className="text-center text-xs text-slate-500 mt-2 font-medium">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'video': {
            if (!block.url || !block.url.trim()) return null;
            const url = block.url.trim();
            const isDirect = isDirectVideoUrl(url);
            const embedUrl = getEmbedUrl(url);

            return (
              <figure key={block.id || idx} className="my-8">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                  {isDirect ? (
                    <video
                      controls
                      src={url}
                      className="w-full h-full object-contain"
                    />
                  ) : embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={block.caption || 'Video Player'}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Please enter a valid YouTube, Vimeo, or direct MP4 video link.
                    </div>
                  )}
                </div>
                {block.caption && (
                  <figcaption className="text-center text-xs text-slate-500 mt-2 font-medium">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'code': {
            return (
              <CodeBlock
                key={block.id || idx}
                code={block.code || ''}
                language={block.language || 'javascript'}
              />
            );
          }

          case 'quote': {
            return (
              <blockquote key={block.id || idx} className="my-8 pl-6 border-l-4 border-indigo-500 bg-indigo-50/50 py-4 px-6 rounded-r-2xl">
                <Quote className="w-6 h-6 text-indigo-500/60 mb-2" />
                <p className="text-base sm:text-lg font-serif italic text-slate-800 leading-relaxed mb-2">
                  "{block.content}"
                </p>
                {block.author && (
                  <footer className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    — {block.author}
                  </footer>
                )}
              </blockquote>
            );
          }

          case 'callout': {
            const style = block.style || 'tip';
            const isWarning = style === 'warning';
            const isInfo = style === 'info';

            return (
              <div
                key={block.id || idx}
                className={`my-6 p-4 rounded-2xl border flex items-start gap-3 ${
                  isWarning
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : isInfo
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : isInfo ? (
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  {block.title && (
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                      {block.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {block.content}
                  </p>
                </div>
              </div>
            );
          }

          default:
            return null;
        }
      })}

      {/* Lightbox Modal */}
      {lightbox && (
        <GalleryLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
