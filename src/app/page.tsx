import { JsonLd } from "@/components/json-ld";
import Home from "@/app/home-client";
import { pageMetadata, restaurantJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata("/");

export default function Page() {
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={restaurantJsonLd()} />
      <Home />
    </>
  );
}
