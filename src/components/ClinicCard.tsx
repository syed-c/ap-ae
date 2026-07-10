'use client';

import Link from 'next/link';
import { MapPin, Clock, Star, ShieldCheck, ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ClinicCardProps {
  slug?: string;
  name?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  coverImageUrl?: string | null;
  tags?: string[];
  price?: string;
  hours?: string;
  open?: string;
  showCtas?: boolean;
  clinic?: any;
}

export function ClinicCard({
  slug: slugProp, name: nameProp, location: locProp,
  rating: ratingProp, reviewCount: rcProp, coverImageUrl: imgProp,
  tags: tagsProp = [], price: priceProp, hours: hoursProp, open: openProp,
  showCtas = true, clinic,
}: ClinicCardProps) {
  const slug = slugProp || clinic?.slug || '';
  const name = nameProp || clinic?.name || '';
  const location = locProp || (clinic?.location || clinic?.cityName ? `${clinic.cityName || ''}${clinic.stateName ? ', ' + clinic.stateName : ''}` : '');
  const rating = ratingProp ?? clinic?.rating ?? 0;
  const reviewCount = rcProp ?? clinic?.reviews ?? 0;
  const coverImageUrl = imgProp !== undefined ? imgProp : (clinic?.coverImageUrl || clinic?.image || null);
  const tags = tagsProp.length ? tagsProp : (clinic?.tags || []);
  const price = priceProp || clinic?.price || '';
  const hours = hoursProp || clinic?.hours?.split('·')[1]?.trim() || '';
  const open = openProp || clinic?.open || '';
  const [imgError, setImgError] = useState(false);
  const hasValidImage = coverImageUrl && !imgError;

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-all duration-300',
      'hover:-translate-y-0.5 hover:shadow-md hover:border-amber-500/40',
    )}>
      {/* Image */}
      <div className="relative h-36 bg-zinc-100 overflow-hidden">
        {hasValidImage ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex flex-col items-center justify-center text-zinc-400">
            <ImageOff className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">{name.slice(0, 30)}</span>
          </div>
        )}
        {/* Rating pill */}
        {rating && rating > 0 && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-zinc-900 shadow-sm">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            {rating.toFixed(1)}
            {reviewCount && reviewCount > 0 && (
              <span className="text-zinc-400 font-normal">({reviewCount})</span>
            )}
          </div>
        )}
        {/* Verified pill */}
        {rating && rating >= 4.5 && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 bg-emerald-50/95 backdrop-blur-sm rounded-full text-[11px] font-semibold text-emerald-700 border border-emerald-200/50">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[15px] font-semibold text-zinc-900 leading-tight line-clamp-1" title={name}>
          {name}
        </h3>
        {location && (
          <p className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        {/* Tag chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[11px] font-medium rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider + bottom row */}
        {(price || hours || open) && (
          <>
            <div className="h-px bg-zinc-100 my-3" />
            <div className="flex items-center justify-between text-xs">
              {open && (
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Clock className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">{open}</span>
                  {hours && <span className="text-zinc-400">&middot; {hours}</span>}
                </div>
              )}
              {price && (
                <div className="text-xs">
                  from <span className="text-amber-700 font-semibold">AED {price}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* CTA buttons */}
        {showCtas && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link
              href={`/clinic/${slug}`}
              className="flex items-center justify-center px-3 py-2 text-xs font-semibold border border-zinc-300 text-zinc-700 rounded-full hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all duration-200"
            >
              View profile
            </Link>
            <Link
              href={`/clinic/${slug}`}
              className="flex items-center justify-center px-3 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all duration-200"
            >
              Book now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
