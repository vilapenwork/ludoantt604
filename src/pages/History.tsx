import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Pencil, Calendar } from "lucide-react";

type Article = Tables<"articles">;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));

const History = () => {
  const { isAdmin } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", "lich-su")
        .maybeSingle();
      if (error) setError(error.message);
      setArticle(data);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
              </Link>
            </Button>
            {isAdmin && article && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/admin/articles/${article.id}`}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Chỉnh sửa
                </Link>
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Không tải được nội dung</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : article ? (
            <article className="mt-6 space-y-6">
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="max-h-[480px] w-full rounded-2xl object-cover"
                />
              )}
              <header className="space-y-3">
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                  {article.title}
                </h1>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Cập nhật {formatDate(article.updated_at)}
                </p>
              </header>
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div
                    className="prose-content space-y-4 text-base leading-7 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:my-4 [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: article.content || "<p>Chưa có nội dung.</p>" }}
                  />
                </CardContent>
              </Card>
            </article>
          ) : (
            !error && (
              <Card className="mt-6 border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Chưa có nội dung cho trang Lịch sử. Quản trị viên có thể tạo nội dung từ trang Quản trị → "Chỉnh sửa trang Lịch sử".
                </CardContent>
              </Card>
            )
          )}
        </div>
      </main>
      <SiteFooter />
      <ScrollToTop />
    </div>
  );
};

export default History;
