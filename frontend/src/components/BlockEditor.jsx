import { useState, useRef } from 'react';
import ContentBlockRenderer, { getEmbedUrl } from './ContentBlockRenderer';
import WordRibbonEditor from './WordRibbonEditor';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Code2, 
  Quote as QuoteIcon, 
  Lightbulb, 
  Heading1, 
  AlignLeft, 
  Layers, 
  Eye, 
  Edit3, 
  Tag, 
  Sparkles,
  X,
  Upload,
  ImageOff,
  AlertCircle
} from 'lucide-react';

import { STUDIO_CATEGORY_OPTIONS, SUBCATEGORIES_MAP } from '../utils/categories';

const COVER_PRESETS = [
  { label: '🏆 Sports', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80' },
  { label: '⚽ Football / Turf', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80' },
  { label: '🎬 Entertainment', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80' },
  { label: '🍲 Food & Recipes', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80' },
  { label: '💻 Coding', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80' },
  { label: '🤖 AI & Tech', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80' },
  { label: '🎨 Design', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80' },
  { label: '📈 Business', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80' },
  { label: '🌍 World News', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80' },
  { label: '🔮 Astrology', url: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=1200&q=80' }
];

const VIDEO_PRESETS = [
  { label: '🐙 Git & GitHub Simple', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk' },
  { label: '⚛️ React 19 Crash Course', url: 'https://www.youtube.com/watch?v=d56mG7DezGs' },
  { label: '🤖 AI Agents & LLMs', url: 'https://www.youtube.com/watch?v=sal78ACtGTc' },
  { label: '🚀 Full-Stack 2026', url: 'https://www.youtube.com/watch?v=nu_pCVPKzTk' },
];

const SUGGESTED_TAGS = ['Sports', 'Cricket', 'Football', 'Entertainment', 'Food', 'Recipes', 'React', 'JavaScript', 'NodeJS', 'PostgreSQL', 'AI', 'WebDev', 'Finance', 'Investing', 'News', 'Astrology', 'Tutorial', 'Video'];

const CATEGORIES = STUDIO_CATEGORY_OPTIONS;

export default function BlockEditor({
  title,
  setTitle,
  coverImage,
  setCoverImage,
  category,
  setCategory,
  subCategory = '',
  setSubCategory = () => {},
  tags,
  setTags,
  blocks,
  setBlocks,
}) {
  const [activeMode, setActiveMode] = useState('edit'); // 'edit' or 'preview'
  const [coverType, setCoverType] = useState(
    coverImage && (coverImage.includes('youtube') || coverImage.includes('youtu.be') || coverImage.includes('vimeo')) ? 'video' : 'image'
  );
  const [tagInput, setTagInput] = useState('');
  const [coverImageError, setCoverImageError] = useState(false);

  // File input ref for cover
  const coverFileInputRef = useRef(null);

  // Handle local image file upload (converts to Base64 data URL)
  const handleLocalImageUpload = (file, onSuccess) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onSuccess(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Add block helper
  const addBlock = (type) => {
    const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    let newBlock = { id: newId, type };

    switch (type) {
      case 'heading':
        newBlock = { ...newBlock, level: 2, content: '' };
        break;
      case 'paragraph':
        newBlock = { ...newBlock, content: '' };
        break;
      case 'image':
        newBlock = { ...newBlock, url: '', caption: '' };
        break;
      case 'gallery':
        newBlock = { ...newBlock, images: ['', ''], caption: '' };
        break;
      case 'video':
        newBlock = { ...newBlock, url: '', caption: '' };
        break;
      case 'code':
        newBlock = { ...newBlock, code: '', language: 'javascript' };
        break;
      case 'quote':
        newBlock = { ...newBlock, content: '', author: '' };
        break;
      case 'callout':
        newBlock = { ...newBlock, style: 'tip', title: '', content: '' };
        break;
      default:
        break;
    }

    setBlocks([...blocks, newBlock]);
  };

  // Update block helper
  const updateBlock = (id, fields) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...fields } : b)));
  };

  // Move block
  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  // Delete block
  const deleteBlock = (id) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  // Tag helper
  const addTagItem = (rawVal) => {
    if (!rawVal) return;
    const clean = rawVal.trim().replace(/^#+/, '').trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation();
      addTagItem(tagInput);
      setTagInput('');
    }
  };

  const handleTagInputChange = (e) => {
    const val = e.target.value;
    if (val.includes(',') || val.includes(';')) {
      const parts = val.split(/[,;]+/);
      parts.forEach((p) => addTagItem(p));
      setTagInput('');
    } else {
      setTagInput(val);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Top Toggle: Edit Mode vs Live Preview */}
      <div className="flex items-center justify-between p-1.5 bg-slate-100 rounded-xl border border-slate-200/90 max-w-fit">
        <button
          type="button"
          onClick={() => setActiveMode('edit')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'edit' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Block Builder
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('preview')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'preview' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Live Preview
        </button>
      </div>

      {activeMode === 'preview' ? (
        /* LIVE PREVIEW MODE */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {coverImage && !coverImageError && (
            <div className="mb-6 rounded-2xl overflow-hidden aspect-video max-h-[350px] bg-slate-100 border border-slate-200">
              <img
                src={coverImage}
                alt="Cover"
                onError={() => setCoverImageError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {category}
            </span>
            {tags.map((t) => (
              <span key={t} className="text-xs text-slate-500 font-medium">
                #{t}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6">{title || 'Untitled Article'}</h1>

          <ContentBlockRenderer blocks={blocks} fallbackContent="" />
        </div>
      ) : (
        /* BUILDER MODE */
        <div className="space-y-6">
          {/* Metadata Section: Cover Image, Category, Title, Tags */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Article Essentials
            </h3>

            {/* Article Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Article Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Git and GitHub Commands Every Beginner Should Know"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            {/* Category, Sub-Category & Tags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* 1. Main Category */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Main Category</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (setSubCategory) setSubCategory('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Sub-Category Dropdown */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Sub-Category</span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <select
                  value={subCategory || ''}
                  onChange={(e) => {
                    if (setSubCategory) setSubCategory(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
                >
                  <option value="">Select Sub-Category (None / General)</option>
                  {(SUBCATEGORIES_MAP[category] || []).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                {(SUBCATEGORIES_MAP[category] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(SUBCATEGORIES_MAP[category] || []).slice(0, 4).map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubCategory && setSubCategory(sub)}
                        className={`text-[9.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          subCategory === sub
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Tags Input */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Tags
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. React, Cricket..."
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addTagItem(tagInput);
                      setTagInput('');
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Tag Suggestions & Tag Chips full width */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Suggested Tags:</span>
                {SUGGESTED_TAGS.map((stag) => (
                  <button
                    key={stag}
                    type="button"
                    onClick={() => addTagItem(stag)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      tags.includes(stag)
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200 opacity-60'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    +{stag}
                  </button>
                ))}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="hover:text-rose-600 cursor-pointer p-0.5"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Media Picker (Image or Video) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cover Media:
                  </label>
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setCoverType('image');
                        setCoverImageError(false);
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        coverType === 'image' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverType('video');
                        setCoverImageError(false);
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        coverType === 'video' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      Video Story
                    </button>
                  </div>
                </div>

                {coverImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage('');
                      setCoverImageError(false);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove Cover
                  </button>
                )}
              </div>

              {/* Hidden file input for uploading image from computer */}
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleLocalImageUpload(e.target.files[0], (dataUrl) => {
                      setCoverImage(dataUrl);
                      setCoverType('image');
                      setCoverImageError(false);
                    });
                  }
                }}
              />

              {coverType === 'image' ? (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste direct image URL (https://...)"
                      value={coverImage.startsWith('data:') ? 'Local Image Uploaded from PC' : coverImage}
                      disabled={coverImage.startsWith('data:')}
                      onChange={(e) => {
                        setCoverImage(e.target.value);
                        setCoverImageError(false);
                      }}
                      className="flex-1 w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      Upload from PC
                    </button>
                  </div>

                  {/* Image Presets */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">Presets:</span>
                    {COVER_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setCoverImage(preset.url);
                          setCoverImageError(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Paste YouTube or Vimeo Video Link (e.g. https://www.youtube.com/watch?v=...)"
                        value={coverImage}
                        onChange={(e) => {
                          setCoverImage(e.target.value);
                          setCoverImageError(false);
                        }}
                        className="flex-1 w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>

                    {/* Video Presets */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Video Presets:</span>
                      {VIDEO_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setCoverImage(preset.url);
                            setCoverImageError(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer border border-rose-200"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Cover Preview Card with Error Fallback & Video Embed Preview */}
              {coverImage && (
                <div className="mt-3">
                  {coverType === 'video' && getEmbedUrl(coverImage) ? (
                    <div className="rounded-xl overflow-hidden aspect-video max-h-52 border border-slate-200 bg-slate-950 relative">
                      <iframe
                        src={getEmbedUrl(coverImage)}
                        title="Video Cover Preview"
                        className="w-full h-full"
                        allowFullScreen
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => setCoverImage('')}
                          className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                          title="Remove video cover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : coverImageError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Could not load media from this URL. Try clicking <strong>Upload from PC</strong> or picking a preset.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage('');
                          setCoverImageError(false);
                        }}
                        className="font-bold underline cursor-pointer ml-2 shrink-0"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden aspect-video max-h-48 border border-slate-200 bg-slate-100 relative group">
                      <img
                        src={coverImage}
                        alt="Cover Preview"
                        onError={() => setCoverImageError(true)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImage('');
                            setCoverImageError(false);
                          }}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                          title="Remove cover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Block Builder List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Content Blocks ({blocks.length})
              </h3>
              <span className="text-xs text-slate-500">Reorder with arrows, delete, or add media</span>
            </div>

            {blocks.map((block, index) => (
              <div
                key={block.id || index}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3 relative group"
              >
                {/* Block Header & Action Controls */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                    {block.type === 'heading' && <Heading1 className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'paragraph' && <AlignLeft className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'image' && <ImageIcon className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'gallery' && <Layers className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'video' && <Video className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'code' && <Code2 className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'quote' && <QuoteIcon className="w-3 h-3 text-indigo-600" />}
                    {block.type === 'callout' && <Lightbulb className="w-3 h-3 text-indigo-600" />}
                    {block.type} Block
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, -1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 1)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block Fields based on Type */}
                {block.type === 'heading' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={block.level || 2}
                        onChange={(e) => updateBlock(block.id, { level: parseInt(e.target.value, 10) })}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value={2}>H2 - Major Heading</option>
                        <option value={3}>H3 - Sub Heading</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Type heading text..."
                        value={block.content || ''}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {block.type === 'paragraph' && (
                  <div className="space-y-1">
                    <WordRibbonEditor
                      value={block.content || ''}
                      onChange={(html) => updateBlock(block.id, { content: html })}
                      placeholder="Write your story paragraph with full typography and styling..."
                    />
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL or upload from your computer"
                        value={block.url && block.url.startsWith('data:') ? 'Local Image Uploaded from PC' : (block.url || '')}
                        disabled={block.url && block.url.startsWith('data:')}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        className="flex-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <label className="w-full sm:w-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLocalImageUpload(e.target.files[0], (dataUrl) => {
                                updateBlock(block.id, { url: dataUrl });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional caption..."
                      value={block.caption || ''}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 outline-none"
                    />

                    {block.url && block.url.trim() && (
                      <div className="mt-2 rounded-xl overflow-hidden max-h-48 aspect-video border border-slate-200 bg-slate-100 relative group">
                        <img src={block.url.trim()} alt="Live Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => updateBlock(block.id, { url: '' })}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'gallery' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-600">Gallery Images (URL or Upload):</div>
                    {(block.images || []).map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Image ${imgIdx + 1} URL`}
                          value={imgUrl && imgUrl.startsWith('data:') ? 'Local Image Uploaded' : imgUrl}
                          disabled={imgUrl && imgUrl.startsWith('data:')}
                          onChange={(e) => {
                            const newImgs = [...(block.images || [])];
                            newImgs[imgIdx] = e.target.value;
                            updateBlock(block.id, { images: newImgs });
                          }}
                          className="flex-1 w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
                        />
                        <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 cursor-pointer shrink-0">
                          <Upload className="w-3 h-3 text-indigo-600" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleLocalImageUpload(e.target.files[0], (dataUrl) => {
                                  const newImgs = [...(block.images || [])];
                                  newImgs[imgIdx] = dataUrl;
                                  updateBlock(block.id, { images: newImgs });
                                });
                              }
                            }}
                          />
                        </label>
                        {block.images.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newImgs = block.images.filter((_, i) => i !== imgIdx);
                              updateBlock(block.id, { images: newImgs });
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { images: [...(block.images || []), ''] })}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another gallery image
                    </button>
                    <input
                      type="text"
                      placeholder="Optional gallery caption..."
                      value={block.caption || ''}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 outline-none"
                    />
                  </div>
                )}

                {block.type === 'video' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="YouTube or Vimeo Link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
                      value={block.url || ''}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Optional video caption..."
                      value={block.caption || ''}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 outline-none"
                    />

                    {/* Instant in-builder Video Preview */}
                    {block.url && block.url.trim() && (
                      <div className="mt-2 rounded-xl overflow-hidden aspect-video max-h-56 border border-slate-200 bg-slate-900 relative">
                        {getEmbedUrl(block.url.trim()) ? (
                          <iframe
                            src={getEmbedUrl(block.url.trim())}
                            title="Video Preview"
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                            Invalid video URL
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={block.language || 'javascript'}
                        onChange={(e) => updateBlock(block.id, { language: e.target.value })}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="sql">SQL / PostgreSQL</option>
                        <option value="html">HTML / CSS</option>
                        <option value="json">JSON</option>
                        <option value="bash">Bash / Git</option>
                      </select>
                    </div>
                    <textarea
                      rows={6}
                      placeholder="// Paste code snippet here..."
                      value={block.code || ''}
                      onChange={(e) => updateBlock(block.id, { code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl outline-none"
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Quote text..."
                      value={block.content || ''}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-serif italic text-slate-800 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Author or source attribution (e.g. Linus Torvalds)..."
                      value={block.author || ''}
                      onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 outline-none"
                    />
                  </div>
                )}

                {block.type === 'callout' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={block.style || 'tip'}
                        onChange={(e) => updateBlock(block.id, { style: e.target.value })}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="tip">💡 Tip / Best Practice</option>
                        <option value="info">ℹ️ Information</option>
                        <option value="warning">⚠️ Warning</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Callout title..."
                        value={block.title || ''}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Callout content text..."
                      value={block.content || ''}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Add Block Toolbar */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                + Add Content Block:
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                  + Text
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Heading1 className="w-3.5 h-3.5 text-indigo-600" />
                  + Heading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  + Image
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('gallery')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  + Gallery
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('video')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  + Video Embed
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('code')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                  + Code
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('quote')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <QuoteIcon className="w-3.5 h-3.5 text-indigo-600" />
                  + Quote
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('callout')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                  + Tip Box
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
