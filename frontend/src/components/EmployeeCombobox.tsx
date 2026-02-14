import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Employee } from '@/types';

interface EmployeeComboboxProps {
  employees: Employee[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function EmployeeCombobox({
  employees,
  value,
  onValueChange,
  placeholder = 'Selecione ou digite o nome...',
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEmployee = employees.find(e => e.id === value);

  const filtered = useMemo(() => {
    if (!search) return employees;
    const term = search.toLowerCase();
    return employees.filter(
      e =>
        e.name.toLowerCase().includes(term) ||
        e.department.toLowerCase().includes(term)
    );
  }, [employees, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedEmployee
            ? `${selectedEmployee.name} - ${selectedEmployee.department}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filtered.length > 0 ? (
            filtered.map(emp => (
              <button
                key={emp.id}
                className={cn(
                  'flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-muted transition-colors text-left',
                  value === emp.id && 'bg-muted'
                )}
                onClick={() => {
                  onValueChange(emp.id);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value === emp.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.department}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center py-4 text-sm text-muted-foreground">
              Nenhum colaborador encontrado
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
