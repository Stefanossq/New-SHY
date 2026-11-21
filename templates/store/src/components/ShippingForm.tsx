'use client';
import styles from '@/app/checkout/page.module.css';

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
}

export const emptyAddress = (fullName = ''): ShippingAddress => ({ fullName, address: '', city: '', postalCode: '' });

export default function ShippingForm({ value, onChange }: { value: ShippingAddress; onChange: (v: ShippingAddress) => void }) {
  const set = (field: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: e.target.value });
  return (
    <>
      <h2 className={styles.sectionTitle}>Entrega</h2>
      <div className={styles.fieldGroup}>
        <input placeholder="Nome completo" value={value.fullName} onChange={set('fullName')} required autoComplete="name" />
      </div>
      <div className={styles.fieldGroup}>
        <input placeholder="Endereço" value={value.address} onChange={set('address')} required autoComplete="street-address" />
      </div>
      <div className={styles.row}>
        <input placeholder="Cidade" value={value.city} onChange={set('city')} required autoComplete="address-level2" />
        <input placeholder="CEP" value={value.postalCode} onChange={set('postalCode')} required autoComplete="postal-code" />
      </div>
    </>
  );
}
