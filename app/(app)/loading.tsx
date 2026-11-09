export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-4">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
