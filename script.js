let cards = []; 
let deck = [];
let currentCard = null;

// =====================================
// cardsフォルダ内の全JSONを自動読み込み
// =====================================
async function loadAllCards() {
  try {
    const indexRes = await fetch("data/index.json");
    const files = await indexRes.json();

    for (const file of files) {
      const res = await fetch(`data/${file}`);
      const part = await res.json();
      cards.push(...part);
    }

    loadDeck();
    renderCards();
    renderDeck();

  } catch (e) {
    alert("カードデータの読み込みに失敗しました");
    console.error(e);
  }
}

// =====================================
// カード描画（フィルタ + ソート）
// =====================================
function renderCards() {
  const grid = document.getElementById("card-grid");
  grid.innerHTML = "";

  let list = [...cards];

  const word = document.getElementById("search").value.toLowerCase();
  if (word) list = list.filter(c => c.name.toLowerCase().includes(word));

  const raritySelected = Array.from(
    document.querySelectorAll("#filter-row .filter-dropdown:nth-child(1) input:checked")
  ).map(i => i.value);

  if (raritySelected.length) {
    list = list.filter(c => raritySelected.includes(c.rarity));
  }

  const typeSelected = Array.from(
    document.querySelectorAll("#filter-row .filter-dropdown:nth-child(2) input:checked")
  ).map(i => i.value);

  if (typeSelected.length) {
    list = list.filter(c => {
      const types = c.type ? c.type.split("/") : [];
      return types.some(t => typeSelected.includes(t));
    });
  }

  const attrSelected = Array.from(
    document.querySelectorAll("#filter-row .filter-dropdown:nth-child(3) input:checked")
  ).map(i => i.value);

  if (attrSelected.length) {
    list = list.filter(c => {
      const attrs = c.attr ? c.attr.split("/") : [];
      return attrs.some(a => attrSelected.includes(a));
    });
  }

  const key = document.getElementById("sort-key").value;
  const order = document.getElementById("sort-order").value;

  if (key) {
    list.sort((a, b) => {
      const x = a[key] ?? 0;
      const y = b[key] ?? 0;
      return order === "asc" ? x - y : y - x;
    });
  }

  document.getElementById("card-count").textContent = `表示：${list.length}枚`;

  list.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${card.image}">
      <div>${card.name}</div>
    `;
    div.onclick = () => showPreview(card);
    grid.appendChild(div);
  });
}

// =====================================
// デッキ操作
// =====================================
function addCardMultiple(card, qty) {
  for (let i = 0; i < qty; i++) deck.push(card);
  saveDeck();
  renderDeck();
}

function removeCard(i) {
  deck.splice(i, 1);
  saveDeck();
  renderDeck();
}

function renderDeck() {
  const div = document.getElementById("deck");
  div.innerHTML = "";

  deck.forEach((card, i) => {
    const item = document.createElement("div");
    item.className = "deck-item";
    item.innerHTML = `
      <img src="${card.image}">
      <span class="remove-btn" onclick="removeCard(${i})">✕</span>
    `;
    item.onclick = () => showPreview(card, true);
    div.appendChild(item);
  });

  document.getElementById("count").textContent = deck.length;
}

function saveDeck() {
  localStorage.setItem("mydeck", JSON.stringify(deck));
}

function loadDeck() {
  const d = localStorage.getItem("mydeck");
  if (d) deck = JSON.parse(d);
}

// =====================================
// プレビュー（枚数調整）
// =====================================
function showPreview(card, fromDeck = false) {
  currentCard = card;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-image").src = card.image;
  document.getElementById("modal-name").textContent = card.name;

  const qtyInput = document.getElementById("card-quantity");
  qtyInput.value = fromDeck
    ? deck.filter(c => c.id === card.id).length
    : 1;
}

document.getElementById("close").onclick = () =>
  document.getElementById("modal").classList.add("hidden");

// ★ 変更点：pointerdown で即反応
const qtyInput = document.getElementById("card-quantity");

document.getElementById("increase").addEventListener("pointerdown", e => {
  e.preventDefault();
  qtyInput.value = Math.min(40, parseInt(qtyInput.value) + 1);
});

document.getElementById("decrease").addEventListener("pointerdown", e => {
  e.preventDefault();
  qtyInput.value = Math.max(0, parseInt(qtyInput.value) - 1);
});

document.getElementById("add-to-deck").onclick = () => {
  const qty = Math.max(0, Math.min(40, parseInt(qtyInput.value)));
  deck = deck.filter(c => c.id !== currentCard.id);
  addCardMultiple(currentCard, qty);
  document.getElementById("modal").classList.add("hidden");
};

// =====================================
// 初期化
// =====================================
loadAllCards();
