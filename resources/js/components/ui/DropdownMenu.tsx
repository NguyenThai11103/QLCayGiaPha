import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownMenuItem {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
    items: DropdownMenuItem[];
    position?: 'left' | 'right';
}

export default function DropdownMenu({ items, position = 'right' }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 4,
                left: position === 'left' ? rect.left : rect.right - 192, // 192px = w-48
            });
        }
        setIsOpen(!isOpen);
    };

    const closeMenu = () => setIsOpen(false);

    useEffect(() => {
        const handleScroll = () => {
            if (isOpen) closeMenu();
        };
        const handleResize = () => {
            if (isOpen) closeMenu();
        };
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left">
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
                aria-label="Actions menu"
            >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {/* Dropdown Menu Portal */}
            {isOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); closeMenu(); }}></div>

                    {/* Menu Items - Fixed positioning */}
                    <div
                        className="fixed z-[9999] w-48 rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                        style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                        }}
                    >
                        <div className="py-1">
                            {items.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        item.onClick();
                                        closeMenu();
                                    }}
                                    className={`flex w-full items-center px-4 py-2 text-sm transition ${
                                        item.variant === 'danger' ? 'text-red-700 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.icon && <span className="mr-3 text-lg">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
