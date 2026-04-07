import { Crown, Gavel, UserCheck, BotIcon } from 'lucide-react';

export const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: Crown,
  },
  mod: {
    label: "Mod",
    icon: Gavel,
  },
  bot: {
    label: "Bot",
    icon: BotIcon,
  },
  user: {
    label: "User",
    icon: UserCheck,
  },
} as const;

export const AUTHOR_ROLE_MAP = {
  ADMIN: "admin",
  MODERATOR: "mod",
  BOT: "bot",
  MEMBER: "user",
} as const;
