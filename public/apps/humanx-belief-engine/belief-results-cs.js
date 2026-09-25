export const BELIEF_DIMENSIONS_CS = Object.freeze({
  'Metaphysical': { label: 'Metafyzika', desc: 'Otevřenost nehmotným vysvětlením reality' },
  'Evidence': { label: 'Důkazy', desc: 'Opírání se o empiricky ověřitelnou pravdu' },
  'Authority': { label: 'Autorita', desc: 'Podřízení se hierarchii, tradici a vnější moci' },
  'Collective': { label: 'Kolektiv', desc: 'Přednost skupiny před jednotlivcem' },
  'Sacred/Ritual': { label: 'Posvátno a rituál', desc: 'Váha přikládaná rituálům, posvátným předmětům a duchovní praxi' },
  'Absolutism': { label: 'Absolutismus', desc: 'Víra v pevné a všeobecné morální pravdy' },
  'Rigidity': { label: 'Nepružnost', desc: 'Odpor ke změně základních přesvědčení' },
  'Progress': { label: 'Pokrok', desc: 'Optimismus ohledně lidského a technologického rozvoje' },
  'Transcendence': { label: 'Transcendence', desc: 'Potřeba smyslu přesahujícího hmotný svět' },
  'Inherited': { label: 'Převzaté', desc: 'Přesvědčení přijatá před vědomým zkoumáním — z rodiny, kultury či místa' },
  'Self-Built': { label: 'Vlastní stavba', desc: 'Přesvědčení vědomě sestavená studiem, prověřováním a revizí' },
  'Tribal Load': { label: 'Skupinová zátěž', desc: 'Závislost přesvědčení na sounáležitosti a skupinové identitě' },
  'Pain Architecture': { label: 'Architektura bolesti', desc: 'Přesvědčení uspořádaná kolem utrpení, ohrožení, zrady nebo potřeby přežít' },
  'Experience': { label: 'Zkušenost', desc: 'Váha přímého osobního prožitku oproti argumentům' },
  'Dogma Load': { label: 'Dogmatická zátěž', desc: 'Jistota přesahující doložené studium nebo ochotu k revizi' },
  'Revision Openness': { label: 'Otevřenost revizi', desc: 'Schopnost pochybovat, aktualizovat názor a zpracovat protichůdné argumenty' },
  'Identity Fusion': { label: 'Splynutí s identitou', desc: 'Nakolik je přesvědčení spojeno s vlastním já a společenským přežitím' },
  'Epistemic Humility': { label: 'Epistemická pokora', desc: 'Uznání nejistoty a mezí vlastního porozumění' },
  'Stress Ethics': { label: 'Etika pod tlakem', desc: 'Jak morální zásady obstojí při skutečných důsledcích a tlaku' }
});

export const BELIEF_SYSTEMS_CS = Object.freeze({
  'Scientific Materialism': { label: 'Vědecký materialismus', desc: 'Realita je plně fyzická a lze ji vysvětlovat empirickým zkoumáním.' },
  'Secular Humanism': { label: 'Sekulární humanismus', desc: 'Základem jsou lidská důstojnost a rozum bez odvolání na nadpřirozeno.' },
  'Stoicism': { label: 'Stoicismus', desc: 'Nejvyššími hodnotami jsou ctnost a rozum; přijímá se to, co nelze změnit.' },
  'Buddhism': { label: 'Buddhismus', desc: 'Osvobození skrze odpoutání, soucit a vhled do pomíjivosti.' },
  'Traditional Christianity': { label: 'Tradiční křesťanství', desc: 'Spása skrze božskou autoritu, zjevené Písmo a morální absolutna.' },
  'Islam (Traditional)': { label: 'Tradiční islám', desc: 'Úplné odevzdání božské vůli skrze Písmo, právo a společenství.' },
  'Mysticism': { label: 'Mystika', desc: 'Přímá zkušenost jednoty s konečnou realitou přesahující rozumové kategorie.' },
  'Existentialism': { label: 'Existencialismus', desc: 'Radikální svoboda a odpovědnost vytvářet smysl v lhostejném vesmíru.' },
  'Nihilism': { label: 'Nihilismus', desc: 'Ve vesmíru neexistuje vrozený smysl, hodnota ani morální pravda.' },
  'Absurdism': { label: 'Absurdismus', desc: 'Přijetí napětí mezi lidskou potřebou smyslu a vesmírem, který žádný nenabízí.' },
  'Transhumanism': { label: 'Transhumanismus', desc: 'Technologie jako cesta za biologická omezení a lidské utrpení.' },
  'Confucianism': { label: 'Konfucianismus', desc: 'Společenská harmonie skrze hierarchické vztahy, rituál a morální kultivaci.' },
  'Libertarianism': { label: 'Libertarianismus', desc: 'Nejvyšší možná svoboda jednotlivce s minimálním zásahem státu či kolektivu.' },
  'Animism / Indigenous': { label: 'Animismus a domorodé tradice', desc: 'Vše je živé; posvátno je přítomné v přírodě, předcích a místě.' },
  'Stoic Atheism': { label: 'Stoický ateismus', desc: 'Etika založená na rozumu a přírodě, přijímající smrtelnost bez útěšných představ.' }
});

export const BELIEF_CONTRADICTIONS_CS = Object.freeze({
  'Evidence vs Revelation': {
    label: 'Důkazy versus zjevení',
    desc: 'Vědeckým důkazům přikládáte vysokou váhu, ale zároveň přiznáváte věrohodnost předvědeckým textům a tradicím.'
  },
  'Claimed openness vs actual rigidity': {
    label: 'Deklarovaná otevřenost versus skutečná nepružnost',
    desc: 'Říkáte, že byste při dostatku důkazů přesvědčení opustili, ale vaše odpovědi ukazují silný odpor ke změně pohledu na svět.'
  },
  'Free will vs determinism': {
    label: 'Svobodná vůle versus determinismus',
    desc: 'Potvrzujete skutečnou svobodnou vůli a zároveň souhlasíte, že lidské chování utvářejí především síly mimo kontrolu jednotlivce.'
  },
  'Free inquiry vs suppression': {
    label: 'Svobodné zkoumání versus potlačování',
    desc: 'Spoléháte na důkazy a racionální zkoumání, ale podporujete omezování některých myšlenek. Jedno podkopává druhé.'
  },
  'Absolute ethics vs consequentialism': {
    label: 'Absolutní etika versus konsekvencialismus',
    desc: 'Některé činy považujete za naprosto špatné bez ohledu na okolnosti, ale zároveň připouštíte, že účel může světit prostředky. Bez napětí nelze držet obojí.'
  },
  'Death as ending vs persistence': {
    label: 'Smrt jako konec versus pokračování',
    desc: 'Zastáváte, že smrt trvale ukončuje osobní vědomí, a zároveň že něco z vědomí po tělesné smrti přetrvává.'
  },
  'Autonomy claim vs inherited dependence': {
    label: 'Tvrzená autonomie versus převzatá závislost',
    desc: 'Máte za to, že jste si svá přesvědčení skutečně zvolili, ale váš vzorec ukazuje silný vliv skupiny, tradice nebo autority.'
  },
  'Hierarchy vs individual primacy': {
    label: 'Hierarchie versus prvenství jednotlivce',
    desc: 'Podporujete hierarchii jako přirozenou a nutnou, ale zároveň chcete, aby práva jednotlivce převážila nad stabilitou celku.'
  },
  'Prayer and physical law': {
    label: 'Modlitba a fyzikální zákony',
    desc: 'Věříte, že cílený záměr ovlivňuje vnější realitu, a zároveň se řídíte vědeckou shodou. Jedno předpokládá příčinný mechanismus, který druhé neuznává.'
  },
  'Suffering reduction vs retributive justice': {
    label: 'Snižování utrpení versus odplatná spravedlnost',
    desc: 'Snižování utrpení považujete za nejvyšší morální prioritu, ale spravedlnost stavíte nad milosrdenství i tehdy, kdy by milosrdenství utrpení snížilo.'
  },
  'Intuition and scientific method': {
    label: 'Intuice a vědecká metoda',
    desc: 'Důvěřujete vědecké shodě a současně věříte, že intuice dosahuje pravd nepřístupných racionální analýze. Tyto způsoby poznání táhnou opačnými směry.'
  },
  'Loyalty overriding ethics': {
    label: 'Loajalita převažující nad etikou',
    desc: 'Práva jednotlivce podle vás mají přednost před zájmy kolektivu, ale osobní loajalita může zároveň převážit nad širšími etickými povinnostmi.'
  },
  'Certainty without tested understanding': {
    label: 'Jistota bez prověřeného porozumění',
    desc: 'Uvádíte vysokou jistotu a současně omezené vážné zkoumání protichůdných názorů. To není poznání, ale chráněné přesvědčení.'
  },
  'Chosen beliefs vs inherited load': {
    label: 'Zvolená přesvědčení versus převzatá zátěž',
    desc: 'Říkáte, že jste si přesvědčení zvolili, ale jejich původ ukazuje silné dědictví rodiny, kultury nebo komunity.'
  },
  'Truth above all — except dangerous truth': {
    label: 'Pravda nade vše — kromě nebezpečné pravdy',
    desc: 'Upřednostňujete důkazy a pravdu, ale přijímáte potlačení pravdivých tvrzení, pokud jsou jejich společenské následky dost nebezpečné.'
  },
  'Anti-tribal identity with tribal dependency': {
    label: 'Proti-skupinová identita se skupinovou závislostí',
    desc: 'Vaše odpovědi odmítají skupinovou kontrolu, ale stabilitu přesvědčení vážou na sounáležitost a sociální identitu.'
  },
  'Openness claim under defensive reflex': {
    label: 'Tvrzená otevřenost pod obranným reflexem',
    desc: 'Působíte otevřeně revizi, ale při dotyku důkazů s posvátným přesvědčením se objevuje obranná reakce.'
  },
  'Privacy freedom vs security bargain': {
    label: 'Soukromí a svoboda versus výměna za bezpečí',
    desc: 'Ceníte si individuální svobody, ale přijímáte sledování výměnou za příslib bezpečí. Jde o klasický střet svobody a bezpečnosti.'
  },
  'Group loyalty under atrocity pressure': {
    label: 'Skupinová loajalita při tlaku zvěrstev',
    desc: 'Projevujete silnou sounáležitost a současně váháte odsoudit vlastní skupinu pod morálním tlakem. Právě zde se ideologie stává nebezpečnou.'
  },
  'Identity fused to belief': {
    label: 'Identita splynutá s přesvědčením',
    desc: 'Systém přesvědčení je zřejmě spojen s osobní identitou. Změna názoru pak může působit méně jako oprava mapy a více jako zničení vlastního já.'
  },
  'Certainty without openness': {
    label: 'Jistota bez otevřenosti',
    desc: 'Vysoká dogmatická zátěž se pojí s vysokou otevřeností revizi. Obojí nemůže být současně plně skutečné; jedno může být spíše deklarovanou verzí.'
  },
  'Humility that stops at the self': {
    label: 'Pokora, která končí u vlastního já',
    desc: 'Vysoká epistemická pokora se pojí se silným splynutím identity. Pokora, která mizí tam, kde se přesvědčení dotkne vlastního já, je selektivní.'
  },
  'Belonging without obligation': {
    label: 'Sounáležitost bez závazku',
    desc: 'Silná skupinová závislost se pojí s nízkou prioritou kolektivu. Vzorec chce psychologické výhody členství bez vzájemných povinností.'
  },
  'Invisible inheritance': {
    label: 'Neviditelné dědictví',
    desc: 'Vysoká převzatá zátěž se pojí s tvrzením o nezávislé volbě. Převzaté rámce bývají zevnitř neviditelné a působí jako samozřejmá pravda.'
  },
  'Evidential selectivity': {
    label: 'Výběrové zacházení s důkazy',
    desc: 'Závislost na důkazech je vysoká, ale otevřenost revizi nízká. Důkazy pak mohou sloužit spíše k potvrzování postoje než k jeho skutečnému prověření.'
  },
  'Competing truth sources': {
    label: 'Soupeřící zdroje pravdy',
    desc: 'Úcta k autoritě i závislost na důkazech jsou zvýšené. Pod tlakem musí jedno převážit a výsledek může být zvenčí nepředvídatelný.'
  },
  'Evidence value buckled under pressure': {
    label: 'Hodnota důkazů se pod tlakem zlomila',
    desc: 'Hlásíte se k důkazům, ale ve scénáři jste zvolili potlačení pravdivé informace. Deklarovaná zásada nemusí přežít situaci s vysokými sázkami.'
  },
  'Tribe won over truth under direct test': {
    label: 'Skupina při přímé zkoušce zvítězila nad pravdou',
    desc: 'Silná identifikace s důkazy se pojí s volbou skupinové loajality před veřejnou pravdou ve scénáři zvěrstev. Rozdíl mezi hodnotou a jednáním je významný.'
  },
  'Speech restriction despite epistemic openness': {
    label: 'Omezování projevu navzdory otevřenosti poznání',
    desc: 'Podporujete omezení nebezpečných myšlenek i při vysoké otevřenosti revizi a závislosti na důkazech. Otevřený diskurz tak může platit jen uvnitř vašeho rámce.'
  },
  'Ritual without metaphysics': {
    label: 'Rituál bez metafyziky',
    desc: 'Vysoká váha rituálu a důkazů se pojí s nízkou metafyzickou otevřeností. Rituál zůstává psychologickou technologií, zatímco jeho duchovní tvrzení je odmítnuto.'
  },
  'Transcendence without non-physical reality': {
    label: 'Transcendence bez nehmotné reality',
    desc: 'Silná potřeba smyslu přesahujícího hmotu se pojí s odmítnutím nehmotných vysvětlení reality. Bez metafyzického základu zůstává estetika nebo potlačený rozpor.'
  },
  'Absolute morality without authority': {
    label: 'Absolutní morálka bez autority',
    desc: 'Všeobecná morální absolutna podle vás nepotřebují vnější autoritu. To vyžaduje přirozený zákon nebo čistě racionální etiku, které se obtížně zakládají bez něčeho fungujícího jako autorita.'
  },
  'Pain architecture denies its own cost': {
    label: 'Architektura bolesti popírá vlastní cenu',
    desc: 'Silně bolestí utvářená přesvědčení se pojí s tvrzením, že jejich ztráta by byla v pořádku. Přesvědčení vzniklá pod existenčním tlakem však bývají nosnou konstrukcí.'
  },
  'Layered construction over inherited foundation': {
    label: 'Vlastní vrstvy nad převzatým základem',
    desc: 'Vlastní stavba i převzatá zátěž jsou vysoké. Nemusí jít o rozpor: vědomá přestavba často staví nad zděděným základem místo jeho nahrazení. Otázkou je, nakolik je základ viditelný.'
  },
  'Dogma and fusion deny their own cost': {
    label: 'Dogma a splynutí popírají vlastní cenu',
    desc: 'Vysoká dogmatická zátěž a splynutí identity se pojí s tvrzeným klidem vůči ztrátě přesvědčení. Tato struktura naznačuje, že ztráta by ve skutečnosti neutrální nebyla.'
  },
  'Free will claimed in a determined architecture': {
    label: 'Svobodná vůle v determinované architektuře',
    desc: 'Potvrzujete svobodnou vůli, uznáváte převahu vnějších sil a časová osa připisuje změny hlavně utrpení. Pocit vlastní volby tak může být dodatečným výkladem událostí.'
  }
});

export const BELIEF_FORENSIC_EXACT_CS = Object.freeze({
  'Belief Coherence': 'Soudržnost přesvědčení',
  'Internal fit after contradiction penalties.': 'Vnitřní soulad po zohlednění rozporů.',
  'Cognitive Flexibility': 'Kognitivní pružnost',
  'Capacity to revise without self-collapse.': 'Schopnost revidovat názor bez pocitu rozpadu vlastního já.',
  'Tribal Dependence': 'Skupinová závislost',
  'How much belonging powers belief.': 'Nakolik přesvědčení čerpá sílu z potřeby někam patřit.',
  'Authority Reliance': 'Závislost na autoritě',
  'Deference to order, hierarchy, and fixed rules.': 'Podřízení se řádu, hierarchii a pevným pravidlům.',
  'Epistemic Discipline': 'Epistemická kázeň',
  'Evidence plus humility minus dogma.': 'Důkazy a pokora po odečtení dogmatické zátěže.',
  'Identity Fragility': 'Křehkost identity',
  'How painful belief-loss may become.': 'Jak bolestivá může být ztráta přesvědčení.',
  'Meaning Dependency': 'Závislost na smyslu',
  'Need for cosmic or sacred meaning.': 'Potřeba kosmického nebo posvátného smyslu.',
  'Stress Integrity': 'Integrita pod tlakem',
  'How principles behave under pressure.': 'Jak se zásady chovají pod tlakem.',
  'Origin signal': 'Signál původu',
  'High inherited load: family, culture, tradition, or early environment still shape the map.': 'Vysoká převzatá zátěž: rodina, kultura, tradice nebo rané prostředí stále utvářejí mapu.',
  'Strong self-built layer: beliefs appear actively assembled rather than merely absorbed.': 'Silná vlastní vrstva: přesvědčení působí aktivně sestaveně, ne pouze převzatě.',
  'Tribal load is visible: belonging and group stability matter to the belief structure.': 'Skupinová zátěž je viditelná: sounáležitost a stabilita skupiny jsou pro strukturu přesvědčení důležité.',
  'Pain-shaped architecture: threat, suffering, betrayal, or mortality may be doing hidden design work.': 'Architektura utvářená bolestí: ohrožení, utrpení, zrada nebo smrtelnost mohou skrytě určovat její podobu.',
  'Experience-driven load: direct lived experience has authority even where outsiders would demand proof.': 'Zátěž vedená zkušeností: přímý prožitek má autoritu i tam, kde by lidé zvenčí požadovali důkaz.',
  'No single origin dominates. The system looks blended rather than driven by one obvious source.': 'Žádný původ nepřevládá. Systém působí smíšeně, nikoli jako výsledek jediného zřejmého zdroje.',
  'Derived entirely from your existing dimension scores — no new questions. These are not diagnoses, labels, or predictions of what you will do. They are pressure-tendency estimates: how your stated worldview may behave under conflict, social pressure, evidence pressure, or identity threat.': 'Odvozeno výhradně z již vypočtených rozměrů — bez nových otázek. Nejde o diagnózy, nálepky ani předpovědi vašeho jednání. Jsou to odhady tendencí pod tlakem: jak se váš deklarovaný pohled na svět může chovat při konfliktu, společenském tlaku, tlaku důkazů nebo ohrožení identity.',

  'Censorship Tolerance': 'Tolerance cenzury',
  'Tendency to accept or support restricting information and speech.': 'Tendence přijímat nebo podporovat omezování informací a projevu.',
  'Consistently favours open information flow even when ideas feel dangerous or wrong.': 'Důsledně upřednostňuje otevřený tok informací, i když myšlenky působí nebezpečně nebo chybně.',
  'Accepts some content limits under specific conditions — not a universal principle.': 'Za určitých podmínek přijímá některá omezení obsahu, nikoli však jako všeobecnou zásadu.',
  'Authority and ideological framing are doing meaningful filtering work on what ideas receive space.': 'Autorita a ideologický rámec významně filtrují, které myšlenky dostanou prostor.',
  'Strong tendency to support restricting discourse perceived as destabilising or definitively wrong.': 'Silná tendence podporovat omezení diskurzu vnímaného jako destabilizující nebo jednoznačně nesprávný.',
  'Will actively support suppression of ideas that threaten the belief framework or the group.': 'Aktivně podpoří potlačení myšlenek ohrožujících rámec přesvědčení nebo skupinu.',

  'Tribe Defection Probability': 'Pravděpodobnost odchodu od skupiny',
  'Likelihood of breaking from community consensus under evidence pressure.': 'Pravděpodobnost odklonu od shody komunity pod tlakem důkazů.',
  'Unlikely to break from community consensus even under sustained evidence pressure.': 'Odklon od shody komunity je nepravděpodobný i při dlouhodobém tlaku důkazů.',
  'Capable of internal dissent — public defection is costly and reserved for clear cases.': 'Vnitřní nesouhlas je možný; veřejný odchod je nákladný a vyhrazený jasným případům.',
  'Will challenge the group openly when evidence becomes sufficiently unambiguous.': 'Skupinu otevřeně zpochybní, jakmile budou důkazy dostatečně jednoznačné.',
  'Truth-tracking over loyalty is a practiced rather than merely aspirational value.': 'Následování pravdy před loajalitou je praktikovaná, ne pouze deklarovaná hodnota.',
  'Low loyalty threshold — breaks from consensus with less evidence than most.': 'Nízký práh loajality — od shody se odchyluje s menším množstvím důkazů než většina lidí.',

  'Authority Compliance Range': 'Rozsah poslušnosti vůči autoritě',
  'How far institutional authority can direct behaviour before conscience activates.': 'Jak daleko může institucionální autorita řídit chování, než se ozve svědomí.',
  'Authority given limited inherent weight. Compliance is conditional on independent reasoning.': 'Autorita má omezenou vlastní váhu. Poslušnost závisí na nezávislém úsudku.',
  'Follows institutional direction within recognisable limits — not unconditionally.': 'Řídí se institucí v rozpoznatelných mezích, nikoli bezpodmínečně.',
  'Authority carries meaningful default weight. Conscience activates later in the sequence.': 'Autorita má významnou výchozí váhu a svědomí se zapojuje později.',
  'Compliance extends further than direct evidence or personal reasoning would justify alone.': 'Poslušnost sahá dál, než by samy ospravedlnily přímé důkazy nebo vlastní úsudek.',
  'Authority can direct behaviour well into territory personal conscience might otherwise interrupt first.': 'Autorita může řídit chování hluboko do prostoru, kde by jinak zasáhlo osobní svědomí.',

  'Evidence Resistance': 'Odpor vůči důkazům',
  'The evidential threshold required to shift a held position.': 'Množství důkazů potřebné ke změně zastávaného postoje.',
  'Low resistance — positions shift readily under new information.': 'Nízký odpor — postoje se pod vlivem nových informací mění snadno.',
  'Requires reasonable evidence but is not unusually resistant to updating.': 'Vyžaduje přiměřené důkazy, ale aktualizaci názoru neklade neobvyklý odpor.',
  'Evidence must overcome significant structural resistance before changing a held position.': 'Důkazy musí před změnou postoje překonat výrazný strukturální odpor.',
  'Positions are heavily defended. Evidence operates at the margins rather than the core.': 'Postoje jsou silně bráněny. Důkazy působí spíše na okraji než v jádru.',
  'Positions are largely impervious to evidential pressure from outside the belief framework.': 'Postoje jsou převážně odolné vůči důkazům přicházejícím zvenčí rámce přesvědčení.',

  'Moral Override Threshold': 'Práh morální výjimky',
  'Likelihood of invoking higher-order justification to suspend normal ethical constraints.': 'Pravděpodobnost použití vyššího ospravedlnění k pozastavení běžných etických omezení.',
  'Normal ethical constraints hold under most conditions. Principled exceptions are narrow.': 'Běžná etická omezení ve většině podmínek drží a zásadní výjimky jsou úzké.',
  'Moral framework is relatively stable under pressure. Override conditions are clearly bounded.': 'Morální rámec je pod tlakem poměrně stabilní a podmínky výjimky mají jasné meze.',
  'Elevated likelihood of invoking higher-order justification for normally-excluded actions.': 'Zvýšená pravděpodobnost vyššího ospravedlnění pro činy, které jsou běžně vyloučené.',
  'Strong tendency to justify unusual action under moral, sacred, or transcendent framing.': 'Silná tendence ospravedlňovat neobvyklé jednání morálním, posvátným nebo transcendentním rámcem.',
  'The belief system contains architecture capable of suspending ordinary ethics under the right conditions.': 'Systém přesvědčení obsahuje strukturu schopnou za vhodných podmínek pozastavit běžnou etiku.',

  'Belief Preservation Drive': 'Potřeba zachovat přesvědčení',
  'Active drive to protect and insulate the current worldview from disconfirmation.': 'Aktivní potřeba chránit současný pohled na svět před vyvrácením.',
  'Low drive. Exposure to disconfirmation is relatively welcome rather than threatening.': 'Nízká potřeba ochrany. Setkání s vyvrácením je spíše vítané než ohrožující.',
  'Some defensive filtering, but active disconfirmation-seeking is possible.': 'Určité obranné filtrování existuje, ale aktivní hledání vyvrácení je možné.',
  'Meaningful effort invested in rationalising, insulating, and protecting the current worldview.': 'Významné úsilí míří do racionalizace, izolace a ochrany současného pohledu na svět.',
  'High systematic drive to prevent, discount, or reframe challenges to the belief framework.': 'Silná systematická potřeba výzvám předcházet, zlehčovat je nebo je přerámovat.',
  'The worldview is heavily fortified. Challenge is processed as attack rather than information.': 'Pohled na svět je silně opevněn. Výzva je zpracována jako útok, ne jako informace.',

  'Ideological Mobility': 'Ideologická pohyblivost',
  'Probability of significant worldview change in the coming years.': 'Pravděpodobnost významné změny pohledu na svět v příštích letech.',
  'Architecture is stable and largely settled. Major worldview shifts are unlikely.': 'Architektura je stabilní a převážně ustálená. Velké změny pohledu na svět jsou nepravděpodobné.',
  'The map is mostly drawn — active re-evaluation is occurring but only at the edges.': 'Mapa je z větší části nakreslena; aktivní přehodnocování probíhá jen na okrajích.',
  'Meaningful ongoing revision is probable. The current position is not the final position.': 'Průběžná významná revize je pravděpodobná. Současný postoj není konečný.',
  'The worldview is still actively under construction. Significant changes are likely.': 'Pohled na svět se stále aktivně staví a významné změny jsou pravděpodobné.',
  'High ideological mobility — this person may look substantially different in five years.': 'Vysoká ideologická pohyblivost — za pět let může tento člověk zastávat podstatně jiný pohled.'
});
