import { LoginForm } from './LoginForm';

// Server component. `searchParams` is read here as a prop rather than with
// useSearchParams in the client, so the form is present in the served HTML.
// The earlier client-side version rendered nothing at all server-side — the page
// was 11.6 KB of shell with no form until JS hydrated.
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  return <LoginForm denied={denied === '1'} />;
}
