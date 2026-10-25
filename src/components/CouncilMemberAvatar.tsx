import { useEffect, useState } from 'react';
import type { CouncilMember } from '../types/index.ts';
import { DEFAULT_COUNCIL_MEMBERS } from '../data/councilMembers.ts';

interface CouncilMemberAvatarProps {
  member: Pick<CouncilMember, 'id' | 'name' | 'imageUrl'>;
  className: string;
}

const getFallbackImage = (memberId: string): string | undefined =>
  DEFAULT_COUNCIL_MEMBERS.find((member) => member.id === memberId)?.imageUrl;

const isLocalDevelopmentUrl = (imageUrl: string): boolean => {
  try {
    const url = new URL(imageUrl, window.location.origin);
    return /\/src\/assets\//i.test(url.pathname)
      || /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/i.test(url.hostname);
  } catch {
    return true;
  }
};

const getInitials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export function CouncilMemberAvatar({ member, className }: CouncilMemberAvatarProps) {
  const fallbackImage = getFallbackImage(member.id);
  const preferredImage = member.imageUrl && !isLocalDevelopmentUrl(member.imageUrl)
    ? member.imageUrl
    : fallbackImage;
  const [imageSrc, setImageSrc] = useState(preferredImage);

  useEffect(() => {
    setImageSrc(preferredImage);
  }, [preferredImage]);

  return (
    <div className={`${className} flex items-center justify-center`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={member.name}
          className="h-full w-full object-cover"
          onError={() => {
            setImageSrc((currentImage) => (
              fallbackImage && currentImage !== fallbackImage ? fallbackImage : undefined
            ));
          }}
        />
      ) : (
        <span aria-label={member.name} className="font-bold text-amber-400">
          {getInitials(member.name)}
        </span>
      )}
    </div>
  );
}
