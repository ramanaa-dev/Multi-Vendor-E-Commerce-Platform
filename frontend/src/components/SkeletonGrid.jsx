const SkeletonGrid = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card overflow-hidden rounded-[30px] p-4">
          <div className="skeleton h-44 w-full rounded-[24px]" />
          <div className="mt-4 space-y-3">
            <div className="skeleton h-3 w-1/3 rounded-full" />
            <div className="skeleton h-5 w-2/3 rounded-full" />
            <div className="skeleton h-4 w-full rounded-full" />
            <div className="skeleton h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonGrid;
