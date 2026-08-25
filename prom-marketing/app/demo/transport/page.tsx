import { VerticalDemo } from "../vertical-demo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("transport");

export default function TransportDemoPage() {
  return <VerticalDemo vertical="transport" />;
}
