import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("schetovodstvo");

export default function SchetovodstvoDemoPage() {
  return (
    <>
      <VerticalDemo vertical="schetovodstvo" />
      <VerticalSeo slug="schetovodstvo" />
    </>
  );
}
