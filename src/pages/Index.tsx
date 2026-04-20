import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ScrollToTop from "@/components/layout/ScrollToTop";
import LeadersTimeline from "@/components/LeadersTimeline";
import Hero from "@/components/layout/Hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Newspaper,
  RefreshCw,
  Search,
} from "lucide-react";

type Article = Tables<"articles">;
type Activity = Tables<"activities">;
type Leader = Tables<"leaders">;

type ContentItem = {
  id: string;
  kind: "article" | "activity";
  title: string;
  content: string;
  image: string | null;
  category: string | null;
  created_at: string;
  href: string;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

// const TIME_OPTIONS = [
//   { value: "all", label: "Tất cả thời gian" },
//   { value: "7d", label: "7 ngày qua" },
//   { value: "30d", label: "30 ngày qua" },
//   { value: "90d", label: "3 tháng qua" },
//   { value: "365d", label: "1 năm qua" },
// ];
// choose time options by calendar units instead of fixed days (to be more intuitive, e.g. "tháng này", "năm ngoái")
const TIME_OPTIONS = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "90d", label: "3 tháng qua" },
  { value: "365d", label: "1 năm qua" },
  { value: "this_month", label: "Tháng này" },
  { value: "last_month", label: "Tháng trước" },
  { value: "this_year", label: "Năm nay" },
  { value: "last_year", label: "Năm trước" },
];

const withinTimeFilter = (createdAt: string, range: string) => {
  if (range === "all") return true;
  const days = parseInt(range, 10);
  if (Number.isNaN(days)) return true;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() >= cutoff;
};

const Index = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState<Article[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("cat") || "all";
  const timeParam = searchParams.get("time") || "all";

  const [searchInput, setSearchInput] = useState(queryParam);
  useEffect(() => setSearchInput(queryParam), [queryParam]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    const [articlesResult, activitiesResult, leadersResult] = await Promise.all(
      [
        supabase
          .from("articles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("leaders")
          .select("*")
          .order("created_at", { ascending: false }),
      ],
    );

    setArticles(articlesResult.data || []);
    setActivities(activitiesResult.data || []);
    setLeaders(leadersResult.data || []);

    const errors = [
      articlesResult.error,
      activitiesResult.error,
      leadersResult.error,
    ]
      .filter(Boolean)
      .map((item) => item?.message)
      .join(" · ");

    setError(errors || null);
    setLoading(false);
  };

  useEffect(() => {
    void loadContent();
  }, []);

  // Hide pinned history article from "regular" article lists
  const visibleArticles = useMemo(
    () => articles.filter((article) => article.slug !== "lich-su"),
    [articles],
  );

  // Normalize articles + activities into a unified shape
  const articleItems: ContentItem[] = useMemo(
    () =>
      visibleArticles.map((a) => ({
        id: a.id,
        kind: "article",
        title: a.title,
        content: a.content,
        image: a.image,
        category: a.category,
        created_at: a.created_at,
        href: `/article/${a.id}`,
      })),
    [visibleArticles],
  );

  const activityItems: ContentItem[] = useMemo(
    () =>
      activities.map((a) => ({
        id: a.id,
        kind: "activity",
        title: a.title,
        content: a.content,
        image: a.image,
        category: "Hoạt động",
        created_at: a.created_at,
        href: `/activity/${a.id}`,
      })),
    [activities],
  );

  const articleCategories = useMemo(() => {
    const set = new Set<string>();
    articleItems.forEach((a) => a.category && set.add(a.category));
    return Array.from(set);
  }, [articleItems]);

  const filterItems = (items: ContentItem[]) => {
    const q = queryParam.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryParam !== "all" && item.category !== categoryParam)
        return false;
      if (!withinTimeFilter(item.created_at, timeParam)) return false;
      if (q) {
        const haystack =
          `${item.title} ${stripHtml(item.content)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  };

  const filteredArticles = useMemo(
    () => filterItems(articleItems),
    [articleItems, queryParam, categoryParam, timeParam],
  );
  const filteredActivities = useMemo(
    () => filterItems(activityItems),
    [activityItems, queryParam, categoryParam, timeParam],
  );

  const currentArticle = useMemo(
    () => articles.find((article) => article.id === id) || null,
    [articles, id],
  );
  const currentActivity = useMemo(
    () => activities.find((a) => a.id === id) || null,
    [activities, id],
  );

  const isArticlePage = location.pathname.startsWith("/article/");
  const isActivityDetail = location.pathname.startsWith("/activity/");
  const isActivitiesPage = location.pathname === "/activities";
  const isLeadersPage = location.pathname === "/leaders";
  const isNewsPage = location.pathname === "/tin-tuc";
  const isHome =
    !isArticlePage &&
    !isActivityDetail &&
    !isActivitiesPage &&
    !isLeadersPage &&
    !isNewsPage;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", searchInput.trim());
  };

  const renderItemCard = (item: ContentItem) => (
    <Card
      key={`${item.kind}-${item.id}`}
      className="overflow-hidden border-border/80 transition-shadow hover:shadow-md
      px-0
      gap-0
      "
    >
      {item.image && (
        <Link to={item.href} className="block">
          <img
            src={item.image}
            alt={item.title}
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        </Link>
      )}
      <CardHeader className="space-y-1 p-2">
        <div className="flex items-center  gap-1 text-xs text-muted-foreground ">
          {/* gap-1 mean */}
          {/* <Badge variant="outline">{item.category || (item.kind === "activity" ? "Hoạt động" : "Tin tức")}</Badge> */}
          {/* display 'tin-tuc' by 'Tin tức', 'thong-bao' by 'Thông báo', 'su-kien' by 'Sự kiện' */}
          <Badge
            variant="outline"
            style={{
              fontSize: "0.65rem",
            }}
          >
            {item.category === "tin-tuc" ?
              "Tin tức"
            : item.category === "thong-bao" ?
              "Thông báo"
            : item.category === "su-kien" ?
              "Sự kiện"
            : item.category ||
              (item.kind === "activity" ? "Hoạt động" : "Tin tức")
            }
          </Badge>

          <span>{formatDate(item.created_at)}</span>
        </div>
        {/* <CardTitle className="font-display text-xl leading-snug"> */}
        {/* text - xl pc, text-lg mobile */}
        <CardTitle
          className="font-display text-lg leading-snug p-2 
        [text-transform:capitalize]:first-letter


        "
        >
          <Link to={item.href} className="hover:text-primary ">
            {item.title}
          </Link>
        </CardTitle>
        <CardDescription>
          {/* {stripHtml(item.content).slice(0, 100) || "Chưa có nội dung tóm tắt."}{" "} */}
        </CardDescription>
      </CardHeader>
      <CardContent
        className="mt-auto popover-open:shadow-md
          transition-shadow
          backgroundColor:transparent"
        
      >
        <Button asChild variant="outline">
          <Link to={item.href}>
            Xem thêm <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const renderLeaderCard = (leader: Leader) => (
    <Card key={leader.id} className="border-border/80">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-14 w-14 border">
          <AvatarImage
            src={leader.avatar || undefined}
            alt={leader.name}
            className="object-cover"
          />
          <AvatarFallback>{getInitials(leader.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <CardTitle className="font-display text-lg">{leader.name}</CardTitle>
          <CardDescription>
            <span className="block font-medium text-foreground">
              {leader.role}
            </span>
            <span>{leader.years || "Chưa cập nhật nhiệm kỳ"}</span>
          </CardDescription>
        </div>
      </CardHeader>
      {leader.info && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {stripHtml(leader.info).slice(0, 100)}...
          </p>
        </CardContent>
      )}
    </Card>
  );

  const renderLoading = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <Skeleton className="h-48 w-full rounded-none" />
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmpty = (title: string, description: string) => (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );

  const renderFilters = (categories: string[], showCategory = true) => (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 md:flex-row md:items-center">
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-1 items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo từ khoá..."
            className="h-9 pl-8"
          />
        </div>
        <Button type="submit" size="sm">
          Tìm
        </Button>
      </form>
      <div className="flex  items-center gap-2 justify-end">
        {showCategory && categories.length > 0 && (
          <Select
            value={categoryParam}
            onValueChange={(v) => updateParam("cat", v)}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Chuyên mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chuyên mục</SelectItem>
              {/* {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
               */}
              {/* {item.category === "tin-tuc" ?
              "Tin tức"
            : item.category === "thong-bao" ?
              "Thông báo"
            : item.category === "su-kien" ?
              "Sự kiện"
            : item.category ||
              (item.kind === "activity" ? "Hoạt động" : "Tin tức")
            } */}

              {categories.map((c) => {
                const label =
                  c === "tin-tuc" ? "Tin tức"
                  : c === "thong-bao" ? "Thông báo"
                  : c === "su-kien" ? "Sự kiện"
                  : c;
                return (
                  <SelectItem key={c} value={c}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        <Select value={timeParam} onValueChange={(v) => updateParam("time", v)}>
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue placeholder="Thời gian" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Related articles (exclude current id, share category if available)
  const getRelated = (
    currentId: string,
    category: string | null,
    pool: ContentItem[],
  ) => {
    const others = pool.filter((p) => p.id !== currentId);
    const sameCat =
      category ? others.filter((p) => p.category === category) : [];
    const merged = [...sameCat, ...others.filter((p) => !sameCat.includes(p))];
    return merged.slice(0, 3);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {isHome && <Hero />}

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Đang có lỗi tải dữ liệu</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={loadContent}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isArticlePage || isActivityDetail ?
            (() => {
              const detail = isArticlePage ? currentArticle : currentActivity;
              const category =
                isArticlePage ?
                  (currentArticle?.category ?? null)
                : "Hoạt động";
              const relatedPool = isArticlePage ? articleItems : activityItems;
              const related = id ? getRelated(id, category, relatedPool) : [];
              return (
                <section className="space-y-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
                  </Button>
                  {loading ?
                    renderLoading()
                  : detail ?
                    <>
                      <article className="space-y-6">
                        {detail.image && (
                          <img
                            src={detail.image}
                            alt={detail.title}
                            className="max-h-[460px] w-full rounded-3xl object-cover"
                          />
                        )}
                        <div className="space-y-3">
                          <Badge variant="outline">
                            {category || "Bài viết"}
                          </Badge>
                          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                            {detail.title}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            Cập nhật ngày {formatDate(detail.created_at)}
                          </p>
                        </div>
                        <Card>
                          <CardContent className="p-6">
                            <div
                              className="prose-content space-y-4 text-sm leading-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_img]:my-4 [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                              dangerouslySetInnerHTML={{
                                __html:
                                  detail.content || "<p>Chưa có nội dung.</p>",
                              }}
                            />
                          </CardContent>
                        </Card>
                      </article>

                      {related.length > 0 && (
                        <section className="space-y-4 pt-6">
                          <h2 className="font-display text-2xl font-bold">
                            {isArticlePage ?
                              "Bài viết liên quan"
                            : "Hoạt động khác"}
                          </h2>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {related.map(renderItemCard)}
                          </div>
                        </section>
                      )}
                    </>
                  : renderEmpty(
                      isArticlePage ?
                        "Không tìm thấy bài viết"
                      : "Không tìm thấy hoạt động",
                      "Nội dung này có thể đã bị xoá hoặc chưa được tải về.",
                    )
                  }
                </section>
              );
            })()
          : isNewsPage ?
            <section className="space-y-6">
              <div className="space-y-2">
                <Badge variant="outline">Tin tức</Badge>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Bản tin đơn vị
                </h1>
                <p className="text-muted-foreground">
                  Tổng hợp tin tức mới nhất từ Lữ đoàn.
                </p>
              </div>
              {renderFilters(articleCategories)}
              {loading ?
                renderLoading()
              : filteredArticles.length ?
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredArticles.map(renderItemCard)}
                </div>
              : renderEmpty(
                  "Không có kết quả",
                  "Hãy thử thay đổi từ khoá hoặc bộ lọc.",
                )
              }
            </section>
          : isActivitiesPage ?
            <section className="space-y-6">
              <div className="space-y-2">
                <Badge variant="outline">Hoạt động</Badge>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Danh sách hoạt động
                </h1>
                <p className="text-muted-foreground">
                  Tổng hợp các hoạt động mới nhất.
                </p>
              </div>
              {renderFilters([], false)}
              {loading ?
                renderLoading()
              : filteredActivities.length ?
                <div
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 

                    text-sm
                  "
                >
                  {filteredActivities.map(renderItemCard)}
                </div>
              : renderEmpty(
                  "Không có kết quả",
                  "Hãy thử thay đổi từ khoá hoặc bộ lọc.",
                )
              }
            </section>
          : isLeadersPage ?
            <section className="space-y-6">
              <div className="space-y-2">
                <Badge variant="outline">Lãnh đạo đơn vị</Badge>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Lãnh đạo qua từng thời kỳ
                </h1>
                <p className="text-muted-foreground">
                  Bấm vào một mục để xem chi tiết. Mới nhất ở trên.
                </p>
              </div>
              {loading ?
                renderLoading()
              : leaders.length ?
                <LeadersTimeline leaders={leaders} />
              : renderEmpty(
                  "Chưa có dữ liệu lãnh đạo",
                  "Bạn có thể thêm hồ sơ lãnh đạo từ trang quản trị.",
                )
              }
            </section>
          : <div className="space-y-12">
              {/* Homepage filter */}
              {(articleItems.length > 0 || activityItems.length > 0) &&
                renderFilters(articleCategories)}

              {/* Featured news */}
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">
                      Tin tức nổi bật
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Các bài viết mới được cập nhật từ hệ thống.
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/tin-tuc">
                      Xem tất cả <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {loading ?
                  renderLoading()
                : filteredArticles.length ?
                  <>
                    {filteredArticles[0] && (
                      <Card className="overflow-hidden border-border/80">
                        <div className="grid md:grid-cols-2">
                          {filteredArticles[0].image ?
                            <Link to={filteredArticles[0].href}>
                              <img
                                src={filteredArticles[0].image}
                                alt={filteredArticles[0].title}
                                className="h-full max-h-80 w-full object-cover"
                              />
                            </Link>
                          : <div className="flex min-h-[16rem] items-center justify-center bg-muted">
                              <Newspaper className="h-10 w-10 text-muted-foreground" />
                            </div>
                          }
                          <div className="flex flex-col justify-center p-6 md:p-8">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {/* <Badge variant="outline">{filteredArticles[0].category || "Tin tức"}</Badge> */}

                              {/* display 'tin-tuc' by 'Tin tức', 'thong-bao' by 'Thông báo', 'su-kien' by 'Sự kiện' */}
                              <Badge variant="outline">
                                {filteredArticles[0].category === "tin-tuc" ?
                                  "Tin tức"
                                : filteredArticles[0].category === "thong-bao" ?
                                  "Thông báo"
                                : filteredArticles[0].category === "su-kien" ?
                                  "Sự kiện"
                                : filteredArticles[0].category || "Tin tức"}
                              </Badge>

                              <span>
                                {formatDate(filteredArticles[0].created_at)}
                              </span>
                            </div>
                            <h3 className="mt-3 font-display text-2xl font-semibold leading-snug md:text-3xl">
                              <Link
                                to={filteredArticles[0].href}
                                className="hover:text-primary"
                              >
                                {filteredArticles[0].title}
                              </Link>
                            </h3>
                            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                              {stripHtml(filteredArticles[0].content).slice(
                                0,
                                100,
                              ) || "Chưa có nội dung tóm tắt."}{" "}
                              ...
                            </p>
                            <div className="mt-5">
                              <Button asChild>
                                <Link to={filteredArticles[0].href}>
                                  Đọc bài viết{" "}
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    <div className="grid gap-4 grid-cols-2">
                      {filteredArticles.slice(1, 7).map(renderItemCard)}
                    </div>
                  </>
                : renderEmpty(
                    "Không có bài viết phù hợp",
                    "Hãy thử bỏ bộ lọc hoặc tìm từ khoá khác.",
                  )
                }
              </section>
              {/*  */}
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold">
                      Hoạt động gần đây
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Theo dõi các hoạt động mới nhất.
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/activities">
                      Xem tất cả <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {loading ?
                  renderLoading()
                : filteredActivities.length ?
                  <div className="grid gap-4 grid-cols-2">
                    {filteredActivities.slice(0, 4).map(renderItemCard)}
                  </div>
                : renderEmpty(
                    "Chưa có hoạt động",
                    "Danh sách hoạt động đang trống.",
                  )
                }
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold">
                      Lãnh đạo
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Lữ đoàn trưởng và Chính ủy đương nhiệm.
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/leaders">
                      Xem thêm <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {(() => {
                  if (loading) return renderLoading();
                  const sortNewest = (
                    a: (typeof leaders)[number],
                    b: (typeof leaders)[number],
                  ) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime();
                  const commander = [...leaders]
                    .filter((l) => l.role?.trim() === "Lữ đoàn trưởng")
                    .sort(sortNewest)[0];
                  const commissar = [...leaders]
                    .filter((l) => l.role?.trim() === "Chính ủy")
                    .sort(sortNewest)[0];
                  const featured = [commander, commissar].filter(
                    Boolean,
                  ) as typeof leaders;
                  if (!featured.length)
                    return renderEmpty(
                      "Chưa có dữ liệu",
                      "Hồ sơ lãnh đạo sẽ hiển thị tại đây.",
                    );
                  return (
                    <div className="grid gap-4 md:grid-cols-2">
                      {featured.map(renderLeaderCard)}
                    </div>
                  );
                })()}
              </section>
            </div>
          }
        </div>
      </main>

      <SiteFooter />
      <ScrollToTop />
    </div>
  );
};

export default Index;
