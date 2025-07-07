import{c as S}from"./index-C_6bkvJA.js";/* empty css               */const $="https://ntvpbxdnjslfwhezjoah.supabase.co",P="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dnBieGRuanNsZndoZXpqb2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTg2NDQsImV4cCI6MjA2NzE3NDY0NH0.zN37OSZOX-Ylp2Qv7UDw3w4TMdJOvPPgJhTwi1wNBeg",h=S($,P);let o=1;const g=document.getElementById("registerForm"),w=document.getElementById("loadingOverlay"),c=document.getElementById("successMessage"),d=document.getElementById("errorMessage"),E=document.getElementById("errorText"),m=document.getElementById("submitBtn"),_=document.getElementById("petsContainer");document.addEventListener("DOMContentLoaded",function(){console.log("Register Page - Iniciado"),q()});function q(){g&&g.addEventListener("submit",N);const t=document.getElementById("confirmPassword"),e=document.getElementById("password");t&&e&&(t.addEventListener("input",I),e.addEventListener("input",I))}function I(){const t=document.getElementById("password").value,e=document.getElementById("confirmPassword").value,s=document.getElementById("confirmPassword");e&&t!==e?s.setCustomValidity("As senhas não coincidem"):s.setCustomValidity("")}function B(){o++;const t=document.createElement("div");t.className="pet-section additional",t.setAttribute("data-pet-index",o-1),t.innerHTML=`
        <div class="pet-header">
            <div class="pet-title">
                <i class="fas fa-paw"></i>
                Pet ${o}
            </div>
            <button type="button" class="remove-pet-btn" onclick="removePet(this)">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label>Nome do Pet <span class="required">*</span></label>
                <input type="text" name="pets[${o-1}][name]" required>
            </div>

            <div class="form-group">
                <label>Raça <span class="required">*</span></label>
                <input type="text" name="pets[${o-1}][breed]" required>
            </div>

            <div class="form-group">
                <label>Idade (anos) <span class="required">*</span></label>
                <input type="number" name="pets[${o-1}][age]" min="0" max="30" required>
            </div>

            <div class="form-group">
                <label>Sexo <span class="required">*</span></label>
                <select name="pets[${o-1}][sex]" required>
                    <option value="">Selecione</option>
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                </select>
            </div>

            <div class="form-group">
                <label>Peso (kg)</label>
                <input type="number" name="pets[${o-1}][weight]" min="0" step="0.1">
            </div>

            <div class="form-group">
                <label>Vacinas em dia? <span class="required">*</span></label>
                <select name="pets[${o-1}][vaccinations_up_to_date]" required>
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                </select>
            </div>

            <div class="form-group">
                <label>Sociável com outros cães?</label>
                <select name="pets[${o-1}][sociable_with_dogs]">
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                    <option value="depends">Depende</option>
                </select>
            </div>

            <div class="form-group">
                <label>Amigável com estranhos?</label>
                <select name="pets[${o-1}][friendly_with_strangers]">
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                    <option value="depends">Depende</option>
                </select>
            </div>

            <div class="form-group full-width">
                <label>Instruções de Alimentação</label>
                <textarea name="pets[${o-1}][feeding_instructions]" placeholder="Tipo de ração, quantidade, horários..."></textarea>
            </div>

            <div class="form-group full-width">
                <label>Alergias ou Condições Médicas</label>
                <textarea name="pets[${o-1}][medical_conditions]" placeholder="Descreva alergias, medicações, condições especiais..."></textarea>
            </div>
        </div>
    `,_&&_.appendChild(t)}function C(t){t.closest(".pet-section").remove(),o--,document.querySelectorAll(".pet-section").forEach((s,a)=>{const i=s.querySelector(".pet-title");i.innerHTML=`<i class="fas fa-paw"></i> Pet ${a+1}`,s.setAttribute("data-pet-index",a),s.querySelectorAll("input, select, textarea").forEach(r=>{if(r.name&&r.name.startsWith("pets[")){const l=r.name.replace(/pets\[\d+\]/,`pets[${a}]`);r.name=l}})})}async function N(t){t.preventDefault();try{y(!0),D();const e=new FormData(g),s=e.get("password"),a=e.get("confirmPassword");if(s!==a)throw new Error("As senhas não coincidem");if(s.length<6)throw new Error("A senha deve ter pelo menos 6 caracteres");console.log("Iniciando processo de registro...");const i={email:e.get("email"),password_hash:await A(s),role:"client",name:e.get("name"),phone:e.get("phone")||null,emergency_contact:e.get("emergency_contact"),veterinarian:e.get("veterinarian"),authorize_emergency_care:e.get("authorize_emergency_care")==="true",additional_comments:e.get("additional_comments")||null};console.log("Dados do usuário preparados:",{...i,password_hash:"[HIDDEN]"});const{data:r,error:l}=await h.from("users").select("id").eq("email",i.email).single();if(l&&l.code!=="PGRST116")throw console.error("Erro ao verificar email existente:",l),new Error("Erro ao verificar email. Tente novamente.");if(r&&!l)throw new Error("Este email já está cadastrado");console.log("Email disponível, criando usuário...");const{data:b,error:f}=await h.from("users").insert([i]).select().single();if(f)throw console.error("Erro ao criar usuário:",f),new Error(`Erro ao criar conta: ${f.message}`);console.log("Usuário criado:",b);const u=[];if(document.querySelectorAll(".pet-section").forEach((v,n)=>{const p={owner_id:b.id,name:e.get(`pets[${n}][name]`),breed:e.get(`pets[${n}][breed]`),age:parseInt(e.get(`pets[${n}][age]`)),sex:e.get(`pets[${n}][sex]`),weight:e.get(`pets[${n}][weight]`)?parseFloat(e.get(`pets[${n}][weight]`)):null,vaccinations_up_to_date:e.get(`pets[${n}][vaccinations_up_to_date]`)==="true",sociable_with_dogs:e.get(`pets[${n}][sociable_with_dogs]`)||null,friendly_with_strangers:e.get(`pets[${n}][friendly_with_strangers]`)||null,feeding_instructions:e.get(`pets[${n}][feeding_instructions]`)||null,medical_conditions:e.get(`pets[${n}][medical_conditions]`)||null};p.name&&p.breed&&p.age&&p.sex&&u.push(p)}),u.length>0){const{error:v}=await h.from("pets").insert(u);if(v)throw v;console.log("Pets criados:",u.length)}y(!1),M(),g.reset(),setTimeout(()=>{window.location.href="login.html"},3e3)}catch(e){console.error("Erro ao criar conta:",e),y(!1),T(e.message||"Erro desconhecido ao criar conta")}}async function A(t){const s=new TextEncoder().encode(t),a=await crypto.subtle.digest("SHA-256",s);return Array.from(new Uint8Array(a)).map(i=>i.toString(16).padStart(2,"0")).join("")}function y(t){!w||!m||(t?(w.classList.add("active"),m.disabled=!0,m.innerHTML='<i class="fas fa-spinner fa-spin"></i> Criando conta...'):(w.classList.remove("active"),m.disabled=!1,m.innerHTML='<i class="fas fa-user-plus"></i> Criar Conta'))}function M(){c&&(c.style.display="block"),d&&(d.style.display="none")}function T(t){E&&(E.textContent=t),d&&(d.style.display="block"),c&&(c.style.display="none")}function D(){c&&(c.style.display="none"),d&&(d.style.display="none")}window.addPet=B;window.removePet=C;
