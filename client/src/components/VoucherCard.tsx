// Accommodation voucher download card. Rendered on the Dashboard; hides itself
// when no voucher exists for the current applicant. The server hands back a
// short-lived signed URL from the private Supabase Storage bucket.
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Icon } from './Icon';

type VoucherResponse = { available: boolean; url?: string };

export const VoucherCard = () => {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<VoucherResponse>('/me/voucher')
      .then((r) => {
        if (!cancelled) setAvailable(!!r.available);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!available) return null;

  const download = async () => {
    try {
      const r = await api<VoucherResponse>('/me/voucher');
      if (r.available && r.url) window.open(r.url, '_blank', 'noopener');
    } catch {
      // no-op; the card just fails silently on a transient error
    }
  };

  return (
    <div className="t-card">
      <p className="tag">Accommodation</p>
      <div className="t-title">Your accommodation voucher is ready</div>
      <p className="t-desc">
        Download your hotel voucher for YPDS Jakarta 2026. Please keep a copy on your phone and
        present it at check-in.
      </p>
      <div className="accept-cta">
        <button className="btn" onClick={download}>
          <Icon name="hotel" size={16} />
          <span style={{ marginLeft: 8 }}>Download voucher (PDF)</span>
        </button>
      </div>
    </div>
  );
};
