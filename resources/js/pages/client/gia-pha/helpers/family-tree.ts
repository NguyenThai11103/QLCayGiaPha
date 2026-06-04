import type { Nguoi, NguoiPayload } from '../../../../services/gia-pha.api';
import type { FamilyNode, FormState } from '../types';

const toNullableNumber = (value: string) => (value ? Number(value) : null);
const toNullableString = (value: string) => (value.trim() ? value.trim() : null);

export const getMemberById = (members: Nguoi[], id: string | number | null) => {
    if (!id) {
        return undefined;
    }

    return members.find((member) => member.id === Number(id));
};

const isAncestorOf = (members: Nguoi[], possibleAncestorId: string | number | null, memberId: string | number | null) => {
    if (!possibleAncestorId || !memberId) {
        return false;
    }

    const ancestorId = Number(possibleAncestorId);
    const visited = new Set<number>();
    const queue = [Number(memberId)];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const current = getMemberById(members, currentId || null);

        if (!current || visited.has(current.id)) {
            continue;
        }

        visited.add(current.id);

        if (current.id_cha === ancestorId || current.id_me === ancestorId) {
            return true;
        }

        if (current.id_cha) {
            queue.push(current.id_cha);
        }

        if (current.id_me) {
            queue.push(current.id_me);
        }
    }

    return false;
};

export const canBeParentPair = (members: Nguoi[], fatherId: string, motherId: string) => {
    if (!fatherId || !motherId) {
        return true;
    }

    return !isAncestorOf(members, fatherId, motherId) && !isAncestorOf(members, motherId, fatherId);
};

export const canSelectAsParent = (members: Nguoi[], candidate: Nguoi, form: FormState, otherParentId: string) => {
    if (candidate.id === form.id) {
        return false;
    }

    if (form.id_dong_ho && String(candidate.id_dong_ho) !== form.id_dong_ho) {
        return false;
    }

    if (form.id && isAncestorOf(members, form.id, candidate.id)) {
        return false;
    }

    if (candidate.ngay_sinh && form.ngay_sinh && new Date(candidate.ngay_sinh) >= new Date(form.ngay_sinh)) {
        return false;
    }

    if (otherParentId) {
        const otherParent = members.find((member) => String(member.id) === otherParentId);
        if (otherParent && !(otherParent.vo_chong_ids || []).includes(candidate.id)) {
            return false;
        }
    }

    return canBeParentPair(members, String(candidate.id), otherParentId);
};

export const canSelectAsSpouse = (members: Nguoi[], candidate: Nguoi, form: FormState) => {
    if (candidate.id === form.id) {
        return false;
    }

    if (candidate.gioi_tinh === form.gioi_tinh) {
        return false;
    }

    if (form.id && (isAncestorOf(members, form.id, candidate.id) || isAncestorOf(members, candidate.id, form.id))) {
        return false;
    }

    return true;
};

export const findSpouseIdFromChildren = (members: Nguoi[], parentId: string, spouseKey: 'id_cha' | 'id_me') => {
    if (!parentId) {
        return '';
    }

    const parentIdNumber = Number(parentId);
    const child = members.find((member) => {
        const hasSelectedParent = member.id_cha === parentIdNumber || member.id_me === parentIdNumber;
        const spouseId = member[spouseKey];

        return hasSelectedParent && spouseId && spouseId !== parentIdNumber && canBeParentPair(members, parentId, String(spouseId));
    });

    return child?.[spouseKey] ? String(child[spouseKey]) : '';
};

export const buildPayload = (form: FormState, isDauRe: boolean): NguoiPayload => ({
    id_dong_ho: Number(form.id_dong_ho),
    ten_day_du: form.ten_day_du.trim(),
    gioi_tinh: form.gioi_tinh,
    ngay_sinh: toNullableString(form.ngay_sinh),
    da_mat: form.da_mat,
    ngay_mat: form.da_mat ? toNullableString(form.ngay_mat) : null,
    id_cha: isDauRe ? null : toNullableNumber(form.id_cha),
    id_me: isDauRe ? null : toNullableNumber(form.id_me),
    id_vo_chong_list: isDauRe ? form.id_vo_chong_list.map((id) => Number(id)).filter((id) => !Number.isNaN(id)) : [],
    tieu_su: toNullableString(form.tieu_su),
    anh_dai_dien: toNullableString(form.anh_dai_dien),
    thu_tu_sinh: isDauRe ? null : toNullableNumber(form.thu_tu_sinh),
});

export const getAncestorPath = (person: Nguoi, people: Nguoi[]): Nguoi[] => {
    const path: Nguoi[] = [];
    let current: Nguoi | undefined = person;
    const visited = new Set<number>();

    while (current && !visited.has(current.id)) {
        visited.add(current.id);
        path.unshift(current);
        current = current.id_cha ? people.find((item) => item.id === current!.id_cha) : undefined;
    }

    return path;
};

export const buildFamilyTree = (people: Nguoi[], selectedDongHo: string) => {
    const peopleById = new Map(people.map((person) => [person.id, person]));
    const bloodlinePeople = people.filter((person) => !selectedDongHo || String(person.id_dong_ho) === selectedDongHo);
    const bloodlineIds = new Set(bloodlinePeople.map((person) => person.id));

    const getSpouses = (person: Nguoi): Nguoi[] => {
        const spouseIds = person.vo_chong_ids || [];

        return spouseIds.map((id) => peopleById.get(id)).filter((spouse): spouse is Nguoi => Boolean(spouse));
    };

    const buildNode = (member: Nguoi, visited = new Set<number>()): FamilyNode => {
        visited.add(member.id);

        const childrenMembers = bloodlinePeople.filter(
            (person) => (person.id_cha === member.id || person.id_me === member.id) && !visited.has(person.id),
        );

        childrenMembers.sort((a, b) => {
            const orderA = a.thu_tu_sinh ? Number(a.thu_tu_sinh) : 999;
            const orderB = b.thu_tu_sinh ? Number(b.thu_tu_sinh) : 999;

            return orderA - orderB;
        });

        return {
            id: `node-${member.id}`,
            member,
            spouses: getSpouses(member),
            children: childrenMembers.map((child) => buildNode(child, new Set(visited))),
        };
    };

    const rootMembers = bloodlinePeople.filter((person) => {
        const hasFatherInBloodline = person.id_cha && bloodlineIds.has(person.id_cha);
        const hasMotherInBloodline = person.id_me && bloodlineIds.has(person.id_me);

        if (hasFatherInBloodline || hasMotherInBloodline) {
            return false;
        }

        const isSpouseOfOtherBloodline = people.some((other) => {
            if (!bloodlineIds.has(other.id) || other.id === person.id) {
                return false;
            }

            const isSpouse = (other.vo_chong_ids || []).includes(person.id);
            if (!isSpouse) {
                return false;
            }

            const otherHasFather = other.id_cha && bloodlineIds.has(other.id_cha);
            const otherHasMother = other.id_me && bloodlineIds.has(other.id_me);

            if (otherHasFather || otherHasMother) {
                return true;
            }

            if (other.gioi_tinh === 'nam' && person.gioi_tinh === 'nu') {
                return true;
            }

            return other.gioi_tinh === person.gioi_tinh && other.id < person.id;
        });

        return !isSpouseOfOtherBloodline;
    });

    const countDescendants = (memberId: number, visited = new Set<number>()): number => {
        if (visited.has(memberId)) {
            return 0;
        }

        visited.add(memberId);

        const children = bloodlinePeople.filter((person) => person.id_cha === memberId || person.id_me === memberId);

        return children.reduce((total, child) => total + 1 + countDescendants(child.id, visited), 0);
    };

    rootMembers.sort((a, b) => {
        const countA = countDescendants(a.id);
        const countB = countDescendants(b.id);

        if (countB !== countA) {
            return countB - countA;
        }

        return a.id - b.id;
    });

    return rootMembers.slice(0, 1).map((root) => buildNode(root));
};

export const formatYear = (date: string | null) => (date ? date.substring(0, 4) : null);

export const getDepth = (nodes: FamilyNode[]): number => {
    if (!nodes.length) {
        return 0;
    }

    return Math.max(...nodes.map((node) => 1 + getDepth(node.children)));
};

export const calculateAge = (ngay_sinh?: string | null, ngay_mat?: string | null, da_mat?: boolean) => {
    if (!ngay_sinh) {
        return null;
    }

    const birthYear = Number.parseInt(ngay_sinh.substring(0, 4));
    if (Number.isNaN(birthYear)) {
        return null;
    }

    if (da_mat) {
        if (!ngay_mat) {
            return null;
        }

        const deathYear = Number.parseInt(ngay_mat.substring(0, 4));

        return Number.isNaN(deathYear) ? null : deathYear - birthYear;
    }

    return new Date().getFullYear() - birthYear;
};
