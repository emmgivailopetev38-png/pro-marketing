import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("ohrana");

export default function OhranaDemoPage() {
  return (
    <>
      <VerticalDemo vertical="ohrana" />
      <VerticalSeo slug="ohrana" />
    </>
  );
}
