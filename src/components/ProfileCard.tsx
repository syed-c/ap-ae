'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CalendarCheck,
  ChevronRight,
  Languages,
  MapPin,
  Pin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MultiStepBookingModal } from './MultiStepBookingModal';
import { Profile } from '@/hooks/useProfiles';
import { proxyImageUrl } from '@/lib/proxyImageUrl';

interface ProfileCardProps {
  profile: Profile;
  variant?: 'list' | 'compact' | 'elite';
}

function getLetterAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=0D9488&color=fff&size=200&font-size=0.42&bold=true`;
}

function formatReviewCount(reviewCount: number | undefined): string {
  if (!reviewCount) {
    return 'New listing';
  }

  return `${reviewCount} review${reviewCount === 1 ? '' : 's'}`;
}

function ProfileMeta({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <Icon className="h-4 w-4 text-primary/70" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ProfileCard({ profile, variant = 'list' }: ProfileCardProps) {
  const [bookingOpen, setBookingOpen] = useState(false);

  const profileLink = profile.type === 'clinic' ? `/clinic/${profile.slug}` : `/dentist/${profile.slug}`;
  const proxiedImage = proxyImageUrl(profile.image);
  const displayImage = proxiedImage || getLetterAvatar(profile.name);
  const profileLocation = profile.location || 'UAE';
  const languageList = profile.languages?.slice(0, 3).join(', ');
  const specialty = profile.specialty || (profile.type === 'clinic' ? 'Dental Clinic' : 'Dental Professional');

  if (variant === 'list') {
    return (
      <>
        <article className="doctor-list-card group">
          <div className="relative shrink-0">
            <img
              src={displayImage}
              alt={profile.name}
              className="h-24 w-24 rounded-[1.5rem] border border-border/60 object-cover shadow-md md:h-28 md:w-28"
              loading="lazy"
            />
            {profile.isVerified && (
              <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-card text-primary shadow-md">
                <ShieldCheck className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {profile.isPinned && (
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/8 text-primary">
                  <Pin className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
              )}
              <span className="badge-primary">{specialty}</span>
              <span className="badge-primary">
                <Star className="h-3.5 w-3.5 fill-current" />
                {profile.rating > 0 ? profile.rating.toFixed(1) : 'Unrated'}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black text-foreground md:text-2xl">{profile.name}</h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {profile.clinicName && profile.type === 'dentist' && (
                    <ProfileMeta icon={Building2}>{profile.clinicName}</ProfileMeta>
                  )}
                  <ProfileMeta icon={MapPin}>{profileLocation}</ProfileMeta>
                  {languageList && <ProfileMeta icon={Languages}>{languageList}</ProfileMeta>}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 xl:min-w-[170px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Marketplace Signal
                </p>
                <p className="mt-2 text-base font-bold text-foreground">
                  {formatReviewCount(profile.reviewCount)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  {profile.type} listing
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={profileLink}>
                  View Profile
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button onClick={() => setBookingOpen(true)}>
                <CalendarCheck className="h-4 w-4" />
                Book Appointment
              </Button>
            </div>
          </div>
        </article>

        <MultiStepBookingModal
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          profileId={profile.id}
          profileName={profile.name}
          profileType={profile.type}
          clinicId={profile.clinicId}
        />
      </>
    );
  }

  if (variant === 'elite') {
    return (
      <>
        <article className="group flex min-w-[288px] max-w-[288px] flex-col overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <img
              src={displayImage}
              alt={profile.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <span className="badge-primary">
                <Star className="h-3.5 w-3.5 fill-current" />
                {profile.rating > 0 ? profile.rating.toFixed(1) : 'New'}
              </span>
              {profile.isVerified && <span className="badge-primary">Verified</span>}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-4 text-white">
              <span className="badge-primary bg-white/12 text-white border-white/10">{specialty}</span>
              <h3 className="mt-3 text-lg font-black">{profile.name}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-white/74">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{profileLocation}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            <div className="flex flex-wrap gap-2">
              {profile.isPinned && (
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/8 text-primary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Premium
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full text-muted-foreground">
                {formatReviewCount(profile.reviewCount)}
              </Badge>
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href={profileLink}>Profile</Link>
              </Button>
              <Button className="flex-1" onClick={() => setBookingOpen(true)}>
                Book
              </Button>
            </div>
          </div>
        </article>

        <MultiStepBookingModal
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          profileId={profile.id}
          profileName={profile.name}
          profileType={profile.type}
          clinicId={profile.clinicId}
        />
      </>
    );
  }

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
        <div className="relative aspect-[5/4] overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={profile.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <span className="badge-primary">
              <Star className="h-3.5 w-3.5 fill-current" />
              {profile.rating > 0 ? profile.rating.toFixed(1) : 'New'}
            </span>
            {profile.isVerified && <span className="badge-primary">Verified</span>}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-primary">{specialty}</span>
            {profile.isPinned && (
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/8 text-primary">
                Featured
              </Badge>
            )}
          </div>

          <h3 className="mt-4 line-clamp-2 text-xl font-black text-foreground">{profile.name}</h3>

          <div className="mt-3 space-y-2">
            <ProfileMeta icon={MapPin}>{profileLocation}</ProfileMeta>
            {profile.clinicName && profile.type === 'dentist' && (
              <ProfileMeta icon={Building2}>{profile.clinicName}</ProfileMeta>
            )}
            {languageList && <ProfileMeta icon={Languages}>{languageList}</ProfileMeta>}
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{formatReviewCount(profile.reviewCount)}</span>
            <span className="mx-2 text-border">•</span>
            <span className="capitalize">{profile.type}</span>
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={profileLink}>View</Link>
            </Button>
            <Button className="flex-1" onClick={() => setBookingOpen(true)}>
              Book
            </Button>
          </div>
        </div>
      </article>

      <MultiStepBookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        profileId={profile.id}
        profileName={profile.name}
        profileType={profile.type}
        clinicId={profile.clinicId}
      />
    </>
  );
}
