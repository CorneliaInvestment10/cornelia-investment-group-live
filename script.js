(function(){
  function partnerUrl(){return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || 'apply.html';}
  function getForm(){return document.getElementById('homeLeadForm') || document.querySelector('.lead-form');}
  function updateFieldState(el){ if(!el) return; var has = String(el.value||'').trim().length>0; el.classList.toggle('has-value', has); }
  document.querySelectorAll('.lead-input,.lead-select').forEach(function(el){
    updateFieldState(el);
    el.addEventListener('input', function(){updateFieldState(el);});
    el.addEventListener('change', function(){updateFieldState(el);});
    el.addEventListener('blur', function(){updateFieldState(el);});
  });
  var form=getForm();
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      try{var leads=JSON.parse(localStorage.getItem('corneliaLeads')||'[]');var data={};new FormData(form).forEach(function(v,k){data[k]=v});data.createdAt=new Date().toISOString();leads.push(data);localStorage.setItem('corneliaLeads',JSON.stringify(leads));}catch(err){}
      var modal=document.getElementById('consentModal');
      if(modal){modal.style.display='flex';}else{window.location.href=partnerUrl();}
    });
  }
  window.completeLead=function(){
    var consent=document.getElementById('marketingConsent');
    if(consent && !consent.checked){alert('Please confirm consent before continuing.');return;}
    window.location.href=partnerUrl();
  };
})();
