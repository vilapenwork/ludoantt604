## Mục tiêu

Thêm tab **"Sao lưu"** trong trang Admin (`/admin`) cho phép:
1. **Tải về** toàn bộ dữ liệu (`articles`, `activities`, `leaders`) thành 1 file JSON.
2. **Khôi phục** từ file JSON đó khi cần.

---

## UI — Tab "Sao lưu" mới

Thêm tab thứ 5 vào `Admin.tsx` (cạnh Bài viết / Hoạt động / Lãnh đạo / Tài khoản).

**Khu vực 1 — Tải về (Export):**
- Card với mô tả "Tải toàn bộ dữ liệu về máy dưới dạng JSON".
- Nút **"Tải xuống bản sao lưu"** → tải file `backup-ludoan604-YYYY-MM-DD-HHmm.json`.
- Hiển thị số lượng record sẽ được backup (vd: "5 bài viết · 2 hoạt động · 24 lãnh đạo").
- Hiển thị "Lần sao lưu cuối: X ngày trước" (lưu trong `localStorage`).

**Khu vực 2 — Khôi phục (Import):**
- Input file `accept=".json"`.
- Sau khi chọn file → hiển thị **preview**: "File chứa X bài viết, Y hoạt động, Z lãnh đạo, ngày backup …".
- 2 chế độ (radio):
  - **Gộp (Merge)** — mặc định: upsert theo `id`, không xóa dữ liệu hiện tại. An toàn.
  - **Thay thế (Replace)**: XÓA hết rồi insert lại — có **AlertDialog xác nhận 2 lớp** với cảnh báo đỏ.
- Nút "Khôi phục" → progress + toast kết quả từng bảng.

---

## Định dạng file backup

```json
{
  "version": 1,
  "exportedAt": "2026-05-07T10:00:00Z",
  "source": "ludoan604",
  "counts": { "articles": 5, "activities": 2, "leaders": 24 },
  "data": {
    "articles":   [ /* tất cả rows */ ],
    "activities": [ /* tất cả rows */ ],
    "leaders":    [ /* tất cả rows */ ]
  }
}
```

Không backup `user_roles` và `auth.users` (nhạy cảm + không truy cập được qua client SDK).

---

## Chi tiết kỹ thuật

**File mới:**
- `src/components/admin/BackupRestore.tsx` — toàn bộ UI + logic export/import.

**File sửa:**
- `src/pages/Admin.tsx` — thêm `"backup"` vào `TabType`, `tabLabels`, và `<TabsContent value="backup"><BackupRestore /></TabsContent>`.

**Logic Export:**
```ts
const tables = ['articles','activities','leaders'] as const;
const data: any = {};
for (const t of tables) {
  // dùng .range() để vượt giới hạn 1000 row mặc định nếu cần
  const { data: rows } = await supabase.from(t).select('*');
  data[t] = rows ?? [];
}
const backup = { version: 1, exportedAt: new Date().toISOString(), source: 'ludoan604', counts: {...}, data };
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// <a href={url} download={`backup-ludoan604-${ts}.json`} />.click()
localStorage.setItem('lastBackupAt', new Date().toISOString());
```

**Logic Import — Merge:**
```ts
await supabase.from('articles').upsert(backup.data.articles, { onConflict: 'id' });
await supabase.from('activities').upsert(backup.data.activities, { onConflict: 'id' });
await supabase.from('leaders').upsert(backup.data.leaders, { onConflict: 'id' });
```

**Logic Import — Replace (sau khi user xác nhận 2 lần):**
```ts
// Dùng filter "luôn đúng" để bypass yêu cầu .delete() cần WHERE
await supabase.from('articles').delete().not('id', 'is', null);
await supabase.from('articles').insert(backup.data.articles);
// lặp lại cho activities, leaders
```

**Validation trước khi import:**
- Kiểm tra `backup.version === 1`.
- Kiểm tra `backup.data.articles` là array.
- Bắt lỗi từng bảng riêng → toast hiển thị bảng nào lỗi, vẫn tiếp tục các bảng khác.

**Bảo mật:**
- Tab chỉ render trong `Admin.tsx` (đã có `isAdmin` guard).
- RLS hiện tại đảm bảo non-admin không thể insert/delete/update kể cả nếu gọi trực tiếp.

---

## Test sau khi build

1. Bấm "Tải xuống bản sao lưu" → mở file JSON xem đủ 5+2+24 records.
2. Xóa thử 1 bài viết → import Merge → bài viết quay lại.
3. Import Replace với file backup → toàn bộ dữ liệu khớp lại nguyên vẹn.

---

## Lợi ích phụ

File JSON này cũng dùng được nếu sau này muốn:
- Migrate sang nền tảng khác (Firebase/MongoDB) — chỉ cần script convert.
- Khôi phục nếu Supabase free-tier bị pause/xóa nhầm.
- Backup trước khi chỉnh sửa hàng loạt.

Bấm **"Implement plan"** để tôi triển khai.