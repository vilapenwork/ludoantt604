import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Upload, Loader2, ShieldAlert, Database, FileJson, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TableName = "articles" | "activities" | "leaders";
const TABLES: TableName[] = ["articles", "activities", "leaders"];
const TABLE_LABELS: Record<TableName, string> = {
  articles: "bài viết",
  activities: "hoạt động",
  leaders: "lãnh đạo",
};

interface BackupFile {
  version: number;
  exportedAt: string;
  source?: string;
  counts?: Record<string, number>;
  data: Record<TableName, any[]>;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

const BackupRestore = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [counts, setCounts] = useState<Record<TableName, number>>({ articles: 0, activities: 0, leaders: 0 });
  const [countsLoading, setCountsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const [parsedBackup, setParsedBackup] = useState<BackupFile | null>(null);
  const [parsedFileName, setParsedFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [importing, setImporting] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [confirmReplaceFinalOpen, setConfirmReplaceFinalOpen] = useState(false);

  useEffect(() => {
    setLastBackupAt(localStorage.getItem("lastBackupAt"));
    void fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setCountsLoading(true);
    const next: Record<TableName, number> = { articles: 0, activities: 0, leaders: 0 };
    for (const t of TABLES) {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      next[t] = count || 0;
    }
    setCounts(next);
    setCountsLoading(false);
  };

  const totalRecords = useMemo(() => counts.articles + counts.activities + counts.leaders, [counts]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data: Record<TableName, any[]> = { articles: [], activities: [], leaders: [] };
      for (const t of TABLES) {
        // Fetch all rows in pages of 1000 to bypass default limit
        let all: any[] = [];
        let from = 0;
        const PAGE = 1000;
        while (true) {
          const { data: rows, error } = await supabase
            .from(t)
            .select("*")
            .order("created_at", { ascending: true })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          all = all.concat(rows || []);
          if (!rows || rows.length < PAGE) break;
          from += PAGE;
        }
        data[t] = all;
      }

      const backup: BackupFile = {
        version: 1,
        exportedAt: new Date().toISOString(),
        source: "ludoan604",
        counts: { articles: data.articles.length, activities: data.activities.length, leaders: data.leaders.length },
        data,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
      a.href = url;
      a.download = `backup-ludoan604-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem("lastBackupAt", now);
      setLastBackupAt(now);

      toast({ title: "Đã tải bản sao lưu", description: `${data.articles.length + data.activities.length + data.leaders.length} bản ghi` });
    } catch (e: any) {
      toast({ title: "Lỗi sao lưu", description: e.message || String(e), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setParsedBackup(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setParsedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result)) as BackupFile;
        if (json.version !== 1) throw new Error("Phiên bản file không được hỗ trợ");
        if (!json.data || typeof json.data !== "object") throw new Error("File không có trường data");
        for (const t of TABLES) {
          if (!Array.isArray(json.data[t])) throw new Error(`Thiếu hoặc sai định dạng bảng "${t}"`);
        }
        setParsedBackup(json);
      } catch (err: any) {
        setParseError(err.message || "File JSON không hợp lệ");
      }
    };
    reader.onerror = () => setParseError("Không đọc được file");
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!parsedBackup) return;
    setImporting(true);
    const results: { table: TableName; ok: boolean; msg: string }[] = [];

    for (const t of TABLES) {
      const rows = parsedBackup.data[t];
      try {
        if (mode === "replace") {
          const { error: delErr } = await supabase.from(t).delete().not("id", "is", null);
          if (delErr) throw delErr;
          if (rows.length > 0) {
            const { error: insErr } = await supabase.from(t).insert(rows);
            if (insErr) throw insErr;
          }
          results.push({ table: t, ok: true, msg: `Đã thay thế ${rows.length}` });
        } else {
          if (rows.length > 0) {
            const { error: upErr } = await supabase.from(t).upsert(rows, { onConflict: "id" });
            if (upErr) throw upErr;
          }
          results.push({ table: t, ok: true, msg: `Đã gộp ${rows.length}` });
        }
      } catch (e: any) {
        results.push({ table: t, ok: false, msg: e.message || String(e) });
      }
    }

    setImporting(false);
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      toast({ title: "Khôi phục thành công", description: results.map((r) => `${TABLE_LABELS[r.table]}: ${r.msg}`).join(" · ") });
    } else {
      toast({
        title: "Khôi phục có lỗi",
        description: results.map((r) => `${TABLE_LABELS[r.table]}: ${r.ok ? "OK" : r.msg}`).join(" · "),
        variant: "destructive",
      });
    }
    await fetchCounts();
  };

  const handleClickRestore = () => {
    if (!parsedBackup) return;
    if (mode === "replace") {
      setConfirmReplaceOpen(true);
    } else {
      void runImport();
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Tải xuống bản sao lưu
          </CardTitle>
          <CardDescription>
            Tải toàn bộ dữ liệu ({TABLES.map((t) => TABLE_LABELS[t]).join(", ")}) về máy dưới dạng file JSON. Có thể dùng để khôi phục về sau hoặc chuyển sang nền tảng khác.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            {countsLoading ? (
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Đang đếm...
              </span>
            ) : (
              <span>
                <strong>{counts.articles}</strong> bài viết · <strong>{counts.activities}</strong> hoạt động · <strong>{counts.leaders}</strong> lãnh đạo
                <span className="ml-2 text-muted-foreground">(tổng {totalRecords} bản ghi)</span>
              </span>
            )}
          </div>

          {lastBackupAt && (
            <p className="text-xs text-muted-foreground">Lần sao lưu cuối: {formatDate(lastBackupAt)}</p>
          )}

          <Button onClick={handleExport} disabled={exporting || countsLoading}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Tải xuống bản sao lưu
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Khôi phục từ file sao lưu
          </CardTitle>
          <CardDescription>
            Chọn file JSON đã sao lưu trước đó. Hãy luôn tải bản sao lưu mới nhất trước khi khôi phục.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileSelected}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {parseError && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>File không hợp lệ</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {parsedBackup && (
            <>
              <Alert>
                <FileJson className="h-4 w-4" />
                <AlertTitle>{parsedFileName}</AlertTitle>
                <AlertDescription>
                  Ngày sao lưu: {formatDate(parsedBackup.exportedAt)} · Phiên bản {parsedBackup.version}
                  <br />
                  <strong>{parsedBackup.data.articles.length}</strong> bài viết · <strong>{parsedBackup.data.activities.length}</strong> hoạt động · <strong>{parsedBackup.data.leaders.length}</strong> lãnh đạo
                </AlertDescription>
              </Alert>

              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Chế độ khôi phục</p>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as "merge" | "replace")}>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="merge" id="mode-merge" className="mt-1" />
                    <Label htmlFor="mode-merge" className="font-normal cursor-pointer">
                      <span className="font-semibold">Gộp (an toàn)</span>
                      <span className="block text-xs text-muted-foreground">
                        Cập nhật/thêm bản ghi theo ID. Dữ liệu hiện tại không bị xóa.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="replace" id="mode-replace" className="mt-1" />
                    <Label htmlFor="mode-replace" className="font-normal cursor-pointer">
                      <span className="font-semibold text-destructive">Thay thế toàn bộ (nguy hiểm)</span>
                      <span className="block text-xs text-muted-foreground">
                        XÓA toàn bộ dữ liệu hiện tại rồi nạp lại từ file. Không thể hoàn tác.
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {mode === "replace" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cảnh báo</AlertTitle>
                  <AlertDescription>
                    Chế độ này sẽ xóa <strong>{totalRecords}</strong> bản ghi hiện tại. Hãy đảm bảo bạn đã tải bản sao lưu mới nhất.
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleClickRestore} disabled={importing} variant={mode === "replace" ? "destructive" : "default"}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {mode === "replace" ? "Xóa và khôi phục" : "Khôi phục (gộp)"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Replace confirmation – step 1 */}
      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Xác nhận xóa toàn bộ dữ liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ XÓA toàn bộ {totalRecords} bản ghi hiện tại và thay bằng dữ liệu trong file. Bạn có chắc chắn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmReplaceOpen(false);
                setConfirmReplaceFinalOpen(true);
              }}
            >
              Tôi hiểu rủi ro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace confirmation – step 2 */}
      <AlertDialog open={confirmReplaceFinalOpen} onOpenChange={setConfirmReplaceFinalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Xác nhận lần cuối</AlertDialogTitle>
            <AlertDialogDescription>
              Bấm "Tiến hành" để xóa và khôi phục. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmReplaceFinalOpen(false);
                void runImport();
              }}
            >
              Tiến hành
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackupRestore;
