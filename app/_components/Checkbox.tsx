"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  bare?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked, bare = false, ...props }, ref) => {
    if (bare) {
      return (
        <span className="relative inline-flex items-center justify-center group">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <span
            className={`
              w-4 h-4 rounded flex items-center justify-center
              border transition-all duration-150
              border-gray-300 bg-white
              peer-checked:bg-orange-500 peer-checked:border-orange-500
              peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400 peer-focus-visible:ring-offset-1
              ${className}
            `}
          >
            <svg
              className={`
                w-2.5 h-2.5 text-white
                transition-all duration-150
                ${checked ? "scale-100 opacity-100" : "scale-0 opacity-0"}
              `}
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M10 3L4.5 8.5L2 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      );
    }

    return (
      <span className="relative inline-flex items-center justify-center group">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="sr-only peer"
          {...props}
        />

        {/* Outer glow ring */}
        <span
          className={`
            absolute -inset-1 rounded-xl transition-all duration-300 pointer-events-none
            ${checked
              ? "bg-orange-500/10 scale-100"
              : "bg-transparent scale-95 group-hover:bg-orange-500/5 group-hover:scale-100"
            }
          `}
        />

        {/* Box */}
        <span
          className={`
            relative z-10 w-5 h-5 rounded-[7px]
            flex items-center justify-center
            border-[1.5px] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            shadow-sm
            border-gray-300 bg-linear-to-br from-white to-gray-50
            group-hover:border-orange-400 group-hover:shadow-md group-hover:shadow-orange-500/10
            peer-checked:bg-linear-to-br peer-checked:from-orange-500 peer-checked:to-orange-600
            peer-checked:border-orange-500
            peer-checked:shadow-lg peer-checked:shadow-orange-500/25
            peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400 peer-focus-visible:ring-offset-2
            peer-active:scale-[0.85]
            ${className}
          `}
        >
          {/* Checkmark */}
          <svg
            className={`
              w-3.5 h-3.5 text-white drop-shadow-sm
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${checked ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-45"}
            `}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
