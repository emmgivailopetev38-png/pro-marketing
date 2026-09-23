import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("hotel");

export default function HotelDemoPage() {
  return (
    <>
      <VerticalDemo vertical="hotel" />
      <VerticalSeo slug="hotel" />
    </>
  );
}
