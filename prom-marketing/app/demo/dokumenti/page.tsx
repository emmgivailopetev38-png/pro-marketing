import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("dokumenti");

export default function DokumentiDemoPage() {
  return (
    <>
      <VerticalDemo vertical="dokumenti" />
      <VerticalSeo slug="dokumenti" />
    </>
  );
}
