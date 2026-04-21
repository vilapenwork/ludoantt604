import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  LogIn,
  Moon,
  Sun,
  ShieldCheck,
  History,
  Newspaper,
  CalendarDays,
  Users,
  Home,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export const NAV_ITEMS = [
  { label: "Lịch sử lữ đoàn", to: "/lich-su", icon: History },
  { label: "Tin tức", to: "/tin-tuc", icon: Newspaper },
  { label: "Hoạt động đơn vị", to: "/activities", icon: CalendarDays },
  { label: "Lãnh đạo", to: "/leaders", icon: Users },
];

const SiteHeader = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (timeFilter && timeFilter !== "all") params.set("time", timeFilter);
    const qs = params.toString();
    navigate(`/tin-tuc${qs ? `?${qs}` : ""}`);
  };

  const goAdmin = () => {
    setOpen(false);
    navigate(isAdmin ? "/admin" : "/admin/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-left">
          <div className="flex h-9 w-9 items-center justify-center">
            {/* <ShieldCheck className="h-5 w-5" /> */}
            {/* favicon.ico */}{" "}
            <img src="/favicon.ico" alt="Logo" className="h-9 w-9 rounded-lg" />
          </div>
          <div className="">
            <p className="font-display text-base font-semibold leading-tight">
               Lữ đoàn 604
            </p>
            <p className="hidden sm:block text-xs text-muted-foreground">
              Lịch sử & truyền thống
            </p>
          </div>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeClassName="bg-accent text-foreground"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={submitSearch}
          className="ml-auto hidden items-center md:flex"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus={false} 
              ref={(el) => { if (el && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) el.focus(); }}//meanwhile mobile devices will focus the search input when the search button is clicked, so we disable autoFocus and manually focus only on non-mobile devices to avoid unwanted keyboard pop-up on mobile
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bài viết..."
              className="h-9 w-44 pl-8 lg:w-56"
              aria-label="Tìm kiếm"

            />
          </div>
        </form>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Chuyển chế độ sáng/tối"
          className="hidden md:inline-flex"
        >
          {theme === "dark" ?
            <Sun className="h-4 w-4" />
          : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={goAdmin}
          className="hidden md:inline-flex"
          aria-label={isAdmin ? "Vào quản trị" : "Đăng nhập admin"}
        >
          <LogIn className="mr-1.5 h-4 w-4" />
          {isAdmin ? "Quản trị" : "Đăng nhập"}
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="ml-auto md:ml-0 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 p-5 pr-12">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg  text-primary-foreground">
                  {/* <ShieldCheck className="h-5 w-5"   />  */}
                  {/* favicon.ico */}{" "}
                  <img
                    src="/favicon.ico"
                    alt="Logo"
                    className="h-9 w-9 rounded-lg"
                  />
                </div>
                <div>
                  <p className="font-display text-base font-semibold leading-tight">
                    Lữ đoàn 604
                  </p>
                  <p className="text-xs text-muted-foreground">
                    QK2 - Thông tin
                  </p>
                </div>
              </div>
              <Separator />

              {/* <form onSubmit={submitSearch} className="space-y-2 p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm bài viết..."
                    className="h-10 pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                      <SelectItem value="7d">7 ngày qua</SelectItem>
                      <SelectItem value="30d">30 ngày qua</SelectItem>
                      <SelectItem value="90d">3 tháng qua</SelectItem>
                      <SelectItem value="365d">1 năm qua</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" size="sm">
                    Tìm
                  </Button>
                </div>
              </form> */}

              <nav className="flex-1 space-y-1 px-3 pb-3">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Home className="h-4 w-4" />
                  Trang chủ
                </button>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        setOpen(false);
                        navigate(item.to);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <Separator />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    {theme === "dark" ?
                      <Moon className="h-4 w-4" />
                    : <Sun className="h-4 w-4" />}
                    <span>Chế độ tối</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    {theme === "dark" ? "Tắt" : "Bật"}
                  </Button>
                </div>
                <Button className="w-full" onClick={goAdmin}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isAdmin ? "Vào quản trị" : "Đăng nhập admin"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default SiteHeader;
