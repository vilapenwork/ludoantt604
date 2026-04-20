import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminUser {
  user_id: string;
  email: string | null;
  created_at: string;
}

const AdminAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [nextPwd, setNextPwd] = useState("");
  const [changing, setChanging] = useState(false);

  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "list_admins" },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    setAdmins(data.admins || []);
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "create_admin", email: newEmail.trim(), password: newPassword },
    });
    setCreating(false);
    if (error || data?.error) {
      toast({ title: "Lỗi tạo admin", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã tạo admin mới" });
    setNewEmail("");
    setNewPassword("");
    void load();
  };

  const handleRemove = async () => {
    if (!removeId) return;
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "remove_admin", user_id: removeId },
    });
    setRemoveId(null);
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã xoá admin" });
    void load();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setChanging(true);
    // Verify current password by re-signing in
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPwd,
    });
    if (verifyErr) {
      setChanging(false);
      toast({ title: "Mật khẩu hiện tại sai", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "change_password", new_password: nextPwd },
    });
    setChanging(false);
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã đổi mật khẩu" });
    setCurrentPwd("");
    setNextPwd("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> Đổi mật khẩu của bạn
          </CardTitle>
          <CardDescription>Tài khoản hiện tại: {user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pwd">Mật khẩu hiện tại</Label>
              <Input id="cur-pwd" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">Mật khẩu mới (≥6 ký tự)</Label>
              <Input id="new-pwd" type="password" minLength={6} value={nextPwd} onChange={(e) => setNextPwd(e.target.value)} required />
            </div>
            <Button type="submit" disabled={changing}>
              {changing ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Thêm tài khoản admin
          </CardTitle>
          <CardDescription>Tài khoản mới sẽ có quyền admin và được xác nhận email tự động.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-admin-pwd">Mật khẩu (≥6)</Label>
              <Input id="new-admin-pwd" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Đang tạo..." : "Tạo admin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Danh sách admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.user_id}>
                    <TableCell className="font-medium">
                      {a.email} {a.user_id === user?.id && <span className="text-xs text-muted-foreground">(bạn)</span>}
                    </TableCell>
                    <TableCell>admin</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        disabled={a.user_id === user?.id}
                        onClick={() => setRemoveId(a.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {admins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Chưa có admin</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!removeId} onOpenChange={(open) => !open && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tài khoản admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản sẽ bị xoá hoàn toàn và mất quyền truy cập. Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAccounts;
