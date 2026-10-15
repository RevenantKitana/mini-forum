import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  User as UserIcon,
  LogOut,
  Settings,
  Bookmark,
  Shield,
  LogIn,
  UserPlus,
  Server,
  Edit3,
  Bell,
  ExternalLink,
} from 'lucide-react-native';
import { Post } from '../types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { bookmarkService } from '../api/services';
import { PostCard } from '../components/PostCard';
import { ApiConfigModal } from '../components/ApiConfigModal';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout, apiUrl } = useAuth();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchBookmarks();
    }
  }, [isAuthenticated, user?.id]);

  const fetchBookmarks = async () => {
    if (!user?.id) return;
    try {
      setLoadingBookmarks(true);
      const res = await bookmarkService.getUserBookmarks(user.id);
      if (res.success && res.data) {
        setBookmarks(res.data);
      }
    } catch (err) {
      console.log('Error bookmarks:', err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <View style={styles.headerActions}>
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

        {isAuthenticated && user ? (
          <>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {user.displayName?.substring(0, 2).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.displayName}>{user.displayName}</Text>
                  <Text style={styles.username}>@{user.username}</Text>
                  <Text style={styles.emailText}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Shield size={12} color="#A5B4FC" />
                  <Text style={styles.roleBadgeText}>{user.role}</Text>
                </View>
              </View>

              {/* Action Buttons: Edit Profile & View Public Profile */}
              <View style={styles.profileBtnRow}>
                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Edit3 size={15} color="#fff" />
                  <Text style={styles.editProfileBtnText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.publicProfileBtn}
                  onPress={() => navigation.navigate('UserProfile', { username: user.username })}
                >
                  <ExternalLink size={15} color={colors.textSecondary} />
                  <Text style={styles.publicProfileBtnText}>Trang cá nhân</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bookmarks Section */}
            <View style={styles.sectionHeader}>
              <Bookmark size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Bài viết đã lưu</Text>
            </View>

            {loadingBookmarks ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : bookmarks.length === 0 ? (
              <View style={styles.emptyBookmarks}>
                <Text style={styles.emptyBookmarksText}>Bạn chưa lưu bài viết nào</Text>
              </View>
            ) : (
              bookmarks.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPress={() => navigation.navigate('PostDetail', { id: post.id })}
                />
              ))
            )}

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={18} color={colors.error} />
              <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Guest View */
          <View style={styles.guestContainer}>
            <View style={styles.guestIconCircle}>
              <UserIcon size={40} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Chào mừng đến với Mini Forum</Text>
            <Text style={styles.guestSubtitle}>
              Đăng nhập để đăng bài viết, bình luận, vote và tham gia thảo luận cùng cộng đồng.
            </Text>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <LogIn size={18} color="#fff" />
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <UserPlus size={18} color={colors.text} />
              <Text style={styles.registerBtnText}>Đăng ký tài khoản</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Server Endpoint Indicator */}
        <View style={styles.serverInfoCard}>
          <View style={styles.serverRow}>
            <Server size={14} color={colors.textMuted} />
            <Text style={styles.serverLabel}>Backend Server URL:</Text>
          </View>
          <Text style={styles.serverUrlText} numberOfLines={1}>
            {apiUrl}
          </Text>
          <TouchableOpacity
            style={styles.changeServerBtn}
            onPress={() => setShowConfigModal(true)}
          >
            <Text style={styles.changeServerText}>Đổi IP Server</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Config Modal */}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: colors.badgeText,
    fontSize: 20,
    fontWeight: '700',
  },
  displayName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  username: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  emailText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  profileBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8,
  },
  editProfileBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  publicProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    borderRadius: 8,
  },
  publicProfileBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBookmarks: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  emptyBookmarksText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  guestContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  guestIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  guestTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
    marginBottom: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    width: '100%',
  },
  registerBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  serverInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serverLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  serverUrlText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  changeServerBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  changeServerText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
