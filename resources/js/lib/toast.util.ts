import { toast } from 'sonner';

/**
 * Display success toast notification
 */
export function showSuccess(message: string) {
    toast.success(message);
}

/**
 * Display error toast notification
 */
export function showError(message: string) {
    toast.error(message);
}

/**
 * Display warning toast notification
 */
export function showWarning(message: string) {
    toast.warning(message);
}

/**
 * Display info toast notification
 */
export function showInfo(message: string) {
    toast.info(message);
}

export default {
    success : showSuccess,
    error   : showError,
    warning : showWarning,
    info    : showInfo,
};
