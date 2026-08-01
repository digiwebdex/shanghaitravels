/**
 * Company facts, in one place.
 *
 * These used to be spread across `home/v4/tokens.ts`, the footer, the contact
 * page and the ERP seed, and had drifted apart — the footer advertised a
 * Banani address the company had left, while the ERP seed and the homepage
 * copy already said Vatara. Anything that renders an address, phone number,
 * email or opening hours should read from here.
 */

export type Office = {
  label: string;
  /** Street line, rendered above `area` in the footer and contact cards. */
  street: string;
  area: string;
  mapQuery: string;
};

export const COMPANY_NAME = "Shanghai Travels";

export const OFFICES: Office[] = [
  {
    label: "Corporate Office",
    street: "House-5, Level-4, Road-4, Baridhara",
    area: "Vatara, Dhaka-1212, Bangladesh",
    mapQuery: "House-5, Road-4, Baridhara, Vatara, Dhaka-1212, Bangladesh",
  },
  {
    label: "Head Office",
    street: "Dag No-1199, Natun Bazar (100 Fit)",
    area: "Vatara, Dhaka-1212, Bangladesh",
    mapQuery: "Dag No-1199, Natun Bazar, 100 Feet Road, Vatara, Dhaka-1212, Bangladesh",
  },
];

export const CORPORATE_OFFICE = OFFICES[0];
export const HEAD_OFFICE = OFFICES[1];

/** Display form. Use `telHref`/`waHref` for links so the formatting stays here. */
export const HOTLINE = "+880 1333-356393";
export const HOTLINE_ALT = "+880 1742-255003";

/** Both hotlines are reachable on WhatsApp. */
export const PHONES = [HOTLINE, HOTLINE_ALT];

export const EMAIL = "shanghaitravelsbd@gmail.com";

export const OPENING_HOURS = "Sat – Sun: 9:00 AM – 6:00 PM";

export const REG_NO = "0017053";

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function waHref(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function mapHref(office: Office): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapQuery)}`;
}
