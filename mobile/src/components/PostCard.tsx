import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark, Eye } from 'lucide-react-native';
import { Post } from '../types';
import { colors } from '../theme/colors';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onVote?: (type: 'UP' | 'DOWN') => void;
  onBookmark?: () => void;
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
};

export const PostCard: React.FC<PostCardProps> = ({ post, onPress, onVote, onBookmark }) => {
  const navigation = useNavigation<any>();
  const p = post as any;
  const authorName = p.author?.displayName || p.author?.display_name || p.author?.username || 'Người dùng';
  const authorUsername = p.author?.username;
  const authorAvatar = p.author?.avatarUrl || p.author?.avatar_preview_url || p.author?.avatar_standard_url;
  const authorRole = p.author?.role;
  const authorInitials = authorName.substring(0, 2).toUpperCase();

  const createdAt = p.createdAt || p.created_at || '';
  const isPinned = p.pinned || p.is_pinned;
  const snippet = (p.excerpt || p.content || '').replace(/[#*`_\[\]]/g, '');
  const voteScore = p.voteScore ?? (p.upvote_count !== undefined ? (p.upvote_count - (p.downvote_count || 0)) : 0);
  const commentCount = p.commentCount ?? p.comment_count ?? 0;
  const viewCount = p.viewCount ?? p.view_count ?? 0;
  const userVote = p.userVote || p.user_vote;
  const isBookmarked = p.isBookmarked || p.is_bookmarked;

  // Media preview
  const mediaUrl = p.media?.[0]?.preview_url || p.media?.[0]?.standard_url || p.image_url;

  const tags = Array.isArray(p.tags)
    ? p.tags.map((t: any) => (t.tag ? t.tag : t))
    : [];

  const handleAuthorPress = (e: any) => {
    e.stopPropagation();
    if (authorUsername) {
      navigation.navigate('UserProfile', { username: authorUsername });
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      {/* Header: Author & Date */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorRow} onPress={handleAuthorPress}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{authorInitials}</Text>
            </View>
          )}
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{authorName}</Text>
              {authorRole === 'ADMIN' && (
                <View style={styles.roleBadgeAdmin}>
                  <Text style={styles.roleBadgeText}>ADMIN</Text>
                </View>
              )}
              {authorRole === 'MODERATOR' && (
                <View style={styles.roleBadgeMod}>
                  <Text style={styles.roleBadgeText}>MOD</Text>
                </View>
              )}
              {authorRole === 'BOT' && (
                <View style={styles.roleBadgeBot}>
                  <Text style={styles.roleBadgeText}>AI BOT</Text>
                </View>
              )}
            </View>
            <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {p.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{p.category.name}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {isPinned && <Text style={{ color: colors.warning }}>📌 </Text>}
        {p.title}
      </Text>

      {/* Media Image Thumbnail (if any) */}
      {mediaUrl && (
        <Image source={{ uri: mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
      )}

      {/* Snippet */}
      {snippet.length > 0 && (
        <Text style={styles.snippet} numberOfLines={3}>
          {snippet}
        </Text>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.slice(0, 3).map((tag: any, idx: number) => (
            <View key={tag.id || idx} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer Stats & Actions */}
      <View style={styles.footer}>
        {/* Vote Group */}
        <View style={styles.voteGroup}>
          <TouchableOpacity
            style={[
              styles.voteBtn,
              userVote === 'UP' && { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onVote?.('UP');
            }}
          >
            <ThumbsUp
              size={14}
              color={userVote === 'UP' ? colors.upvote : colors.textSecondary}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.voteScore,
              userVote === 'UP' && { color: colors.upvote },
              userVote === 'DOWN' && { color: colors.downvote },
            ]}
          >
            {voteScore}
          </Text>
          <TouchableOpacity
            style={[
              styles.voteBtn,
              userVote === 'DOWN' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onVote?.('DOWN');
            }}
          >
            <ThumbsDown
              size={14}
              color={userVote === 'DOWN' ? colors.downvote : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Comment Count */}
        <View style={styles.statItem}>
          <MessageSquare size={15} color={colors.textSecondary} />
          <Text style={styles.statText}>{commentCount}</Text>
        </View>

        {/* Views */}
        <View style={styles.statItem}>
          <Eye size={15} color={colors.textSecondary} />
          <Text style={styles.statText}>{viewCount}</Text>
        </View>

        {/* Bookmark Button */}
        {onBookmark && (
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
          >
            <Bookmark
              size={16}
              color={isBookmarked ? colors.primary : colors.textMuted}
              fill={isBookmarked ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.badgeText,
    fontWeight: '700',
    fontSize: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  roleBadgeAdmin: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeMod: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeBot: {
    backgroundColor: '#065F46',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  categoryText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 6,
  },
  mediaImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  snippet: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 16,
  },
  voteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  voteBtn: {
    padding: 5,
    borderRadius: 6,
  },
  voteScore: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
});
