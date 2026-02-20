import { useEffect, useMemo, useState } from 'react';
import { Download, User, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { auditService, AuditEntry } from '@/services/auditService';
import { exportService } from '@/services/exportService';
import { toast } from 'sonner';

const ACTION_COLORS: Record<string, string> = {
  kit: 'bg-primary/10 text-primary border-primary/20',
  avulsa: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  devolucao: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export default function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [coordinators, setCoordinators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coordinator, setCoordinator] = useState('all');
  const [serialNumber, setSerialNumber] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [data, coords] = await Promise.all([
          auditService.getAuditEntries(),
          auditService.getUniqueCoordinators(),
        ]);
        setEntries(data);
        setCoordinators(coords);
      } catch (error) {
        console.error('Erro ao carregar auditoria:', error);
        toast.error('Erro ao carregar registros de auditoria.');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(e => new Date(e.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(e => new Date(e.date) <= end);
    }

    if (coordinator && coordinator !== 'all') {
      result = result.filter(e => e.performedByName === coordinator);
    }

    if (serialNumber.trim()) {
      const term = serialNumber.trim().toLowerCase();
      result = result.filter(e => e.serialNumber.toLowerCase().includes(term));
    }

    return result;
  }, [entries, startDate, endDate, coordinator, serialNumber]);

  const handleExport = (format: 'xlsx' | 'csv') => {
    if (filteredEntries.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const formatted = exportService.formatAuditData(filteredEntries);
    exportService.exportData(formatted, {
      filename: `auditoria_${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Auditoria',
      format,
    });
    toast.success(`Relatório exportado em ${format.toUpperCase()}`);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCoordinator('all');
    setSerialNumber('');
  };

  const hasActiveFilters = startDate || endDate || (coordinator && coordinator !== 'all') || serialNumber.trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Auditoria de Movimentações</h1>
          <p className="text-muted-foreground">
            Registro consolidado das movimentações de equipamentos.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              Exportar Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Exportar CSV (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="card-minimal space-y-4">
        <p className="text-sm font-medium text-foreground">Filtros</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Data Inicial
            </Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Data Final
            </Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" /> Responsável
            </Label>
            <Select value={coordinator} onValueChange={setCoordinator}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {coordinators.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" /> Patrimônio / Série
            </Label>
            <Input
              placeholder="Buscar por patrimônio..."
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {filteredEntries.length} registro(s) encontrado(s)
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="card-minimal p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[140px]">Data / Hora</TableHead>
              <TableHead className="w-[160px]">Ação</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Patrimônio</TableHead>
              <TableHead>Beneficiário</TableHead>
              <TableHead>Departamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length > 0 ? (
              filteredEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div>{new Date(entry.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-muted-foreground/60">
                      {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${ACTION_COLORS[entry.action] ?? ''}`}
                    >
                      {entry.actionLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.performedByName ? (
                      <span className="text-sm font-medium text-foreground">{entry.performedByName}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sistema / Legado</span>
                    )}
                  </TableCell>
                  <TableCell>{entry.equipmentName}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {entry.serialNumber}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{entry.beneficiaryName}</span>
                      {entry.beneficiaryStatus === 'Desligado' && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20">
                          Desligado
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{entry.beneficiaryDepartment}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  Nenhum registro de auditoria encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
