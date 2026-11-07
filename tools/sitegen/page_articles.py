from parts import head, nav, footer, ico, icon, t

R = "../"


def p(en, no):
    return t(en, no, tag="p")


def h2(en, no):
    return t(en, no, tag="h2")


def ul(items):
    return "<ul>" + "".join(f"<li>{t(en, no)}</li>" for en, no in items) + "</ul>"


def figures(items):
    out = '<div class="figures">'
    for value, en, no in items:
        v = t(*value) if isinstance(value, tuple) else value   # numbers are written differently in Norwegian
        out += f'<div class="figure"><p class="figure-value">{v}</p>{t(en, no, tag="p", cls="mono figure-label")}</div>'
    return out + "</div>"


def photo(src, alt, en, no):
    """A real photo: 1600 × 1067 JPEG with all metadata stripped. alt is English;
    the caption below is in both languages."""
    return (f'<figure class="photo"><img src="{src}" alt="{alt}" width="1600" height="1067" loading="lazy" decoding="async" />'
            f'<figcaption>{t(en, no)}</figcaption></figure>')


def lesson(en, no):
    return f'<div class="lesson">{t(en, no, tag="p")}</div>'


def table(head_row, rows):
    """head_row and each cell: (en, no) or a plain string used for both."""
    def cell(c, tag):
        if isinstance(c, tuple):
            return f"<{tag}>{t(*c)}</{tag}>"
        return f"<{tag}>{c}</{tag}>"
    out = '<div class="table-wrap"><table><thead><tr>' + "".join(cell(c, "th") for c in head_row) + "</tr></thead><tbody>"
    for r in rows:
        out += "<tr>" + "".join(cell(c, "td") for c in r) + "</tr>"
    return out + "</tbody></table></div>"


def page(slug, folder, title, desc, crumb, kicker, lead, body, prev=None, nxt=None, scripts=()):
    """title/lead/kicker/crumb: (en, no). prev/next: (href, (en, no))."""
    h = head(f"{title[0]} — Oscar Skjævestad", desc, f"/{folder}/{slug}.html", R, og_title=title[0], og_desc=desc)
    navlinks = ""
    if prev or nxt:
        left = f'<a href="{prev[0]}">← {t(*prev[1])}</a>' if prev else "<span></span>"
        right = f'<a href="{nxt[0]}">{t(*nxt[1])} →</a>' if nxt else "<span></span>"
        navlinks = f'<nav class="article-nav mono" aria-label="More">{left}{right}</nav>'
    return h + nav(R) + f'''
<main id="main">
  <header class="page-head" id="top">
    <div class="wrap">
      <p class="mono crumb"><a href="{R}#{crumb[2]}">{t(crumb[0], crumb[1])}</a> / {t(kicker[0], kicker[1])}</p>
      <h1>{t(*title)}</h1>
      {t(lead[0], lead[1], tag="p", cls="lead")}
    </div>
  </header>
  <article class="wrap article">
{body}
    {navlinks}
  </article>
</main>
''' + footer(R, scripts)


# ── Log: zero support roofs ──────────────────────────────────

ZERO = page(
    "zero-support-roofs", "log",
    ("Zero support roofs: why a nine-hour print failed", "Null støttetak: hvorfor en ni timers print feilet"),
    "A downloaded print file had 674 support sections and not one roof for the model to land on. Two quick checks would have caught it.",
    ("Log", "Logg", "log"), ("27.09.2026", "27.09.2026"),
    ("I downloaded a ready-made print file for a planter, started it, and stopped it at 46% with filament dragging across the model. The file explained exactly why — once I knew where to look.",
     "Jeg lastet ned en ferdig printfil til en plantepotte, startet den, og stoppet den på 46 % med filament som ble dratt over modellen. Filen forklarte nøyaktig hvorfor — da jeg først visste hvor jeg skulle lete."),
    f'''
    {figures([("674", "support sections", "støtteseksjoner"), ("0", "support roofs", "støttetak"),
              ("706 / 706", "layers / height moves", "lag / høydeflytt"), (("1,309", "1 309"), "roofs after re-slicing", "tak etter ny slicing")])}

    {h2("What went wrong on the bed", "Hva som gikk galt på platen")}
    {p("The pot itself printed cleanly. The tree supports around it didn’t: their tops frayed, the overhang above them bridged into thin air as an open lattice, and strands of filament were dragged across the print. I paused it, looked, gave it another chance, and then stopped it for good at about 46%.",
       "Selve potten printet fint. Trestøttene rundt den gjorde det ikke: toppene frynset seg, overhenget over dem ble printet rett ut i luften som et åpent gitter, og tråder av filament ble dratt over printen. Jeg satte den på pause, så på den, ga den en sjanse til, og stoppet den for godt på rundt 46 %.")}

    {h2("What the file said", "Hva filen sa")}
    {p("The G-code had been sliced in Cura by someone else, and its settings block showed just three changes from the printer’s stock profile: supports on, tree style, and supports from the build plate only. Everything else was default. Counting what the slicer had actually written out told the rest:",
       "G-koden var slicet i Cura av noen andre, og innstillingsblokken viste bare tre endringer fra printerens standardprofil: støtte på, trestøtte, og støtte bare fra printeplaten. Alt annet var standard. Å telle hva sliceren faktisk hadde skrevet ut fortalte resten:")}
    {ul([("<strong>674 sections of support, and 0 of support interface.</strong> No roof anywhere: every overhang was printed straight onto the hollow tops of the support trunks.",
          "<strong>674 støtteseksjoner, og 0 med støttegrensesnitt.</strong> Ingen tak noe sted: hvert overheng ble printet rett på de hule toppene av støttestammene."),
         ("<strong>706 layers, and exactly 706 travel moves that changed height.</strong> The only height changes were layer changes, so Z-hop was off: on every travel, the nozzle dragged across whatever was still soft underneath.",
          "<strong>706 lag, og nøyaktig 706 forflytninger som endret høyde.</strong> De eneste høydeendringene var lagbytter, så Z-hop var av: på hver forflytning ble dysen dratt over det som fortsatt var mykt under."),
         ("<strong>0.5 mm of retraction</strong>, which with no Z-hop gave the stringing.",
          "<strong>0,5 mm tilbaketrekking</strong>, som sammen med manglende Z-hop ga trådene.")])}

    {h2("The fix", "Løsningen")}
    {p("I found the original model and sliced it myself: supports everywhere rather than from the plate only, four roof layers on every support, 0.4 mm of Z-hop on every travel, and 8% infill instead of 20% — a planter doesn’t need a solid core, and the infill had been the single biggest cost in the file. Tree supports threw five “lost branch” warnings on this model; plainer snug supports threw none, so they won.",
       "Jeg fant originalmodellen og slicet den selv: støtte overalt i stedet for bare fra platen, fire taklag på hver støtte, 0,4 mm Z-hop på hver forflytning, og 8 % fyll i stedet for 20 % — en plantepotte trenger ikke en massiv kjerne, og fyllet var den største enkeltkostnaden i filen. Trestøtter ga fem «lost branch»-advarsler på denne modellen; enklere tettsittende støtter ga ingen, så de vant.")}
    {table([("", ""), ("Downloaded file", "Nedlastet fil"), ("Re-sliced", "Ny slicing")],
           [(("Support roofs", "Støttetak"), "0", ("1,309", "1 309")),
            (("Z-hop", "Z-hop"), ("off", "av"), ("0.4 mm", "0,4 mm")),
            (("Slicer warnings", "Advarsler"), "—", "0"),
            (("Filament", "Filament"), ("48.9 m", "48,9 m"), ("44.8 m", "44,8 m")),
            (("Estimated time", "Beregnet tid"), "9 h 30 m", "12 h 39 m")])}
    {p("It takes about three hours longer, and uses less filament than the file that failed. The re-sliced version is next in the printer’s queue.",
       "Den tar rundt tre timer lenger, og bruker mindre filament enn filen som feilet. Den nye versjonen er neste i printerens kø.")}

    {lesson("Two checks before trusting someone else’s G-code. Search it for <code>SUPPORT-INTERFACE</code>: if there are none, nothing is holding up your overhangs. Then compare the number of height-changing travel moves with the number of layers: if they’re equal, Z-hop is off.",
            "To sjekker før du stoler på andres G-kode. Søk etter <code>SUPPORT-INTERFACE</code>: finnes det ingen, er det ingenting som holder oppe overhengene. Sammenlign så antall forflytninger som endrer høyde med antall lag: er de like, er Z-hop av.")}
''',
    prev=("levelling-the-bed.html", ("Levelling the bed", "Nivellering av platen")),
    nxt=("permission-ladder.html", ("The permission ladder", "Tillatelsesstigen")),
)


# ── Log: levelling the bed ───────────────────────────────────

LEVEL = page(
    "levelling-the-bed", "log",
    ("Levelling a 420 mm bed by measurement", "Nivellering av en 420 mm printeplate etter mål"),
    "From 2.965 mm out of true to 0.597 mm, one screw and one probe at a time — and the whole bed usable again.",
    ("Log", "Logg", "log"), ("27.09.2026", "27.09.2026"),
    ("My Neptune 4 Max has a 420 mm bed, but only a square about 120 mm across printed reliably. The rest was too far out of true for the mesh to make up for. Here’s how it got back to the whole bed in an afternoon.",
     "Neptune 4 Max-en min har en printeplate på 420 mm, men bare en firkant på rundt 120 mm printet pålitelig. Resten var for skjev til at meshen kunne kompensere. Slik fikk jeg tilbake hele platen på en ettermiddag."),
    f'''
    {figures([(("2.965 → 0.597", "2,965 → 0,597"), "mesh range, mm", "mesh-spenn, mm"), (("1.369 → 0.142", "1,369 → 0,142"), "corner spread, mm", "hjørneavvik, mm"),
              (("0.052", "0,052"), "probe repeatability, mm", "målerepeterbarhet, mm"), (("0.011", "0,011"), "agreement with the printer, mm", "avvik fra printerens egen, mm")])}

    {h2("Trust the probe first", "Stol på måleren først")}
    {p("Before turning a single screw, I probed the same points again and again. They agreed within 0.052 mm — so any change bigger than that would be real, not noise.",
       "Før jeg skrudde på én eneste skrue, målte jeg de samme punktene om og om igjen. De var enige innenfor 0,052 mm — så enhver endring større enn det ville være ekte, ikke støy.")}

    {h2("One screw, then measure", "Én skrue, så mål")}
    {p("The bed has six screws: one in each corner and one in the middle of each long side. I turned one at a time and probed again after every turn. That taught me the two things the manual doesn’t say: clockwise raises that corner, and a full turn moves it roughly 0.35–0.55 mm.",
       "Platen har seks skruer: én i hvert hjørne og én midt på hver langside. Jeg skrudde én om gangen og målte på nytt etter hver vridning. Det lærte meg de to tingene manualen ikke sier: med klokken løfter hjørnet, og en hel omdreining flytter det omtrent 0,35–0,55 mm.")}

    {h2("The result", "Resultatet")}
    {p("The mesh range went from 2.965 mm to 0.597 mm, and the spread between the corners from 1.369 mm to 0.142 mm. As a cross-check, the printer’s own auto-level then made a 121-point mesh of the same bed. It came out at 0.606 mm — within 0.011 mm of mine. The whole 420 mm bed is usable again, and that mesh is loaded after homing on every print.",
       "Mesh-spennet gikk fra 2,965 mm til 0,597 mm, og avviket mellom hjørnene fra 1,369 mm til 0,142 mm. Som kontroll lagde printerens egen autonivellering så en mesh med 121 punkter av den samme platen. Den endte på 0,606 mm — innenfor 0,011 mm av min. Hele platen på 420 mm er brukbar igjen, og den meshen lastes etter homing på hver print.")}

    {h2("The last step was by ear", "Siste steg var på gehør")}
    {p("The final Z offset came from the first layer, not a sheet of paper. The nozzle scraped audibly, so I raised it in small steps until the first layer both looked and sounded right: −2.27 mm.",
       "Den endelige Z-offseten kom fra første lag, ikke et ark papir. Dysen skrapte hørbart, så jeg hevet den i små steg til første lag både så og hørtes riktig ut: −2,27 mm.")}

    {lesson("Prove the instrument, change one thing, measure again. It’s slower per step and much faster overall.",
            "Bevis at måleinstrumentet er til å stole på, endre én ting, mål igjen. Det er tregere per steg og mye raskere totalt.")}
''',
    nxt=("zero-support-roofs.html", ("Zero support roofs", "Null støttetak")),
)


# ── Log: the permission ladder ───────────────────────────────

def choice(name, value, en, no, checked=False, note=None):
    c = " checked" if checked else ""
    extra = f' <span class="try-mine">{t(*note)}</span>' if note else ""
    return f'<label class="try-option"><input type="radio" name="{name}" value="{value}"{c} /><span>{t(en, no)}{extra}</span></label>'


TRY = f'''
    <section class="lab-demo try" id="try" aria-labelledby="try-title">
      <h2 id="try-title">{ico("shield-check")}{t("Try it", "Prøv selv")}</h2>
      {p("The same checks, in the same order, rewritten for this page. Pick a ceiling, pick who’s asking, and ask for something. Nothing here reaches the real Jarvis.",
         "De samme sjekkene, i samme rekkefølge, skrevet om for denne siden. Velg et tak, velg hvem som spør, og be om noe. Ingenting her når den ekte Jarvis.")}
      <div class="try-panel">
        <div class="try-settings">
          <fieldset class="try-choice">
            <legend class="mono">{t("Ceiling", "Tak")}</legend>
            {choice("ceiling", "read", "Read", "Lese")}
            {choice("ceiling", "safe_action", "Safe action", "Trygg handling", True, ("mine", "min"))}
            {choice("ceiling", "confirm_required", "Confirm required", "Krever bekreftelse")}
          </fieldset>
          <fieldset class="try-choice">
            <legend class="mono">{t("Asked by", "Spurt via")}</legend>
            {choice("channel", "voice", "Voice", "Stemme", True)}
            {choice("channel", "dashboard", "Dashboard button", "Knapp på dashbordet")}
          </fieldset>
        </div>
        <div class="try-asks"></div>
        <div class="try-type">
          <input class="try-input" type="text" autocomplete="off" spellcheck="false" aria-label="Type a request" />
          <button type="button" class="btn btn-secondary try-go">{t("Ask", "Spør")}</button>
        </div>
        <div class="try-result" hidden aria-live="polite"></div>
      </div>
    </section>'''

LADDER = page(
    "permission-ladder", "log",
    ("A voice assistant that can’t do more than it’s allowed to", "En stemmeassistent som ikke kan gjøre mer enn den har lov til"),
    "How J.A.R.V.I.S. decides what it may touch, why every button goes through the same gate as a spoken request, and the test that once stopped a real printer.",
    ("Log", "Logg", "log"), ("10.2026", "10.2026"),
    ("J.A.R.V.I.S. can switch my lights, run the TV, keep an eye on the heating and pause my 3D printer. Most of the work went into what it can’t do — and making sure nothing, not even its own dashboard, can talk it into more.",
     "J.A.R.V.I.S. kan skru av og på lyset, styre TV-en, følge med på varmen og sette 3D-printeren på pause. Mesteparten av arbeidet gikk med til hva den ikke kan gjøre — og å sørge for at ingenting, ikke engang dens eget dashbord, kan lure den til mer."),
    f'''
    {figures([("4", "permission levels", "tillatelsesnivåer"), ("500+", "automated tests", "automatiske tester"),
              ("2 min", "to answer a confirmation", "til å svare på en bekreftelse"), ("1", "gate for voice and buttons", "port for stemme og knapper")])}
    <p class="more">{t('<a href="#try">Skip to the version you can try ↓</a>', '<a href="#try">Hopp til versjonen du kan prøve ↓</a>')}</p>

    {h2("A ladder, not a switch", "En stige, ikke en bryter")}
    {p("Every tool belongs to one of four levels: <strong>read</strong> (observe only), <strong>safe action</strong> (reversible and harmless, like a lamp), <strong>confirm required</strong> (physical or costly — a heater setpoint, cancelling a print) and <strong>disabled</strong>. Each installation has a ceiling in its configuration, and tools above it are never even offered to the language model.",
       "Hvert verktøy hører til ett av fire nivåer: <strong>lese</strong> (bare observere), <strong>trygg handling</strong> (reversibel og ufarlig, som en lampe), <strong>krever bekreftelse</strong> (fysisk eller kostbart — et temperaturpunkt på en ovn, å avbryte en print) og <strong>deaktivert</strong>. Hver installasjon har et tak i konfigurasjonen, og verktøy over det blir aldri engang tilbudt språkmodellen.")}

    {h2("Don’t take the model’s word for it", "Ikke stol på modellen")}
    {p("The list the model sees is filtered, but a filtered list isn’t a control. Every call is checked again at the moment it runs: the permission level, the exact arguments the tool accepts, and the room — which has to come from an allow-list. The model names a room; it never names a device.",
       "Listen modellen ser er filtrert, men en filtrert liste er ikke en kontroll. Hvert kall sjekkes på nytt i det øyeblikket det kjøres: tillatelsesnivået, nøyaktig hvilke argumenter verktøyet godtar, og rommet — som må komme fra en godkjent liste. Modellen nevner et rom; den nevner aldri en enhet.")}

    {h2("Asking instead of doing", "Spørre i stedet for å gjøre")}
    {p("An action that needs confirmation doesn’t happen; it turns into a question. Jarvis says exactly what it’s about to do and waits. The proposal belongs to one conversation, expires after two minutes, and can be answered once. A “yes” said in a different conversation can’t approve it — and if the ceiling is lowered between the question and the answer, the yes does nothing.",
       "En handling som krever bekreftelse skjer ikke; den blir et spørsmål. Jarvis sier nøyaktig hva den skal til å gjøre, og venter. Forslaget hører til én samtale, utløper etter to minutter, og kan besvares én gang. Et «ja» i en annen samtale kan ikke godkjenne det — og hvis taket senkes mellom spørsmålet og svaret, gjør ja-et ingenting.")}

    {h2("Buttons go through the same gate", "Knapper går gjennom samme port")}
    {p("The dashboard has controls for the lights, TV, routines and the printer. Every button calls the same function a spoken request reaches, so it can never do more than Jarvis could be asked to do. On top of that, the dashboard has its own short list: starting a print, slicing, probing the bed and the emergency stop never get a button, whatever the ceiling.",
       "Dashbordet har kontroller for lys, TV, rutiner og printeren. Hver knapp kaller den samme funksjonen som en muntlig forespørsel når, så den kan aldri gjøre mer enn Jarvis kunne blitt bedt om. I tillegg har dashbordet sin egen korte liste: å starte en print, slicing, måling av printeplaten og nødstopp får aldri en knapp, uansett tak.")}
{TRY}

    {h2("Two things the tests caught", "To ting testene fanget")}
    {p("Once, a test sent a real emergency stop to the real printer. It only failed because my laptop happened to be on a different network. Now the test suite refuses any attempt to reach the printer at all.",
       "En gang sendte en test et ekte nødstopp til den ekte printeren. Den feilet bare fordi laptopen min tilfeldigvis var på et annet nettverk. Nå nekter testsuiten ethvert forsøk på å nå printeren i det hele tatt.")}
    {p("Later, a review of the dashboard found that its confirm button checked who was asking and the one-time token — but not what was being confirmed. A print proposed in a chat could, in principle, have been approved from a button. Now the dashboard’s list applies to the yes as well as the asking.",
       "Senere fant en gjennomgang av dashbordet at bekreft-knappen sjekket hvem som spurte og engangsnøkkelen — men ikke hva som ble bekreftet. En print foreslått i en chat kunne i prinsippet blitt godkjent fra en knapp. Nå gjelder dashbordets liste for ja-et like mye som for spørsmålet.")}

    {lesson("The interesting part of an assistant that controls real things isn’t what it can do. It’s making sure every path — voice, chat and buttons — meets the same checks, in one place.",
            "Det interessante med en assistent som styrer ekte ting er ikke hva den kan gjøre. Det er å sørge for at hver vei inn — stemme, chat og knapper — møter de samme sjekkene, på ett sted.")}
    <p class="more">{t('<a href="../builds/jarvis.html">How J.A.R.V.I.S. is built →</a>', '<a href="../builds/jarvis.html">Slik er J.A.R.V.I.S. bygget →</a>')}</p>
''',
    prev=("zero-support-roofs.html", ("Zero support roofs", "Null støttetak")),
    nxt=("printing-the-hand.html", ("Printing the hand", "Å printe hånden")),
    scripts=("ladder.js",),
)


# ── Log: printing the hand ───────────────────────────────────

HANDPRINT = page(
    "printing-the-hand", "log",
    ("Printing a robot hand, and the night it ate the print head", "Å printe en robothånd, og natten den spiste printerhodet"),
    "Every part of the InMoov hand is printed. On the way: support that couldn’t come out, a profile slip that turned out not to matter, and a 13-hour print that destroyed the print head.",
    ("Log", "Logg", "log"), ("11.2026", "11.2026"),
    ("Every printed part of the InMoov hand is done: five fingers, the thumb, the palm and the finger covers. Getting there took two lessons about support and one expensive one about leaving a printer alone.",
     "Alle de printede delene til InMoov-hånden er ferdige: fem fingre, tommelen, håndflaten og fingerdekslene. Veien dit ga to lærdommer om støtte og én dyr lærdom om å la en printer stå alene."),
    f'''
    {figures([(("≈ 25 h", "≈ 25 t"), "of printing for the hand", "printing for hånden"), ("0", "support inside the fingers", "støtte inne i fingrene"),
              ("4", "pieces reprinted", "deler printet på nytt"), ("1", "print head lost", "printerhode tapt")])}

    {h2("Check the bed before trusting it", "Sjekk platen før du stoler på den")}
    {p("The bed mesh was a month old, so before the first part I probed the bed again and compared. The shape hadn’t changed, but the whole bed sat about 0.055 mm higher, with the first layer only about 0.03 mm from scraping. I saved the new scan in place of the old one, and every part printed since has gone down cleanly.",
       "Mesh-en av platen var en måned gammel, så før første del målte jeg platen på nytt og sammenlignet. Formen var den samme, men hele platen lå rundt 0,055 mm høyere, og første lag var bare rundt 0,03 mm fra å skrape. Jeg lagret den nye målingen i stedet for den gamle, og alle deler printet siden har lagt seg pent.")}
    {photo("img/first-finger.jpg", "Six small white finger pieces standing on the black print bed after the first print",
           "The little finger, the first part printed on the re-checked bed.", "Lillefingeren, den første delen printet på den nymålte platen.")}

    {h2("Support you can’t get out", "Støtte som ikke kan fjernes")}
    {p("Each finger is six small pieces full of slots, tendon channels and pin holes. My usual settings put snug support in all of them, and no tool on my bench could dig it out again. Limiting support to the build plate didn’t help either: a tendon channel whose floor is the bed still counts as touching the plate.",
       "Hver finger er seks små deler fulle av spor, senekanaler og hull til pinner. De vanlige innstillingene mine fylte alle med tettsittende støtte, og ingen verktøy på benken min fikk den ut igjen. Å begrense støtten til printeplaten hjalp heller ikke: en senekanal med platen som gulv teller fortsatt som at den berører platen.")}
    {photo("img/support-in-the-slot.jpg", "A finger piece held between two fingers, with a grid of support material stuck deep inside its slot",
           "Support printed inside a tendon slot. No tool on the bench could get it out.", "Støtte printet inne i et senespor. Ingen verktøy på benken fikk den ut.")}
    {p("So I measured instead of guessing. The widest gap any finger piece has to bridge is 3.9 mm, and 6.1 mm inside the dome of the fingertip — well within what PLA bridges on its own. I turned support off for the fingers and counted zero support moves in every file before printing. The reprinted pieces came out clean.",
       "Så jeg målte i stedet for å gjette. Det bredeste spennet noen fingerdel må bygge bro over er 3,9 mm, og 6,1 mm inne i kuppelen på fingertuppen — godt innenfor det PLA klarer på egen hånd. Jeg skrudde av støtte for fingrene og telte null støttebevegelser i hver fil før printing. Delene som ble printet på nytt kom ut rene.")}
    {p("The finger covers were the exception. They’re curved shells that touch the bed on 10–18 mm² whichever way you turn them, so they kept their support — but it sits under an open hollow, and it came out in one piece.",
       "Fingerdekslene var unntaket. De er buede skall som berører platen med 10–18 mm² uansett hvordan de snus, så de beholdt støtten — men den sitter under et åpent hulrom, og den kom ut i ett stykke.")}

    {h2("A slip that didn’t matter, this time", "En glipp som ikke betydde noe, denne gangen")}
    {p("Re-slicing the fingers, I loaded the decorative profile instead of the functional one, so the first ones printed at 8% infill instead of 20%. Before reprinting anything I checked how much it mattered: in a finger piece, infill is under 2% of the plastic even at 20%. The pieces are almost all wall. The rest of the hand was sliced at 20%, and nothing needed reprinting.",
       "Da jeg slicet fingrene på nytt, lastet jeg dekorasjonsprofilen i stedet for den funksjonelle, så de første ble printet med 8 % fyll i stedet for 20 %. Før jeg printet noe på nytt sjekket jeg hvor mye det betydde: i en fingerdel er fyllet under 2 % av plasten selv med 20 %. Delene er nesten bare vegg. Resten av hånden ble slicet med 20 %, og ingenting måtte printes på nytt.")}

    {h2("The night it ate the print head", "Natten den spiste printerhodet")}
    {p("The fingers had all stuck well, so I got bolder: two tall forearm shells and the back of the hand on one 13-hour plate, running overnight and into the next day. A watcher script checks the printer while I’m away. It catches filament running out, a clog and a print left paused too long. What it can’t see is a part coming loose.",
       "Fingrene hadde sittet godt, så jeg ble modigere: to høye underarmsskall og baksiden av hånden på én plate på 13 timer, som gikk gjennom natten og inn i neste dag. Et overvåkingsskript følger med på printeren mens jeg er borte. Det fanger opp tomt filament, tetting og en print som står for lenge på pause. Det det ikke ser, er en del som løsner.")}
    {p("Only thin outlines of the first layer were left on the bed, so the parts let go early. For hours after that, the printer kept laying plastic into the air, and it built up into a solid lump that encased the hot end. The watcher reported a normal print the whole time, because plastic was still coming out. It just wasn’t landing anywhere. A replacement print head is on its way.",
       "Bare tynne omriss av første lag var igjen på platen, så delene slapp tidlig. I timevis etter det fortsatte printeren å legge plast ut i luften, og det bygde seg opp til en massiv klump som kapslet inn hotenden. Overvåkeren meldte om en normal print hele tiden, fordi det fortsatt kom plast ut. Den landet bare ikke noe sted. Et nytt printerhode er på vei.")}
    {photo("img/print-head.jpg", "The printer's print head on the bed, with a large lump of white plastic wrapped around the hot end",
           "What the printer had been building instead: a lump of PLA around the hot end.", "Det printeren hadde bygget i stedet: en klump PLA rundt hotenden.")}
    {photo("img/bed-after.jpg", "The black print bed with only thin white outlines and a tangle of loose filament left on it",
           "All that was left on the bed: outlines of the first layer and a tangle.", "Alt som var igjen på platen: omriss av første lag og en floke.")}
    {p("What changes: no long unattended prints until a camera watches the bed with local spaghetti detection. Tall parts print alone, with a brim, while someone is home. The bed gets washed with soap before alcohol, because alcohol only spreads grease around. And the Z offset gets set again from scratch once the new head is on.",
       "Det som endres: ingen lange printer uten tilsyn før et kamera følger med på platen med lokal deteksjon av spaghetti. Høye deler printes alene, med brim, mens noen er hjemme. Platen vaskes med såpe før alkohol, fordi alkohol bare smører fettet utover. Og Z-offseten settes på nytt fra bunnen av når det nye hodet er på.")}

    {h2("Meanwhile, assembly", "I mellomtiden, montering")}
    {p("The printer being down doesn’t stop the hand. The finger segments are glued, the hinge pins are 3 mm brass rod, and the guide had two corrections for me: the swinging lug holes want 3.2–3.5 mm while the fork ears stay at 3 mm, and each finger gets two braided tendons, one to close it and one to open it, knotted together under the fingertip cap.",
       "At printeren står stille stopper ikke hånden. Fingersegmentene er limt, hengselpinnene er 3 mm messingstang, og byggeguiden hadde to korrigeringer til meg: hullene i leddene som svinger vil ha 3,2–3,5 mm mens ørene på gaflene blir på 3 mm, og hver finger får to flettede sener, én som lukker den og én som åpner den, knyttet sammen under hetten på fingertuppen.")}
    {photo("img/glued-segments.jpg", "A glued bottom finger segment above, and a middle segment being pressed together below",
           "Glued: the bottom segment of a finger (top), and a middle segment going together (bottom).", "Limt: det nederste segmentet av en finger (øverst), og et midtsegment som settes sammen (nederst).")}

    {lesson("A watcher is only as good as what it can measure. Mine measured the filament perfectly and was blind to the one failure that mattered. Know the blind spot of whatever is watching, and don’t let a long run sit in it.",
            "En overvåker er bare så god som det den kan måle. Min målte filamentet perfekt og var blind for den ene feilen som betydde noe. Kjenn blindsonen til det som overvåker, og ikke la en lang print stå i den.")}
    <p class="more">{t('<a href="../builds/inmoov.html">The InMoov hand build →</a>', '<a href="../builds/inmoov.html">Byggingen av InMoov-hånden →</a>')}</p>
''',
    prev=("permission-ladder.html", ("The permission ladder", "Tillatelsesstigen")),
    nxt=("closing-the-blind-spot.html", ("Closing the blind spot", "Å tette blindsonen")),
)


# ── Log: closing the blind spot ──────────────────────────────

BLINDSPOT = page(
    "closing-the-blind-spot", "log",
    ("Closing the blind spot", "Å tette blindsonen"),
    "After a runaway print destroyed the print head, the printer got eyes: a camera on the bed, failure detection on my own server, and alerts that reach my phone. None of it has caught a real failure yet.",
    ("Log", "Logg", "log"), ("11.2026", "11.2026"),
    ("The print that destroyed my print head ran for hours in front of a watcher that saw nothing wrong. So the printer now has eyes, a detector that runs at home, and a way to wake me up. The honest part: it’s all waiting for the new print head before it can prove anything.",
     "Printen som ødela printerhodet mitt gikk i timevis foran en overvåker som ikke så noe galt. Så nå har printeren øyne, en detektor som kjører hjemme, og en måte å vekke meg på. Den ærlige delen: alt venter på det nye printerhodet før det kan bevise noe."),
    f'''
    {figures([("1", "camera, pointed at the bed", "kamera, rettet mot platen"), ("0", "video frames leaving the house", "videobilder som forlater huset"),
              ("6", "services checked every minute", "tjenester sjekket hvert minutt"), ("0", "real failures caught so far", "ekte feil fanget så langt")])}

    {h2("What the old watcher couldn’t see", "Det den gamle overvåkeren ikke så")}
    {p("My watcher script reads the printer’s own sensors: whether filament is moving, whether the print is paused, whether it finished. When a part came loose overnight, every one of those looked normal. Plastic was still flowing; it just wasn’t landing on anything. The only way to notice that is to look at the bed.",
       "Overvåkingsskriptet mitt leser printerens egne sensorer: om filamentet beveger seg, om printen står på pause, om den ble ferdig. Da en del løsnet i løpet av natten, så alt dette normalt ut. Plasten rant fortsatt; den landet bare ikke på noe. Den eneste måten å merke det på er å se på platen.")}

    {h2("A camera that only sees the bed", "Et kamera som bare ser platen")}
    {p("A small USB camera now sits on the printer, angled down so the frame is the print bed and nothing else in the room. The printer streams it on my own network. It never goes to a cloud service, and the dashboard and the detector both read it from there.",
       "Et lite USB-kamera sitter nå på printeren, vinklet ned slik at bildet er printeplaten og ingenting annet i rommet. Printeren strømmer det på mitt eget nettverk. Det går aldri til en skytjeneste, og både dashbordet og detektoren leser det derfra.")}

    {h2("Failure detection that runs at home", "Feildeteksjon som kjører hjemme")}
    {p("The detector is Obico, an open-source tool that watches camera frames for the tangles a failed print leaves. I run my own copy on the workstation, on its CPU, so no frame leaves the house. When it’s confident a print has failed, it pauses the printer. A paused printer then trips the watcher, which alerts me, and cancels and cools the printer down if it’s still paused after 30 minutes.",
       "Detektoren er Obico, et åpen kildekode-verktøy som ser etter flokene en mislykket print etterlater i kamerabildene. Jeg kjører min egen kopi på arbeidsstasjonen, på prosessoren, så ingen bilder forlater huset. Når den er sikker på at en print har feilet, setter den printeren på pause. En printer på pause utløser så overvåkeren, som varsler meg, og avbryter og kjøler ned printeren hvis den fortsatt står på pause etter 30 minutter.")}
    {p("It needs about 800 MB of memory, and the workstation didn’t have that to spare: it already holds two language models for Jarvis. Switching off the graphical desktop, which nobody used because the machine is only reached remotely, took free memory from 1.3 GB to about 3.8 GB.",
       "Den trenger rundt 800 MB minne, og det hadde ikke arbeidsstasjonen til overs: den har allerede to språkmodeller for Jarvis. Å skru av det grafiske skrivebordet, som ingen brukte fordi maskinen bare nås eksternt, tok ledig minne fra 1,3 GB til rundt 3,8 GB.")}

    {h2("Alerts that reach my phone", "Varsler som når telefonen min")}
    {p("An alert is only useful if it wakes me. The watcher now sends to ntfy, a notification server I also run myself. Failures go out as urgent, a finished print as an ordinary notice. To reach an iPhone, ntfy passes an empty wake-up through its public relay, and the phone then fetches the message itself from my server over my private network.",
       "Et varsel er bare nyttig hvis det vekker meg. Overvåkeren sender nå til ntfy, en varslingsserver jeg også kjører selv. Feil sendes som haster, en ferdig print som et vanlig varsel. For å nå en iPhone sender ntfy et tomt vekkesignal gjennom sin offentlige relé, og telefonen henter så selve meldingen fra serveren min over mitt private nettverk.")}
    {p("While I was at it, the rest of the lab got the same treatment. Uptime Kuma checks six services every minute, among them Jarvis, the voice transcription, the language models, the home automation and the Raspberry Pi, and tells my phone when one stops answering.",
       "Når jeg først holdt på, fikk resten av laben samme behandling. Uptime Kuma sjekker seks tjenester hvert minutt, blant dem Jarvis, taletranskripsjonen, språkmodellene, hjemmeautomasjonen og Raspberry Pi-en, og sier fra til telefonen min når en slutter å svare.")}

    {h2("Two bugs the watcher had all along", "To feil overvåkeren hadde hele tiden")}
    {p("A code review of the watcher turned up two problems that had never bitten. If a print was paused, resumed, then paused again, the 30-minute clock kept counting from the first pause, so the second pause could cancel the print almost at once. And it guessed whether a print had finished from how far along it got, so a print cancelled at 99% would have been reported as done. The clock now resets on every resume, and the printer’s own job history decides between finished and cancelled.",
       "En kodegjennomgang av overvåkeren avdekket to feil som aldri hadde slått til. Hvis en print ble satt på pause, startet igjen og så satt på pause på nytt, fortsatte 30-minuttersklokken å telle fra første pause, så den andre pausen kunne avbryte printen nesten med en gang. Og den gjettet om en print var ferdig ut fra hvor langt den kom, så en print avbrutt på 99 % ville blitt meldt som ferdig. Klokken nullstilles nå hver gang printen fortsetter, og printerens egen jobbhistorikk avgjør om den ble ferdig eller avbrutt.")}

    {h2("Not proven yet", "Ikke bevist ennå")}
    {p("None of this has watched a real print. The printer is waiting for its new print head, and the detector won’t even connect until the printer reports ready. When the head arrives, the first print will be short, with me watching, to see Obico follow it and stay quiet. Until it has done that, the old rule holds: no long prints left alone.",
       "Ingenting av dette har fulgt med på en ekte print. Printeren venter på det nye printerhodet, og detektoren kobler seg ikke engang til før printeren melder at den er klar. Når hodet kommer, blir første print kort, med meg ved siden av, for å se at Obico følger med og holder seg stille. Før den har gjort det, gjelder den gamle regelen: ingen lange printer uten tilsyn.")}

    {lesson("Adding a sensor isn’t the same as closing a blind spot. It’s closed when the sensor has caught the failure it was added for, or at least been seen watching a real run. Until then, keep acting as if it’s still open.",
            "Å legge til en sensor er ikke det samme som å tette en blindsone. Den er tettet når sensoren har fanget feilen den ble lagt til for, eller i det minste er sett følge med på en ekte kjøring. Inntil da: oppfør deg som om den fortsatt er åpen.")}
    <p class="more">{t('<a href="../builds/inmoov.html">The InMoov hand build →</a>', '<a href="../builds/inmoov.html">Byggingen av InMoov-hånden →</a>')}</p>
''',
    prev=("printing-the-hand.html", ("Printing the hand", "Å printe hånden")),
)


# ── Builds: J.A.R.V.I.S. ─────────────────────────────────────

DIAGRAM = '''
    <figure class="diagram" aria-labelledby="dg-cap">
      <svg viewBox="0 0 720 400" role="img" aria-labelledby="dg-title dg-desc">
        <title id="dg-title">How one request travels through J.A.R.V.I.S.</title>
        <desc id="dg-desc">A Raspberry Pi hears the wake word and records the request. A GPU workstation turns speech into text and a local language model chooses a tool. The permission ladder checks it before it reaches Home Assistant or the printer, and the reply is spoken back.</desc>
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0L10 5L0 10z"/></marker>
          <marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow hot" d="M0 0L10 5L0 10z"/></marker>
        </defs>

        <rect class="dg-zone" x="12" y="18" width="204" height="364" rx="10"/>
        <text class="dg-zone-label" x="28" y="40">RASPBERRY PI 4</text>
        <rect class="dg-zone" x="248" y="18" width="236" height="364" rx="10"/>
        <text class="dg-zone-label" x="264" y="40">GPU WORKSTATION</text>
        <text class="dg-zone-label" x="530" y="40">THE HOUSE</text>

        <rect class="dg-box" x="32" y="60" width="164" height="64" rx="6"/>
        <text class="dg-text" x="48" y="88">Wake word</text>
        <text class="dg-sub" x="48" y="108">OPENWAKEWORD · 80 MS</text>

        <rect class="dg-box" x="32" y="300" width="164" height="64" rx="6"/>
        <text class="dg-text" x="48" y="328">Speaker</text>
        <text class="dg-sub" x="48" y="348">SPOKEN REPLY</text>

        <rect class="dg-box" x="268" y="60" width="196" height="64" rx="6"/>
        <text class="dg-text" x="284" y="88">Speech to text</text>
        <text class="dg-sub" x="284" y="108">WHISPER LARGE-V3-TURBO</text>

        <rect class="dg-box" x="268" y="160" width="196" height="64" rx="6"/>
        <text class="dg-text" x="284" y="188">Local models</text>
        <text class="dg-sub" x="284" y="208">QWEN3 8B · 4B · OLLAMA</text>

        <rect class="dg-box hot" x="268" y="260" width="196" height="64" rx="6"/>
        <text class="dg-text" x="284" y="288">Permission ladder</text>
        <text class="dg-sub" x="284" y="308">READ · SAFE · CONFIRM</text>

        <rect class="dg-box" x="516" y="160" width="190" height="64" rx="6"/>
        <text class="dg-text" x="532" y="188">Home Assistant</text>
        <text class="dg-sub" x="532" y="208">LIGHTS · TV · HEATING</text>

        <rect class="dg-box" x="516" y="260" width="190" height="64" rx="6"/>
        <text class="dg-text" x="532" y="288">Klipper</text>
        <text class="dg-sub" x="532" y="308">THE 3D PRINTER</text>

        <path class="dg-line" d="M196 92 H262" marker-end="url(#ah)"/>
        <path class="dg-line" d="M366 124 V154" marker-end="url(#ah)"/>
        <path class="dg-line" d="M366 224 V254" marker-end="url(#ah)"/>
        <path class="dg-line hot" d="M464 292 H490 V192 H510" marker-end="url(#ahh)"/>
        <path class="dg-line hot" d="M464 292 H510" marker-end="url(#ahh)"/>
        <path class="dg-line" d="M268 300 H230 V332 H202" marker-end="url(#ah)"/>
      </svg>
      <figcaption class="mono" id="dg-cap"><span lang="en">One request, from wake word to action</span><span lang="nb">Én forespørsel, fra vekkeord til handling</span></figcaption>
    </figure>'''

JARVIS = page(
    "jarvis", "builds",
    ("J.A.R.V.I.S. — how it’s built", "J.A.R.V.I.S. — slik er den bygget"),
    "A local-first voice assistant on a Raspberry Pi and a GPU workstation: wake word, Whisper, local Qwen3 models, Home Assistant and Klipper, behind a permission ladder.",
    ("Builds", "Prosjekter", "builds"), ("Live", "Live"),
    ("A voice assistant that lives on my own hardware. You say its name, ask for something, and it acts — within limits it can’t argue its way past.",
     "En stemmeassistent som bor på min egen maskinvare. Du sier navnet, ber om noe, og den handler — innenfor grenser den ikke kan argumentere seg forbi."),
    f'''
    {figures([("Pi 4", "the ear and the dashboard", "øret og dashbordet"), ("2", "local language models", "lokale språkmodeller"),
              ("4", "permission levels", "tillatelsesnivåer"), ("500+", "automated tests", "automatiske tester")])}
{DIAGRAM}

    {h2("The path of one request", "Veien til én forespørsel")}
    <ol>
      <li>{t("A Raspberry Pi 4 listens for the wake word with openWakeWord. Until it hears it, nothing is recorded, stored or sent: audio is examined in memory 80 ms at a time and thrown away.",
             "En Raspberry Pi 4 lytter etter vekkeordet med openWakeWord. Før den hører det, blir ingenting tatt opp, lagret eller sendt: lyden undersøkes i minnet 80 ms om gangen og kastes.")}</li>
      <li>{t("After the wake word, the clip goes to Whisper on a GPU workstation and becomes text.",
             "Etter vekkeordet sendes klippet til Whisper på en GPU-arbeidsstasjon og blir til tekst.")}</li>
      <li>{t("A quick router decides whether it’s an action or a conversation. Actions go to Qwen3 8B, conversation to the faster Qwen3 4B, and both stay loaded on the GPU so neither has to wake up first.",
             "En rask ruter avgjør om det er en handling eller en samtale. Handlinger går til Qwen3 8B, samtale til den raskere Qwen3 4B, og begge holdes lastet på GPU-en så ingen av dem må vekkes først.")}</li>
      <li>{t('The model picks a tool, and the <a href="../log/permission-ladder.html">permission ladder</a> decides whether it may use it.',
             'Modellen velger et verktøy, og <a href="../log/permission-ladder.html">tillatelsesstigen</a> avgjør om den får bruke det.')}</li>
      <li>{t("The action reaches Home Assistant (lights, TV, heating) or Klipper (the printer), and the answer is spoken through a small speaker. After anything that leaves the TV on, Jarvis keeps quiet until it’s switched off.",
             "Handlingen når Home Assistant (lys, TV, varme) eller Klipper (printeren), og svaret leses opp gjennom en liten høyttaler. Etter noe som lar TV-en stå på, holder Jarvis seg stille til den er skrudd av.")}</li>
    </ol>

    {h2("The dashboard", "Dashbordet")}
    {p("A web console that’s only reachable over my private network. It shows a live health check for every subsystem, has controls for the house and the printer that go through the same gate as voice, a camera on the printer, and a memory view where anything Jarvis remembers can be read and deleted.",
       "En nettkonsoll som bare kan nås over mitt private nettverk. Den viser en sanntids helsesjekk for hvert delsystem, har kontroller for huset og printeren som går gjennom samme port som stemmen, et kamera på printeren, og en minnevisning der alt Jarvis husker kan leses og slettes.")}

    {h2("Privacy, plainly", "Personvern, rett frem")}
    {ul([("The microphone only acts on the wake word.", "Mikrofonen reagerer bare på vekkeordet."),
         ("The camera points at the printer and nothing else.", "Kameraet peker mot printeren og ingenting annet."),
         ("Speech-to-text and the language models run on my own machines.", "Tale-til-tekst og språkmodellene kjører på mine egne maskiner."),
         ("The honest exceptions: spoken replies use a hosted text-to-speech service, and a few devices only work through their maker’s cloud.",
          "De ærlige unntakene: talesvarene bruker en ekstern tekst-til-tale-tjeneste, og noen få enheter fungerer bare via produsentens sky.")])}

    {h2("Stack", "Teknologi")}
    <p class="mono tags">Python · Flask · gunicorn · SQLite · openWakeWord · Whisper · Ollama · Qwen3 · Home Assistant · Klipper · Moonraker · Tailscale · Playwright</p>
    {t("Psst: press <kbd>/</kbd> and say hello.", "Psst: trykk <kbd>/</kbd> og si hei.", tag="p", cls="mono lab-note psst")}
''',
    nxt=("inmoov.html", ("InMoov hand", "InMoov-hånden")),
)


# ── Builds: InMoov ───────────────────────────────────────────

def slider(key, en, no, lo=0, hi=180):
    return f'''<label class="hand-slider"><span class="mono">{t(en, no)}</span>
            <input type="range" min="{lo}" max="{hi}" step="1" value="0" data-joint="{key}" />
            <output class="mono" data-readout="{key}">0°</output></label>'''


HAND = f'''
    <section class="lab-demo" id="hand" aria-labelledby="hand-title">
      <h2 id="hand-title">{ico("hand-finger")}{t("Move the hand", "Beveg hånden")}</h2>
      {p("Each finger is one servo pulling a line that runs through all three joints, so one pull curls the whole finger. That’s why one slider per finger is enough. The slider is the servo’s angle: watch its pulley turn in the forearm. Drag the hand to look around it.",
         "Hver finger er én servo som drar i en snor gjennom alle tre leddene, så ett drag krummer hele fingeren. Derfor holder det med én glider per finger. Glideren er servoens vinkel: se trinsa snu seg i underarmen. Dra i hånden for å se den fra andre vinkler.")}
      <div class="hand-wrap">
        <div class="hand-stage">
          <canvas class="hand-canvas" tabindex="0" aria-label="3D view of the hand. Drag or use the arrow keys to look around it."></canvas>
          {t("This browser can’t show 3D.", "Denne nettleseren kan ikke vise 3D.", tag="p", cls="viewer-msg hand-fallback mono")}
        </div>
        <div class="hand-controls">
          {slider("thumb", "Thumb", "Tommel")}
          {slider("index", "Index", "Pekefinger")}
          {slider("middle", "Middle", "Langfinger")}
          {slider("ring", "Ring", "Ringfinger")}
          {slider("little", "Little", "Lillefinger")}
          {slider("wrist", "Wrist", "Håndledd", -90, 90)}
          <div class="hand-poses" role="group" aria-label="Poses">
            <button type="button" class="btn btn-secondary" data-pose="open">{t("Open", "Åpen")}</button>
            <button type="button" class="btn btn-secondary" data-pose="fist">{t("Fist", "Knyttneve")}</button>
            <button type="button" class="btn btn-secondary" data-pose="point">{t("Point", "Pek")}</button>
            <button type="button" class="btn btn-secondary" data-pose="peace">{t("Peace", "Fred")}</button>
            <button type="button" class="btn btn-secondary" data-pose="rock">Rock</button>
            <button type="button" class="btn btn-secondary" data-pose="count">{ico("player-play")}{t("Count", "Tell")}</button>
          </div>
        </div>
      </div>
      {t("A model of how it works, not of every part — and not yet connected to the real hand. Each finger has two lines on one pulley: the palm-side line winds on and turns blue while you drive it, the back line pays out.",
         "En modell av hvordan den virker, ikke av hver del — og ennå ikke koblet til den ekte hånden. Hver finger har to snorer på én trinse: snora på håndflatesiden vikles inn og blir blå mens du styrer den, snora på baksiden gis ut.", tag="p", cls="mono lab-note")}
    </section>'''

PARTS = f'''
    <figure class="part-viewer" id="parts" data-src="../parts/" aria-labelledby="parts-cap">
      <div class="viewer-stage">
        <canvas tabindex="0" aria-label="3D view of the selected part. Drag or use the arrow keys to turn it."></canvas>
        {t("This browser can’t show 3D.", "Denne nettleseren kan ikke vise 3D.", tag="p", cls="viewer-msg viewer-fallback mono")}
        {t("The part didn’t load.", "Delen ble ikke lastet.", tag="p", cls="viewer-msg viewer-error mono")}
      </div>
      <div class="viewer-bar">
        <div class="viewer-parts" role="group" aria-label="Part">
          <button type="button" class="btn btn-secondary" data-part="little-finger" aria-pressed="true">{t("Little finger", "Lillefinger")}</button>
          <button type="button" class="btn btn-secondary" data-part="index-finger" aria-pressed="false">{t("Index finger", "Pekefinger")}</button>
          <button type="button" class="btn btn-secondary" data-part="thumb" aria-pressed="false">{t("Thumb", "Tommel")}</button>
          <button type="button" class="btn btn-secondary" data-part="wrist" aria-pressed="false">{t("Wrist", "Håndledd")}</button>
          <button type="button" class="btn btn-secondary" data-part="forearm" aria-pressed="false">{t("Forearm", "Underarm")}</button>
        </div>
        <span class="viewer-dims mono"></span>
      </div>
      <figcaption class="mono" id="parts-cap">{ico("rotate-360")}{t("Drag to turn. The actual files I sliced — InMoov by Gaël Langevin, CC BY-NC.",
        "Dra for å snu. De faktiske filene jeg slicet — InMoov av Gaël Langevin, CC BY-NC.")}</figcaption>
    </figure>'''

INMOOV = page(
    "inmoov", "builds",
    ("InMoov hand — the build", "InMoov-hånden — byggingen"),
    "Building the right hand and forearm of InMoov, the open-source 3D-printable robot: electronics, a 59-hour print plan, and voice control through J.A.R.V.I.S.",
    ("Builds", "Prosjekter", "builds"), ("In progress", "Pågår"),
    ("The right hand and forearm of InMoov, Gaël Langevin’s open-source, life-size 3D-printable robot — built with my own electronics and, eventually, moved by voice through J.A.R.V.I.S.",
     "Høyre hånd og underarm på InMoov, Gaël Langevins åpne, 3D-printbare robot i full størrelse — bygget med min egen elektronikk og, etter hvert, styrt med stemmen via J.A.R.V.I.S."),
    f'''
    <p class="mono now-sub stages" id="inmoov-stages">
      <span class="stage done" data-stage="electronics">{t("Electronics", "Elektronikk")}<span class="sr-only">{t(" (done)", " (ferdig)")}</span></span>
      <span class="stage-arrow" aria-hidden="true">→</span>
      <span class="stage next" data-stage="print">Print<span class="sr-only">{t(" (next)", " (neste)")}</span></span>
      <span class="stage-arrow" aria-hidden="true">→</span>
      <span class="stage" data-stage="assemble">{t("Assemble", "Montering")}<span class="sr-only"></span></span>
      <span class="stage-arrow" aria-hidden="true">→</span>
      <span class="stage" data-stage="code">{t("Code", "Kode")}<span class="sr-only"></span></span>
    </p>

    {figures([("17", "printed parts", "printede deler"), ("~59 h", "of printing", "med printing"),
              ("~526 g", "of filament", "filament"), ("7", "servos", "servoer")])}
{HAND}

    {h2("Electronics — done", "Elektronikk — ferdig")}
    {table([("Part", "Del"), ("Role", "Rolle"), ("Status", "Status")],
           [("Arduino Nano Matter", ("The controller", "Kontrolleren"), ("Headers soldered", "Pinner loddet")),
            ("Adafruit PCA9685", ("16-channel servo driver over I²C", "16-kanals servodriver over I²C"), ("Soldered, with a 470 µF capacitor", "Loddet, med en 470 µF kondensator")),
            ("6 × MG90S", ("The fingers", "Fingrene"), ("Wired", "Koblet")),
            ("1 × MG996R", ("The wrist", "Håndleddet"), ("Ready", "Klar")),
            ("FSR400", ("Fingertip force sensing", "Måling av kraft i fingertuppene"), ("Planned", "Planlagt")),
            (("Bench power supply", "Labstrømforsyning"), ("Clean, adjustable servo power", "Ren, justerbar strøm til servoene"), ("Ready", "Klar"))])}

    {h2("Printing — the hand is done", "Printing — hånden er ferdig")}
    {p("Every part of the hand is printed: all five fingers, the thumb, both wrist pieces, the finger covers, and the bolts and clips. The forearm shells and the back-of-hand covers are next, once the printer has a new print head. The fingers print with no support at all, because support in their slots and tendon channels can’t be removed; the finger covers are the only part that still needs it.",
       "Alle delene til hånden er printet: alle fem fingrene, tommelen, begge håndleddsdelene, fingerdekslene, og boltene og klipsene. Underarmsskallene og dekslene til baksiden av hånden kommer etterpå, når printeren har fått et nytt printerhode. Fingrene printes helt uten støtte, fordi støtte i sporene og senekanalene ikke kan fjernes; fingerdekslene er den eneste delen som fortsatt trenger det.")}
    {table([("Stage", "Steg"), ("Parts", "Deler"), ("Status", "Status")],
           [(("1 · Fingers", "1 · Fingre"), ("All five fingers and the thumb", "Alle fem fingrene og tommelen"), ("Printed", "Printet")),
            (("2 · Wrist", "2 · Håndledd"), ("Wrist, small and large", "Håndledd, lite og stort"), ("Printed", "Printet")),
            (("3 · Covers", "3 · Deksler"), ("Finger covers", "Fingerdeksler"), ("Printed", "Printet")),
            (("4 · Hardware", "4 · Maskinvare"), ("Bolts and clips", "Bolter og klips"), ("Printed", "Printet")),
            (("5 · Forearm", "5 · Underarm"), ("Four forearm shells and the cap", "Fire underarmsskall og lokket"), ("Waiting for the printer", "Venter på printeren")),
            (("6 · Covers", "6 · Deksler"), ("Back of the hand, two pieces", "Baksiden av hånden, to deler"), ("Waiting for the printer", "Venter på printeren"))])}
{PARTS}
    <p class="more">{t('<a href="../log/printing-the-hand.html">How the printing went, and the night it ate the print head →</a>', '<a href="../log/printing-the-hand.html">Hvordan printingen gikk, og natten den spiste printerhodet →</a>')}</p>

    {h2("Then: assembly, code, voice", "Deretter: montering, kode, stemme")}
    {p("Assembly has started: the finger segments are glued, and the hinge pins will be 3 mm brass rod. Next come the braided tendons, two per finger, then the servo control code, then a J.A.R.V.I.S. tool so the hand can be moved by voice — behind the same permission ladder as everything else in the house.",
       "Monteringen er i gang: fingersegmentene er limt, og hengselpinnene blir 3 mm messingstang. Så kommer de flettede senene, to per finger, så styringskoden for servoene, så et J.A.R.V.I.S.-verktøy slik at hånden kan beveges med stemmen — bak den samme tillatelsesstigen som alt annet i huset.")}
''',
    prev=("jarvis.html", ("J.A.R.V.I.S.", "J.A.R.V.I.S.")),
    scripts=("hand.js", "viewer.js"),
)


# ── Follow the log ───────────────────────────────────────────
# The RSS link lands here, not on feed.xml: a browser shows a raw feed as
# a wall of text. Feed readers find feed.xml from the <link> in every head.

FEED = "https://oscarns.com/feed.xml"

FOLLOW = page(
    "follow", "log",
    ("Follow the log", "Følg loggen"),
    "Get new log entries in a feed reader: no account, no mailing list, no tracking.",
    ("Log", "Logg", "log"), ("RSS", "RSS"),
    ("New entries in the log, in whatever app you read feeds with. No account, no mailing list, nothing tracked.",
     "Nye innlegg i loggen, i den appen du leser feeder med. Ingen konto, ingen e-postliste, ingenting som spores."),
    f'''
    {h2("Paste this into a feed reader", "Lim inn dette i en feedleser")}
    <div class="feed-copy">
      <code class="feed-url">{FEED}</code>
      <button type="button" class="btn btn-secondary" data-copy="{FEED}">{t("Copy", "Kopier")}</button>
    </div>
    {p("No reader yet? NetNewsWire is free on Mac and iPhone; Feedly and Inoreader work in any browser. Add the address above and new entries turn up there on their own.",
       "Ingen leser ennå? NetNewsWire er gratis på Mac og iPhone; Feedly og Inoreader fungerer i alle nettlesere. Legg til adressen over, så dukker nye innlegg opp der av seg selv.")}

    {h2("What’s in it so far", "Hva som er der så langt")}
    <ul class="feed-list">
      <li><a href="closing-the-blind-spot.html">{t("Closing the blind spot", "Å tette blindsonen")}</a> <span class="mono">11.2026</span></li>
      <li><a href="printing-the-hand.html">{t("Printing a robot hand, and the night it ate the print head", "Å printe en robothånd, og natten den spiste printerhodet")}</a> <span class="mono">11.2026</span></li>
      <li><a href="permission-ladder.html">{t("A voice assistant that can’t do more than it’s allowed to", "En stemmeassistent som ikke kan gjøre mer enn den har lov til")}</a> <span class="mono">10.2026</span></li>
      <li><a href="zero-support-roofs.html">{t("Zero support roofs: why a nine-hour print failed", "Null støttetak: hvorfor en ni timers print feilet")}</a> <span class="mono">09.2026</span></li>
      <li><a href="levelling-the-bed.html">{t("Levelling a 420 mm bed by measurement", "Nivellering av en 420 mm printeplate etter mål")}</a> <span class="mono">09.2026</span></li>
    </ul>
    {t("The feed is in English; the site is in both.", "Feeden er på engelsk; siden er på begge språk.", tag="p", cls="mono lab-note")}
''',
)


# ── 404 ──────────────────────────────────────────────────────

def lost():
    h = head("Page not found — Oscar Skjævestad", "This page isn’t in the notebook.", "/404.html", "/").replace('content="index, follow"', 'content="noindex"')
    return h + nav("/") + f'''
<main id="main">
  <section class="lost" id="top">
    <div class="wrap">
      <p class="mono lost-code">404</p>
      <h1>{t("Not in the notebook", "Står ikke i notatboken")}</h1>
      {t("This page doesn’t exist — it may have moved, or never been written.", "Denne siden finnes ikke — den kan ha flyttet, eller aldri blitt skrevet.", tag="p", cls="lead")}
      <div class="actions">
        <a class="btn btn-primary" href="/">{t("Back to the start", "Tilbake til start")}</a>
        <span class="mono">{t("or press <kbd>/</kbd> to search", "eller trykk <kbd>/</kbd> for å søke")}</span>
      </div>
    </div>
  </section>
</main>
''' + footer("/")
