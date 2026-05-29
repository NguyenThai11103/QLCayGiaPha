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
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,241,212,0.8),transparent_48%)]" />
                {loading ? (
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold-pale)] border-t-[var(--gold)]" />
                            <div className="mt-3 text-sm font-semibold text-[var(--ink-mute)]">Đang tải dữ liệu cây gia phả...</div>
                        </div>
                    </div>
                ) : treeData.length === 0 ? (
                    <div className="absolute inset-0 grid place-items-center p-6">
                        <div className="gp-card max-w-md p-8 text-center">
                            <Icon name="tree" size={36} className="mx-auto text-[var(--gold)]" />
                            <h2 className="mt-4 font-serif text-3xl font-semibold">Chưa có dữ liệu</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--ink-mute)]">Hãy thêm thành viên đầu tiên để hiển thị sơ đồ gia phả.</p>
                            {canManage && (
                                <button type="button" onClick={onAddFirstMember} className="gp-btn gp-btn-primary mt-5">
                                    Thêm thành viên
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative flex w-max min-w-full justify-center p-10">
                        <div
                            ref={treeScaleRef}
                            className="relative origin-top transition-transform duration-200"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            {genPositions.map(({ level, top, left }) => (
                                <div
                                    key={level}
                                    className="absolute z-30 flex items-center gap-2 rounded-lg border border-[var(--gold-pale)] bg-[var(--card)] px-3 py-1.5 text-xs font-bold text-[var(--gold)] shadow-sm transition-all duration-200 select-none"
                                    style={{
                                        top: `${top}px`,
                                        left: `${left}px`,
                                        transform: 'translateY(-50%)',
                                    }}
                                >
                                    <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
                                    Đời {level}
                                </div>
                            ))}

                            <RootCard />
                            <div className="flex justify-center gap-12">
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
