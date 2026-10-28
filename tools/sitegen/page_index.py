from parts import head, nav, footer, ico, icon, t

R = ""  # the homepage sits at the root


def ul(items):
    return '<ul class="entry-list">' + "".join(f"<li>{t(en, no)}</li>" for en, no in items) + "</ul>"


def tags(pairs):
    en = " · ".join(e for e, n in pairs)
    no = " · ".join(n for e, n in pairs)
    return t(en, no, tag="p", cls="mono tags")


USED = {
 "Humanoid robot deployment": "work-wybe", "GPU training fleets": "work-wybe", "NVIDIA Jetson Thor": "work-wybe",
 "Grace Blackwell": "work-wybe", "VLA models": "work-wybe", "GR00T": "work-wybe", "LeRobot": "work-wybe",
 "MuJoCo": "work-wybe", "VR teleoperation": "work-wybe", "Robot data pipelines": "work-wybe",
 "Edge inference": "work-wybe", "Local LLMs": "build-jarvis",
 "Microsoft 365": "work-1x", "Entra ID / Azure AD": "work-1x", "Microsoft Intune": "work-1x",
 "Microsoft Defender": "work-1x", "Azure": "work-1x", "Google Workspace": "work-1x", "Okta": "work-1x",
 "Network infrastructure": "work-wybe work-1x build-network", "Cybersecurity": "work-1x cert-cisco cert-nsm",
 "Aruba Networks": "work-1x", "Palo Alto NGFW": "work-data", "Extreme Networks": "work-data", "IAM": "work-1x",
 "Hardware repair": "edu-electronics", "Electronics": "edu-electronics build-mixer build-drone build-satellite build-inmoov",
 "Soldering": "edu-electronics build-mixer build-inmoov", "Raspberry Pi": "build-jarvis build-satellite",
 "Component-level repair": "edu-electronics",
 "Jira": "work-1x work-data", "Confluence": "work-1x work-data", "Windows Server": "work-data",
 "Kubernetes": "work-data", "SaltStack": "work-data", "HTML": "",
}


def skills(pairs):
    out = []
    for en, no in pairs:
        out.append(f'<button class="skill" type="button" aria-pressed="false" data-in="{USED[en.replace("&amp;", "&")]}">{t(en, no)}</button>')
    return '<p class="mono tags">' + " · ".join(out) + "</p>"


def skill_row(icon_name, en, no, items, now=False):
    gutter = f'<span class="mono status-current">{t("Now", "Nå")}</span>' if now else ""
    return f'''
        <div class="entry skill-row">
          <div class="entry-gutter">{gutter}</div>
          <div class="entry-body">
            <h3 class="entry-title">{ico(icon_name)}<span>{t(en, no)}</span></h3>
            {skills(items)}
          </div>
        </div>'''


def build():
    h = head(
        "Oscar Skjævestad — IT &amp; Robot Deployment Lead",
        "Oscar Skjævestad — Team Lead for IT &amp; Robot Deployment at Wybe Robotics in Moss, Norway. Humanoid robot deployment, GPU training infrastructure and enterprise IT.",
        "/", R,
        og_desc="Deploying humanoid robots and building the AI infrastructure that teaches them their jobs. Based in Moss, Norway.",
    ).replace('<meta name="author"', '<meta name="keywords" content="Oscar Skjævestad, Robot Deployment, Humanoid Robots, AI Infrastructure, Robotics, IT Infrastructure, IT Technician, Moss, Norway" />\n  <meta name="author"', 1)

    body = f'''{nav(R, home=True)}
<main id="main">

  <!-- ── Intro ── -->
  <section class="intro" id="top">
    <div class="wrap">
      <h1 class="write" style="--line: 0">Oscar Skjævestad</h1>
      {t("Team lead for IT and robot deployment at Wybe Robotics. I deploy humanoid robots, run the GPU fleet that trains them, and build the data pipeline that teaches them their jobs.",
         "Teamleder for IT og robotutrulling i Wybe Robotics. Jeg setter humanoide roboter i drift, driver GPU-flåten som trener dem, og bygger datapipelinen som lærer dem jobben sin.",
         tag="p", cls="lead settle\" style=\"--line: 1")}

      <p class="print-only print-contact mono">Oscarskjaevestad@gmail.com · linkedin.com/in/oscar-skjaevestad · oscarns.com</p>

      <div class="intro-meta">
        {t("Moss, Norway · At Wybe Robotics since 06.2026", "Moss · I Wybe Robotics siden 06.2026", tag="p", cls="mono write\" style=\"--line: 3")}
        {t("IT &amp; robot deployment lead / AI infrastructure / IT technician / infrastructure engineer / systems administrator / computer electronics tech / home lab builder",
           "Leder for IT og robotutrulling / AI-infrastruktur / IT-tekniker / infrastrukturingeniør / systemadministrator / dataelektroniker / hjemmelab-bygger",
           tag="p", cls="mono roles settle\" style=\"--line: 4")}
      </div>

      <div class="now settle" style="--line: 5" aria-labelledby="now-title">
        <div class="now-head">
          <p class="mono now-title" id="now-title">{t("Now", "Nå")}</p>
          <p class="mono now-live"><span class="live-dot" aria-hidden="true"></span>Live · Moss <time id="moss-time">—</time></p>
        </div>
        <ul class="now-list">
          <li class="now-item">
            <span class="now-icon">{icon("robot")}</span>
            <div>
              <p class="now-what">{t("Deploying humanoid robots", "Setter humanoide roboter i drift")}</p>
              <p class="mono now-sub"><a href="#work-wybe">Wybe Robotics</a> · {t("since 06.2026", "siden 06.2026")}</p>
            </div>
          </li>
          <li class="now-item">
            <span class="now-icon">{icon("hand-stop")}</span>
            <div>
              <p class="now-what">{t('Building the <a href="#build-inmoov">InMoov robotic hand</a>', 'Bygger <a href="#build-inmoov">InMoov-robothånden</a>')}</p>
              <p class="mono now-sub stages" id="inmoov-stages">
                <span class="stage done" data-stage="electronics">{t("Electronics", "Elektronikk")}<span class="sr-only">{t(" (done)", " (ferdig)")}</span></span>
                <span class="stage-arrow" aria-hidden="true">→</span>
                <span class="stage next" data-stage="print">Print<span class="sr-only">{t(" (next)", " (neste)")}</span></span>
                <span class="stage-arrow" aria-hidden="true">→</span>
                <span class="stage" data-stage="assemble">{t("Assemble", "Montering")}<span class="sr-only"></span></span>
                <span class="stage-arrow" aria-hidden="true">→</span>
                <span class="stage" data-stage="code">{t("Code", "Kode")}<span class="sr-only"></span></span>
              </p>
            </div>
          </li>
          <li class="now-item">
            <span class="now-icon">{icon("microphone")}</span>
            <div>
              <p class="now-what">{t('Running <a href="#build-jarvis">J.A.R.V.I.S.</a> at home', 'Kjører <a href="#build-jarvis">J.A.R.V.I.S.</a> hjemme')}</p>
              <p class="mono now-sub" id="jarvis-status">{t("Live · local voice assistant · 500+ tests", "Live · lokal stemmeassistent · 500+ tester")}</p>
            </div>
          </li>
        </ul>
        <p class="mono now-updated" id="now-updated" hidden></p>
      </div>

      <div class="actions settle" style="--line: 6">
        <a class="btn btn-primary" href="oscar-cv.pdf" lang="en">Download CV</a><a class="btn btn-primary" href="oscar-cv-no.pdf" lang="nb">Last ned CV</a>
        <a class="quiet" href="mailto:Oscarskjaevestad@gmail.com">{t("Email →", "E-post →")}</a>
        <a class="quiet" href="https://linkedin.com/in/oscar-skjaevestad" target="_blank" rel="noopener">LinkedIn →</a>
      </div>
    </div>
  </section>

  <!-- ── About ── -->
  <section class="section" id="about" aria-labelledby="about-title">
    <div class="wrap">
      <h2 id="about-title">{ico("user")}{t("About", "Om meg")}</h2>
      <div class="prose">
        {t("I'm a computer electronics technician by trade, with a passion for <strong>IT that actually scales</strong>. Before Wybe, I spent over two years running enterprise IT at a fast-growing robotics company, across offices and production sites in Norway and the United States.",
           "Jeg er dataelektroniker av fag, med en lidenskap for <strong>IT som faktisk skalerer</strong>. Før Wybe drev jeg i over to år enterprise-IT i et robotselskap i sterk vekst, på tvers av kontorer og produksjonsanlegg i Norge og USA.", tag="p")}
        {t("My background runs from hands-on hardware and soldering to cloud identity, endpoint security and cross-timezone operations — and now to robot fleets and the GPUs that train them. At home I keep building: a local voice assistant, a robotic hand, a drone.",
           "Bakgrunnen min spenner fra praktisk maskinvare og lodding til skyidentitet, endepunktsikkerhet og drift på tvers av tidssoner — og nå robotflåter og GPU-ene som trener dem. Hjemme fortsetter jeg å bygge: en lokal stemmeassistent, en robothånd, en drone.", tag="p")}
      </div>
    </div>
  </section>

  <!-- ── Work ── -->
  <section class="section shade" id="work" aria-labelledby="work-title">
    <div class="wrap">
      <h2 id="work-title">{ico("briefcase")}{t("Work", "Arbeidserfaring")}</h2>
      <div class="entries timeline">

        <article class="entry featured" id="work-wybe">
          <span class="tl here" aria-hidden="true"></span>
          <div class="entry-gutter">
            <span class="mono">06.2026 — {t("now", "nå")}</span>
            <span class="mono status-current">{t("Current", "Nåværende")}</span>
          </div>
          <div class="entry-body">
            <h3 class="entry-title">Team Lead — IT &amp; Robot Deployment</h3>
            <p class="mono entry-meta">Wybe Robotics AS · {t("Moss, Norway", "Moss, Norge")}</p>
            {t("Leading IT and robot deployment at a company that puts humanoid robots to work, and building the AI infrastructure that teaches them their jobs. The work spans the full chain from hardware to learned behaviour: deploying and operating the robots, running the GPU training fleet, and building the data engine behind our robot learning.",
               "Leder IT og robotutrulling i et selskap som setter humanoide roboter i arbeid, og bygger AI-infrastrukturen som lærer dem jobbene sine. Arbeidet dekker hele kjeden fra maskinvare til lært atferd: utrulling og drift av robotene, drift av GPU-flåten for trening, og bygging av datamotoren bak robotlæringen vår.", tag="p")}
            {t("Responsibilities", "Ansvarsområder", tag="p", cls="mono entry-label")}
            {ul([("Deploying and operating humanoid robots", "Utrulling og drift av humanoide roboter"),
                 ("GPU training fleet — NVIDIA Jetson Thor and Grace Blackwell workstations", "GPU-flåte for trening — NVIDIA Jetson Thor og Grace Blackwell-arbeidsstasjoner"),
                 ("Robot networking, edge inference deployment and NAS-backed data systems", "Robotnettverk, utrulling av edge-inferens og NAS-baserte datasystemer"),
                 ("Company-wide IT infrastructure", "IT-infrastruktur for hele selskapet"),
                 ("Procurement and front-office operations", "Innkjøp og frontoffice-oppgaver")])}
            {t("Key contributions", "Viktige bidrag", tag="p", cls="mono entry-label")}
            {ul([("Designed and shipped an end-to-end VR data-collection → training → evaluation loop that took our manipulation policies from zero to demonstrable pick-and-lift within days",
                  "Designet og leverte en komplett løkke for VR-datainnsamling → trening → evaluering som tok manipulasjonspolicyene våre fra null til demonstrerbar plukk-og-løft på få dager"),
                 ("Built a self-service data pipeline: operators collect demonstrations in VR-teleoperated simulation, review and grade the data, and ship it straight into training of vision-language-action models",
                  "Bygde en selvbetjent datapipeline: operatører samler demonstrasjoner i VR-fjernstyrt simulering, går gjennom og vurderer dataene, og sender dem rett inn i trening av vision-language-action-modeller"),
                 ("Built the team's training console — live fleet monitoring, data quality gates and one-click dataset-to-model pipelines across distributed GPU machines",
                  "Bygde teamets treningskonsoll — sanntidsovervåking av flåten, kvalitetsporter for data og ett-klikks pipelines fra datasett til modell på tvers av distribuerte GPU-maskiner")])}
            <p class="mono tags">NVIDIA Jetson Thor · Grace Blackwell · GR00T · LeRobot · MuJoCo · Meta Quest 3 · VLA models · Edge inference · NAS</p>
          </div>
        </article>

        <article class="entry" id="work-1x">
          <span class="tl" aria-hidden="true"></span>
          <div class="entry-gutter">
            <span class="mono">02.2024 — 05.2026</span>
          </div>
          <div class="entry-body">
            <h3 class="entry-title">IT Technician — IT Operations &amp; Infrastructure</h3>
            <p class="mono entry-meta">1X Technologies AS · {t("Moss, Norway", "Moss, Norge")}</p>
            {t("Supported global IT operations and infrastructure at an internationally growing robotics company. Involved in designing, implementing, and operating enterprise-grade IT environments across Norway and the USA — covering both office and production environments.",
               "Støttet global IT-drift og infrastruktur i et internasjonalt robotselskap i sterk vekst. Deltok i design, implementering og drift av IT-miljøer på enterprise-nivå i Norge og USA — både kontor- og produksjonsmiljøer.", tag="p")}
            {t("Responsibilities", "Ansvarsområder", tag="p", cls="mono entry-label")}
            {ul([("Identity &amp; Access Management (IAM)", "Identitets- og tilgangsstyring (IAM)"),
                 ("Endpoint management and security", "Endepunktsadministrasjon og sikkerhet"),
                 ("Network infrastructure", "Nettverksinfrastruktur"),
                 ("Large-scale onboarding &amp; offboarding", "Onboarding og offboarding i stor skala"),
                 ("Operational IT support across time zones", "Operativ IT-støtte på tvers av tidssoner")])}
            {t("Key contributions", "Viktige bidrag", tag="p", cls="mono entry-label")}
            {ul([("Key role in establishing and scaling offices and production facilities in the USA", "Sentral rolle i etablering og skalering av kontorer og produksjonsanlegg i USA"),
                 ("Contributed to transition and handover of IT operations as the organisation grew", "Bidro til overgang og overlevering av IT-drift i takt med organisasjonens vekst")])}
            <p class="mono tags">Google Workspace · Microsoft 365 · Intune · Entra ID / Azure AD · Azure · Defender · Okta · Aruba Networks · Jira · Confluence</p>
          </div>
        </article>

        <article class="entry" id="work-bama">
          <span class="tl" aria-hidden="true"></span>
          <div class="entry-gutter">
            <span class="mono">03.2023 — 02.2024</span>
          </div>
          <div class="entry-body">
            <h3 class="entry-title">{t("On-Call Factory Operative", "Tilkallingsvikar, produksjon")}</h3>
            <p class="mono entry-meta">Bama Industri AS · {t("Moss, Norway", "Moss, Norge")}</p>
            {t("Temporary and on-call position in the operations department while completing supplementary general studies certification. Responsible for product packing and raw material preparation for production.",
               "Midlertidig stilling og tilkallingsvikar i operativ avdeling mens jeg tok påbygg til studiekompetanse. Ansvar for pakking av produkter og klargjøring av råvarer til produksjon.", tag="p")}
          </div>
        </article>

        <article class="entry" id="work-data">
          <span class="tl" aria-hidden="true"></span>
          <div class="entry-gutter">
            <span class="mono">08.2022 — 02.2023</span>
          </div>
          <div class="entry-body">
            <h3 class="entry-title">{t("IT Consultant", "IT-konsulent")}</h3>
            <p class="mono entry-meta">Data Equipment AS · {t("Oslo, Norway", "Oslo, Norge")}</p>
            {t("Internal IT support role — assisting employees with technical issues and contributing to infrastructure operations. Gained hands-on experience with server environments and enterprise networking.",
               "Intern IT-support — hjalp ansatte med tekniske problemer og bidro i infrastrukturdriften. Fikk praktisk erfaring med servermiljøer og enterprise-nettverk.", tag="p")}
            {ul([("Internal IT support for staff", "Intern IT-support for ansatte"),
                 ("Windows Server 2012 &amp; 2019 administration", "Administrasjon av Windows Server 2012 og 2019")])}
            <p class="mono tags">Windows Server · Kubernetes · SaltStack · Jira · Confluence · Palo Alto NGFW · Extreme Networks</p>
          </div>
        </article>

      </div>
    </div>
  </section>

  <!-- ── Builds ── -->
  <section class="section" id="builds" aria-labelledby="builds-title">
    <div class="wrap">
      <h2 id="builds-title">{ico("hammer")}{t("Builds", "Prosjekter")}</h2>
      {t("Outside of work, I build things — hardware, electronics and systems that push past the day job.",
         "Utenom jobben bygger jeg ting — maskinvare, elektronikk og systemer som strekker seg lenger enn dagjobben.", tag="p", cls="section-intro")}
      <div class="entries">

        <article class="entry featured" id="build-jarvis">
          <div class="entry-gutter"><span class="mono status-live">Live</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("microphone")}<span>{t("J.A.R.V.I.S. — local-first voice assistant", "J.A.R.V.I.S. — lokal stemmeassistent")}</span></h3>
            {t("A voice assistant running on my own hardware: wake-word detection on a Raspberry Pi, local speech-to-text, and local language models on a GPU workstation. It controls the lights, TV, heating and my 3D printer through Home Assistant and Klipper, behind a permission ladder where anything physical needs a person to confirm. Backed by 500+ automated tests.",
               "En stemmeassistent som kjører på min egen maskinvare: vekkeord på en Raspberry Pi, lokal tale-til-tekst og lokale språkmodeller på en GPU-arbeidsstasjon. Den styrer lys, TV, varme og 3D-printeren min via Home Assistant og Klipper, bak en tillatelsesstige der alt fysisk krever at et menneske bekrefter. Sikret av over 500 automatiske tester.", tag="p")}
            {tags([("Python", "Python"), ("Local LLMs", "Lokale LLM-er"), ("Home Assistant", "Home Assistant"), ("Raspberry Pi", "Raspberry Pi")])}
            <p class="more">{t('<a href="builds/jarvis.html">How it’s built →</a>', '<a href="builds/jarvis.html">Slik er den bygget →</a>')}</p>
          </div>
        </article>

        <article class="entry" id="build-inmoov">
          <div class="entry-gutter"><span class="mono status-wip">{t("In progress", "Pågår")}</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("hand-stop")}<span>{t("InMoov robotic hand", "InMoov-robothånd")}</span></h3>
            {t("Building the right hand and forearm of InMoov, the open-source 3D-printable humanoid robot. The electronics are soldered and wired: an Arduino Nano Matter drives a PCA9685 servo board with seven servos. All 17 parts are sliced and ready to print. Next come assembly, the control code, and voice control through J.A.R.V.I.S.",
               "Bygger høyre hånd og underarm på InMoov, den åpne 3D-printbare humanoide roboten. Elektronikken er loddet og koblet: en Arduino Nano Matter styrer et PCA9685-servokort med sju servoer. Alle 17 deler er slicet og klare til print. Neste steg er montering, styringskode og stemmestyring via J.A.R.V.I.S.", tag="p")}
            {tags([("Robotics", "Robotikk"), ("3D printing", "3D-printing"), ("Arduino", "Arduino"), ("Embedded systems", "Innebygde systemer")])}
            <p class="more">{t('<a href="builds/inmoov.html">Follow the build →</a>', '<a href="builds/inmoov.html">Følg byggingen →</a>')}</p>
          </div>
        </article>

        <article class="entry" id="build-mixer">
          <div class="entry-gutter"><span class="mono status-done">{t("Completed", "Fullført")}</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("adjustments-horizontal")}<span>{t("Custom audio mixer", "Egenbygd lydmikser")}</span></h3>
            {t("Designed and built a custom audio mixing board from scratch — including PCB layout, component soldering, and signal routing. Combines analog audio engineering with hands-on electronics fabrication.",
               "Designet og bygde en lydmikser fra bunnen av — med kretskortutlegg, lodding av komponenter og signalføring. Kombinerer analog lydteknikk med praktisk elektronikkproduksjon.", tag="p")}
            {tags([("Electronics", "Elektronikk"), ("Soldering", "Lodding"), ("PCB design", "Kretskortdesign"), ("Analog audio", "Analog lyd")])}
          </div>
        </article>

        <article class="entry" id="build-drone">
          <div class="entry-gutter"><span class="mono status-done">{t("Completed", "Fullført")}</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("drone")}<span>{t("Custom-built drone", "Egenbygd drone")}</span></h3>
            {t("Assembled and configured a drone from individual components — frame, motors, ESCs, flight controller, and firmware. Covers everything from hardware integration to tuning PID parameters for stable flight.",
               "Satte sammen og konfigurerte en drone fra enkeltkomponenter — ramme, motorer, ESC-er, flykontroller og fastvare. Dekker alt fra maskinvareintegrasjon til tuning av PID-parametere for stabil flyging.", tag="p")}
            {tags([("Hardware assembly", "Maskinvaremontering"), ("Flight controller", "Flykontroller"), ("Firmware", "Fastvare"), ("Electronics", "Elektronikk")])}
          </div>
        </article>

        <article class="entry" id="build-satellite">
          <div class="entry-gutter"><span class="mono status-wip">{t("In progress", "Pågår")}</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("satellite")}<span>{t("Desk satellite", "Skrivebordssatellitt")}</span></h3>
            {t("Currently building a desk-mounted satellite unit — a custom embedded device combining display, sensors, and connectivity into a compact always-on information hub for the workspace.",
               "Bygger en skrivebordsmontert satellittenhet — en egendesignet innebygd enhet som samler skjerm, sensorer og tilkobling i en kompakt, alltid-på informasjonshub for arbeidsplassen.", tag="p")}
            {tags([("Embedded systems", "Innebygde systemer"), ("Raspberry Pi", "Raspberry Pi"), ("Electronics", "Elektronikk"), ("Fabrication", "Produksjon")])}
          </div>
        </article>

        <article class="entry" id="build-network">
          <div class="entry-gutter"><span class="mono status-planned">{t("Planned", "Planlagt")}</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("network")}<span>{t("Home network lab", "Hjemmenettverkslab")}</span></h3>
            {t("Planning a proper home network setup with managed switches, VLAN segmentation, and a dedicated server rack. Goal is to mirror enterprise networking at home — firewall, monitoring, and isolated network zones.",
               "Planlegger et ordentlig hjemmenettverk med administrerte svitsjer, VLAN-segmentering og et eget serverrack. Målet er å speile enterprise-nettverk hjemme — brannmur, overvåking og isolerte nettverkssoner.", tag="p")}
            {tags([("VLAN", "VLAN"), ("Managed switches", "Administrerte svitsjer"), ("Firewall", "Brannmur"), ("Network monitoring", "Nettverksovervåking")])}
          </div>
        </article>

      </div>

      <div class="activity" id="activity" hidden>
        <h3 class="activity-title">{ico("chart-grid-dots")}{t("Lab activity", "Aktivitet i laben")}</h3>
        {t("Commits to J.A.R.V.I.S. and this site, one square per day. Updated from the Pi.",
           "Commits til J.A.R.V.I.S. og denne siden, én rute per dag. Oppdateres fra Pi-en.", tag="p", cls="activity-intro")}
        <div class="act-scroll">
          <div class="act-months mono" aria-hidden="true"></div>
          <div class="act-grid" aria-hidden="true"></div>
        </div>
        <div class="act-foot mono">
          <p class="act-summary"></p>
          <p class="act-legend" aria-hidden="true">{t("Less", "Mindre")}<span class="act-cell l0"></span><span class="act-cell l1"></span><span class="act-cell l2"></span><span class="act-cell l3"></span><span class="act-cell l4"></span>{t("More", "Mer")}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Log ── -->
  <section class="section shade" id="log" aria-labelledby="log-title">
    <div class="wrap">
      <h2 id="log-title">{ico("notebook")}{t("Log", "Logg")}</h2>
      {t("Notes from the bench — what broke, what I measured, and what I changed.",
         "Notater fra arbeidsbenken — hva som gikk galt, hva jeg målte, og hva jeg endret.", tag="p", cls="section-intro")}
      <p class="mono log-feed"><a href="log/follow.html">{ico("rss")}{t("Follow the log with RSS", "Følg loggen med RSS")}</a></p>
      <div class="entries">
        <article class="entry log-row">
          <div class="entry-gutter"><span class="mono">10.2026</span></div>
          <div class="entry-body">
            <h3 class="entry-title"><a href="log/permission-ladder.html">{t("A voice assistant that can’t do more than it’s allowed to", "En stemmeassistent som ikke kan gjøre mer enn den har lov til")}</a></h3>
            {t("How J.A.R.V.I.S. decides what it may touch, why every button goes through the same gate as a spoken request, and the test that once stopped a real printer.",
               "Hvordan J.A.R.V.I.S. avgjør hva den får røre, hvorfor hver knapp går gjennom samme port som en muntlig forespørsel, og testen som en gang stoppet en ekte printer.", tag="p")}
          </div>
        </article>
        <article class="entry log-row">
          <div class="entry-gutter"><span class="mono">09.2026</span></div>
          <div class="entry-body">
            <h3 class="entry-title"><a href="log/zero-support-roofs.html">{t("Zero support roofs: why a nine-hour print failed", "Null støttetak: hvorfor en ni timers print feilet")}</a></h3>
            {t("A downloaded print file had 674 support sections and not one roof for the model to land on. Two quick checks would have caught it.",
               "En nedlastet printfil hadde 674 støtteseksjoner og ikke ett eneste tak modellen kunne lande på. To raske sjekker ville ha avslørt det.", tag="p")}
          </div>
        </article>
        <article class="entry log-row">
          <div class="entry-gutter"><span class="mono">09.2026</span></div>
          <div class="entry-body">
            <h3 class="entry-title"><a href="log/levelling-the-bed.html">{t("Levelling a 420 mm bed by measurement", "Nivellering av en 420 mm printeplate etter mål")}</a></h3>
            {t("From 2.965 mm out of true to 0.597 mm, one screw and one probe at a time — and the whole bed usable again.",
               "Fra 2,965 mm skjevhet til 0,597 mm, én skrue og én måling om gangen — og hele platen brukbar igjen.", tag="p")}
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- ── Skills ── -->
  <section class="section" id="skills" aria-labelledby="skills-title">
    <div class="wrap">
      <h2 id="skills-title">{ico("stack-2")}{t("Skills", "Ferdigheter")}</h2>
      {t("Pick any skill to see where I've used it.", "Velg en ferdighet for å se hvor jeg har brukt den.", tag="p", cls="section-intro")}
      <div class="entries">
{skill_row("robot", "Robotics &amp; AI", "Robotikk og AI", [
    ("Humanoid robot deployment", "Utrulling av humanoide roboter"), ("GPU training fleets", "GPU-treningsflåter"),
    ("NVIDIA Jetson Thor", "NVIDIA Jetson Thor"), ("Grace Blackwell", "Grace Blackwell"), ("VLA models", "VLA-modeller"),
    ("GR00T", "GR00T"), ("LeRobot", "LeRobot"), ("MuJoCo", "MuJoCo"), ("VR teleoperation", "VR-fjernstyring"),
    ("Robot data pipelines", "Robotdatapipelines"), ("Edge inference", "Edge-inferens"), ("Local LLMs", "Lokale LLM-er")], now=True)}
{skill_row("cloud-lock", "Cloud &amp; identity", "Sky og identitet", [
    ("Microsoft 365", "Microsoft 365"), ("Entra ID / Azure AD", "Entra ID / Azure AD"), ("Microsoft Intune", "Microsoft Intune"),
    ("Microsoft Defender", "Microsoft Defender"), ("Azure", "Azure"), ("Google Workspace", "Google Workspace"), ("Okta", "Okta")])}
{skill_row("shield-lock", "Networking &amp; security", "Nettverk og sikkerhet", [
    ("Network infrastructure", "Nettverksinfrastruktur"), ("Cybersecurity", "Cybersikkerhet"), ("Aruba Networks", "Aruba Networks"),
    ("Palo Alto NGFW", "Palo Alto NGFW"), ("Extreme Networks", "Extreme Networks"), ("IAM", "IAM")])}
{skill_row("cpu", "Hardware &amp; electronics", "Maskinvare og elektronikk", [
    ("Hardware repair", "Maskinvarereparasjon"), ("Electronics", "Elektronikk"), ("Soldering", "Lodding"),
    ("Raspberry Pi", "Raspberry Pi"), ("Component-level repair", "Reparasjon på komponentnivå")])}
{skill_row("tool", "Tools &amp; platforms", "Verktøy og plattformer", [
    ("Jira", "Jira"), ("Confluence", "Confluence"), ("Windows Server", "Windows Server"), ("Kubernetes", "Kubernetes"),
    ("SaltStack", "SaltStack"), ("HTML", "HTML")])}
        <div class="entry skill-row">
          <div class="entry-gutter"></div>
          <div class="entry-body">
            <h3 class="entry-title">{ico("language")}<span>{t("Languages", "Språk")}</span></h3>
            {t("Norwegian — native · English — fluent", "Norsk — morsmål · Engelsk — flytende", tag="p", cls="mono tags")}
          </div>
        </div>
      </div>
      <p class="mono skill-used" id="skill-used" aria-live="polite"></p>
    </div>
  </section>

  <!-- ── Education ── -->
  <section class="section shade" id="education" aria-labelledby="education-title">
    <div class="wrap">
      <h2 id="education-title">{ico("school")}{t("Education", "Utdanning")}</h2>
      <div class="entries">
        <article class="entry">
          <div class="entry-gutter"><span class="mono">01.2023 — 11.2023</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{t("Supplementary University Admission Certification", "Påbygg til generell studiekompetanse")}</h3>
            <p class="mono entry-meta">ASK Privatist · {t("Remote", "Fjernundervisning")}</p>
          </div>
        </article>
        <article class="entry" id="edu-electronics">
          <div class="entry-gutter"><span class="mono">08.2020 — 06.2022</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{t("VG2 &amp; VG3 — Computer Electronics &amp; Trade Certificate (Fagbrev)", "VG2 og VG3 — Dataelektronikk og fagbrev")}</h3>
            <p class="mono entry-meta">Malakoff Videregående Skole · {t("Moss, Norway", "Moss, Norge")}</p>
          </div>
        </article>
        <article class="entry">
          <div class="entry-gutter"><span class="mono">08.2019 — 06.2020</span></div>
          <div class="entry-body">
            <h3 class="entry-title">{t("VG1 — Electrical Engineering", "VG1 — Elektro")}</h3>
            <p class="mono entry-meta">Malakoff Videregående Skole · {t("Moss, Norway", "Moss, Norge")}</p>
          </div>
        </article>
      </div>

      <h3 class="sub" id="certifications">{t("Certifications", "Sertifiseringer")}</h3>
      <div class="entries">
        <article class="entry">
          <div class="entry-gutter"><span class="mono">2022</span></div>
          <div class="entry-body">
            <h4 class="entry-title">{t("Certificate of Apprenticeship in Computer Technology", "Fagbrev som dataelektroniker")}</h4>
            <p class="mono entry-meta">{t("Norwegian Trade Certificate", "Norsk fagbrev")}</p>
          </div>
        </article>
        <article class="entry">
          <div class="entry-gutter"><span class="mono">04.2024</span></div>
          <div class="entry-body">
            <h4 class="entry-title">System Administration and IT Infrastructure Services</h4>
            <p class="mono entry-meta">Google</p>
          </div>
        </article>
        <article class="entry">
          <div class="entry-gutter"></div>
          <div class="entry-body">
            <h4 class="entry-title">Technical Support Fundamentals</h4>
            <p class="mono entry-meta">Google</p>
          </div>
        </article>
        <article class="entry" id="cert-cisco">
          <div class="entry-gutter"></div>
          <div class="entry-body">
            <h4 class="entry-title">Introduction to Cybersecurity</h4>
            <p class="mono entry-meta">Cisco</p>
          </div>
        </article>
        <article class="entry" id="cert-nsm">
          <div class="entry-gutter"></div>
          <div class="entry-body">
            <h4 class="entry-title">{t("Fundamentals for Cybersecurity", "Grunnleggende cybersikkerhet")}</h4>
            <p class="mono entry-meta">{t("NSM — Norwegian National Security Authority", "NSM — Nasjonal sikkerhetsmyndighet")}</p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- ── Contact ── -->
  <section class="section" id="contact" aria-labelledby="contact-title">
    <div class="wrap">
      <h2 id="contact-title">{ico("message-circle")}{t("Contact", "Kontakt")}</h2>
      {t("Happy to talk humanoid robots, AI infrastructure or home-lab builds — the more hardware involved, the better. I usually reply within a day.",
         "Snakker gjerne om humanoide roboter, AI-infrastruktur eller hjemmelab-prosjekter — jo mer maskinvare, jo bedre. Jeg svarer vanligvis innen en dag.", tag="p", cls="section-intro")}
      <div class="entries">
        <div class="entry contact-row">
          <div class="entry-gutter"><span class="mono with-ico">{ico("mail")}{t("Email", "E-post")}</span></div>
          <div class="entry-body"><a href="mailto:Oscarskjaevestad@gmail.com">Oscarskjaevestad@gmail.com</a></div>
        </div>
        <div class="entry contact-row">
          <div class="entry-gutter"><span class="mono with-ico">{ico("brand-linkedin")}LinkedIn</span></div>
          <div class="entry-body"><a href="https://linkedin.com/in/oscar-skjaevestad" target="_blank" rel="noopener">oscar-skjaevestad</a></div>
        </div>
        <div class="entry contact-row">
          <div class="entry-gutter"><span class="mono with-ico">{ico("file-cv")}CV</span></div>
          <div class="entry-body">{t('<a href="oscar-cv.pdf">oscar-cv.pdf</a> · English', '<a href="oscar-cv-no.pdf">oscar-cv-no.pdf</a> · norsk')}</div>
        </div>
      </div>
    </div>
  </section>

</main>
{footer(R)}'''
    return h + body
