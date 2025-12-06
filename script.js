// script.js (arquivo em módulo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, runTransaction, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- SUA CONFIGURAÇÃO DO FIREBASE (já fornecida por você) ---
const firebaseConfig = {
  apiKey: "AIzaSyB9gTaojRXu7J7g7yI7Hw_9lb3yDMr1ydg",
  authDomain: "cha-de-casa-nova-9034c.firebaseapp.com",
  projectId: "cha-de-casa-nova-9034c",
  storageBucket: "cha-de-casa-nova-9034c.firebasestorage.app",
  messagingSenderId: "396610857130",
  appId: "1:396610857130:web:14590d41081486e57048d3",
  measurementId: "G-Y8GJQB19PR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const presentesColl = collection(db, "presentes");

const defaultItems = [
  { id: "pratos", name: "Conjunto de pratos", buyer: "", bought: false },
  { id: "copos", name: "Jogo de copos", buyer: "", bought: false },
  { id: "frigideira", name: "Frigideira antiaderente", buyer: "", bought: false },
  { id: "toalhas", name: "Toalhas de banho", buyer: "", bought: false },
  { id: "panos", name: "Panos de prato", buyer: "", bought: false }
];

const listaEl = document.getElementById("lista-presentes");
const statusEl = document.getElementById("status");

// Inicializa itens padrão se coleção vazia (uma vez)
async function ensureDefaultItems(){
  // tenta ler um dos documentos
  const anyDoc = await getDoc(doc(db, "presentes", defaultItems[0].id));
  if(!anyDoc.exists()){
    for(const it of defaultItems){
      await setDoc(doc(presentesColl, it.id), it);
    }
  }
}

// Renderiza um item
function renderItem(item){
  const li = document.createElement("li");
  li.dataset.id = item.id;

  const info = document.createElement("div");
  info.className = "present-info";
  const name = document.createElement("div");
  name.className = "present-item-name";
  name.textContent = item.name;
  const meta = document.createElement("div");
  meta.className = "present-item-meta";
  meta.textContent = item.bought ? `Comprado por: ${item.buyer || "alguém"}` : "Disponível";

  info.appendChild(name);
  info.appendChild(meta);

  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = item.bought ? "Comprado ✔" : "Marcar como comprado";

  if(item.bought){
    btn.classList.add("secondary");
    btn.disabled = true;
  }

  btn.addEventListener("click", async () => {
    const id = item.id;
    const docRef = doc(db, "presentes", id);
    try {
      await runTransaction(db, async (t) => {
        const d = await t.get(docRef);
        if(!d.exists()) throw "Documento não existe";
        const data = d.data();
        if(data.bought) throw "Já comprado";
        // marca como comprado. Não colocamos nome do comprador (pode ser melhorado)
        t.update(docRef, { bought: true, buyer: "Alguém" });
      });
      // sucesso: UI será atualizada pelo onSnapshot
    } catch (err) {
      alert(typeof err === "string" ? err : "Falha ao marcar. Tente de novo.");
    }
  });

  li.appendChild(info);
  li.appendChild(btn);
  return li;
}

// Observa coleção em tempo real e atualiza a lista
function startRealtime(){
  onSnapshot(presentesColl, (snap) => {
    listaEl.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = renderItem({ id: docSnap.id, ...data });
      listaEl.appendChild(li);
    });
    statusEl.textContent = "Atualizado em tempo real ✅";
  }, (err) => {
    statusEl.textContent = "Erro na conexão: " + err.message;
  });
}

// Inicialização
(async function init(){
  statusEl.textContent = "Verificando dados... ⏳";
  try{
    await ensureDefaultItems();
    startRealtime();
  }catch(e){
    statusEl.textContent = "Erro: " + (e.message || e);
  }
})();
