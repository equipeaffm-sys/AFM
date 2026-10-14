import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = `
Vous êtes un conseiller chaleureux et expert pour un élevage canin de race. Répondez en français de manière claire, bienveillante et professionnelle.
Donnez des conseils personnalisés sur le choix de la race en fonction de l'espace de vie (appartement, maison avec jardin), du niveau d'activité du foyer, du temps disponible pour l'éducation et la socialisation.

Incluez toujours :
- Un bref rappel des besoins d'exercice quotidiens et des stimulations mentales pour la race proposée.
- Des recommandations d'éducation positive (renforcement positif, routines, socialisation précoce).
- Les obligations légales importantes pour l'acquéreur (identification par puce, vaccination, responsabilité civile, déclaration si applicable).
- Des conseils pratiques pour l'arrivée à la maison (aménagement, premiers jours, visite vétérinaire dans les 48–72h, carnet de santé).

Respectez un ton empathique, évitez le sensationnalisme et ne fournissez pas de diagnostics médicaux — orientez toujours vers un vétérinaire pour les questions sanitaires précises.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    const apiUrl = process.env.CHAT_API_URL || 'https://api.x.ai/v1/chat/completions';
    const apiKey = process.env.XAI_API_KEY || process.env.CHAT_API_KEY;
    const model = process.env.CHAT_MODEL || 'grok-4.7';

    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API pour le service de chat manquante côté serveur.' }, { status: 500 });
    }

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
    };

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await apiRes.json();
    return NextResponse.json(json, { status: apiRes.status });
  } catch (err: any) {
    console.error('Chat proxy error', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
