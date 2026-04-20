import { useMemo, useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, User } from "lucide-react";

type Leader = Tables<"leaders">;

const LU_DOAN_TRUONG = "Lữ đoàn trưởng";
const CHINH_UY = "Chính ủy";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const sortNewestFirst = (a: Leader, b: Leader) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

interface ColumnProps {
  title: string;
  accent: string;
  items: Leader[];
  onSelect: (leader: Leader) => void;
}

const TimelineColumn = ({ title, accent, items, onSelect }: ColumnProps) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${accent}`} />
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <Badge variant="outline" className="ml-auto">{items.length}</Badge>
    </div>

    {items.length === 0 ? (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <User className="h-4 w-4" /> Chưa có dữ liệu cho cương vị này.
        </CardContent>
      </Card>
    ) : (
      <ol className="relative space-y-5 border-l-2 border-border/70 pl-6">
        {items.map((leader) => (
          <li key={leader.id} className="relative">
            <span className={`absolute -left-[33px] top-3 h-4 w-4 rounded-full border-4 border-background ${accent}`} />
            <button
              type="button"
              onClick={() => onSelect(leader)}
              className="block w-full text-left"
            >
              <Card className="transition hover:border-primary/40 hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={leader.avatar || undefined} alt={leader.name} className="object-cover" />
                    <AvatarFallback>{getInitials(leader.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="font-display text-base">{leader.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />
                      {leader.years || "Chưa cập nhật nhiệm kỳ"}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </button>
          </li>
        ))}
      </ol>
    )}
  </div>
);

interface LeadersTimelineProps {
  leaders: Leader[];
}

const LeadersTimeline = ({ leaders }: LeadersTimelineProps) => {
  const [selected, setSelected] = useState<Leader | null>(null);

  const { commanders, commissars } = useMemo(() => {
    const commanders = leaders
      .filter((l) => l.role?.trim() === LU_DOAN_TRUONG)
      .sort(sortNewestFirst);
    const commissars = leaders
      .filter((l) => l.role?.trim() === CHINH_UY)
      .sort(sortNewestFirst);
    return { commanders, commissars };
  }, [leaders]);

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        <TimelineColumn
          title={LU_DOAN_TRUONG}
          accent="bg-primary"
          items={commanders}
          onSelect={setSelected}
        />
        <TimelineColumn
          title={CHINH_UY}
          accent="bg-destructive"
          items={commissars}
          onSelect={setSelected}
        />
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src={selected.avatar || undefined} alt={selected.name} className="object-cover" />
                    <AvatarFallback>{getInitials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="font-display text-2xl">{selected.name}</DialogTitle>
                    <DialogDescription className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{selected.role}</span>
                      <span className="text-xs">Nhiệm kỳ: {selected.years || "—"}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {selected.info ? (
                <div
                  className="prose-content max-h-[60vh] overflow-y-auto text-sm leading-7 [&_img]:my-3 [&_img]:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: selected.info }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có thông tin chi tiết.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadersTimeline;
