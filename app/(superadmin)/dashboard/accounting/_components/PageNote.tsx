import { Info } from "lucide-react";

export default function PageNote({ points }: { points: string[] }) {
  return (
    <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4">
      <div className="flex items-start gap-2.5">
        <Info size={16} className="text-orange-500 mt-0.5 shrink-0" />
        <div className="w-full">
          <p className="text-[11px] font-semibold text-orange-700 uppercase tracking-wide mb-1.5">
            Notes
          </p>
          <ul className="list-disc pl-4 space-y-1">
            {points.map((p, i) => (
              <li key={i} className="text-xs text-gray-600 leading-relaxed">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
