import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, CheckCheck, MessageSquare, ThumbsUp } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { notificationService } from '../api/services';
import { useAuth } from '../context/AuthContext';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications(1, 30);
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.log('Error notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })));
    } catch (err) {
      console.log('Mark all read error:', err);
    }
  };

  const handleNotificationPress = async (item: any) => {
    try {
      if (!item.is_read && !item.read) {
        await notificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read: true } : n))
        );
      }

      const postId = item.post_id || item.target_id || (item.data ? item.data.postId : null);
      if (postId) {
        navigation.navigate('PostDetail', { id: Number(postId) });
      }
    } catch (err) {
      console.log('Notification press error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleMarkAllAsRead}>
          <CheckCheck size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={40} color={colors.surfaceHover} />
              <Text style={styles.emptyText}>Bạn chưa có thông báo nào mới</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isRead = item.is_read || item.read;
            const title = item.title || item.message || 'Thông báo mới';
            const body = item.content || item.body || '';
            const createdAt = item.created_at || item.createdAt;

            return (
              <TouchableOpacity
                style={[styles.notifCard, !isRead && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.iconCircle}>
                  {item.type === 'COMMENT' || item.type === 'REPLY' ? (
                    <MessageSquare size={16} color={colors.primary} />
                  ) : item.type === 'VOTE' ? (
                    <ThumbsUp size={16} color={colors.upvote} />
                  ) : (
                    <Bell size={16} color={colors.accent} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifTitle, !isRead && styles.notifTitleUnread]}>
                    {title}
                  </Text>
                  {body.length > 0 && <Text style={styles.notifBody} numberOfLines={2}>{body}</Text>}
                  <Text style={styles.notifDate}>
                    {createdAt ? new Date(createdAt).toLocaleString('vi-VN') : ''}
                  </Text>
                </View>

                {!isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
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
    fontSize: 17,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  notifTitleUnread: {
    color: colors.text,
    fontWeight: '700',
  },
  notifBody: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notifDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
