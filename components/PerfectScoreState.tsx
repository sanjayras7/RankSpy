export default function PerfectScoreState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span aria-hidden="true" className="text-5xl text-green-600">
        ✓
      </span>
      <p className="text-base text-gray-700">Your meta tags are solid.</p>
    </div>
  );
}
