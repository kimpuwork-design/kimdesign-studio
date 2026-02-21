
-- Create site_content table for admin-editable public page content
CREATE TABLE public.site_content (
  section TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Public can read (for rendering pages)
CREATE POLICY "Site content is publicly readable"
ON public.site_content FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site content"
ON public.site_content FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Only admins can insert
CREATE POLICY "Admins can insert site content"
ON public.site_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete site content"
ON public.site_content FOR DELETE
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Seed with all current hardcoded content
INSERT INTO public.site_content (section, content) VALUES

-- About Me / Profile section on homepage
('about_me', '{
  "name_first": "Elena",
  "name_last": "Markov",
  "title_prefix": "Principal Architect",
  "profile_image_url": null,
  "est_year": "2008",
  "credentials": [
    {"icon": "GraduationCap", "text": "M.Arch, Bartlett UCL"},
    {"icon": "Award", "text": "RIBA Chartered Architect"},
    {"icon": "Globe", "text": "16 Years of Practice"}
  ],
  "bio_main": "I founded FORMA on the belief that great architecture must be deeply rooted in its place, built with material honesty, and scaled to human experience.",
  "bio_secondary": "After training at the Bartlett and working with Zaha Hadid Architects and Snøhetta, I returned to London to build a practice that could take time with each project — treating every commission as a conversation between site, brief, and craft.",
  "bio_tertiary": "My work spans private houses, cultural institutions, and urban strategies across 11 countries, recognised by the RIBA, the Civic Trust, and the AJ Awards.",
  "quote": "Architecture should feel inevitable — as if it could not have been any other way."
}'::jsonb),

-- Hero section on homepage
('hero', '{
  "badge": "Architecture · Interiors · Urbanism",
  "title_line1": "Building spaces",
  "title_line2": "that endure.",
  "description": "We are a London-based architecture studio practising at the intersection of material culture, place, and human experience."
}'::jsonb),

-- Stats section
('stats', '[
  {"label": "Projects Completed", "value": 120, "suffix": "+"},
  {"label": "Awards & Nominations", "value": 24, "suffix": ""},
  {"label": "Countries", "value": 11, "suffix": ""},
  {"label": "Years of Practice", "value": 16, "suffix": ""}
]'::jsonb),

-- Services (home page short version)
('services_home', '[
  {"icon": "Building2", "title": "Architectural Design", "desc": "Bespoke residential and commercial architecture rooted in context, craft, and lasting material quality."},
  {"icon": "Ruler", "title": "Interior Architecture", "desc": "Thoughtfully designed interiors that balance spatial logic with sensory richness."},
  {"icon": "Leaf", "title": "Landscape & Urbanism", "desc": "Site-responsive landscape strategies that connect buildings to their natural and urban surroundings."},
  {"icon": "PenTool", "title": "Planning & Feasibility", "desc": "Expert guidance through concept, planning permission, and technical coordination."}
]'::jsonb),

-- Services (full services page)
('services_full', '[
  {"icon": "Building2", "title": "Architectural Design", "stage": "RIBA Stages 0–6", "desc": "Full architectural services from inception through to completion. We lead projects of all scales, from sensitive rural additions to complex urban mixed-use developments, with the same care and attention throughout."},
  {"icon": "Ruler", "title": "Interior Architecture", "stage": "Concept to Completion", "desc": "Interior architectural design that goes beyond surface treatment to rethink spatial layout, material logic, and the quality of light. We work closely with specialist makers and craftspeople to realise interiors of lasting quality."},
  {"icon": "Leaf", "title": "Landscape & Site", "stage": "Context & Masterplan", "desc": "Site-responsive landscape design that extends the architectural idea into the ground and horizon. From private gardens to public squares, we design landscapes that are ecologically generous and beautifully composed."},
  {"icon": "PenTool", "title": "Planning & Permissions", "stage": "Pre-Application to Consent", "desc": "Expert navigation of planning systems across England, Scotland, and Wales. We prepare compelling applications and manage relationships with planning authorities, heritage bodies, and design review panels."},
  {"icon": "FileText", "title": "Technical Design", "stage": "RIBA Stages 4–5", "desc": "Rigorous technical design and specification that ensures our buildings are buildable, durable, and thermally excellent. We coordinate all specialist engineers and consultants through to tender and construction."},
  {"icon": "Lightbulb", "title": "Design Consultancy", "stage": "Advisory", "desc": "Independent design guidance for developers, institutions, and other architects. We offer peer review, design code authorship, design champion roles, and feasibility studies."}
]'::jsonb),

-- Process steps
('process', '[
  {"n": "01", "title": "Listen", "desc": "A thorough briefing process to understand your needs, aspirations, and the spirit of the place."},
  {"n": "02", "title": "Research", "desc": "Site analysis, precedent study, and technical due diligence before a single line is drawn."},
  {"n": "03", "title": "Propose", "desc": "Iterative design proposals developed collaboratively with you through sketches, models, and drawings."},
  {"n": "04", "title": "Deliver", "desc": "Rigorous technical development, procurement, and construction-phase leadership to realise the design."}
]'::jsonb),

-- Testimonials
('testimonials', '[
  {"name": "Elara Fontaine", "role": "Private Client, London", "text": "FORMA transformed our vision into a home that feels both extraordinary and deeply liveable. Every detail was considered."},
  {"name": "Thomas Rein", "role": "Director, Rein Properties", "text": "Their ability to balance commercial objectives with genuine architectural ambition is rare and invaluable."},
  {"name": "Sophia Lund", "role": "Cultural Foundation", "text": "The building they designed for us has become a landmark. It belongs to its place as if it was always there."}
]'::jsonb),

-- Awards
('awards', '[
  {"year": "2023", "title": "RIBA National Award", "org": "Royal Institute of British Architects"},
  {"year": "2022", "title": "Civic Trust Award", "org": "Civic Trust"},
  {"year": "2021", "title": "AJ Small Projects Award", "org": "Architectural Journal"},
  {"year": "2020", "title": "Dezeen Architecture Award", "org": "Dezeen"},
  {"year": "2019", "title": "Wallpaper* Design Award", "org": "Wallpaper Magazine"}
]'::jsonb),

-- CTA section
('cta', '{
  "title_line1": "Let''s build something",
  "title_line2": "remarkable.",
  "subtitle": "Every great building begins with a conversation."
}'::jsonb),

-- About page
('about_page', '{
  "hero_subtitle": "The Studio",
  "hero_title_line1": "Architecture as a",
  "hero_title_line2": "long conversation.",
  "story_paragraphs": [
    "FORMA was founded in 2008 with a simple conviction: that architecture should serve people and place, not the other way around.",
    "Over sixteen years we have grown into a practice of twelve architects, interior designers, and landscape specialists working across residential, cultural, civic, and commercial typologies.",
    "Our process begins with deep listening — to the site, to the brief, and to the people who will inhabit what we make. From there, we work iteratively, testing ideas at every scale until we find solutions that feel both inevitable and surprising.",
    "We are based in London with a satellite office in Copenhagen. Our work spans private houses, apartment buildings, cultural institutions, workplaces, and urban master plans across Europe, the Americas, and Asia.",
    "We have been recognised with the RIBA National Award, the Civic Trust Award, and the AJ Small Projects Award, among others. But the measure we value most is whether the people who live and work in our buildings feel that the spaces serve them well."
  ]
}'::jsonb),

-- Values
('values', '[
  {"title": "Context First", "desc": "Every site is a conversation. We listen before we draw."},
  {"title": "Material Honesty", "desc": "We favour materials that age well and tell the truth about how they''re made."},
  {"title": "Human Scale", "desc": "Great buildings are experienced at human scale — from the city street to the window sill."},
  {"title": "Long Practice", "desc": "Architecture is slow work. We believe in taking the time to get it right."}
]'::jsonb),

-- Team
('team', '[
  {"name": "Elena Markov", "role": "Founding Partner & Lead Architect", "bio": "RIBA Part III with 18 years of practice across residential, cultural, and civic typologies. Previously at Zaha Hadid Architects and Snøhetta.", "image_url": null},
  {"name": "Daniel Osei", "role": "Partner, Interior Architecture", "bio": "Specialist in material culture and spatial sequencing. MA Interior Architecture from the RCA. Passionate about the meeting point of craft and construction.", "image_url": null},
  {"name": "Mei-Lin Torres", "role": "Associate, Landscape & Urbanism", "bio": "Landscape architect and urbanist with deep experience in public realm design across Europe and East Asia.", "image_url": null}
]'::jsonb),

-- Contact page info
('contact_info', '{
  "locations": [
    {"label": "London (HQ)", "value": "12 Clifton Gardens, London W9 1DT"},
    {"label": "Copenhagen", "value": "Nørre Voldgade 80, 1358 Copenhagen"}
  ],
  "email": "studio@forma.com",
  "phone": "+44 20 7946 0123",
  "hours": "Monday – Friday, 9:00 – 18:00",
  "hours_note": "We respond to all enquiries within two working days.",
  "project_types": ["New Build", "Renovation", "Interior Architecture", "Landscape", "Planning Advice", "Other"],
  "hero_description": "We welcome enquiries from private clients, developers, institutions, and fellow collaborators. All projects, large or small, begin with a conversation."
}'::jsonb),

-- Services page hero
('services_page', '{
  "hero_subtitle": "Services",
  "hero_title_line1": "Every project,",
  "hero_title_line2": "built from scratch.",
  "hero_description": "We offer a complete range of architectural services, tailored to the scale and nature of each commission.",
  "cta_title": "Ready to discuss your project?",
  "cta_description": "We welcome enquiries at any stage — from initial curiosity to live brief."
}'::jsonb);
