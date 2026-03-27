import config from '../config/index.js';
import { ActionType } from '../types/index.js';

interface UserDayCount {
  post: number;
  comment: number;
  vote: number;
  date: string; // YYYY-MM-DD
}

export class RateLimiter {
  private userCounts = new Map<number, UserDayCount>();

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getOrCreate(userId: number): UserDayCount {
    const today = this.getToday();
    let entry = this.userCounts.get(userId);
    if (!entry || entry.date !== today) {
      entry = { post: 0, comment: 0, vote: 0, date: today };
      this.userCounts.set(userId, entry);
    }
    return entry;
  }

  canPerform(userId: number, action: ActionType): boolean {
    const counts = this.getOrCreate(userId);
    switch (action) {
      case 'post':
        return counts.post < config.limits.maxPostsPerUserDay;
      case 'comment':
        return counts.comment < config.limits.maxCommentsPerUserDay;
      case 'vote':
        return counts.vote < config.limits.maxVotesPerUserDay;
    }
  }

  record(userId: number, action: ActionType): void {
    const counts = this.getOrCreate(userId);
    counts[action]++;
  }

  getRemainingActions(userId: number): { post: number; comment: number; vote: number } {
    const counts = this.getOrCreate(userId);
    return {
      post: Math.max(0, config.limits.maxPostsPerUserDay - counts.post),
      comment: Math.max(0, config.limits.maxCommentsPerUserDay - counts.comment),
      vote: Math.max(0, config.limits.maxVotesPerUserDay - counts.vote),
    };
  }

  getTodayStats(): { totalPosts: number; totalComments: number; totalVotes: number } {
    const today = this.getToday();
    let totalPosts = 0, totalComments = 0, totalVotes = 0;
    for (const [, entry] of this.userCounts) {
      if (entry.date === today) {
        totalPosts += entry.post;
        totalComments += entry.comment;
        totalVotes += entry.vote;
      }
    }
    return { totalPosts, totalComments, totalVotes };
  }
}
