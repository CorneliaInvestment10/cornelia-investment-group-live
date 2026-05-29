// Cornelia Investment Group lead capture + NBC redirect
// Saves lead details to Google Sheets silently, then sends visitor to the NBC tracked link.

const CORNELIA_LEAD_CAPTURE_URL = "https://script.google.com/macros/s/AKfycbxf90vmr1o02vcsPFGTXAAzLvubdNTnqfjh_MmSdYbEU-bO6QEwVx8apiBKgQAnq1moCQ/exec";
const CORNELIA_NBC_REDIRECT_URL = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";

function getValue(id, fallbackName) {
  const byId = document.getElementById(id);
  if (byId) return byId.value || "";
  if (fallbackName) {
    const byName = document.querySelector(`[name="${fallbackName}"]`);
    if (byName) return byName.value || "";
  }
  return "";
}

function collectCorneliaLead(form) {
  const page = window.location.pathname.split("/").pop() || "index.html";

  return {
    fullName: getValue("homeFullName", "fullName") || getValue("fullName"),
    businessName: getValue("homeBusinessName", "businessName") || getValue("businessName"),
    annualRevenue: getValue("homeAnnualRevenue", "annualRevenue") || getValue("annualRevenue"),
    industry: getValue("homeIndustry", "industry") || getValue("industry"),
    fundingNeed: getValue("homeFundingNeed", "fundingNeed") || getValue("fundingNeed"),
    phone: getValue("homePhone", "phone") || getValue("phone"),
    email: getValue("homeEmail", "email") || getValue("email"),
    pageSource: page,
    referralLink: CORNELIA_NBC_REDIRECT_URL
  };
}

function saveLeadThenRedirect(form) {
  const lead = collectCorneliaLead(form);

  try {
    fetch(CORNELIA_LEAD_CAPTURE_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(lead)
    }).finally(function () {
      window.location.href = CORNELIA_NBC_REDIRECT_URL;
    });

    setTimeout(function () {
      window.location.href = CORNELIA_NBC_REDIRECT_URL;
    }, 1200);
  } catch (error) {
    window.location.href = CORNELIA_NBC_REDIRECT_URL;
  }
}

function goPartner(event) {
  if (event) event.preventDefault();

  const page = window.location.pathname.split("/").pop() || "index.html";

  if (page === "apply.html") {
    const form = document.getElementById("leadForm") || document.getElementById("homeLeadForm") || document.querySelector("form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
  }

  window.location.href = "apply.html";
  return false;
}

function markSelectValue(select) {
  if (!select) return;
  if (select.value) {
    select.classList.add("has-value");
  } else {
    select.classList.remove("has-value");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("select").forEach(function (select) {
    markSelectValue(select);
    select.addEventListener("change", function () {
      markSelectValue(select);
    });
  });

  document.querySelectorAll("form").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      saveLeadThenRedirect(form);
    });
  });
});
