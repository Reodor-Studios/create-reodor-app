import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Info } from "lucide-react";

const OmOssPage = async () => {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Info />
              </EmptyMedia>
              <EmptyTitle>About Us</EmptyTitle>
              <EmptyDescription>
                Developers must fill out this page with appropriate company
                information
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <p className="text-muted-foreground">
                This is a placeholder page. Please update this page with your
                company&apos;s story, mission, values, and team information.
              </p>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    </div>
  );
};

export default OmOssPage;
