import { differenceInDays, format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCertificateStatus as getStatus } from '@shared/utils';

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function getCertificateStatus(expiryDate: string): 'valid' | 'expiring_soon' | 'expired' {
  return getStatus(expiryDate);
}

export function getDaysUntilExpiry(expiryDate: string): number {
  return differenceInDays(new Date(expiryDate), new Date());
}

export function getNotificationDateGroup(date: string | Date): 'Hoje' | 'Ontem' | 'Esta Semana' | 'Anterior' {
  const notifDate = new Date(date);
  
  if (isToday(notifDate)) return 'Hoje';
  if (isYesterday(notifDate)) return 'Ontem';
  if (isThisWeek(notifDate)) return 'Esta Semana';
  return 'Anterior';
}
