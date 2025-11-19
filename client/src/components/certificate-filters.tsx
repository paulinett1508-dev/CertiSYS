import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface CertificateFiltersProps {
  onFilter: (filters: {
    search?: string;
    clientId?: string;
    type?: string[];
    status?: string[];
    expiryFrom?: string;
    expiryTo?: string;
  }) => void;
  clients: Array<{ id: string; name: string }>;
}

const certificateTypes = [
  { value: "Federal", label: "Federal" },
  { value: "Estadual", label: "Estadual" },
  { value: "Municipal", label: "Municipal" },
  { value: "FGTS", label: "FGTS" },
  { value: "Trabalhista", label: "Trabalhista" },
  { value: "Previdenciária", label: "Previdenciária" },
];

const certificateStatuses = [
  { value: "valid", label: "Válida" },
  { value: "expiring_soon", label: "Vencendo em breve" },
  { value: "expired", label: "Vencida" },
];

export function CertificateFilters({ onFilter, clients }: CertificateFiltersProps) {
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
    }
  };

  const handleApplyFilters = () => {
    onFilter({
      search: search || undefined,
      clientId: clientId && clientId !== "all" ? clientId : undefined,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      expiryFrom: expiryFrom || undefined,
      expiryTo: expiryTo || undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setClientId("");
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setExpiryFrom("");
    setExpiryTo("");
    onFilter({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Nome do cliente ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-filter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client" data-testid="select-client-filter">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Tipo de Certidão</Label>
            <div className="space-y-2">
              {certificateTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
                    data-testid={`checkbox-type-${type.value}`}
                  />
                  <label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Status</Label>
            <div className="space-y-2">
              {certificateStatuses.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={selectedStatuses.includes(status.value)}
                    onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
                    data-testid={`checkbox-status-${status.value}`}
                  />
                  <label
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryFrom">Vencimento de</Label>
            <Input
              id="expiryFrom"
              type="date"
              value={expiryFrom}
              onChange={(e) => setExpiryFrom(e.target.value)}
              data-testid="input-expiry-from-filter"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryTo">Vencimento até</Label>
            <Input
              id="expiryTo"
              type="date"
              value={expiryTo}
              onChange={(e) => setExpiryTo(e.target.value)}
              data-testid="input-expiry-to-filter"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} data-testid="button-apply-filters">
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
          <Button onClick={handleClearFilters} variant="outline" data-testid="button-clear-filters">
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
