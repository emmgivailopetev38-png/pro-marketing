import { VerticalDemo } from "../vertical-demo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("influencer");

export default function InfluencerDemoPage() {
  return <VerticalDemo vertical="influencer" />;
}
