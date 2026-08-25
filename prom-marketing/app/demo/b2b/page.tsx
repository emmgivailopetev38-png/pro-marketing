import { VerticalDemo } from "../vertical-demo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("b2b");

export default function B2BDemoPage() {
  return <VerticalDemo vertical="b2b" />;
}
