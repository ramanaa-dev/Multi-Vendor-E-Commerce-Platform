const OrderStatusBadge = ({ status }) => {
  const state = (status || "placed").toLowerCase();
  const color = {
    placed: "border border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)] text-[color:var(--text-main)]",
    processing: "border border-amber-300/60 bg-amber-100/80 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    shipped: "border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 text-[color:var(--accent)] dark:text-[color:var(--accent)]",
    delivered: "border border-emerald-300/60 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    cancelled: "border border-rose-300/60 bg-rose-100/80 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
  };

  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${color[state] || color.placed}`}>{state}</span>;
};

export default OrderStatusBadge;
