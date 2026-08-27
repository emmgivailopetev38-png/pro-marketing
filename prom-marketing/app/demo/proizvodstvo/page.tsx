import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("proizvodstvo");

export default function ProizvodstvoDemoPage() {
  return (
    <>
      <VerticalDemo vertical="proizvodstvo" />
      <VerticalSeo slug="proizvodstvo" />
    </>
  );
}
