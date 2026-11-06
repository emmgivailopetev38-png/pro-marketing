import "server-only";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { OfferPdf } from "./pdf-document";
import type { OfferView } from "./view";

/** PDF-ът като байтове — за прикачване към имейл и за маршрута /oferta/<код>/pdf. */
export async function renderOfferPdf(v: OfferView): Promise<Buffer> {
  const doc = createElement(OfferPdf, { v }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(doc);
}
