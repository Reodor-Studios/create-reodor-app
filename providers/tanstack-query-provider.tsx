"use client";

import { queryClient } from "@/lib/tanstack";
import { QueryClientProvider } from "@tanstack/react-query";

const TanstackQueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default TanstackQueryProvider;
