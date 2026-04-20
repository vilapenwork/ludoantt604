import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RichTextEditor from "@/components/RichTextEditor";
import { ArrowLeft, Save, ImagePlus, X, Loader2, ShieldAlert, RefreshCw, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContentType = "articles" | "activities" | "leaders";

const validContentTypes: ContentType[] = ["articles", "activities", "leaders"];

const AdminEditor = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const contentType = type as ContentType;
  // Special case: editing the pinned "Lịch sử lữ đoàn" article via slug
  const isHistorySlug = contentType === "articles" && id === "lich-su";
  const isNew = id === "new";
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [headerImage, setHeaderImage] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [years, setYears] = useState("");
  const [info, setInfo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const isValidType = validContentTypes.includes(contentType);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin/login", { replace: true, state: { from: `/admin/${type}/${id}` } });
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isValidType || isNew || !id || !isAdmin) return;

    const loadRecord = async () => {
      setPageLoading(true);
      setPageError(null);

      // For the pinned history article, fetch by slug instead of id
      const { data, error } = isHistorySlug
        ? await (supabase as any).from(contentType).select("*").eq("slug", "lich-su").maybeSingle()
        : await (supabase as any).from(contentType).select("*").eq("id", id).single();

      if (error) {
        setPageError(error.message);
        setPageLoading(false);
        return;
      }

      if (!data) {
        // History slug record may not exist yet — let admin create it.
        if (isHistorySlug) {
          setTitle("Lịch sử hình thành và phát triển");
          setContent("");
          setHeaderImage("");
          setRecordId(null);
          setPageLoading(false);
          return;
        }
        setPageError("Không tìm thấy dữ liệu cần chỉnh sửa.");
        setPageLoading(false);
        return;
      }

      const d = data as any;
      setRecordId(d.id ?? null);
      if (contentType === "leaders") {
        setName(d.name || "");
        setRole(d.role || "");
        setYears(d.years || "");
        setInfo(d.info || "");
        setAvatar(d.avatar || "");
      } else {
        setTitle(d.title || "");
        setContent(d.content || "");
        setHeaderImage(d.image || "");
        if (contentType === "articles") setCategory(d.category || "");
      }

      setPageLoading(false);
    };

    void loadRecord();
  }, [id, contentType, isNew, isAdmin, isValidType, isHistorySlug]);

  useEffect(() => {
    if (!isValidType) {
      setPageError("Loại nội dung không hợp lệ.");
    }
  }, [isValidType]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "png";
    const path = `headers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) { toast({ title: "Lỗi upload", description: error.message, variant: "destructive" }); return null; }
    return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
  };

  const handleHeaderImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setHeaderImage(url);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setAvatar(url);
  };

  const handleSave = async () => {
    setSaving(true);
    let payload: Record<string, any>;

    if (contentType === "leaders") {
      if (!name || !role) { toast({ title: "Vui lòng điền họ tên và chức vụ", variant: "destructive" }); setSaving(false); return; }
      payload = { name, role, years: years || null, info: info || null, avatar: avatar || null };
    } else {
      if (!title) { toast({ title: "Vui lòng điền tiêu đề", variant: "destructive" }); setSaving(false); return; }
      payload = { title, content, image: headerImage || null };
      if (contentType === "articles") payload.category = category || null;
    }

    let error;
    if (isHistorySlug) {
      // Pinned History page — upsert by slug
      const sb = supabase as any;
      if (recordId) {
        ({ error } = await sb.from("articles").update({ ...payload, slug: "lich-su" }).eq("id", recordId));
      } else {
        ({ error } = await sb.from("articles").insert({ ...payload, slug: "lich-su" }));
      }
    } else if (isNew) {
      ({ error } = await supabase.from(contentType).insert(payload as any));
    } else {
      ({ error } = await supabase.from(contentType).update(payload as any).eq("id", id!));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Lỗi lưu dữ liệu", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Đã lưu thành công" });
      navigate("/admin");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 p-4 text-center">
        <ShieldAlert className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Bạn không có quyền truy cập. Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  const typeLabels: Record<ContentType, string> = { articles: "Bài viết", activities: "Hoạt động", leaders: "Lãnh đạo" };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 space-y-6">
        <h2 className="text-xl font-bold">{isNew ? "Thêm" : "Sửa"} {typeLabels[contentType]}</h2>

        {pageError && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Không tải được nội dung</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{pageError}</span>
              {!isNew && isValidType && id && (
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Tải lại
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {pageLoading && (
          <div className="flex items-center gap-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu biên tập...
          </div>
        )}

        {contentType === "leaders" ? (
          <>
            <div className="space-y-2">
              <Label>Ảnh đại diện</Label>
              {avatar ? (
                <div className="relative inline-block">
                  <img src={avatar} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -right-1 -top-1 h-6 w-6" onClick={() => setAvatar("")}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed text-muted-foreground hover:bg-muted/50">
                  <ImagePlus className="h-6 w-6" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Họ tên *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Chức vụ *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder="Chọn chức vụ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lữ đoàn trưởng">Lữ đoàn trưởng</SelectItem>
                    <SelectItem value="Chính ủy">Chính ủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nhiệm kỳ</Label>
                <Input value={years} onChange={(e) => setYears(e.target.value)} placeholder="VD: 2020-2025" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thông tin</Label>
              <RichTextEditor content={info} onChange={setInfo} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Ảnh tiêu đề</Label>
              {headerImage ? (
                <div className="relative">
                  <img src={headerImage} alt="Header" className="max-h-48 w-full rounded-md object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={() => setHeaderImage("")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:bg-muted/50">
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-8 w-8" />
                    <span className="mt-1 text-sm">Chọn ảnh tiêu đề</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleHeaderImageChange} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {contentType === "articles" && (
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tin-tuc">Tin tức</SelectItem>
                    <SelectItem value="thong-bao">Thông báo</SelectItem>
                    <SelectItem value="su-kien">Sự kiện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nội dung</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminEditor;
