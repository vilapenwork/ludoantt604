## Tình trạng dung lượng DB hiện tại

Mình đã query trực tiếp database — kết quả:

| Hạng mục | Giá trị |
|---|---|
| **Tổng dung lượng DB** | **11 MB** / 500 MB (mới dùng ~2%) |
| Bảng `articles` | 96 KB · **5 bài** |
| Bảng `activities` | 80 KB · **2 hoạt động** |
| Bảng `leaders` | 32 KB · **24 lãnh đạo** |

→ Còn rất nhiều chỗ trống. Ước tính có thể chứa **vài chục nghìn bài viết** trước khi cần nâng cấp gói.

---

## Plan: Thêm phân trang

Hiện tại trang chủ và Admin đang `select("*")` không giới hạn → khi nhiều bài sẽ load chậm. Mình sẽ thêm phân trang server-side dùng `.range()` của Supabase.

### 1. Trang công khai (`src/pages/Index.tsx`)

- Áp dụng cho 3 nơi: danh sách **Tin tức** (`/tin-tuc`), **Hoạt động** (`/activities`), và section bài viết ở trang chủ.
- Page size: **9 bài/trang** (lưới 3 cột).
- Dùng `count: 'exact'` để biết tổng số → tính số trang.
- Trang chủ giữ nguyên hiển thị 6 bài mới nhất + nút "Xem tất cả" → không phân trang.
- Trang `/tin-tuc` và `/activities`: thêm component `<Pagination>` (đã có sẵn `src/components/ui/pagination.tsx`) ở cuối danh sách, đồng bộ số trang qua URL `?page=2`.
- Khi đổi filter (search/category/time) → reset về page 1.
- Filter search/category/time vẫn xử lý client-side trên trang hiện tại (vì hiện chưa có full-text search ở DB) — sẽ ghi chú để sau này nâng cấp lên server-side khi data lớn.

### 2. Trang Admin (`src/pages/Admin.tsx`)

- Page size: **20 dòng/trang** cho cả 3 tab (articles, activities, leaders).
- Thêm thanh phân trang đơn giản (Prev / "Trang X/Y" / Next) ở dưới bảng.
- Khi đổi tab → reset về page 1.
- Dùng `count: 'exact'` để hiển thị tổng số bản ghi.

### 3. Chi tiết kỹ thuật

```ts
// Mẫu query phân trang
const PAGE_SIZE = 9;
const from = (page - 1) * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;

const { data, count, error } = await supabase
  .from("articles")
  .select("*", { count: "exact" })
  .order("created_at", { ascending: false })
  .range(from, to);
```

- State: `page`, `totalCount`, `loading`.
- Tách hàm fetch theo từng resource thay vì gộp `Promise.all` cho cả ba (vì mỗi list cần page riêng).
- Giữ nguyên UI/style hiện tại; chỉ thêm component pagination + state.

### Files sẽ chỉnh

- `src/pages/Index.tsx` — phân trang cho `/tin-tuc` và `/activities`.
- `src/pages/Admin.tsx` — phân trang cho 3 tab dữ liệu.

Không cần thay đổi DB hay edge functions.
