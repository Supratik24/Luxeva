const SkeletonCard = () => (
  <div className="glass overflow-hidden rounded-[1.75rem] p-3 shadow-soft">
    <div className="shimmer h-64 rounded-[1.4rem]" />
    <div className="space-y-3 px-2 py-4">
      <div className="shimmer h-4 rounded-full" />
      <div className="shimmer h-4 w-2/3 rounded-full" />
      <div className="shimmer h-5 w-1/3 rounded-full" />
    </div>
  </div>
);

export default SkeletonCard;

