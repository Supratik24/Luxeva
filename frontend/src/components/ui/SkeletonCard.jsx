const SkeletonCard = () => (
  <div className="flex flex-col gap-4">
    <div className="shimmer aspect-[3/4] rounded-2xl bg-sand dark:bg-white/5" />
    <div className="space-y-2 px-0.5">
      <div className="shimmer h-3 w-1/3 rounded-full" />
      <div className="shimmer h-4 rounded-lg" />
      <div className="shimmer h-4 w-3/4 rounded-lg" />
      <div className="shimmer h-3.5 w-1/4 rounded-full mt-1" />
    </div>
  </div>
);

export default SkeletonCard;
