export const num = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v) || 0;
    return 0;
};
const withCommas = (n) => {
    const [i, d] = Math.abs(n).toFixed(2).split('.');
    const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const sign = n < 0 ? '-' : '';
    return d === '00' ? `${sign}${int}` : `${sign}${int}.${d}`;
};
export const money = (v) => `Rs ${withCommas(num(v))}`;
export const compact = (v) => {
    const n = num(v);
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return String(Math.round(n));
};
export const qty = (v, unit) => {
    const n = num(v);
    const s = Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1).replace(/\.?0+$/, '');
    return unit ? `${s} ${unit}` : s;
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const time = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
};
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const date = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const yesterday = new Date(now.getTime() - 86400000);
    if (sameDay(d, now)) return 'Today';
    if (sameDay(d, tomorrow)) return 'Tomorrow';
    if (sameDay(d, yesterday)) return 'Yesterday';
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const dateTime = (iso) => (iso ? `${date(iso)}, ${time(iso)}` : '');
export const shortDate = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const weekday = (iso) => DAYS[new Date(iso).getDay()];
export const ago = (iso) => {
    if (!iso) return '';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
    return shortDate(iso);
};
export const minutesSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)) : 0);
export const initials = (name) =>
    (name ?? '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('');
export const titleCase = (s) => (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};
export const openState = (opening, closing) => {
    if (!opening || !closing) return { open: false, label: '' };
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fmt = (t) => {
        const [h, m] = t.split(':').map(Number);
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    const open = hhmm >= opening && hhmm < closing;
    return {
        open,
        label: open ? `Open · closes ${fmt(closing)}` : `Closed · opens ${fmt(opening)}`,
        hours: `${fmt(opening)} – ${fmt(closing)}`,
    };
};
