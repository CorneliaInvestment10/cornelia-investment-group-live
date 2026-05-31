(function(){

  const HOMEPAGE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxANCb36uNhFqZcVjXvz0sb_8dU4aT5eO2fWLRvfc8esffNTyEyDM7OeViGHUahv1aE/exec";
  const APPLY_SHEETS_URL    = "https://script.google.com/macros/s/AKfycbzbFgdmiiZQ9wkU-M3Y_fnrxePf7MPemKf7uHWXANe3Aaf_7pl0IFNj_r4clV-yWWPm/exec";
  const DEFAULT_NBC_URL     = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";

  let pendingCorneliaLead = null;
  let isSubmitting = false; // ← prevents double submission

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
      formType:        isApplyPage() ? 'apply' : 'lead',
      fullName:        valueFrom(form, ['fullName','homeFullName','appFullName']),
      title:           valueFrom(form, ['title','jobTitle']),
      businessName:    valueFrom(form, ['businessName','homeBusinessName','appBusinessName']),
      annualRevenue:   valueFrom(form, ['annualRevenue','homeAnnualRevenue']),
      industry:        valueFrom(form, ['industry','homeIndustry']),
      fundingNeed:     valueFrom(form, ['fundingNeed','financingNeed','homeFundingNeed']),
      phone:           valueFrom(form, ['phone','homePhone']),
      email:           valueFrom(form, ['email','homeEmail']),
      timeInBusiness:  valueFrom(form, ['timeInBusiness']),
      creditScore:     valueFrom(form, ['creditScore']),
      source:          isApplyPage() ? 'Apply Page' : 'Cornelia Website',
      pageSource:      currentPage(),
      marketingConsent:'Yes',
      referralLink:    partnerUrl(),
      createdAt:       new Date().toISOString()
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

    // Live field state tracking
    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea,input,select,textarea').forEach(function(el){
      updateFieldState(el);
      ['input','change','blur','keyup'].forEach(function(evt){
        el.addEventListener(evt, function(){ updateFieldState(el); });
      });
    });

    // Find forms — use a Set to deduplicate so same form is never bound twice
    var seenForms = new Set();
    document.querySelectorAll('form.lead-form, form#applyLeadForm').forEach(function(form){
      if(seenForms.has(form)) return; // skip if already bound
      seenForms.add(form);

      form.addEventListener('submit', function(e){
        e.preventDefault();
        e.stopPropagation();

        // Prevent double submission
        if(isSubmitting) return;
        isSubmitting = true;

        // Collect fresh from this page's form
        pendingCorneliaLead = collectLead(form);

        if(!showConsentModal()){
          // No modal — send and redirect directly
          sendLeadToGoogleSheet(pendingCorneliaLead).finally(function(){
            isSubmitting = false;
            redirectToPartner();
          });
          setTimeout(redirectToPartner, 1800);
        }
        // If modal shown, isSubmitting resets in completeLead()
      });
    });

    setTimeout(updateAllFields, 250);
    setTimeout(updateAllFields, 1000);
  });

  // Called by consent modal button
  window.completeLead = function(){
    const consent = document.getElementById('marketingConsent');
    if(consent && !consent.checked){
      alert('Please check the box to confirm consent before continuing.');
      return;
    }

    // Re-read fields if lead data is missing
    if(!pendingCorneliaLead || (!pendingCorneliaLead.email && !pendingCorneliaLead.phone)){
      const form = document.querySelector('form#applyLeadForm, form.lead-form, form');
      pendingCorneliaLead = form ? collectLead(form) : {
        formType:        isApplyPage() ? 'apply' : 'lead',
        source:          isApplyPage() ? 'Apply Page' : 'Cornelia Website',
        pageSource:      currentPage(),
        referralLink:    partnerUrl(),
        marketingConsent:'Yes',
        createdAt:       new Date().toISOString()
      };
    }

    pendingCorneliaLead.marketingConsent = 'Yes';

    // Send once — reset flag after
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
