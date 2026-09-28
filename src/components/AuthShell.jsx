import { Link } from 'react-router-dom';
import { Logo } from './ui';

export default function AuthShell({ title, subtitle, children, aside }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--brand)_55%,transparent),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-center px-14 text-white">{aside}</div>
      </div>
    </div>
  );
}
