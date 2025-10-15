import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Terms of Service</EmptyTitle>
              <EmptyDescription>
                Developers must fill out this page with appropriate terms of
                service content
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <p className="text-muted-foreground">
                This is a placeholder page. Please update this page with your
                company&apos;s terms of service, user agreements, and legal
                requirements.
              </p>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    </div>
  );
}
