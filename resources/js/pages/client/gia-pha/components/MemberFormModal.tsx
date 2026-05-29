import { Dispatch, FormEvent, SetStateAction } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import type { DongHo, Nguoi } from '../../../../services/gia-pha.api';
import { canSelectAsParent, canSelectAsSpouse } from '../helpers/family-tree';
import type { FormState, QuickAddMode } from '../types';

type MemberFormModalProps = {
    form: FormState;
    setForm: Dispatch<SetStateAction<FormState>>;
    dongHos: DongHo[];
    people: Nguoi[];
    isDauRe: boolean;
    setIsDauRe: Dispatch<SetStateAction<boolean>>;
    quickAddMode: QuickAddMode;
    selectedParentId: string;
    saving: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onParentChange: (field: 'id_cha' | 'id_me', value: string) => void;
};

export default function MemberFormModal({
    form,
    setForm,
    dongHos,
    people,
    isDauRe,
    setIsDauRe,
    quickAddMode,
    selectedParentId,
    saving,
    onClose,
    onSubmit,
    onParentChange,
}: MemberFormModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <form
                onSubmit={onSubmit}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--ink)] shadow-2xl"
            >
                <div className="sticky top-0 z-10 rounded-t-2xl px-6 py-4" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">{form.id ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</h3>
                            <p className="mt-0.5 text-xs text-white/70">Nhập thông tin cơ bản của thành viên trong gia phả.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                        >
                            <Icon name="x" size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {quickAddMode !== 'none' ? (
                            <div className="flex items-center gap-6 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 md:col-span-2">
                                <span className="text-sm font-semibold text-emerald-800">Chế độ thêm nhanh:</span>
                                <span className="text-sm font-bold text-emerald-700">
                                    {quickAddMode === 'child'
                                        ? 'Thành viên gốc (Thêm con đẻ)'
                                        : quickAddMode === 'spouse'
                                          ? 'Dâu / Rể (Thêm phối ngẫu)'
                                          : 'Thành viên gốc (Thêm cha/mẹ)'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 rounded-lg border border-[var(--line)] bg-[var(--card-soft)] px-4 py-3 md:col-span-2">
                                <span className="text-sm font-semibold text-[var(--ink-soft)]">Vai trò dòng họ:</span>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={!isDauRe}
                                        onChange={() => {
                                            setIsDauRe(false);
                                            setForm((current) => ({ ...current, id_vo_chong_list: [] }));
                                        }}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-[var(--ink-soft)]">Thành viên gốc (Có cha/mẹ)</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        checked={isDauRe}
                                        onChange={() => {
                                            setIsDauRe(true);
                                            setForm((current) => ({ ...current, id_cha: '', id_me: '' }));
                                        }}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-[var(--ink-soft)]">Dâu / Rể (Từ họ khác)</span>
                                </label>
                            </div>
                        )}

                        <label className="md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">
                                Họ và tên <span className="text-red-500">*</span>
                            </span>
                            <input
                                type="text"
                                required
                                value={form.ten_day_du}
                                onChange={(event) => setForm({ ...form, ten_day_du: event.target.value })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                placeholder="Ví dụ: Nguyễn Văn A"
                            />
                        </label>

                        <label>
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">
                                Dòng họ <span className="text-red-500">*</span>
                            </span>
                            <select
                                value={form.id_dong_ho}
                                onChange={(event) => setForm({ ...form, id_dong_ho: event.target.value })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                required
                            >
                                <option value="">-- Chọn dòng họ --</option>
                                {dongHos.map((dongHo) => (
                                    <option key={dongHo.id} value={dongHo.id}>
                                        {dongHo.ten_dong_ho}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">
                                Giới tính <span className="text-red-500">*</span>
                            </span>
                            <select
                                value={form.gioi_tinh}
                                onChange={(event) => setForm({ ...form, gioi_tinh: event.target.value as 'nam' | 'nu' })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                required
                            >
                                <option value="nam">Nam</option>
                                <option value="nu">Nữ</option>
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Ngày sinh (Dương lịch)</span>
                            <input
                                type="date"
                                value={form.ngay_sinh}
                                onChange={(event) => setForm({ ...form, ngay_sinh: event.target.value })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                            />
                        </label>

                        <label>
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Thứ tự sinh</span>
                            <input
                                type="number"
                                min="1"
                                value={form.thu_tu_sinh}
                                onChange={(event) => setForm({ ...form, thu_tu_sinh: event.target.value })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                placeholder="Ví dụ: 1 (con trưởng)"
                            />
                        </label>

                        {isDauRe && quickAddMode !== 'child' && (
                            <label className="md:col-span-2">
                                <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">
                                    Vợ/chồng {form.id ? '(Có thể chọn nhiều)' : ''}
                                </span>
                                {form.id ? (
                                    <>
                                        <select
                                            multiple
                                            size={3}
                                            value={form.id_vo_chong_list}
                                            onChange={(event) => {
                                                const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
                                                setForm({ ...form, id_vo_chong_list: selectedOptions });
                                            }}
                                            className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:opacity-50"
                                            disabled={quickAddMode === 'spouse'}
                                        >
                                            {people
                                                .filter((member) => canSelectAsSpouse(people, member, form))
                                                .map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.ten_day_du}
                                                    </option>
                                                ))}
                                        </select>
                                        <p className="mt-1 text-xs text-[var(--ink-mute)]">
                                            Nhấn giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều người.
                                        </p>
                                    </>
                                ) : (
                                    <select
                                        value={form.id_vo_chong_list[0] || ''}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setForm({ ...form, id_vo_chong_list: value ? [value] : [] });
                                        }}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:opacity-50"
                                        disabled={quickAddMode === 'spouse'}
                                    >
                                        <option value="">-- Chọn vợ/chồng (tùy chọn) --</option>
                                        {people
                                            .filter((member) => canSelectAsSpouse(people, member, form))
                                            .map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.ten_day_du}
                                                </option>
                                            ))}
                                    </select>
                                )}
                            </label>
                        )}

                        {!isDauRe && quickAddMode !== 'parent' && (
                            <>
                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Cha</span>
                                    <select
                                        value={form.id_cha}
                                        onChange={(event) => onParentChange('id_cha', event.target.value)}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:opacity-50"
                                        disabled={quickAddMode === 'child' && String(form.id_cha) === selectedParentId}
                                    >
                                        <option value="">Không chọn</option>
                                        {people
                                            .filter((member) => member.gioi_tinh === 'nam' && canSelectAsParent(people, member, form, form.id_me))
                                            .map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.ten_day_du}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Mẹ</span>
                                    <select
                                        value={form.id_me}
                                        onChange={(event) => onParentChange('id_me', event.target.value)}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:opacity-50"
                                        disabled={quickAddMode === 'child' && String(form.id_me) === selectedParentId}
                                    >
                                        <option value="">Không chọn</option>
                                        {people
                                            .filter((member) => member.gioi_tinh === 'nu' && canSelectAsParent(people, member, form, form.id_cha))
                                            .map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.ten_day_du}
                                                </option>
                                            ))}
                                    </select>
                                </label>
                            </>
                        )}

                        <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--card-soft)] px-3 py-2">
                            <input
                                type="checkbox"
                                checked={form.da_mat}
                                onChange={(event) =>
                                    setForm({ ...form, da_mat: event.target.checked, ngay_mat: event.target.checked ? form.ngay_mat : '' })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-semibold text-[var(--ink-soft)]">Đã mất</span>
                        </label>

                        <label>
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Ngày mất</span>
                            <input
                                type="date"
                                value={form.ngay_mat}
                                onChange={(event) => setForm({ ...form, ngay_mat: event.target.value })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:opacity-40"
                                disabled={!form.da_mat}
                            />
                        </label>

                        <label className="md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Ảnh đại diện URL</span>
                            <input
                                value={form.anh_dai_dien}
                                onChange={(event) => setForm({ ...form, anh_dai_dien: event.target.value })}
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                placeholder="https://..."
                            />
                        </label>

                        <label className="md:col-span-2">
                            <span className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Tiểu sử</span>
                            <textarea
                                value={form.tieu_su}
                                onChange={(event) => setForm({ ...form, tieu_su: event.target.value })}
                                className="min-h-24 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                            />
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-[var(--line)] pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 py-2 font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--card-soft)]"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg px-5 py-2 font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
