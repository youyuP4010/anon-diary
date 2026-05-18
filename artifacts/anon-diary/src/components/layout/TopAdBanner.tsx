export default function TopAdBanner() {
  return (
    <div
      className="w-full bg-gray-100 border-b border-gray-200 flex items-center justify-center"
      style={{ height: '60px' }}
      data-testid="top-ad-banner"
    >
      <span className="text-xs text-gray-400 tracking-widest">Ad</span>
    </div>
  );
}
