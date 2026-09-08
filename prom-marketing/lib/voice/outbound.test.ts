import { describe, it, expect } from "vitest";
import { buildOutboundPayload, pickPhoneNumberId, sameNumber } from "./outbound";

describe("изходящото обаждане от Коста", () => {
  it("познава един и същ номер в различни изписвания", () => {
    expect(sameNumber("+1 475 426 9084", "+14754269084")).toBe(true);
    expect(sameNumber("+14754269084", "+15093511914")).toBe(false);
    expect(sameNumber("", "")).toBe(false);
  });

  it("намира phone_number_id и в гол масив, и в обвивка", () => {
    const rows = [
      { phone_number: "+15093511914", phone_number_id: "pn_crm" },
      { phone_number: "+14754269084", phone_number_id: "pn_recepcia" },
    ];
    expect(pickPhoneNumberId(rows, "+14754269084")).toBe("pn_recepcia");
    expect(pickPhoneNumberId({ phone_numbers: rows }, "+1 475 426 9084")).toBe("pn_recepcia");
    expect(pickPhoneNumberId(rows, "+359888000000")).toBeNull();
    expect(pickPhoneNumberId(null, "+14754269084")).toBeNull();
    expect(pickPhoneNumberId([{ phone_number: 5 }], "+14754269084")).toBeNull();
  });

  it("строи тялото точно както го иска ElevenLabs", () => {
    const body = buildOutboundPayload({
      agentId: "agent_x",
      phoneNumberId: "pn_recepcia",
      toNumber: "+359877399963",
      variables: { ime: "Иван", kanal: "sait", sesia: "vs_1" },
    });
    expect(body).toEqual({
      agent_id: "agent_x",
      agent_phone_number_id: "pn_recepcia",
      to_number: "+359877399963",
      conversation_initiation_client_data: {
        dynamic_variables: { ime: "Иван", kanal: "sait", sesia: "vs_1" },
      },
    });
  });
});
