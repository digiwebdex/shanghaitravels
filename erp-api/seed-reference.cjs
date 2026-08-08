// Reference data + config widening + manpower workflow. Idempotent. Real data only.
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

// ISO 3166-1 countries (real reference list). [iso2, name, region]
const COUNTRIES = [
["CN","China","Asia"],["BD","Bangladesh","Asia"],["IN","India","Asia"],["PK","Pakistan","Asia"],["NP","Nepal","Asia"],["LK","Sri Lanka","Asia"],["BT","Bhutan","Asia"],["MV","Maldives","Asia"],["MM","Myanmar","Asia"],["TH","Thailand","Asia"],["VN","Vietnam","Asia"],["KH","Cambodia","Asia"],["LA","Laos","Asia"],["MY","Malaysia","Asia"],["SG","Singapore","Asia"],["ID","Indonesia","Asia"],["PH","Philippines","Asia"],["BN","Brunei","Asia"],["TL","Timor-Leste","Asia"],["JP","Japan","Asia"],["KR","South Korea","Asia"],["KP","North Korea","Asia"],["MN","Mongolia","Asia"],["HK","Hong Kong","Asia"],["MO","Macao","Asia"],["TW","Taiwan","Asia"],
["AE","United Arab Emirates","Middle East"],["SA","Saudi Arabia","Middle East"],["QA","Qatar","Middle East"],["KW","Kuwait","Middle East"],["BH","Bahrain","Middle East"],["OM","Oman","Middle East"],["JO","Jordan","Middle East"],["LB","Lebanon","Middle East"],["IQ","Iraq","Middle East"],["IR","Iran","Middle East"],["IL","Israel","Middle East"],["PS","Palestine","Middle East"],["SY","Syria","Middle East"],["YE","Yemen","Middle East"],["TR","Turkey","Middle East"],
["AF","Afghanistan","Asia"],["KZ","Kazakhstan","Asia"],["UZ","Uzbekistan","Asia"],["TM","Turkmenistan","Asia"],["KG","Kyrgyzstan","Asia"],["TJ","Tajikistan","Asia"],["AZ","Azerbaijan","Asia"],["AM","Armenia","Asia"],["GE","Georgia","Asia"],
["GB","United Kingdom","Europe"],["IE","Ireland","Europe"],["FR","France","Europe"],["DE","Germany","Europe"],["IT","Italy","Europe"],["ES","Spain","Europe"],["PT","Portugal","Europe"],["NL","Netherlands","Europe"],["BE","Belgium","Europe"],["LU","Luxembourg","Europe"],["CH","Switzerland","Europe"],["AT","Austria","Europe"],["SE","Sweden","Europe"],["NO","Norway","Europe"],["DK","Denmark","Europe"],["FI","Finland","Europe"],["IS","Iceland","Europe"],["PL","Poland","Europe"],["CZ","Czechia","Europe"],["SK","Slovakia","Europe"],["HU","Hungary","Europe"],["RO","Romania","Europe"],["BG","Bulgaria","Europe"],["GR","Greece","Europe"],["HR","Croatia","Europe"],["SI","Slovenia","Europe"],["RS","Serbia","Europe"],["BA","Bosnia and Herzegovina","Europe"],["MK","North Macedonia","Europe"],["AL","Albania","Europe"],["ME","Montenegro","Europe"],["XK","Kosovo","Europe"],["UA","Ukraine","Europe"],["BY","Belarus","Europe"],["MD","Moldova","Europe"],["RU","Russia","Europe"],["EE","Estonia","Europe"],["LV","Latvia","Europe"],["LT","Lithuania","Europe"],["MT","Malta","Europe"],["CY","Cyprus","Europe"],
["US","United States","Americas"],["CA","Canada","Americas"],["MX","Mexico","Americas"],["BR","Brazil","Americas"],["AR","Argentina","Americas"],["CL","Chile","Americas"],["CO","Colombia","Americas"],["PE","Peru","Americas"],["VE","Venezuela","Americas"],["EC","Ecuador","Americas"],["BO","Bolivia","Americas"],["PY","Paraguay","Americas"],["UY","Uruguay","Americas"],["CR","Costa Rica","Americas"],["PA","Panama","Americas"],["GT","Guatemala","Americas"],["CU","Cuba","Americas"],["DO","Dominican Republic","Americas"],["JM","Jamaica","Americas"],["TT","Trinidad and Tobago","Americas"],
["AU","Australia","Oceania"],["NZ","New Zealand","Oceania"],["FJ","Fiji","Oceania"],["PG","Papua New Guinea","Oceania"],
["EG","Egypt","Africa"],["MA","Morocco","Africa"],["DZ","Algeria","Africa"],["TN","Tunisia","Africa"],["LY","Libya","Africa"],["SD","Sudan","Africa"],["ET","Ethiopia","Africa"],["KE","Kenya","Africa"],["TZ","Tanzania","Africa"],["UG","Uganda","Africa"],["RW","Rwanda","Africa"],["NG","Nigeria","Africa"],["GH","Ghana","Africa"],["CI","Cote d'Ivoire","Africa"],["SN","Senegal","Africa"],["CM","Cameroon","Africa"],["ZA","South Africa","Africa"],["ZW","Zimbabwe","Africa"],["ZM","Zambia","Africa"],["MZ","Mozambique","Africa"],["AO","Angola","Africa"],["BW","Botswana","Africa"],["NA","Namibia","Africa"],["MU","Mauritius","Africa"],["MG","Madagascar","Africa"],["DJ","Djibouti","Africa"],["SO","Somalia","Africa"],["ML","Mali","Africa"],["BF","Burkina Faso","Africa"],["NE","Niger","Africa"],["TD","Chad","Africa"],["GN","Guinea","Africa"],["BJ","Benin","Africa"],["TG","Togo","Africa"],["SL","Sierra Leone","Africa"],["LR","Liberia","Africa"],["GM","Gambia","Africa"],["MW","Malawi","Africa"],["GA","Gabon","Africa"],["CG","Congo","Africa"],["CD","DR Congo","Africa"],["ER","Eritrea","Africa"],["SS","South Sudan","Africa"],["CF","Central African Republic","Africa"],["GQ","Equatorial Guinea","Africa"],["GW","Guinea-Bissau","Africa"],["CV","Cabo Verde","Africa"],["ST","Sao Tome and Principe","Africa"],["KM","Comoros","Africa"],["SC","Seychelles","Africa"],["LS","Lesotho","Africa"],["SZ","Eswatini","Africa"],["BI","Burundi","Africa"],["MR","Mauritania","Africa"],
["BS","Bahamas","Americas"],["BB","Barbados","Americas"],["BZ","Belize","Americas"],["GY","Guyana","Americas"],["SR","Suriname","Americas"],["HT","Haiti","Americas"],["HN","Honduras","Americas"],["NI","Nicaragua","Americas"],["SV","El Salvador","Americas"],["AG","Antigua and Barbuda","Americas"],["LC","Saint Lucia","Americas"],["GD","Grenada","Americas"],["DM","Dominica","Americas"],["KN","Saint Kitts and Nevis","Americas"],["VC","Saint Vincent and the Grenadines","Americas"],
["AD","Andorra","Europe"],["MC","Monaco","Europe"],["SM","San Marino","Europe"],["LI","Liechtenstein","Europe"],["VA","Vatican City","Europe"],
["SB","Solomon Islands","Oceania"],["VU","Vanuatu","Oceania"],["WS","Samoa","Oceania"],["TO","Tonga","Oceania"],["KI","Kiribati","Oceania"],["FM","Micronesia","Oceania"],["MH","Marshall Islands","Oceania"],["PW","Palau","Oceania"],["NR","Nauru","Oceania"],["TV","Tuvalu","Oceania"],
];

const AIRLINES = [
["Air China","CA","CCA","China"],["China Southern Airlines","CZ","CSN","China"],["China Eastern Airlines","MU","CES","China"],["Xiamen Airlines","MF","CXA","China"],["Hainan Airlines","HU","CHH","China"],["Shenzhen Airlines","ZH","CSZ","China"],["Sichuan Airlines","3U","CSC","China"],["Shandong Airlines","SC","CDG","China"],["Kunming Airlines","KY","KNA","China"],["Juneyao Airlines","HO","DKH","China"],["Spring Airlines","9C","CQH","China"],["Cathay Pacific","CX","CPA","Hong Kong"],["Hong Kong Airlines","HX","CRK","Hong Kong"],
["Biman Bangladesh Airlines","BG","BBC","Bangladesh"],["US-Bangla Airlines","BS","UBG","Bangladesh"],["Air Astra","2A","AWZ","Bangladesh"],["Novoair","VQ","NVQ","Bangladesh"],
["Singapore Airlines","SQ","SIA","Singapore"],["Malaysia Airlines","MH","MAS","Malaysia"],["Thai Airways","TG","THA","Thailand"],["Thai AirAsia","FD","AIQ","Thailand"],["AirAsia","AK","AXM","Malaysia"],
["Emirates","EK","UAE","UAE"],["Etihad Airways","EY","ETD","UAE"],["Flydubai","FZ","FDB","UAE"],["Qatar Airways","QR","QTR","Qatar"],["Saudia","SV","SVA","Saudi Arabia"],["Gulf Air","GF","GFA","Bahrain"],["Kuwait Airways","KU","KAC","Kuwait"],["Oman Air","WY","OMA","Oman"],["Turkish Airlines","TK","THY","Turkey"],
["IndiGo","6E","IGO","India"],["Air India","AI","AIC","India"],["SpiceJet","SG","SEJ","India"],["SriLankan Airlines","UL","ALK","Sri Lanka"],["Nepal Airlines","RA","RNA","Nepal"],["Himalaya Airlines","H9","HIM","Nepal"],
["British Airways","BA","BAW","United Kingdom"],["Lufthansa","LH","DLH","Germany"],["KLM","KL","KLM","Netherlands"],["Air France","AF","AFR","France"],["Qantas","QF","QFA","Australia"],["Korean Air","KE","KAL","South Korea"],["Asiana Airlines","OZ","AAR","South Korea"],["Japan Airlines","JL","JAL","Japan"],["All Nippon Airways","NH","ANA","Japan"],
];

const HOTELS = [
["The Peninsula Beijing","China","Beijing",5],["Grand Hyatt Shanghai","China","Shanghai",5],["White Swan Hotel","China","Guangzhou",5],["The Ritz-Carlton Shenzhen","China","Shenzhen",5],["Sofitel Chengdu","China","Chengdu",5],
["Pan Pacific Dhaka","Bangladesh","Dhaka",5],["InterContinental Dhaka","Bangladesh","Dhaka",5],["Le Méridien Dhaka","Bangladesh","Dhaka",5],
["Marina Bay Sands","Singapore","Singapore",5],["Burj Al Arab Jumeirah","UAE","Dubai",5],["Atlantis The Palm","UAE","Dubai",5],
["Fairmont Makkah Clock Royal Tower","Saudi Arabia","Makkah",5],["The Shard - Shangri-La","United Kingdom","London",5],["Mandarin Oriental Bangkok","Thailand","Bangkok",5],["Genting Grand","Malaysia","Genting",5],
];

const UNIVERSITIES = [
["Tsinghua University","China","Beijing"],["Peking University","China","Beijing"],["Fudan University","China","Shanghai"],["Shanghai Jiao Tong University","China","Shanghai"],["Zhejiang University","China","Hangzhou"],["Wuhan University","China","Wuhan"],["Sun Yat-sen University","China","Guangzhou"],["Sichuan University","China","Chengdu"],["Nanjing University","China","Nanjing"],["Xi'an Jiaotong University","China","Xi'an"],
["University of Dhaka","Bangladesh","Dhaka"],["BUET","Bangladesh","Dhaka"],
["National University of Singapore","Singapore","Singapore"],["University of Malaya","Malaysia","Kuala Lumpur"],["University of Toronto","Canada","Toronto"],
];

const ALL_SERVICES = ["visa","air_ticket","hotel","tour","hajj","umrah","student","medical","immigration","insurance","transport","corporate","work"];

(async () => {
  // Countries
  let n = 0;
  for (const [iso2, name, region] of COUNTRIES) {
    await p.country.upsert({
      where: { iso2 },
      update: { name, region, isFeatured: iso2 === "CN", isActive: true, sortOrder: iso2 === "CN" ? 1 : (iso2 === "BD" ? 2 : 100) },
      create: { iso2, name, region, isFeatured: iso2 === "CN", sortOrder: iso2 === "CN" ? 1 : (iso2 === "BD" ? 2 : 100) },
    });
    n++;
  }
  console.log("Countries:", n);

  // Airlines
  let a = 0;
  for (const [name, iata, icao, country] of AIRLINES) {
    await p.airline.upsert({ where: { name }, update: { iata, icao, country, isActive: true }, create: { name, iata, icao, country } });
    a++;
  }
  console.log("Airlines:", a);

  // Example hotels / universities (marked isExample, staff can edit/remove)
  let h = 0;
  for (const [name, country, city, stars] of HOTELS) {
    const ex = await p.hotel.findFirst({ where: { name, isExample: true } });
    if (!ex) { await p.hotel.create({ data: { name, country, city, stars, isExample: true, createdBy: "seed" } }); h++; }
  }
  console.log("Example hotels added:", h);
  let u = 0;
  for (const [name, country, city] of UNIVERSITIES) {
    const ex = await p.university.findFirst({ where: { name, isExample: true } });
    if (!ex) { await p.university.create({ data: { name, country, city, isExample: true, createdBy: "seed" } }); u++; }
  }
  console.log("Example universities added:", u);

  // Widen config (data only)
  await p.setting.upsert({ where: { key: "active_services" }, update: { value: ALL_SERVICES }, create: { key: "active_services", value: ALL_SERVICES } });
  const featured = COUNTRIES.filter(c => ["CN","BD","AE","SA","QA","MY","SG","TH","GB","US","CA","AU"].includes(c[0])).map(c => c[1]);
  await p.setting.upsert({
    where: { key: "public_site_config" },
    update: { value: { origin: "Bangladesh", allCountries: true, featuredDestinations: featured, services: ALL_SERVICES } },
    create: { key: "public_site_config", value: { origin: "Bangladesh", allCountries: true, featuredDestinations: featured, services: ALL_SERVICES } },
  });
  console.log("Settings widened: active_services=all 12, public_site_config=all-country");

  // Manpower workflow (work v2) — real recruitment flow; deactivate the Z-visa v1
  const stages = ["Job Order","Document Collection","Medical","Work Permit / Visa","Embassy Processing","Deployment & Handover"];
  let wf = await p.workflowTemplate.findFirst({ where: { serviceType: "work", version: 2 } });
  if (!wf) {
    // deactivate the currently-active work template FIRST (partial unique: one active per serviceType)
    await p.workflowTemplate.updateMany({ where: { serviceType: "work", isActive: true }, data: { isActive: false } });
    wf = await p.workflowTemplate.create({ data: { serviceType: "work", name: "Manpower (recruitment)", version: 2, isActive: true, createdBy: "seed",
      stages: { create: stages.map((name, i) => ({ stageNo: i + 1, name })) } } });
    console.log("Manpower workflow v2 created + activated; prior work workflow deactivated");
  } else {
    console.log("Manpower workflow v2 already exists");
  }
  await p.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
