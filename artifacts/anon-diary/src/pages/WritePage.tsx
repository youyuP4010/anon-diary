import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import LoginModal from '@/components/common/LoginModal';
import type { TextAlign } from '@/lib/types';

const UNSPLASH_IMAGES = [
  { id: '1419242902214-272b3f66ee7a', label: 'Starry Sky' },
  { id: '1519681393784-d120267933ba', label: 'Milky Way' },
  { id: '1516912481800-3606a76d44eb', label: 'Night Sky' },
  { id: '1444703686981-a3abbc4d4fe3', label: 'Space' },
  { id: '1532767153582-b1a0e5145009', label: 'Full Moon' },
  { id: '1501854140801-50d01698950b', label: 'Moonlit Sea' },
  { id: '1495616811223-4d98c6e9c869', label: 'Sunset' },
  { id: '1470252649378-9c29740c9fa8', label: 'Twilight' },
  { id: '1500534314209-a25ddb2bd429', label: 'Night Beach' },
  { id: '1477959858617-67f85cf4f1df', label: 'City Lights' },
  { id: '1519058082700-08a0b56da9b4', label: 'Night Path' },
  { id: '1493246507139-91e8fad9978e', label: 'Dawn Mountain' },
  { id: '1504701954957-2010ec3bcec1', label: 'Cloudy Moon' },
  { id: '1505533321630-975218a5f66f', label: 'Morning Fog' },
  { id: '1465056836041-b3dc21fc2e32', label: 'Night Lake' },
  { id: '1508739773434-c26b3d09e071', label: 'Dawn Light' },
  { id: '1543722530-d4b47f34c74a', label: 'Night City' },
  { id: '1534796636912-3b584b664208', label: 'Midnight' },
  { id: '1464278533981-50106e6176b1', label: 'Moonlit Path' },
  { id: '1502472584811-0a2f2feb8968', label: 'Dawn Sky' },
  { id: '1454023489416-6d257a0e85ff', label: 'Twilight City' },
  { id: '1484503793037-5c9644d6a16e', label: 'Night Forest' },
  { id: '1510784981-7e1c5d7e8f5c', label: 'Star Trails' },
  { id: '1462275646964-a0e3386b89fa', label: 'Moonlit River' },
];

const DEFAULT_BG_ID = '1519681393784-d120267933ba';

function unsplashThumb(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=200&q=60`;
}
function unsplashFull(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=85`;
}

const ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: 'left',   label: 'L' },
  { value: 'center', label: 'C' },
  { value: 'right',  label: 'R' },
];

const FONT_COLORS = [
  { value: '#FFFFFF', label: 'White', bg: 'bg-white border border-gray-300' },
  { value: '#000000', label: 'Black', bg: 'bg-black' },
  { value: '#AAAAAA', label: 'Gray',  bg: 'bg-gray-400' },
];

function BgModal({ currentValue, onSelect, onClose }: {
  currentValue: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8"
        style={{ maxHeight: '75vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground text-base">Choose Background</h3>
          <button onClick={onClose} className="text-muted-foreground text-xl leading-none">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {UNSPLASH_IMAGES.filter(img => !hidden.has(img.id)).map(img => {
            const fullUrl = unsplashFull(img.id);
            const isSelected = currentValue === fullUrl;
            return (
              <button
                key={img.id}
                onClick={() => { onSelect(fullUrl); onClose(); }}
                data-testid={`button-bg-img-${img.id}`}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected ? 'border-primary scale-95 shadow-lg' : 'border-transparent'
                }`}
                style={{ aspectRatio: '2/3' }}
                title={img.label}
              >
                <img
                  src={unsplashThumb(img.id)}
                  alt={img.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setHidden(prev => new Set([...prev, img.id]))}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <span className="text-white text-2xl drop-shadow font-bold">✓</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[9px] text-center py-1 truncate px-1">
                  {img.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function WritePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bgValue, setBgValue] = useState(unsplashFull(DEFAULT_BG_ID));
  const [textAlign, setTextAlign] = useState<TextAlign>('center');
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setShowLoginModal(true);
  }, [user, authLoading]);

  useEffect(() => {
    if (!editId || !user) return;
    async function loadDiary() {
      const { data } = await supabase
        .from('anon_diary_diaries')
        .select('*')
        .eq('id', editId)
        .eq('author_id', user!.id)
        .single();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setBgValue(data.background_value ?? unsplashFull(DEFAULT_BG_ID));
        setTextAlign((data.text_align as TextAlign) ?? 'center');
        setFontColor(data.font_color ?? '#FFFFFF');
      }
    }
    void loadDiary();
  }, [editId, user]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 500) setContent(e.target.value);
  }, []);

  async function handleSave() {
    if (!user) { setShowLoginModal(true); return; }
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setSaveError(null);

    let nickname = user.email?.split('@')[0] ?? 'Anonymous';
    const { data: profile } = await supabase
      .from('anon_diary_profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    if (profile) nickname = profile.nickname;
    else await supabase.from('anon_diary_profiles').upsert({ id: user.id, nickname });

    const payload = {
      title: title.trim(),
      content: content.trim(),
      background_type: 'image' as const,
      background_value: bgValue,
      text_align: textAlign,
      font_color: fontColor,
    };

    if (editId) {
      const { error } = await supabase
        .from('anon_diary_diaries')
        .update(payload)
        .eq('id', editId)
        .eq('author_id', user.id);

      if (error) {
        console.error('[WritePage] update error:', error);
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('anon_diary_diaries')
        .insert({ author_id: user.id, ...payload, font_size: 14, is_hidden: false });

      if (error) {
        console.error('[WritePage] insert error:', error);
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    navigate('/', { replace: true });
  }

  const alignClass =
    textAlign === 'center' ? 'text-center' :
    textAlign === 'right'  ? 'text-right' :
    'text-left';

  const inputBase = [
    'w-full bg-transparent border-none outline-none resize-none',
    'placeholder:opacity-40',
    alignClass,
  ].join(' ');

  return (
    <div className="h-full overflow-y-auto" data-testid="write-page">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">

        {/* Immersive editor card */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-xl"
          style={{
            backgroundImage: `url(${bgValue})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '520px',
          }}
        >
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 flex flex-col h-full p-5 gap-3">

            {/* Toolbar: align + color */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-black/30 rounded-xl p-1 backdrop-blur-sm">
                {ALIGN_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTextAlign(opt.value)}
                    data-testid={`button-align-${opt.value}`}
                    className={`w-9 h-8 rounded-lg text-xs font-bold transition-all ${
                      textAlign === opt.value
                        ? 'bg-white text-black shadow'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 bg-black/30 rounded-xl px-3 py-2 backdrop-blur-sm">
                {FONT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setFontColor(c.value)}
                    data-testid={`button-font-color-${c.value.replace('#', '')}`}
                    title={c.label}
                    className={`w-6 h-6 rounded-full transition-all ${c.bg} ${
                      fontColor === c.value ? 'ring-2 ring-primary ring-offset-1 ring-offset-black/30 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Title input */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter a title"
              data-testid="input-diary-title"
              className={`${inputBase} font-bold text-[16pt] leading-snug`}
              style={{ color: fontColor }}
            />

            <div className="h-px bg-white/20" />

            {/* Content textarea */}
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Write your diary..."
              rows={12}
              data-testid="textarea-diary-content"
              className={`${inputBase} text-[14pt] leading-relaxed flex-1`}
              style={{ color: fontColor }}
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-auto pt-2">
              <button
                onClick={() => setShowBgModal(true)}
                data-testid="button-select-bg"
                className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-black/50 transition-colors"
              >
                <span>🖼</span>
                <span>Choose Background</span>
              </button>
              <span className={`text-xs font-medium ${content.length >= 500 ? 'text-red-400' : 'text-white/60'}`}>
                {content.length} / 500
              </span>
            </div>
          </div>
        </div>

        {/* Inline error message */}
        {saveError && (
          <div
            className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3"
            data-testid="write-error"
          >
            <span className="font-semibold">Upload failed:</span> {saveError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            data-testid="button-cancel-write"
            className="flex-1 py-3 border border-border rounded-2xl font-semibold text-muted-foreground hover:border-foreground/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            data-testid="button-save-diary"
            className="flex-1 py-3 bg-primary text-white rounded-2xl font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {saving ? 'Saving...' : 'Upload'}
          </button>
        </div>
      </div>

      {showBgModal && (
        <BgModal
          currentValue={bgValue}
          onSelect={setBgValue}
          onClose={() => setShowBgModal(false)}
        />
      )}

      {showLoginModal && (
        <LoginModal onClose={() => { setShowLoginModal(false); navigate('/login'); }} />
      )}
    </div>
  );
}
