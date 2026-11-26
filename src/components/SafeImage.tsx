import { useState } from 'react';
import { BookOpen, User } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  variant?: 'news' | 'staff' | 'hero';
  fallbackLabel?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  variant = 'news',
  fallbackLabel,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    const initials = fallbackLabel
      ? fallbackLabel
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase()
      : '';

    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/80 text-slate-500 select-none ${className}`}
      >
        {variant === 'staff' ? (
          initials ? (
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#0F2544]">
              {initials}
            </span>
          ) : (
            <User className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <BookOpen className="w-8 h-8 text-[#0F2544]/40" strokeWidth={1.5} />
            {fallbackLabel && (
              <span className="text-xs font-medium text-slate-500 line-clamp-2 max-w-[180px]">
                {fallbackLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
