(function(){
  function partnerUrl(){return (window.NBC_TRACKABLE_LINK && String(window.NBC_TRACKABLE_LINK).trim()) || 'apply.html';}
  function getForm(){return document.getElementById('homeLeadForm') || document.querySelector('.lead-form');}
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
