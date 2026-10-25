import { useEffect, useRef } from 'react';

// Inline click-to-edit used directly on the rendered resume. It edits the SAME
// structured data as the side panel — there is no second copy. Uncontrolled
// contentEditable (text set via ref only while unfocused) keeps the caret
// stable; blur or Enter commits.

interface EditableProps {
  value: string;
  editing: boolean;
  onCommit: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  as?: 'span' | 'div';
}

export function Editable({ value, editing, onCommit, multiline = false, placeholder, className, as = 'span' }: EditableProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value, editing]);

  if (!editing) {
    const Tag = as;
    return <Tag className={className}>{value || placeholder || ''}</Tag>;
  }

  const Tag = as;
  return (
    <Tag
      ref={ref as never}
      className={`r-editable ${className ?? ''}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder || 'Editable text'}
      data-empty={value ? undefined : 'true'}
      data-placeholder={placeholder}
      onFocus={(e) => { if (!e.currentTarget.textContent) e.currentTarget.textContent = value; }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === 'Escape') {
          (e.currentTarget as HTMLElement).textContent = value;
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? '').replace(/ /g, ' ').trim();
        if (next !== value) onCommit(next);
      }}
    />
  );
}
