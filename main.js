/**
 * Nunik Co.
 * High-End Kinetic Engine (Vanilla JS)
 */

/* ================================================
   Shared module-level state
   ================================================ */
let webglUniforms = null;   // fluid background shader uniforms
let chakraMaterial = null;  // 3D chakra material reference
let fluidRequestRender = null;   // set by initWebGLBackground: forces a repaint
let chakraRequestRender = null;  // set by initChakraBackground: forces a repaint

/* ================================================
   Theme palettes (fluid background colours)
   ================================================ */
const THEME_COLORS = {
    dark:  { base: "#111417", accent1: "#B45E45", accent2: "#2D4D4D" },
    // Light mode: warm tan second accent makes the fluid feel rich, not washed out
    light: { base: "#F8F6F3", accent1: "#B45E45", accent2: "#C3875A" }
};

/* ================================================
   Lead form: country codes + validation
   ================================================ */
// [ISO 3166-1 alpha-2, international dialling code]
const COUNTRY_CODES = [
    ["AF",93],["AX",358],["AL",355],["DZ",213],["AS",1684],["AD",376],["AO",244],["AI",1264],["AG",1268],["AR",54],["AM",374],["AW",297],["AU",61],["AT",43],["AZ",994],
    ["BS",1242],["BH",973],["BD",880],["BB",1246],["BY",375],["BE",32],["BZ",501],["BJ",229],["BM",1441],["BT",975],["BO",591],["BA",387],["BW",267],["BR",55],["IO",246],["VG",1284],["BN",673],["BG",359],["BF",226],["BI",257],
    ["KH",855],["CM",237],["CA",1],["CV",238],["BQ",599],["KY",1345],["CF",236],["TD",235],["CL",56],["CN",86],["CX",61],["CC",61],["CO",57],["KM",269],["CG",242],["CD",243],["CK",682],["CR",506],["CI",225],["HR",385],["CU",53],["CW",599],["CY",357],["CZ",420],
    ["DK",45],["DJ",253],["DM",1767],["DO",1809],["EC",593],["EG",20],["SV",503],["GQ",240],["ER",291],["EE",372],["SZ",268],["ET",251],["FK",500],["FO",298],["FJ",679],["FI",358],["FR",33],["GF",594],["PF",689],
    ["GA",241],["GM",220],["GE",995],["DE",49],["GH",233],["GI",350],["GR",30],["GL",299],["GD",1473],["GP",590],["GU",1671],["GT",502],["GG",44],["GN",224],["GW",245],["GY",592],["HT",509],["HN",504],["HK",852],["HU",36],
    ["IS",354],["IN",91],["ID",62],["IR",98],["IQ",964],["IE",353],["IM",44],["IL",972],["IT",39],["JM",1876],["JP",81],["JE",44],["JO",962],["KZ",7],["KE",254],["KI",686],["XK",383],["KW",965],["KG",996],
    ["LA",856],["LV",371],["LB",961],["LS",266],["LR",231],["LY",218],["LI",423],["LT",370],["LU",352],["MO",853],["MG",261],["MW",265],["MY",60],["MV",960],["ML",223],["MT",356],["MH",692],["MQ",596],["MR",222],["MU",230],["YT",262],["MX",52],["FM",691],["MD",373],["MC",377],["MN",976],["ME",382],["MS",1664],["MA",212],["MZ",258],["MM",95],
    ["NA",264],["NR",674],["NP",977],["NL",31],["NC",687],["NZ",64],["NI",505],["NE",227],["NG",234],["NU",683],["NF",672],["KP",850],["MK",389],["MP",1670],["NO",47],["OM",968],
    ["PK",92],["PW",680],["PS",970],["PA",507],["PG",675],["PY",595],["PE",51],["PH",63],["PL",48],["PT",351],["PR",1787],["QA",974],["RE",262],["RO",40],["RU",7],["RW",250],
    ["BL",590],["SH",290],["KN",1869],["LC",1758],["MF",590],["PM",508],["VC",1784],["WS",685],["SM",378],["ST",239],["SA",966],["SN",221],["RS",381],["SC",248],["SL",232],["SG",65],["SX",1721],["SK",421],["SI",386],["SB",677],["SO",252],["ZA",27],["KR",82],["SS",211],["ES",34],["LK",94],["SD",249],["SR",597],["SJ",47],["SE",46],["CH",41],["SY",963],
    ["TW",886],["TJ",992],["TZ",255],["TH",66],["TL",670],["TG",228],["TK",690],["TO",676],["TT",1868],["TN",216],["TR",90],["TM",993],["TC",1649],["TV",688],
    ["UG",256],["UA",380],["AE",971],["GB",44],["US",1],["UY",598],["UZ",998],["VU",678],["VA",39],["VE",58],["VN",84],["WF",681],["EH",212],["YE",967],["ZM",260],["ZW",263]
];
// Expected national number length (digits, after any leading 0) for the
// markets we see most. Everything else accepts 6 to 14 digits.
const NATIONAL_LENGTHS = { AU: [9, 9], NZ: [8, 10], US: [10, 10], CA: [10, 10], GB: [10, 10], IN: [10, 10], SG: [8, 8], AE: [9, 9], DE: [10, 11], IE: [9, 9] };
const MIN_WORDS_OTHER = 50;
const MIN_WORDS_DEFAULT = 10;
const MIN_OWN_WORDS = 8;

function countryName(iso) {
    if (iso === "XK") return "Kosovo";
    try { return new Intl.DisplayNames(["en"], { type: "region" }).of(iso) || iso; } catch { return iso; }
}

function populateCountryCodes(select) {
    const items = COUNTRY_CODES.map(([iso, dial]) => ({ iso, dial, name: countryName(iso) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    for (const it of items) {
        const opt = document.createElement("option");
        opt.value = it.iso;
        opt.dataset.dial = String(it.dial);
        opt.textContent = `${it.name} (+${it.dial})`;
        select.appendChild(opt);
    }
    // Australia first: it is the home market and browser locales are an
    // unreliable guide (most Australian browsers report en-US).
    select.value = "AU";
    // Keep the closed control short: show just the dial code once chosen.
    const shorten = () => {
        for (const o of select.options) {
            const n = o.dataset.name || (o.dataset.name = o.textContent);
            o.textContent = o.selected ? `+${o.dataset.dial || ""}` : n;
        }
    };
    select.addEventListener("change", shorten);
    select.addEventListener("focus", () => { for (const o of select.options) if (o.dataset.name) o.textContent = o.dataset.name; });
    select.addEventListener("blur", shorten);
    shorten();
}

function wordCount(text) {
    return (text || "").trim().split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

/* ================================================
   Enquiry flow: one question per screen
   ================================================ */
// Web3Forms delivers finished enquiries to hello@nunik.co.
const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const FORM_ACCESS_KEY = "17a1f44f-2499-4c3e-ba1a-7714fb693c59";

// Optional automation hook (n8n, GoHighLevel, Zapier: any inbound webhook
// that accepts form fields). When set, the flow posts these events with the
// answers so far and a session_id:
//   partial    after the email question and every question after it
//   abandoned  the tab was hidden or closed before the enquiry was sent
//   resumed    the visitor came back to the tab
//   completed  the enquiry was sent
// The automation should wait 30 seconds after "abandoned", and email the
// visitor only if no "resumed" or "completed" arrived for that session_id.
// Left empty, an unfinished enquiry is emailed to hello@nunik.co instead.
const LEAD_WEBHOOK_URL = "";
const LEAD_STORE_KEY = "nunik-lead-v1";

// Brief question, and sentence openers with an example ending, per need.
const LEAD_BRIEFS = {
    "Web Development": {
        q: "Tell us about the website.",
        starters: [
            ["Our current site", "is slow on a phone and nobody can find the booking button."],
            ["People land on it and", "leave before they call us."],
            ["We want visitors to", "book a job without having to ring."],
            ["A site we like is", "the one our biggest competitor just launched."],
            ["We need it live by", "the start of next quarter."]
        ]
    },
    "Brand Identity": {
        q: "Tell us about the brand.",
        starters: [
            ["Right now we look like", "every other business in our trade."],
            ["We want people to feel", "they can trust us before the first call."],
            ["Our best customers are", "owners who care about the details."],
            ["We keep getting mistaken for", "a much smaller operation than we are."],
            ["It has to work on", "the vans, the uniforms and the website."]
        ]
    },
    "Automation": {
        q: "What should be running itself?",
        starters: [
            ["Every day someone has to manually", "copy new enquiries into the calendar."],
            ["Leads come in from", "the website, the phone and Facebook, all in different places."],
            ["We lose track when", "a quote goes out and nobody follows up."],
            ["We already use", "a CRM, but only half of it is set up."],
            ["If one thing ran itself, it would be", "replying to missed calls."]
        ]
    },
    "Full Transformation": {
        q: "What is slowing the business down?",
        starters: [
            ["We are", "a six-van plumbing business that has outgrown its systems."],
            ["The biggest bottleneck is", "everything running through one person."],
            ["Our website and brand", "have not changed since we started."],
            ["The admin that eats our week is", "quoting, chasing and rebooking."],
            ["In twelve months we want", "to double the work without doubling the office."]
        ]
    },
    "Other": {
        q: "What do you need?",
        starters: [
            ["We are", "a small team that does a bit of everything."],
            ["Right now we", "rely on word of mouth and a Facebook page."],
            ["The problem is", "we do not know what to fix first."],
            ["We have already tried", "a couple of tools that nobody kept using."],
            ["A good result would be", "more of the right enquiries with less chasing."]
        ]
    }
};

function initLeadFlow(form) {
    const $ = (sel) => form.querySelector(sel);
    const steps = Array.from(form.querySelectorAll(".lf-step[data-step]")).filter((s) => s.dataset.step !== "done");
    const doneStep = $('.lf-step[data-step="done"]');
    const order = steps.map((s) => s.dataset.step);
    const f = {
        name: $('[name="name"]'), email: $('[name="email"]'), country: $('[name="country_code"]'), phone: $('[name="phone"]'),
        website: $('[name="website"]'), business: $('[name="business"]'), message: $('[name="message"]')
    };
    const radios = Array.from(form.querySelectorAll('input[name="service"]'));
    const ui = {
        count: $(".lf-count b"), back: $(".lf-back"), bar: $(".lf-progress"), next: $(".lf-next"), submit: $(".lf-submit"),
        skip: $(".lf-skip"), enter: $(".lf-enter"), status: $(".lf-status"), starters: $(".lf-starters"),
        ghost: $(".lf-ghost"), ghostStem: $(".lf-ghost-stem"), ghostRest: $(".lf-ghost-rest"), ghostHint: $(".lf-ghost-hint"),
        counter: $(".lf-counter"), briefQ: $("[data-lf-brief-q]"), briefSub: $("[data-lf-brief-sub]")
    };
    const stepKeys = { service: ["service"], name: ["name"], email: ["email"], phone: ["phone"], business: ["website"], message: ["message"] };

    let index = 0;
    let submitted = false;
    let sending = false;
    let sid = "";

    if (f.country) populateCountryCodes(f.country);

    const serviceValue = () => (radios.find((r) => r.checked) || {}).value || "";
    const firstName = () => (f.name.value.trim().split(/\s+/)[0] || "").slice(0, 24);
    const nationalDigits = () => (f.phone.value || "").replace(/[\s().-]/g, "").replace(/^0+/, "");
    const dialCode = () => (f.country.selectedOptions[0] ? f.country.selectedOptions[0].dataset.dial : "") || "";
    const fullPhone = () => (dialCode() ? `+${dialCode()} ${nationalDigits()}` : nationalDigits());
    const minWords = () => (serviceValue() === "Other" ? MIN_WORDS_OTHER : MIN_WORDS_DEFAULT);

    /* ── Validation ─────────────────────────────── */
    const validators = {
        service: () => (serviceValue() ? "" : "Pick the closest option to carry on."),
        name: () => {
            const v = f.name.value.trim();
            if (!v) return "We need a name to reply to.";
            if (v.length < 2) return "That looks too short for a name.";
            return "";
        },
        email: () => {
            const v = f.email.value.trim();
            if (!v) return "We need an email to send the plan to.";
            if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return "That does not look like an email address. Try name@company.com.";
            return "";
        },
        phone: () => {
            if (!f.country.value) return "Pick your country code first.";
            const raw = (f.phone.value || "").trim();
            if (!raw) return "We need a number to call you on.";
            if (raw.startsWith("+") || raw.startsWith("00")) return "Choose the country code from the list, then type the number without it.";
            if (/[^\d\s().-]/.test(raw)) return "A phone number can only contain digits.";
            const digits = nationalDigits();
            const [lo, hi] = NATIONAL_LENGTHS[f.country.value] || [6, 14];
            if (digits.length < lo || digits.length > hi) {
                return lo === hi ? `That number needs ${lo} digits after +${dialCode()}.` : `That number needs ${lo} to ${hi} digits.`;
            }
            return "";
        },
        website: () => {
            const v = f.website.value.trim();
            if (!v) return "";
            const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
            try {
                const u = new URL(withScheme);
                if (!/\./.test(u.hostname)) throw new Error("no tld");
                f.website.value = withScheme;
                return "";
            } catch { return "That does not look like a web address. Try yourbusiness.com.au, or leave it blank."; }
        },
        message: () => {
            const n = wordCount(f.message.value);
            if (!f.message.value.trim()) return "Tell us a little about what you need.";
            const need = minWords();
            if (n < need) return `A little more, please: at least ${need} words (${n} so far).`;
            if (ownWords() < MIN_OWN_WORDS) return "Finish those openers in your own words, so we know what you actually need.";
            return "";
        }
    };

    // Words the visitor wrote themselves, not counting any openers they tapped.
    function ownWords() {
        let text = f.message.value;
        const cfg = LEAD_BRIEFS[serviceValue()] || LEAD_BRIEFS.Other;
        cfg.starters.forEach(([stem]) => { text = text.split(stem).join(" "); });
        return wordCount(text);
    }

    function setError(key, msg) {
        const note = $("#lf-err-" + key);
        if (note) note.textContent = msg || "";
        const input = f[key];
        if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
        if (key === "phone") f.country.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    const stepIsValid = (i) => (stepKeys[order[i]] || []).every((k) => !validators[k]());

    function focusTarget(i) {
        const step = steps[i];
        if (order[i] === "service") return radios.find((r) => r.checked) || radios[0];
        if (order[i] === "phone") return f.country.value ? f.phone : f.country;
        return step.querySelector("input:not([type=checkbox]), textarea, select");
    }

    function nudge(el) {
        if (!el || REDUCED_MOTION) return;
        el.classList.remove("lf-nudge");
        void el.offsetWidth;
        el.classList.add("lf-nudge");
    }

    function validateStep(i) {
        let bad = null;
        for (const key of stepKeys[order[i]] || []) {
            const msg = validators[key]();
            setError(key, msg);
            if (msg && !bad) bad = key;
        }
        if (!bad) return true;
        const anchor = bad === "service" ? steps[i].querySelector(".lf-options") : (f[bad] && f[bad].closest(".lf-field"));
        nudge(anchor);
        const target = bad === "service" ? focusTarget(i) : f[bad];
        if (target) target.focus({ preventScroll: true });
        return false;
    }

    /* ── Session persistence ────────────────────── */
    const snapshot = () => ({
        sid, step: index, service: serviceValue(), name: f.name.value, email: f.email.value, country: f.country.value,
        phone: f.phone.value, website: f.website.value, business: f.business.value, message: f.message.value
    });
    let saveTimer = 0;
    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            if (submitted) return;
            try { sessionStorage.setItem(LEAD_STORE_KEY, JSON.stringify(snapshot())); } catch { /* storage unavailable */ }
        }, 250);
    }
    function restore() {
        let saved = null;
        try { saved = JSON.parse(sessionStorage.getItem(LEAD_STORE_KEY) || "null"); } catch { saved = null; }
        sid = (saved && saved.sid) || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
        if (!saved) return;
        radios.forEach((r) => { r.checked = r.value === saved.service; });
        f.name.value = saved.name || "";
        f.email.value = saved.email || "";
        if (saved.country) { f.country.value = saved.country; f.country.dispatchEvent(new Event("change")); }
        f.phone.value = saved.phone || "";
        f.website.value = saved.website || "";
        f.business.value = saved.business || "";
        f.message.value = saved.message || "";
        // Resume where they left off, but never past an unanswered question.
        let to = Math.min(Number(saved.step) || 0, steps.length - 1);
        for (let i = 0; i < to; i++) if (!stepIsValid(i)) { to = i; break; }
        if (to > 0) {
            steps[0].classList.remove("is-active");
            setInert(steps[0], true);
            steps[to].classList.add("is-active");
            setInert(steps[to], false);
            index = to;
        }
    }

    function setInert(el, on) {
        el.inert = on;
        if (on) el.setAttribute("aria-hidden", "true"); else el.removeAttribute("aria-hidden");
    }

    /* ── Automation events and analytics ────────── */
    const hasEmail = () => !validators.email();

    function answers() {
        const fd = new FormData();
        fd.append("name", f.name.value.trim());
        fd.append("email", f.email.value.trim());
        fd.append("phone", f.phone.value.trim() ? fullPhone() : "");
        fd.append("website", f.website.value.trim());
        fd.append("business", f.business.value.trim());
        fd.append("service", serviceValue());
        fd.append("message", f.message.value.trim());
        return fd;
    }

    function beacon(url, fd) {
        try { if (navigator.sendBeacon && navigator.sendBeacon(url, fd)) return; } catch { /* fall through */ }
        try { fetch(url, { method: "POST", body: fd, keepalive: true, mode: "no-cors" }); } catch { /* nothing else to try */ }
    }

    function sendLeadEvent(event) {
        if (!LEAD_WEBHOOK_URL || !hasEmail()) return;
        const fd = answers();
        fd.append("event", event);
        fd.append("session_id", sid);
        fd.append("step", order[index]);
        fd.append("step_number", String(index + 1));
        fd.append("first_name", firstName());
        fd.append("page", location.pathname);
        fd.append("sent_at", new Date().toISOString());
        beacon(LEAD_WEBHOOK_URL, fd);
    }

    // No webhook configured: tell hello@nunik.co about the unfinished enquiry, once.
    function notifyUnfinished() {
        if (!FORM_ACCESS_KEY) return;
        try {
            if (sessionStorage.getItem(LEAD_STORE_KEY + ":notified")) return;
            sessionStorage.setItem(LEAD_STORE_KEY + ":notified", "1");
        } catch { return; }
        const fd = answers();
        fd.append("access_key", FORM_ACCESS_KEY);
        fd.append("subject", `Unfinished enquiry from ${f.name.value.trim() || f.email.value.trim()} | nunik.co`);
        fd.append("from_name", "Nunik Co. Website");
        fd.append("status", `Started the enquiry form on ${location.pathname} and left at question ${index + 1} of ${steps.length} (${order[index]}).`);
        beacon(WEB3FORMS_URL, fd);
    }

    document.addEventListener("visibilitychange", () => {
        if (submitted || !hasEmail()) return;
        sendLeadEvent(document.hidden ? "abandoned" : "resumed");
    });
    window.addEventListener("pagehide", () => {
        if (submitted || !hasEmail() || LEAD_WEBHOOK_URL) return;
        notifyUnfinished();
    });

    function track(name, extra) {
        if (typeof gtag === "function") gtag("event", name, Object.assign({ form: "lead_flow" }, extra || {}));
    }

    /* ── Brief: openers, ghost text, counter ────── */
    let briefFor = null;
    let ghostToken = 0;
    let ghostStemNow = "";
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function showGhost(on) {
        ui.ghost.classList.toggle("is-on", on);
        ui.ghostHint.classList.toggle("is-on", on);
    }
    function stopGhost() { ghostToken++; showGhost(false); }

    async function startGhost() {
        const list = (LEAD_BRIEFS[serviceValue()] || LEAD_BRIEFS.Other).starters;
        const token = ++ghostToken;
        if (f.message.value) { showGhost(false); return; }
        ui.ghost.classList.remove("is-fading");
        showGhost(true);
        for (let i = 0; token === ghostToken; i++) {
            const [stem, rest] = list[i % list.length];
            ghostStemNow = stem;
            if (REDUCED_MOTION) {
                ui.ghostStem.textContent = stem;
                ui.ghostRest.textContent = " " + rest;
                return;
            }
            ui.ghostStem.textContent = "";
            ui.ghostRest.textContent = "";
            ui.ghost.classList.remove("is-fading");
            for (let c = 1; c <= stem.length && token === ghostToken; c++) {
                ui.ghostStem.textContent = stem.slice(0, c);
                await sleep(26 + Math.random() * 22);
            }
            const tail = " " + rest;
            for (let c = 1; c <= tail.length && token === ghostToken; c++) {
                ui.ghostRest.textContent = tail.slice(0, c);
                await sleep(20 + Math.random() * 20);
            }
            await sleep(2400);
            if (token !== ghostToken) return;
            ui.ghost.classList.add("is-fading");
            await sleep(380);
        }
    }

    function updateCounter() {
        const n = wordCount(f.message.value);
        const need = minWords();
        ui.counter.textContent = n >= need ? `${n} words` : `${n} / ${need} words`;
        ui.counter.classList.toggle("is-met", n >= need && ownWords() >= MIN_OWN_WORDS);
        ui.starters.querySelectorAll(".lf-chip").forEach((chip) => {
            chip.classList.toggle("is-used", f.message.value.includes(chip.dataset.stem));
        });
    }

    function insertStarter(stem) {
        const t = f.message;
        const cur = t.value.replace(/\s+$/, "");
        // After a finished sentence carry on inline; otherwise start a new line.
        const joiner = !cur ? "" : (/[.!?]$/.test(cur) ? " " : "\n");
        t.value = cur + joiner + stem + " ";
        t.focus({ preventScroll: true });
        t.setSelectionRange(t.value.length, t.value.length);
        t.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function prepareBrief() {
        const svc = serviceValue() || "Other";
        const cfg = LEAD_BRIEFS[svc] || LEAD_BRIEFS.Other;
        if (briefFor !== svc) {
            briefFor = svc;
            ui.briefQ.textContent = cfg.q;
            ui.briefSub.textContent = svc === "Other"
                ? "Fifty words or more here, so we can point you the right way. The openers below make it quick."
                : "A few sentences is plenty. Tap an opener if you are not sure where to start.";
            ui.starters.textContent = "";
            cfg.starters.forEach(([stem]) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "lf-chip";
                chip.dataset.stem = stem;
                chip.textContent = stem + " …";
                chip.addEventListener("click", () => insertStarter(stem));
                ui.starters.appendChild(chip);
            });
        }
        updateCounter();
        startGhost();
    }

    /* ── Rendering and movement ─────────────────── */
    // The stage row eases to the height of the current question, so the card
    // hugs its content and the action row always sits right under the field.
    const stage = $(".lf-stage");
    function layoutStage() {
        const current = form.classList.contains("is-done") ? doneStep : steps[index];
        stage.style.setProperty("--lf-h", `${current.offsetHeight}px`);
    }
    if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(layoutStage);
        steps.forEach((s) => ro.observe(s));
        ro.observe(doneStep);
    } else {
        window.addEventListener("resize", layoutStage);
    }

    function syncOptions() {
        radios.forEach((r) => r.closest(".lf-option").classList.toggle("is-checked", r.checked));
    }

    function render() {
        const n = index + 1;
        const total = steps.length;
        const last = index === total - 1;
        ui.count.textContent = String(n).padStart(2, "0");
        ui.bar.style.setProperty("--p", String(n / total));
        ui.bar.setAttribute("aria-valuenow", String(n));
        ui.back.hidden = index === 0;
        ui.next.hidden = last;
        ui.submit.hidden = !last;
        ui.skip.hidden = order[index] !== "business";
        ui.enter.innerHTML = last ? "<kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send" : "or press <kbd>Enter</kbd>";
        const name = firstName();
        form.querySelectorAll("[data-lf-name]").forEach((el) => { el.textContent = name ? `, ${name}` : ""; });
        syncOptions();
        if (order[index] === "message") prepareBrief(); else stopGhost();
        layoutStage();
    }

    function go(to, dir) {
        if (to === index || to < 0 || to >= steps.length) return;
        const from = steps[index];
        const next = steps[to];
        form.dataset.dir = dir;
        from.classList.remove("is-active");
        from.classList.add("is-leaving");
        setInert(from, true);
        setTimeout(() => from.classList.remove("is-leaving"), 260);
        setInert(next, false);
        void next.offsetWidth; // start the entrance from the correct side
        next.classList.add("is-active");
        index = to;
        ui.status.textContent = "";
        render();
        save();
        if (dir === "fwd") track("lead_form_step", { step: order[index], step_number: index + 1 });
        setTimeout(() => { const t = focusTarget(index); if (t) t.focus({ preventScroll: true }); }, 180);
    }

    function next() {
        if (sending || submitted) return;
        if (!validateStep(index)) return;
        if (index >= order.indexOf("email")) sendLeadEvent("partial");
        if (index === steps.length - 1) { submit(); return; }
        go(index + 1, "fwd");
    }

    function setSending(on) {
        sending = on;
        form.setAttribute("aria-busy", on ? "true" : "false");
        ui.submit.disabled = on;
        ui.submit.classList.toggle("is-sending", on);
        ui.submit.querySelector(".lf-btn-label").textContent = on ? "Sending" : "Send the brief";
    }

    function finish() {
        submitted = true;
        try { sessionStorage.removeItem(LEAD_STORE_KEY); sessionStorage.removeItem(LEAD_STORE_KEY + ":notified"); } catch { /* ignore */ }
        sendLeadEvent("completed");
        track("lead_form_submit", { service: serviceValue() });
        stopGhost();
        const from = steps[index];
        form.dataset.dir = "fwd";
        from.classList.remove("is-active");
        from.classList.add("is-leaving");
        setInert(from, true);
        setTimeout(() => from.classList.remove("is-leaving"), 260);
        setInert(doneStep, false);
        void doneStep.offsetWidth;
        doneStep.classList.add("is-active");
        form.classList.add("is-done");
        ui.bar.style.setProperty("--p", "1");
        layoutStage();
        // Google Ads conversion landing, see /thank-you/inquiry/.
        setTimeout(() => { window.location.href = "/thank-you/inquiry/"; }, 1300);
    }

    async function submit() {
        const honeypot = $('[name="botcheck"]');
        if (honeypot && honeypot.checked) return;
        const firstBad = steps.findIndex((_, i) => !stepIsValid(i));
        if (firstBad !== -1) {
            if (firstBad !== index) go(firstBad, "back");
            setTimeout(() => validateStep(firstBad), firstBad !== index ? 420 : 0);
            return;
        }

        if (!FORM_ACCESS_KEY || FORM_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
            const body = [
                `Name: ${f.name.value.trim()}`, `Email: ${f.email.value.trim()}`, `Phone: ${fullPhone()}`,
                `Website: ${f.website.value.trim()}`, `Business: ${f.business.value.trim()}`, `Need: ${serviceValue()}`, "", f.message.value.trim()
            ].join("\n");
            window.location.href = `mailto:hello@nunik.co?subject=${encodeURIComponent(`New Inquiry | ${serviceValue()}`)}&body=${encodeURIComponent(body)}`;
            return;
        }

        setSending(true);
        ui.status.textContent = "";
        try {
            const fd = answers();
            fd.append("access_key", FORM_ACCESS_KEY);
            fd.append("subject", `New Inquiry from ${f.name.value.trim() || "Website"} | nunik.co`);
            fd.append("from_name", "Nunik Co. Website");
            const res = await fetch(WEB3FORMS_URL, { method: "POST", body: fd, headers: { Accept: "application/json" } });
            if (!res.ok) throw new Error("failed");
            finish();
        } catch {
            setSending(false);
            ui.status.textContent = "That did not send. Try again, or email hello@nunik.co directly.";
        }
    }

    /* ── Events ─────────────────────────────────── */
    radios.forEach((r) => {
        r.addEventListener("change", () => { syncOptions(); setError("service", ""); save(); });
        // A real pointer press on the row advances; arrow-key selection does not.
        r.closest(".lf-option").addEventListener("click", (e) => {
            if (e.target === r || e.detail === 0) return;
            setTimeout(() => { if (order[index] === "service" && r.checked) next(); }, 340);
        });
    });

    Object.keys(f).forEach((key) => {
        const el = f[key];
        if (!el) return;
        el.addEventListener("input", () => {
            const vKey = key === "country" ? "phone" : key;
            if (validators[vKey] && (f[vKey] || el).getAttribute("aria-invalid") === "true" && !validators[vKey]()) setError(vKey, "");
            if (key === "message") {
                updateCounter();
                if (f.message.value) stopGhost(); else if (order[index] === "message") startGhost();
            }
            save();
        });
    });
    f.country.addEventListener("change", () => { if (f.phone.getAttribute("aria-invalid") === "true" && !validators.phone()) setError("phone", ""); save(); });

    form.addEventListener("keydown", (e) => {
        const t = e.target;
        if (e.key === "Enter") {
            if (t === f.message) { if (e.metaKey || e.ctrlKey) { e.preventDefault(); next(); } return; }
            if (t.tagName === "BUTTON" || t.tagName === "SELECT") return;
            e.preventDefault();
            next();
            return;
        }
        if (t === f.message && e.key === "ArrowRight" && !f.message.value && ghostStemNow) {
            e.preventDefault();
            insertStarter(ghostStemNow);
            return;
        }
        if (order[index] === "service" && /^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const r = radios[Number(e.key) - 1];
            if (!r) return;
            e.preventDefault();
            r.checked = true;
            r.dispatchEvent(new Event("change", { bubbles: true }));
            setTimeout(() => { if (order[index] === "service") next(); }, 340);
        }
    });

    ui.next.addEventListener("click", next);
    ui.back.addEventListener("click", () => go(index - 1, "back"));
    ui.skip.addEventListener("click", () => {
        if (validators.website()) f.website.value = "";
        setError("website", "");
        go(index + 1, "fwd");
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); next(); });

    restore();
    render();
    form.classList.add("is-ready");

    return {
        focus() { const t = focusTarget(index); if (t) t.focus({ preventScroll: true }); }
    };
}

/* ================================================
   Theme utilities
   ================================================ */
function isDark() {
    return document.documentElement.classList.contains("dark");
}

function applyThemeIcons() {
    // No-op: icon swap is now driven by CSS based on html.dark class.
    // Kept as a stub to avoid breaking call sites that invoke it.
}

/* ================================================
   Booking embed (Cal.com, inline, theme-aware)
   ================================================ */
const CAL_NAMESPACE = "strategy-call";
const CAL_LINK = "nunikco/strategy-call";
const CAL_ORIGIN = "https://app.cal.com";
// Cal.com colour tokens mapped onto the site palette (see :root and .dark
// in style.css). cal-bg must equal --booking-bg so the embed and the card
// that holds it read as one surface.
const CAL_PALETTE = {
    dark: {
        "cal-brand": "#B45E45", "cal-brand-emphasis": "#C56F55", "cal-brand-text": "#FFFFFF",
        "cal-bg": "#14181C", "cal-bg-muted": "#171B1F", "cal-bg-subtle": "#1E2328", "cal-bg-emphasis": "#2A3036", "cal-bg-inverted": "#E1E4E7",
        "cal-border": "#3A4148", "cal-border-subtle": "#242A2F", "cal-border-muted": "#1B2024", "cal-border-emphasis": "#5B646C",
        "cal-border-booker": "transparent", "cal-border-booker-width": "0px",
        "cal-text": "#C9CED3", "cal-text-emphasis": "#E1E4E7", "cal-text-subtle": "#949BA2", "cal-text-muted": "#7F878E", "cal-text-inverted": "#111417"
    },
    light: {
        "cal-brand": "#B45E45", "cal-brand-emphasis": "#974730", "cal-brand-text": "#FFFFFF",
        "cal-bg": "#FBFAF8", "cal-bg-muted": "#F4F1EC", "cal-bg-subtle": "#EFEBE5", "cal-bg-emphasis": "#E6E0D8", "cal-bg-inverted": "#1B1E22",
        "cal-border": "#D3CCC2", "cal-border-subtle": "#E4DED5", "cal-border-muted": "#EDE8E1", "cal-border-emphasis": "#A69E93",
        "cal-border-booker": "transparent", "cal-border-booker-width": "0px",
        "cal-text": "#3A3E44", "cal-text-emphasis": "#1B1E22", "cal-text-subtle": "#666A70", "cal-text-muted": "#8A8D92", "cal-text-inverted": "#FBFAF8"
    }
};
let bookingMounted = false;

function calTheme() { return isDark() ? "dark" : "light"; }

// Cal.com's official embed bootstrap: defines window.Cal as a queueing
// stub and injects embed.js on first use.
function ensureCal() {
    if (window.Cal) return;
    (function (C, A, L) {
        const p = function (a, ar) { a.q.push(ar); };
        const d = C.document;
        C.Cal = C.Cal || function () {
            const cal = C.Cal;
            const ar = arguments;
            if (!cal.loaded) {
                cal.ns = {};
                cal.q = cal.q || [];
                d.head.appendChild(d.createElement("script")).src = A;
                cal.loaded = true;
            }
            if (ar[0] === L) {
                const api = function () { p(api, arguments); };
                const namespace = ar[1];
                api.q = api.q || [];
                if (typeof namespace === "string") {
                    cal.ns[namespace] = cal.ns[namespace] || api;
                    p(cal.ns[namespace], ar);
                    p(cal, ["initNamespace", namespace]);
                } else p(cal, ar);
                return;
            }
            p(cal, ar);
        };
    })(window, CAL_ORIGIN + "/embed/embed.js", "init");
}

function applyBookingUi() {
    if (!bookingMounted || !window.Cal || !window.Cal.ns || !window.Cal.ns[CAL_NAMESPACE]) return;
    window.Cal.ns[CAL_NAMESPACE]("ui", {
        theme: calTheme(),
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: CAL_PALETTE
    });
}

function mountBooking(el) {
    if (bookingMounted) return;
    ensureCal();
    window.Cal("init", CAL_NAMESPACE, { origin: CAL_ORIGIN });
    const cal = window.Cal.ns[CAL_NAMESPACE];
    cal("inline", {
        elementOrSelector: el,
        calLink: CAL_LINK,
        // No theme here: a theme in the iframe URL is fixed for the life of the
        // embed. The "ui" instruction below sets it and can change it live.
        config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" }
    });
    bookingMounted = true;
    applyBookingUi();

    cal("on", { action: "linkReady", callback: () => el.setAttribute("aria-busy", "false") });

    // Google Ads conversion landing on booking completion, see /thank-you/booking/.
    let redirected = false;
    const onBooked = () => {
        if (redirected) return;
        redirected = true;
        setTimeout(function () { window.location.href = "/thank-you/booking/"; }, 400);
    };
    cal("on", { action: "bookingSuccessfulV2", callback: onBooked });
    cal("on", { action: "bookingSuccessful", callback: onBooked });
}

function initBookingLazy() {
    const el = document.getElementById("booking-widget");
    if (!el) return;

    const start = () => mountBooking(el);

    // Pages whose whole purpose is booking (/book/) mark the widget eager.
    if (location.hash === "#book" || el.hasAttribute("data-eager")) { start(); return; }

    document.querySelectorAll('a[href="#book"], a[href$="#book"]').forEach((a) => {
        a.addEventListener("click", start, { once: true });
    });

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((en) => en.isIntersecting)) {
                io.disconnect();
                start();
            }
        }, { rootMargin: "800px 0px" });
        io.observe(el);
    } else {
        start();
    }
}

function setWebGLTheme(animate) {
    if (!webglUniforms) return;
    const palette = isDark() ? THEME_COLORS.dark : THEME_COLORS.light;
    const target = {
        br:  new THREE.Color(palette.base).r,    bg:  new THREE.Color(palette.base).g,    bb:  new THREE.Color(palette.base).b,
        a1r: new THREE.Color(palette.accent1).r, a1g: new THREE.Color(palette.accent1).g, a1b: new THREE.Color(palette.accent1).b,
        a2r: new THREE.Color(palette.accent2).r, a2g: new THREE.Color(palette.accent2).g, a2b: new THREE.Color(palette.accent2).b
    };
    if (animate && typeof gsap !== "undefined") {
        const cur = {
            br:  webglUniforms.uColorBase.value.r,    bg:  webglUniforms.uColorBase.value.g,    bb:  webglUniforms.uColorBase.value.b,
            a1r: webglUniforms.uColorAccent1.value.r, a1g: webglUniforms.uColorAccent1.value.g, a1b: webglUniforms.uColorAccent1.value.b,
            a2r: webglUniforms.uColorAccent2.value.r, a2g: webglUniforms.uColorAccent2.value.g, a2b: webglUniforms.uColorAccent2.value.b
        };
        gsap.to(cur, {
            ...target, duration: 1.2, ease: "power2.inOut",
            onUpdate: () => {
                webglUniforms.uColorBase.value.setRGB(cur.br, cur.bg, cur.bb);
                webglUniforms.uColorAccent1.value.setRGB(cur.a1r, cur.a1g, cur.a1b);
                webglUniforms.uColorAccent2.value.setRGB(cur.a2r, cur.a2g, cur.a2b);
                if (fluidRequestRender) fluidRequestRender();
            }
        });
    } else {
        webglUniforms.uColorBase.value.set(palette.base);
        webglUniforms.uColorAccent1.value.set(palette.accent1);
        webglUniforms.uColorAccent2.value.set(palette.accent2);
        if (fluidRequestRender) fluidRequestRender();
    }
}

function setChakraTheme(animate) {
    if (!chakraMaterial) return;
    const targetHex = isDark() ? 0x2A2D32 : 0x545862;
    if (animate && typeof gsap !== "undefined" && typeof THREE !== "undefined") {
        const target = new THREE.Color(targetHex);
        const cur = { r: chakraMaterial.color.r, g: chakraMaterial.color.g, b: chakraMaterial.color.b };
        gsap.to(cur, {
            r: target.r, g: target.g, b: target.b,
            duration: 1.2, ease: "power2.inOut",
            onUpdate: () => {
                chakraMaterial.color.setRGB(cur.r, cur.g, cur.b);
                if (chakraRequestRender) chakraRequestRender();
            }
        });
    } else {
        chakraMaterial.color.set(targetHex);
        if (chakraRequestRender) chakraRequestRender();
    }
}

function toggleTheme() {
    const html = document.documentElement;
    if (isDark()) {
        html.classList.remove("dark");
        localStorage.setItem("nunik-theme", "light");
    } else {
        html.classList.add("dark");
        localStorage.setItem("nunik-theme", "dark");
    }
    applyThemeIcons();
    setWebGLTheme(true);
    setChakraTheme(true);
    applyBookingUi();
}

/* ================================================
   Main Init
   ================================================ */
document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);
    applyThemeIcons();

    document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
    document.getElementById("theme-toggle-mobile")?.addEventListener("click", toggleTheme);

    // Booking (Cal.com): the embed script and its iframe are only fetched
    // when the booking section approaches the viewport (or someone jumps to
    // #book). Keeping it out of the critical path stops it holding load.
    initBookingLazy();

    // ── Mobile nav ────────────────────────────────────
    const mobileNav = document.getElementById("mobile-nav");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    let mobileNavOpen = false;

    function closeMobileNav() {
        mobileNavOpen = false;
        mobileNav?.classList.remove("open");
        hamburgerBtn?.setAttribute("aria-expanded", "false");
    }

    hamburgerBtn?.addEventListener("click", () => {
        mobileNavOpen = !mobileNavOpen;
        mobileNav?.classList.toggle("open", mobileNavOpen);
        hamburgerBtn?.setAttribute("aria-expanded", String(mobileNavOpen));
    });

    // Close mobile nav on any link click
    mobileNav?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMobileNav);
    });

    // ── Lenis smooth scroll ───────────────────────────
    let lenis = null;
    try {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    } catch (e) {
        console.warn("Lenis failed, falling back to native scroll.", e);
    }

    // Anchor smooth scroll (generic handler, Connect overridden below)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            closeMobileNav();
            const id = this.getAttribute("href");
            if (id === "#") {
                if (lenis) lenis.scrollTo(0, { duration: 1.5 });
                else window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            const target = document.querySelector(id);
            if (!target) return;
            if (lenis) {
                lenis.scrollTo(target, { offset: -80, duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            } else {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // ── Custom cursor (desktop only) ──────────────────
    const cursor = document.getElementById("custom-cursor");
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    if (!isTouch && cursor) {
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let cursorX = mouseX, cursorY = mouseY;
        window.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        (function updateCursor() {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(updateCursor);
        })();
        document.querySelectorAll(".nav-link, a, button, .hoverable-glass").forEach(el => {
            el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
            el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
        });
        document.querySelectorAll(".cursor-project").forEach(el => {
            el.addEventListener("mouseenter", () => { cursor.classList.remove("hovering"); cursor.classList.add("view-project"); });
            el.addEventListener("mouseleave", () => { cursor.classList.remove("view-project"); });
        });
    }

    // ── Project preview modal (Archive cards) ──────────
    const projectModal = document.getElementById("project-modal");
    if (projectModal) {
        const iframe   = document.getElementById("project-modal-iframe");
        const titleEl  = document.getElementById("project-modal-title");
        const tagEl    = document.getElementById("project-modal-tag");
        const openLink = document.getElementById("project-modal-open");
        const fbLink   = document.getElementById("project-modal-fallback-link");
        const fbPanel  = document.getElementById("project-modal-fallback");
        const closeBtn = document.getElementById("project-modal-close");
        const backdrop = document.getElementById("project-modal-backdrop");

        let fbTimer = null;
        let lastFocus = null;

        function openProjectModal(card) {
            const url  = card.getAttribute("data-project-url");
            const name = card.getAttribute("data-project-name") || "Project preview";
            const tag  = card.getAttribute("data-project-tag")  || "";
            if (!url) return;
            lastFocus = document.activeElement;
            titleEl.textContent = name;
            tagEl.textContent   = tag;
            openLink.href = url;
            fbLink.href   = url;
            fbPanel.classList.add("hidden");
            iframe.src = url;
            projectModal.classList.remove("hidden");
            document.body.style.overflow = "hidden";
            if (lenis && typeof lenis.stop === "function") lenis.stop();
            // If the iframe doesn't fire a load event within 6s (likely blocked), reveal the fallback.
            clearTimeout(fbTimer);
            let loaded = false;
            iframe.addEventListener("load", () => { loaded = true; }, { once: true });
            fbTimer = setTimeout(() => { if (!loaded) fbPanel.classList.remove("hidden"); }, 6000);
            // Move focus into the modal for keyboard users.
            setTimeout(() => closeBtn.focus(), 50);
        }

        function closeProjectModal() {
            projectModal.classList.add("hidden");
            iframe.src = "about:blank";
            document.body.style.overflow = "";
            fbPanel.classList.add("hidden");
            clearTimeout(fbTimer);
            if (lenis && typeof lenis.start === "function") lenis.start();
            if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
        }

        document.querySelectorAll(".archive-card[data-project-url]").forEach(card => {
            card.addEventListener("click", (e) => {
                e.preventDefault();
                openProjectModal(card);
            });
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProjectModal(card);
                }
            });
        });

        closeBtn?.addEventListener("click", closeProjectModal);
        backdrop?.addEventListener("click", closeProjectModal);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !projectModal.classList.contains("hidden")) {
                closeProjectModal();
            }
        });
    }

    // ── Hero 3D kinetic typography (brand wordmark SVG, per-path tilt) ──
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
        const wordmarkSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="180 465 700 145" fill="currentColor" role="img" aria-label="Nunik Co. logo, AI agency in Australia" class="hero-wordmark">
  <path class="char char-swoosh" fill="var(--accent)" d="M749.4,560.9c0.9,1.4,2,2.8,2.8,4.3c9.6,17.8,23.3,30.9,43.1,36.5c12.6,3.5,25.2,3.9,37.1-2.7c5.9-3.3,10.5-8,11.9-15.1c0.8-3.8-0.1-7-2.4-10c-3.4-4.3-4.3-9.3-3.1-14.6c1.6-7.1,7.4-11.5,14.4-11c6.1,0.4,10.4,5.3,11.2,12.5c1.7,15.3-6.8,30.2-21.3,38.6c-23.2,13.4-55.2,7.9-74.2-9.6c-7.8-7.2-14.2-15.6-19.2-24.9c-0.6-1-1-2.1-1.5-3.2C748.6,561.4,749,561.2,749.4,560.9z"/>
  <path class="char char-N" d="M298.2,475v2.6c-3,0.1-5.3,0.5-6.8,1.3c-1.5,0.8-2.6,2.1-3.1,3.8c-0.5,1.8-0.8,4.3-0.8,7.5V569c-0.5,0-1,0-1.5,0c-0.5,0-1,0-1.5,0l-55.4-85.6v69.6c0,3.2,0.3,5.7,0.9,7.5c0.6,1.8,1.7,3.1,3.4,3.8c1.7,0.7,4.3,1.2,7.7,1.4v2.6c-1.6-0.2-3.6-0.3-6.2-0.3c-2.6,0-5-0.1-7.3-0.1c-2.2,0-4.4,0-6.7,0.1c-2.2,0-4.1,0.2-5.6,0.3v-2.6c3-0.2,5.3-0.6,6.8-1.4c1.5-0.7,2.6-2,3.1-3.8c0.5-1.8,0.8-4.3,0.8-7.5V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.5,0.1,3.4,0.2,5.6,0.3c2.2,0.1,4.5,0.1,6.7,0.1c1.9,0,3.8,0,5.5-0.1c1.8-0.1,3.3-0.2,4.7-0.3l46.6,71.8v-56.5c0-3.3-0.3-5.8-0.9-7.5c-0.6-1.8-1.7-3-3.4-3.8c-1.7-0.8-4.3-1.2-7.7-1.3V475c1.6,0.1,3.7,0.2,6.3,0.3c2.6,0.1,5,0.1,7.2,0.1c2.3,0,4.6,0,6.8-0.1C295,475.2,296.8,475.1,298.2,475z"/>
  <path class="char char-u" d="M389.4,475v2.6c-3,0.1-5.3,0.5-6.8,1.3c-1.5,0.8-2.6,2.1-3.1,3.8c-0.5,1.8-0.8,4.3-0.8,7.5V530c0,6.2-0.4,11.5-1.2,16.1c-0.8,4.6-2.2,8.5-4.2,11.9c-2.2,3.7-5.4,6.7-9.6,8.9c-4.2,2.2-9.1,3.4-14.5,3.4c-4.2,0-8.2-0.5-12.1-1.5s-7.2-2.9-10.1-5.6c-2.6-2.5-4.6-5.1-6-7.8c-1.5-2.7-2.4-6.1-3-10c-0.5-4-0.8-8.9-0.8-14.9V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.8,0.1,4.3,0.2,7.3,0.3c3,0.1,6.2,0.1,9.6,0.1c3.1,0,6.1,0,9.2-0.1c3-0.1,5.6-0.2,7.6-0.3v2.6c-3,0.1-5.3,0.4-6.8,1c-1.5,0.6-2.6,1.6-3.1,3.2c-0.5,1.5-0.8,3.9-0.8,7.2v43.7c0,4.5,0.2,8.7,0.7,12.7c0.4,4,1.3,7.5,2.7,10.6c1.4,3,3.5,5.4,6.3,7.1c2.8,1.7,6.5,2.6,11.2,2.6c6.7,0,11.8-1.5,15.5-4.4c3.6-2.9,6.2-7,7.7-12.2c1.5-5.2,2.2-11,2.2-17.5v-41.2c0-3.3-0.4-5.8-1.1-7.5c-0.7-1.8-2-3-3.8-3.8c-1.8-0.8-4.1-1.2-7.1-1.3V475c1.6,0.1,3.7,0.2,6.3,0.3c2.6,0.1,5,0.1,7.2,0.1c2.3,0,4.6,0,6.8-0.1C386.1,475.2,388,475.1,389.4,475z"/>
  <path class="char char-n" d="M481.3,475v2.6c-3,0.1-5.3,0.5-6.8,1.3c-1.5,0.8-2.6,2.1-3.1,3.8c-0.5,1.8-0.8,4.3-0.8,7.5V569c-0.5,0-1,0-1.5,0c-0.5,0-1,0-1.5,0l-55.4-85.6v69.6c0,3.2,0.3,5.7,0.9,7.5c0.6,1.8,1.7,3.1,3.4,3.8c1.7,0.7,4.3,1.2,7.7,1.4v2.6c-1.6-0.2-3.6-0.3-6.2-0.3c-2.6,0-5-0.1-7.3-0.1c-2.2,0-4.4,0-6.7,0.1c-2.2,0-4.1,0.2-5.6,0.3v-2.6c3-0.2,5.3-0.6,6.8-1.4c1.5-0.7,2.6-2,3.1-3.8c0.5-1.8,0.8-4.3,0.8-7.5V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.5,0.1,3.4,0.2,5.6,0.3c2.2,0.1,4.5,0.1,6.7,0.1c1.9,0,3.8,0,5.5-0.1c1.8-0.1,3.3-0.2,4.7-0.3l46.6,71.8v-56.5c0-3.3-0.3-5.8-0.9-7.5c-0.6-1.8-1.7-3-3.4-3.8c-1.7-0.8-4.3-1.2-7.7-1.3V475c1.6,0.1,3.7,0.2,6.3,0.3c2.6,0.1,5,0.1,7.2,0.1c2.3,0,4.6,0,6.8-0.1C478.1,475.2,479.9,475.1,481.3,475z"/>
  <path class="char char-i" d="M525.2,475v2.6c-3,0.1-5.3,0.4-6.8,1c-1.5,0.6-2.6,1.6-3.1,3.2c-0.5,1.5-0.8,3.9-0.8,7.2v65.4c0,3.2,0.3,5.5,0.8,7.1c0.5,1.6,1.6,2.6,3.1,3.2c1.5,0.5,3.8,0.9,6.8,1.1v2.6c-2-0.2-4.6-0.3-7.6-0.3c-3,0-6.1-0.1-9.2-0.1c-3.4,0-6.6,0-9.6,0.1c-3,0-5.4,0.2-7.3,0.3v-2.6c3-0.2,5.3-0.5,6.8-1.1c1.5-0.5,2.6-1.6,3.1-3.2c0.5-1.6,0.8-4,0.8-7.1V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.8,0.1,4.3,0.2,7.3,0.3c3,0.1,6.2,0.1,9.6,0.1c3.1,0,6.1,0,9.2-0.1C520.7,475.2,523.2,475.1,525.2,475z"/>
  <path class="char char-k" d="M570,475v2.6c-3,0.1-5.3,0.4-6.8,1c-1.5,0.6-2.6,1.6-3.1,3.2c-0.5,1.5-0.8,3.9-0.8,7.2v65.4c0,3.2,0.3,5.5,0.8,7.1c0.5,1.6,1.6,2.6,3.1,3.2c1.5,0.5,3.8,0.9,6.8,1.1v2.6c-2-0.2-4.6-0.3-7.6-0.3c-3,0-6.1-0.1-9.2-0.1c-3.4,0-6.6,0-9.6,0.1c-3,0-5.4,0.2-7.3,0.3v-2.6c3-0.2,5.3-0.5,6.8-1.1c1.5-0.5,2.6-1.6,3.1-3.2c0.5-1.6,0.8-4,0.8-7.1V489c0-3.3-0.3-5.6-0.8-7.2c-0.5-1.5-1.6-2.6-3.1-3.2c-1.5-0.6-3.8-0.9-6.8-1V475c1.8,0.1,4.3,0.2,7.3,0.3c3,0.1,6.2,0.1,9.6,0.1c3.1,0,6.1,0,9.2-0.1C565.4,475.2,567.9,475.1,570,475z M611.9,475v2.6c-2.7,0.4-5.4,1.2-7.9,2.6c-2.6,1.4-5.1,3.7-7.7,7l-25.5,32.6l2.9-6.5l31.7,44.3c1.5,2.2,3.1,3.9,4.9,5.1c1.8,1.2,4,2.2,6.7,2.9v2.6c-2.1-0.2-4.7-0.3-7.8-0.3c-3.1,0-5.8-0.1-8-0.1c-1.5,0-3.3,0-5.5,0.1c-2.2,0-4.9,0.2-8.1,0.3v-2.6c3-0.2,4.9-0.7,5.7-1.6c0.8-0.9,0.5-2.3-0.9-4.4l-19.3-29c-1.8-2.7-3.3-4.8-4.7-6.1c-1.4-1.4-2.8-2.3-4.2-2.7c-1.5-0.4-3.3-0.7-5.5-0.8v-2.6c3.7-0.1,6.8-0.8,9.3-2.2c2.5-1.4,4.6-3.1,6.3-5.2L587,495c2.9-3.7,4.9-6.8,5.9-9.4c1.1-2.5,1-4.5-0.1-5.9c-1.1-1.4-3.6-2.1-7.3-2.2V475c1.7,0.1,3.4,0.2,5.1,0.2c1.8,0,3.5,0.1,5.2,0.1c1.7,0,3.3,0.1,4.8,0.1c2.3,0,4.4,0,6.3-0.1C609,475.2,610.6,475.1,611.9,475z"/>
  <path class="char char-C" fill="var(--accent)" d="M699,473.1c5.8,0,10.6,0.9,14.3,2.6c3.7,1.7,7.1,3.7,10,6c1.8,1.3,3.1,1.5,4,0.5c0.9-1,1.6-3.4,1.9-7.2h3c-0.2,3.3-0.3,7.2-0.4,11.9c-0.1,4.7-0.1,10.8-0.1,18.5h-3c-0.6-3.8-1.2-6.8-1.7-9c-0.5-2.2-1.2-4.2-1.9-5.7c-0.7-1.6-1.7-3.2-3-4.7c-2.7-3.6-6.2-6.2-10.3-7.8c-4.1-1.6-8.5-2.4-13.1-2.4c-4.3,0-8.2,1.1-11.7,3.2c-3.5,2.2-6.5,5.3-9,9.3c-2.5,4-4.4,8.9-5.8,14.6c-1.4,5.7-2,12.1-2,19.3c0,7.4,0.7,13.9,2.2,19.6c1.5,5.7,3.6,10.4,6.3,14.3c2.7,3.9,5.8,6.8,9.5,8.8c3.6,2,7.6,3,11.8,3c4,0,8.1-0.8,12.4-2.4c4.3-1.6,7.7-4.1,10.2-7.7c1.9-2.5,3.3-5.3,4-8.3c0.7-3,1.4-7.2,2-12.5h3c0,8,0,14.4,0.1,19.3c0.1,4.9,0.2,9,0.4,12.3h-3c-0.4-3.8-0.9-6.2-1.8-7.1c-0.8-1-2.2-0.8-4.2,0.4c-3.3,2.3-6.7,4.3-10.4,6c-3.6,1.7-8.3,2.6-14,2.6c-8.4,0-15.7-1.9-22-5.7c-6.3-3.8-11.2-9.2-14.6-16.4c-3.5-7.1-5.2-15.7-5.2-25.7c0-9.8,1.8-18.5,5.4-25.9c3.6-7.4,8.6-13.1,14.8-17.3C683.5,475.2,690.8,473.1,699,473.1z"/>
  <path class="char char-o" fill="var(--accent)" d="M789.7,473.1c8.4,0,15.7,1.9,22,5.7c6.3,3.8,11.2,9.2,14.6,16.3c3.5,7.1,5.2,15.7,5.2,25.8c0,9.8-1.8,18.5-5.3,25.9c-3.6,7.4-8.5,13.1-14.8,17.3c-6.3,4.1-13.6,6.2-21.8,6.2c-8.4,0-15.7-1.9-22-5.7c-6.3-3.8-11.2-9.2-14.6-16.4c-3.5-7.1-5.2-15.7-5.2-25.7c0-9.8,1.8-18.5,5.4-25.9c3.6-7.4,8.6-13.1,14.8-17.3C774.3,475.2,781.5,473.1,789.7,473.1z M789.2,475.5c-5.7,0-10.7,2-14.9,5.9c-4.2,4-7.5,9.4-9.8,16.4c-2.3,6.9-3.5,15-3.5,24.1c0,9.3,1.3,17.4,3.9,24.3c2.6,6.9,6.1,12.2,10.6,16c4.4,3.7,9.3,5.6,14.7,5.6c5.7,0,10.7-2,14.9-5.9c4.2-4,7.5-9.4,9.8-16.4c2.3-7,3.5-15,3.5-24.1c0-9.4-1.3-17.5-3.9-24.4c-2.6-6.9-6.1-12.2-10.5-15.9C799.6,477.4,794.6,475.5,789.2,475.5z"/>
  <path class="char char-dot" fill="var(--accent)" d="M852.4,553.3c2.3,0,4.3,0.8,5.9,2.5c1.7,1.7,2.5,3.7,2.5,5.9c0,2.3-0.8,4.3-2.5,5.9c-1.7,1.7-3.6,2.5-5.9,2.5c-2.3,0-4.3-0.8-5.9-2.5c-1.7-1.7-2.5-3.6-2.5-5.9c0-2.3,0.8-4.3,2.5-5.9C848.1,554.2,850.1,553.3,852.4,553.3z"/>
</svg>`;
        heroTitle.innerHTML = wordmarkSVG;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!isTouch && !prefersReducedMotion) {
            const chars = heroTitle.querySelectorAll(".char");
            heroTitle.addEventListener("mousemove", (e) => {
                heroTitle.style.animationPlayState = "paused";
                const rect = heroTitle.getBoundingClientRect();
                const nx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
                const ny = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
                chars.forEach((char, i) => {
                    const cr = char.getBoundingClientRect();
                    const dx = (e.clientX - (cr.left + cr.width / 2)) / rect.width;
                    const dy = (e.clientY - (cr.top + cr.height / 2)) / rect.height;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    gsap.to(char, {
                        x: nx * -30 * (1 - i / chars.length),
                        y: ny * 15,
                        z: Math.max(0, 1 - dist * 2) * 80,
                        rotateX: ny * -8,
                        rotateY: nx * 12,
                        duration: 0.6,
                        ease: "power2.out"
                    });
                });
            });
            heroTitle.addEventListener("mouseleave", () => {
                heroTitle.style.animationPlayState = "running";
                gsap.to(chars, { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, duration: 1.2, ease: "elastic.out(1, 0.4)" });
            });
        }
    }

    // ── Scroll-triggered typographic header lockup ────
    const brandLockup = document.querySelector(".brand-lockup");
    const heroSection = document.querySelector("section.min-h-screen");
    if (brandLockup && heroSection) {
        ScrollTrigger.create({
            trigger: heroSection,
            start: "bottom 85%",
            end: "bottom top",
            onEnter:     () => brandLockup.classList.remove("is-hidden"),
            onLeaveBack: () => brandLockup.classList.add("is-hidden"),
        });

        if (!isTouch) {
            const brandType = brandLockup.querySelector(".brand-type");
            brandLockup.addEventListener("mousemove", (e) => {
                const r = brandLockup.getBoundingClientRect();
                const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
                const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2);
                gsap.to(brandType, {
                    rotateX: ny * -10,
                    rotateY: nx * 14,
                    duration: 0.5,
                    ease: "power2.out",
                });
            });
            brandLockup.addEventListener("mouseleave", () => {
                gsap.to(brandType, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
            });
        }
    }

    // ── ScrollTrigger reveals ─────────────────────────
    document.querySelectorAll(".reveal-container").forEach(container => {
        const items = container.querySelectorAll(".reveal-item");
        gsap.set(items, { y: 60, opacity: 0 });
        ScrollTrigger.create({
            trigger: container,
            start: "top 88%",
            onEnter: () => gsap.to(items, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }),
            once: true
        });
    });

    // ── Parallax imagery ──────────────────────────────
    document.querySelectorAll(".parallax-img").forEach(img => {
        gsap.to(img, {
            yPercent: 20, ease: "none",
            scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
        });
    });

    // ── Enquiry form ──────────────────────────────────
    const initiateBtn = document.getElementById("initiate-btn");
    const contactExpansion = document.getElementById("contact-expansion");
    const terminalForm = document.getElementById("terminal-form");
    const leadFlow = terminalForm ? initLeadFlow(terminalForm) : null;

    function goToForm() {
        if (!contactExpansion) return;
        if (lenis) lenis.scrollTo(contactExpansion, { duration: 1.4, offset: -96 });
        else contactExpansion.scrollIntoView({ behavior: "smooth", block: "start" });
        if (leadFlow) setTimeout(() => leadFlow.focus(), 1500);
    }

    // Home page: the floating button and the Connect links go straight to
    // the first question. Subpages keep the button as a plain link to #book.
    initiateBtn?.addEventListener("click", (e) => {
        if (!contactExpansion) return;
        e.preventDefault();
        goToForm();
    });
    initiateBtn?.addEventListener("keydown", (e) => {
        if (!contactExpansion || e.target !== initiateBtn || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        goToForm();
    });

    // Hide Initiate button when the footer scrolls into view.
    // Home page has <footer id="connect">; subpages just have <footer>.
    // Falling back to <footer> keeps the rule active on every page.
    const initiateFooterTrigger =
        document.getElementById("connect") ||
        document.querySelector("footer");
    if (initiateFooterTrigger && initiateBtn) {
        const footerObs = new IntersectionObserver(
            ([entry]) => initiateBtn.classList.toggle("footer-visible", entry.isIntersecting),
            { threshold: 0.06 }
        );
        footerObs.observe(initiateFooterTrigger);
    }

    document.querySelectorAll('a[href="#connect"]').forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            closeMobileNav();
            if (contactExpansion) goToForm();
            else document.querySelector("#connect")?.scrollIntoView({ behavior: "smooth" });
        });
    });

    // ── Launch WebGL systems ──────────────────────────
    // three.min.js is preloaded from <head> so the bytes arrive during HTML
    // parse. It is executed only after the hero has painted (double rAF), so
    // the fluid appears within a frame or two of first paint without ever
    // sitting in front of the LCP element.
    let threeInited = false;
    function tryInitThreeScene() {
        if (threeInited) return;
        if (typeof THREE === "undefined") return;
        threeInited = true;
        initWebGLBackground(lenis);
        const chakraLater = () => initChakraBackground(lenis);
        if ("requestIdleCallback" in window) requestIdleCallback(chakraLater, { timeout: 600 });
        else setTimeout(chakraLater, 120);
    }
    window.initThreeScene = tryInitThreeScene;
    tryInitThreeScene();

    if (!threeInited) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (threeInited || typeof THREE !== "undefined") { tryInitThreeScene(); return; }
            const s = document.createElement("script");
            s.src = THREE_SRC;
            s.onload = tryInitThreeScene;
            document.head.appendChild(s);
        }));
    }
});

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const REDUCED_MOTION = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Marks a background container as live once its first frame has rendered,
   which lets the CSS fade the canvas in over the static gradient. */
function markLive(container, name) {
    requestAnimationFrame(() => {
        container.classList.add("is-live");
        if (window.performance && performance.mark) performance.mark("nunik:" + name + "-first-frame");
    });
}

/* ================================================
   Fluid WebGL Background (original GLSL shader)
   ================================================ */
function initWebGLBackground(lenis) {
    const container = document.getElementById("webgl-background");
    if (!container) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // The noise field is low frequency and sits behind frosted sections, so
    // rendering at 1x is indistinguishable from 2x and costs a quarter as much.
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const palette = isDark() ? THEME_COLORS.dark : THEME_COLORS.light;
    const uniforms = {
        uTime:         { value: 0.0 },
        uScroll:       { value: 0.0 },
        uColorBase:    { value: new THREE.Color(palette.base) },
        uColorAccent1: { value: new THREE.Color(palette.accent1) },
        uColorAccent2: { value: new THREE.Color(palette.accent2) }
    };
    webglUniforms = uniforms;

    const vertexShader = `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform vec3  uColorBase;
        uniform vec3  uColorAccent1;
        uniform vec3  uColorAccent2;
        uniform float uScroll;
        varying vec2  vUv;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p  = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
            vec3 m  = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m; m = m*m;
            vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
            vec3 h  = abs(x_) - 0.5;
            vec3 ox = floor(x_ + 0.5);
            vec3 a0 = x_ - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x   + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2  uv   = vUv;
            float time = uTime * 0.025 + uScroll * 0.001;
            vec2  np   = uv * 2.0;
            float n1 = snoise(np + vec2(time, time * 0.5));
            float n2 = snoise(np * 2.0 - vec2(time * 0.8, time * 1.2));
            float n3 = snoise(np * 4.0 + vec2(time * 2.0, time));
            float cn = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
            vec3  color = mix(uColorBase, uColorAccent2, cn * 0.6);
            float sn    = snoise(uv * 3.0 + vec2(-time, time));
            color = mix(color, uColorAccent1, smoothstep(0.7, 1.0, cn * sn));
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    );
    scene.add(mesh);

    let currentScroll = 0;
    if (lenis) lenis.on("scroll", (e) => { currentScroll = e.animatedScroll; });

    const clock = new THREE.Clock();
    const renderFrame = () => {
        uniforms.uTime.value   = clock.getElapsedTime();
        uniforms.uScroll.value += (currentScroll - uniforms.uScroll.value) * 0.1;
        renderer.render(scene, camera);
    };

    renderFrame();
    markLive(container, "fluid");
    // Theme changes ask for a frame directly whenever the loop is not
    // running (reduced motion, or the tab is hidden), so the palette is
    // never stale when the page next paints.
    let running = false;
    fluidRequestRender = () => { if (!running) renderFrame(); };

    if (!REDUCED_MOTION) {
        const loop = () => {
            if (document.hidden) { running = false; return; }
            renderFrame();
            requestAnimationFrame(loop);
        };
        const startLoop = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
        startLoop();
        document.addEventListener("visibilitychange", () => { if (!document.hidden) startLoop(); });
    }

    window.addEventListener("resize", () => {
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (REDUCED_MOTION) renderFrame();
    });
}

/* ================================================
   3D Sudarshana Chakra, scroll-driven traversal
   ================================================ */
function initChakraBackground(lenis) {
    const container = document.getElementById("chakra-canvas");
    if (!container) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const chakraDPR = () => Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(chakraDPR());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Material
    chakraMaterial = new THREE.MeshStandardMaterial({
        color: isDark() ? 0x2A2D32 : 0x545862,
        metalness: 0.9,
        roughness: 0.3
    });

    // 3-point lighting
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    keyLight.position.set(5, 8, 3);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
    rimLight.position.set(-3, -2, -5);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.15));

    // Build the chakra as ONE merged geometry (hub, 6 rings, 108 teeth,
    // 12 petals). Same shapes and placement as the original compound group,
    // but a single draw call instead of 127 and one buffer upload.
    const parts = [];
    const pushPart = (geo, matrix) => {
        const g = geo.toNonIndexed();
        g.applyMatrix4(matrix);
        parts.push(g);
    };
    const m = new THREE.Matrix4();

    pushPart(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8), m.makeRotationX(Math.PI / 2));

    const ringGeos = [];
    for (let i = 1; i <= 6; i++) {
        const geo = new THREE.TorusGeometry(0.2 + i * 0.15, 0.015, 16, 64);
        ringGeos.push(geo);
        pushPart(geo, m.makeRotationX(Math.PI / 2));
    }

    const toothGeo = new THREE.ConeGeometry(0.03, 0.12, 3);
    for (let i = 0; i < 108; i++) {
        const angle = (i / 108) * Math.PI * 2;
        m.makeRotationZ(angle + Math.PI / 2);
        m.setPosition(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0);
        pushPart(toothGeo, m);
    }

    const petalGeo = new THREE.BoxGeometry(0.05, 0.25, 0.01);
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        m.makeRotationZ(angle);
        m.setPosition(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, 0);
        pushPart(petalGeo, m);
    }

    let vertexCount = 0;
    parts.forEach((g) => { vertexCount += g.attributes.position.count; });
    const positions = new Float32Array(vertexCount * 3);
    const normals   = new Float32Array(vertexCount * 3);
    let offset = 0;
    parts.forEach((g) => {
        positions.set(g.attributes.position.array, offset);
        normals.set(g.attributes.normal.array, offset);
        offset += g.attributes.position.array.length;
        g.dispose();
    });
    ringGeos.forEach((g) => g.dispose());
    toothGeo.dispose();
    petalGeo.dispose();

    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    merged.setAttribute("normal",   new THREE.BufferAttribute(normals, 3));

    const chakraGroup = new THREE.Mesh(merged, chakraMaterial);
    scene.add(chakraGroup);

    // Scroll-driven waypoints (normalised 0-1 scroll progress)
    // x/y in Three.js world units, s = scale, rx = rotation.x tilt
    const waypoints = [
        { t: 0.00, x:  1.5,  y:  0.3,  s: 1.4, rx: 0.08 },  // Hero: right
        { t: 0.12, x: -2.4,  y:  0.1,  s: 1.2, rx: 0.15 },  // Philosophy: far left
        { t: 0.27, x:  0.0,  y:  0.0,  s: 2.2, rx: 0.22 },  // Yukti: centre, zoomed
        { t: 0.42, x:  2.4,  y: -0.2,  s: 1.3, rx: 0.05 },  // Rasa: far right
        { t: 0.57, x: -2.0,  y:  0.2,  s: 1.6, rx: 0.18 },  // Artha: left
        { t: 0.72, x:  1.0,  y: -0.3,  s: 1.0, rx: 0.08 },  // Archive: right-ish
        { t: 0.87, x: -0.4,  y:  0.2,  s: 1.2, rx: 0.12 },  // Research: centre-left
        { t: 1.00, x:  0.0,  y:  0.0,  s: 1.1, rx: 0.10 },  // Connect: centre
    ];

    // Lerp state
    let curX = waypoints[0].x, curY = waypoints[0].y, curS = waypoints[0].s, curRx = waypoints[0].rx;
    let tgtX = curX, tgtY = curY, tgtS = curS, tgtRx = curRx;
    let spinTarget = 0, spinCurrent = 0;

    if (lenis) {
        lenis.on("scroll", (e) => {
            const sp = e.animatedScroll / Math.max(1, document.body.scrollHeight - window.innerHeight);
            spinTarget = sp * Math.PI * 4; // 720° total

            // Find and interpolate between waypoints
            let from = waypoints[0], to = waypoints[waypoints.length - 1];
            for (let i = 0; i < waypoints.length - 1; i++) {
                if (sp >= waypoints[i].t && sp <= waypoints[i + 1].t) {
                    from = waypoints[i]; to = waypoints[i + 1]; break;
                }
            }
            const range = to.t - from.t;
            const rawT  = range > 0 ? (sp - from.t) / range : 0;
            const t     = rawT * rawT * (3 - 2 * rawT); // smoothstep

            tgtX  = from.x  + (to.x  - from.x)  * t;
            tgtY  = from.y  + (to.y  - from.y)  * t;
            tgtS  = from.s  + (to.s  - from.s)  * t;
            tgtRx = from.rx + (to.rx - from.rx) * t;
        });
    }

    const applyTransform = () => {
        chakraGroup.position.set(curX, curY, 0);
        chakraGroup.scale.setScalar(curS);
        chakraGroup.rotation.x = curRx;
        chakraGroup.rotation.z = spinCurrent;
    };
    const renderFrame = () => { applyTransform(); renderer.render(scene, camera); };

    renderFrame();
    markLive(container, "chakra");

    // Theme tweens change the material without moving anything, so they
    // flag a frame explicitly (the loop below otherwise skips idle frames).
    let dirty = false;
    let running = false;
    chakraRequestRender = () => {
        dirty = true;
        if (!running) { dirty = false; renderFrame(); }
    };

    if (REDUCED_MOTION) {
        // No spin, no lerp: snap to the scroll waypoint and render once per scroll event.
        if (lenis) {
            let pending = false;
            lenis.on("scroll", () => {
                curX = tgtX; curY = tgtY; curS = tgtS; curRx = tgtRx;
                if (pending) return;
                pending = true;
                requestAnimationFrame(() => { pending = false; renderFrame(); });
            });
        }
    } else {
        // Render loop with lerp. Skips the GPU when nothing is moving; the
        // chakra only changes on scroll, so most idle frames cost nothing.
        const lf = 0.04;
        const EPS = 1e-4;
        const loop = () => {
            if (document.hidden) { running = false; return; }
            requestAnimationFrame(loop);
            const dx = (tgtX - curX) * lf, dy = (tgtY - curY) * lf;
            const ds = (tgtS - curS) * lf, dr = (tgtRx - curRx) * lf;
            const dspin = (spinTarget - spinCurrent) * 0.06;
            const moving = Math.abs(dx) > EPS || Math.abs(dy) > EPS || Math.abs(ds) > EPS ||
                           Math.abs(dr) > EPS || Math.abs(dspin) > EPS;
            if (!moving && !dirty) return;
            dirty = false;
            curX += dx; curY += dy; curS += ds; curRx += dr; spinCurrent += dspin;
            renderFrame();
        };
        const startLoop = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
        startLoop();
        document.addEventListener("visibilitychange", () => { if (!document.hidden) startLoop(); });
    }

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(chakraDPR());
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderFrame();
    });
}
