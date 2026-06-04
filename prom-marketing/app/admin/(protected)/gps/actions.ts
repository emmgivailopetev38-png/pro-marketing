"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { GPS_DEVICE_STATUSES, GPS_EVENT_TYPES } from "@/lib/crm/types";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Add a GPS device for a client (by email) + log the initial install event. */
export async function createGpsDeviceAction(formData: FormData) {
  await requireAdmin();
  const svc = createServiceClient();

  let contactId = str(formData.get("contact_id"));
  const email = str(formData.get("client_email"));
  if (!contactId && email) {
    const { data } = await svc.from("contacts").select("id").eq("email", email.toLowerCase()).maybeSingle();
    if (!data) throw new Error("Няма контакт с този имейл");
    contactId = data.id;
  }
  if (!contactId) throw new Error("Избери клиент (имейл)");

  const installedAt = str(formData.get("installed_at")) ?? today();
  const currency = str(formData.get("currency")) ?? "EUR";
  const plate = str(formData.get("vehicle_plate"));

  const { data: device, error } = await svc
    .from("gps_devices")
    .insert({
      contact_id: contactId,
      label: str(formData.get("label")),
      imei: str(formData.get("imei")),
      sim: str(formData.get("sim")),
      vehicle_plate: plate,
      vehicle_model: str(formData.get("vehicle_model")),
      monthly_fee: num(formData.get("monthly_fee")),
      currency,
      status: "active",
      installed_at: installedAt,
      notes: str(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error || !device) throw new Error(error?.message ?? "insert failed");

  await svc.from("gps_events").insert({
    device_id: device.id,
    contact_id: contactId,
    event_type: "install",
    event_date: installedAt,
    to_vehicle: plate ?? null,
    price: num(formData.get("install_price")),
    currency,
    technician: str(formData.get("technician")),
    notes: "Монтаж при добавяне",
  });

  revalidatePath("/admin/gps");
}

/** Log a device event (install/uninstall/move/…) and sync device status/vehicle. */
export async function logGpsEventAction(formData: FormData) {
  await requireAdmin();
  const deviceId = str(formData.get("device_id"));
  const eventType = str(formData.get("event_type"));
  if (!deviceId || !eventType || !GPS_EVENT_TYPES.includes(eventType as (typeof GPS_EVENT_TYPES)[number])) {
    throw new Error("Invalid input");
  }
  const svc = createServiceClient();
  const { data: device } = await svc
    .from("gps_devices")
    .select("contact_id, vehicle_plate")
    .eq("id", deviceId)
    .maybeSingle();

  const eventDate = str(formData.get("event_date")) ?? today();
  const toVehicle = str(formData.get("to_vehicle"));

  await svc.from("gps_events").insert({
    device_id: deviceId,
    contact_id: (device?.contact_id as string | null) ?? null,
    event_type: eventType,
    event_date: eventDate,
    from_vehicle: eventType === "move" ? (device?.vehicle_plate as string | null) ?? null : null,
    to_vehicle: toVehicle ?? null,
    price: num(formData.get("price")),
    currency: "EUR",
    technician: str(formData.get("technician")),
    notes: str(formData.get("notes")),
  });

  const patch: Record<string, unknown> = {};
  if (eventType === "uninstall") {
    patch.status = "removed";
    patch.removed_at = eventDate;
  } else if (eventType === "move") {
    if (toVehicle) patch.vehicle_plate = toVehicle;
    patch.status = "active";
  } else if (eventType === "pause") {
    patch.status = "paused";
  } else if (eventType === "resume" || eventType === "install" || eventType === "swap") {
    patch.status = "active";
  }
  if (Object.keys(patch).length > 0) {
    await svc.from("gps_devices").update(patch).eq("id", deviceId);
  }

  revalidatePath("/admin/gps");
}

/** Quick status change on a device. */
export async function setGpsDeviceStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("device_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !GPS_DEVICE_STATUSES.includes(status as (typeof GPS_DEVICE_STATUSES)[number])) {
    throw new Error("Invalid input");
  }
  const svc = createServiceClient();
  await svc.from("gps_devices").update({ status }).eq("id", id);
  revalidatePath("/admin/gps");
}
