const STORAGE_KEY = "asset-management-app-assets";

const form = document.getElementById("asset-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const tableBody = document.getElementById("asset-table-body");
const emptyMessage = document.getElementById("empty-message");
const totalAssetsEl = document.getElementById("total-assets");
const assetCountEl = document.getElementById("asset-count");
const rowTemplate = document.getElementById("asset-row-template");
const clearAllButton = document.getElementById("clear-all");

let assets = loadAssets();

function loadAssets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAssets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function render() {
  tableBody.innerHTML = "";

  assets.forEach((asset) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);

    row.querySelector(".asset-name").textContent = asset.name;
    row.querySelector(".asset-category").textContent = asset.category;
    row.querySelector(".asset-amount").textContent = yen(asset.amount);

    row.querySelector(".delete").addEventListener("click", () => {
      assets = assets.filter((item) => item.id !== asset.id);
      saveAssets();
      render();
    });

    row.querySelector(".edit").addEventListener("click", () => {
      const nextName = window.prompt("資産名を入力してください", asset.name);
      if (nextName === null || !nextName.trim()) return;

      const nextAmountRaw = window.prompt(
        "金額（円）を入力してください",
        String(asset.amount),
      );

      if (nextAmountRaw === null) return;

      const nextAmount = Number(nextAmountRaw);
      if (!Number.isFinite(nextAmount) || nextAmount < 0) {
        window.alert("金額は0以上の数値を入力してください。");
        return;
      }

      assets = assets.map((item) =>
        item.id === asset.id
          ? { ...item, name: nextName.trim(), amount: Math.floor(nextAmount) }
          : item,
      );

      saveAssets();
      render();
    });

    tableBody.appendChild(row);
  });

  const total = assets.reduce((sum, asset) => sum + asset.amount, 0);
  totalAssetsEl.textContent = yen(total);
  assetCountEl.textContent = String(assets.length);

  emptyMessage.style.display = assets.length === 0 ? "block" : "none";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const amount = Number(amountInput.value);

  if (!name || !category || !Number.isFinite(amount) || amount < 0) {
    window.alert("入力値を確認してください。");
    return;
  }

  assets.push({
    id: crypto.randomUUID(),
    name,
    category,
    amount: Math.floor(amount),
  });

  form.reset();
  saveAssets();
  render();
});

clearAllButton.addEventListener("click", () => {
  if (!assets.length) return;

  if (!window.confirm("登録済みの資産をすべて削除しますか？")) return;
  assets = [];
  saveAssets();
  render();
});

render();
