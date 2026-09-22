import type { ServiceData } from '@/components/services/ServicePage'

const NCR_CITIES = ['Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad']

export const SERVICES_DATA: Record<string, ServiceData> = {
  'full-home-renovation': {
    slug: 'full-home-renovation',
    title: 'Full Home Renovation',
    metaDescription: 'Full home renovation services in Delhi NCR. HomeServe manages everything from planning and design to execution and handover across Delhi, Noida, Gurugram, Ghaziabad, Greater Noida and Faridabad.',
    hero: {
      headline: 'Full Home Renovation in Delhi NCR',
      subheadline: 'One team manages your entire renovation — from design and material selection to civil work, finishing and handover.',
      image: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=1400&q=85',
    },
    about: 'A full home renovation with HomeServe covers every aspect of your project — civil work, flooring, tiling, painting, false ceiling, electrical, plumbing, carpentry and modular work. You deal with one team throughout, backed by transparent quotation, milestone payments and quality supervision.',
    includes: [
      'Site visit and measurements', 'Detailed BOQ and quotation', 'Civil and masonry work',
      'Flooring (tiles, marble, wooden)', 'Painting (walls and ceiling)', 'False ceiling (gypsum, POP)',
      'Electrical work and wiring', 'Plumbing and sanitaryware', 'Carpentry and wardrobes',
      'Modular kitchen (if in scope)', 'Project management and supervision', 'Post-completion warranty',
    ],
    process: [
      { step: '01', title: 'Submit your requirement', desc: 'Tell us about your project — location, scope and budget.' },
      { step: '02', title: 'Site visit', desc: 'Our team visits your home, takes measurements and understands requirements.' },
      { step: '03', title: 'Detailed quotation', desc: 'We prepare a line-item quotation with material specifications.' },
      { step: '04', title: 'Approval & advance', desc: 'You accept the quotation and pay the advance milestone.' },
      { step: '05', title: 'Execution', desc: 'Our team executes the work with regular progress updates.' },
      { step: '06', title: 'Handover', desc: 'Final walkthrough, snag list resolution and handover.' },
    ],
    pricing: {
      essential: '₹800–1,200/sqft',
      standard: '₹1,200–2,000/sqft',
      premium: '₹2,000–3,500+/sqft',
      note: 'A 3BHK full home renovation in Delhi NCR typically ranges from ₹12L to ₹38L+ depending on scope, materials and finish level. An exact quotation is provided after the site visit.',
    },
    faq: [
      { q: 'How long does a full home renovation take?', a: 'A 2BHK typically takes 6–10 weeks. A 3BHK takes 8–14 weeks depending on scope. An exact timeline is provided in the project plan.' },
      { q: 'Do I need to vacate my home during renovation?', a: 'For a full home renovation, it is recommended to vacate the property for the duration. For partial renovations, it depends on the scope.' },
      { q: 'Can I make changes to scope after the quotation is accepted?', a: 'Scope changes are possible but will be quoted separately as a change order. We recommend finalising the scope before accepting the quotation.' },
      { q: 'What is the warranty on the work?', a: 'Warranty terms are specified in your project agreement. They cover workmanship defects for the agreed period post-completion.' },
    ],
    cities: NCR_CITIES,
  },

  'kitchen-renovation': {
    slug: 'kitchen-renovation',
    title: 'Kitchen Renovation',
    metaDescription: 'Kitchen renovation services in Delhi NCR. HomeServe handles complete kitchen renovation including civil work, tiling, plumbing, electrical and modular kitchen across Delhi, Noida and Gurugram.',
    hero: {
      headline: 'Kitchen Renovation in Delhi NCR',
      subheadline: 'Transform your kitchen with a complete renovation — from demolition and waterproofing to modular cabinets and countertops.',
      image: 'https://images.unsplash.com/photo-1755771984341-546c2a04f236?w=1400&q=85',
    },
    about: 'HomeServe handles your kitchen renovation end-to-end — civil demolition, waterproofing, tiling, plumbing, electrical, modular kitchen installation and finishing. We coordinate all trades so you get a seamless, quality result.',
    includes: [
      'Demolition and debris removal', 'Waterproofing if needed', 'Floor and wall tiling',
      'Plumbing (sink, pipes, fixtures)', 'Electrical (points, switches, chimney)', 'Modular kitchen cabinets',
      'Countertop (granite, quartz, SS)', 'Backsplash tiling', 'Chimney and appliance provision',
      'Painting and finishing', 'Lighting', 'Quality control and handover',
    ],
    process: [
      { step: '01', title: 'Requirement & site visit', desc: 'We visit your kitchen, take measurements and understand your requirements.' },
      { step: '02', title: 'Design & quotation', desc: 'Kitchen layout proposal and detailed line-item quotation.' },
      { step: '03', title: 'Material selection', desc: 'You choose tiles, countertop, cabinet design and hardware.' },
      { step: '04', title: 'Civil & plumbing work', desc: 'Demolition, waterproofing, tiling and plumbing.' },
      { step: '05', title: 'Modular installation', desc: 'Cabinets, countertop and appliances installed.' },
      { step: '06', title: 'Finishing & handover', desc: 'Electrical, painting, cleaning and handover.' },
    ],
    pricing: {
      essential: '₹1.5–3L per kitchen',
      standard: '₹3–6L per kitchen',
      premium: '₹6–12L+ per kitchen',
      note: 'Kitchen renovation pricing depends heavily on size, modular cabinet quality, countertop material and the extent of civil work required. An exact quotation is provided after site visit.',
    },
    faq: [
      { q: 'How long does a kitchen renovation take?', a: 'Typically 3–6 weeks depending on the scope. Civil work takes 1–2 weeks; modular installation takes 2–3 days after the civil work is complete.' },
      { q: 'What modular kitchen brands do you use?', a: 'We work with multiple quality manufacturers. The brand and material are selected during the design phase based on your budget and requirements.' },
      { q: 'Can you renovate just the countertop without replacing the cabinets?', a: 'Yes, we can handle partial kitchen renovations as well. We will assess the existing cabinets and advise on what can be retained.' },
    ],
    cities: NCR_CITIES,
  },

  'bathroom-renovation': {
    slug: 'bathroom-renovation',
    title: 'Bathroom Renovation',
    metaDescription: 'Bathroom renovation in Delhi NCR. Complete bathroom remodelling including demolition, waterproofing, tiling, plumbing, sanitaryware and fixtures by HomeServe.',
    hero: {
      headline: 'Bathroom Renovation in Delhi NCR',
      subheadline: 'A complete bathroom transformation — waterproofing, tiling, sanitaryware, plumbing, fixtures and finishes under one team.',
      image: 'https://images.unsplash.com/photo-1789121274502-84fe89234993?w=1400&q=85',
    },
    about: 'HomeServe manages your bathroom renovation from demolition to handover. We handle waterproofing (critical in older properties), floor and wall tiling, plumbing, sanitaryware installation, vanity, lighting and all electrical points.',
    includes: [
      'Demolition and debris removal', 'Waterproofing (critical layer)', 'Floor tiling',
      'Wall tiling', 'Plumbing (pipes, CP fittings)', 'Sanitaryware (WC, basin, shower)',
      'Vanity unit', 'Shower enclosure or partition', 'Exhaust fan and lighting',
      'Mirror and accessories', 'Geyser / water heater provision', 'Finishing and handover',
    ],
    process: [
      { step: '01', title: 'Site visit', desc: 'Inspect existing bathroom, check for water leakage and take measurements.' },
      { step: '02', title: 'Quotation', desc: 'Detailed quotation including all civil, plumbing and fixture costs.' },
      { step: '03', title: 'Demolition', desc: 'Remove existing tiles, sanitaryware and fixtures.' },
      { step: '04', title: 'Waterproofing', desc: 'Apply waterproof membrane before tiling begins.' },
      { step: '05', title: 'Tiling & plumbing', desc: 'New tiles laid and plumbing completed.' },
      { step: '06', title: 'Fixtures & handover', desc: 'Sanitaryware, fittings, lighting installed and handed over.' },
    ],
    pricing: {
      essential: '₹60K–1.2L per bathroom',
      standard: '₹1.2–2.5L per bathroom',
      premium: '₹2.5–5L+ per bathroom',
      note: 'Bathroom renovation pricing varies by size, tile selection, sanitaryware brand and extent of plumbing work. A bathroom in Delhi NCR can typically be renovated to good standard for ₹1–2L. Exact quotation after site visit.',
    },
    faq: [
      { q: 'Do you handle waterproofing?', a: 'Yes, waterproofing is a standard part of any bathroom renovation. We use proven systems and provide a warranty on the waterproofing work.' },
      { q: 'How long does a bathroom renovation take?', a: 'Typically 10–18 working days per bathroom depending on scope and drying time for waterproofing.' },
      { q: 'Can we supply our own tiles?', a: 'Yes, you can supply your own tiles and sanitaryware. We will factor in labour-only pricing for supplied materials.' },
    ],
    cities: NCR_CITIES,
  },

  'painting': {
    slug: 'painting',
    title: 'Painting',
    metaDescription: 'Interior and exterior painting services in Delhi NCR. HomeServe provides professional painting for homes in Delhi, Noida, Gurugram, Ghaziabad, Greater Noida and Faridabad.',
    hero: {
      headline: 'Home Painting Services in Delhi NCR',
      subheadline: 'Professional interior and exterior painting — putty, primer, quality paints and clean execution.',
      image: 'https://images.unsplash.com/photo-1787383274118-19be2f542e2b?w=1400&q=85',
    },
    about: 'HomeServe provides professional painting services for homes across Delhi NCR. Our process includes wall preparation (putty, scraping), priming and 2–3 coats of quality paint. We use Asian Paints, Berger and Dulux products.',
    includes: [
      'Wall preparation and putty', 'Primer coat', '2–3 coats of emulsion',
      'Ceiling painting', 'Door and window frame painting', 'Accent wall options',
      'Texture painting (on request)', 'Clean daily site management', 'Post-work cleaning',
    ],
    process: [
      { step: '01', title: 'Site visit & measurement', desc: 'Measure total paintable area and assess wall condition.' },
      { step: '02', title: 'Quotation', desc: 'Per square foot quotation based on area and paint brand selected.' },
      { step: '03', title: 'Preparation', desc: 'Wall putty, sanding and primer.' },
      { step: '04', title: 'Painting', desc: '2–3 coats as per specification.' },
      { step: '05', title: 'Touch-up & handover', desc: 'Touch-ups, clean-up and handover.' },
    ],
    pricing: {
      essential: '₹15–20/sqft',
      standard: '₹20–35/sqft',
      premium: '₹35–60+/sqft',
      note: 'Painting cost in Delhi NCR depends on total area, paint brand, number of coats and surface condition. A 3BHK (1200 sqft) typically costs ₹30,000–80,000 for interior painting.',
    },
    faq: [
      { q: 'What paint brands do you use?', a: 'We use Asian Paints, Berger, Dulux and Nippon Paint. The brand and grade are selected based on your budget and requirements.' },
      { q: 'How long does home painting take?', a: 'A 2BHK typically takes 5–8 days. A 3BHK takes 7–12 days depending on scope and wall condition.' },
      { q: 'Do I need to vacate during painting?', a: 'We recommend vacating rooms as we paint them. For full-home painting, temporary relocation is advised for comfort and faster execution.' },
    ],
    cities: NCR_CITIES,
  },

  'flooring': {
    slug: 'flooring',
    title: 'Flooring',
    metaDescription: 'Flooring services in Delhi NCR. HomeServe installs vitrified tiles, marble, wooden and engineered wood flooring for homes across Delhi, Noida and Gurugram.',
    hero: {
      headline: 'Flooring Installation in Delhi NCR',
      subheadline: 'From vitrified tiles and marble to wooden and vinyl flooring — quality installation with minimal disruption.',
      image: 'https://images.unsplash.com/photo-1787390629829-abb32b3025c5?w=1400&q=85',
    },
    about: 'HomeServe installs all major flooring types — vitrified tiles, natural marble, granite, engineered wood, laminate and vinyl. We handle demolition of existing flooring, base preparation, material supply and installation.',
    includes: [
      'Demolition of existing flooring (if required)', 'Floor levelling and base preparation',
      'Tile/material supply and logistics', 'Professional laying and grouting',
      'Skirting and edge finishing', 'Polishing (marble/granite)', 'Post-work cleaning',
    ],
    process: [
      { step: '01', title: 'Measurement & material', desc: 'Measure total floor area and help select appropriate materials.' },
      { step: '02', title: 'Quotation', desc: 'Per sqft quotation including material and labour.' },
      { step: '03', title: 'Demolition', desc: 'Remove existing flooring if required.' },
      { step: '04', title: 'Installation', desc: 'Base preparation and new flooring laid.' },
      { step: '05', title: 'Finishing', desc: 'Grouting, skirting, polishing and clean-up.' },
    ],
    pricing: {
      essential: '₹70–120/sqft',
      standard: '₹120–200/sqft',
      premium: '₹200–400+/sqft',
      note: 'Flooring cost in Delhi NCR depends on material type (vitrified, marble, wooden), tile size and brand. A 3BHK (1200 sqft) flooring project typically ranges from ₹1.5L to ₹5L+.',
    },
    faq: [
      { q: 'How long does flooring installation take?', a: 'A 2BHK typically takes 7–12 days. Marble and large-format tiles take longer due to cutting and setting time.' },
      { q: 'Do you supply the tiles?', a: 'Yes, we can supply tiles from our vendor network or you can supply your own. Supply-only and labour-only options are available.' },
    ],
    cities: NCR_CITIES,
  },

  'false-ceiling': {
    slug: 'false-ceiling',
    title: 'False Ceiling',
    metaDescription: 'False ceiling installation in Delhi NCR. HomeServe installs gypsum board, POP and wood false ceilings for homes across Delhi, Noida and Gurugram.',
    hero: {
      headline: 'False Ceiling in Delhi NCR',
      subheadline: 'Gypsum board, POP and wooden false ceilings — design, supply and installation.',
      image: 'https://images.unsplash.com/photo-1785232273548-4beae5334903?w=1400&q=85',
    },
    about: 'HomeServe installs false ceilings using gypsum board, POP or wood. We handle the design, frame installation, boarding, finishing and lighting integration. False ceilings improve aesthetics, acoustics and can conceal electrical work.',
    includes: [
      'False ceiling design', 'MS/GI frame installation', 'Gypsum board / POP application',
      'Cove lighting provision', 'Spot light and fan provisions', 'Finishing and painting',
      'Cornices (if required)',
    ],
    process: [
      { step: '01', title: 'Design & measurement', desc: 'False ceiling design and area measurement.' },
      { step: '02', title: 'Frame installation', desc: 'Metal frame fixed to walls and ceiling slab.' },
      { step: '03', title: 'Boarding', desc: 'Gypsum boards or POP applied to frame.' },
      { step: '04', title: 'Finishing', desc: 'Putty, primer and paint.' },
      { step: '05', title: 'Lighting', desc: 'Cove lights, spots and fans installed.' },
    ],
    pricing: {
      essential: '₹60–90/sqft',
      standard: '₹90–150/sqft',
      premium: '₹150–250+/sqft',
      note: 'False ceiling cost in Delhi NCR depends on design complexity, material and lighting integration. A living room false ceiling (300 sqft) typically costs ₹20,000–60,000.',
    },
    faq: [
      { q: 'How long does false ceiling installation take?', a: 'A living and dining false ceiling typically takes 3–5 days. Full home ceilings take 7–14 days.' },
      { q: 'Does false ceiling reduce room height significantly?', a: 'Standard gypsum false ceiling reduces height by 6–8 inches. For rooms with adequate ceiling height (10+ feet), this is generally not a concern.' },
    ],
    cities: NCR_CITIES,
  },

  'electrical': {
    slug: 'electrical',
    title: 'Electrical Work',
    metaDescription: 'Electrical work for home renovation in Delhi NCR. HomeServe handles complete electrical rewiring, DB box, switches and fixtures across Delhi, Noida and Gurugram.',
    hero: {
      headline: 'Electrical Work in Delhi NCR',
      subheadline: 'Complete electrical rewiring, DB box upgrade, switches and fixtures — as part of your renovation or standalone.',
      image: 'https://images.unsplash.com/photo-1633604712918-6ab1173d0ecd?w=1400&q=85',
    },
    about: 'HomeServe handles all electrical work as part of home renovation — complete rewiring, MCB panel upgrade, switch and socket installation, ceiling fan and light points, AC points and earthing. All work follows standard safety norms.',
    includes: [
      'Electrical plan and load calculation', 'Complete concealed wiring', 'MCB/RCCB panel (DB box)',
      'Switch and socket installation', 'Ceiling fan and light points', 'AC points',
      'Geyser and appliance points', 'Earth leakage protection', 'Testing and commissioning',
    ],
    process: [
      { step: '01', title: 'Site assessment', desc: 'Assess existing wiring condition and load requirements.' },
      { step: '02', title: 'Electrical plan', desc: 'Prepare point-by-point electrical layout.' },
      { step: '03', title: 'Conduit & wiring', desc: 'Chase walls, lay conduits and pull wires.' },
      { step: '04', title: 'DB box installation', desc: 'MCB panel with proper circuit segregation.' },
      { step: '05', title: 'Finishing', desc: 'Switches, sockets, fixtures and testing.' },
    ],
    pricing: {
      essential: '₹25–40/sqft',
      standard: '₹40–65/sqft',
      premium: '₹65–110+/sqft',
      note: 'Electrical work pricing depends on total area, number of points and whether existing wiring is being retained or completely replaced. A 3BHK full rewiring typically costs ₹35,000–1,00,000+.',
    },
    faq: [
      { q: 'Do I need to replace all electrical wiring during renovation?', a: 'Not always. We assess the existing wiring condition and advise. For homes more than 15 years old or with aluminium wiring, full replacement is generally recommended for safety.' },
      { q: 'What MCB brands do you use?', a: 'We use Legrand, Havells, Schneider and similar quality brands for MCB panels. Switch brands (Anchor, Legrand, Havells) are selected based on your preference.' },
    ],
    cities: NCR_CITIES,
  },

  'plumbing': {
    slug: 'plumbing',
    title: 'Plumbing',
    metaDescription: 'Plumbing services for home renovation in Delhi NCR. HomeServe handles complete plumbing including CPVC piping, sanitaryware installation and fixtures.',
    hero: {
      headline: 'Plumbing Services in Delhi NCR',
      subheadline: 'Complete plumbing — CPVC pipes, sanitaryware, CP fittings and waterproofing as part of your renovation.',
      image: 'https://images.unsplash.com/photo-1789121274502-84fe89234993?w=1400&q=85',
    },
    about: 'HomeServe handles all plumbing work as part of renovation — new CPVC concealed piping, drainage, sanitaryware installation and CP fittings. We ensure proper slopes, pressure testing and watertight connections.',
    includes: [
      'Concealed CPVC piping (hot and cold)', 'UPVC drainage and waste pipes', 'WC installation',
      'Basin and pedestal installation', 'Shower and bath fittings', 'Kitchen sink and mixer',
      'Geyser connections', 'Pressure testing', 'Waterproofing coordination',
    ],
    process: [
      { step: '01', title: 'Plumbing layout', desc: 'Plan inlet and drainage points as per bathroom/kitchen layout.' },
      { step: '02', title: 'Chasing and laying pipes', desc: 'Wall chases and concealed pipe laying.' },
      { step: '03', title: 'Drainage work', desc: 'Floor traps, drainage pipes and connections.' },
      { step: '04', title: 'Wall closing', desc: 'Plaster back wall chases.' },
      { step: '05', title: 'Fixture installation', desc: 'WC, basin, shower, kitchen sink fitted after tiling.' },
    ],
    pricing: {
      essential: '₹20–35/sqft',
      standard: '₹35–55/sqft',
      premium: '₹55–90+/sqft',
      note: 'Plumbing cost depends on number of bathrooms and kitchens, pipe brand and extent of existing plumbing condition. A standard 3BHK plumbing job during renovation typically costs ₹40,000–1,20,000.',
    },
    faq: [
      { q: 'What pipe material do you use?', a: 'We use CPVC pipes for hot and cold water supply and UPVC for drainage. Both are long-lasting and appropriate for concealed work.' },
      { q: 'Do you handle leakage issues in existing homes?', a: 'Yes, we handle leakage detection and repairs. For a full renovation, we typically replace all plumbing rather than repair, as it is more cost-effective in the long run.' },
    ],
    cities: NCR_CITIES,
  },

  'carpentry': {
    slug: 'carpentry',
    title: 'Carpentry & Wardrobes',
    metaDescription: 'Custom carpentry and wardrobe services in Delhi NCR. HomeServe provides custom wardrobes, TV units, storage furniture and woodwork across Delhi, Noida and Gurugram.',
    hero: {
      headline: 'Custom Carpentry & Wardrobes in Delhi NCR',
      subheadline: 'Bespoke wardrobes, TV units, crockery units and storage furniture — designed and built for your home.',
      image: 'https://images.unsplash.com/photo-1753185234794-e3b41b94a352?w=1400&q=85',
    },
    about: 'HomeServe designs and installs custom carpentry for your home — floor-to-ceiling wardrobes, TV and entertainment units, crockery and display units, study tables and custom storage. All work is executed in our fabrication workshop and installed at site.',
    includes: [
      'Wardrobe design and layout', 'Material selection (HDF, plywood, MDF)',
      'Shutters (laminate, lacquer, PU)', 'Internal fittings (shelves, drawers, pull-outs)',
      'Hardware (hinges, channels, handles)', 'TV unit and entertainment wall',
      'Crockery and display unit', 'Study table and shelving', 'Site installation',
    ],
    process: [
      { step: '01', title: 'Measurement & design', desc: 'On-site measurement and custom design as per your space.' },
      { step: '02', title: 'Material selection', desc: 'Choose board material, shutter design and hardware.' },
      { step: '03', title: 'Fabrication', desc: 'Cabinets fabricated in workshop.' },
      { step: '04', title: 'Installation', desc: 'Units installed and aligned at site.' },
      { step: '05', title: 'Finishing', desc: 'Handles, adjustments and final check.' },
    ],
    pricing: {
      essential: '₹600–900/sqft',
      standard: '₹900–1,400/sqft',
      premium: '₹1,400–2,500+/sqft',
      note: 'Carpentry pricing is measured per square foot of projected/shadow area. A standard 3-door wardrobe (10 sqft) in Delhi NCR typically costs ₹8,000–25,000 depending on material and finish.',
    },
    faq: [
      { q: 'What is the difference between HDF and plywood for wardrobes?', a: 'Plywood is stronger, more moisture-resistant and better for structural work. HDF (or MDF) is smoother, takes paint better and is more economical. We recommend plywood for main carcass and HDF for shutters.' },
      { q: 'How long does wardrobe installation take?', a: 'Fabrication takes 10–15 working days. On-site installation typically takes 2–4 days per room depending on volume.' },
    ],
    cities: NCR_CITIES,
  },

  'modular-kitchen': {
    slug: 'modular-kitchen',
    title: 'Modular Kitchen',
    metaDescription: 'Modular kitchen design and installation in Delhi NCR. HomeServe provides complete modular kitchen solutions including civil work, cabinets and countertops.',
    hero: {
      headline: 'Modular Kitchen in Delhi NCR',
      subheadline: 'Custom modular kitchens designed for your space — from layout and material selection to complete installation.',
      image: 'https://images.unsplash.com/photo-1745429523635-ad375f836bf2?w=1400&q=85',
    },
    about: 'HomeServe provides complete modular kitchen solutions — L-shaped, U-shaped, parallel and island kitchens. We design the layout, source quality cabinets, install countertops and coordinate all allied civil, electrical and plumbing work.',
    includes: [
      'Kitchen layout design', 'Base and wall cabinet fabrication', 'Shutter design (acrylic, laminate, lacquer)',
      'Countertop (granite, quartz, SS)', 'Backsplash tiling', 'Drawer and pull-out organisation',
      'Chimney and hob provision', 'Soft-close hardware', 'Civil and plumbing coordination',
    ],
    process: [
      { step: '01', title: 'Site visit and measurement', desc: 'Precise measurement of kitchen space.' },
      { step: '02', title: 'Layout and design', desc: '2D/3D design with cabinet and storage plan.' },
      { step: '03', title: 'Material selection', desc: 'Countertop, shutter, hardware and accessories.' },
      { step: '04', title: 'Fabrication', desc: 'Cabinets built in workshop to precise measurements.' },
      { step: '05', title: 'Installation', desc: 'Cabinets, countertop and accessories installed.' },
      { step: '06', title: 'Handover', desc: 'Plumbing and electrical connected and tested.' },
    ],
    pricing: {
      essential: '₹80K–1.5L per kitchen',
      standard: '₹1.5–3.5L per kitchen',
      premium: '₹3.5–8L+ per kitchen',
      note: 'Modular kitchen cost depends on running feet of cabinets, shutter material and countertop. A standard 10-foot kitchen in Delhi NCR typically costs ₹1.5–4L for a good quality installation.',
    },
    faq: [
      { q: 'How long does modular kitchen installation take?', a: 'Fabrication takes 2–4 weeks. On-site installation takes 3–5 days after the civil work is complete.' },
      { q: 'Do you coordinate the civil work as well?', a: 'Yes, we coordinate all civil, tiling, plumbing and electrical work as part of the kitchen renovation package.' },
    ],
    cities: NCR_CITIES,
  },

  'living-room': {
    slug: 'living-room',
    title: 'Living Room Renovation',
    metaDescription: 'Living room renovation in Delhi NCR. HomeServe transforms living rooms with flooring, painting, false ceiling, TV unit and carpentry work.',
    hero: {
      headline: 'Living Room Renovation in Delhi NCR',
      subheadline: 'A complete living room transformation — flooring, false ceiling, painting, TV wall and furniture.',
      image: 'https://images.unsplash.com/photo-1745429523637-60f5986cc1db?w=1400&q=85',
    },
    about: 'HomeServe renovates living rooms comprehensively — new flooring, false ceiling, painting, TV wall unit, accent walls and electrical work. We coordinate all trades so the transformation is seamless and disruption is minimal.',
    includes: [
      'Flooring replacement', 'False ceiling design and installation', 'Wall painting and putty',
      'TV and entertainment wall unit', 'Feature/accent wall', 'Lighting (cove, spots, fans)',
      'Electrical points', 'Curtain track provision', 'Deep cleaning and handover',
    ],
    process: [
      { step: '01', title: 'Site visit and design brief', desc: 'Understand your vision and assess the existing space.' },
      { step: '02', title: 'Design and quotation', desc: 'Concept and line-item quotation.' },
      { step: '03', title: 'Material selection', desc: 'Flooring, paint colours, false ceiling design.' },
      { step: '04', title: 'Execution', desc: 'All trades coordinated by HomeServe.' },
      { step: '05', title: 'Handover', desc: 'Clean, complete and handed over.' },
    ],
    pricing: {
      essential: '₹1–2L per room',
      standard: '₹2–4L per room',
      premium: '₹4–8L+ per room',
      note: 'Living room renovation cost depends on area, scope and finish level. Exact quotation after site visit.',
    },
    faq: [
      { q: 'Can I renovate just the living room without other rooms?', a: 'Yes, we handle room-specific renovations. You can start with one room and expand later.' },
    ],
    cities: NCR_CITIES,
  },

  'bedroom': {
    slug: 'bedroom',
    title: 'Bedroom Renovation',
    metaDescription: 'Bedroom renovation in Delhi NCR. HomeServe transforms bedrooms with new flooring, painting, wardrobes and lighting work.',
    hero: {
      headline: 'Bedroom Renovation in Delhi NCR',
      subheadline: 'New flooring, fresh painting, custom wardrobes and lighting — a complete bedroom transformation.',
      image: 'https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?w=1400&q=85',
    },
    about: 'A bedroom renovation typically includes new flooring, fresh painting, custom wardrobe, false ceiling with lighting and electrical work. HomeServe handles all of these coordinated trades for a clean, seamless result.',
    includes: [
      'Flooring (tiles, laminate or wood)', 'Wall painting and putty', 'False ceiling (if required)',
      'Wardrobe (custom built-in)', 'Bed back panel or feature wall', 'Lighting (ambient and task)',
      'Electrical points', 'AC provision', 'Deep cleaning and handover',
    ],
    process: [
      { step: '01', title: 'Visit and brief', desc: 'Understand requirements and take measurements.' },
      { step: '02', title: 'Design and quote', desc: 'Layout proposals and detailed quotation.' },
      { step: '03', title: 'Material selection', desc: 'Flooring, paint, wardrobe design, hardware.' },
      { step: '04', title: 'Execution', desc: 'All work done in sequence by our team.' },
      { step: '05', title: 'Handover', desc: 'Clean and complete.' },
    ],
    pricing: {
      essential: '₹80K–1.8L per room',
      standard: '₹1.8–3.5L per room',
      premium: '₹3.5–7L+ per room',
      note: 'Bedroom renovation cost depends on area, scope and whether a wardrobe is included. Exact quotation after site visit.',
    },
    faq: [
      { q: 'Is wardrobe included in bedroom renovation?', a: 'Wardrobe can be included or excluded depending on your requirements. It will be line-itemed in the quotation so you can decide.' },
    ],
    cities: NCR_CITIES,
  },

  'civil-work': {
    slug: 'civil-work',
    title: 'Civil & Masonry Work',
    metaDescription: 'Civil and masonry work for home renovation in Delhi NCR. HomeServe handles demolition, brick and block work, plastering, waterproofing and structural work.',
    hero: {
      headline: 'Civil & Masonry Work in Delhi NCR',
      subheadline: 'Demolition, brick work, plastering, waterproofing and structural repairs — the foundation of every renovation.',
      image: 'https://images.unsplash.com/photo-1577199001468-44c049e7603f?w=1400&q=85',
    },
    about: 'Civil and masonry work is the backbone of home renovation. HomeServe handles demolition, new partition walls, door frame adjustments, plastering, waterproofing and all structural-level work before the finishing trades begin.',
    includes: [
      'Demolition and debris removal', 'New brick or block partitions', 'Door and window frame adjustment',
      'Plastering (internal and external)', 'Waterproofing (terrace, bathroom, basement)',
      'Crack repair and grouting', 'Concrete work', 'Structural repair (if required)',
    ],
    process: [
      { step: '01', title: 'Structural assessment', desc: 'Assess existing structure and identify civil scope.' },
      { step: '02', title: 'Quotation', desc: 'Civil works separately quoted as a Bill of Quantities.' },
      { step: '03', title: 'Demolition', desc: 'Controlled demolition with dust and debris management.' },
      { step: '04', title: 'Masonry work', desc: 'New walls, frames and structural work.' },
      { step: '05', title: 'Plastering & waterproofing', desc: 'Ready for finishing trades.' },
    ],
    pricing: {
      essential: '₹600–900/sqft',
      standard: '₹900–1,400/sqft',
      premium: '₹1,400–2,500+/sqft',
      note: 'Civil work is typically priced per square foot of renovation area or as individual line items. Exact quotation after site visit.',
    },
    faq: [
      { q: 'Is demolition included in civil work pricing?', a: 'Yes, controlled demolition and debris removal are typically included in the civil scope.' },
      { q: 'Can you handle structural repairs?', a: 'For minor structural repairs and crack treatment, yes. For major structural work, we will advise if a structural engineer is required.' },
    ],
    cities: NCR_CITIES,
  },
}

export function getServiceData(slug: string): ServiceData | null {
  return SERVICES_DATA[slug] ?? null
}

export function getAllServiceSlugs(): string[] {
  return Object.keys(SERVICES_DATA)
}
