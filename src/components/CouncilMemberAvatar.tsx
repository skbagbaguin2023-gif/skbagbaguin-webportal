import { useEffect, useState } from 'react';
import type { CouncilMember } from '../types/index.ts';
import { DEFAULT_COUNCIL_MEMBERS } from '../data/councilMembers.ts';
import { isLocalDevelopmentImageUrl } from '../utils/image.ts';

interface CouncilMemberAvatarProps {
  member: Pick<CouncilMember, 'id' | 'name' | 'imageUrl'>;
  className: string;
}

export function CouncilMemberAvatar({ member, className }: CouncilMemberAvatarProps) {
  const fallbackImage = DEFAULT_COUNCIL_MEMBERS.find((item) => item.id === member.id)?.imageUrl;
  const preferredImage = member.imageUrl && !isLocalDevelopmentImageUrl(member.imageUrl)
    ? member.imageUrl
    : fallbackImage;
  const [imageSrc, setImageSrc] = useState(preferredImage);

  useEffect(() => {
    setImageSrc(preferredImage);
  }, [preferredImage]);

  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`${className} flex items-center justify-center`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={member.name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => {
            setImageSrc((currentImage) => (
              fallbackImage && currentImage !== fallbackImage ? fallbackImage : undefined
            ));
          }}
        />
      ) : (
        <span aria-label={member.name} className="font-bold text-amber-400">
          {initials}
        </span>
      )}
    </div>
  );
}
