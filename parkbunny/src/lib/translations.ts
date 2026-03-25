// Lightweight i18n for public reports — EN and NL
export type Language = 'en' | 'nl'

const dict: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.title': 'Revenue Enhancement Report',
    'header.preparedFor': 'Prepared for',
    'header.scope': 'Scope',
    'header.locations': 'location',
    'header.locations_plural': 'locations',
    'header.postcodesAnalyzed': 'Postcodes analyzed',
    'header.reportDate': 'Report date',
    'header.tagline': 'Unlock {highlight}new revenue{/highlight} by activating nearby businesses and rewarding drivers {muted}— with no CapEx or extra ops.{/muted}',
    'header.marketContext.GB': 'There are ~17k–20k public off‑street car parks in Great Britain, yet most remain transactional rather than demand‑driven.',
    'header.marketContext.NL': 'The Netherlands has over 700,000 managed parking spaces, yet most remain purely transactional rather than demand‑driven.',
    'header.partnershipsIntro': 'ParkBunny activates partnerships through deals with:',

    // Sections
    'section.executiveSummary': 'Executive Summary of the Local Area',
    'section.executiveSummary.p1': 'The analyzed catchments present strong demand drivers across hospitality, fitness, and professional services. Weekday occupancy is shaped by nearby offices and co-working hubs; evenings and weekends benefit from restaurants and entertainment venues. Seasonal peaks (e.g., holidays, events) further lift demand. ParkBunny converts this latent demand via targeted partnerships and instant in‑app offers.',
    'section.executiveSummary.p2': 'This narrative reflects observable local activity patterns and known anchors (e.g., visitor attractions, regular events, and transport hubs) to guide partnership prioritization and activation sequencing.',

    'section.appShowcase': 'Smart Parking Management (App)',
    'section.appShowcase.description': 'Our platform enables multi‑location partnership management, centralized revenue tracking, and instant promotional tools that convert nearby demand into measurable parking revenue. Operators can create partner‑specific offers and validated parking links, schedule time‑of‑day incentives, and monitor uplift across sites with transparent reporting. Below is a mockup illustrating the operator console.',
    'section.driverExperience': 'The Driver Experience',

    'section.driverRewards': 'Driver Rewards & Loyalty',
    'section.driverRewards.description': 'ParkBunny incentivises drivers with exclusive rewards, cashback, and partner offers — driving repeat visits, higher dwell time, and increased spend across on-site services.',
    'section.driverRewards.exclusive': 'Exclusive Rewards',
    'section.driverRewards.exclusiveDesc': 'Partner offers and cashback for regular drivers',
    'section.driverRewards.repeat': 'Repeat Visits',
    'section.driverRewards.repeatDesc': 'Loyalty incentives that keep drivers coming back',
    'section.driverRewards.spend': 'Increased Spend',
    'section.driverRewards.spendDesc': 'Higher dwell time drives revenue across all services',

    'section.whatMakesDifferent': 'What Makes ParkBunny Different',
    'section.whatMakesDifferent.b1': 'Beyond \u201Cpay and leave\u201D: Instant Local Deals to reward drivers and lift merchant footfall',
    'section.whatMakesDifferent.b2': 'Direct comms + real\u2011time control: target offers, adjust tariffs, view behaviour analytics across sites',
    'section.whatMakesDifferent.b3': 'Multi\u2011location rollout: centralised partner management, signage, codes/validation, merchant onboarding',

    'section.activationPlan': 'Activation Plan',
    'section.activationPlan.b1': 'Weeks 0\u20132: site checks, signage assets, shortlist & outreach to top categories; enable validated/discounted links',
    'section.activationPlan.b2': 'Weeks 3\u20134: first offers live; event\u2011aligned promos; test off\u2011peak pricing',
    'section.activationPlan.b3': 'Weeks 5\u20136: expand partners; optimise offers by time of day; push loyalty nudges in\u2011app',
    'section.activationPlan.metrics': 'Success metrics: +paid sessions vs. baseline, partner count, validation/redemption rate, repeat sessions, off\u2011peak fill.',

    'section.measurement': 'Measurement & Reporting',
    'section.measurement.b1': 'Core KPIs: paid sessions, conversion from partner clicks/validations, avg stay, yield by hour/day, repeat rate',
    'section.measurement.b2': 'Partner KPIs: redemptions, new vs returning mix, top\u2011performing offers',
    'section.measurement.b3': 'Operator dashboard: tariff edits, offer scheduling, multi\u2011site comparisons (monthly PDF + live)',

    'section.compliance': 'Compliance & Good Practice',
    'section.compliance.b1': 'Clear signage & terms (Code of Practice alignment)',
    'section.compliance.b2': 'Privacy: ANPR/CCTV and app data handled under UK GDPR/DPA; proportionate, transparent use',

    // Partnership Opportunity Model
    'section.partnershipModel': 'Partnership Opportunity Model',
    'section.partnershipModel.conservative': 'Conservative',
    'section.partnershipModel.conservativeDesc': 'Limited number of local sign\u2011ups across early partner categories; focus on validated parking and simple offers to prove traction.',
    'section.partnershipModel.expected': 'Expected',
    'section.partnershipModel.stretch': 'Stretch',

    // Interactive Stream Section
    'section.additionalUplift': 'Additional Portfolio Uplift',
    'section.additionalUplift.subtitle': 'Subject to site surveys — projected upside from additional services deployed across the portfolio.',
    'section.revenueSummary': 'Portfolio Revenue Summary',
    'section.revenueSummary.stream': 'Revenue Stream',
    'section.revenueSummary.sites': 'Sites',
    'section.revenueSummary.annual': 'Annual Revenue',
    'section.revenueSummary.status': 'Status',
    'section.revenueSummary.baseline': 'Portfolio Baseline',
    'section.revenueSummary.localOffers': 'Local Offers Uplift',
    'section.revenueSummary.total': 'Total Revenue Opportunity',
    'section.revenueSummary.current': 'Current',
    'section.revenueSummary.projected': 'Projected',
    'stream.includeInSummary': 'Include in Revenue Summary',
    'stream.includedInSummary': '✓ Included in Revenue Summary',
    'stream.perSiteYear': 'Per site/year',
    'stream.perLockerYear': 'Per locker/year',
    'stream.portfolioTotal': 'Portfolio Total',
    'stream.estimatedPerEvent': 'Estimated per event',
    'stream.estimatedPerSiteYear': 'Estimated per site/year',
    'stream.subjectToSurvey': '⚠️ Subject to survey',
    'stream.implementationNotes': 'Implementation Notes',
    'stream.implementationNotesText': 'All opportunities subject to site survey and feasibility assessment. Partnership negotiations and planning permissions may apply.',
    'stream.includedHint': 'additional revenue streams included. All ancillary figures are annualised estimates subject to site surveys and feasibility assessment.',
    'stream.notIncludedHint': 'Use the checkboxes above to include additional revenue streams in this summary.',

    // Footer
    'footer.copyright': '© {year} ParkBunny',

    // Revenue tab drivers
    'revenue.drivers': 'Drivers: partner sign\u2011ups, offer redemption/validation, off\u2011peak pricing optimisation, and repeat behaviour (loyalty).',
  },

  nl: {
    // Header
    'header.title': 'Rapport Inkomstenverbetering',
    'header.preparedFor': 'Opgesteld voor',
    'header.scope': 'Omvang',
    'header.locations': 'locatie',
    'header.locations_plural': 'locaties',
    'header.postcodesAnalyzed': 'Geanalyseerde postcodes',
    'header.reportDate': 'Rapportdatum',
    'header.tagline': 'Ontgrendel {highlight}nieuwe inkomsten{/highlight} door nabijgelegen bedrijven te activeren en bestuurders te belonen {muted}— zonder CapEx of extra operationele kosten.{/muted}',
    'header.marketContext.GB': 'There are ~17k–20k public off‑street car parks in Great Britain, yet most remain transactional rather than demand‑driven.',
    'header.marketContext.NL': 'Nederland heeft meer dan 700.000 beheerde parkeerplaatsen, maar de meeste blijven puur transactioneel in plaats van vraaggestuurd.',
    'header.partnershipsIntro': 'ParkBunny activeert partnerschappen via deals met:',

    // Sections
    'section.executiveSummary': 'Samenvatting van het Lokale Gebied',
    'section.executiveSummary.p1': 'De geanalyseerde gebieden vertonen sterke vraagfactoren in horeca, fitness en zakelijke dienstverlening. Doordeweeks wordt de bezettingsgraad bepaald door nabijgelegen kantoren en coworking-ruimtes; avonden en weekenden profiteren van restaurants en uitgaansgelegenheden. Seizoenspieken (bijv. feestdagen, evenementen) verhogen de vraag verder. ParkBunny zet deze latente vraag om via gerichte partnerschappen en directe in-app aanbiedingen.',
    'section.executiveSummary.p2': 'Dit verhaal weerspiegelt waarneembare lokale activiteitspatronen en bekende ankerpunten (bijv. bezienswaardigheden, reguliere evenementen en vervoersknooppunten) om de prioritering van partnerschappen en activeringsplanning te sturen.',

    'section.appShowcase': 'Slim Parkeerbeheer (App)',
    'section.appShowcase.description': 'Ons platform maakt multi-locatie partnerbeheer, gecentraliseerde omzetregistratie en directe promotie-instrumenten mogelijk die nabijgelegen vraag omzetten in meetbare parkeerinkomsten. Operators kunnen partnerspecifieke aanbiedingen en gevalideerde parkeerlinks maken, tijdgebonden incentives plannen en de groei op alle locaties monitoren met transparante rapportage.',
    'section.driverExperience': 'De Bestuurderservaring',

    'section.driverRewards': 'Beloningen en Loyaliteit voor Bestuurders',
    'section.driverRewards.description': 'ParkBunny beloont bestuurders met exclusieve voordelen, cashback en partneraanbiedingen — wat zorgt voor herhaalde bezoeken, langere verblijfstijd en hogere uitgaven aan diensten op locatie.',
    'section.driverRewards.exclusive': 'Exclusieve Beloningen',
    'section.driverRewards.exclusiveDesc': 'Partneraanbiedingen en cashback voor vaste bestuurders',
    'section.driverRewards.repeat': 'Herhaalde Bezoeken',
    'section.driverRewards.repeatDesc': 'Loyaliteitsincentives die bestuurders laten terugkomen',
    'section.driverRewards.spend': 'Hogere Uitgaven',
    'section.driverRewards.spendDesc': 'Langere verblijfstijd stimuleert omzet over alle diensten',

    'section.whatMakesDifferent': 'Wat Maakt ParkBunny Anders',
    'section.whatMakesDifferent.b1': 'Meer dan \u201Cbetalen en vertrekken\u201D: Directe Lokale Deals om bestuurders te belonen en winkelbezoek te stimuleren',
    'section.whatMakesDifferent.b2': 'Directe communicatie + realtime controle: gerichte aanbiedingen, tariefaanpassingen, gedragsanalyses over alle locaties',
    'section.whatMakesDifferent.b3': 'Multi-locatie uitrol: gecentraliseerd partnerbeheer, bewegwijzering, codes/validatie, onboarding van partners',

    'section.activationPlan': 'Activeringsplan',
    'section.activationPlan.b1': 'Week 0–2: locatiecontroles, bewegwijzering, shortlist & outreach naar topcategorieën; gevalideerde/korting-links activeren',
    'section.activationPlan.b2': 'Week 3–4: eerste aanbiedingen live; evenement-afgestemde promoties; off-peak prijzen testen',
    'section.activationPlan.b3': 'Week 5–6: partners uitbreiden; aanbiedingen optimaliseren per dagdeel; loyaliteitsnotificaties in-app pushen',
    'section.activationPlan.metrics': 'Succesmaatstaven: +betaalde sessies t.o.v. baseline, aantal partners, validatie-/aflossingspercentage, herhaalde sessies, off-peak bezetting.',

    'section.measurement': 'Meting & Rapportage',
    'section.measurement.b1': 'Kern-KPI\u2019s: betaalde sessies, conversie van partnerklikken/validaties, gem. verblijfsduur, opbrengst per uur/dag, herhaalpercentage',
    'section.measurement.b2': 'Partner-KPI\u2019s: aflossingen, nieuw vs. terugkerend, best presterende aanbiedingen',
    'section.measurement.b3': 'Operatordashboard: tariefbewerkingen, aanbiedingsplanning, multi-locatie vergelijkingen (maandelijkse PDF + live)',

    'section.compliance': 'Naleving & Goede Praktijken',
    'section.compliance.b1': 'Duidelijke bewegwijzering & voorwaarden (conform gedragscode)',
    'section.compliance.b2': 'Privacy: ANPR/CCTV en app-gegevens verwerkt volgens AVG; proportioneel en transparant gebruik',

    // Partnership Opportunity Model
    'section.partnershipModel': 'Partnerschapskansen Model',
    'section.partnershipModel.conservative': 'Conservatief',
    'section.partnershipModel.conservativeDesc': 'Beperkt aantal lokale aanmeldingen binnen vroege partnercategorieën; focus op gevalideerd parkeren en eenvoudige aanbiedingen om tractie te bewijzen.',
    'section.partnershipModel.expected': 'Verwacht',
    'section.partnershipModel.stretch': 'Ambitieus',

    // Interactive Stream Section
    'section.additionalUplift': 'Aanvullende Portfolio Groei',
    'section.additionalUplift.subtitle': 'Onder voorbehoud van locatie-inspecties — verwachte meerwaarde van aanvullende diensten over het gehele portfolio.',
    'section.revenueSummary': 'Portfolio Omzet Overzicht',
    'section.revenueSummary.stream': 'Omzetstroom',
    'section.revenueSummary.sites': 'Locaties',
    'section.revenueSummary.annual': 'Jaarlijkse Omzet',
    'section.revenueSummary.status': 'Status',
    'section.revenueSummary.baseline': 'Portfolio Baseline',
    'section.revenueSummary.localOffers': 'Lokale Aanbiedingen Groei',
    'section.revenueSummary.total': 'Totale Omzetkans',
    'section.revenueSummary.current': 'Huidig',
    'section.revenueSummary.projected': 'Geprojecteerd',
    'stream.includeInSummary': 'Opnemen in Omzetoverzicht',
    'stream.includedInSummary': '✓ Opgenomen in Omzetoverzicht',
    'stream.perSiteYear': 'Per locatie/jaar',
    'stream.perLockerYear': 'Per locker/jaar',
    'stream.portfolioTotal': 'Portfolio Totaal',
    'stream.estimatedPerEvent': 'Geschat per evenement',
    'stream.estimatedPerSiteYear': 'Geschat per locatie/jaar',
    'stream.subjectToSurvey': '⚠️ Onder voorbehoud van inspectie',
    'stream.implementationNotes': 'Implementatienotities',
    'stream.implementationNotesText': 'Alle kansen zijn onder voorbehoud van locatie-inspectie en haalbaarheidsanalyse. Partnerschapsonderhandelingen en vergunningen kunnen van toepassing zijn.',
    'stream.includedHint': 'aanvullende omzetstromen opgenomen. Alle bedragen zijn jaarlijkse schattingen onder voorbehoud van locatie-inspecties.',
    'stream.notIncludedHint': 'Gebruik de selectievakjes hierboven om aanvullende omzetstromen op te nemen in dit overzicht.',

    // Footer
    'footer.copyright': '© {year} ParkBunny',

    // Revenue tab drivers
    'revenue.drivers': 'Drijfveren: partneraanmeldingen, aanbieding-aflossing/validatie, off-peak prijsoptimalisatie en herhaalgedrag (loyaliteit).',
  },
}

export function t(lang: Language, key: string, replacements?: Record<string, string>): string {
  let val = dict[lang]?.[key] ?? dict.en[key] ?? key
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    }
  }
  return val
}
