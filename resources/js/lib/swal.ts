import Swal, { type SweetAlertOptions } from 'sweetalert2';

const DZ_CONFIRM_DEFAULTS: SweetAlertOptions = {
    confirmButtonColor: '#059669',
    cancelButtonColor:  '#6b7280',
    confirmButtonText:  'Xác nhận',
    cancelButtonText:   'Hủy',
    showCancelButton:   true,
    reverseButtons:     true,
    focusCancel:        true,
    customClass: {
        popup:         'rounded-2xl shadow-2xl',
        confirmButton: 'rounded-lg px-4 py-2 text-sm font-semibold',
        cancelButton:  'rounded-lg px-4 py-2 text-sm font-medium',
    },
};

/**
 * Hiện dialog xác nhận bằng SweetAlert2.
 * Trả về true nếu người dùng bấm "Xác nhận", false nếu bấm "Hủy".
 */
export async function confirmAction(
    message: string,
    options?: {
        title?: string;
        icon?: SweetAlertOptions['icon'];
        confirmText?: string;
    }
): Promise<boolean> {
    const result = await Swal.fire({
        ...DZ_CONFIRM_DEFAULTS,
        title:              options?.title ?? 'Xác nhận',
        text:               message,
        icon:               options?.icon ?? 'question',
        confirmButtonText:  options?.confirmText ?? 'Xác nhận',
    });
    return result.isConfirmed;
}

/**
 * Xác nhận hành động xóa với màu đỏ nguy hiểm.
 */
export async function confirmDelete(message: string = 'Bạn có chắc chắn muốn xóa?'): Promise<boolean> {
    const result = await Swal.fire({
        ...DZ_CONFIRM_DEFAULTS,
        title:             'Xóa dữ liệu',
        text:              message,
        icon:              'warning',
        confirmButtonText: 'Xóa',
    });
    return result.isConfirmed;
}

/**
 * Thông báo thành công.
 */
export function alertSuccess(message: string, title = 'Thành công!'): void {
    Swal.fire({
        title,
        text:              message,
        icon:              'success',
        confirmButtonColor: '#059669',
        confirmButtonText: 'OK',
        customClass: {
            popup:         'rounded-2xl',
            confirmButton: 'rounded-lg px-4 py-2 text-sm font-semibold',
        },
    });
}

export default { confirmAction, confirmDelete, alertSuccess };
