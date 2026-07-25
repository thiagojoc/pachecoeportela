(function(){
  var WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/FmpUEamfD83qBSyayaq9/webhook-trigger/f59372c1-ba3a-4db8-8631-16eafec98d03";
  var SHEET_URL = "https://script.google.com/macros/s/AKfycbzMA1ciT486HBIGRiTRm7Um-zPAo14ohantBNqHVkLLGJc87y4FK7Nn6z6ewqhPnPvxdQ/exec";

  function maskPhone(v){
    v = v.replace(/\D/g, "").slice(0, 11);
    if(v.length > 6) return "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
    if(v.length > 2) return "(" + v.slice(0, 2) + ") " + v.slice(2);
    if(v.length > 0) return "(" + v;
    return v;
  }

  function maskDdi(v){
    var digits = v.replace(/\D/g, "").slice(0, 3);
    return digits ? "+" + digits : "+";
  }

  document.addEventListener("DOMContentLoaded", function(){
    var form = document.getElementById("lp-form");
    if(!form) return;
    var whatsInput = document.getElementById("f-whats");
    var ddiInput = document.getElementById("f-ddi");
    if(whatsInput){
      whatsInput.addEventListener("input", function(){
        this.value = maskPhone(this.value);
      });
    }
    if(ddiInput){
      ddiInput.addEventListener("input", function(){
        this.value = maskDdi(this.value);
      });
      ddiInput.addEventListener("blur", function(){
        if(this.value === "+") this.value = "+55";
      });
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();

      var nomeInput = document.getElementById("f-nome");
      var nome = nomeInput.value.trim();
      var whatsDigits = whatsInput ? whatsInput.value.replace(/\D/g, "") : "";
      var ddiDigits = ddiInput ? ddiInput.value.replace(/\D/g, "") : "55";
      // Numero brasileiro (o padrao) segue exatamente como antes, sem o
      // codigo do pais no payload, pra nao mudar o que ja chega certo no
      // GHL e na planilha. So inclui o DDI quando alguem troca pra um
      // numero de fora, ai sim precisa vir explicito.
      var whats = ddiDigits === "55" ? whatsDigits : (ddiDigits + whatsDigits);
      var categoriaEls = form.querySelectorAll('input[name="categoria"]:checked');
      var categorias = Array.prototype.map.call(categoriaEls, function(el){ return el.value; });

      var ok = true;
      var nomeOk = !!nome;
      nomeInput.classList.toggle("err", !nomeOk);
      document.getElementById("err-nome").classList.toggle("show", !nomeOk);
      if(!nomeOk) ok = false;

      var whatsOk = ddiDigits === "55" ? whatsDigits.length >= 10 : whatsDigits.length >= 8;
      whatsInput.classList.toggle("err", !whatsOk);
      document.getElementById("err-whats").classList.toggle("show", !whatsOk);
      if(!whatsOk) ok = false;

      document.getElementById("err-categoria").classList.toggle("show", !categorias.length);
      if(!categorias.length) ok = false;

      if(!ok) return;

      var btn = document.getElementById("btn-submit");
      btn.disabled = true;
      btn.textContent = "Enviando...";

      var categoriaTags = categorias.map(function(c){ return c === "gestante" ? "gestante" : "tem-filho-pequeno"; });
      var payload = {
        nome: nome,
        whatsapp: whats,
        categoria: categorias.join(","),
        tags: ["anuncio", "workshop-auxilio-maternidade"].concat(categoriaTags),
        origem: "LP Workshop Auxilio Maternidade",
        workshop_data: "2026-07-29",
        workshop_horario: "19:30"
      };

      function goToThankYou(){
        window.location.href = "./obrigado/";
      }

      var envios = [];

      if(WEBHOOK_URL && WEBHOOK_URL.indexOf("COLOQUE_AQUI") !== 0){
        envios.push(fetch(WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(function(err){
          console.warn("Falha ao enviar lead pro webhook do GHL, seguindo mesmo assim.", err);
        }));
      } else {
        console.warn("Webhook do GHL ainda não configurado (workshop.js). Lead não foi enviado pro GHL:", payload);
      }

      if(SHEET_URL && SHEET_URL.indexOf("COLOQUE_AQUI") !== 0){
        envios.push(fetch(SHEET_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        }).catch(function(err){
          console.warn("Falha ao enviar lead pra planilha, seguindo mesmo assim.", err);
        }));
      } else {
        console.warn("URL da planilha ainda não configurada (workshop.js). Lead não foi enviado pra planilha:", payload);
      }

      Promise.all(envios).finally(goToThankYou);
    });
  });
})();
