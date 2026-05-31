(function(){

  const HOMEPAGE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxANCb36uNhFqZcVjXvz0sb_8dU4aT5eO2fWLRvfc8esffNTyEyDM7OeViGHUahv1aE/exec";
  const APPLY_SHEETS_URL    = "https://script.google.com/macros/s/AKfycbzZvOWN-MuQNXG73e2kcpYS0QgcYiVWctrWia9B4qwvDhVE_A2qXUaIJb80mNQ66nwk/exec";
  const DEFAULT_NBC_URL     = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";

  let pendingCorneliaLead = null;
  let isSubmitting = false;
  let leadSent = false; // prevents sending twice

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
    // Collect ONLY the fields that exist in the sheet
    // Apply page: fullName, title, businessName, industry, email, phone, annualRevenue, timeInBusiness, creditScore, fundingNeed
    // Homepage: fullName, businessName, annualRevenue, industry, fundingNeed, phone, email
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
    // Only send once per submission
    if(leadSent) return Promise.resolve();
    leadSent = true;
    saveLeadToLocalBackup(lead);
    const url = lead.formType === 'apply' ? APPLY_SHEETS_URL : HOMEPAGE_SHEETS_URL;
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

  function updateAllFields(){
    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea,input,select,textarea').forEach(updateFieldState);
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

    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea,input,select,textarea').forEach(function(el){
      updateFieldState(el);
      ['input','change','blur','keyup'].forEach(function(evt){
        el.addEventListener(evt, function(){ updateFieldState(el); });
      });
    });

    // Deduplicate form binding using Set
    var seenForms = new Set();
    document.querySelectorAll('form.lead-form, form#applyLeadForm').forEach(function(form){
      if(seenForms.has(form)) return;
      seenForms.add(form);

      form.addEventListener('submit', function(e){
        e.preventDefault();
        e.stopPropagation();
        if(isSubmitting) return;
        isSubmitting = true;
        leadSent = false; // reset for new submission

        pendingCorneliaLead = collectLead(form);

        if(!showConsentModal()){
          sendLeadToGoogleSheet(pendingCorneliaLead).finally(function(){
            isSubmitting = false;
            redirectToPartner();
          });
          setTimeout(redirectToPartner, 1800);
        }
      });
    });

    setTimeout(updateAllFields, 250);
    setTimeout(updateAllFields, 1000);
  });

  window.completeLead = function(){
    const consent = document.getElementById('marketingConsent');
    if(consent && !consent.checked){
      alert('Please check the box to confirm consent before continuing.');
      return;
    }

    if(!pendingCorneliaLead || (!pendingCorneliaLead.email && !pendingCorneliaLead.phone)){
      const form = document.querySelector('form#applyLeadForm, form.lead-form, form');
      pendingCorneliaLead = form ? collectLead(form) : {
        formType:  isApplyPage() ? 'apply' : 'lead',
        source:    isApplyPage() ? 'Apply Page' : 'Cornelia Website',
        createdAt: new Date().toISOString()
      };
    }

    // Send once only — leadSent flag prevents second send
    sendLeadToGoogleSheet(pendingCorneliaLead).finally(function(){
      isSubmitting = false;
      redirectToPartner();
    });
    setTimeout(redirectToPartner, 1800);
  };

  window.goPartner = function(e){
    if(e) e.preventDefault();
    if(isApplyPage()){
      const form = document.querySelector('form#applyLeadForm, form.lead-form, form');
      if(form){ form.scrollIntoView({behavior:'smooth', block:'center'}); return false; }
    }
    window.location.href = 'apply.html';
    return false;
  };

})();
