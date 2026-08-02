"use client";

import { PresenceMember } from "@/lib/hooks/use-song-collaboration";

type PresenceAvatarsProps = {
  members: PresenceMember[];
  selfId?: string;
  max?: number;
};

type AvatarVariant = {
  background: string;
  color: string;
};

const AVATAR_VARIANTS: AvatarVariant[] = [
  {
    background: "color-mix(in srgb, var(--color-accent-secondary) 18%, var(--color-surface-card))",
    color: "var(--color-accent-secondary)",
  },
  {
    background: "color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-card))",
    color: "var(--color-accent)",
  },
  {
    background: "color-mix(in srgb, var(--color-accent) 9%, var(--color-surface-card))",
    color: "color-mix(in srgb, var(--color-accent) 55%, var(--color-accent-secondary))",
  },
  {
    background: "color-mix(in srgb, var(--color-accent-secondary) 9%, var(--color-surface-card))",
    color: "color-mix(in srgb, var(--color-accent-secondary) 55%, var(--color-accent))",
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  }
  return (parts[0] ?? name).slice(0, 2).toUpperCase();
}

export default function PresenceAvatars({ members, selfId, max = 3 }: PresenceAvatarsProps) {
  if (members.length === 0) return null;

  const visibleMembers = members.slice(0, max);
  const extraCount = members.length - visibleMembers.length;
  const tooltipLabel = members
    .map((member) => (member.id === selfId ? `${member.name} (you)` : member.name))
    .join(", ");

  return (
    <div
      className="flex items-center -space-x-1.5"
      role="group"
      title={tooltipLabel}
      aria-label={`Currently viewing: ${tooltipLabel}`}
    >
      {visibleMembers.map((member) => {
        const variant = AVATAR_VARIANTS[hashString(member.id) % AVATAR_VARIANTS.length];
        return (
          <span
            key={member.id}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold overflow-hidden"
            style={{
              backgroundColor: variant.background,
              color: variant.color,
              borderColor: "var(--color-surface-card)",
            }}
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(member.name)
            )}
          </span>
        );
      })}
      {extraCount > 0 && (
        <span
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            color: "var(--color-text-secondary)",
            borderColor: "var(--color-surface-card)",
          }}
        >
          +{extraCount}
        </span>
      )}
    </div>
  );
}
