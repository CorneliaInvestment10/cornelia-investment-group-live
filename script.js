function nbcLink(){return window.NBC_TRACKABLE_LINK||"https://REPLACE-WITH-YOUR-NBC-TRACKABLE-LINK.com"}
function saveLead(data){const leads=JSON.parse(localStorage.getItem('corneliaLeads')||'[]');leads.push({...data,createdAt:new Date().toISOString()});localStorage.setItem('corneliaLeads',JSON.stringify(leads));}
function collect(form){const out={};new FormData(form).forEach((v,k)=>out[k]=v);return out;}
function showConsent(form){window.pendingLead=collect(form);document.getElementById('consentModal').style.display='flex';}
function completeLead(){const chk=document.getElementById('marketingConsent');if(!chk.checked){alert('Please check the marketing consent box before continuing.');return;}saveLead({...window.pendingLead,marketingConsent:'Yes'});window.location.href=nbcLink();}
function wireForms(){document.querySelectorAll('form.lead-form').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();showConsent(f)}));}
function goNbc(e){e.preventDefault();window.location.href=nbcLink();}
window.addEventListener('DOMContentLoaded',wireForms);
