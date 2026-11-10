/** Erro geral de formulário/modal (não ligado a um campo). */
export const FormError = ({ error }: { error?: string }) =>
  error ? (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;
