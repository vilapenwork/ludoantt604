import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Home, KeyRound, ShieldCheck } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // When user clicks the recovery link, Supabase sets a session automatically.
    // We listen for PASSWORD_RECOVERY event AND check current session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasSession(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Mật khẩu quá ngắn", description: "Tối thiểu 6 ký tự.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Mật khẩu không khớp", description: "Vui lòng nhập lại.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: "Đổi mật khẩu thất bại", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã cập nhật mật khẩu", description: "Bạn có thể đăng nhập với mật khẩu mới." });
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-center text-2xl">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập mật khẩu mới cho tài khoản quản trị.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSession === false && (
            <Alert variant="destructive" className="mb-4">
              <KeyRound className="h-4 w-4" />
              <AlertTitle>Liên kết không hợp lệ</AlertTitle>
              <AlertDescription>
                Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại từ trang đăng nhập.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={!hasSession}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                disabled={!hasSession}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !hasSession}>
              {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
            <Button asChild type="button" variant="ghost" className="w-full">
              <Link to="/">
                <Home className="mr-1.5 h-4 w-4" /> Quay về trang chủ
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
