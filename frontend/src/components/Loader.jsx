const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="glass-card rounded-[32px] px-8 py-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)]">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[rgba(184,121,37,0.2)] border-t-[color:var(--brand)]" />
        </div>
        <p className="mt-4 text-sm font-semibold text-[color:var(--text-soft)]">{text}</p>
      </div>
    </div>
  );
};

export default Loader;
