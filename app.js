const STORAGE_KEY = "asset-management-app:data";

const form = document.getElementById("asset-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const tableBody = document.getElementById("asset-table-body");
const rowTemplate = document.getElementById("row-template");

const totalEl = document.getElementById("total");
const sumCashEl = document.getElementById("sum-cash");
const sumBankEl = document.getElementById("sum-bank");
const sumInvestEl = document.getElementById("sum-invest");

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

let assets = loadAssets();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const amount = Number(amountInput.value);

  if (!name || Number.isNaN(amount) || amount < 0) {
    return;
  }

  assets.push({
    id: crypto.randomUUID(),
    name,
    category,
    amount,
  });

  persistAssets();
  form.reset();
  render();
});

function loadAssets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) =>
      item && typeof item.id === "string" && typeof item.name === "string"
    );
  } catch {
    return [];
  }
}

function persistAssets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

function render() {
  tableBody.textContent = "";

  for (const asset of assets) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector("[data-name]").textContent = asset.name;
    row.querySelector("[data-category]").textContent = asset.category;
    row.querySelector("[data-amount]").textContent = yen.format(asset.amount);

    row.querySelector(".delete-btn").addEventListener("click", () => {
      assets = assets.filter((item) => item.id !== asset.id);
      persistAssets();
      render();
    });

    tableBody.append(row);
  }

  const totals = assets.reduce(
    (acc, asset) => {
      acc.total += asset.amount;

      if (asset.category === "現金") acc.cash += asset.amount;
      if (asset.category === "預金") acc.bank += asset.amount;
      if (asset.category === "投資") acc.invest += asset.amount;

      return acc;
    },
    { total: 0, cash: 0, bank: 0, invest: 0 }
  );

  totalEl.textContent = yen.format(totals.total);
  sumCashEl.textContent = yen.format(totals.cash);
  sumBankEl.textContent = yen.format(totals.bank);
  sumInvestEl.textContent = yen.format(totals.invest);
}
