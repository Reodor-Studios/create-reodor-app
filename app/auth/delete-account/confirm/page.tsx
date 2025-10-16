import { Suspense } from "react";
import { DeleteAccountConfirmation } from "./delete-account-confirmation";

export default function DeleteAccountConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="text-center">
              <p className="text-muted-foreground">Laster...</p>
            </div>
          }
        >
          <DeleteAccountConfirmation />
        </Suspense>
      </div>
    </div>
  );
}
