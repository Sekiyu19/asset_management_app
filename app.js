const STORAGE_KEY = "asset-management-items";

const categoryLabels = {
  cash: "現金・預金",
  investment: "投資",
  "real-estate": "不動産",
  "other-assets": "その他資産",
  liability: "負債",
};

const form = document.querySelector("#asset-form");
const listElement = document.querySelector("#asset-list");
const clearAllButton = document.querySelector("#clear-all");
const template = document.querySelector("#asset-item-template");

const totalAssetsElement = document.querySelector("#total-assets");
const totalLiabilitiesElement = document.querySelector("#total-liabilities");
const netWorthElement = document.querySelector("#net-worth");

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

let items = loadItems();
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = (formData.get("name") || "").toString().trim();
  const category = formData.get("category").toString();
  const amount = Number(formData.get("amount"));
  const memo = (formData.get("memo") || "").toString().trim();

  if (!name || Number.isNaN(amount) || amount < 0) {
    return;
  }

  items.push({
    id: crypto.randomUUID(),
    name,
    category,
    amount,
    memo,
    createdAt: new Date().toISOString(),
  });

  saveItems(items);
  form.reset();
  render();
});

clearAllButton.addEventListener("click", () => {
  if (!items.length) {
    return;
  }

  const canDelete = window.confirm("登録されたデータをすべて削除します。よろしいですか？");
  if (!canDelete) {
    return;
  }

  items = [];
  saveItems(items);
  render();
});

function render() {
  listElement.textContent = "";

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "まだ登録がありません。フォームから追加してください。";
    listElement.appendChild(empty);
  } else {
    items
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((item) => {
        const fragment = template.content.cloneNode(true);
        const root = fragment.querySelector(".asset-item");
        const nameElement = fragment.querySelector(".asset-name");
        const metaElement = fragment.querySelector(".asset-meta");
        const amountElement = fragment.querySelector(".asset-amount");
        const deleteButton = fragment.querySelector("button");

        nameElement.textContent = item.name;

        const label = categoryLabels[item.category] || item.category;
        const memoText = item.memo ? ` / ${item.memo}` : "";
        metaElement.textContent = `${label}${memoText}`;

        amountElement.textContent = yenFormatter.format(item.amount);
        if (item.category === "liability") {
          amountElement.textContent = `- ${amountElement.textContent}`;
        }

        deleteButton.addEventListener("click", () => {
          items = items.filter((candidate) => candidate.id !== item.id);
          saveItems(items);
          render();
        });

        root.dataset.id = item.id;
        listElement.appendChild(fragment);
      });
  }

  const totals = items.reduce(
    (acc, item) => {
      if (item.category === "liability") {
        acc.liabilities += item.amount;
      } else {
        acc.assets += item.amount;
      }
      return acc;
    },
    { assets: 0, liabilities: 0 }
  );

  const netWorth = totals.assets - totals.liabilities;

  totalAssetsElement.textContent = yenFormatter.format(totals.assets);
  totalLiabilitiesElement.textContent = yenFormatter.format(totals.liabilities);
  netWorthElement.textContent = yenFormatter.format(netWorth);
}

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveItems(nextItems) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
}
