export const EVIDENCE_UI = Object.freeze({
  en: Object.freeze({
    pageTitle: 'Evidence Reflex — HumanX',
    pageDescription: 'Inspect which evidence source you choose first and how much initial weight you give it. A private HumanX session, not a rationality score or truth verdict.',
    back: '← Back to HumanX', language: 'Language', eyebrow: 'first evidence move', title: 'Evidence Reflex',
    lead: 'When several kinds of evidence are available, which one do you inspect first—and how much initial weight do you give it?',
    boundaryTitle: 'This lab does not rank evidence sources universally.',
    boundaryBody: 'A measurement, original record, repeated observation, expert analysis, witness account, or lived experience can each matter differently by context. Choosing one first does not reject the others.',
    intro: 'Work through eight disputed situations. Choose the source you would inspect first, record its initial weight before checking the others, or leave the choice unresolved.',
    simpleSummary: 'Explain this simply',
    simpleBody: 'Each situation offers three possible sources. Choose the one you would examine first, then say how much weight you would give it before seeing the others.',
    simpleExample: 'Example: for a noise complaint you might inspect calibrated measurements first, while keeping in view that a short measurement can miss when the disturbance happens.',
    start: 'Start private session', sessionOnly: 'session only',
    privacy: 'Nothing is sent, saved, published, or added to My HumanX. Closing or reloading this page clears the session.',
    progress: 'Situation {current} of {total}', chooseBadge: 'choose what you inspect first', limitation: 'Check its limit: {text}',
    weightQuestion: 'Before checking the other sources, how much initial weight would you give this one?',
    weightLow: '1 · slight', weightMiddle: '3 · meaningful', weightHigh: '5 · strong',
    weightNote: 'Initial weight is not a final conclusion. The visible limitation remains part of the record.',
    backButton: '← Back', unresolvedButton: 'Not sure what I’d inspect first', next: 'Next →', resultsButton: 'See session reflex →',
    resultsEyebrow: 'session reflex', resultsTitle: 'What you chose to inspect first',
    resultsIntro: 'Counts show first-inspection choices from this session. They do not rank evidence quality.',
    resolvedMetric: 'resolved situations', unresolvedMetric: 'unresolved choices', averageMetric: 'average initial weight / 5',
    sessionHeading: 'What happened in this session', sourceHeading: 'Source-type pattern', highHeading: 'High initial-weight choices', trailHeading: 'Decision trail',
    noWeight: 'no weight recorded', averageWeight: 'average initial weight {weight} / 5', unresolvedAppearances: ' · {count} unresolved appearance(s)',
    highBadge: '{weight} / 5 initial weight', visibleLimit: 'Visible limit: {text}', noHigh: 'No first choice received an initial weight of 4 or 5.',
    unresolved: 'Unresolved', unresolvedTrail: 'You chose not to force a first evidence source.', firstInspection: 'First inspection: {choice}', initialWeight: 'Initial weight: {weight} / 5',
    resultBoundaryTitle: 'Reflex, not verdict.',
    resultBoundaryBody: 'HumanX is showing which source you chose to inspect first and the weight you reported before checking the others. It is not deciding whether you are rational, whether a source is true, or what your final judgement should be.',
    retake: 'Run another session', return: 'Return to HumanX',
    observationEmpty: 'You left every evidence choice unresolved in this session, so there is no first-inspection pattern yet.',
    observationLeader: 'In this session, {source} was your first inspection choice in {selected} of its {opportunities} appearances.',
    observationTie: 'In this session, no single source type was chosen first most often; {sources} were tied at {count} selection(s).',
    observationHigh: 'You gave {count} first choice(s) an initial weight of 4 or 5.',
    observationUnresolved: 'You left {count} evidence choice(s) unresolved rather than forcing a first source.',
    observationBoundary: 'Choosing a source first does not mean rejecting the others, and this session is not a rationality score or truth verdict.'
  }),
  cs: Object.freeze({
    pageTitle: 'První volba důkazu — HumanX',
    pageDescription: 'Prozkoumejte, který zdroj důkazů volíte jako první a jakou počáteční váhu mu dáváte. Soukromé cvičení HumanX, ne skóre racionality ani rozsudek o pravdě.',
    back: '← Zpět na HumanX', language: 'Jazyk', eyebrow: 'první krok k důkazu', title: 'První volba důkazu',
    lead: 'Když máte k dispozici několik druhů důkazů, který prozkoumáte jako první — a jakou počáteční váhu mu dáte?',
    boundaryTitle: 'Toto cvičení neurčuje obecné pořadí kvality zdrojů důkazů.',
    boundaryBody: 'Měření, původní záznam, opakované pozorování, odborná analýza, svědecká výpověď i dlouhodobá osobní zkušenost mohou mít v různých souvislostech různý význam. První volba neznamená odmítnutí ostatních zdrojů.',
    intro: 'Projděte osm sporných situací. Vyberte zdroj, který byste prověřili jako první, zaznamenejte jeho počáteční váhu ještě před kontrolou ostatních, nebo ponechte volbu bez závěru.',
    simpleSummary: 'Vysvětlit jednoduše',
    simpleBody: 'V každé situaci uvidíte tři možné zdroje. Vyberete ten, který byste prověřili jako první, a potom uvedete, jakou váhu byste mu dali ještě před zobrazením ostatních.',
    simpleExample: 'Příklad: u stížnosti na hluk můžete nejdříve zkontrolovat kalibrované měření, ale zároveň vidíte, že krátké měření může minout dobu, kdy k rušení dochází.',
    start: 'Spustit soukromé cvičení', sessionOnly: 'pouze tato relace',
    privacy: 'Nic se neodesílá, neukládá, nezveřejňuje ani nepřidává do My HumanX. Zavřením nebo obnovením této stránky se relace vymaže.',
    progress: 'Situace {current} z {total}', chooseBadge: 'vyberte, co byste prověřili jako první', limitation: 'Omezení zdroje: {text}',
    weightQuestion: 'Jakou počáteční váhu byste tomuto zdroji dali ještě před kontrolou ostatních?',
    weightLow: '1 · malá', weightMiddle: '3 · významná', weightHigh: '5 · silná',
    weightNote: 'Počáteční váha není konečný závěr. Zobrazené omezení zůstává součástí záznamu.',
    backButton: '← Zpět', unresolvedButton: 'Nevím, co bych prověřil/a jako první', next: 'Další →', resultsButton: 'Zobrazit volby v této relaci →',
    resultsEyebrow: 'volby v této relaci', resultsTitle: 'Co jste se rozhodli prověřit jako první',
    resultsIntro: 'Počty ukazují první volby z této relace. Neurčují pořadí kvality důkazů.',
    resolvedMetric: 'dokončených situací', unresolvedMetric: 'voleb bez závěru', averageMetric: 'průměrná počáteční váha / 5',
    sessionHeading: 'Co se stalo v této relaci', sourceHeading: 'Vzorec druhů zdrojů', highHeading: 'Volby s vysokou počáteční vahou', trailHeading: 'Záznam rozhodnutí',
    noWeight: 'váha nebyla zaznamenána', averageWeight: 'průměrná počáteční váha {weight} / 5', unresolvedAppearances: ' · počet neuzavřených možností: {count}',
    highBadge: 'počáteční váha {weight} / 5', visibleLimit: 'Viditelné omezení: {text}', noHigh: 'Žádná první volba nedostala počáteční váhu 4 nebo 5.',
    unresolved: 'Bez závěru', unresolvedTrail: 'Rozhodli jste se nevynutit první zdroj důkazů.', firstInspection: 'Nejdříve prověřit: {choice}', initialWeight: 'Počáteční váha: {weight} / 5',
    resultBoundaryTitle: 'První reakce, ne rozsudek.',
    resultBoundaryBody: 'HumanX ukazuje, který zdroj jste se rozhodli prověřit jako první a jakou váhu jste mu dali před kontrolou ostatních. Nerozhoduje, zda jste racionální, zda je zdroj pravdivý ani jaký má být váš konečný úsudek.',
    retake: 'Spustit další relaci', return: 'Zpět na HumanX',
    observationEmpty: 'Všechny volby důkazu jste ponechali bez závěru, takže zatím nelze popsat vzorec prvního prověření.',
    observationLeader: 'V této relaci byl zdroj „{source}“ vaší první volbou v {selected} z {opportunities} situací, ve kterých se objevil.',
    observationTie: 'Žádný druh zdroje nebyl volen jako první nejčastěji; {sources} měly shodně počet {count}.',
    observationHigh: 'Počet prvních voleb s počáteční vahou 4 nebo 5: {count}.',
    observationUnresolved: 'Počet voleb ponechaných bez závěru místo vynucení prvního zdroje: {count}.',
    observationBoundary: 'První volba zdroje neznamená odmítnutí ostatních a tato relace není skóre racionality ani rozsudek o pravdě.'
  })
});

export const EVIDENCE_CZECH = Object.freeze({
  sources: Object.freeze({
    direct_data: { label: 'Přímé měření', description: 'Hodnoty nebo nezpracovaná pozorování získaná přímo z dané události či výsledku.' },
    primary_record: { label: 'Původní záznam', description: 'Dokument, nahrávka nebo protokol vytvořený v době blízké události.' },
    repeated_observation: { label: 'Nezávislé opakování', description: 'Stejný vzorec znovu zaznamenaný oddělenými kontrolami nebo týmy.' },
    expert_analysis: { label: 'Odborná analýza', description: 'Výklad člověka s odpovídajícími odbornými znalostmi.' },
    firsthand_account: { label: 'Výpověď přímého svědka', description: 'Zpráva člověka, který byl přímým svědkem konkrétní události.' },
    lived_experience: { label: 'Dlouhodobá osobní zkušenost', description: 'Dlouhodobá zkušenost s určitým stavem, systémem nebo jeho důsledky.' }
  }),
  scenarios: Object.freeze({
    'noise-complaint': { prompt: 'Obyvatelé se neshodnou, zda hluk z blízkého podniku pravidelně překračuje přiměřenou úroveň.', choices: [
      { id: 'direct_data', source: 'direct_data', label: 'Kalibrované hodnoty hladiny hluku', limitation: 'Krátké měření může minout dobu, kdy k rušení skutečně dochází.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'Výpověď člověka, který hluk slyšel', limitation: 'Vnímaný hluk ovlivňuje poloha, doba i přesnost paměti.' },
      { id: 'primary_record', source: 'primary_record', label: 'Původní záznam z návštěvy inspektora', limitation: 'Návštěva mohla pokrýt pouze jedno časové období.' }
    ]},
    'medicine-effect': { prompt: 'Pacient uvádí výrazné zlepšení po zahájení nové léčby.', choices: [
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Výsledky několika nezávislých studií', limitation: 'Studované skupiny nemusí odpovídat tomuto konkrétnímu pacientovi.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'Odborné posouzení mechanismu a studií', limitation: 'Výklad závisí na dostupných důkazech a odborném úsudku.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Pacientův průběžný záznam účinků', limitation: 'Změna u jednoho člověka může mít několik možných příčin.' }
    ]},
    'disputed-quote': { prompt: 'Dvě skupiny se neshodnou, co veřejně známý řečník zamýšlel sporným výrokem.', choices: [
      { id: 'primary_record', source: 'primary_record', label: 'Úplná původní nahrávka nebo přepis', limitation: 'Souvislosti mimo nahrávku mohou stále chybět.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'Výpověď člověka, který byl přítomen', limitation: 'Vzpomínky se mohou měnit a svědci se mohou neshodnout.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'Analýza jazykového nebo oborového odborníka', limitation: 'Odborníci mohou nejednoznačný jazyk vykládat odlišně.' }
    ]},
    'machine-failure': { prompt: 'Stroj během výroby jednou selhal a příčina je sporná.', choices: [
      { id: 'direct_data', source: 'direct_data', label: 'Záznamy senzorů ze selhaného stroje', limitation: 'Záznamy zachycují pouze podmínky, které byly měřeny.' },
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Pokus závadu zopakovat', limitation: 'Testovací podmínky nemusí přesně obnovit původní prostředí.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'Diagnóza technika', limitation: 'Při neúplných fyzických důkazech může diagnóza vycházet z předpokladů.' }
    ]},
    'workplace-policy': { prompt: 'Vedení označuje určité pracovní pravidlo za úspěšné, někteří zaměstnanci za škodlivé.', choices: [
      { id: 'primary_record', source: 'primary_record', label: 'Text pravidla a původní záznam rozhodnutí', limitation: 'Písemný záměr se může lišit od skutečného provedení.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Dlouhodobé zkušenosti dotčených zaměstnanců', limitation: 'Zkušenosti se mohou lišit podle role, směny i konkrétního člověka.' },
      { id: 'direct_data', source: 'direct_data', label: 'Údaje o mzdách, hodinách, odchodech a incidentech', limitation: 'Čísla sama nemusí prokázat příčinu ani zachytit neměřené dopady.' }
    ]},
    'wildlife-change': { prompt: 'Lidé se neshodnou, zda za posledních deset let ubyla místní volně žijící zvířata.', choices: [
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Opakované průzkumy nezávislých týmů', limitation: 'Metody průzkumu mohou minout některé druhy, místa nebo roční období.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'Nedávná pozorování s datem a místem', limitation: 'Určení druhu i způsob hlášení mohou být nejednotné.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Popis změny od dlouhodobých místních pozorovatelů', limitation: 'Dlouhá paměť může odhalit trend, ale nejde o standardizované sčítání.' }
    ]},
    'historical-event': { prompt: 'Tvrzení o odpovědnosti za historickou událost je zpochybňováno.', choices: [
      { id: 'primary_record', source: 'primary_record', label: 'Dobové dopisy, rozkazy a fotografie', limitation: 'Záznamy mohou být neúplné nebo je mohli vytvořit lidé s vlastním zájmem.' },
      { id: 'expert_analysis', source: 'expert_analysis', label: 'Historici porovnávající dostupné prameny', limitation: 'Výklady se mohou lišit a soubor pramenů může být neúplný.' },
      { id: 'firsthand_account', source: 'firsthand_account', label: 'Svědectví účastníka nebo přímého svědka', limitation: 'Výpověď mohou ovlivnit paměť, pozice i osobní zájem.' }
    ]},
    'education-programme': { prompt: 'Škola tvrdí, že nový program zlepšil výsledky žáků.', choices: [
      { id: 'direct_data', source: 'direct_data', label: 'Údaje o docházce a výsledcích před zavedením a po něm', limitation: 'Samotná změna v čase ještě neprokazuje příčinu.' },
      { id: 'repeated_observation', source: 'repeated_observation', label: 'Nezávislá hodnocení na jiných školách', limitation: 'Podmínky jiných škol nemusí odpovídat této škole.' },
      { id: 'lived_experience', source: 'lived_experience', label: 'Zkušenosti žáků a učitelů s programem', limitation: 'Jednotlivé zkušenosti nemusí ukázat, jak jsou dopady rozloženy.' }
    ]}
  })
});
