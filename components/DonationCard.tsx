import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export const DonationCard = () => {
  return (
    <Card className="mt-28 bg-secondary relative">
      <Image
        src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1751651691/gdgc/server_jokm9r.webp"
        alt="Server Image"
        width={264}
        height={264}
        className="absolute bottom-52 sm:bottom-28 right-[-72px] w-52 h-52 overflow-hidden rounded-full"
      />
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">
          Found this helpful?
        </CardTitle>
        <CardDescription className="text-xl sm:text-2xl">
          If this site has helped you with your college search, please consider
          supporting the project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg sm:text-xl">
          This is a student-run project, and your contribution helps us cover
          server costs and continue improving the platform for everyone.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link
            href="https://checkout.dodopayments.com/buy/pdt_oQtpdP1lcA07A1Yq9KW3B"
            target="_blank"
            rel="noopener noreferrer"
          >
            Make a Contribution
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
