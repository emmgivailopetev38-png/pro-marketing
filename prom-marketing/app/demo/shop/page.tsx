import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("shop");

export default function ShopDemoPage() {
  return (
    <>
      <VerticalDemo vertical="shop" />
      <VerticalSeo slug="shop" />
    </>
  );
}
