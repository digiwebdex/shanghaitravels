import { MasterJourneyStrip, NextStepBanner } from "@/components/workflow/MasterJourney";

/** Keep CRM staff in the funnel until a booking exists. */
export function CrmJourneyBanner({ stage }: { stage: "lead" | "opportunity" | "quotation" | "task" }) {
  const copy = {
    lead: {
      title: "Convert this lead — don't leave CRM early",
      body: "Lead → Opportunity → Quotation → Customer → Booking. Use convert actions, then open Booking 360.",
      actions: [
        { label: "Opportunities", to: "/crm/opportunities", primary: true },
        { label: "New booking wizard", to: "/bookings/new" },
      ],
    },
    opportunity: {
      title: "Move opportunity to quotation or booking",
      body: "Negotiate in CRM, issue a quotation, then convert to a booking without recreating the customer.",
      actions: [
        { label: "Quotations", to: "/sales/quotations", primary: true },
        { label: "Unified booking", to: "/bookings/new" },
      ],
    },
    quotation: {
      title: "Win the quote → create booking",
      body: "Convert quotation to booking, then finish documents, OCR, invoice and payment in one journey.",
      actions: [
        { label: "Sales quotations", to: "/sales/quotations", primary: true },
        { label: "Booking wizard", to: "/bookings/new" },
      ],
    },
    task: {
      title: "Tasks feed the CRM journey",
      body: "Complete follow-ups, then return to the opportunity or quotation — never start a disconnected booking.",
      actions: [
        { label: "Pipeline", to: "/sales", primary: true },
        { label: "Leads", to: "/crm" },
      ],
    },
  }[stage];

  return (
    <div className="mb-4 space-y-3">
      <MasterJourneyStrip active="lead" compact />
      <NextStepBanner title={copy.title} body={copy.body} actions={copy.actions} />
    </div>
  );
}

/** Banner linking service desk pages into Booking 360. */
export function Booking360Banner({ appId, customerId }: { appId: string; customerId?: string }) {
  return (
    <NextStepBanner
      title="You are on the service desk"
      body="Booking 360 holds documents, OCR, finance, timeline and audit. Use this desk for deep service processing only."
      actions={[
        { label: "Open Booking 360", to: `/bookings/${appId}`, primary: true },
        ...(customerId ? [{ label: "Customer 360", to: `/customers/${customerId}` }] : []),
        { label: "Operations queue", to: "/operations" },
      ]}
    />
  );
}
