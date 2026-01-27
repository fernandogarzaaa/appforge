import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_ROLES } from '../../../functions/permissionCheck';

export default function RoleSelector({ value, onChange, disabled = false }) {
  const role = AVAILABLE_ROLES.find(r => r.value === value);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_ROLES.map(role => (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-center gap-2">
                <span>{role.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role && (
        <p className="text-xs text-slate-600">{role.description}</p>
      )}
    </div>
  );
}