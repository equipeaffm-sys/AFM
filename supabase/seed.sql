-- Seed data for Maison L&M luxury catalog

INSERT INTO public.products (id, title, description, price_cents, stock, images, category)
VALUES
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'L&M Chronographe Imperial 41mm',
    'Boîtier en or rose 18k, mouvement automatique manufacturé, cadran noir brossé soleil. Calibre automatique de haute précision assurant une réserve de marche de 72 heures.',
    2450000,
    5,
    ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1547996160-012745cc5836?q=80&w=1000&auto=format&fit=crop'],
    'Accessoires d''Exception'
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Sac Cabas Séquoia Cuir Taurillon',
    'Cuir pleine fleur tanné en Italie, fermoir siglé L&M plaqué or 24k. Confectionné entièrement à la main dans nos ateliers d''art d''Île-de-France.',
    380000,
    8,
    ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop'],
    'Maroquinerie & Voyage'
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Solitaire Diamant Éternité 2.5 carats',
    'Diamant taille brillant serti sur platine pur 950, clarté VVS1, couleur D exceptionnelle. Certifié par le Gemological Institute of America (GIA).',
    1890000,
    2,
    ARRAY['https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop'],
    'Accessoires d''Exception'
  ),
  (
    'a1b2c3d4-0004-4000-8000-000000000004',
    'Bougie Parfumée Ambre Solaire 300g',
    'Cire végétale soufflée bouche, fragrances naturelles de santal et d''ambre impérial.',
    12000,
    15,
    ARRAY['https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000&auto=format&fit=crop'],
    'Maison & Art de vivre'
  ),
  (
    'a1b2c3d4-0005-4000-8000-000000000005',
    'Malle de Voyage Héritage Monogramme',
    'Structure en peuplier séché, coins en laiton poli main, intérieur en suédine microfibre.',
    850000,
    4,
    ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop'],
    'Maroquinerie & Voyage'
  ),
  (
    'a1b2c3d4-0006-4000-8000-000000000006',
    'Stylos Plume Or & Laque de Chine',
    'Plume or 18k gravée main, corps en laque de Chine véritable aux reflets profonds.',
    185000,
    6,
    ARRAY['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'],
    'Accessoires d''Exception'
  ),
  (
    'a1b2c3d4-0007-4000-8000-000000000007',
    'Coffret Senteurs d''Orient & Flacon Cristal',
    'Sélection d''huiles essentielles précieuses dans leur flacon en cristal taillé main.',
    35000,
    10,
    ARRAY['https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1000&auto=format&fit=crop'],
    'Maison & Art de vivre'
  ),
  (
    'a1b2c3d4-0008-4000-8000-000000000008',
    'Porte-Cartes Minimaliste Cuir Alligator',
    'Cuir d''alligator véritable teinté noir profond, coutures scellées à la cire d''abeille.',
    65000,
    12,
    ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop'],
    'Maroquinerie & Voyage'
  ),
  (
    'a1b2c3d4-0009-4000-8000-000000000009',
    'Chrono Squelette Édition Numérotée N°01/10',
    'Pièce d''exception fabriquée à seulement 10 exemplaires dans le monde. Certificat numéroté.',
    5500000,
    1,
    ARRAY['https://images.unsplash.com/photo-1547996160-012745cc5836?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'],
    'Éditions Limitées'
  ),
  (
    'a1b2c3d4-0010-4000-8000-000000000010',
    'Service à Thé Porcelaine & Or 24k',
    'Porcelaine de Limoges réhaussée de filets d''or fin 24 carats appliqués au pinceau.',
    145000,
    7,
    ARRAY['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1000&auto=format&fit=crop'],
    'Maison & Art de vivre'
  ),
  (
    'a1b2c3d4-0011-4000-8000-000000000011',
    'Collier Émeraude Royale & Diamants 3ct',
    'Émeraude de Colombie de 3 carats sertie sur or blanc 18k et entourée de diamants brillants.',
    4200000,
    2,
    ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop'],
    'Éditions Limitées'
  ),
  (
    'a1b2c3d4-0012-4000-8000-000000000012',
    'Étui à Passeport Cuir de Veau Grainé',
    'Protection ultime pour vos documents de voyage en cuir souple avec dorure à chaud L&M.',
    45000,
    14,
    ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop'],
    'Maroquinerie & Voyage'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  stock = EXCLUDED.stock,
  images = EXCLUDED.images,
  category = EXCLUDED.category;
