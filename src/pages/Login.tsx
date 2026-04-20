import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Home, KeyRound, LogIn, ShieldCheck } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const { signIn, isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      toast({ title: "Đăng nhập thất bại", description: error.message, variant: "destructive" });
    } else {
      navigate("/admin", { replace: true });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = forgotEmail.trim();
    if (!target) return;
    setForgotSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSending(false);

    if (error) {
      toast({ title: "Không gửi được email", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Đã gửi email",
      description: "Kiểm tra hộp thư để đặt lại mật khẩu.",
    });
    setForgotOpen(false);
    setForgotEmail("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full  text-primary-foreground">
            {/* <ShieldCheck className="h-5 w-5" /> */}
            {/* favicon.ico */} < img src="/favicon.ico" alt="Logo" className="h-9 w-9 rounded-lg" />

          </div>
          <CardTitle className="text-center text-2xl">Đăng nhập quản trị</CardTitle>
          <CardDescription className="text-center">
            Dùng tài khoản admin để vào trang quản lý nội dung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!!location.state && (
            <Alert className="mb-4">
              <LogIn className="h-4 w-4" />
              <AlertTitle>Cần đăng nhập</AlertTitle>
              <AlertDescription>Vui lòng đăng nhập tài khoản quản trị để tiếp tục.</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting || loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            <Button asChild type="button" variant="ghost" className="w-full">
              <Link to="/">
                <Home className="mr-1.5 h-4 w-4" /> Quay về trang chủ
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Nếu đăng nhập thành công nhưng vẫn không vào được trang quản trị, hãy kiểm tra tài khoản đã được gán role <strong>admin</strong> chưa.
            </p>
          </form>
        </CardContent>
      </Card>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Quên mật khẩu
            </DialogTitle>
            <DialogDescription>
              Nhập email tài khoản admin. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={forgotSending}>
                {forgotSending ? "Đang gửi..." : "Gửi liên kết"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
