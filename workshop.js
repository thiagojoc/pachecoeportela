(function(){
  // Cole aqui a URL do Webhook de entrada criado no GHL (Workflows > gatilho
  // "Inbound Webhook"). Enquanto ficar com o valor abaixo, o formulário só
  // avisa no console e segue pra página de obrigado sem enviar o lead.
  var WEBHOOK_URL = "COLOQUE_AQUI_A_URL_DO_WEBHOOK_DO_GHL";

  function maskPhone(v){
    v = v.replace(/\D/g, "").slice(0, 11);
    if(v.length > 6) return "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
    if(v.length > 2) return "(" + v.slice(0, 2) + ") " + v.slice(2);
    if(v.length > 0) return "(" + v;
    return v;
  }

  document.addEventListener("DOMContentLoaded", function(){
    var form = document.getElementById("lp-form");
    if(!form) return;
    var whatsInput = document.getElementById("f-whats");
    if(whatsInput){
      whatsInput.addEventListener("input", function(){
        this.value = maskPhone(this.value);
      });
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();

      var nomeInput = document.getElementById("f-nome");
      var nome = nomeInput.value.trim();
      var whats = whatsInput ? whatsInput.value.replace(/\D/g, "") : "";
      var categoriaEl = form.querySelector('input[name="categoria"]:checked');
      var categoria = categoriaEl ? categoriaEl.value : "";

      var ok = true;
      var nomeOk = !!nome;
      nomeInput.classList.toggle("err", !nomeOk);
      document.getElementById("err-nome").classList.toggle("show", !nomeOk);
      if(!nomeOk) ok = false;

      var whatsOk = whats.length >= 10;
      whatsInput.classList.toggle("err", !whatsOk);
      document.getElementById("err-whats").classList.toggle("show", !whatsOk);
      if(!whatsOk) ok = false;

      document.getElementById("err-categoria").classList.toggle("show", !categoria);
      if(!categoria) ok = false;

      if(!ok) return;

      var btn = document.getElementById("btn-submit");
      btn.disabled = true;
      btn.textContent = "Enviando...";

      var payload = {
        nome: nome,
        whatsapp: whats,
        categoria: categoria,
        tags: ["anuncio", "workshop-auxilio-maternidade", categoria === "gestante" ? "gestante" : "tem-filho-pequeno"],
        origem: "LP Workshop Auxilio Maternidade",
        workshop_data: "2026-07-30",
        workshop_horario: "19:30"
      };

      function goToThankYou(){
        window.location.href = "./obrigado/";
      }

      if(!WEBHOOK_URL || WEBHOOK_URL.indexOf("COLOQUE_AQUI") === 0){
        console.warn("Webhook do GHL ainda não configurado (workshop.js). Lead não foi enviado:", payload);
        goToThankYou();
        return;
      }

      fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function(err){
        console.warn("Falha ao enviar lead pro webhook, seguindo mesmo assim.", err);
      }).finally(function(){
        goToThankYou();
      });
    });
  });
})();
