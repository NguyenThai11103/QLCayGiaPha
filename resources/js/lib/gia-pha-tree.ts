import { Nguoi } from '../services/gia-pha.api';

// ─── Family Tree ─────────────────────────────────────────────────────────────

export interface FamilyNode {
    id: string;
    members: Nguoi[];
    children: FamilyNode[];
    childIds: Set<number>;
}

function sortMembers(members: Nguoi[]) {
    return [...members].sort((a, b) => {
        if (a.gioi_tinh !== b.gioi_tinh) return a.gioi_tinh === 'nam' ? -1 : 1;
        return a.id - b.id;
    });
}

export function buildFamilyTree(people: Nguoi[]): FamilyNode[] {
    const byId = new Map(people.map((p) => [p.id, p]));
    const familyByKey = new Map<string, FamilyNode>();
    const personKey = new Map<number, string>();

    const ensure = (key: string, members: Nguoi[]): FamilyNode => {
        const ex = familyByKey.get(key);
        if (ex) return ex;
        const f: FamilyNode = { id: key, members: sortMembers(members), children: [], childIds: new Set() };
        familyByKey.set(key, f);
        f.members.forEach((m) => personKey.set(m.id, key));
        return f;
    };

    people.forEach((p) => {
        if (personKey.has(p.id)) return;
        const spouseId = (p.vo_chong_ids || []).find((id) => byId.has(id));
        const spouse = spouseId ? byId.get(spouseId) : null;
        if (spouse && !personKey.has(spouse.id)) {
            const ids = [p.id, spouse.id].sort((a, b) => a - b);
            ensure(`couple-${ids[0]}-${ids[1]}`, [p, spouse]);
        } else {
            ensure(`single-${p.id}`, [p]);
        }
    });

    const getFam = (p: Nguoi) => {
        const k = personKey.get(p.id);
        return k ? familyByKey.get(k)! : ensure(`single-${p.id}`, [p]);
    };

    const childKeys = new Set<string>();
    people.forEach((p) => {
        const fa = p.id_cha ? byId.get(p.id_cha) : null;
        const mo = p.id_me ? byId.get(p.id_me) : null;
        if (!fa && !mo) return;
        const childFam = getFam(p);
        const faKey = fa ? personKey.get(fa.id) : null;
        const moKey = mo ? personKey.get(mo.id) : null;
        const pms = [fa, mo].filter(Boolean) as Nguoi[];
        const parFam = faKey && faKey === moKey
            ? familyByKey.get(faKey)!
            : pms.length === 1
              ? getFam(pms[0])
              : ensure(`parents-${pms.map((x) => x.id).sort((a, b) => a - b).join('-')}`, pms);
        if (parFam.id !== childFam.id && !parFam.childIds.has(childFam.members[0].id)) {
            parFam.children.push(childFam);
            parFam.childIds.add(childFam.members[0].id);
            childKeys.add(childFam.id);
        }
    });

    return [...familyByKey.values()]
        .filter((f) => !childKeys.has(f.id))
        .sort((a, b) => a.members[0].id - b.members[0].id);
}

// ─── Kinship engine ──────────────────────────────────────────────────────────

export interface KinshipResult {
    loai: string;
    aTuongQuanB: string;
    bTuongQuanA: string;
    buoc: string[];
}

export const LOAI_COLOR: Record<string, string> = {
    'Hôn nhân'               : '#10b981',
    'Trực hệ'                : '#059669',
    'Anh chị em'             : '#8b5cf6',
    'Chú bác cô dì'          : '#0ea5e9',
    'Họ hàng'                : '#10b981',
    'Hôn nhân - Huyết thống' : '#10b981',
    'Không xác định'         : '#9ca3af',
    'Bản thân'               : '#9ca3af',
};

function pathToRoot(id: number, map: Map<number, Nguoi>): number[] {
    const path: number[] = [];
    let cur: number | null = id;
    const vis = new Set<number>();
    while (cur != null && map.has(cur) && !vis.has(cur)) {
        vis.add(cur); path.push(cur); cur = map.get(cur)!.id_cha ?? null;
    }
    return path;
}

function bloodRelation(a: Nguoi, b: Nguoi, dA: number, dB: number): Pick<KinshipResult, 'loai' | 'aTuongQuanB' | 'bTuongQuanA'> {
    if (dA === 0 && dB === 0) return { loai: 'Bản thân', aTuongQuanB: 'Chính mình', bTuongQuanA: 'Chính mình' };
    if (dA === 0) {
        const labels: Record<number, [string, string]> = { 1: ['Con', 'Cha/Mẹ'], 2: ['Cháu', 'Ông/Bà'], 3: ['Chắt', 'Cụ'], 4: ['Chút', 'Kỵ'] };
        const [ab, ba] = labels[dB] || [`Hậu duệ đời ${dB}`, `Tổ tiên đời ${dB}`];
        return { loai: 'Trực hệ', aTuongQuanB: ab, bTuongQuanA: ba };
    }
    if (dB === 0) {
        const labels: Record<number, [string, string]> = { 1: ['Cha/Mẹ', 'Con'], 2: ['Ông/Bà', 'Cháu'], 3: ['Cụ', 'Chắt'], 4: ['Kỵ', 'Chút'] };
        const [ab, ba] = labels[dA] || [`Tổ tiên đời ${dA}`, `Hậu duệ đời ${dA}`];
        return { loai: 'Trực hệ', aTuongQuanB: ab, bTuongQuanA: ba };
    }
    if (dA === 1 && dB === 1) return { loai: 'Anh chị em', aTuongQuanB: 'Anh/Chị/Em', bTuongQuanA: 'Anh/Chị/Em' };
    if (dA === 1 && dB === 2) return { loai: 'Chú bác cô dì', aTuongQuanB: a.gioi_tinh === 'nam' ? 'Chú/Bác' : 'Cô', bTuongQuanA: 'Cháu' };
    if (dA === 2 && dB === 1) return { loai: 'Chú bác cô dì', aTuongQuanB: 'Cháu', bTuongQuanA: b.gioi_tinh === 'nam' ? 'Chú/Bác' : 'Cô' };
    if (dA === dB) return { loai: 'Họ hàng', aTuongQuanB: 'Anh/Chị/Em họ', bTuongQuanA: 'Anh/Chị/Em họ' };
    const diff = Math.abs(dA - dB);
    if (dA > dB) return { loai: 'Họ hàng', aTuongQuanB: diff === 1 ? 'Cháu họ' : 'Hậu duệ họ', bTuongQuanA: diff === 1 ? 'Chú/Bác/Cô họ' : 'Ông/Bà họ' };
    return { loai: 'Họ hàng', aTuongQuanB: diff === 1 ? 'Chú/Bác/Cô họ' : 'Ông/Bà họ', bTuongQuanA: diff === 1 ? 'Cháu họ' : 'Hậu duệ họ' };
}

export function tinhDanhXung(a: Nguoi, b: Nguoi, all: Nguoi[]): KinshipResult {
    const map = new Map(all.map((p) => [p.id, p]));
    if ((a.vo_chong_ids || []).includes(b.id)) {
        return { loai: 'Hôn nhân', aTuongQuanB: a.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng', bTuongQuanA: b.gioi_tinh === 'nam' ? 'Vợ' : 'Chồng', buoc: [`${a.ten_day_du} và ${b.ten_day_du} là vợ chồng.`] };
    }
    const pA = pathToRoot(a.id, map);
    const pB = pathToRoot(b.id, map);
    let lcaId: number | null = null; let dA = 0, dB = 0;
    for (let i = 0; i < pA.length; i++) { const j = pB.indexOf(pA[i]); if (j !== -1) { lcaId = pA[i]; dA = i; dB = j; break; } }
    if (lcaId == null) return { loai: 'Không xác định', aTuongQuanB: '—', bTuongQuanA: '—', buoc: ['Không tìm được quan hệ giữa hai người.'] };
    const rel = bloodRelation(a, b, dA, dB);
    const lcaName = map.get(lcaId)?.ten_day_du || '';
    const buoc: string[] = [];
    if (dA === 0) buoc.push(`${b.ten_day_du} là hậu duệ đời ${dB} của ${a.ten_day_du}.`);
    else if (dB === 0) buoc.push(`${a.ten_day_du} là hậu duệ đời ${dA} của ${b.ten_day_du}.`);
    else buoc.push(`Tổ tiên chung gần nhất: ${lcaName} (cách A ${dA} đời, cách B ${dB} đời).`);
    return { ...rel, buoc };
}
