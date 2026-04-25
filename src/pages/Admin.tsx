import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Pencil, Trash2, LogOut, RefreshCw, ShieldAlert, Home, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminAccounts from "@/components/admin/AdminAccounts";

type TabType = "articles" | "activities" | "leaders" | "accounts";

const PAGE_SIZE = 20;

const Admin = () => {
  const { isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [data, setData] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin/login", { replace: true, state: { from: "/admin" } });
    }
  }, [loading, isAdmin, navigate]);

  // Reset to first page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!loading && isAdmin && activeTab !== "accounts") {
      void fetchData();
    }
  }, [activeTab, loading, isAdmin, page]);

  const fetchData = async () => {
    if (activeTab === "accounts") return;
    setDataLoading(true);
    setDataError(null);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: rows, count, error } = await supabase
      .from(activeTab as "articles" | "activities" | "leaders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      setData([]);
      setTotalCount(0);
      setDataError(error.message);
      setDataLoading(false);
      return;
    }

    setData(rows || []);
    setTotalCount(count || 0);
    setDataLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(activeTab as "articles" | "activities" | "leaders").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã xóa thành công" });
      fetchData();
    }
    setDeleteId(null);
  };

  const getColumns = (): { key: string; label: string }[] => {
    if (activeTab === "articles") return [{ key: "title", label: "Tiêu đề" }, { key: "category", label: "Danh mục" }];
    if (activeTab === "activities") return [{ key: "title", label: "Tiêu đề" }];
    return [{ key: "name", label: "Họ tên" }, { key: "role", label: "Chức vụ" }, { key: "years", label: "Nhiệm kỳ" }];
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 p-4 text-center">
        <ShieldAlert className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Bạn không có quyền truy cập trang này. Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  const tabLabels: Record<TabType, string> = { articles: "Bài viết", activities: "Hoạt động", leaders: "Lãnh đạo", accounts: "Tài khoản" };
  const dataTabs: TabType[] = ["articles", "activities", "leaders"];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <h1 className="text-lg font-bold">Quản trị</h1>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Quay về trang chủ</span>
              <span className="sm:hidden">Trang chủ</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="mr-1.5 h-4 w-4" /> Thoát
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 space-y-4">
        {/* Quick action: edit pinned History page */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">Trang Lịch sử lữ đoàn</p>
            <p className="text-xs text-muted-foreground">Bài viết cố định hiển thị tại /lich-su (slug: lich-su).</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/admin/articles/lich-su")}>
            <Pencil className="mr-1.5 h-4 w-4" /> Chỉnh sửa trang Lịch sử
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full sm:w-auto">
              {(Object.keys(tabLabels) as TabType[]).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="flex-1 sm:flex-none">{tabLabels[tab]}</TabsTrigger>
              ))}
            </TabsList>
            {activeTab !== "accounts" && (
              <Button size="sm" onClick={() => navigate(`/admin/${activeTab}/new`)}>
                <Plus className="mr-1.5 h-4 w-4" /> Thêm mới
              </Button>
            )}
          </div>

          {dataError && (
            <Alert className="mt-4" variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Không tải được dữ liệu</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{dataError}</span>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {dataTabs.map((tab) => (
            <TabsContent key={tab} value={tab}>
              {/* Mobile cards */}
              <div className="space-y-2 sm:hidden">
                {dataLoading && (
                  <div className="flex items-center justify-center gap-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
                  </div>
                )}

                {data.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border bg-background p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title || item.name}</p>
                      {tab === "articles" && <p className="text-xs text-muted-foreground">{item.category || "—"}</p>}
                      {tab === "leaders" && <p className="text-xs text-muted-foreground">{item.role}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/${tab}/${item.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getColumns().map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                      <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataLoading && (
                      <TableRow>
                        <TableCell colSpan={getColumns().length + 1} className="py-8 text-center text-muted-foreground">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {data.map((item) => (
                      <TableRow key={item.id}>
                        {getColumns().map((col) => (
                          <TableCell key={col.key}>{item[col.key] || "—"}</TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/${tab}/${item.id}`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!dataLoading && data.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={getColumns().length + 1} className="text-center text-muted-foreground py-8">
                          Chưa có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
          <TabsContent value="accounts">
            <AdminAccounts />
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
