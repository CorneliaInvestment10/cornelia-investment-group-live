(function(){

  const HOMEPAGE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxANCb36uNhFqZcVjXvz0sb_8dU4aT5eO2fWLRvfc8esffNTyEyDM7OeViGHUahv1aE/exec";
  const APPLY_SHEETS_URL    = "https://script.google.com/macros/s/AKfycbzZvOWN-MuQNXG73e2kcpYS0QgcYiVWctrWia9B4qwvDhVE_A2qXUaIJb80mNQ66nwk/exec";
  const DEFAULT_NBC_URL     = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";

  let isSubmitting = false;
  let leadSent = false;

  function partnerUrl(){
    return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || DEFAULT_NBC_URL;
  }

  function currentPage(){
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function isApplyPage(){
    return currentPage().toLowerCase().includes('apply');
  }

  function valueFrom(form, names){
    for(const name of names){
      const byName = form ? form.querySelector('[name="' + name + '"]') : null;
      if(byName && String(byName.value || '').trim()) return String(byName.value || '').trim();
      const byId = document.getElementById(name);
      if(byId && String(byId.value || '').trim()) return String(byId.value || '').trim();
    }
    return '';
  }

  function collectLead(form){
    return {
      formType:       isApplyPage() ? 'apply' : 'lead',
      fullName:       valueFrom(form, ['fullName','homeFullName']),
      title:          valueFrom(form, ['title','jobTitle']),
      businessName:   valueFrom(form, ['businessName','homeBusinessName']),
      industry:       valueFrom(form, ['industry','homeIndustry']),
      email:          valueFrom(form, ['email','homeEmail']),
      phone:          valueFrom(form, ['phone','homePhone']),
      annualRevenue:  valueFrom(form, ['annualRevenue','homeAnnualRevenue']),
      timeInBusiness: valueFrom(form, ['timeInBusiness']),
      creditScore:    valueFrom(form, ['creditScore']),
      fundingNeed:    valueFrom(form, ['fundingNeed','financingNeed','homeFundingNeed']),
      source:         isApplyPage() ? 'Apply Page' : 'Cornelia Website',
      createdAt:      new Date().toISOString()
    };
  }

  function saveLeadToLocalBackup(lead){
    try{
      const leads = JSON.parse(localStorage.getItem('corneliaLeads') || '[]');
      leads.push(lead);
      localStorage.setItem('corneliaLeads', JSON.stringify(leads));
    }catch(e){}
  }

  function sendLeadToGoogleSheet(lead){
    if(leadSent) return Promise.resolve();
    leadSent = true;
    saveLeadToLocalBackup(lead);
    const url = (lead.formType === 'apply') ? APPLY_SHEETS_URL : HOMEPAGE_SHEETS_URL;
    try{
      return fetch(url, {
        method: 'POST',
        mode:   'no-cors',
        headers:{ 'Content-Type': 'text/plain;charset=utf-8' },
        body:   JSON.stringify(lead)
      });
    }catch(e){
      return Promise.resolve();
    }
  }

  function redirectToPartner(){
    window.location.href = partnerUrl();
  }

  function updateFieldState(el){
    if(!el) return;
    el.classList.toggle('has-value', String(el.value || '').trim().length > 0);
  }

  function showConsentModal(){
    const modal = document.getElementById('consentModal');
    if(modal){
      modal.style.display = 'flex';
      modal.classList.add('show');
      return true;
    }
    return false;
  }

  document.addEventListener('DOMContentLoaded', function(){

    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea').forEach(function(el){
      updateFieldState(el);
      ['input','change','blur','keyup'].forEach(function(evt){
        el.addEventListener(evt, function(){ updateFieldState(el); });
      });
    });

    // Desktop forms only
    var seenForms = new Set();
    document.querySelectorAll('form.lead-form, form#applyLeadForm, form#deskApplyForm').forEach(function(form){
      if(seenForms.has(form)) return;
      seenForms.add(form);

      form.addEventListener('submit', function(e){
        e.preventDefault();
        e.stopPropagation();
        if(isSubmitting) return;
        isSubmitting = true;
        leadSent = false;

        window.pendingCorneliaLead = collectLead(form);

        if(!showConsentModal()){
          sendLeadToGoogleSheet(window.pendingCorneliaLead).finally(function(){
            isSubmitting = false;
            redirectToPartner();
          });
          setTimeout(redirectToPartner, 1800);
        }
      });
    });
  });

  // completeLead — called by consent modal button
  // Works for both desktop and mobile forms
  // Mobile forms set window.pendingCorneliaLead directly in their inline script
  window.completeLead = function(){
    const consent = document.getElementById('marketingConsent');
    if(consent && !consent.checked){
      alert('Please check the box to confirm consent before continuing.');
      return;
    }

    // Use pendingCorneliaLead set by either desktop or mobile form
    var lead = window.pendingCorneliaLead;

    // Fallback — try to read from desktop form if no mobile lead set
    if(!lead || (!lead.email && !lead.phone)){
      const form = document.querySelector('form#deskApplyForm, form#applyLeadForm, form.lead-form');
      if(form){
        lead = collectLead(form);
        window.pendingCorneliaLead = lead;
      }
    }

    if(!lead){ lead = { formType: isApplyPage() ? 'apply' : 'lead', source: isApplyPage() ? 'Apply Page' : 'Cornelia Website', createdAt: new Date().toISOString() }; }

    leadSent = false; // allow send
    sendLeadToGoogleSheet(lead).finally(function(){
      isSubmitting = false;
      redirectToPartner();
    });
    setTimeout(redirectToPartner, 1800);
  };

  window.goPartner = function(e){
    if(e) e.preventDefault();
    window.location.href = 'apply.html';
    return false;
  };

})();
