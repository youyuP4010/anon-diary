import type { TextAlign } from '@/lib/types';

interface CardContentProps {
  title: string;
  content: string;
  backgroundType: 'color' | 'image';
  backgroundValue: string;
  fontSize?: number;
  fontColor?: string;
  textAlign?: TextAlign;
}

export default function CardContent({
  title,
  content,
  backgroundType,
  backgroundValue,
  fontSize = 14,
  fontColor = '#000000',
  textAlign = 'left',
}: CardContentProps) {
  const bgStyle: React.CSSProperties =
    backgroundType === 'color'
      ? { backgroundColor: backgroundValue || '#ffffff' }
      : backgroundType === 'image' && backgroundValue
      ? { backgroundImage: `url(${backgroundValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: '#ffffff' };

  const alignClass =
    textAlign === 'center' ? 'text-center' :
    textAlign === 'right'  ? 'text-right' :
    'text-left';

  return (
    <div
      className={`flex-1 overflow-y-auto overscroll-contain p-6 ${alignClass}`}
      style={{ ...bgStyle, WebkitOverflowScrolling: 'touch' }}
    >
      <h2
        className="font-bold mb-4 leading-snug"
        style={{ fontSize: '16pt', color: fontColor }}
        data-testid="text-diary-title"
      >
        {title}
      </h2>
      <p
        className="leading-relaxed whitespace-pre-wrap"
        style={{ fontSize: `${fontSize}pt`, color: fontColor }}
        data-testid="text-diary-content"
      >
        {content}
      </p>
    </div>
  );
}
