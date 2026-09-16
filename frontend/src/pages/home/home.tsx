
import { plans } from "../../config/plans";

type Plan = {
  price: number;
  duration: string;
  link: string;
};

const checkIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-[18px] h-[18px] opacity-80 shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen">
      <section id="pricing" className="p-5 md:p-0 text-white">
        <div className="pt-4 max-w-7xl mx-auto">

          {/* TITRE */}
          <div className="flex flex-col text-center w-full mb-8">
            <h2 className="font-bold text-2xl text-white tracking-tight">
              Choisissez votre abonnement BibSaaS
            </h2>

            <p className="text-sm text-white/70 mt-2">
              Commencez avec un essai gratuit de 30 minutes, puis choisissez
              la formule adaptée à votre salon.
            </p>
          </div>

          {/* PRICING CARDS */}
          <div className="relative flex flex-col lg:flex-row justify-center gap-6">

            {/* ========================================================
                PLAN GRATUIT / ESSAI
            ======================================================== */}
            <div className="w-full lg:w-[300px] bg-black rounded-lg">
              <div className="relative flex flex-col h-full gap-5 z-10 bg-base-200 p-8 rounded-xl">

                {/* PRICE */}
                <div className="flex gap-2 items-end">
                  <p className="text-white text-5xl tracking-tight font-extrabold">
                    0 €
                  </p>

                  <div className="flex flex-col justify-end mb-[4px]">
                    <p className="text-sm tracking-wide text-base-content/80 uppercase font-semibold">
                      ESSAI
                    </p>
                  </div>
                </div>

                {/* TRIAL */}
                <div className="text-primary font-bold text-sm">
                  Essai gratuit de 30 minutes
                </div>

                {/* FEATURES */}
                <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                  {[
                    "Gestion des clients",
                    "Gestion des coiffeurs",
                    "Gestion des salons",
                    "Gestion des réservations",
                    "Profil du salon",
                    "Tableau de bord",
                    "Notifications",
                    "Découverte de BibSaaS pendant 30 minutes",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2"
                    >
                      {checkIcon}

                      <span className="text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* BUTTON */}
                <div className="space-y-2">
                  <a
                    className="btn btn-primary btn-block bg-blue-500 hover:bg-blue-600 w-full p-3 rounded-lg block text-center"
                    href="/home"
                  >
                    Commencer gratuitement
                  </a>
                </div>

              </div>
            </div>

            {/* ========================================================
                PLANS PAYANTS
            ======================================================== */}
            {plans.map((plan: Plan, index: number) => (
              <div
                key={`${plan.duration}-${index}`}
                className="w-full lg:w-[300px] flex justify-between bg-black rounded-lg"
              >
                <div className="relative flex flex-col gap-5 z-10 bg-base-200 p-8 rounded-xl w-full">

                  {/* BADGE PLAN POPULAIRE */}
                  {index === 2 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                        POPULAIRE
                      </span>
                    </div>
                  )}

                  {/* PRICE */}
                  <div className="flex gap-2 items-end">
                    <p className="text-white text-5xl tracking-tight font-extrabold">
                      {plan.price} €
                    </p>

                    <div className="flex flex-col justify-end mb-[4px]">
                      <p className="text-sm tracking-wide text-base-content/80 uppercase font-semibold">
                        {plan.duration === "/jour"
                          ? "JOURNALIER"
                          : plan.duration === "/semaine"
                            ? "HEBDOMADAIRE"
                            : plan.duration === "/mois"
                              ? "MENSUEL"
                              : "ANNUEL"}
                      </p>
                    </div>
                  </div>

                  {/* PERIOD */}
                  <p className="text-sm text-white/60">
                    Paiement {plan.duration}
                  </p>

                  {/* FEATURES */}
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">

                    {/* ESSAI GRATUIT */}
                    <li className="flex items-center gap-2 text-primary font-bold">
                      {checkIcon}
                      <span>30 minutes gratuites</span>
                    </li>

                    {/* FONCTIONNALITÉS BIBSAAS */}
                    {[
                      "Gestion des clients",
                      "Gestion des coiffeurs",
                      "Gestion des réservations",
                      "Gestion du salon",
                      "Tableau de bord",
                      "Notifications",
                      "Abonnements et paiements",
                      "Facturation",
                      ...(plan.duration === "/semaine" ||
                      plan.duration === "/mois" ||
                      plan.duration === "/an"
                        ? [
                            "Analyse du visage",
                            "Recommandations de coiffures",
                          ]
                        : []),
                      ...(plan.duration === "/mois" || plan.duration === "/an"
                        ? [
                            "Rapports et statistiques",
                            "Support prioritaire",
                          ]
                        : []),
                      ...(plan.duration === "/an"
                        ? [
                            "Gestion de plusieurs salons",
                            "Gestion des chaînes de salons",
                            "Tableaux de bord avancés",
                            "Automatisations",
                            "Journaux d'audit",
                            "Support premium",
                          ]
                        : []),
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2"
                      >
                        {checkIcon}

                        <span className="text-sm text-white">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* SUBSCRIBE BUTTON */}
                  <div className="space-y-2">
                    <a
                      className="btn bg-blue-500 hover:bg-blue-600 w-full p-3 rounded-lg block text-center"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={plan.link}
                    >
                      S'abonner
                    </a>
                  </div>

                </div>
              </div>
            ))}

          </div>
        </div>
      </section>
    </div>
  );
}
