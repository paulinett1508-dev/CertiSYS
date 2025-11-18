import { differenceInDays, isPast } from 'date-fns';

export function getCertificateStatus(expiryDate: string): 'valid' | 'expiring_soon' | 'expired' {
  const expiry = new Date(expiryDate);
  const today = new Date();
  
  if (isPast(expiry)) {
    return 'expired';
  }
  
  const daysUntilExpiry = differenceInDays(expiry, today);
  
  if (daysUntilExpiry <= 30) {
    return 'expiring_soon';
  }
  
  return 'valid';
}
