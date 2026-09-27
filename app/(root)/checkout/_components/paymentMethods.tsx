interface Props {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { value: "COD", label: "Cash On Delivery", hint: "Pay when your order arrives" },
  // commented out for now because the eSewa integration and the Khalti integration are not the part of the Cloud Kitchen project as for the requirement of this project
  // { value: "ESEWA", label: "eSewa", hint: "Pay online via eSewa wallet" },
  // { value: "KHALTI", label: "Khalti", hint: "Pay online via Khalti" },
] as const;

export default function PaymentMethods({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <input
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="accent-orange-500 w-4 h-4"
          />
          <span className="flex flex-col">
            <span className="text-white text-sm group-hover:text-orange-400 transition-colors">
              {option.label}
            </span>
            <span className="text-xs text-gray-400">{option.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}