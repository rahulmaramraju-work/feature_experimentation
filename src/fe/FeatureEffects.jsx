import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Megaphone, X } from 'lucide-react';
import { useState } from 'react';
import { useFeature } from './useFeature';

// brand_theme: recolours the entire product from a Wingify variable.
export function BrandTheme() {
  const theme = useFeature('brand_theme');
  const color = theme.get('primary_color');
  useEffect(() => {
    const valid = /^#[0-9a-f]{6}$/i.test(color) ? color : '#4f46e5';
    document.documentElement.style.setProperty('--brand', valid);
  }, [color]);
  return null;
}

const TONES = {
  info: 'bg-slate-900 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-400 text-amber-950',
  critical: 'bg-rose-600 text-white',
};

// announcement_banner: a remotely controlled banner that doubles as a kill-switch demo.
export function AnnouncementBanner() {
  const banner = useFeature('announcement_banner');
  const [dismissed, setDismissed] = useState(null);
  const message = banner.get('message');
  if (!banner.enabled || dismissed === message) return null;
  const tone = banner.get('tone');
  return (
    <div className={clsx('flex items-center justify-center gap-3 px-4 py-2 text-sm animate-fade-up', TONES[tone] || TONES.info)}>
      <Megaphone className="size-4 shrink-0" />
      <span className="font-medium">{message}</span>
      {banner.get('cta_text') && (
        <Link to={banner.get('cta_link')} className="underline underline-offset-2 opacity-90 hover:opacity-100">
          {banner.get('cta_text')} →
        </Link>
      )}
      <button onClick={() => setDismissed(message)} className="ml-2 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  );
}
