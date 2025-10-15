import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Privacy Policy</EmptyTitle>
              <EmptyDescription>
                Developers must fill out this page with appropriate privacy
                policy content
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <p className="text-muted-foreground">
                This is a placeholder page. Please update this page with your
                company&apos;s privacy policy, GDPR compliance information, and
                data handling practices.
              </p>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    </div>
  );
}
