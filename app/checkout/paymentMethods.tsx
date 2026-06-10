interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function PaymentMethods({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <label className="flex gap-3">
        <input
          type="radio"
          checked={value === "COD"}
          onChange={() => onChange("COD")}
        />
        Cash On Delivery
      </label>

      <label className="flex gap-3">
        <input
          type="radio"
          checked={value === "ONLINE"}
          onChange={() => onChange("ONLINE")}
        />
        Online Payment
      </label>
    </div>
  );
}
