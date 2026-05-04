import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="mx-auto max-w-xl section-fade">
      <div className="glass-card rounded-3xl p-10 text-center shadow-soft">
        <h1 className="brand-font text-6xl font-bold text-sky-700 dark:text-sky-300">404</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
