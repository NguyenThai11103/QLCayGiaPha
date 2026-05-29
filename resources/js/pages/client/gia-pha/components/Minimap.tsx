import { MouseEvent, RefObject, useEffect, useState } from 'react';

type MinimapProps = {
    viewportRef: RefObject<HTMLElement | null>;
};

export default function Minimap({ viewportRef }: MinimapProps) {
    const [viewportProps, setViewportProps] = useState({
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 1,
        scrollHeight: 1,
        clientWidth: 1,
        clientHeight: 1,
    });

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return undefined;
        }

        const update = () => {
            setViewportProps({
                scrollLeft: viewport.scrollLeft,
                scrollTop: viewport.scrollTop,
                scrollWidth: Math.max(viewport.scrollWidth, 1),
                scrollHeight: Math.max(viewport.scrollHeight, 1),
                clientWidth: Math.max(viewport.clientWidth, 1),
                clientHeight: Math.max(viewport.clientHeight, 1),
            });
        };

        viewport.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        const timeout = window.setTimeout(update, 500);
        const observer = new MutationObserver(update);
        observer.observe(viewport, { childList: true, subtree: true });

        return () => {
            viewport.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            window.clearTimeout(timeout);
            observer.disconnect();
        };
    }, [viewportRef]);

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = viewportProps;
    const canScrollH = scrollWidth > clientWidth * 1.1;
    const canScrollV = scrollHeight > clientHeight * 1.1;

    if (!canScrollH && !canScrollV) {
        return null;
    }

    const maxWidth = 240;
    const maxHeight = 160;
    const scale = Math.min(maxWidth / scrollWidth, maxHeight / scrollHeight);
    const mapWidth = Math.max(scrollWidth * scale, 60);
    const mapHeight = Math.max(scrollHeight * scale, 40);
    const scaleX = mapWidth / scrollWidth;
    const scaleY = mapHeight / scrollHeight;
    const viewWidth = Math.max(clientWidth * scaleX, 4);
    const viewHeight = Math.max(clientHeight * scaleY, 4);
    const viewLeft = Math.min(scrollLeft * scaleX, mapWidth - viewWidth);
    const viewTop = Math.min(scrollTop * scaleY, mapHeight - viewHeight);

    const handleDrag = (event: MouseEvent<HTMLDivElement>) => {
        if (event.buttons !== 1) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(event.clientX - rect.left, mapWidth));
        const y = Math.max(0, Math.min(event.clientY - rect.top, mapHeight));
        const targetScrollLeft = x / scaleX - clientWidth / 2;
        const targetScrollTop = y / scaleY - clientHeight / 2;

        viewportRef.current?.scrollTo({ left: targetScrollLeft, top: targetScrollTop });
    };

    return (
        <div className="fixed right-6 bottom-6 z-30 hidden overflow-hidden rounded-xl border border-white/20 bg-slate-900/60 shadow-xl backdrop-blur-md hover:bg-slate-900/80 sm:block">
            <div className="px-2 pt-1.5 pb-1 text-[10px] font-bold tracking-widest text-white/50 uppercase">Bản đồ</div>
            <div className="px-2 pb-2">
                <div
                    className="relative cursor-crosshair rounded-md border border-white/10 bg-white/5"
                    style={{ width: mapWidth, height: mapHeight }}
                    onMouseMove={handleDrag}
                    onMouseDown={handleDrag}
                >
                    <div
                        className="pointer-events-none absolute rounded border border-[var(--gold)] bg-[var(--gold-glow)] transition-all duration-75"
                        style={{
                            width: viewWidth,
                            height: viewHeight,
                            left: viewLeft,
                            top: viewTop,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
