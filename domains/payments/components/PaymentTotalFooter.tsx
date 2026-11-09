import { MoneyText } from "@/shared/components/MoneyText";
import { Button } from "@/shared/components/ui/button";
import { DialogFooter } from "@/shared/components/ui/dialog";

type PaymentTotalFooterProps = {
  totalCents: number;
  pending: boolean;
  disabled?: boolean;
  error?: string;
};

/** Rodapé do modal de pagamento: total em texto ao lado do botão confirmar. */
export const PaymentTotalFooter = ({ totalCents, pending, disabled, error }: PaymentTotalFooterProps) => (
  <>
    {error && (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    )}
    <DialogFooter className="flex-row items-center justify-between sm:justify-between">
      <p aria-live="polite" className="text-sm">
        Total: <MoneyText cents={totalCents} className="font-semibold" />
      </p>
      <Button type="submit" disabled={pending || disabled}>
        Confirmar
      </Button>
    </DialogFooter>
  </>
);
