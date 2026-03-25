const LoadingScreen = ({ label = "Loading..." }) => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="glass rounded-[2rem] px-6 py-5 text-center shadow-soft">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-olive/20 border-t-olive animate-spin" />
      <p className="text-sm text-ink/70 dark:text-white/70">{label}</p>
    </div>
  </div>
);

export default LoadingScreen;

