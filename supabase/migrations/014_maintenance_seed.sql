-- ============================================================
-- HomeServe — Maintenance catalogue + plan seed
-- Migration: 014_maintenance_seed.sql
--
-- CONTENT, NOT PRICING. Descriptions/inclusions/exclusions below are conservative,
-- generic starting text for HomeServe to review before launch. No prices, guarantees,
-- response times or coverage promises are seeded:
--   * every service has NULL indicative price  → shown as "Quoted after inspection"
--   * every plan is is_active = FALSE, annual_price NULL → cannot be bought or shown
--     publicly until HomeServe enters real pricing and switches it on in Admin.
-- ============================================================

INSERT INTO maintenance_services
  (slug, category, name, summary, description, inclusions, exclusions, price_unit, photos_helpful, sort_order)
VALUES
('plumbing-visit', 'plumbing', 'Plumbing visit',
 'Leaking taps, flush tanks, drains and fittings looked at and fixed.',
 'A HomeServe team member visits, finds the cause of the plumbing problem you report and carries out the repair on site where it is practical. If the fix needs materials or wider work, you get the scope and cost before anything proceeds.',
 ARRAY['Inspection of the reported issue', 'Repair or replacement of minor fittings on your approval', 'Basic check of visible pipework around the problem'],
 ARRAY['Concealed or in-wall pipe replacement (quoted separately)', 'Materials and spare parts (billed at actuals)', 'Tiling, plaster or paint reinstatement after opening a wall'],
 'per_visit', TRUE, 10),

('electrical-visit', 'electrical', 'Electrical visit',
 'Switches, sockets, fans, lights and tripping circuits checked and repaired.',
 'A HomeServe team member diagnoses the electrical fault you report and repairs or replaces the faulty fitting where it is safe and practical. Anything that needs wider rework is scoped and quoted first.',
 ARRAY['Fault-finding on the reported issue', 'Repair or replacement of switches, sockets, fans and light fittings on approval', 'Basic safety check around the affected circuit'],
 ARRAY['Full or partial rewiring (quoted separately)', 'Meter, utility or service-connection work', 'Internal repair of appliances', 'Materials and spare parts (billed at actuals)'],
 'per_visit', TRUE, 20),

('carpentry-visit', 'carpentry', 'Carpentry visit',
 'Doors, hinges, drawer channels, wardrobe and cabinet adjustments.',
 'A HomeServe team member fixes or adjusts woodwork such as door alignment, hinges, channels, handles and cabinet fittings, and touches up small polish or laminate areas where possible.',
 ARRAY['Inspection of the reported issue', 'Adjustment or replacement of hinges, channels, handles and locks on approval', 'Small-area touch-up where practical'],
 ARRAY['New furniture or wardrobe fabrication (part of a renovation quote)', 'Structural or civil changes', 'Materials and hardware (billed at actuals)', 'Exact finish match on aged surfaces cannot be guaranteed'],
 'per_visit', TRUE, 30),

('ac-servicing', 'ac_servicing', 'AC servicing',
 'Cleaning and checking of split and window air conditioners.',
 'A HomeServe team member services your air conditioner and checks that it is running as it should. Any repair or part the unit needs is identified and quoted before it is carried out.',
 ARRAY['Cleaning of accessible filters and indoor unit', 'Functional check of the unit', 'Diagnosis of any fault found'],
 ARRAY['Gas refill and spare parts (quoted separately)', 'Uninstallation or reinstallation of units', 'Repairs covered by the manufacturer warranty (contact the brand)'],
 'per_unit', FALSE, 40),

('appliance-servicing', 'appliance_servicing', 'Appliance servicing',
 'Servicing and diagnosis for household appliances such as chimneys and geysers.',
 'Tell us which appliance is giving trouble and what you are seeing. A HomeServe team member inspects it, explains what is needed and carries out the service or repair on your approval.',
 ARRAY['Inspection and diagnosis', 'Routine servicing of the appliance', 'Repair on your approval'],
 ARRAY['Repairs covered by the manufacturer warranty (contact the brand)', 'Spare parts (billed at actuals)', 'Appliance replacement'],
 'per_unit', TRUE, 50),

('pest-control', 'pest_control', 'Pest control',
 'Treatment for common household pests such as cockroaches and ants.',
 'A HomeServe team member inspects the problem areas, treats the reported pest issue and tells you how to keep it from returning. Specialised treatments are scoped after inspection.',
 ARRAY['Inspection of affected areas', 'Treatment for the reported pest', 'Guidance on preventing a repeat'],
 ARRAY['Termite and other specialised treatments (quoted after inspection)', 'Repair of damage caused by pests'],
 'per_visit', TRUE, 60),

('deep-cleaning', 'deep_cleaning', 'Deep cleaning',
 'Thorough cleaning of rooms, kitchens and bathrooms.',
 'A HomeServe team cleans the areas you choose in detail: floors, fittings, kitchen and bathroom surfaces. Tell us the size of the home and what needs the most attention when you book.',
 ARRAY['Detailed cleaning of the areas you select', 'Kitchen and bathroom surface and fitting cleaning'],
 ARRAY['Removal of construction debris or heavy waste', 'Exterior and facade cleaning', 'Stain removal that would damage the surface'],
 'per_visit', FALSE, 70),

('painting-touchups', 'painting_touchups', 'Painting touch-ups',
 'Small paint repairs: marks, peeling patches, damp stains and scuffs.',
 'A HomeServe team member repairs and repaints small areas of wall, ceiling or woodwork. For larger areas you may be better served by a repaint quoted as a renovation.',
 ARRAY['Preparation of the affected patch', 'Repainting of small areas'],
 ARRAY['Full-room or full-home repainting (quoted as renovation work)', 'Exact shade match on aged paint cannot be guaranteed', 'Treatment of the underlying cause of damp (see waterproofing inspection)'],
 'per_visit', TRUE, 80),

('waterproofing-inspection', 'waterproofing_inspection', 'Waterproofing and seepage inspection',
 'Find where dampness and seepage are coming from.',
 'A HomeServe team member inspects damp patches, seepage or leakage, looks for the likely source and shares what they find. Any treatment is scoped and quoted separately after the inspection.',
 ARRAY['Inspection of the affected areas', 'Assessment of the likely source', 'Findings shared with you after the visit'],
 ARRAY['Waterproofing or repair treatment (quoted separately)', 'Repainting or tiling after treatment'],
 'per_visit', TRUE, 90),

('bathroom-maintenance', 'bathroom_maintenance', 'Bathroom maintenance',
 'Grouting, sealant, fittings, drains and fixtures kept in shape.',
 'A HomeServe team member checks your bathroom fittings and seals, and carries out small repairs such as re-sealing, minor grout work and fitting replacement on your approval.',
 ARRAY['Inspection of fittings, seals and drains', 'Small grout and sealant repairs', 'Replacement of minor fittings on approval'],
 ARRAY['Full bathroom remodel (quoted as renovation work)', 'Tile replacement across large areas', 'Materials and fittings (billed at actuals)'],
 'per_visit', TRUE, 100),

('kitchen-maintenance', 'kitchen_maintenance', 'Kitchen maintenance',
 'Taps, sinks, cabinet hardware, sealant and fittings looked after.',
 'A HomeServe team member checks and fixes small kitchen issues: taps and sink fittings, cabinet hardware, drawers and sealant. Bigger work is scoped and quoted first.',
 ARRAY['Inspection of sink, tap, cabinet and fittings', 'Small repairs on approval'],
 ARRAY['Countertop or modular kitchen replacement (quoted as renovation work)', 'Appliance repair (see appliance servicing)', 'Materials and hardware (billed at actuals)'],
 'per_visit', TRUE, 110),

('home-inspection', 'home_inspection', 'General home inspection',
 'A walk-through of your home’s condition with findings shared afterwards.',
 'A HomeServe team member walks through the home, looks at plumbing, electrical points, finishes, woodwork and signs of damp, and shares what they see and what may need attention.',
 ARRAY['Walk-through of the home', 'Visual check of plumbing, electrical points, finishes, woodwork and damp signs', 'Findings shared with you after the visit'],
 ARRAY['Structural engineering assessment', 'Legal, valuation or compliance certification', 'Repairs (quoted separately if you want them done)'],
 'per_visit', FALSE, 120)
ON CONFLICT (slug) DO NOTHING;

-- Draft plan structure. Inactive and unpriced on purpose; see header.
INSERT INTO maintenance_plans
  (code, name, tagline, description, term_months, included_visits, inspection_frequency_per_year,
   eligible_categories, priority_booking, priority_support, emergency_support, sort_order, is_active)
VALUES
('essential', 'Essential', 'Preventive care and member benefits',
 'For homeowners who mainly want their home checked regularly and member benefits on services they book.',
 12, 0, 1,
 ARRAY['plumbing','electrical','carpentry','ac_servicing','appliance_servicing','pest_control','deep_cleaning','painting_touchups','waterproofing_inspection','bathroom_maintenance','kitchen_maintenance','home_inspection']::maintenance_category[],
 FALSE, FALSE, 'none', 10, FALSE),
('plus', 'Plus', 'Regular inspections, service benefits and priority support',
 'For homeowners who want recurring inspections, benefits on services and priority support.',
 12, 1, 2,
 ARRAY['plumbing','electrical','carpentry','ac_servicing','appliance_servicing','pest_control','deep_cleaning','painting_touchups','waterproofing_inspection','bathroom_maintenance','kitchen_maintenance','home_inspection']::maintenance_category[],
 TRUE, TRUE, 'none', 20, FALSE),
('complete', 'Complete', 'The most comprehensive ongoing home care',
 'For homeowners who want the most comprehensive ongoing home-care experience HomeServe offers.',
 12, 2, 4,
 ARRAY['plumbing','electrical','carpentry','ac_servicing','appliance_servicing','pest_control','deep_cleaning','painting_touchups','waterproofing_inspection','bathroom_maintenance','kitchen_maintenance','home_inspection']::maintenance_category[],
 TRUE, TRUE, 'none', 30, FALSE)
ON CONFLICT (code) DO NOTHING;
