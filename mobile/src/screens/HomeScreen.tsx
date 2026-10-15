import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Settings, Plus, Sparkles, Flame, Clock, Bell } from 'lucide-react-native';
import { Post, Category } from '../types';
import { colors } from '../theme/colors';
import { postService, categoryService, voteService, bookmarkService } from '../api/services';
import { PostCard } from '../components/PostCard';
import { ApiConfigModal } from '../components/ApiConfigModal';
import { useAuth } from '../context/AuthContext';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated, apiUrl } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'top' | 'hot'>('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.log('Error fetching categories:', err);
    }
  };

  // Fetch Posts
  const fetchPosts = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        if (!isRefresh) setLoading(true);
      }
      const selectedCat = categories.find((c) => c.id === selectedCategory);
      const res = await postService.getPosts({
        page: pageNum,
        limit: 10,
        categorySlug: selectedCat?.slug,
        sortBy,
      });

      if (res.success && res.data) {
        if (pageNum === 1) {
          setPosts(res.data);
        } else {
          setPosts((prev) => [...prev, ...res.data]);
        }
        setHasMore(res.pagination?.hasNextPage ?? false);
        setPage(pageNum);
      }
    } catch (err) {
      console.log('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [apiUrl]);

  useEffect(() => {
    fetchPosts(1);
  }, [selectedCategory, sortBy, apiUrl]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(1, true);
    fetchCategories();
  }, [selectedCategory, sortBy]);

  const onEndReached = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1);
    }
  };

  const handleVote = async (post: Post, type: 'UP' | 'DOWN') => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
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

      setPosts((prev) =>
        prev.map((item: any) =>
          item.id === post.id
            ? { ...item, userVote: newVote, user_vote: newVote, voteScore: currentScore + diff }
            : item
        )
      );

      if (newVote === null) {
        await voteService.removePostVote(post.id);
      } else {
        await voteService.votePost(post.id, type);
      }
    } catch (err) {
      console.log('Vote error:', err);
      fetchPosts(page, true);
    }
  };

  const handleBookmark = async (post: Post) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    try {
      const p = post as any;
      const currentBookmarked = p.isBookmarked || p.is_bookmarked;
      setPosts((prev) =>
        prev.map((item: any) =>
          item.id === post.id
            ? { ...item, isBookmarked: !currentBookmarked, is_bookmarked: !currentBookmarked }
            : item
        )
      );
      await bookmarkService.toggleBookmark(post.id);
    } catch (err) {
      console.log('Bookmark error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Sparkles size={16} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Mini Forum</Text>
        </View>

        <View style={styles.topBarActions}>
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowConfigModal(true)}
          >
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Filter Tabs */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[styles.sortTab, sortBy === 'latest' && styles.sortTabActive]}
          onPress={() => setSortBy('latest')}
        >
          <Clock size={13} color={sortBy === 'latest' ? colors.primary : colors.textMuted} />
          <Text
            style={[styles.sortTabText, sortBy === 'latest' && styles.sortTabTextActive]}
          >
            Mới nhất
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortTab, sortBy === 'hot' && styles.sortTabActive]}
          onPress={() => setSortBy('hot')}
        >
          <Flame size={13} color={sortBy === 'hot' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sortTabText, sortBy === 'hot' && styles.sortTabTextActive]}>
            Sôi nổi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortTab, sortBy === 'top' && styles.sortTabActive]}
          onPress={() => setSortBy('top')}
        >
          <Sparkles size={13} color={sortBy === 'top' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sortTabText, sortBy === 'top' && styles.sortTabTextActive]}>
            Top vote
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Pills */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'Tất cả' }, ...categories]}
          keyExtractor={(item) => (item.id !== null ? String(item.id) : 'all')}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(item.id as number | null)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Posts Feed */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải bài viết...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.postList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
              <Text style={styles.emptySubtitle}>
                Hãy kiểm tra kết nối Backend API hoặc tạo bài viết đầu tiên!
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setShowConfigModal(true)}
              >
                <Text style={styles.retryBtnText}>Kiểm tra cấu hình IP API</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { id: item.id })}
              onVote={(type) => handleVote(item, type)}
              onBookmark={() => handleBookmark(item)}
            />
          )}
        />
      )}

      {/* Floating Action Button (Create Post) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            navigation.navigate('Login');
          } else {
            navigation.navigate('CreatePost');
          }
        }}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* API Config Modal */}
      <ApiConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  sortTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  sortTabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  sortTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  sortTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  postList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 10,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
