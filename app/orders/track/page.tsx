// app/orders/track/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Loader2,
  MapPin,
  ExternalLink,
  Package,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TrackingEvent {
  time: string;
  activity: string;
  location: string;
  instructions: string;
}

interface TrackingResult {
  tracked: boolean;
  awb: string;
  orderId: string;
  orderNumber: string;
  trackingUrl: string | null;
  courierService: string;
  status: string;
  expectedDelivery: string | null;
  events: TrackingEvent[];
}

// ─── status → display helpers ────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'bg-indigo-100 text-indigo-800',
    icon: <Truck className="w-3.5 h-3.5" />,
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

function getStatusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status,
      color: 'bg-gray-100 text-gray-700',
      icon: <Package className="w-3.5 h-3.5" />,
    }
  );
}

// ─── inner component (needs useSearchParams) ──────────────────────────────────

function TrackPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill AWB if passed as ?awb= query param (e.g. linked from order detail)
  const [awb, setAwb] = useState(searchParams.get('awb') ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/orders/track');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const handleTrack = async () => {
    const trimmed = awb.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(
        `/api/user/orders/track?awb=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Could not find tracking info for this AWB.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? getStatusMeta(result.status) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-40">
      <div className="max-w-2xl mx-auto px-4">

        {/* Back */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-1">Track Shipment</h1>
        <p className="text-gray-500 text-sm mb-8">
          Enter the AWB (waybill) number from your shipping confirmation email.
        </p>

        {/* Search bar */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            placeholder="e.g. 1234567890"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
          />
          <button
            onClick={handleTrack}
            disabled={loading || !awb.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />}
            Track
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Result card */}
        {result && meta && (
          <div className="bg-white rounded-xl shadow-md divide-y divide-gray-100">

            {/* Card header */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Order #{result.orderNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    AWB: {result.awb} &middot; {result.courierService}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}
                >
                  {meta.icon}
                  {meta.label}
                </span>
                {result.trackingUrl && (
                  <a
                    href={result.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                  >
                    Delhivery site
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Expected delivery */}
            {result.expectedDelivery && (
              <div className="px-5 py-3 bg-green-50 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-green-800">
                  Expected delivery:{' '}
                  <strong>
                    {new Date(result.expectedDelivery).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            )}

            {/* View order detail link */}
            <div className="px-5 py-3">
              <Link
                href={`/orders/${result.orderId}`}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                View full order details →
              </Link>
            </div>

            {/* Timeline */}
            <div className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Shipment Timeline
              </p>

              {result.events.length > 0 ? (
                <ol className="relative border-l-2 border-gray-100 ml-2 space-y-6">
                  {result.events.map((e, i) => (
                    <li key={i} className="ml-6">
                      <span
                        className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                          i === 0 ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      >
                        <MapPin className="w-2.5 h-2.5 text-white" />
                      </span>
                      <p
                        className={`text-sm font-medium ${
                          i === 0 ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {e.activity}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {e.location && <span>{e.location} &middot; </span>}
                        {new Date(e.time).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {e.instructions && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">
                          {e.instructions}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="flex flex-col items-center py-6 text-center text-gray-400">
                  <Truck className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No scan events yet.</p>
                  <p className="text-xs mt-1">Check back in a few hours.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── page export (wraps inner in Suspense for useSearchParams) ────────────────

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }
    >
      <TrackPageInner />
    </Suspense>
  );
}