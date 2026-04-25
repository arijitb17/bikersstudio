// admin/components/DataTable.tsx

"use client"
import React, { useState } from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { TableColumn } from '../types';

interface DataTableProps<T extends { id: string; name?: string; title?: string; code?: string }> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string, name: string) => void;
  showEdit?: boolean;
  showDelete?: boolean;
}

export function DataTable<T extends { id: string; name?: string; title?: string; code?: string }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  showEdit = true, 
  showDelete = true 
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-black"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
  <th
    key={String(col.key)}
    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
  >
    {col.label}
  </th>
))}
              {(showEdit || showDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map(col => {
  const value = item[col.key];

  return (
    <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-black">
      {col.render ? col.render(value, item) : String(value)}
    </td>
  );
})}
                {(showEdit || showDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {showEdit && onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {showDelete && onDelete && (
                        <button
                          onClick={() => onDelete(item.id, item.name || item.title || item.code || 'Item')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-black">
            No data found
          </div>
        )}
      </div>
    </div>
  );
}
