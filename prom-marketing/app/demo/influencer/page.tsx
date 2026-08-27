import { VerticalDemo } from "../vertical-demo";
import { VerticalSeo } from "../vertical-seo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("influencer");

export default function InfluencerDemoPage() {
  return (
    <>
      <VerticalDemo vertical="influencer" />
      <VerticalSeo slug="influencer" />
    </>
  );
}
