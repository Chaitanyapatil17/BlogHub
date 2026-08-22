import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Subscript, 
  Superscript, 
  Eraser, 
  List, 
  ListOrdered, 
  Indent, 
  Outdent, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  ChevronDown, 
  PaintBucket, 
  Square, 
  Code,
  Pilcrow,
  Check
} from 'lucide-react';

const FONT_FAMILIES = [
  { label: 'Faustina (Editorial)', value: '"Faustina", "Lora", Georgia, serif' },
  { label: 'Lora', value: '"Lora", Georgia, serif' },
  { label: 'Calibri (Body)', value: 'Calibri, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Monospace', value: 'monospace' }
];

const FONT_SIZES = [
  '8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '32', '36', '48', '72'
];

const TEXT_COLORS = [
  { label: 'Black', value: '#0f172a' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Crimson', value: '#991b1b' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Slate Gray', value: '#475569' }
];

const HIGHLIGHT_COLORS = [
  { label: 'No Color', value: 'transparent' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Bright Green', value: '#bbf7d0' },
  { label: 'Cyan Blue', value: '#bae6fd' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Lavender', value: '#e9d5ff' }
];

const SHADING_COLORS = [
  { label: 'No Color', value: 'transparent' },
  { label: 'Light Slate', value: '#f8fafc' },
  { label: 'Subtle Gray', value: '#f1f5f9' },
  { label: 'Warm Cream', value: '#fffbeb' },
  { label: 'Soft Blue', value: '#eff6ff' },
  { label: 'Soft Rose', value: '#fff1f2' },
  { label: 'Soft Emerald', value: '#f0fdf4' }
];

export default function WordRibbonEditor({ value, onChange, placeholder = 'Write paragraph text...' }) {
  const editorRef = useRef(null);
  const [selectedFont, setSelectedFont] = useState('"Faustina", "Lora", Georgia, serif');
  const [selectedSize, setSelectedSize] = useState('14');
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    subscript: false,
    superscript: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    orderedList: false,
    unorderedList: false,
  });

  // Dropdown states
  const [showCaseMenu, setShowCaseMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSpacingMenu, setShowSpacingMenu] = useState(false);
  const [showShadingPicker, setShowShadingPicker] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#0f172a');
  const [currentHighlightColor, setCurrentHighlightColor] = useState('#fef08a');
  const [currentLineSpacing, setCurrentLineSpacing] = useState('1.6');
  const [currentBorder, setCurrentBorder] = useState('none');

  // Track if user is currently typing to avoid replacing innerHTML during editing
  const isTypingRef = useRef(false);

  // Sync value into contentEditable when value changes externally
  useEffect(() => {
    if (editorRef.current && !isTypingRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Update active ribbon states on selection change
  const updateToolbarStates = () => {
    if (!document.queryCommandState) return;
    try {
      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        subscript: document.queryCommandState('subscript'),
        superscript: document.queryCommandState('superscript'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
        orderedList: document.queryCommandState('insertOrderedList'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
      });
    } catch (e) {}
  };

  const handleInput = () => {
    isTypingRef.current = true;
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
    updateToolbarStates();
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  };

  const exec = (command, val = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleInput();
    updateToolbarStates();
  };

  // Font family change
  const handleFontChange = (fontValue) => {
    setSelectedFont(fontValue);
    exec('fontName', fontValue);
  };

  // Font size change
  const handleSizeChange = (sizePt) => {
    setSelectedSize(sizePt);
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    // Use modern CSS inline styling on selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const span = document.createElement('span');
      span.style.fontSize = `${sizePt}px`;
      const range = selection.getRangeAt(0);
      try {
        range.surroundContents(span);
      } catch (err) {
        exec('fontSize', '3');
      }
    } else {
      exec('fontSize', '3');
    }
    handleInput();
  };

  // Grow / Shrink font
  const adjustFontSize = (delta) => {
    const currentIdx = FONT_SIZES.indexOf(selectedSize);
    let nextIdx = currentIdx !== -1 ? currentIdx + delta : 4;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= FONT_SIZES.length) nextIdx = FONT_SIZES.length - 1;
    handleSizeChange(FONT_SIZES[nextIdx]);
  };

  // Change case transformation
  const applyCaseChange = (mode) => {
    setShowCaseMenu(false);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const selectedText = selection.toString();
    let transformed = selectedText;

    if (mode === 'uppercase') {
      transformed = selectedText.toUpperCase();
    } else if (mode === 'lowercase') {
      transformed = selectedText.toLowerCase();
    } else if (mode === 'capitalize') {
      transformed = selectedText.replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (mode === 'sentence') {
      transformed = selectedText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    }

    document.execCommand('insertText', false, transformed);
    handleInput();
  };

  // Clear all formatting
  const handleClearFormat = () => {
    exec('removeFormat');
    if (editorRef.current) {
      editorRef.current.style.backgroundColor = 'transparent';
      editorRef.current.style.lineHeight = '1.6';
      editorRef.current.style.borderLeft = 'none';
      editorRef.current.style.border = 'none';
      editorRef.current.style.padding = '0';
    }
    setCurrentBorder('none');
    handleInput();
  };

  // Line spacing
  const applyLineSpacing = (spacing) => {
    setCurrentLineSpacing(spacing);
    setShowSpacingMenu(false);
    if (editorRef.current) {
      editorRef.current.style.lineHeight = spacing;
      handleInput();
    }
  };

  // Background shading
  const applyShading = (color) => {
    setShowShadingPicker(false);
    if (editorRef.current) {
      editorRef.current.style.backgroundColor = color;
      if (color !== 'transparent') {
        editorRef.current.style.padding = '12px 16px';
        editorRef.current.style.borderRadius = '8px';
      } else {
        editorRef.current.style.padding = '0';
      }
      handleInput();
    }
  };

  // Borders & callouts
  const applyBorder = (type) => {
    setShowBorderMenu(false);
    setCurrentBorder(type);
    if (!editorRef.current) return;

    editorRef.current.style.border = 'none';
    editorRef.current.style.borderLeft = 'none';
    editorRef.current.style.borderBottom = 'none';

    if (type === 'left-callout') {
      editorRef.current.style.borderLeft = '4px solid #dc2626';
      editorRef.current.style.paddingLeft = '14px';
      editorRef.current.style.backgroundColor = '#f8fafc';
    } else if (type === 'box') {
      editorRef.current.style.border = '1px solid #cbd5e1';
      editorRef.current.style.padding = '12px';
      editorRef.current.style.borderRadius = '8px';
    } else if (type === 'bottom-line') {
      editorRef.current.style.borderBottom = '2px solid #e2e8f0';
      editorRef.current.style.paddingBottom = '8px';
    } else if (type === 'quote') {
      editorRef.current.style.borderLeft = '4px solid #4f46e5';
      editorRef.current.style.paddingLeft = '14px';
      editorRef.current.style.fontStyle = 'italic';
      editorRef.current.style.backgroundColor = '#f1f5f9';
    } else {
      editorRef.current.style.padding = '0';
      editorRef.current.style.backgroundColor = 'transparent';
    }
    handleInput();
  };

  return (
    <div className="border border-slate-300 rounded-xl bg-white shadow-xs overflow-visible">
      {/* 1. MS WORD / GOOGLE DOCS RIBBON TOOLBAR (Matches Reference Image) */}
      <div className="bg-[#f8fafc] border-b border-slate-300 p-2 select-none flex flex-wrap items-stretch gap-3">
        
        {/* GROUP 1: FONT GROUP */}
        <div className="flex flex-col justify-between border-r border-slate-300 pr-3 pb-1">
          {/* Top Row: Font Family, Size, Grow, Shrink, Change Case, Eraser */}
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            {/* Font Family Dropdown */}
            <select
              value={selectedFont}
              onChange={(e) => handleFontChange(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 max-w-[130px]"
              title="Font Family"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Font Size Dropdown */}
            <select
              value={selectedSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 w-14"
              title="Font Size"
            >
              {FONT_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>

            {/* Grow Font Button (A^) */}
            <button
              type="button"
              onClick={() => adjustFontSize(1)}
              className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs flex items-center cursor-pointer"
              title="Increase Font Size (Grow Font)"
            >
              <span>A</span>
              <span className="text-[9px] -mt-1 font-black">▲</span>
            </button>

            {/* Shrink Font Button (Av) */}
            <button
              type="button"
              onClick={() => adjustFontSize(-1)}
              className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs flex items-center cursor-pointer"
              title="Decrease Font Size (Shrink Font)"
            >
              <span>A</span>
              <span className="text-[9px] -mb-1 font-black">▼</span>
            </button>

            {/* Change Case Dropdown (Aa) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCaseMenu(!showCaseMenu)}
                className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                title="Change Case (Sentence case, UPPERCASE, lowercase, etc.)"
              >
                <span>Aa</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showCaseMenu && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => applyCaseChange('sentence')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    Sentence case.
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCaseChange('lowercase')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    lowercase
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCaseChange('uppercase')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 font-bold"
                  >
                    UPPERCASE
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCaseChange('capitalize')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    Capitalize Each Word
                  </button>
                </div>
              )}
            </div>

            {/* Clear All Formatting Eraser */}
            <button
              type="button"
              onClick={handleClearFormat}
              className="p-1 px-1.5 hover:bg-rose-100 hover:text-rose-700 rounded text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
              title="Clear All Formatting"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>

          {/* Bottom Row: Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Highlights, Colors */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Bold */}
            <button
              type="button"
              onClick={() => exec('bold')}
              className={`p-1 px-2 rounded text-xs font-black cursor-pointer ${
                activeStates.bold ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-800'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => exec('italic')}
              className={`p-1 px-2 rounded text-xs italic font-serif cursor-pointer ${
                activeStates.italic ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-800'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => exec('underline')}
              className={`p-1 px-2 rounded text-xs underline cursor-pointer ${
                activeStates.underline ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-800'
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => exec('strikeThrough')}
              className={`p-1 px-1.5 rounded text-xs line-through cursor-pointer ${
                activeStates.strike ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-800'
              }`}
              title="Strikethrough (abc)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            {/* Subscript (x2) */}
            <button
              type="button"
              onClick={() => exec('subscript')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.subscript ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Subscript (x₂)"
            >
              <Subscript className="w-3.5 h-3.5" />
            </button>

            {/* Superscript (x2) */}
            <button
              type="button"
              onClick={() => exec('superscript')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.superscript ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Superscript (x²)"
            >
              <Superscript className="w-3.5 h-3.5" />
            </button>

            {/* Text Highlight Color (ab pen) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-0.5 cursor-pointer"
                title="Text Highlight Color"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold text-[11px] leading-none">ab</span>
                  <span
                    className="w-4 h-1 rounded-xs mt-0.5"
                    style={{ backgroundColor: currentHighlightColor }}
                  ></span>
                </div>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-30 grid grid-cols-4 gap-1.5 w-36">
                  {HIGHLIGHT_COLORS.map((hc) => (
                    <button
                      key={hc.value}
                      type="button"
                      onClick={() => {
                        setCurrentHighlightColor(hc.value);
                        setShowHighlightPicker(false);
                        exec('hiliteColor', hc.value);
                        exec('backColor', hc.value);
                      }}
                      className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: hc.value === 'transparent' ? '#ffffff' : hc.value }}
                      title={hc.label}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Font Color (A with red underline) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-0.5 cursor-pointer"
                title="Font Color"
              >
                <div className="flex flex-col items-center">
                  <span className="font-extrabold text-[12px] leading-none">A</span>
                  <span
                    className="w-4 h-1 rounded-xs mt-0.5"
                    style={{ backgroundColor: currentTextColor }}
                  ></span>
                </div>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-30 grid grid-cols-3 gap-1.5 w-32">
                  {TEXT_COLORS.map((tc) => (
                    <button
                      key={tc.value}
                      type="button"
                      onClick={() => {
                        setCurrentTextColor(tc.value);
                        setShowColorPicker(false);
                        exec('foreColor', tc.value);
                      }}
                      className="w-6 h-6 rounded-full border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: tc.value }}
                      title={tc.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group 1 Footer Label: Font */}
          <div className="text-[10px] text-slate-400 font-semibold text-center mt-1 flex items-center justify-between px-1">
            <span></span>
            <span>Font</span>
            <span className="text-slate-400 text-[10px]">⇲</span>
          </div>
        </div>

        {/* GROUP 2: PARAGRAPH GROUP */}
        <div className="flex flex-col justify-between pb-1 flex-1 min-w-[280px]">
          {/* Top Row: Bullets, Numbering, Multilevel, Decrease Indent, Increase Indent, Sort, Paragraph Marks */}
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            {/* Bullet List */}
            <button
              type="button"
              onClick={() => exec('insertUnorderedList')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.unorderedList ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Bulleted List"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onClick={() => exec('insertOrderedList')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.orderedList ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Numbered List (1, 2, 3)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Decrease Indent */}
            <button
              type="button"
              onClick={() => exec('outdent')}
              className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs cursor-pointer"
              title="Decrease Indent"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>

            {/* Increase Indent */}
            <button
              type="button"
              onClick={() => exec('indent')}
              className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs cursor-pointer"
              title="Increase Indent"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>

            {/* Show/Hide Paragraph marks */}
            <button
              type="button"
              onClick={() => alert('Paragraph layout active. Standard block margins and padding applied.')}
              className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-600 text-xs cursor-pointer"
              title="Show/Hide Paragraph marks (¶)"
            >
              <Pilcrow className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Row: Align Left, Center, Right, Justify, Line Spacing, Shading Bucket, Borders */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Align Left */}
            <button
              type="button"
              onClick={() => exec('justifyLeft')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.alignLeft ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Align Left (Ctrl+L)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            {/* Align Center */}
            <button
              type="button"
              onClick={() => exec('justifyCenter')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.alignCenter ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Align Center (Ctrl+E)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            {/* Align Right */}
            <button
              type="button"
              onClick={() => exec('justifyRight')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.alignRight ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Align Right (Ctrl+R)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            {/* Justify */}
            <button
              type="button"
              onClick={() => exec('justifyFull')}
              className={`p-1 px-1.5 rounded text-xs cursor-pointer ${
                activeStates.alignJustify ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
              title="Justify (Ctrl+J)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>

            {/* Line & Paragraph Spacing */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpacingMenu(!showSpacingMenu)}
                className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-0.5 cursor-pointer"
                title="Line and Paragraph Spacing (1.0, 1.15, 1.5, 2.0)"
              >
                <span className="font-mono text-xs font-bold leading-none">↕≡</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              {showSpacingMenu && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  {['1.0', '1.15', '1.5', '1.6', '2.0', '2.5'].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => applyLineSpacing(sp)}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center justify-between"
                    >
                      <span>{sp}</span>
                      {currentLineSpacing === sp && <Check className="w-3 h-3 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shading / Background Bucket */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowShadingPicker(!showShadingPicker)}
                className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-0.5 cursor-pointer"
                title="Paragraph Background Shading"
              >
                <PaintBucket className="w-3.5 h-3.5 text-blue-600" />
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              {showShadingPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-lg z-30 grid grid-cols-3 gap-1.5 w-32">
                  {SHADING_COLORS.map((sc) => (
                    <button
                      key={sc.value}
                      type="button"
                      onClick={() => applyShading(sc.value)}
                      className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: sc.value === 'transparent' ? '#ffffff' : sc.value }}
                      title={sc.label}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Borders & Callout styling */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBorderMenu(!showBorderMenu)}
                className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-xs flex items-center gap-0.5 cursor-pointer"
                title="Borders & Callout Box"
              >
                <Square className="w-3.5 h-3.5 text-slate-700" />
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              {showBorderMenu && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => applyBorder('none')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    No Border
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBorder('left-callout')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-red-600 font-bold"
                  >
                    Left Red Callout Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBorder('box')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    Full Box Outline
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBorder('quote')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-indigo-600 italic"
                  >
                    Quote Shading Box
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBorder('bottom-line')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                  >
                    Bottom Divider Line
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Raw HTML View */}
            <button
              type="button"
              onClick={() => setShowRawHtml(!showRawHtml)}
              className={`p-1 px-1.5 ml-auto rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                showRawHtml ? 'bg-slate-800 text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="Toggle Raw HTML / Code View"
            >
              <Code className="w-3 h-3" />
              <span>{showRawHtml ? 'Visual' : 'HTML'}</span>
            </button>
          </div>

          {/* Group 2 Footer Label: Paragraph */}
          <div className="text-[10px] text-slate-400 font-semibold text-center mt-1 flex items-center justify-between px-1">
            <span></span>
            <span>Paragraph</span>
            <span className="text-slate-400 text-[10px]">⇲</span>
          </div>
        </div>

      </div>

      {/* 2. THE RICH CONTENT EDITABLE CANVAS AREA */}
      <div className="p-4 sm:p-5 min-h-[140px] bg-white">
        {showRawHtml ? (
          <textarea
            rows={5}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write raw HTML or text here..."
            className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg outline-none border border-slate-800"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyUp={updateToolbarStates}
            onMouseUp={updateToolbarStates}
            data-placeholder={placeholder}
            className="outline-none min-h-[100px] text-slate-800 text-sm sm:text-base leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none transition-all"
            style={{
              fontFamily: selectedFont,
              fontSize: `${selectedSize}px`,
              lineHeight: currentLineSpacing,
            }}
          />
        )}
      </div>

      {/* 3. WORD & CHARACTER COUNTER TRAY */}
      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Words: {value ? value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length : 0}</span>
          <span>Chars: {value ? value.replace(/<[^>]*>/g, '').length : 0}</span>
        </div>
        <div className="text-slate-400 italic">
          MS Word Ribbon Text Editor • Press Ctrl+B, Ctrl+I for quick formatting
        </div>
      </div>
    </div>
  );
}
