import { Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-6xl font-bold mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Không tìm thấy trang</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="rounded-full bg-destructive/10 p-6 mb-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-6xl font-bold mb-2">500</h1>
      <h2 className="text-2xl font-semibold mb-2">Lỗi máy chủ</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tải lại trang
        </Button>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="rounded-full bg-orange-100 p-6 mb-6">
        <AlertTriangle className="h-12 w-12 text-orange-500" />
      </div>
      <h1 className="text-6xl font-bold mb-2">403</h1>
      <h2 className="text-2xl font-semibold mb-2">Không có quyền truy cập</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Bạn không có quyền truy cập vào trang này.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
