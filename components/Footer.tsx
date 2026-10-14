import Link from 'next/link';

const Footer = () => {
  const SIRET = process.env.NEXT_PUBLIC_SIRET || 'En cours d\'immatriculation';
  const RNA = process.env.NEXT_PUBLIC_RNA || 'En cours d\'obtention';
  const ACACED = process.env.NEXT_PUBLIC_ACACED || 'En cours d\'obtention';
  const ICAD = process.env.NEXT_PUBLIC_ICAD_HABILITATION || 'En cours d\'habilitation';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://afm-affm.vercel.app';

  return (
    <footer className="bg-gray-900 text-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Présentation */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Elevage & engagement</h3>
            <p className="text-sm text-gray-300 mb-4">Nous sommes un élevage familial dédié au bien‑être des chiens de race. Notre approche repose
              sur la socialisation précoce, l\'éducation respectueuse et des pratiques d\'élevage éthiques.
            </p>
            <p className="text-sm text-gray-400">Nos engagements :</p>
            <ul className="mt-2 text-sm text-gray-300 space-y-1">
              <li>Respect et confort des mères et des portées</li>
              <li>Socialisation progressive et stimulation cognitive</li>
              <li>Suivi sanitaire régulier et partenariats vétérinaires</li>
              <li>Conseils personnalisés pour la transition dans votre foyer</li>
            </ul>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/nos-chiens" className="text-gray-300 hover:text-white">Nos Chiens</Link></li>
              <li><Link href="/conditions-de-reservation" className="text-gray-300 hover:text-white">Conditions de Réservation</Link></li>
              <li><Link href="/recommandations-sante" className="text-gray-300 hover:text-white">Recommandations Santé</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Conformité & Réglementation */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Conformité & Réglementation</h3>
            <p className="text-sm text-gray-300 mb-2">Informations administratives (remplir lorsque disponible) :</p>
            <dl className="text-sm text-gray-300">
              <div className="mb-2">
                <dt className="font-medium">SIRET</dt>
                <dd>{SIRET}</dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium">RNA / N° d'enregistrement associatif</dt>
                <dd>{RNA}</dd>
              </div>
              <div className="mb-2">
                <dt className="font-medium">Attestation ACACED</dt>
                <dd>{ACACED}</dd>
              </div>
              <div>
                <dt className="font-medium">Habilitation ICAD</dt>
                <dd>{ICAD}</dd>
              </div>
            </dl>
          </div>

          {/* Mentions légales */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Mentions légales & engagement</h3>
            <p className="text-sm text-gray-300 mb-3">Conformément à la loi n° 2021‑1539, nous fournissons à l'acquéreur un certificat d'engagement et
              un document récapitulatif des obligations et des bonnes pratiques relatives à la détention d'un chien.
            </p>
            <p className="text-sm text-gray-300">Pour toute question légale ou administrative, consultez nos <Link href="/mentions-legales" className="underline">Mentions Légales</Link> ou contactez-nous.</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>© {new Date().getFullYear()} Elevage - Tous droits réservés. <a href={siteUrl} className="underline">{siteUrl}</a></p>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
          <p>
            Les informations publiées sur ce site sont fournies à titre informatif et ne remplacent pas
            un avis médical vétérinaire. Avant toute cession, une visite et un certificat vétérinaire de
            bonne santé seront délivrés au nouvel acquéreur.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
