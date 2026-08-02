"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@repo/ui";
import type { Session } from "@repo/types";
import type { SessionRowActionHandlers } from "../types";

export const SessionActionsCell = memo(function SessionActionsCell({ handlers, session }: { handlers: SessionRowActionHandlers; session: Session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 180;
    const height = 180;
    setPosition({ left: Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width)), top: rect.bottom + height + 12 <= window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - height - 8) });
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const close = (event: PointerEvent) => { const target = event.target; if (target instanceof Node && !triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false); };
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { document.removeEventListener("pointerdown", close); window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [isOpen, updatePosition]);
  const actions = [
    { disabled: false, icon: ExternalLink, id: "view", label: "View", run: () => handlers.onView(session) },
    ...(handlers.onEdit ? [{ disabled: false, icon: Pencil, id: "edit", label: "Edit", run: () => handlers.onEdit?.(session) }] : []),
    ...(handlers.onToggleActive ? [{ disabled: false, icon: Power, id: "toggle", label: session.isActive ? "Archive" : "Activate", run: () => handlers.onToggleActive?.(session) }] : []),
    ...(handlers.onDelete ? [{ disabled: false, icon: Trash2, id: "delete", label: "Delete", run: () => handlers.onDelete?.(session) }] : []),
  ];
  return <div ref={triggerRef} style={{ alignItems: "center", display: "flex", justifyContent: "center", width: "100%" }}>
    <Button aria-expanded={isOpen} aria-label={`Open actions for ${session.name}`} background="#FFFFFF" borderColor="#D8E1EC" borderWidth={1} height={34} onPress={() => { updatePosition(); setIsOpen((current) => !current); }} rounded="$3" width={34}><MoreVertical aria-hidden="true" color="#0F1D3A" size={16} /></Button>
    {isOpen && typeof document !== "undefined" ? createPortal(<div className="lms-organization-row-menu" ref={menuRef} role="menu" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FBFDFD 100%)", border: "1px solid #D8E1EC", borderRadius: 12, boxShadow: "0 20px 44px rgba(15, 23, 42, 0.15)", display: "flex", flexDirection: "column", gap: 2, left: position.left, minWidth: 180, padding: 8, position: "fixed", top: position.top, zIndex: 5000 }}>
      {actions.map(({ icon: Icon, id, label, run }) => <Button aria-label={label} background="transparent" chromeless height={36} key={id} onPress={() => { setIsOpen(false); run(); }} px="$2" rounded="$3" style={{ alignItems: "center", justifyContent: "flex-start" }}><Icon aria-hidden="true" color={id === "delete" ? "#DC2626" : "#435266"} size={15} /><Button.Text color={id === "delete" ? "#DC2626" : "#0F1D3A"} fontSize="$caption" fontWeight="$button">{label}</Button.Text></Button>)}
    </div>, document.body) : null}
  </div>;
});
