"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";

export interface CrudSelectOption {
  label: string;
  value: string;
}

export interface CrudSelectProps {
  ariaLabel: string;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onChange: (value: string) => void;
  options: CrudSelectOption[];
  value: string;
  width?: number | string;
}

export const CrudSelect = ({
  ariaLabel,
  disabled = false,
  label,
  loading = false,
  onChange,
  options,
  value,
  width,
}: CrudSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  const updateMenuPosition = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    setMenuPosition({
      left: rect.left,
      top: rect.bottom + 6,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleViewportChange = () => updateMenuPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <div
      aria-busy={loading}
      className={[
        "lms-organization-filter-control",
        "lms-organization-select",
        isOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={rootRef}
      style={{ width }}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="lms-organization-select-trigger"
        disabled={disabled || loading || !options.length}
        onClick={() => {
          updateMenuPosition();
          setIsOpen((current) => !current);
        }}
        type="button"
      >
        <span className="lms-organization-select-label">{label}</span>
        <span className="lms-organization-select-value">
          {loading ? "Loading..." : (selectedOption?.label ?? value)}
        </span>
        {loading ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={13} />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="lms-organization-select-chevron"
            size={13}
          />
        )}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lms-organization-select-menu"
              ref={menuRef}
              role="listbox"
              style={{
                left: menuPosition.left,
                minWidth: menuPosition.width,
                top: menuPosition.top,
              }}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    aria-selected={isSelected}
                    className={[
                      "lms-organization-select-option",
                      isSelected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check aria-hidden="true" size={13} /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
