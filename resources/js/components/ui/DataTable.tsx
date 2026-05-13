import { ReactNode } from 'react';
import StatusBadge from './StatusBadge';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';

export interface DataTableColumn<T = any> {
    key: string;
    label: string;
    sortable?: boolean;
    type?: 'text' | 'status' | 'custom';
    activeText?: string;
    inactiveText?: string;
    render?: (value: any, row: T, index: number) => ReactNode;
    thClassName?: string;
    tdClassName?: string;
}

interface DataTableProps<T = any> {
    columns: DataTableColumn<T>[];
    data: T[];
    onSort?: (key: string) => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    // New props for automation
    pagination?: {
        currentPage: number;
        perPage: number;
        total: number;
        lastPage: number;
    };
    actions?: (row: T) => DropdownMenuItem[];
    onStatusToggle?: (row: T) => void;
}

export default function DataTable<T extends Record<string, any>>({ 
    columns, 
    data, 
    onSort, 
    sortKey, 
    sortDirection,
    pagination,
    actions,
    onStatusToggle
}: DataTableProps<T>) {
    
    // Automatic columns generation
    const displayColumns = [...columns];

    // 1. Auto add STT column if pagination exists
    if (pagination) {
        displayColumns.unshift({
            key: '_stt',
            label: 'STT',
            render: (_, __, index) => (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#059669]/10 text-sm font-bold text-[#059669]">
                    {pagination.perPage * (pagination.currentPage - 1) + (index || 0) + 1}
                </div>
            ),
        });
    }

    // 2. Auto add Actions column if actions prop exists
    if (actions) {
        displayColumns.push({
            key: '_actions',
            label: 'Thao tác',
            thClassName: 'sticky right-0 z-20 bg-gradient-to-r from-[#f26224] to-[#10b981] drop-shadow-[-2px_0_4px_rgba(0,0,0,0.05)] w-[100px]',
            tdClassName: 'sticky right-0 z-10 bg-white drop-shadow-[-2px_0_4px_rgba(0,0,0,0.05)] w-[100px]',
            render: (_, row) => (
                <DropdownMenu items={actions(row)} position="right" />
            ),
        });
    }

    const handleSort = (key: string, sortable?: boolean) => {
        if (sortable && onSort) {
            onSort(key);
        }
    };

    const renderCell = (column: DataTableColumn<T>, row: T, index: number) => {
        // Custom render takes precedence
        if (column.render) {
            return column.render(row[column.key], row, index);
        }

        // Status type
        if (column.type === 'status') {
            const value = row[column.key];
            const content = (
                <StatusBadge 
                    isActive={value === 1 || value === true} 
                    activeText={column.activeText || 'Hoạt động'} 
                    inactiveText={column.inactiveText || 'Không hoạt động'} 
                />
            );

            if (onStatusToggle) {
                return (
                    <button onClick={() => onStatusToggle(row)} className="transition hover:opacity-80">
                        {content}
                    </button>
                );
            }
            return content;
        }

        // Default text
        return row[column.key];
    };

    return (
        <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full border-collapse">
                {/* Header with DZ Gradient */}
                <thead>
                    <tr
                        className="text-left text-sm font-semibold text-white"
                        style={{
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                        }}
                    >
                        {displayColumns.map((column) => (
                            <th
                                key={column.key}
                                className={`whitespace-nowrap px-6 py-4 ${column.sortable ? 'cursor-pointer select-none hover:bg-black/10' : ''} ${column.thClassName || ''}`}
                                onClick={() => handleSort(column.key, column.sortable)}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>{column.label}</span>
                                    {column.sortable && sortKey === column.key && (
                                        <span className="text-xs">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody className="bg-white">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={displayColumns.length} className="py-12 text-center text-gray-500">
                                Không có dữ liệu
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-gray-200 transition hover:bg-gray-50">
                                {displayColumns.map((column) => (
                                    <td key={column.key} className={`whitespace-nowrap px-6 py-4 text-sm text-gray-900 ${column.tdClassName || ''}`}>
                                        {renderCell(column, row, rowIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
