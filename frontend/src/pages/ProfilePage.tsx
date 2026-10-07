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
import { AvatarPreviewModal } from '@/components/common/AvatarPreviewModal';
import { getAvatarUrl } from '@/utils/imageHelpers';
import { Calendar, 
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
  const [showAvatarModal, setShowAvatarModal] = useState(false);
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
          <Badge variant="destructive" size="md" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'MODERATOR':
        return (
          <Badge variant="default" size="md" className="gap-1 bg-blue-600">
            <ShieldCheck className="h-3 w-3" />
            Moderator
          </Badge>
        );
      case 'BOT':
        return (
          <Badge variant="default" size="md" className="gap-1 bg-emerald-600">
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
  if (profile.is_blocked_by_me) {
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
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl xl:max-w-6xl mx-auto w-full space-y-6 animate-fade-in-up">
      {/* Profile Header */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] p-6 sm:p-8">
        <div>
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar - clickable to open preview modal */}
            <button
              type="button"
              className="relative flex-shrink-0 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all duration-200"
              onClick={() => setShowAvatarModal(true)}
              aria-label={`Xem ảnh đại diện của ${profile.display_name || profile.username}`}
            >
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 shadow-sm">
                <AvatarImage src={getAvatarUrl(profile, 'standard') || undefined} alt={profile.display_name} />
                <AvatarFallback className="text-3xl font-bold">
                  {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{profile.display_name || profile.username}</h1>
                {getRoleBadge(profile.role)}
              </div>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-3 font-medium">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm sm:text-base leading-relaxed text-foreground/90 mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Tham gia {format(new Date(profile.created_at), 'MMM yyyy', { locale: vi })}</span>
                </div>
                {profile.last_active_at && (
                  <div className="flex items-center gap-1.5">
                    <span>Hoạt động {formatDistanceToNow(new Date(profile.last_active_at), { addSuffix: true, locale: vi })}</span>
                  </div>
                )}
                {isOwnProfile && profile.date_of_birth && (
                  <div className="flex items-center gap-1.5">
                    <Cake className="h-4 w-4" />
                    <span>{format(new Date(profile.date_of_birth), 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                )}
                {isOwnProfile && profile.gender && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>
                      {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {isOwnProfile ? (
                <Link to="/settings/profile">
                  <Button variant="outline" size="sm" className="btn-press h-10 px-4 text-sm sm:text-base font-semibold rounded-xl">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </Link>
              ) : isAuthenticated && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="btn-press h-10 px-4 text-sm sm:text-base font-semibold rounded-xl"
                    onClick={() => setShowReportModal(true)}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Báo cáo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="btn-press h-10 px-4 text-sm sm:text-base font-semibold rounded-xl"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-border/40">
            <div className="text-center p-3 rounded-2xl bg-muted/20">
              <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold font-mono">
                <Award className="h-6 w-6 text-yellow-500" />
                {profile.reputation}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">Điểm uy tín</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-muted/20">
              <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold font-mono">
                <FileText className="h-6 w-6 text-blue-500" />
                {profile.post_count || postsData?.pagination?.total || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">Bài viết</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-muted/20">
              <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-extrabold font-mono">
                <MessageSquare className="h-6 w-6 text-green-500" />
                {profile.comment_count || commentsData?.pagination?.total || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">Bình luận</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      {isAuthenticated ? (
        <Tabs defaultValue="posts" className="space-y-6">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl w-fit">
            <TabsList className="bg-transparent p-0 gap-1 h-auto">
              <TabsTrigger value="posts" className="h-10 px-5 text-sm sm:text-base font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs">
                Bài viết
              </TabsTrigger>
              <TabsTrigger value="comments" className="h-10 px-5 text-sm sm:text-base font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs">
                Bình luận
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="votes" className="h-10 px-5 text-sm sm:text-base font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <ThumbsUp className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Lịch sử vote</span>
                  <span className="sm:hidden">Vote</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="posts" className="space-y-4 mt-0">
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

          <TabsContent value="comments" className="space-y-4 mt-0">
            {commentsLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </>
            ) : commentsData?.data && commentsData.data.length > 0 ? (
              commentsData.data.map((comment: any) => (
                <Card key={comment.id} className="rounded-2xl border-0 bg-card shadow-xs p-5 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-muted/60 text-primary flex-shrink-0 mt-0.5">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base leading-relaxed line-clamp-3 text-foreground/90">{comment.content}</p>
                      <div className="flex items-center gap-2 mt-2.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span>Trên bài viết:</span>
                        <Link
                          to={`/posts/${comment.post?.id}`}
                          className="text-primary hover:underline font-semibold line-clamp-1"
                        >
                          {comment.post?.title || `#${comment.post?.id}`}
                        </Link>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-2xl border-0 bg-card shadow-xs">
                <CardContent className="py-12 text-center text-sm sm:text-base text-muted-foreground">
                  {isOwnProfile ? "Bạn chưa có bình luận nào." : "Người dùng này chưa có bình luận nào."}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Votes Tab - Only visible to profile owner */}
          {isOwnProfile && (
            <TabsContent value="votes" className="space-y-4 mt-0">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center justify-between p-3 rounded-2xl bg-muted/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Loại:</span>
                  <div className="flex gap-1 bg-muted/60 p-1 rounded-xl">
                    <Button
                      variant={voteTypeFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg"
                      onClick={() => setVoteTypeFilter('all')}
                    >
                      Tất cả
                    </Button>
                    <Button
                      variant={voteTypeFilter === 'POST' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg"
                      onClick={() => setVoteTypeFilter('POST')}
                    >
                      Bài viết
                    </Button>
                    <Button
                      variant={voteTypeFilter === 'COMMENT' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg"
                      onClick={() => setVoteTypeFilter('COMMENT')}
                    >
                      Bình luận
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vote:</span>
                  <div className="flex gap-1 bg-muted/60 p-1 rounded-xl">
                    <Button
                      variant={voteFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg"
                      onClick={() => setVoteFilter('all')}
                    >
                      Tất cả
                    </Button>
                    <Button
                      variant={voteFilter === 'up' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg"
                      onClick={() => setVoteFilter('up')}
                    >
                      <ArrowBigUp className="h-4 w-4 mr-1 text-green-500" />
                      Upvote
                    </Button>
                    <Button
                      variant={voteFilter === 'down' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 sm:h-9 text-xs sm:text-sm rounded-lg"
                      onClick={() => setVoteFilter('down')}
                    >
                      <ArrowBigDown className="h-4 w-4 mr-1 text-red-500" />
                      Downvote
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vote History List */}
              {votesLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </>
              ) : voteHistoryData?.data && voteHistoryData.data.length > 0 ? (
                voteHistoryData.data.map((vote: VoteHistoryItem) => (
                  <Card key={vote.id} className="rounded-2xl border-0 bg-card shadow-xs p-5 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3.5">
                      {vote.voteType === 'upvote' ? (
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-500 flex-shrink-0 mt-0.5">
                          <ArrowBigUp className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500 flex-shrink-0 mt-0.5">
                          <ArrowBigDown className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge variant={vote.target_type === 'POST' ? 'default' : 'secondary'} size="xs" className="rounded-lg">
                            {vote.target_type === 'POST' ? 'Bài viết' : 'Bình luận'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        
                        {vote.target ? (
                          vote.target_type === 'POST' ? (
                            <Link
                              to={`/posts/${vote.target_id}`}
                              className="text-primary hover:underline font-semibold text-base block line-clamp-2"
                            >
                              {vote.target.title}
                            </Link>
                          ) : (
                            <div>
                              <p className="text-sm sm:text-base line-clamp-2 text-foreground/90">{vote.target.content}</p>
                              {vote.target.post && (
                                <Link
                                  to={`/posts/${vote.target.post.id}`}
                                  className="text-xs sm:text-sm text-primary hover:underline mt-1.5 inline-block font-medium"
                                >
                                  Trên bài viết: {vote.target.post.title}
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
                  </Card>
                ))
              ) : (
                <Card className="rounded-2xl border-0 bg-card shadow-xs">
                  <CardContent className="py-12 text-center text-sm sm:text-base text-muted-foreground">
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
          targetName={profile.display_name || profile.username}
        />
      )}

      {/* Avatar Preview Modal */}
      <AvatarPreviewModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        user={profile}
      />
    </div>
  );
}
