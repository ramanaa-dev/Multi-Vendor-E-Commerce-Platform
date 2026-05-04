const StatCard = ({ title, value, hint }) => {
  return (
    <div className="glass-card rounded-[28px] p-5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.26em] text-[color:var(--text-muted)]">{title}</p>
      <p className="brand-font mt-3 text-4xl font-bold text-[color:var(--text-main)]">{value}</p>
      {hint && <p className="mt-2 text-sm leading-6 text-[color:var(--text-soft)]">{hint}</p>}
    </div>
  );
};

export default StatCard;
