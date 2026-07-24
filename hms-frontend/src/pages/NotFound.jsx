import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-surface">
      <p className="font-display text-6xl font-bold text-teal-700 mb-3">404</p>
      <h1 className="font-display text-xl font-semibold text-ink-900 mb-2">Page not found</h1>
      <p className="text-sm text-ink-600 mb-6 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
