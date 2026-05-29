import type { MouseEvent, RefObject } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import type { Nguoi } from '../../../../services/gia-pha.api';
import type { FamilyNode, GenerationPosition } from '../types';
import FamilyCard, { RootCard } from './FamilyCard';
import Minimap from './Minimap';

type FamilyTreeProps = {
    loading: boolean;
    treeData: FamilyNode[];
    zoom: number;
    genPositions: GenerationPosition[];
    searchTerm: string;
    bloodlineOnly: boolean;
    selectedPerson: Nguoi | null;
    isDraggingTree: boolean;
    canManage: boolean;
    treeViewportRef: RefObject<HTMLElement | null>;
    treeScaleRef: RefObject<HTMLDivElement | null>;
    onMouseDown: (event: MouseEvent<HTMLElement>) => void;
    onMouseMove: (event: MouseEvent<HTMLElement>) => void;
    onMouseUp: () => void;
    onSelectPerson: (person: Nguoi) => void;
    onAddFirstMember: () => void;
};

export default function FamilyTree({
    loading,
    treeData,
    zoom,
    genPositions,
    searchTerm,
    bloodlineOnly,
    selectedPerson,
    isDraggingTree,
    canManage,
    treeViewportRef,
    treeScaleRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onSelectPerson,
    onAddFirstMember,
}: FamilyTreeProps) {
    return (
        <>
            <section
                ref={treeViewportRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                className="dot-grid relative min-h-[680px] flex-1 overflow-auto"
                style={{ cursor: isDraggingTree ? 'grabbing' : 'grab', userSelect: isDraggingTree ? 'none' : undefined }}
            >
                {/* Radial glow overlay */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,241,212,0.7),transparent_52%)]" />

                {loading ? (
                    <LoadingSkeleton />
                ) : treeData.length === 0 ? (
                    <EmptyState canManage={canManage} onAddFirstMember={onAddFirstMember} />
                ) : (
                    <div className="relative flex w-max min-w-full justify-center p-12">
                        <div
                            ref={treeScaleRef}
                            className="relative origin-top transition-transform duration-200"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            {/* Generation floating labels */}
                            {genPositions.map(({ level, top, left }, idx) => (
                                <div
                                    key={level}
                                    className="gp-float-in absolute z-30 flex items-center gap-1.5 rounded-full border border-[var(--gold-pale)] bg-[var(--card)] px-3 py-1.5 text-[10.5px] font-bold text-[var(--gold)] shadow-sm select-none"
                                    style={{
                                        top: `${top}px`,
                                        left: `${left}px`,
                                        transform: 'translateY(-50%)',
                                        animationDelay: `${idx * 40}ms`,
                                    }}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] opacity-80" />
                                    Đời {level}
                                </div>
                            ))}

                            <RootCard />
                            <div className="flex justify-center gap-10">
                                {treeData.map((rootNode) => (
                                    <div key={rootNode.id} id={`family-node-${rootNode.id}`}>
                                        <FamilyCard
                                            family={rootNode}
                                            level={1}
                                            searchTerm={searchTerm}
                                            bloodlineOnly={bloodlineOnly}
                                            selectedPerson={selectedPerson}
                                            onSelect={onSelectPerson}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {treeData.length > 0 && <Minimap viewportRef={treeViewportRef} />}
        </>
    );
}

function LoadingSkeleton() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
            {/* Spinner */}
            <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--gold-pale)] border-t-[var(--gold)]" />
                <div className="absolute inset-0 rounded-full bg-[var(--gold-glow)] opacity-30 blur-md" />
            </div>
            <div className="flex flex-col items-center gap-1">
                <div className="text-[14px] font-semibold text-[var(--ink-soft)]">Đang tải cây gia phả...</div>
                <div className="text-[12px] text-[var(--ink-mute)]">Vui lòng chờ trong giây lát</div>
            </div>

            {/* Skeleton cards */}
            <div className="flex items-start gap-8 opacity-40">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                        <div
                            className="gp-shimmer h-20 w-36 rounded-2xl"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                        <div className="flex gap-4">
                            {[0, 1].map((j) => (
                                <div
                                    key={j}
                                    className="gp-shimmer h-16 w-32 rounded-2xl"
                                    style={{ animationDelay: `${(i * 2 + j) * 120}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ canManage, onAddFirstMember }: { canManage: boolean; onAddFirstMember: () => void }) {
    return (
        <div className="absolute inset-0 grid place-items-center p-6">
            <div className="gp-card flex max-w-sm flex-col items-center gap-4 p-10 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--gold-glow)] text-[var(--gold)]">
                    <Icon name="tree" size={38} />
                </div>
                <div>
                    <h2 className="font-serif text-2xl font-semibold text-[var(--ink)]">Chưa có dữ liệu</h2>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--ink-mute)]">
                        Hãy thêm thành viên đầu tiên để hiển thị sơ đồ gia phả.
                    </p>
                </div>
                {canManage && (
                    <button type="button" onClick={onAddFirstMember} className="gp-btn gp-btn-primary mt-1 w-full">
                        <Icon name="plus" size={16} />
                        Thêm thành viên đầu tiên
                    </button>
                )}
            </div>
        </div>
    );
}
