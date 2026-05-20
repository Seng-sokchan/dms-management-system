(function () {
  var STORAGE_KEY = "dms-download-lang";

  var strings = {
    en: {
      metaDescription:
        "Download DMS Mobile — the Distribution Management System app for Android.",
      pageTitle: "DMS Mobile — Download",
      iconAlt: "DMS Mobile app icon",
      subtitle: "Distribution Management System — field app for Android",
      version: "Version 0.0.1",
      platform: "Android",
      download: "Download APK",
      installHeading: "Install on Android",
      step1: "Download the APK using the button above.",
      step2:
        'If prompted, allow installs from your browser or file manager (<strong>Install unknown apps</strong>).',
      step3: 'Open the downloaded file and tap <strong>Install</strong>.',
      step4: "Launch <strong>DMS Mobile</strong> and sign in with your account.",
      note:
        "The APK file must be built and copied to this folder before the download link works. See <code>website/README.md</code> for build instructions.",
    },
    km: {
      metaDescription:
        "ទាញយក DMS Mobile — កម្មវិធីប្រព័ន្ធគ្រប់គ្រងការចែកចាយសម្រាប់ Android។",
      pageTitle: "DMS Mobile — ទាញយក",
      iconAlt: "រូបតំណាងកម្មវិធី DMS Mobile",
      subtitle: "បញ្ជាទិញអតិថិជន និងតាមដានការដឹកជញ្ជូន",
      version: "កំណែ 0.0.1",
      platform: "Android",
      download: "ទាញយក APK",
      installHeading: "ដំឡើងនៅលើ Android",
      step1: "ទាញយក APK ដោយប្រើប៊ូតុងខាងលើ។",
      step2:
        "ប្រសិនបើមានសារសួរ សូមអនុញ្ញាតការដំឡើងពីកម្មវិធីរុករក ឬគ្រប់គ្រងឯកសារ (<strong>ដំឡើងកម្មវិធីមិនស្គាល់</strong>)។",
      step3: "បើកឯកសារដែលបានទាញយក ហើយចុច <strong>ដំឡើង</strong>។",
      step4: "បើក <strong>DMS Mobile</strong> ហើយចូលដោយប្រើគណនីរបស់អ្នក។",
      note:
        "ឯកសារ APK ត្រូវបានបង្កើត និងចម្លងមកថតនេះមុនពេលតំណទាញយកដំណើរការ។ សូមមើល <code>website/README.md</code> សម្រាប់ព័ត៌មានបង្កើត។",
    },
  };

  function getLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "km") return saved;
    var browser = (navigator.language || "").toLowerCase();
    return browser.indexOf("km") === 0 ? "km" : "en";
  }

  function setLang(lang) {
    var t = strings[lang];
    if (!t) return;

    document.documentElement.lang = lang;
    document.documentElement.classList.toggle("lang-km", lang === "km");

    document.title = t.pageTitle;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t.metaDescription);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-alt");
      if (t[key] !== undefined) {
        el.setAttribute("alt", t[key]);
      }
    });

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    localStorage.setItem(STORAGE_KEY, lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var lang = getLang();
    setLang(lang);

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
  });
})();
