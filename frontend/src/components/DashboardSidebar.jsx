const DashboardSidebar = ({ title, items, active, onSelect }) => {
  return (
    <aside className="glass-card rounded-[34px] p-5">
      <div className="hero-mesh rounded-[28px] p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">Control Room</p>
        <h3 className="brand-font mt-3 text-3xl font-bold">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/78">Move between overview, records, and operational tools from one focused sidebar.</p>
      </div>

      <div className="mt-4 flex gap-2 overflow-auto pb-1 sm:flex-col">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`min-w-[190px] whitespace-nowrap rounded-[24px] border px-4 py-4 text-left transition ${
              active === item.key
                ? "border-transparent bg-[color:var(--surface-inverse)] text-white shadow-lg shadow-black/10 dark:text-[color:var(--surface-inverse)]"
                : "border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)] text-[color:var(--text-main)] hover:-translate-y-0.5 hover:border-[color:var(--card-border-strong)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                {item.hint && (
                  <p className={`mt-1 text-xs leading-5 ${active === item.key ? "text-white/72 dark:text-[color:var(--surface-inverse)]/70" : "text-[color:var(--text-soft)]"}`}>
                    {item.hint}
                  </p>
                )}
              </div>
              {item.count !== undefined && item.count !== null && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    active === item.key
                      ? "bg-white/15 text-white dark:bg-[color:var(--surface-inverse)]/15 dark:text-[color:var(--surface-inverse)]"
                      : "bg-[color:var(--accent-soft)] text-[color:var(--text-main)]"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
