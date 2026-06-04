import type { Nguoi } from '../../../services/gia-pha.api';

export type FormState = {
    id?: number;
    id_dong_ho: string;
    ten_day_du: string;
    gioi_tinh: 'nam' | 'nu';
    ngay_sinh: string;
    ngay_mat: string;
    da_mat: boolean;
    id_cha: string;
    id_me: string;
    id_vo_chong_list: string[];
    tieu_su: string;
    anh_dai_dien: string;
    thu_tu_sinh: string;
};

export const emptyForm: FormState = {
    id_dong_ho: '',
    ten_day_du: '',
    gioi_tinh: 'nam',
    ngay_sinh: '',
    ngay_mat: '',
    da_mat: false,
    id_cha: '',
    id_me: '',
    id_vo_chong_list: [],
    tieu_su: '',
    anh_dai_dien: '',
    thu_tu_sinh: '',
};

export type QuickAddMode = 'none' | 'child' | 'spouse' | 'parent';

export interface FamilyNode {
    id: string;
    member: Nguoi;
    spouses: Nguoi[];
    children: FamilyNode[];
}

export type GenerationPosition = {
    level: number;
    top: number;
    left: number;
};
