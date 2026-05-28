(function(){
  function partnerUrl(){return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || 'https://www.nationalbusinesscapital.com/apply-now/?ref=140622073002';}
  function saveLead(form){try{var leads=JSON.parse(localStorage.getItem('corneliaLeads')||'[]');var data={};new FormData(form).forEach(function(v,k){data[k]=v});data.createdAt=new Date().toISOString();leads.push(data);localStorage.setItem('corneliaLeads',JSON.stringify(leads));}catch(err){}}
  function updateFieldState(el){if(!el)return;var has=String(el.value||'').trim().length>0;el.classList.toggle('has-value',has)}
  function updateAll(){document.querySelectorAll('.lead-input,.lead-select,.lead-textarea').forEach(updateFieldState)}
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.lead-input,.lead-select,.lead-textarea').forEach(function(el){updateFieldState(el);['input','change','blur','keyup'].forEach(function(evt){el.addEventListener(evt,function(){updateFieldState(el)})})});
    document.querySelectorAll('form.lead-form').forEach(function(form){form.addEventListener('submit',function(e){e.preventDefault();saveLead(form);var modal=document.getElementById('consentModal');if(modal){modal.style.display='flex'}else{window.location.href=partnerUrl()}})});
    setTimeout(updateAll,250);setTimeout(updateAll,1000);
  });
  window.completeLead=function(){var consent=document.getElementById('marketingConsent');if(consent && !consent.checked){alert('Please confirm consent before continuing.');return;}window.location.href=partnerUrl()};
  window.goPartner=function(e){if(e)e.preventDefault();window.location.href=partnerUrl()};
})();
