import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Send,
  MessageSquare,
  Eye,
  MoreVertical,
  Edit2,
  Trash2,
  ShieldAlert,
} from 'lucide-react-native';
import { Post, Comment } from '../types';
import { colors } from '../theme/colors';
import { postService, commentService, voteService, bookmarkService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';

export const PostDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: number; type: 'POST' | 'COMMENT' }>({
    id: 0,
    type: 'POST',
  });

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);
      const [postRes, commentRes] = await Promise.all([
        postService.getPostById(Number(id)),
        commentService.getPostComments(Number(id)),
      ]);

      if (postRes.success && postRes.data) {
        setPost(postRes.data);
      }
      if (commentRes.success && commentRes.data) {
        setComments(commentRes.data);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tải bài viết');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (!post) return;

    try {
      const p = post as any;
      const oldVote = p.userVote || p.user_vote;
      const newVote = oldVote === type ? null : type;
      let diff = 0;
      if (oldVote === 'UP') diff -= 1;
      if (oldVote === 'DOWN') diff += 1;
      if (newVote === 'UP') diff += 1;
      if (newVote === 'DOWN') diff -= 1;

      const currentScore =
        p.voteScore ??
        (p.upvote_count !== undefined ? p.upvote_count - (p.downvote_count || 0) : 0);

      setPost({
        ...post,
        userVote: newVote,
        voteScore: currentScore + diff,
      });

      if (newVote === null) {
        await voteService.removePostVote(post.id);
      } else {
        await voteService.votePost(post.id, type);
      }
    } catch (err) {
      console.log('Vote error:', err);
    }
  };

  const handleVoteComment = async (comment: any, type: 'UP' | 'DOWN') => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    try {
      const oldVote = comment.userVote || comment.user_vote;
      const newVote = oldVote === type ? null : type;
      let diff = 0;
      if (oldVote === 'UP') diff -= 1;
      if (oldVote === 'DOWN') diff += 1;
      if (newVote === 'UP') diff += 1;
      if (newVote === 'DOWN') diff += 1;

      const currentScore =
        comment.voteScore ??
        (comment.upvote_count !== undefined
          ? comment.upvote_count - (comment.downvote_count || 0)
          : 0);

      setComments((prev) =>
        prev.map((c: any) =>
          c.id === comment.id
            ? { ...c, userVote: newVote, user_vote: newVote, voteScore: currentScore + diff }
            : c
        )
      );

      if (newVote === null) {
        await voteService.removeCommentVote(comment.id);
      } else {
        await voteService.voteComment(comment.id, type);
      }
    } catch (err) {
      console.log('Comment vote error:', err);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (!post) return;

    try {
      const p = post as any;
      const currentBookmarked = p.isBookmarked || p.is_bookmarked;
      setPost({ ...post, isBookmarked: !currentBookmarked });
      await bookmarkService.toggleBookmark(post.id);
    } catch (err) {
      console.log('Bookmark error:', err);
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (!commentText.trim() || !post) return;

    try {
      setSubmittingComment(true);
      const res = await commentService.createComment(post.id, commentText.trim(), replyToId || undefined);
      if (res.success && res.data) {
        setCommentText('');
        setReplyToId(null);
        // Refresh comments list
        const refreshed = await commentService.getPostComments(post.id);
        if (refreshed.success && refreshed.data) {
          setComments(refreshed.data);
        }
        setPost((prev) => (prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : null));
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = () => {
    if (!post) return;
    Alert.alert('Xoá bài viết', 'Bạn có chắc chắn muốn xoá bài viết này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          try {
            await postService.deletePost(post.id);
            Alert.alert('Thành công', 'Đã xoá bài viết!');
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xoá bài viết');
          }
        },
      },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('Xoá bình luận', 'Bạn có chắc chắn muốn xoá bình luận này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await commentService.deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setPost((prev) => (prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : null));
          } catch (err: any) {
            Alert.alert('Lỗi', 'Không thể xoá bình luận');
          }
        },
      },
    ]);
  };

  const showPostOptions = () => {
    if (!post) return;
    const p = post as any;
    const isAuthor = user && (user.id === p.author_id || user.username === p.author?.username);

    if (isAuthor) {
      Alert.alert('Tuỳ chọn bài viết', undefined, [
        {
          text: 'Chỉnh sửa bài viết',
          onPress: () => navigation.navigate('EditPost', { id: post.id }),
        },
        {
          text: 'Xoá bài viết',
          style: 'destructive',
          onPress: handleDeletePost,
        },
        { text: 'Đóng', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Tuỳ chọn', undefined, [
        {
          text: 'Báo cáo bài viết này',
          onPress: () => {
            setReportTarget({ id: post.id, type: 'POST' });
            setReportModalVisible(true);
          },
        },
        { text: 'Đóng', style: 'cancel' },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!post) return null;

  const p = post as any;
  const authorName = p.author?.displayName || p.author?.display_name || p.author?.username || 'Người dùng';
  const authorUsername = p.author?.username;
  const authorAvatar = p.author?.avatarUrl || p.author?.avatar_preview_url || p.author?.avatar_standard_url;
  const authorInitials = authorName.substring(0, 2).toUpperCase();
  const createdAt = p.createdAt || p.created_at || '';
  const voteScore = p.voteScore ?? (p.upvote_count !== undefined ? p.upvote_count - (p.downvote_count || 0) : 0);
  const viewCount = p.viewCount ?? p.view_count ?? 0;
  const isBookmarked = p.isBookmarked || p.is_bookmarked;
  const userVote = p.userVote || p.user_vote;
  const content = p.content || (Array.isArray(p.blocks) ? p.blocks.map((b: any) => b.content).join('\n\n') : '') || p.excerpt || '';

  const mediaList = Array.isArray(p.media) ? p.media : [];

  const tags = Array.isArray(p.tags)
    ? p.tags.map((t: any) => (t.tag ? t.tag : t))
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {p.category?.name || 'Chi tiết bài viết'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBookmark}>
              <Bookmark
                size={20}
                color={isBookmarked ? colors.primary : colors.textSecondary}
                fill={isBookmarked ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={showPostOptions}>
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Author Info */}
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => {
              if (authorUsername) {
                navigation.navigate('UserProfile', { username: authorUsername });
              }
            }}
          >
            {authorAvatar ? (
              <Image source={{ uri: authorAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{authorInitials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.authorName}>{authorName}</Text>
              <Text style={styles.dateText}>
                {createdAt ? new Date(createdAt).toLocaleString('vi-VN') : ''}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{p.title}</Text>

          {/* Category & Tags */}
          <View style={styles.metaRow}>
            {p.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{p.category.name}</Text>
              </View>
            )}
            {tags.map((tag: any, idx: number) => (
              <View key={tag.id || idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag.name}</Text>
              </View>
            ))}
          </View>

          {/* Media Images List */}
          {mediaList.length > 0 && (
            <View style={styles.mediaContainer}>
              {mediaList.map((m: any, idx: number) => (
                <Image
                  key={m.id || idx}
                  source={{ uri: m.standard_url || m.preview_url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Content Body */}
          <View style={styles.contentBox}>
            <Text style={styles.bodyText}>{content}</Text>
          </View>

          {/* Post Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.voteGroup}>
              <TouchableOpacity
                style={[
                  styles.voteBtn,
                  userVote === 'UP' && { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                ]}
                onPress={() => handleVote('UP')}
              >
                <ThumbsUp
                  size={16}
                  color={userVote === 'UP' ? colors.upvote : colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={styles.voteScore}>{voteScore}</Text>
              <TouchableOpacity
                style={[
                  styles.voteBtn,
                  userVote === 'DOWN' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                ]}
                onPress={() => handleVote('DOWN')}
              >
                <ThumbsDown
                  size={16}
                  color={userVote === 'DOWN' ? colors.downvote : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.statRow}>
              <Eye size={16} color={colors.textMuted} />
              <Text style={styles.statText}>{viewCount} lượt xem</Text>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <MessageSquare size={18} color={colors.primary} />
              <Text style={styles.commentsTitle}>
                Bình luận ({comments.length})
              </Text>
            </View>

            {comments.length === 0 ? (
              <Text style={styles.noCommentsText}>
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </Text>
            ) : (
              comments.map((comment: any) => {
                const commentAuthorName =
                  comment.author?.displayName ||
                  comment.author?.display_name ||
                  comment.author?.username ||
                  'Người dùng';
                const commentAuthorUsername = comment.author?.username;
                const commentDate = comment.createdAt || comment.created_at || '';
                const isCommentAuthor = user && (user.id === comment.author_id || user.username === commentAuthorUsername);
                const commentScore =
                  comment.voteScore ??
                  (comment.upvote_count !== undefined
                    ? comment.upvote_count - (comment.downvote_count || 0)
                    : 0);
                const commentVote = comment.userVote || comment.user_vote;

                return (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <TouchableOpacity
                        style={styles.commentAuthor}
                        onPress={() => {
                          if (commentAuthorUsername) {
                            navigation.navigate('UserProfile', { username: commentAuthorUsername });
                          }
                        }}
                      >
                        <View style={styles.commentAvatarFallback}>
                          <Text style={styles.commentAvatarText}>
                            {commentAuthorName.substring(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.commentAuthorName}>{commentAuthorName}</Text>
                      </TouchableOpacity>
                      <Text style={styles.commentDate}>
                        {commentDate ? new Date(commentDate).toLocaleDateString('vi-VN') : ''}
                      </Text>
                    </View>

                    <Text style={styles.commentContent}>{comment.content}</Text>

                    {/* Comment Footer: Vote, Reply, Delete */}
                    <View style={styles.commentFooter}>
                      <View style={styles.commentVoteGroup}>
                        <TouchableOpacity
                          style={[
                            styles.commentVoteBtn,
                            commentVote === 'UP' && { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                          ]}
                          onPress={() => handleVoteComment(comment, 'UP')}
                        >
                          <ThumbsUp
                            size={12}
                            color={commentVote === 'UP' ? colors.upvote : colors.textMuted}
                          />
                        </TouchableOpacity>
                        <Text style={styles.commentVoteScore}>{commentScore}</Text>
                        <TouchableOpacity
                          style={[
                            styles.commentVoteBtn,
                            commentVote === 'DOWN' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                          ]}
                          onPress={() => handleVoteComment(comment, 'DOWN')}
                        >
                          <ThumbsDown
                            size={12}
                            color={commentVote === 'DOWN' ? colors.downvote : colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => setReplyToId(comment.id)}
                      >
                        <Text style={styles.replyBtnText}>
                          {replyToId === comment.id ? 'Đang trả lời...' : 'Trả lời'}
                        </Text>
                      </TouchableOpacity>

                      {isCommentAuthor && (
                        <TouchableOpacity
                          style={styles.commentDeleteBtn}
                          onPress={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 size={13} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Bottom Sticky Comment Input */}
        <View style={styles.bottomBar}>
          {replyToId && (
            <View style={styles.replyingBar}>
              <Text style={styles.replyingText}>Đang trả lời bình luận #{replyToId}</Text>
              <TouchableOpacity onPress={() => setReplyToId(null)}>
                <Text style={styles.cancelReplyText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={
                isAuthenticated ? 'Viết bình luận của bạn...' : 'Đăng nhập để bình luận...'
              }
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              editable={!submittingComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !commentText.trim() && { opacity: 0.5 },
              ]}
              disabled={!commentText.trim() || submittingComment}
              onPress={handleSendComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetId={reportTarget.id}
        targetType={reportTarget.type}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollContent: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.badgeText,
    fontWeight: '700',
    fontSize: 15,
  },
  authorName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  categoryText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
  },
  tagBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  mediaContainer: {
    gap: 10,
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  contentBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  voteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  voteBtn: {
    padding: 6,
    borderRadius: 6,
  },
  voteScore: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  commentsSection: {
    marginTop: 10,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  commentsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  noCommentsText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  commentAuthorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  commentDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  commentContent: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  commentVoteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  commentVoteBtn: {
    padding: 3,
    borderRadius: 4,
  },
  commentVoteScore: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'center',
  },
  replyBtn: {
    paddingVertical: 4,
  },
  replyBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  commentDeleteBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
  },
  replyingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  replyingText: {
    color: colors.primary,
    fontSize: 12,
  },
  cancelReplyText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
