import { ShieldCheck } from "lucide-react";

const SiteFooter = () => {
  return (
    <footer className="mt-16 border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg  text-primary-foreground">
              {/* <ShieldCheck className="h-5 w-5" /> 
              {/* favicon.ico */} < img src="/favicon.ico" alt="Logo" className="h-9 w-9 rounded-lg" />

            </div>
            <div className="text-left">
              <p className="font-display text-base font-semibold">Lữ đoàn Thông tin 604</p>
              <p className="text-xs text-muted-foreground">Quân khu 2</p>
            </div>
          </div>

          <p className="font-display text-lg italic text-foreground/90">
            "Lưu giữ và phát huy truyền thống anh hùng"
          </p>

          <p className="text-xs text-muted-foreground">
            © 2026 Trang thông tin Lịch sử Đơn vị.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
