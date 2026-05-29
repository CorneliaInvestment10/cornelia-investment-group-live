(function(){
  const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxwUq_-XVh7iB6rLfjGVJrKcJcneYaIexFFDinPz-r2y5XkOS6VFvhsPacNkJ4T0LYb/exec";
  const DEFAULT_NBC_URL = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";
  let pendingCorneliaLead = null;

  function partnerUrl(){
    return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || DEFAULT_NBC_URL;
  }

  function currentPage(){
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function val(selector){
    const el = document.querySelector(selector);
    return el ? (el.value || '').trim() : '';
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
    const page = currentPage();
    const isApplyPage = page.toLowerCase().includes('apply') || document.body.classList.contains('apply-page');

    const lead = {
      fullName: valueFrom(form, ['fullName','name','homeFullName','appFullName','full_name']),
      title: valueFrom(form, ['title','jobTitle','job_title','businessTitle','position']),
      businessName: valueFrom(form, ['businessName','company','companyName','homeBusinessName','appBusinessName','business_name']),
      annualRevenue: valueFrom(form, ['annualRevenue','revenue','homeAnnualRevenue','appAnnualRevenue','annual_revenue']),
      industry: valueFrom(form, ['industry','homeIndustry','appIndustry']),
      fundingNeed: valueFrom(form, ['fundingNeed','financingNeed','message','comments','purpose','homeFundingNeed','appFundingNeed','fundingPurpose','financingPurpose']),
      phone: valueFrom(form, ['phone','phoneNumber','homePhone','appPhone','telephone']),
      email: valueFrom(form, ['email','emailAddress','homeEmail','appEmail']),
      timeInBusiness: valueFrom(form, ['timeInBusiness','time_business','yearsInBusiness','businessAge']),
      creditScore: valueFrom(form, ['creditScore','fico','ficoScore']),
      comments: valueFrom(form, ['comments','message','notes','additionalInfo']),
      source: isApplyPage ? 'apply.html' : page,
      pageSource: isApplyPage ? 'apply.html' : page,
      marketingConsent: 'Yes',
      referralLink: partnerUrl(),
      createdAt: new Date().toISOString()
    };

    // Extra fallback for simple form fields not covered above.
    if(form){
      const fd = new FormData(form);
      fd.forEach(function(value, key){
        if(lead[key] === undefined || lead[key] === '') lead[key] = value;
      });
    }

    return lead;
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

    document.querySelectorAll('form.lead-form, form').forEach(function(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        pendingCorneliaLead = collectLead(form);
        if(!showConsentModal()){
          sendLeadToGoogleSheet(pendingCorneliaLead).finally(redirectToPartner);
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
      alert('Please confirm consent before continuing.');
      return;
    }

    if(!pendingCorneliaLead){
      const form = document.querySelector('form.lead-form, form');
      pendingCorneliaLead = form ? collectLead(form) : {
        source: currentPage(),
        pageSource: currentPage(),
        referralLink: partnerUrl(),
        marketingConsent: 'Yes',
        createdAt: new Date().toISOString()
      };
    }

    pendingCorneliaLead.marketingConsent = 'Yes';
    sendLeadToGoogleSheet(pendingCorneliaLead).finally(redirectToPartner);
    setTimeout(redirectToPartner, 1800);
  };

  window.goPartner = function(e){
    if(e) e.preventDefault();
    const page = currentPage();
    if(page === 'apply.html'){
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
