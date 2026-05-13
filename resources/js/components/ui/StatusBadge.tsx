interface StatusBadgeProps {
    isActive: boolean;
    activeText?: string;
    inactiveText?: string;
}

export default function StatusBadge({ isActive, activeText = 'Hoạt động', inactiveText = 'Không hoạt động' }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
        >
            <span className={`mr-1.5 h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
            {isActive ? activeText : inactiveText}
        </span>
    );
}
