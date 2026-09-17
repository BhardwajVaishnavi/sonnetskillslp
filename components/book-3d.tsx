"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { BookHandle } from "@/lib/book-scene";

// A glossy 3D hardcover. three.js is only imported once the book is near the
// viewport, and the render loop pauses whenever it scrolls out of view. The
// flat mockup shows until the first 3D frame is ready (or if WebGL is missing).
export function Book3D({ className = "", sizes = "112px" }: { className?: string; sizes?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let handle: BookHandle | null = null;
    let loading = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        if (handle) return handle.setActive(visible);
        if (!visible || loading) return;
        loading = true;
        import("@/lib/book-scene")
          .then(({ mountBook }) => {
            if (!disposed) handle = mountBook(el, () => setReady(true));
          })
          .catch(() => {});
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      disposed = true;
      io.disconnect();
      handle?.dispose();
    };
  }, []);

  return (
    <div ref={host} className={`relative shrink-0 ${className}`}>
      {!ready && (
        <Image
          src="/book-mockup.png"
          width={1024}
          height={1536}
          sizes={sizes}
          alt="50 AI Agents for Real Businesses playbook"
          className="book-shadow absolute inset-0 m-auto h-full w-auto"
        />
      )}
    </div>
  );
}
