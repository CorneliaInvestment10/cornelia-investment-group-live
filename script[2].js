(function(){
  const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxANCb36uNhFqZcVjXvz0sb_8dU4aT5eO2fWLRvfc8esffNTyEyDM7OeViGHUahv1aE/exec";
  const DEFAULT_NBC_URL = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";
  let pendingCorneliaLead = null;

  function partnerUrl(){
    return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || DEFAULT_NBC_URL;
  }

  function valByIdOrName(id, name){
    const byId = id ? document.getElementById(id) : null;
    if (byId) return byId.value || "";
    const byName = name ? document.querySelector('[name="' + name + '"]') : null;
    return byName ? (byName.value || "") : "";
  }

  function collectLead(form){
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const formData = new FormData(form);
    return {
      fullName: valByIdOrName('homeFullName','fullName') || formData.get('fullName') || '',
      businessName: valByIdOrName('homeBusinessName','businessName') || formData.get('businessName') || '',
      annualRevenue: valByIdOrName('homeAnnualRevenue','annualRevenue') || formData.get('annualRevenue') || '',
      industry: valByIdOrName('homeIndustry','industry') || formData.get('industry') || '',
      fundingNeed: valByIdOrName('homeFundingNeed','fundingNeed') || formData.get('fundingNeed') || '',
      phone: valByIdOrName('homePhone','phone') || formData.get('phone') || '',
      email: valByIdOrName('homeEmail','email') || formData.get('email') || '',
      source: page,
      pageSource: page,
      marketingConsent: 'Yes',
      referralLink: partnerUrl(),
      createdAt: new Date().toISOString()
    };
  }

  function saveLeadToLocalBackup(lead){
    try{
      const leads = JSON.parse(localStorage.getItem('corneliaLeads') || '[]');
      leads.push(lead);
      localStorage.setItem('corneliaLeads', JSON.stringify(leads));
    }catch(err){}
  }

  function sendLeadToGoogleSheet(lead){
    saveLeadToLocalBackup(lead);
    try{
      return fetch(GOOGLE_SHEETS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(lead)
      });
    }catch(err){
      return Promise.resolve();
    }
  }

  function redirectToPartner(){
    window.location.href = partnerUrl();
  }

  function updateFieldState(el){
    if(!el) return;
    const has = String(el.value || '').trim().length > 0;
    el.classList.toggle('has-value', has);
  }

  function updateAllFields(){
    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea,input,select,textarea').forEach(updateFieldState);
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea,input,select,textarea').forEach(function(el){
      updateFieldState(el);
      ['input','change','blur','keyup'].forEach(function(evt){
        el.addEventListener(evt, function(){ updateFieldState(el); });
      });
    });

    document.querySelectorAll('form.lead-form, form').forEach(function(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        pendingCorneliaLead = collectLead(form);
        const modal = document.getElementById('consentModal');
        if(modal){
          modal.style.display = 'flex';
          modal.classList.add('show');
        }else{
          sendLeadToGoogleSheet(pendingCorneliaLead).finally(redirectToPartner);
          setTimeout(redirectToPartner, 1500);
        }
      });
    });

    setTimeout(updateAllFields, 250);
    setTimeout(updateAllFields, 1000);
  });

  window.completeLead = function(){
    const consent = document.getElementById('marketingConsent');
    if(consent && !consent.checked){
      alert('Please confirm consent before continuing.');
      return;
    }
    if(!pendingCorneliaLead){
      const form = document.querySelector('form.lead-form, form');
      pendingCorneliaLead = form ? collectLead(form) : {source: window.location.pathname.split('/').pop() || 'website', pageSource: window.location.pathname.split('/').pop() || 'website', referralLink: partnerUrl(), marketingConsent: 'Yes', createdAt: new Date().toISOString()};
    }
    pendingCorneliaLead.marketingConsent = consent && consent.checked ? 'Yes' : 'Yes';
    sendLeadToGoogleSheet(pendingCorneliaLead).finally(redirectToPartner);
    setTimeout(redirectToPartner, 1500);
  };

  window.goPartner = function(e){
    if(e) e.preventDefault();
    const current = window.location.pathname.split('/').pop() || 'index.html';
    if(current === 'apply.html'){
      const form = document.getElementById('leadForm') || document.getElementById('homeLeadForm') || document.querySelector('form.lead-form, form');
      if(form){
        form.scrollIntoView({behavior:'smooth', block:'center'});
        return false;
      }
    }
    window.location.href = 'apply.html';
    return false;
  };
})();
