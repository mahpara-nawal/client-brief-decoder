export function ScopeSkeleton() {
  return (
    <div className="space-y-3 pt-6">
      <div className="skel h-6 w-2/3" />
      <div className="skel h-3 w-1/3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="card-surface space-y-2.5">
          <div className="skel h-2.5 w-28" />
          <div className="skel h-3.5 w-full" />
          <div className="skel h-3.5 w-5/6" />
          <div className="skel h-3.5 w-3/5" />
        </div>
      ))}
    </div>
  );
}
