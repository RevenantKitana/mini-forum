import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Award, Calendar, FileText, MoreVertical, Shield, ShieldAlert } from 'lucide-react-native';
import { Post, User } from '../types';
import { colors } from '../theme/colors';
import { userService, postService } from '../api/services';
import { PostCard } from '../components/PostCard';
import { ReportModal } from '../components/ReportModal';

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { username, userId } = route.params || {};

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (username) {
          const userRes = await userService.getUserByUsername(username);
          if (userRes.success && userRes.data) {
            const u = userRes.data as any;
            const normalizedUser: User = {
              ...u,
              displayName: u.displayName || u.display_name || u.username,
              avatarUrl: u.avatarUrl || u.avatar_preview_url || u.avatar_standard_url || null,
            };
            setUser(normalizedUser);

            // Fetch posts by username
            const postsRes = await postService.getPostsByAuthor(username);
            if (postsRes.success && postsRes.data) {
              setPosts(postsRes.data);
            }
          }
        }
      } catch (err: any) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin thành viên này');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  const authorInitials = user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ thành viên</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowReportModal(true)}>
          <ShieldAlert size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            {/* Avatar & Name */}
            <View style={styles.avatarRow}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{authorInitials}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.displayName}>{user.displayName}</Text>
                <Text style={styles.username}>@{user.username}</Text>
                <View style={styles.roleBadge}>
                  <Shield size={12} color="#A5B4FC" />
                  <Text style={styles.roleBadgeText}>{user.role}</Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            {user.bio ? <Text style={styles.bioText}>{user.bio}</Text> : null}

            {/* Stats Row */}
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Award size={18} color={colors.warning} />
                <Text style={styles.statValue}>{(user as any).reputation ?? 0}</Text>
                <Text style={styles.statLabel}>Uy tín</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <FileText size={18} color={colors.primary} />
                <Text style={styles.statValue}>{posts.length}</Text>
                <Text style={styles.statLabel}>Bài viết</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Calendar size={18} color={colors.textSecondary} />
                <Text style={styles.statValue}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: '2-digit', month: '2-digit' }) : '--'}
                </Text>
                <Text style={styles.statLabel}>Tham gia</Text>
              </View>
            </View>

            {/* Posts Section Title */}
            <Text style={styles.sectionTitle}>Bài viết đã đăng ({posts.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Thành viên này chưa đăng bài viết nào.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { id: item.id })}
          />
        )}
      />

      {/* Report User Modal */}
      {user && (
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={user.id}
          targetType="USER"
        />
      )}
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
  iconBtn: {
    padding: 6,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  profileHeader: {
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: colors.badgeText,
    fontSize: 22,
    fontWeight: '700',
  },
  displayName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  username: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  bioText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
