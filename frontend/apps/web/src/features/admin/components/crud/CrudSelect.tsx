"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";

export interface CrudSelectOption {
  label: string;
  value: string;
}

export interface CrudSelectProps {
  ariaLabel: string;
  disabled?: boolean;
  id?: string;
  label?: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly CrudSelectOption[];
  placeholder?: string;
  describedBy?: string;
  value: string;
  variant?: "filter" | "form";
  width?: number | string;
}

export const CrudSelect = ({
  ariaLabel,
  disabled = false,
  id,
  label,
  loading = false,
  onChange,
  onBlur,
  options,
  placeholder = "Select an option",
  describedBy,
  value,
  variant = "filter",
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
  const triggerElementRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedOption =
    variant === "form" && !value
      ? undefined
      : (options.find((option) => option.value === value) ?? options[0]);

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

  useEffect(() => {
    if (!isOpen) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    triggerElementRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(selectedIndex);
      setIsOpen(true);
      return;
    }
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      aria-busy={loading}
      className={[
        "lms-crud-filter-control",
        "lms-crud-select",
        "lms-organization-filter-control",
        "lms-organization-select",
        variant === "form" ? "is-form" : "",
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
        aria-describedby={describedBy}
        className="lms-crud-select-trigger lms-organization-select-trigger"
        disabled={disabled || loading || !options.length}
        id={id}
        onBlur={onBlur}
        onClick={() => {
          updateMenuPosition();
          setActiveIndex(selectedIndex);
          setIsOpen((current) => !current);
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerElementRef}
        type="button"
      >
        {label ? (
          <span className="lms-crud-select-label lms-organization-select-label">
            {label}
          </span>
        ) : null}
        <span className="lms-crud-select-value lms-organization-select-value">
          {loading ? "Loading..." : (selectedOption?.label ?? placeholder)}
        </span>
        {loading ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={13} />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="lms-crud-select-chevron lms-organization-select-chevron"
            size={13}
          />
        )}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lms-crud-select-menu lms-organization-select-menu"
              ref={menuRef}
              role="listbox"
              style={{
                left: menuPosition.left,
                minWidth: menuPosition.width,
                top: menuPosition.top,
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <button
                    aria-selected={isSelected}
                    className={[
                      "lms-crud-select-option",
                      "lms-organization-select-option",
                      index === activeIndex ? "is-active" : "",
                      isSelected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={option.value}
                    onClick={() => selectOption(option.value)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setActiveIndex((current) =>
                          Math.min(current + 1, options.length - 1),
                        );
                      } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setActiveIndex((current) => Math.max(current - 1, 0));
                      } else if (event.key === "Home") {
                        event.preventDefault();
                        setActiveIndex(0);
                      } else if (event.key === "End") {
                        event.preventDefault();
                        setActiveIndex(options.length - 1);
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        setIsOpen(false);
                        triggerElementRef.current?.focus();
                      } else if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectOption(option.value);
                      }
                    }}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role="option"
                    tabIndex={index === activeIndex ? 0 : -1}
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
