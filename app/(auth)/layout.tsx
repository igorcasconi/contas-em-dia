export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <h1 className="text-center text-2xl font-semibold">Contas em Dia</h1>
        {children}
      </div>
    </main>
  );
}
