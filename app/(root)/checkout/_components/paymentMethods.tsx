interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function PaymentMethods({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="radio"
          checked={value === "COD"}
          onChange={() => onChange("COD")}
          className="accent-orange-500 w-4 h-4"
        />
        <span className="text-white text-sm group-hover:text-orange-400 transition-colors">Cash On Delivery</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="radio"
          checked={value === "ONLINE"}
          onChange={() => onChange("ONLINE")}
          className="accent-orange-500 w-4 h-4"
        />
        <span className="text-white text-sm group-hover:text-orange-400 transition-colors">Online Payment</span>
      </label>
    </div>
  );
}
