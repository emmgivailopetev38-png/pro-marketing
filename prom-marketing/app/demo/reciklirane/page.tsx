import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("reciklirane");

export default function RecikliraneDemoPage() {
  return (
    <>
      <VerticalDemo vertical="reciklirane" />
      <VerticalSeo slug="reciklirane" />
    </>
  );
}
