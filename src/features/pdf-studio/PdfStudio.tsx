import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadSource, renderThumb, buildPdf, downloadBytes, PdfError, type PdfSource, type PageRef, type Annotation } from '../../services/pdf/pdfStudio';
import { safeFilename } from '../../services/exports/backup';
import { uid } from '../../core/models/factory';
import { Icon } from '../../components/ui/Icon';
import { AnnotationLayer, type Tool } from './AnnotationLayer';

export function PdfStudio() {
  const sources = useRef<Map<string, PdfSource>>(new Map());
  const [pages, setPages] = useState<PageRef[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState('document');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Map<string, Annotation[]>>(new Map());
  const [tool, setTool] = useState<Tool>('select');
  const [annColor, setAnnColor] = useState('#dc2626');
  const [selAnn, setSelAnn] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const mergeRef = useRef<HTMLInputElement>(null);

  const thumbKey = (p: PageRef) => `${p.srcId}:${p.index}:${p.rotation}`;

  // Render any missing thumbnails (sequentially to limit memory).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const p of pages) {
        const key = thumbKey(p);
        if (thumbs.has(key)) continue;
        const src = sources.current.get(p.srcId);
        if (!src) continue;
        try {
          const url = await renderThumb(src, p, 150);
          if (cancelled) return;
          setThumbs((prev) => new Map(prev).set(key, url));
        } catch { /* skip a bad page */ }
      }
    })();
    return () => { cancelled = true; };
  }, [pages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render the larger active-page preview.
  useEffect(() => {
    let cancelled = false;
    const p = pages.find((x) => x.id === activeId);
    if (!p) { setActiveUrl(null); return; }
    const src = sources.current.get(p.srcId);
    if (!src) return;
    (async () => {
      try {
        const url = await renderThumb(src, p, 560);
        if (!cancelled) setActiveUrl(url);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [activeId, pages]);

  const onImport = async (file: File, merge: boolean) => {
    setError(null);
    setBusy(merge ? 'Adding pages…' : 'Opening PDF…');
    try {
      const { source, pages: newPages } = await loadSource(file);
      sources.current.set(source.id, source);
      setPages((prev) => (merge ? [...prev, ...newPages] : newPages));
      if (!merge) { setDocName(file.name.replace(/\.pdf$/i, '')); setActiveId(newPages[0]?.id ?? null); }
    } catch (e) {
      setError(e instanceof PdfError ? e.message : 'Could not open this PDF.');
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectedPages = () => pages.filter((p) => selected.has(p.id));

  const rotate = (dir: 1 | -1) => setPages((prev) => prev.map((p) => (selected.size === 0 || selected.has(p.id)) ? { ...p, rotation: ((p.rotation + dir * 90) % 360 + 360) % 360 } : p));
  const rotateOne = (id: string, dir: 1 | -1) => setPages((prev) => prev.map((p) => p.id === id ? { ...p, rotation: ((p.rotation + dir * 90) % 360 + 360) % 360 } : p));
  const dropAnns = (ids: Set<string>) => setAnnotations((prev) => { const n = new Map(prev); for (const id of ids) n.delete(id); return n; });
  const removeSel = () => { dropAnns(selected); setPages((prev) => prev.filter((p) => !selected.has(p.id))); setSelected(new Set()); };
  const removeOne = (id: string) => { dropAnns(new Set([id])); setPages((prev) => prev.filter((p) => p.id !== id)); setSelected((s) => { const n = new Set(s); n.delete(id); return n; }); };

  const pageAnns = (id: string) => annotations.get(id) ?? [];
  const setPageAnns = (id: string, next: Annotation[]) => setAnnotations((prev) => { const n = new Map(prev); next.length ? n.set(id, next) : n.delete(id); return n; });
  const deleteSelectedAnn = () => { if (activeId && selAnn) { setPageAnns(activeId, pageAnns(activeId).filter((a) => a.id !== selAnn)); setSelAnn(null); } };
  const duplicateOne = (id: string) => setPages((prev) => {
    const i = prev.findIndex((p) => p.id === id);
    if (i < 0) return prev;
    const copy = { ...prev[i], id: uid('pg') };
    return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
  });
  const move = (id: string, dir: -1 | 1) => setPages((prev) => {
    const i = prev.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= prev.length) return prev;
    const copy = prev.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  const exportPages = useCallback(async (which: PageRef[], suffix: string) => {
    if (which.length === 0) { setError('No pages to export.'); return; }
    setError(null);
    setBusy('Building PDF…');
    try {
      const bytes = await buildPdf(sources.current, which, annotations);
      downloadBytes(safeFilename(`${docName}-${suffix}`, 'pdf'), bytes);
    } catch {
      setError('Could not build the PDF.');
    } finally {
      setBusy(null);
    }
  }, [docName, annotations]);

  const hasDoc = pages.length > 0;

  return (
    <div className="content content-wide" style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 18px 60px' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div className="row" style={{ gap: 10 }}>
          <Link className="btn btn-sm btn-ghost btn-icon" to="/" aria-label="Back to dashboard"><Icon name="home" /></Link>
          <div>
            <h1 style={{ fontSize: 20 }}>PDF Studio</h1>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>Reorder, rotate, delete, duplicate, extract, merge and split PDF pages — all in your browser.</p>
          </div>
        </div>
        {busy && <span className="save-pill"><span className="save-dot saving" />{busy}</span>}
      </div>

      {error && <div className="card" style={{ padding: 10, marginBottom: 12, borderColor: 'var(--danger)' }}><span className="sev-error" style={{ fontSize: 13 }}><Icon name="alert" size={14} /> {error}</span></div>}

      {!hasDoc ? (
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Open a PDF to begin</div>
          <p className="muted" style={{ marginTop: 0 }}>Everything happens locally. Your file is never uploaded.</p>
          <button className="btn btn-primary" onClick={() => importRef.current?.click()}><Icon name="upload" size={15} /> Open a PDF</button>
          <input ref={importRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f, false); e.target.value = ''; }} />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="card no-print" style={{ padding: 10, marginBottom: 14, position: 'sticky', top: 62, zIndex: 20 }}>
            <div className="row-wrap" style={{ gap: 8 }}>
              <span className="badge badge-coming-soon" style={{ textTransform: 'none' }}>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
              <span className="faint" style={{ fontSize: 12.5 }}>{selected.size ? `${selected.size} selected` : 'no selection — actions apply to all'}</span>
              <span className="spacer" />
              <button className="btn btn-sm" onClick={() => rotate(-1)} title="Rotate left"><Icon name="chevron-up" size={14} style={{ transform: 'rotate(-90deg)' }} /> Rotate L</button>
              <button className="btn btn-sm" onClick={() => rotate(1)} title="Rotate right"><Icon name="chevron-up" size={14} style={{ transform: 'rotate(90deg)' }} /> Rotate R</button>
              <button className="btn btn-sm btn-danger" onClick={removeSel} disabled={selected.size === 0}><Icon name="trash" size={14} /> Delete</button>
              <button className="btn btn-sm" onClick={() => exportPages(selectedPages(), 'extract')} disabled={selected.size === 0} title="Export selected pages as a new PDF"><Icon name="download" size={14} /> Extract selected</button>
              <button className="btn btn-sm btn-ghost" onClick={() => mergeRef.current?.click()}><Icon name="plus" size={14} /> Merge PDF</button>
              <button className="btn btn-sm btn-primary" onClick={() => exportPages(pages, 'edited')}><Icon name="download" size={14} /> Export document</button>
              <input ref={mergeRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f, true); e.target.value = ''; }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0, 420px)', gap: 16, alignItems: 'start' }}>
            {/* Page grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {pages.map((p, i) => {
                const url = thumbs.get(thumbKey(p));
                const isSel = selected.has(p.id);
                return (
                  <div key={p.id} className="card" style={{ padding: 8, outline: isSel ? '2px solid var(--accent)' : 'none', outlineOffset: -1 }}>
                    <button
                      onClick={() => { toggle(p.id); setActiveId(p.id); }}
                      aria-pressed={isSel}
                      aria-label={`Page ${i + 1}${isSel ? ', selected' : ''}`}
                      style={{ display: 'block', width: '100%', border: 'none', background: '#f4f5f7', borderRadius: 4, padding: 0, cursor: 'pointer', aspectRatio: '0.75', overflow: 'hidden' }}
                    >
                      {url
                        ? <img src={url} alt={`Page ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <span className="faint" style={{ fontSize: 12, display: 'grid', placeItems: 'center', height: '100%' }}>rendering…</span>}
                    </button>
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                      <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>#{i + 1}{pageAnns(p.id).length > 0 && <span title="Has annotations" style={{ color: 'var(--accent)' }}> ●</span>}</span>
                      <div className="row" style={{ gap: 2 }}>
                        <button className="btn btn-sm btn-ghost btn-icon" aria-label="Move left" disabled={i === 0} onClick={() => move(p.id, -1)}><Icon name="chevron-up" size={13} style={{ transform: 'rotate(-90deg)' }} /></button>
                        <button className="btn btn-sm btn-ghost btn-icon" aria-label="Move right" disabled={i === pages.length - 1} onClick={() => move(p.id, 1)}><Icon name="chevron-down" size={13} style={{ transform: 'rotate(-90deg)' }} /></button>
                        <button className="btn btn-sm btn-ghost btn-icon" aria-label="Rotate" onClick={() => rotateOne(p.id, 1)}><Icon name="settings" size={13} /></button>
                        <button className="btn btn-sm btn-ghost btn-icon" aria-label="Duplicate" onClick={() => duplicateOne(p.id)}><Icon name="copy" size={13} /></button>
                        <button className="btn btn-sm btn-ghost btn-icon btn-danger" aria-label="Delete" onClick={() => removeOne(p.id)}><Icon name="trash" size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preview + annotations */}
            <div className="card" style={{ padding: 12, position: 'sticky', top: 130 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Preview & annotate</div>
                <input type="color" aria-label="Annotation colour" value={annColor} onChange={(e) => setAnnColor(e.target.value)} style={{ width: 24, height: 24, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
              </div>
              <div className="seg" role="group" aria-label="Annotation tool" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                {(['select', 'text', 'highlight', 'box'] as Tool[]).map((t) => (
                  <button key={t} className={tool === t ? 'active' : ''} onClick={() => setTool(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
                ))}
              </div>
              {activeId && (
                <div className="row" style={{ marginBottom: 8, gap: 8 }}>
                  <span className="faint" style={{ fontSize: 12 }}>{pageAnns(activeId).length} annotation{pageAnns(activeId).length !== 1 ? 's' : ''} on this page</span>
                  <span className="spacer" />
                  <button className="btn btn-sm btn-ghost btn-danger" disabled={!selAnn} onClick={deleteSelectedAnn}><Icon name="trash" size={13} /> Delete</button>
                </div>
              )}
              {activeUrl && activeId
                ? <AnnotationLayer imgUrl={activeUrl} annotations={pageAnns(activeId)} tool={tool} color={annColor} selectedId={selAnn} onSelect={setSelAnn} onChange={(next) => setPageAnns(activeId, next)} />
                : <p className="faint" style={{ fontSize: 13 }}>Click a page to preview and annotate it.</p>}
              <p className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
                Text / highlight / box draw an overlay on top of the page — they do not remove the original content. Overlays
                are baked into the exported PDF. For upright pages the placement is exact.
              </p>
            </div>
          </div>

          <p className="muted" style={{ fontSize: 12.5, marginTop: 16 }}>
            <Icon name="info" size={13} /> This edits page structure (order, rotation, which pages are included) and merges files. Editing text inside a PDF,
            annotations and OCR are planned — they appear as “Coming soon” until implemented.
          </p>
        </>
      )}
    </div>
  );
}
