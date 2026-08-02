import { JourneyContinuity, NextStepBanner } from "@/components/workflow/MasterJourney";
import type { MasterJourneyId } from "@/lib/workflow";

/** Keep CRM staff in the funnel until a booking exists. */
export function CrmJourneyBanner({ stage }: { stage: "lead" | "opportunity" | "quotation" | "task" }) {
  const journeyActive: MasterJourneyId =
    stage === "quotation" ? "booking" : stage === "opportunity" ? "customer" : "lead";

  const copy = {
    lead: {
      title: "Convert this lead — don't leave CRM early",
      body: "Lead → Opportunity → Quotation → Customer → Booking. Use convert actions, then open Booking 360.",
      previousHint: "Inquiry captured",
      nextHint: "Create or advance an opportunity",
      actions: [
        { label: "Opportunities", to: "/crm/opportunities", primary: true },
        { label: "New booking wizard", to: "/bookings/new" },
      ],
    },
    opportunity: {
      title: "Move opportunity to quotation or booking",
      body: "Negotiate in CRM, issue a quotation, then convert to a booking without recreating the customer.",
      previousHint: "Lead qualified",
      nextHint: "Issue quotation or convert to booking",
      actions: [
        { label: "Quotations", to: "/sales/quotations", primary: true },
        { label: "Unified booking", to: "/bookings/new" },
      ],
    },
    quotation: {
      title: "Win the quote → create booking",
      body: "Convert quotation to booking, then finish documents, OCR, invoice and payment in one journey.",
      previousHint: "Opportunity negotiated",
      nextHint: "Booking + OCR + finance",
      actions: [
        { label: "Sales quotations", to: "/sales/quotations", primary: true },
        { label: "Booking wizard", to: "/bookings/new" },
      ],
    },
    task: {
      title: "Tasks feed the CRM journey",
      body: "Complete follow-ups, then return to the opportunity or quotation — never start a disconnected booking.",
      previousHint: "CRM activity",
      nextHint: "Return to pipeline",
      actions: [
        { label: "Pipeline", to: "/sales", primary: true },
        { label: "Leads", to: "/crm" },
      ],
    },
  }[stage];

  return (
    <div className="mb-4 space-y-3">
      <JourneyContinuity
        active={journeyActive}
        previousHint={copy.previousHint}
        nextHint={copy.nextHint}
      />
      <NextStepBanner title={copy.title} body={copy.body} actions={copy.actions} />
    </div>
  );
}

/** Banner linking service desk pages into Booking 360. */
export function Booking360Banner({ appId, customerId }: { appId: string; customerId?: string }) {
  return (
    <div className="mb-4 space-y-3">
      <JourneyContinuity
        active="operations"
        previousHint="Booking created"
        nextHint="Documents → OCR → finance on Booking 360"
      />
      <NextStepBanner
        title="You are on the service desk"
        body="Booking 360 holds documents, OCR, finance, timeline and audit. Use this desk for deep service processing only — stay in the same journey."
        actions={[
          { label: "Open Booking 360", to: `/bookings/${appId}`, primary: true },
          ...(customerId ? [{ label: "Customer 360", to: `/customers/${customerId}` }] : []),
          { label: "Operations queue", to: "/operations" },
        ]}
      />
    </div>
  );
}
