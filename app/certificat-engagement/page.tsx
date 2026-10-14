import React from 'react'

export default function CertificatEngagementPage() {
  return (
    <div className="min-h-screen bg-[#191a19] text-[#e6e3dc] p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-[#242523]/80 p-8">
        <h1 className="font-serif text-3xl text-[#e8e5de]">Certificat d'engagement & d'information</h1>
        <p className="mt-4 text-sm text-zinc-300">
          Ce certificat a pour vocation d'informer l'acquéreur sur ses obligations et bonnes pratiques concernant la détention d'un chien. Il doit être lu attentivement avant toute réservation ou cession.
        </p>

        <section className="mt-6 space-y-4 text-sm text-zinc-200">
          <p>
            En acceptant ce document, vous déclarez avoir reçu les informations relatives à l'origine de l'animal, à son état sanitaire au départ, au suivi vétérinaire recommandé et aux obligations légales (identification par puce, carnets de santé, vaccinations). Vous vous engagez également à assurer un environnement adapté, une socialisation et des soins réguliers.
          </p>

          <h2 className="font-semibold text-zinc-200">Informations essentielles pour l'acquéreur</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li>Identification : l'animal doit être identifié par puce électronique inscrite au fichier ICAD.</li>
            <li>Vaccinations : l'animal doit être à jour de ses vaccins selon l'âge et les recommandations vétérinaires.</li>
            <li>Responsabilité : l'acquéreur est responsable des dommages causés par son animal et doit souscrire une assurance responsabilité civile si nécessaire.</li>
            <li>Suivi : une visite chez le vétérinaire dans les 48–72 heures suivant l'adoption est recommandée.</li>
          </ul>

          <h3 className="font-semibold">Conditions de conservation du certificat</h3>
          <p>Ce certificat ne remplace pas un avis vétérinaire ni les documents officiels. Pour toute question sanitaire, adressez‑vous à un vétérinaire.</p>
        </section>

        <div className="mt-8 text-sm text-zinc-400">
          <p>Pour obtenir une copie signée ou un PDF officiel du certificat, contactez-nous via la page Contact. Le document officiel pourra être joint à la cession le jour de la remise.</p>
        </div>
      </div>
    </div>
  )
}
