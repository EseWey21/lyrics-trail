// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { VERSES } from "./data/lyrics.js";

function estimateDurationMs(text) {
  // Duración basada en caracteres (ajustable):
  // ~45 ms por carácter, mínimo 2200 ms, máximo 8000 ms
  const perChar = 45;
  const minMs = 2200;
  const maxMs = 8000;
  const raw = text.replace(/\s+/g, " ").trim();
  const ms = raw.length * perChar;
  return Math.max(minMs, Math.min(maxMs, ms));
}

function VerseTrail({ text, keySeed }) {
  // Divide en caracteres y aplica delay incremental
  const chars = Array.from(text);
  return (
    <div className="verse" aria-live="polite" key={keySeed}>
      {chars.map((ch, i) => (
        <span
          className="trail-char"
          style={{ "--i": i }}
          key={keySeed + "-" + i}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [idx, setIdx] = useState(0);
  const [prevText, setPrevText] = useState(null);

  const schedule = useMemo(() => VERSES.map(estimateDurationMs), []);
  const startedAt = useRef(0);
  const nextAt = useRef(0);
  const idxRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
    idxRef.current = 0;
    nextAt.current = schedule[0];

    const loop = (t) => {
      const elapsed = t - startedAt.current;

      // Avanza todos los versos que ya “vencieron”
      while (
        elapsed >= nextAt.current &&
        idxRef.current < VERSES.length - 1
      ) {
        setPrevText(VERSES[idxRef.current]); // dispara salida del anterior
        idxRef.current += 1;
        setIdx(idxRef.current);
        nextAt.current += schedule[idxRef.current];

        // Limpia el verso saliente tras la animación
        setTimeout(() => setPrevText(null), 600);
      }

      if (idxRef.current < VERSES.length - 1) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [schedule]);

  return (
    <main className="app" style={{ display: "grid", placeItems: "center", minHeight: "100svh" }}>
      <div className="lyrics-frame">
        {prevText && (
          <div className="verse float-out" aria-hidden="true">
            {prevText}
          </div>
        )}
        <VerseTrail text={VERSES[idx]} keySeed={`v-${idx}`} />
      </div>
    </main>
  );
}
