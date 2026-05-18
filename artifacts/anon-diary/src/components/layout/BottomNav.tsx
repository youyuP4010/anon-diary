import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const isAnon = location.pathname === '/' || location.pathname.startsWith('/diary');
  const isMy = location.pathname.startsWith('/my') || location.pathname.startsWith('/write');

  return (
    <nav
      className="w-full flex border-t border-border bg-white"
      style={{ height: '56px' }}
      data-testid="bottom-nav"
    >
      <Link
        to="/"
        data-testid="link-anon-diary"
        className={`flex-1 flex items-center justify-center font-semibold text-sm transition-colors ${
          isAnon ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Anon Diary
      </Link>
      <Link
        to="/my"
        data-testid="link-my-diary"
        className={`flex-1 flex items-center justify-center font-semibold text-sm transition-colors ${
          isMy ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        My Diary
      </Link>
    </nav>
  );
}
