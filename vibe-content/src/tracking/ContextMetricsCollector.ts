/**
 * Tracks context-fetch and comment-relevance metrics for observability.
 *
 * Lives inside ContextGathererService. Snapshots are exposed via
 * ContentGeneratorService.getStatusSnapshot() → /status endpoint.
 */

export interface ContextFetchRecord {
  postId: number;
  success: boolean;
  latencyMs: number;
  /** Rough token estimate: total text chars / 4 */
  tokenSize: number;
  fallback: boolean;
  reason?: string;
  timestamp: number;
}

export interface CommentRelevanceRecord {
  postId: number;
  commentPreview: string;
  score: number; // 0–100
  timestamp: number;
}

export interface ContextMetricsSnapshot {
  context_fetch_success_rate: string;
  context_fetch_success_count: number;
  context_fetch_total_count: number;
  context_avg_latency_ms: number;
  context_avg_token_size: number;
  comment_avg_relevance_score: number | null;
  /** True when success rate drops below 80% with ≥5 samples in the window */
  alert_low_context_rate: boolean;
}

const MAX_RECORDS = 200;

export class ContextMetricsCollector {
  private contextFetches: ContextFetchRecord[] = [];
  private relevanceScores: CommentRelevanceRecord[] = [];

  // ── Record helpers ────────────────────────────────────────────────────────

  recordContextFetch(record: ContextFetchRecord): void {
    this.contextFetches.push(record);
    if (this.contextFetches.length > MAX_RECORDS) {
      this.contextFetches.shift();
    }
  }

  recordCommentRelevance(postId: number, comment: string, score: number): void {
    this.relevanceScores.push({
      postId,
      commentPreview: comment.substring(0, 80),
      score,
      timestamp: Date.now(),
    });
    if (this.relevanceScores.length > MAX_RECORDS) {
      this.relevanceScores.shift();
    }
  }

  // ── Rule-based relevance scoring ─────────────────────────────────────────

  /**
   * Returns a 0–100 relevance score by measuring word overlap between the
   * comment and the post's title, tags, and body.
   *
   * Distribution:
   *   - title word overlap : up to 40 pts
   *   - tag match          : up to 30 pts
   *   - body word overlap  : up to 30 pts
   */
  static computeRelevanceScore(
    comment: string,
    title: string,
    tags: string[],
    body: string,
  ): number {
    const commentLower = comment.toLowerCase();

    const titleWords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const tagWords = tags.map((t) => t.toLowerCase());

    const bodyWords = body
      .substring(0, 200)
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const titleMatches = titleWords.filter((w) => commentLower.includes(w)).length;
    const titleScore = titleWords.length > 0
      ? (titleMatches / titleWords.length) * 40
      : 0;

    const tagMatches = tagWords.filter((w) => commentLower.includes(w)).length;
    const tagScore = tagWords.length > 0
      ? (tagMatches / tagWords.length) * 30
      : 0;

    const bodyMatches = bodyWords.filter((w) => commentLower.includes(w)).length;
    const bodyScore = bodyWords.length > 0
      ? (bodyMatches / bodyWords.length) * 30
      : 0;

    return Math.round(titleScore + tagScore + bodyScore);
  }

  // ── Aggregates ────────────────────────────────────────────────────────────

  getContextSuccessRate(windowMs = 60 * 60 * 1000): {
    rate: number;
    total: number;
    success: number;
  } {
    const since = Date.now() - windowMs;
    const recent = this.contextFetches.filter((r) => r.timestamp >= since);
    const total = recent.length;
    const success = recent.filter((r) => r.success).length;
    const rate = total > 0 ? success / total : 1;
    return { rate, total, success };
  }

  getAverageContextLatency(windowMs = 60 * 60 * 1000): number {
    const since = Date.now() - windowMs;
    const recent = this.contextFetches.filter((r) => r.success && r.timestamp >= since);
    if (recent.length === 0) return 0;
    return Math.round(
      recent.reduce((sum, r) => sum + r.latencyMs, 0) / recent.length,
    );
  }

  getAverageTokenSize(windowMs = 60 * 60 * 1000): number {
    const since = Date.now() - windowMs;
    const recent = this.contextFetches.filter((r) => r.success && r.timestamp >= since);
    if (recent.length === 0) return 0;
    return Math.round(
      recent.reduce((sum, r) => sum + r.tokenSize, 0) / recent.length,
    );
  }

  getAverageRelevanceScore(windowMs = 60 * 60 * 1000): number | null {
    const since = Date.now() - windowMs;
    const recent = this.relevanceScores.filter((r) => r.timestamp >= since);
    if (recent.length === 0) return null;
    return Math.round(
      recent.reduce((sum, r) => sum + r.score, 0) / recent.length,
    );
  }

  // ── Snapshot ──────────────────────────────────────────────────────────────

  getSnapshot(): ContextMetricsSnapshot {
    const { rate, total, success } = this.getContextSuccessRate();
    return {
      context_fetch_success_rate: `${Math.round(rate * 100)}%`,
      context_fetch_success_count: success,
      context_fetch_total_count: total,
      context_avg_latency_ms: this.getAverageContextLatency(),
      context_avg_token_size: this.getAverageTokenSize(),
      comment_avg_relevance_score: this.getAverageRelevanceScore(),
      alert_low_context_rate: rate < 0.8 && total >= 5,
    };
  }
}
