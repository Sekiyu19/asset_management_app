const STORAGE_KEY = "asset-management-items";

const form = document.getElementById("asset-form");
const totalEl = document.getElementById("total");
const categorySummaryEl = document.getElementById("category-summary");
const tableBody = document.getElementById("asset-table-body");
const clearAllBtn = document.getElementById("clear-all");

const formatJPY = (value) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);

const loadAssets = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveAssets = (assets) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
};

const render = () => {
  const assets = loadAssets();

  const total = assets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  totalEl.textContent = formatJPY(total);

  if (assets.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty">資産はまだ登録されていません。</td></tr>`;
    categorySummaryEl.innerHTML = "";
    return;
  }

  tableBody.innerHTML = assets
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${formatJPY(item.amount)}</td>
        <td>${item.memo || "-"}</td>
        <td><button data-id="${item.id}" class="danger delete-item">削除</button></td>
      </tr>
    `,
    )
    .join("");

  const byCategory = assets.reduce((acc, item) => {
    const key = item.category;
    acc[key] = (acc[key] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  categorySummaryEl.innerHTML = `
    <div class="summary-list">
      ${Object.entries(byCategory)
        .map(
          ([category, amount]) => `
            <div class="summary-item">
              <strong>${category}</strong><br />
              ${formatJPY(amount)}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const asset = {
    id: crypto.randomUUID(),
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    amount: Number(document.getElementById("amount").value),
    memo: document.getElementById("memo").value.trim(),
  };

  if (!asset.name || Number.isNaN(asset.amount) || asset.amount < 0) {
    return;
  }

  const assets = loadAssets();
  assets.push(asset);
  saveAssets(assets);

  form.reset();
  render();
});

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-item");
  if (!button) return;

  const id = button.dataset.id;
  const nextAssets = loadAssets().filter((item) => item.id !== id);
  saveAssets(nextAssets);
  render();
});

clearAllBtn.addEventListener("click", () => {
  const ok = window.confirm("登録済み資産をすべて削除します。よろしいですか？");
  if (!ok) return;

  saveAssets([]);
  render();
});

render();
