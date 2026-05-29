let pendingLeadData = null;
let pendingForm = null;

function formToLeadData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.formType = form.dataset.formType || "lead";
  data.source = form.dataset.source || (data.formType === "apply" ? "Apply Page" : "Cornelia Website");
  data.submittedAt = new Date().toISOString();
  return data;
}

function openConsentModal() {
  const modal = document.getElementById("consentModal");
  const checkbox = document.getElementById("marketingConsent");
  if (checkbox) checkbox.checked = false;
  if (modal) modal.classList.add("show");
}

function closeConsentModal() {
  const modal = document.getElementById("consentModal");
  if (modal) modal.classList.remove("show");
}

async function sendLeadToGoogleSheet(leadData) {
  const savedLeads = JSON.parse(localStorage.getItem("corneliaLeads") || "[]");
  savedLeads.push(leadData);
  localStorage.setItem("corneliaLeads", JSON.stringify(savedLeads));

  if (!LEAD_CAPTURE_ENDPOINT || LEAD_CAPTURE_ENDPOINT.includes("PASTE_")) {
    console.warn("Lead endpoint missing. Lead saved locally only.");
    return;
  }

  // Using text/plain + no-cors helps avoid browser CORS/preflight issues with Google Apps Script.
  await fetch(LEAD_CAPTURE_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(leadData)
  });
}

async function completeLead() {
  if (!pendingLeadData) return;

  const consentChecked = document.getElementById("marketingConsent")?.checked;
  pendingLeadData.marketingConsent = consentChecked ? "Yes" : "No";

  const clickedButton = document.querySelector("#consentModal button");
  if (clickedButton) {
    clickedButton.disabled = true;
    clickedButton.textContent = "Submitting...";
  }

  try {
    await sendLeadToGoogleSheet(pendingLeadData);
    closeConsentModal();
    if (pendingForm) pendingForm.reset();

    // Redirect only after the lead capture request has been sent.
    if (NBC_REFERRAL_LINK && !NBC_REFERRAL_LINK.includes("PASTE_")) {
      window.location.href = NBC_REFERRAL_LINK;
    } else {
      alert("Your information was submitted. Add your NBC tracking link in config.js before publishing.");
    }
  } catch (error) {
    console.error("Lead capture failed:", error);
    alert("The form could not be submitted. Please try again.");
  } finally {
    if (clickedButton) {
      clickedButton.disabled = false;
      clickedButton.textContent = "Continue to Partner Financing Page";
    }
    pendingLeadData = null;
    pendingForm = null;
  }
}

document.addEventListener("submit", function(event) {
  const form = event.target;
  if (!form.matches("form")) return;

  event.preventDefault();
  pendingForm = form;
  pendingLeadData = formToLeadData(form);
  openConsentModal();
});

window.completeLead = completeLead;
