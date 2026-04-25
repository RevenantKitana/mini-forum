import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { getAvatarUrl } from '@/utils/imageHelpers';

export interface AvatarPreviewModalUser {
  display_name?: string | null;
  username: string;
  avatar_preview_url?: string | null;
  avatar_standard_url?: string | null;
}

export interface AvatarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AvatarPreviewModalUser | null | undefined;
}

/**
 * AvatarPreviewModal - Display a user's standard-size avatar in a lightbox modal.
 * Phase 2 UC-02: Click avatar → open modal showing standard (full-size) version.
 */
export function AvatarPreviewModal({ isOpen, onClose, user }: AvatarPreviewModalProps) {
  if (!user) return null;

  const displayName = user.display_name || user.username;
  const standardUrl = getAvatarUrl(user, 'standard');
  const fallbackLetter = displayName[0]?.toUpperCase() ?? '?';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-6 flex flex-col items-center gap-4">
        <DialogHeader>
          <DialogTitle className="text-center">{displayName}</DialogTitle>
        </DialogHeader>

        {standardUrl ? (
          <img
            src={standardUrl}
            alt={displayName}
            className="w-64 h-64 rounded-full object-cover border-4 border-border shadow-lg"
            loading="eager"
          />
        ) : (
          <Avatar className="w-64 h-64 text-6xl">
            <AvatarFallback className="text-6xl">{fallbackLetter}</AvatarFallback>
          </Avatar>
        )}

        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </DialogContent>
    </Dialog>
  );
}
