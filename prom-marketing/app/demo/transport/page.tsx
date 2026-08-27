import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("transport");

export default function TransportDemoPage() {
  return (
    <>
      <VerticalDemo vertical="transport" />
      <VerticalSeo slug="transport" />
    </>
  );
}
