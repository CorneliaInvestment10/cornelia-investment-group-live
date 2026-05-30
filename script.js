(function(){

  /* ── TWO SEPARATE GOOGLE SHEETS ENDPOINTS ──────────────────────────────
     Homepage lead form  → HOMEPAGE_SHEETS_URL
     Apply page form     → APPLY_SHEETS_URL
  ──────────────────────────────────────────────────────────────────────── */
  const HOMEPAGE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxANCb36uNhFqZcVjXvz0sb_8dU4aT5eO2fWLRvfc8esffNTyEyDM7OeViGHUahv1aE/exec";
  const APPLY_SHEETS_URL    = "https://script.google.com/macros/s/AKfycbxwUq_-XVh7iB6rLfjGVJrKcJcneYaIexFFDinPz-r2y5XkOS6VFvhsPacNkJ4T0LYb/exec";
  const DEFAULT_NBC_URL     = "https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002";

  let pendingCorneliaLead = null;

  /* ── HELPERS ─────────────────────────────────────────────────────────── */
  function partnerUrl(){
    return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || DEFAULT_NBC_URL;
  }

  function currentPage(){
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function isApplyPage(){
    const page = currentPage().toLowerCase();
    return page.includes('apply') || document.body.classList.contains('apply-page');
  }

  function isHomePage(){
    const page = currentPage().toLowerCase();
    return page === 'index.html' || page === '' || page === '/';
  }

  /* Read a field value by name (inside form first, then by DOM id) */
  function valueFrom(form, names){
    for(const name of names){
      const byName = form ? form.querySelector('[name="' + name + '"]') : null;
      if(byName && String(byName.value || '').trim()) return String(byName.value || '').trim();
      const byId = document.getElementById(name);
      if(byId && String(byId.value || '').trim()) return String(byId.value || '').trim();
    }
    return '';
  }

  /* ── COLLECT LEAD DATA ───────────────────────────────────────────────── */
  function collectLead(form){
    const lead = {
      formType:      isApplyPage() ? 'apply' : 'lead',
      fullName:      valueFrom(form, ['fullName','name','homeFullName','appFullName','full_name']),
      title:         valueFrom(form, ['title','jobTitle','job_title','businessTitle','position']),
      businessName:  valueFrom(form, ['businessName','company','companyName','homeBusinessName','appBusinessName','business_name']),
      annualRevenue: valueFrom(form, ['annualRevenue','revenue','homeAnnualRevenue','appAnnualRevenue','annual_revenue']),
      industry:      valueFrom(form, ['industry','homeIndustry','appIndustry']),
      fundingNeed:   valueFrom(form, ['fundingNeed','financingNeed','loanType','homeFundingNeed','appFundingNeed','fundingPurpose','financingPurpose']),
      phone:         valueFrom(form, ['phone','phoneNumber','homePhone','appPhone','telephone']),
      email:         valueFrom(form, ['email','emailAddress','homeEmail','appEmail']),
      timeInBusiness:valueFrom(form, ['timeInBusiness','time_business','yearsInBusiness','businessAge']),
      creditScore:   valueFrom(form, ['creditScore','fico','ficoScore']),
      comments:      valueFrom(form, ['comments','message','notes','additionalInfo','financingNeed']),
      source:        isApplyPage() ? 'Apply Page' : 'Cornelia Website',
      pageSource:    currentPage(),
      marketingConsent:'Yes',
      referralLink:  partnerUrl(),
      createdAt:     new Date().toISOString()
    };

    /* Final fallback: walk FormData for any remaining fields */
    if(form){
      try{
        const fd = new FormData(form);
        fd.forEach(function(value, key){
          if(lead[key] === undefined || lead[key] === '') lead[key] = String(value || '').trim();
        });
      }catch(e){}
    }

    return lead;
  }

  /* ── STORAGE ─────────────────────────────────────────────────────────── */
  function saveLeadToLocalBackup(lead){
    try{
      const leads = JSON.parse(localStorage.getItem('corneliaLeads') || '[]');
      leads.push(lead);
      localStorage.setItem('corneliaLeads', JSON.stringify(leads));
    }catch(err){}
  }

  /* Choose correct Sheet URL based on which page submitted the form */
  function sheetsUrlForLead(lead){
    return (lead.formType === 'apply') ? APPLY_SHEETS_URL : HOMEPAGE_SHEETS_URL;
  }

  function sendLeadToGoogleSheet(lead){
    saveLeadToLocalBackup(lead);
    try{
      return fetch(sheetsUrlForLead(lead), {
        method: 'POST',
        mode:   'no-cors',
        headers:{ 'Content-Type': 'text/plain;charset=utf-8' },
        body:   JSON.stringify(lead)
      });
    }catch(err){
      return Promise.resolve();
    }
  }

  function redirectToPartner(){
    window.location.href = partnerUrl();
  }

  /* ── FIELD STATE (has-value class for CSS) ───────────────────────────── */
  function updateFieldState(el){
    if(!el) return;
    const has = String(el.value || '').trim().length > 0;
    el.classList.toggle('has-value', has);
  }

  function updateAllFields(){
    document.querySelectorAll(
      '.lead-input,.lead-select,.lead-textarea,input,select,textarea'
    ).forEach(updateFieldState);
  }

  /* ── MODAL ───────────────────────────────────────────────────────────── */
  function showConsentModal(){
    const modal = document.getElementById('consentModal');
    if(modal){
      modal.style.display = 'flex';
      modal.classList.add('show');
      return true;
    }
    return false;
  }

  /* ── DOM READY ───────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function(){

    /* Live field-state tracking so has-value applies as user types */
    document.querySelectorAll(
      '.lead-input,.lead-select,.lead-textarea,input,select,textarea'
    ).forEach(function(el){
      updateFieldState(el);
      ['input','change','blur','keyup'].forEach(function(evt){
        el.addEventListener(evt, function(){ updateFieldState(el); });
      });
    });

    /* Form submit → collect lead → show consent modal */
    document.querySelectorAll('form.lead-form, form#applyLeadForm, form').forEach(function(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        e.stopPropagation();
        pendingCorneliaLead = collectLead(form);
        if(!showConsentModal()){
          /* No modal present (e.g. apply page) — send and redirect immediately */
          sendLeadToGoogleSheet(pendingCorneliaLead).finally(redirectToPartner);
          setTimeout(redirectToPartner, 1800);
        }
      });
    });

    /* Initialise field states after a short delay (handles pre-filled values) */
    setTimeout(updateAllFields, 250);
    setTimeout(updateAllFields, 1000);
  });

  /* ── completeLead — called by consent modal button ───────────────────── */
  window.completeLead = function(){
    const consent = document.getElementById('marketingConsent');
    if(consent && !consent.checked){
      alert('Please check the box to confirm consent before continuing.');
      return;
    }

    /* If pendingCorneliaLead was never set (edge case: user opened modal
       directly without submitting), read all fields from the DOM right now */
    if(!pendingCorneliaLead || (!pendingCorneliaLead.email && !pendingCorneliaLead.phone)){
      const form = document.querySelector('form#applyLeadForm, form.lead-form, form');
      pendingCorneliaLead = form ? collectLead(form) : {
        formType:     'lead',
        source:       'Cornelia Website',
        pageSource:   currentPage(),
        referralLink: partnerUrl(),
        marketingConsent:'Yes',
        createdAt:    new Date().toISOString()
      };
    }

    pendingCorneliaLead.marketingConsent = 'Yes';

    /* Send to the correct Google Sheet then redirect to NBC link.
       setTimeout is a safety net in case fetch hangs. */
    sendLeadToGoogleSheet(pendingCorneliaLead).finally(redirectToPartner);
    setTimeout(redirectToPartner, 1800);
  };

  /* ── goPartner — used by nav Explore Options buttons ────────────────── */
  window.goPartner = function(e){
    if(e) e.preventDefault();
    const page = currentPage();
    if(page === 'apply.html'){
      const form = document.getElementById('leadForm')
                || document.getElementById('homeLeadForm')
                || document.querySelector('form.lead-form, form');
      if(form){
        form.scrollIntoView({behavior:'smooth', block:'center'});
        return false;
      }
    }
    window.location.href = 'apply.html';
    return false;
  };

})();
