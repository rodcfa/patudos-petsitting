import{c as I}from"./index-C_6bkvJA.js";/* empty css               */const S="https://ntvpbxdnjslfwhezjoah.supabase.co",$="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dnBieGRuanNsZndoZXpqb2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTg2NDQsImV4cCI6MjA2NzE3NDY0NH0.zN37OSZOX-Ylp2Qv7UDw3w4TMdJOvPPgJhTwi1wNBeg",f=I(S,$);let s=1;const h=document.getElementById("registerForm"),v=document.getElementById("loadingOverlay"),l=document.getElementById("successMessage"),c=document.getElementById("errorMessage"),b=document.getElementById("errorText"),p=document.getElementById("submitBtn"),_=document.getElementById("petsContainer");document.addEventListener("DOMContentLoaded",function(){console.log("Register Page - Iniciado"),P()});function P(){h&&h.addEventListener("submit",C);const t=document.getElementById("confirmPassword"),e=document.getElementById("password");t&&e&&(t.addEventListener("input",E),e.addEventListener("input",E))}function E(){const t=document.getElementById("password").value,e=document.getElementById("confirmPassword").value,o=document.getElementById("confirmPassword");e&&t!==e?o.setCustomValidity("As senhas não coincidem"):o.setCustomValidity("")}function q(){s++;const t=document.createElement("div");t.className="pet-section additional",t.setAttribute("data-pet-index",s-1),t.innerHTML=`
        <div class="pet-header">
            <div class="pet-title">
                <i class="fas fa-paw"></i>
                Pet ${s}
            </div>
            <button type="button" class="remove-pet-btn" onclick="removePet(this)">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label>Nome do Pet <span class="required">*</span></label>
                <input type="text" name="pets[${s-1}][name]" required>
            </div>

            <div class="form-group">
                <label>Raça <span class="required">*</span></label>
                <input type="text" name="pets[${s-1}][breed]" required>
            </div>

            <div class="form-group">
                <label>Idade (anos) <span class="required">*</span></label>
                <input type="number" name="pets[${s-1}][age]" min="0" max="30" required>
            </div>

            <div class="form-group">
                <label>Sexo <span class="required">*</span></label>
                <select name="pets[${s-1}][sex]" required>
                    <option value="">Selecione</option>
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                </select>
            </div>

            <div class="form-group">
                <label>Peso (kg)</label>
                <input type="number" name="pets[${s-1}][weight]" min="0" step="0.1">
            </div>

            <div class="form-group">
                <label>Vacinas em dia? <span class="required">*</span></label>
                <select name="pets[${s-1}][vaccinations_up_to_date]" required>
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                </select>
            </div>

            <div class="form-group">
                <label>Sociável com outros cães?</label>
                <select name="pets[${s-1}][sociable_with_dogs]">
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                    <option value="depends">Depende</option>
                </select>
            </div>

            <div class="form-group">
                <label>Amigável com estranhos?</label>
                <select name="pets[${s-1}][friendly_with_strangers]">
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                    <option value="depends">Depende</option>
                </select>
            </div>

            <div class="form-group full-width">
                <label>Instruções de Alimentação</label>
                <textarea name="pets[${s-1}][feeding_instructions]" placeholder="Tipo de ração, quantidade, horários..."></textarea>
            </div>

            <div class="form-group full-width">
                <label>Alergias ou Condições Médicas</label>
                <textarea name="pets[${s-1}][medical_conditions]" placeholder="Descreva alergias, medicações, condições especiais..."></textarea>
            </div>
        </div>
    `,_&&_.appendChild(t)}function B(t){t.closest(".pet-section").remove(),s--,document.querySelectorAll(".pet-section").forEach((o,a)=>{const i=o.querySelector(".pet-title");i.innerHTML=`<i class="fas fa-paw"></i> Pet ${a+1}`,o.setAttribute("data-pet-index",a),o.querySelectorAll("input, select, textarea").forEach(r=>{if(r.name&&r.name.startsWith("pets[")){const m=r.name.replace(/pets\[\d+\]/,`pets[${a}]`);r.name=m}})})}async function C(t){t.preventDefault();try{w(!0),L();const e=new FormData(h),o=e.get("password"),a=e.get("confirmPassword");if(o!==a)throw new Error("As senhas não coincidem");if(o.length<6)throw new Error("A senha deve ter pelo menos 6 caracteres");const i={email:e.get("email"),password_hash:await A(o),role:"client",name:e.get("name"),phone:e.get("phone")||null,emergency_contact:e.get("emergency_contact"),veterinarian:e.get("veterinarian"),authorize_emergency_care:e.get("authorize_emergency_care")==="true",additional_comments:e.get("additional_comments")||null},{data:r}=await f.from("users").select("id").eq("email",i.email).single();if(r)throw new Error("Este email já está cadastrado");const{data:m,error:y}=await f.from("users").insert([i]).select().single();if(y)throw y;console.log("Usuário criado:",m);const u=[];if(document.querySelectorAll(".pet-section").forEach((g,n)=>{const d={owner_id:m.id,name:e.get(`pets[${n}][name]`),breed:e.get(`pets[${n}][breed]`),age:parseInt(e.get(`pets[${n}][age]`)),sex:e.get(`pets[${n}][sex]`),weight:e.get(`pets[${n}][weight]`)?parseFloat(e.get(`pets[${n}][weight]`)):null,vaccinations_up_to_date:e.get(`pets[${n}][vaccinations_up_to_date]`)==="true",sociable_with_dogs:e.get(`pets[${n}][sociable_with_dogs]`)||null,friendly_with_strangers:e.get(`pets[${n}][friendly_with_strangers]`)||null,feeding_instructions:e.get(`pets[${n}][feeding_instructions]`)||null,medical_conditions:e.get(`pets[${n}][medical_conditions]`)||null};d.name&&d.breed&&d.age&&d.sex&&u.push(d)}),u.length>0){const{error:g}=await f.from("pets").insert(u);if(g)throw g;console.log("Pets criados:",u.length)}w(!1),M(),setTimeout(()=>{window.location.href="login.html"},3e3)}catch(e){console.error("Erro ao criar conta:",e),w(!1),N(e.message)}}async function A(t){const o=new TextEncoder().encode(t),a=await crypto.subtle.digest("SHA-256",o);return Array.from(new Uint8Array(a)).map(i=>i.toString(16).padStart(2,"0")).join("")}function w(t){!v||!p||(t?(v.classList.add("active"),p.disabled=!0,p.innerHTML='<i class="fas fa-spinner fa-spin"></i> Criando conta...'):(v.classList.remove("active"),p.disabled=!1,p.innerHTML='<i class="fas fa-user-plus"></i> Criar Conta'))}function M(){l&&(l.style.display="block"),c&&(c.style.display="none")}function N(t){b&&(b.textContent=t),c&&(c.style.display="block"),l&&(l.style.display="none")}function L(){l&&(l.style.display="none"),c&&(c.style.display="none")}window.addPet=q;window.removePet=B;
