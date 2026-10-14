import React from 'react';

interface Animal {
  id: string;
  name: string;
  breed: string;
  lof?: boolean;
  birthDate: string;
  sex: 'M' | 'F' | string;
  color?: string;
  microchipNumber?: string;
  motherChipNumber?: string;
  status: 'Disponible' | 'Réservé' | 'Adopté' | string;
  vaccines?: string[];
  dewormed?: boolean;
  kitIncluded?: string[];
  healthCertificateUrl?: string;
  price?: number;
}

const Badge: React.FC<{status: Animal['status']}> = ({status}) => {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
  if (status === 'Disponible') return <span className={`${base} bg-green-100 text-green-800`}>Disponible</span>;
  if (status === 'Réservé') return <span className={`${base} bg-yellow-100 text-yellow-800`}>Réservé</span>;
  if (status === 'Adopté') return <span className={`${base} bg-gray-200 text-gray-700`}>Adopté</span>;
  return <span className={`${base} bg-blue-100 text-blue-800`}>{status}</span>;
};

function calculateAge(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (years > 0) return `${years} an${years > 1 ? 's' : ''}`;
  if (months > 0) return `${months} mois`;
  return `${days} jour${days > 1 ? 's' : ''}`;
}

const Icon = ({type}:{type:string}) => {
  switch(type){
    case 'breed':
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8-9h1M3 12H2m15.364-6.364l.707.707M5.929 18.071l-.707.707m12.728 0l.707-.707M5.929 5.929l-.707-.707" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'gender':
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m6.364 1.636l-1.414 1.414M22 12h-2M18.364 18.364l-1.414-1.414M12 22v-2M5.636 18.364l1.414-1.414M2 12h2M5.636 5.636l1.414 1.414" />
        </svg>
      );
    default:
      return null;
  }
}

const AnimalCard: React.FC<{animal: Animal}> = ({animal}) => {
  return (
    <article className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 bg-gradient-to-br from-gray-100 to-gray-50 p-6 flex items-center justify-center">
          <div className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center text-gray-500">Photo de {animal.name}</div>
        </div>

        <div className="md:col-span-2 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{animal.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{animal.breed}{animal.lof ? ' — LOF' : ''}</p>
            </div>
            <div className="text-right">
              <div className="mb-2"><Badge status={animal.status} /></div>
              {animal.price ? <div className="text-lg font-semibold text-gray-900">{animal.price.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</div> : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon type="breed" />
                <div>
                  <div className="text-xs text-gray-500">Race</div>
                  <div className="text-sm font-medium text-gray-800">{animal.breed}{animal.lof ? ' (LOF)' : ''}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Icon type="calendar" />
                <div>
                  <div className="text-xs text-gray-500">Date de naissance</div>
                  <div className="text-sm font-medium text-gray-800">{new Date(animal.birthDate).toLocaleDateString('fr-FR')} • {calculateAge(animal.birthDate)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Icon type="gender" />
                <div>
                  <div className="text-xs text-gray-500">Sexe & robe</div>
                  <div className="text-sm font-medium text-gray-800">{animal.sex} • {animal.color || 'Non précisée'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">N° Puce ICAD</div>
                <div className="text-sm font-medium text-gray-800">{animal.microchipNumber || 'Non encore attribué'}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">N° Puce mère</div>
                <div className="text-sm font-medium text-gray-800">{animal.motherChipNumber || 'Non renseigné'}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Statut</div>
                <div className="text-sm font-medium text-gray-800"><Badge status={animal.status} /></div>
              </div>
            </div>
          </div>

          <hr className="my-6" />

          <section>
            <h3 className="text-lg font-semibold text-gray-900">Santé & suivi</h3>
            <p className="text-sm text-gray-600 mt-2">Nous fournissons un suivi sanitaire complet et un certificat vétérinaire avant la cession. Le chiot quitte l'élevage avec :</p>
            <ul className="list-disc ml-5 mt-3 text-sm text-gray-700 space-y-1">
              <li>Vaccins : {animal.vaccines && animal.vaccines.length > 0 ? animal.vaccines.join(', ') : 'À venir / selon âge'}</li>
              <li>Vermifuge : {animal.dewormed ? 'À jour' : 'À compléter'}</li>
              <li>Kit chiot inclus : {animal.kitIncluded && animal.kitIncluded.length > 0 ? animal.kitIncluded.join(', ') : 'Collier, carnet de santé, alimentation de démarrage'}</li>
              <li>Certificat vétérinaire : {animal.healthCertificateUrl ? <a href={animal.healthCertificateUrl} className="underline">Télécharger</a> : 'Fourni le jour de la cession'}</li>
            </ul>
          </section>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900">Conseils pour l'accueil</h4>
            <p className="text-sm text-gray-700 mt-2">Avant d'accueillir votre nouveau compagnon, préparez un espace calme, un coin sommeil adapté, et
              une routine d'alimentation et d'exercice. Nous restons disponibles pour un accompagnement
              personnalisé lors des premières semaines d'intégration.</p>
          </div>

        </div>
      </div>
    </article>
  );
}

export default AnimalCard;
