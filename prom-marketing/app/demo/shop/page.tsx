import { VerticalDemo } from "../vertical-demo";
import { verticalMetadata } from "../verticals";

export const metadata = verticalMetadata("shop");

export default function ShopDemoPage() {
  return <VerticalDemo vertical="shop" />;
}
