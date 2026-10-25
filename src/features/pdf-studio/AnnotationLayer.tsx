import { useRef, useState } from 'react';
import type { Annotation, AnnotationType } from '../../services/pdf/pdfStudio';
import { uid } from '../../core/models/factory';

export type Tool = 'select' | 'text' | 'highlight' | 'box';

interface Props {
  imgUrl: string;
  annotations: Annotation[];
  tool: Tool;
  color: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: Annotation[]) => void;
}

const DEFAULT_FONT = 0.028; // fraction of page height

export function AnnotationLayer({ imgUrl, annotations, tool, color, selectedId, onSelect, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Annotation | null>(null);
  const drag = useRef<{ mode: 'create' | 'move'; id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const norm = (e: React.PointerEvent | PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
  };

  const endDrag = () => {
    if (draft) {
      // Commit the draft rectangle if it is big enough.
      if (draft.w > 0.01 && draft.h > 0.01) onChange([...annotations, draft]);
      setDraft(null);
    }
    drag.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endDrag);
  };

  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const { nx, ny } = norm(e);
    if (d.mode === 'create' && draft) {
      setDraft({ ...draft, x: Math.min(d.startX, nx), y: Math.min(d.startY, ny), w: Math.abs(nx - d.startX), h: Math.abs(ny - d.startY) });
    } else if (d.mode === 'move') {
      onChange(annotations.map((a) => a.id === d.id ? { ...a, x: Math.max(0, d.origX + (nx - d.startX)), y: Math.max(0, d.origY + (ny - d.startY)) } : a));
    }
  };

  const onContainerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const { nx, ny } = norm(e);
    if (tool === 'text') {
      const a: Annotation = { id: uid('an'), type: 'text', x: nx, y: ny, w: 0.25, h: 0.05, color, text: 'Text', fontSize: DEFAULT_FONT };
      onChange([...annotations, a]);
      onSelect(a.id);
      return;
    }
    if (tool === 'highlight' || tool === 'box') {
      const a: Annotation = { id: uid('an'), type: tool as AnnotationType, x: nx, y: ny, w: 0, h: 0, color };
      setDraft(a);
      drag.current = { mode: 'create', id: a.id, startX: nx, startY: ny, origX: nx, origY: ny };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', endDrag);
      return;
    }
    onSelect(null); // select tool, empty click
  };

  const onAnnDown = (e: React.PointerEvent, a: Annotation) => {
    e.stopPropagation();
    onSelect(a.id);
    if (tool !== 'select') return;
    const { nx, ny } = norm(e);
    drag.current = { mode: 'move', id: a.id, startX: nx, startY: ny, origX: a.x, origY: a.y };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
  };

  const editText = (a: Annotation) => {
    const t = window.prompt('Annotation text', a.text ?? '');
    if (t !== null) onChange(annotations.map((x) => x.id === a.id ? { ...x, text: t } : x));
  };

  const render = (a: Annotation) => {
    const sel = a.id === selectedId;
    const base: React.CSSProperties = {
      position: 'absolute', left: `${a.x * 100}%`, top: `${a.y * 100}%`,
      cursor: tool === 'select' ? 'move' : 'default', boxSizing: 'border-box',
    };
    if (a.type === 'text') {
      return (
        <div key={a.id} onPointerDown={(e) => onAnnDown(e, a)} onDoubleClick={() => editText(a)} title="Double-click to edit text"
          style={{ ...base, color: a.color, fontSize: `${(a.fontSize ?? DEFAULT_FONT) * 100}cqh`, fontWeight: 600, whiteSpace: 'nowrap', outline: sel ? '1px dashed var(--accent)' : 'none', padding: 1 }}>
          {a.text || 'Text'}
        </div>
      );
    }
    return (
      <div key={a.id} onPointerDown={(e) => onAnnDown(e, a)}
        style={{ ...base, width: `${a.w * 100}%`, height: `${a.h * 100}%`,
          background: a.type === 'highlight' ? a.color : 'transparent', opacity: a.type === 'highlight' ? 0.35 : 1,
          border: a.type === 'box' ? `2px solid ${a.color}` : 'none', outline: sel ? '1px dashed var(--accent)' : 'none' }} />
    );
  };

  return (
    <div
      ref={ref}
      onPointerDown={onContainerDown}
      style={{ position: 'relative', containerType: 'size', lineHeight: 1, userSelect: 'none', touchAction: 'none', cursor: tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair' }}
    >
      <img src={imgUrl} alt="Selected page" style={{ width: '100%', display: 'block', borderRadius: 4, boxShadow: 'var(--shadow)' }} draggable={false} />
      {annotations.map(render)}
      {draft && render(draft)}
    </div>
  );
}
