import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  gradient,
  subtitle,
}: StatsCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient} shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <Icon size={24} className="text-white/60" />
        </div>
        <p className="text-3xl font-bold mt-3">{value}</p>
        {subtitle && (
          <p className="text-xs text-white/70 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
