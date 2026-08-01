import biman from "../../assets/partners/biman.svg";
import britishAirways from "../../assets/partners/british-airways.svg";
import emirates from "../../assets/partners/emirates.svg";
import malaysiaAirlines from "../../assets/partners/malaysia-airlines.svg";
import qatarAirways from "../../assets/partners/qatar-airways.svg";
import saudia from "../../assets/partners/saudia.svg";
import singaporeAirlines from "../../assets/partners/singapore-airlines.svg";
import turkishAirlines from "../../assets/partners/turkish-airlines.svg";

export type PartnerLogo = {
  name: string;
  src: string;
  /**
   * Cap height for this mark. Airline logos range from British Airways at
   * roughly 6.4:1 to Saudia in portrait at 0.84:1, so a single max-height puts
   * the stacked marks at twice the optical weight of the wide wordmarks. These
   * are tuned per logo to make the row read evenly.
   */
  height: string;
};

/**
 * Airline marks shown when the CMS gallery has no uploaded logos. Bundled
 * rather than hotlinked so the row cannot break on a third party going away,
 * and imported so the build fingerprints them.
 */
export const DEFAULT_PARTNER_LOGOS: PartnerLogo[] = [
  { name: "Emirates", src: emirates, height: "h-11" },
  { name: "Qatar Airways", src: qatarAirways, height: "h-8" },
  { name: "Turkish Airlines", src: turkishAirlines, height: "h-7" },
  { name: "Saudia", src: saudia, height: "h-12" },
  { name: "Singapore Airlines", src: singaporeAirlines, height: "h-9" },
  { name: "British Airways", src: britishAirways, height: "h-5" },
  { name: "Malaysia Airlines", src: malaysiaAirlines, height: "h-7" },
  { name: "Biman Bangladesh Airlines", src: biman, height: "h-5" },
];
