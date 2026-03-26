import { useParams, Link } from 'react-router-dom';
import { useUserByUsername, useUserPosts, useUserComments } from '@/hooks/useUsers';
import { useMyVoteHistory } from '@/hooks/useVotes';
import { VoteHistoryItem } from '@/api/services/voteService';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ReportModal } from '@/components/common/ReportModal';
import { 
  Calendar, 
  Edit, 
  MessageSquare,
  FileText,
  Award,
  Shield,
  ShieldCheck,
  Flag,
  Ban,
  UserX,
  ThumbsUp,
  ThumbsDown,
  ArrowBigUp,
  ArrowBigDown,
  Cake,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/axios';
import { toast } from 'sonner';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [voteFilter, setVoteFilter] = useState<'all' | 'up' | 'down'>('all');
  const [voteTypeFilter, setVoteTypeFilter] = useState<'all' | 'POST' | 'COMMENT'>('all');
  
  const { data: profileData, isLoading: profileLoading, error } = useUserByUsername(username!, !!username);

  const { data: postsData, isLoading: postsLoading } = useUserPosts(
    profileData?.data?.id || 0,
    1,
    10,
    !!profileData?.data?.id && isAuthenticated
  );

  const { data: commentsData, isLoading: commentsLoading } = useUserComments(
    profileData?.data?.id || 0,
    1,
    10,
    !!profileData?.data?.id && isAuthenticated
  );

  const profile = profileData?.data;
  const isOwnProfile = currentUser?.username === username;

  // Vote history (only for own profile)
  const { data: voteHistoryData, isLoading: votesLoading } = useMyVoteHistory({
    page: 1,
    limit: 20,
    targetType: voteTypeFilter === 'all' ? undefined : voteTypeFilter,
    voteType: voteFilter === 'all' ? undefined : voteFilter,
    enabled: isOwnProfile && isAuthenticated,
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.post(`/users/${userId}/block`);
    },
    onSuccess: () => {
      toast.success('Đã chặn người dùng');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể chặn người dùng');
    },
  });

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.delete(`/users/${userId}/block`);
    },
    onSuccess: () => {
      toast.success('Đã bỏ chặn người dùng');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể bỏ chặn người dùng');
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'MODERATOR':
        return (
          <Badge variant="default" className="gap-1 bg-blue-600">
            <ShieldCheck className="h-3 w-3" />
            Moderator
          </Badge>
        );
      case 'BOT':
        return (
          <Badge variant="default" className="gap-1 bg-emerald-600">
            <Shield className="h-3 w-3" />
            Bot
          </Badge>
        );
      default:
        return null;
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy người dùng</h2>
          <p className="text-muted-foreground mb-4">
            Người dùng @{username} không tồn tại hoặc đã bị xóa.
          </p>
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Show blocked profile view
  if (profile.isBlockedByMe) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 text-center animate-fade-in-up">
        <UserX className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">@{username}</h2>
        <p className="text-muted-foreground">Bạn đã chặn người dùng này. Nội dung của họ bị ẩn.</p>
        <Button 
          variant="outline" 
          onClick={() => unblockUserMutation.mutate(profile.id)}
          disabled={unblockUserMutation.isPending}
        >
          {unblockUserMutation.isPending ? 'Đang bỏ chặn...' : 'Bỏ chặn'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
              <AvatarFallback className="text-2xl">
                {profile.displayName?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{profile.displayName || profile.username}</h1>
                {getRoleBadge(profile.role)}
              </div>
              
              <p className="text-muted-foreground mb-3">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Tham gia {format(new Date(profile.createdAt), 'MMM yyyy', { locale: vi })}</span>
                </div>
                {profile.lastActiveAt && (
                  <div className="flex items-center gap-1">
                    <span>Hoạt động {formatDistanceToNow(new Date(profile.lastActiveAt), { addSuffix: true, locale: vi })}</span>
                  </div>
                )}
                {isOwnProfile && profile.dateOfBirth && (
                  <div className="flex items-center gap-1">
                    <Cake className="h-4 w-4" />
                    <span>{format(new Date(profile.dateOfBirth), 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                )}
                {isOwnProfile && profile.gender && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>
                      {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link to="/settings/profile">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </Link>
              ) : isAuthenticated && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReportModal(true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Báo cáo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn chặn @${profile.username}? Bạn sẽ không còn thấy bài viết và bình luận của họ.`)) {
                        blockUserMutation.mutate(profile.id);
                      }
                    }}
                    disabled={blockUserMutation.isPending}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {blockUserMutation.isPending ? 'Đang chặn...' : 'Chặn'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Award className="h-5 w-5 text-yellow-500" />
                {profile.reputation}
              </div>
              <p className="text-sm text-muted-foreground">Điểm uy tín</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <FileText className="h-5 w-5 text-blue-500" />
                {profile.postCount || postsData?.pagination?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Bài viết</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <MessageSquare className="h-5 w-5 text-green-500" />
                {profile.commentCount || commentsData?.pagination?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Bình luận</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      {isAuthenticated ? (
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Bài viết</TabsTrigger>
            <TabsTrigger value="comments">Bình luận</TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="votes">
                <ThumbsUp className="h-4 w-4 mr-1" />
                Lịch sử vote
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {postsLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </>
            ) : postsData?.data && postsData.data.length > 0 ? (
              postsData.data.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {isOwnProfile ? "Bạn chưa có bài viết nào." : "Người dùng này chưa có bài viết nào."}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            {commentsLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
            </>
          ) : commentsData?.data && commentsData.data.length > 0 ? (
            commentsData.data.map((comment: any) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm line-clamp-3">{comment.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Trên bài viết</span>
                        <Link
                          to={`/posts/${comment.postId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {comment.post?.title || `#${comment.postId}`}
                        </Link>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {isOwnProfile ? "Bạn chưa có bình luận nào." : "Người dùng này chưa có bình luận nào."}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Votes Tab - Only visible to profile owner */}
        {isOwnProfile && (
          <TabsContent value="votes" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Loại:</span>
                <div className="flex gap-1">
                  <Button
                    variant={voteTypeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoteTypeFilter('all')}
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={voteTypeFilter === 'POST' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoteTypeFilter('POST')}
                  >
                    Bài viết
                  </Button>
                  <Button
                    variant={voteTypeFilter === 'COMMENT' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoteTypeFilter('COMMENT')}
                  >
                    Bình luận
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Vote:</span>
                <div className="flex gap-1">
                  <Button
                    variant={voteFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoteFilter('all')}
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={voteFilter === 'up' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoteFilter('up')}
                  >
                    <ArrowBigUp className="h-4 w-4 mr-1" />
                    Upvote
                  </Button>
                  <Button
                    variant={voteFilter === 'down' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoteFilter('down')}
                  >
                    <ArrowBigDown className="h-4 w-4 mr-1" />
                    Downvote
                  </Button>
                </div>
              </div>
            </div>

            {/* Vote History List */}
            {votesLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </>
            ) : voteHistoryData?.data && voteHistoryData.data.length > 0 ? (
              voteHistoryData.data.map((vote: VoteHistoryItem) => (
                <Card key={vote.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {vote.voteType === 'upvote' ? (
                        <ArrowBigUp className="h-5 w-5 text-green-500 mt-1" />
                      ) : (
                        <ArrowBigDown className="h-5 w-5 text-red-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={vote.targetType === 'POST' ? 'default' : 'secondary'}>
                            {vote.targetType === 'POST' ? 'Bài viết' : 'Bình luận'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(vote.createdAt), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        
                        {vote.target ? (
                          vote.targetType === 'POST' ? (
                            <Link
                              to={`/posts/${vote.targetId}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {vote.target.title}
                            </Link>
                          ) : (
                            <div>
                              <p className="text-sm line-clamp-2">{vote.target.content}</p>
                              {vote.target.post && (
                                <Link
                                  to={`/posts/${vote.target.post.id}`}
                                  className="text-xs text-primary hover:underline mt-1 inline-block"
                                >
                                  Trên: {vote.target.post.title}
                                </Link>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm italic">
                            Nội dung đã bị xóa
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Bạn chưa vote bài viết hoặc bình luận nào.
                </CardContent>
              </Card>
            )}
            
            {voteHistoryData?.pagination && voteHistoryData.pagination.total > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Hiển thị {voteHistoryData.data.length} / {voteHistoryData.pagination.total} votes
              </div>
            )}
          </TabsContent>
        )}
        </Tabs>
      ) : (
        /* Guest User - Limited View */
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Đăng nhập để xem thêm</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Đăng nhập để xem bài viết, bình luận và hoạt động của người dùng này.
                </p>
                <Link to="/login">
                  <Button>Đăng nhập</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Modal */}
      {profile && (
        <ReportModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          targetType="user"
          targetId={profile.id}
          targetName={profile.displayName || profile.username}
        />
      )}
    </div>
  );
}
