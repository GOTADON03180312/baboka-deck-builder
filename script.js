let cards = []; 
let deck = [];
let currentCard = null;

// =====================================
// cardsフォルダ内の全JSONを自動読み込み 
// =====================================
async function loadAllCards() {
  try {
    // index.json を読む
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

  // -------------------------
  // 検索
  // -------------------------
  const word = document.getElementById("search").value.toLowerCase();
  if (word) list = list.filter(c => c.name.toLowerCase().includes(word));

  // -------------------------
  // 複数選択フィルタ
  // -------------------------
  // レアリティ
  const raritySelected = Array.from(document.querySelectorAll("#filter-row .filter-dropdown:nth-child(1) .filter-content input:checked"))
    .map(i => i.value);

  if (raritySelected.length > 0) {
    list = list.filter(c => {
      if (raritySelected.includes("その他")) {
        return !["N","NP","R","RP","S","SP","頂","頂P","極","極P","P","D"].includes(c.rarity) || raritySelected.includes(c.rarity);
      } else {
        return raritySelected.includes(c.rarity);
      }
    });
  }

  // ポジション
  const typeSelected = Array.from(document.querySelectorAll("#filter-row .filter-dropdown:nth-child(2) .filter-content input:checked"))
    .map(i => i.value);

  if (typeSelected.length > 0) {
    list = list.filter(c => {
      if (typeSelected.includes("その他")) {
        const types = c.type ? c.type.split("/") : [];
        return types.some(t => typeSelected.includes(t)) || types.every(t => !["WS","S","MB","Li","イベント"].includes(t));
      } else {
        const types = c.type ? c.type.split("/") : [];
        return types.some(t => typeSelected.includes(t));
      }
    });
  }

  // 所属
  const attrSelected = Array.from(document.querySelectorAll("#filter-row .filter-dropdown:nth-child(3) .filter-content input:checked"))
    .map(i => i.value);

  if (attrSelected.length > 0) {
    list = list.filter(c => {
      if (attrSelected.includes("その他")) {
        const attrs = c.attr ? c.attr.split("/") : [];
        return attrs.some(a => attrSelected.includes(a)) || attrs.every(a => !["烏野","音駒","青葉城西","梟谷","白鳥沢","伊達工業","稲荷崎","鴎台"].includes(a));
      } else {
        const attrs = c.attr ? c.attr.split("/") : [];
        return attrs.some(a => attrSelected.includes(a));
      }
    });
  }

  // -------------------------
  // ソート（ステータス）
  // -------------------------
  const key = document.getElementById("sort-key").value;
  const order = document.getElementById("sort-order").value;

  if (key) {
    list.sort((a, b) => {
      const x = a[key] ?? 0;
      const y = b[key] ?? 0;
      return order === "asc" ? x - y : y - x;
    });
  }

  // -------------------------
  // カード枚数表示更新
  // -------------------------
  document.getElementById("card-count").textContent = `表示：${list.length}枚`;

  // -------------------------
  // グリッド描画
  // -------------------------
  list.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.draggable = true;
    div.innerHTML = `
      <img src="${card.image}" alt="${card.name}">
      <div>${card.name}</div>
    `;
    div.onclick = () => showPreview(card);
    div.ondragstart = e => e.dataTransfer.setData("id", card.id);
    grid.appendChild(div);
  });

  // =====================================
  // フィルタボタン・ソートセレクト色更新（追加）
  // =====================================
  updateFilterButtonColors();
  updateSortColors();
}

// =====================================
// フィルタドロップダウン展開 & 解除ボタン
// =====================================
document.querySelectorAll(".filter-dropdown").forEach(dropdown => {
  const btn = dropdown.querySelector(".filter-btn");
  const content = dropdown.querySelector(".filter-content");

  // ドロップダウン開閉
  btn.addEventListener("click", e => {
    e.stopPropagation();
    content.classList.toggle("show");
  });

  // 「解除」ボタンを作成
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "解除";
  resetBtn.style.marginLeft = "5px";
  resetBtn.style.fontSize = "0.8em";
  resetBtn.onclick = e => {
    e.stopPropagation(); // ドロップダウン開閉の影響を避ける
    dropdown.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    renderCards();
  };
  btn.parentNode.insertBefore(resetBtn, btn.nextSibling);
});

// ドロップダウン外をクリックしたら閉じる
document.addEventListener("click", e => {
  document.querySelectorAll(".filter-dropdown .filter-content.show").forEach(content => {
    if (!content.contains(e.target)) {
      content.classList.remove("show");
    }
  });
});

// =====================================
// デッキ側の操作
// =====================================
document.getElementById("deck-panel").ondragover = e => e.preventDefault();

document.getElementById("deck-panel").ondrop = e => {
  e.preventDefault();
  const id = e.dataTransfer.getData("id");
  const card = cards.find(c => c.id === id);
  if (card) addCardMultiple(card, 1);
};

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
      <span>${card.name}</span>
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
  if (fromDeck) {
    const count = deck.filter(c => c.id === card.id).length;
    qtyInput.value = count;
  } else {
    qtyInput.value = 1;
  }
}

document.getElementById("close").onclick = () =>
  document.getElementById("modal").classList.add("hidden");

document.getElementById("increase").onclick = () => {
  const i = document.getElementById("card-quantity");
  i.value = Math.min(40, parseInt(i.value) + 1);
};

document.getElementById("decrease").onclick = () => {
  const i = document.getElementById("card-quantity");
  i.value = Math.max(0, parseInt(i.value) - 1);
};

document.getElementById("add-to-deck").onclick = () => {
  const qty = Math.max(0, Math.min(40, parseInt(document.getElementById("card-quantity").value)));

  deck = deck.filter(c => c.id !== currentCard.id);
  addCardMultiple(currentCard, qty);

  renderDeck();
  document.getElementById("modal").classList.add("hidden");
};

// モーダル外クリックで閉じる
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");

modal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modalContent.addEventListener("click", e => {
  e.stopPropagation();
});

// =====================================
// エクスポート（修正版：名前入力対応）
// =====================================
document.getElementById("export").onclick = () => {
  if (deck.length === 0) {
    alert("デッキが空です！");
    return;
  }

  // 名前入力
  let deckName = prompt("デッキ名を入力してください", "mydeck");
  if (!deckName) return; // キャンセルした場合は何もしない

  // ファイル名を deckName.json にする
  const data = JSON.stringify(deck, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = deckName + ".json";
  a.click();
};

// =====================================
// 入力イベントで即時反映 + 検索クリアボタン
// =====================================
const searchInput = document.getElementById("search");

// クリアボタン作成
const clearBtn = document.createElement("button");
clearBtn.textContent = "×";
clearBtn.style.marginLeft = "5px";
clearBtn.style.fontSize = "1em";
clearBtn.style.height = "24px";
clearBtn.style.verticalAlign = "middle";
clearBtn.onclick = () => {
  searchInput.value = "";
  renderCards();
};
searchInput.parentNode.insertBefore(clearBtn, searchInput.nextSibling);

// 検索とフィルターの入力イベント
document.querySelectorAll("#search, #filter-row input, #sort-key, #sort-order")
  .forEach(e => e.addEventListener("input", renderCards));

// =====================================
// 初期読み込み
// =====================================
loadAllCards();
setNewDeckTitle();

// =====================================
// JSONインポート機能
// =====================================
const importDropZone = document.getElementById("import-drop-zone");
const importFileInput = document.getElementById("import-file-input");

// クリックでファイル選択
importDropZone.addEventListener("click", () => importFileInput.click());

// ファイル選択時
importFileInput.addEventListener("change", (e) => {
  if (e.target.files.length) handleImportFile(e.target.files[0]);
});

// ドラッグ＆ドロップ対応
importDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  importDropZone.classList.add("dragover");
});
importDropZone.addEventListener("dragleave", (e) => {
  importDropZone.classList.remove("dragover");
});
importDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  importDropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleImportFile(e.dataTransfer.files[0]);
});

// ファイル処理
function handleImportFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      if (!Array.isArray(json)) throw new Error("配列形式のJSONではありません");
      deck = json;  // デッキ配列に代入
      saveDeck();   // ローカルストレージにも保存
      renderDeck();
      setDeckTitle(file.name.replace(".json", ""));
      alert("デッキを読み込みました");
    } catch (err) {
      alert("JSONの読み込みに失敗しました: " + err.message);
    }
  };
  reader.readAsText(file);
}

// デッキリセットモーダル
const resetBtn = document.getElementById("reset-deck-btn");
const resetModal = document.getElementById("reset-modal");
const cancelReset = document.getElementById("cancel-reset");
const confirmReset = document.getElementById("confirm-reset");

resetBtn.onclick = () => resetModal.classList.remove("hidden");
cancelReset.onclick = () => resetModal.classList.add("hidden");
confirmReset.onclick = () => {
  deck = [];
  saveDeck();
  renderDeck();
  setNewDeckTitle();
  resetModal.classList.add("hidden");
};

// =====================================
// フィルタボタン・ソートセレクト色変更関数（追加部分）
// =====================================
function updateFilterButtonColors() {
  document.querySelectorAll("#filter-row .filter-dropdown").forEach((dropdown) => {
    const btn = dropdown.querySelector(".filter-btn");
    const checked = dropdown.querySelectorAll("input:checked").length > 0;
    if (checked) {
      btn.style.backgroundColor = "rgba(54, 132, 215, 0.2)"; // 薄青
      btn.style.borderColor = "#3684d7";
    } else {
      btn.style.backgroundColor = "";
      btn.style.borderColor = "";
    }
  });
}

function updateSortColors() {
  const keySelect = document.getElementById("sort-key");
  keySelect.style.backgroundColor = keySelect.value ? "rgba(54, 132, 215, 0.2)" : "";
}

// =====================================
// ページタイトル制御
// =====================================
const pageTitle = document.getElementById("page-title");

// 新規デッキ用
function setNewDeckTitle() {
  pageTitle.textContent = "新規デッキ";
}

// 既存デッキ用
function setDeckTitle(name) {
  pageTitle.textContent = name;
}

// ホーム画面用（将来使用）
function setHomeTitle() {
  pageTitle.textContent = "バボカ!!BREAKデッキメーカー";
}

homeBtn.onclick = () => {
  location.href = "home.html";
};






