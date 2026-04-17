import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService, OpsMetrics } from '@/api/services/adminService';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  Zap,
  BarChart3,
  Bot,
} from 'lucide-react';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function pct(rate: number): string {
  return (rate * 100).toFixed(2) + '%';
}

export function OperationalDashboardPage() {
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getOpsMetrics();
      setMetrics(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  const errorRatePct = metrics?.error_rate ? metrics.error_rate * 100 : 0;
  const errorRateColor =
    errorRatePct >= 10 ? 'text-destructive' :
    errorRatePct >= 5  ? 'text-yellow-600' :
    'text-green-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operational Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            API · DB · Bot · LLM — cập nhật mỗi 30s
            {lastRefresh && (
              <span className="ml-2 text-xs">
                (lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')})
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Active alerts banner */}
      {metrics?.alert_active && metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">Cảnh báo đang kích hoạt</span>
          </div>
          <ul className="space-y-1">
            {metrics.alerts.map((alert, i) => (
              <li key={i} className="text-sm text-destructive/90 font-mono">{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* API metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Server className="h-5 w-5" /> API
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Activity className="h-4 w-4" /> Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatUptime(metrics?.uptime_s ?? 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-4 w-4" /> Throughput
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics?.throughput_rps ?? 0} <span className="text-sm font-normal text-muted-foreground">req/s</span></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(metrics?.total_requests ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{(metrics?.total_errors ?? 0).toLocaleString()} lỗi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                {(metrics?.error_rate ?? 0) >= 0.1
                  ? <AlertTriangle className="h-4 w-4 text-destructive" />
                  : <CheckCircle className="h-4 w-4 text-green-600" />}
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${errorRateColor}`}>{pct(metrics?.error_rate ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">ngưỡng cảnh báo: 10%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Latency */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5" /> Latency (tổng hợp)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'P50', value: metrics?.latency?.p50 ?? 0 },
            { label: 'P95', value: metrics?.latency?.p95 ?? 0 },
            { label: 'P99', value: metrics?.latency?.p99 ?? 0 },
            { label: 'Avg', value: metrics?.latency?.avg ?? 0 },
            { label: 'Max', value: metrics?.latency?.max ?? 0 },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${value > 1000 ? 'text-destructive' : value > 500 ? 'text-yellow-600' : ''}`}>
                  {value}<span className="text-sm font-normal text-muted-foreground">ms</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{metrics?.latency?.samples?.toLocaleString?.() ?? 0} samples</p>
      </div>

      {/* Recent windows */}
      {metrics?.windows && metrics.windows.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5" /> Cửa sổ 60 phút gần nhất
          </h2>
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left pb-2 font-medium">Thời gian</th>
                    <th className="text-right pb-2 font-medium">Requests</th>
                    <th className="text-right pb-2 font-medium">Lỗi</th>
                    <th className="text-right pb-2 font-medium">Error %</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics.windows].reverse().map((w) => {
                    const rate = w.requests > 0 ? w.errors / w.requests : 0;
                    return (
                      <tr key={w.windowStart} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-1.5 font-mono text-xs">
                          {new Date(w.windowStart).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-1.5 text-right">{w.requests}</td>
                        <td className="py-1.5 text-right text-destructive">{w.errors}</td>
                        <td className={`py-1.5 text-right font-medium ${rate >= 0.1 ? 'text-destructive' : rate >= 0.05 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {pct(rate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LLM providers */}
      {metrics?.llm && metrics.llm.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bot className="h-5 w-5" /> LLM Providers
          </h2>
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left pb-2 font-medium">Provider</th>
                    <th className="text-right pb-2 font-medium">Success</th>
                    <th className="text-right pb-2 font-medium">Failure</th>
                    <th className="text-right pb-2 font-medium">Success%</th>
                    <th className="text-right pb-2 font-medium">Avg latency</th>
                    <th className="text-right pb-2 font-medium">Retries</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.llm.map((p) => {
                    const total = p.success + p.failure;
                    const successRate = total > 0 ? p.success / total : 0;
                    const avgLatency = total > 0 ? Math.round(p.totalLatencyMs / total) : 0;
                    return (
                      <tr key={p.provider} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-1.5 font-medium">{p.provider}</td>
                        <td className="py-1.5 text-right text-green-600">{p.success}</td>
                        <td className="py-1.5 text-right text-destructive">{p.failure}</td>
                        <td className={`py-1.5 text-right font-medium ${successRate < 0.5 ? 'text-destructive' : successRate < 0.8 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {pct(successRate)}
                          {successRate < 0.5 && total >= 10 && (
                            <Badge variant="destructive" className="ml-1 text-xs py-0">LOW</Badge>
                          )}
                        </td>
                        <td className="py-1.5 text-right">{avgLatency}ms</td>
                        <td className="py-1.5 text-right">{p.retries}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
