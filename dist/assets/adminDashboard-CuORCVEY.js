import{c as E}from"./index-C_6bkvJA.js";/* empty css               */const C="https://ntvpbxdnjslfwhezjoah.supabase.co",L="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dnBieGRuanNsZndoZXpqb2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTg2NDQsImV4cCI6MjA2NzE3NDY0NH0.zN37OSZOX-Ylp2Qv7UDw3w4TMdJOvPPgJhTwi1wNBeg",f=E(C,L);let v=[],c=[],w=[];const I=document.getElementById("loadingOverlay"),k=document.getElementById("pendingBookingsList"),_=document.getElementById("bookingDetailsModal"),M=document.getElementById("bookingDetailsContent");document.addEventListener("DOMContentLoaded",function(){if(console.log("Admin Dashboard - Iniciado"),!T()){alert("Acesso negado. Apenas administradores podem acessar esta página."),window.location.href="login.html";return}S()});function T(){return localStorage.getItem("adminLoggedIn")==="true"}async function S(){try{r(!0),await $(),b(),y(),r(!1),console.log("Admin Dashboard carregado com sucesso")}catch(e){console.error("Erro ao carregar dashboard admin:",e),r(!1),alert("Erro ao carregar dados do dashboard.")}}async function $(){try{const{data:e,error:t}=await f.from("bookings").select(`
                *,
                client:users!bookings_client_id_fkey(name, email, phone),
                booking_pets(
                    pet:pets(name, breed, age, sex)
                )
            `).order("created_at",{ascending:!1});if(t)throw t;c=e||[],v=c.filter(s=>s.status==="pending");const{data:o,error:n}=await f.from("users").select("*").order("created_at",{ascending:!1});if(n)throw n;w=o||[],console.log("Dados carregados:",{bookings:c.length,pending:v.length,users:w.length})}catch(e){throw console.error("Erro ao carregar dados:",e),e}}function b(){document.getElementById("pendingCount").textContent=v.length;const e=new Date,t=c.filter(s=>{const i=new Date(s.created_at);return s.status==="approved"&&i.getMonth()===e.getMonth()&&i.getFullYear()===e.getFullYear()});document.getElementById("approvedCount").textContent=t.length;const o=w.filter(s=>s.role==="client");document.getElementById("clientsCount").textContent=o.length;const n=Math.min(100,Math.round(c.length/30*100));document.getElementById("occupancyRate").textContent=`${n}%`}function y(){if(v.length===0){k.innerHTML=`
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Nenhuma reserva pendente</h4>
                <p>Todas as reservas foram processadas.</p>
            </div>
        `;return}k.innerHTML="",v.forEach(e=>{const t=j(e);k.appendChild(t)})}function j(e){var g,m,u,h;const t=document.createElement("div");t.className="booking-item";const o=new Date(e.checkin_date).toLocaleDateString("pt-PT"),n=new Date(e.checkout_date).toLocaleDateString("pt-PT"),s=new Date(e.created_at).toLocaleDateString("pt-PT"),i=new Date(e.checkin_date),D=new Date(e.checkout_date),d=Math.ceil((D-i)/(1e3*60*60*24)),l=((g=e.booking_pets)==null?void 0:g.map(a=>a.pet))||[],p=l.length>0?l.map(a=>`${a.name} (${a.breed})`).join(", "):"Nenhum pet associado";return t.innerHTML=`
        <div class="booking-header">
            <div>
                <h4>${((m=e.client)==null?void 0:m.name)||"Cliente não encontrado"}</h4>
                <p><i class="fas fa-envelope"></i> ${((u=e.client)==null?void 0:u.email)||"N/A"}</p>
                <p><i class="fas fa-phone"></i> ${((h=e.client)==null?void 0:h.phone)||"N/A"}</p>
                <p><i class="fas fa-calendar"></i> Solicitado em: ${s}</p>
            </div>
            <span class="status-badge status-${e.status}">${B(e.status)}</span>
        </div>
        
        <div class="pet-info">
            <strong>Pets:</strong> ${p}
        </div>
        
        <div style="margin: 1rem 0;">
            <p><strong>Check-in:</strong> ${o}</p>
            <p><strong>Check-out:</strong> ${n}</p>
            <p><strong>Duração:</strong> ${d} ${d===1?"dia":"dias"}</p>
            ${e.daily_rate?`<p><strong>Valor/dia:</strong> €${parseFloat(e.daily_rate).toFixed(2)}</p>`:""}
            ${e.observations?`<p><strong>Observações:</strong> ${e.observations}</p>`:""}
        </div>
        
        <div class="booking-actions">
            <button class="btn-approve" onclick="approveBooking('${e.id}')">
                <i class="fas fa-check"></i> Aprovar
            </button>
            <button class="btn-reject" onclick="rejectBooking('${e.id}')">
                <i class="fas fa-times"></i> Rejeitar
            </button>
            <button class="btn btn-secondary" onclick="viewBookingDetails('${e.id}')">
                <i class="fas fa-eye"></i> Detalhes
            </button>
        </div>
    `,t}function B(e){return{pending:"Pendente",approved:"Aprovada",rejected:"Rejeitada",completed:"Concluída",cancelled:"Cancelada"}[e]||e}async function N(e){if(confirm("Tem certeza que deseja aprovar esta reserva?"))try{r(!0);const{error:t}=await f.from("bookings").update({status:"approved",approved_at:new Date().toISOString(),approved_by:"admin"}).eq("id",e);if(t)throw t;await $(),b(),y(),r(!1),alert("Reserva aprovada com sucesso!")}catch(t){console.error("Erro ao aprovar reserva:",t),r(!1),alert("Erro ao aprovar reserva. Tente novamente.")}}async function A(e){const t=prompt("Motivo da rejeição (opcional):");if(t!==null)try{r(!0);const o={status:"rejected",approved_at:new Date().toISOString(),approved_by:"admin"};t.trim()&&(o.admin_notes=t.trim());const{error:n}=await f.from("bookings").update(o).eq("id",e);if(n)throw n;await $(),b(),y(),r(!1),alert("Reserva rejeitada.")}catch(o){console.error("Erro ao rejeitar reserva:",o),r(!1),alert("Erro ao rejeitar reserva. Tente novamente.")}}function O(e){var g,m,u,h;const t=c.find(a=>a.id===e);if(!t){alert("Reserva não encontrada.");return}const o=new Date(t.checkin_date).toLocaleDateString("pt-PT"),n=new Date(t.checkout_date).toLocaleDateString("pt-PT"),s=new Date(t.created_at).toLocaleDateString("pt-PT"),i=new Date(t.checkin_date),D=new Date(t.checkout_date),d=Math.ceil((D-i)/(1e3*60*60*24)),l=((g=t.booking_pets)==null?void 0:g.map(a=>a.pet))||[];let p="";l.length>0?p=l.map(a=>`
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <h4>${a.name}</h4>
                <p><strong>Raça:</strong> ${a.breed}</p>
                <p><strong>Idade:</strong> ${a.age} ${a.age===1?"ano":"anos"}</p>
                <p><strong>Sexo:</strong> ${a.sex==="male"?"Macho":"Fêmea"}</p>
            </div>
        `).join(""):p="<p>Nenhum pet associado a esta reserva.</p>",M.innerHTML=`
        <div style="padding: 1rem;">
            <h3>Informações do Cliente</h3>
            <p><strong>Nome:</strong> ${((m=t.client)==null?void 0:m.name)||"N/A"}</p>
            <p><strong>Email:</strong> ${((u=t.client)==null?void 0:u.email)||"N/A"}</p>
            <p><strong>Telefone:</strong> ${((h=t.client)==null?void 0:h.phone)||"N/A"}</p>
            
            <h3 style="margin-top: 2rem;">Detalhes da Reserva</h3>
            <p><strong>Check-in:</strong> ${o}</p>
            <p><strong>Check-out:</strong> ${n}</p>
            <p><strong>Duração:</strong> ${d} ${d===1?"dia":"dias"}</p>
            <p><strong>Status:</strong> ${B(t.status)}</p>
            <p><strong>Solicitado em:</strong> ${s}</p>
            ${t.daily_rate?`<p><strong>Valor/dia:</strong> €${parseFloat(t.daily_rate).toFixed(2)}</p>`:""}
            ${t.pickup_time?`<p><strong>Horário preferido:</strong> ${t.pickup_time}</p>`:""}
            
            <h3 style="margin-top: 2rem;">Pets</h3>
            ${p}
            
            ${t.observations?`
                <h3 style="margin-top: 2rem;">Observações do Cliente</h3>
                <p>${t.observations}</p>
            `:""}
            
            ${t.admin_notes?`
                <h3 style="margin-top: 2rem;">Notas do Administrador</h3>
                <p>${t.admin_notes}</p>
            `:""}
        </div>
    `,_.classList.add("active")}function P(){_.classList.remove("active")}function x(){confirm("Tem certeza que deseja sair?")&&(localStorage.removeItem("adminLoggedIn"),window.location.href="login.html")}function r(e){e?I.classList.add("active"):I.classList.remove("active")}window.approveBooking=N;window.rejectBooking=A;window.viewBookingDetails=O;window.closeBookingDetails=P;window.logout=x;
