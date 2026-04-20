import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackToHomeProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

const BackToHome = ({ className, variant = "outline" }: BackToHomeProps) => {
  return (
    <Button asChild variant={variant} size="sm" className={className}>
      <Link to="/">
        <Home className="mr-1.5 h-4 w-4" /> Quay về trang chủ
      </Link>
    </Button>
  );
};

export default BackToHome;
