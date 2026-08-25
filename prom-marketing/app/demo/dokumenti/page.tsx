import { VerticalDemo } from "../vertical-demo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("dokumenti");

export default function DokumentiDemoPage() {
  return <VerticalDemo vertical="dokumenti" />;
}
