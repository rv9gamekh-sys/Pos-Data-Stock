// 🔗 ដាក់ Google Apps Script Web App URL របស់បងនៅទីនេះ
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFq6nU9gDXZrNycbnMEtiAn581j1KKwaYDTZy4fiHUVhd5MIwDavm9nu91VWJaJSPiGg/exec";

// Local Data Stores
let products = JSON.parse(localStorage.getItem('products')) || [];
let dailyStocks = JSON.parse(localStorage.getItem('dailyStocks')) || [];
let stockTransactions = JSON.parse(localStorage.getItem('stockTransactions')) || [];
let wasteStocks = JSON.parse(localStorage.getItem('wasteStocks')) || [];

document.addEventListener("DOMContentLoaded", function () {
    setupNavigation();
    renderProducts();
    populateSelectDropdowns();
    renderDailyStockTable();
    renderStockInOutTable();
    renderWasteTable();
    updateDashboard();
    setupProductModalEvents();

    // Set Default Month on Purchases
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const purchaseMonthInput = document.getElementById('purchaseMonth');
    if (purchaseMonthInput) {
        purchaseMonthInput.value = currentMonth;
    }
    renderPurchasesTable();
});

// ==========================================
// Navigation Logic
// ==========================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

            const target = this.id;
            if (target === 'btnHome') { showView('viewHome'); updateDashboard(); }
            else if (target === 'btnNavProductList') { showView('viewProductList'); renderProducts(); }
            else if (target === 'btnNavDailyStock') { showView('viewDailyStock'); renderDailyStockTable(); }
            else if (target === 'btnNavStockInOut') { showView('viewStockInOut'); renderStockInOutTable(); }
            else if (target === 'btnNavWasteStock') { showView('viewWasteStock'); renderWasteTable(); }
            else if (target === 'btnNavPurchases') { showView('viewPurchases'); renderPurchasesTable(); }
            else if (target === 'btnNavWeeklyReport') showView('viewWeeklyReport');
            else if (target === 'btnNavMonthlyReport') showView('viewMonthlyReport');
        });
    });

    const btnSettings = document.getElementById('btnOpenSettings');
    if (btnSettings) {
        btnSettings.onclick = () => {
            const menu = document.getElementById('settingsMenuContainer');
            if (menu) {
                menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'block' : 'none';
            }
        };
    }
}

function showView(viewId) {
    const view = document.getElementById(viewId);
    if (view) view.classList.add('active');
}

function updateDashboard() {
    const totalElem = document.getElementById('dashTotalItems');
    if (totalElem) totalElem.innerText = products.length;

    const today = new Date().toISOString().split('T')[0];
    const todayIn = stockTransactions
        .filter(t => t.type === 'IN' && t.date === today)
        .reduce((sum, t) => sum + Number(t.qty), 0);
    const inElem = document.getElementById('dashStockIn');
    if (inElem) inElem.innerText = todayIn;

    const todayWaste = wasteStocks
        .filter(w => w.date === today)
        .reduce((sum, w) => sum + Number(w.qty), 0);
    const wasteElem = document.getElementById('dashWaste');
    if (wasteElem) wasteElem.innerText = todayWaste;
}

// ==========================================
// Product Management (Sync Google Sheet)
// ==========================================
function renderProducts() {
    const tbody = document.getElementById('tblProductList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">មិនទាន់មានទំនិញនៅឡើយទេ</td></tr>`;
        return;
    }

    products.forEach((prod, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${prod.name}</strong></td>
                <td>${prod.category || '-'}</td>
                <td>${prod.unit || '-'}</td>
                <td>$${parseFloat(prod.price || 0).toFixed(2)}</td>
                <td>
                    <button type="button" class="btn btn-secondary" onclick="editProduct(${idx})">Edit</button>
                    <button type="button" class="btn btn-danger" onclick="deleteProduct(${idx})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function openProductModal() {
    document.getElementById('modalTitle').innerText = "Add Item";
    document.getElementById('productForm').reset();
    document.getElementById('editItemIndex').value = "";
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
    document.getElementById('editItemIndex').value = "";
}

function setupProductModalEvents() {
    const btnClose = document.getElementById('btnCloseProductModal');
    if (btnClose) btnClose.onclick = closeProductModal;

    const modalOverlay = document.getElementById('productModal');
    if (modalOverlay) {
        modalOverlay.onclick = function (e) {
            if (e.target === modalOverlay) closeProductModal();
        };
    }

    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.onsubmit = function (e) {
            e.preventDefault();

            const submitBtn = productForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "⏳ Saving...";
            submitBtn.disabled = true;

            const editIdx = document.getElementById('editItemIndex').value;
            const newProduct = {
                action: "addProduct",
                name: document.getElementById('pName').value.trim(),
                category: document.getElementById('pCategory').value.trim(),
                unit: document.getElementById('pUnit').value.trim(),
                price: parseFloat(document.getElementById('pPrice').value) || 0
            };

            // 1. រក្សាទុកក្នុង LocalStorage
            if (editIdx !== "" && editIdx !== null) {
                products[editIdx] = newProduct;
            } else {
                products.push(newProduct);
            }
            localStorage.setItem('products', JSON.stringify(products));

            // Update UI
            renderProducts();
            populateSelectDropdowns();
            updateDashboard();

            // 2. ផ្ញើទិន្នន័យ Sync ទៅ Google Sheets (Drive)
            if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "" && GOOGLE_SCRIPT_URL.startsWith("http")) {
                fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newProduct)
                })
                .then(() => {
                    alert("✅ រក្សាទុកក្នុង Local និង Sync ទៅ Google Sheet រួចរាល់!");
                })
                .catch(err => {
                    console.error("Error Google Sheet:", err);
                    alert("⚠️ រក្សាទុកក្នុង Local រួចរាល់ ប៉ុន្តែមិនអាច Sync ទៅ Google Sheet បានទេ");
                })
                .finally(() => {
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                    closeProductModal();
                });
            } else {
                alert("✅ រក្សាទុកក្នុង Local រួចរាល់! (ពុំទាន់បានដាក់ Google Script URL)");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                closeProductModal();
            }
        };
    }
}

function editProduct(idx) {
    const prod = products[idx];
    if (!prod) return;

    document.getElementById('pName').value = prod.name;
    document.getElementById('pCategory').value = prod.category;
    document.getElementById('pUnit').value = prod.unit;
    document.getElementById('pPrice').value = prod.price;
    document.getElementById('editItemIndex').value = idx;
    
    document.getElementById('modalTitle').innerText = "Edit Item";
    document.getElementById('productModal').style.display = 'flex';
}

function deleteProduct(idx) {
    if (confirm("តើអ្នកប្រាកដថាចង់លុប Item នេះ?")) {
        products.splice(idx, 1);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
        populateSelectDropdowns();
        updateDashboard();
    }
}

// ==========================================
// Daily Stock & Stock In/Out & Waste
// ==========================================
function renderDailyStockTable() {
    const tbody = document.getElementById('tblDailyStock');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach((prod, idx) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${prod.name}</strong></td>
                <td><input type="number" class="form-control" id="open_${idx}" placeholder="Open Qty"></td>
                <td><input type="number" class="form-control" id="rest_${idx}" placeholder="Rest Qty"></td>
                <td><input type="text" class="form-control" id="remark_${idx}" placeholder="Remark"></td>
            </tr>
        `;
    });
}

const btnSaveDaily = document.getElementById('btnSaveDailyStock');
if (btnSaveDaily) {
    btnSaveDaily.onclick = function () {
        const today = document.getElementById('dailyStockDate').value || new Date().toISOString().split('T')[0];

        products.forEach((prod, idx) => {
            const openVal = document.getElementById(`open_${idx}`).value;
            const restVal = document.getElementById(`rest_${idx}`).value;
            const remarkVal = document.getElementById(`remark_${idx}`).value;

            if (openVal !== "" || restVal !== "") {
                dailyStocks.push({
                    date: today,
                    itemName: prod.name,
                    openStock: openVal,
                    restStock: restVal,
                    remark: remarkVal
                });
            }
        });

        localStorage.setItem('dailyStocks', JSON.stringify(dailyStocks));
        alert("✅ រក្សាទុក Daily Stock រួចរាល់!");
    };
}

const btnAddSIO = document.getElementById('btnAddStockInOut');
if (btnAddSIO) {
    btnAddSIO.onclick = function () {
        const item = document.getElementById('sioItemSelect').value;
        const type = document.getElementById('sioTypeSelect').value;
        const qty = document.getElementById('sioQty').value;
        const remark = document.getElementById('sioRemark').value;

        if (!item || !qty) {
            alert("សូមជ្រើសរើស Item និងបញ្ចូលចំនួន Qty!");
            return;
        }

        stockTransactions.push({
            date: new Date().toISOString().split('T')[0],
            itemName: item,
            type: type,
            qty: qty,
            remark: remark
        });

        localStorage.setItem('stockTransactions', JSON.stringify(stockTransactions));
        renderStockInOutTable();
        updateDashboard();

        document.getElementById('sioQty').value = '';
        document.getElementById('sioRemark').value = '';
    };
}

function renderStockInOutTable() {
    const tbody = document.getElementById('tblStockInOut');
    if (!tbody) return;
    tbody.innerHTML = '';

    stockTransactions.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${t.itemName}</strong></td>
                <td><span style="color: ${t.type === 'IN' ? 'green' : 'red'}; font-weight: bold;">${t.type}</span></td>
                <td>${t.qty}</td>
                <td>${t.remark}</td>
            </tr>
        `;
    });
}

const btnAddWaste = document.getElementById('btnAddWaste');
if (btnAddWaste) {
    btnAddWaste.onclick = function () {
        const item = document.getElementById('wasteItemSelect').value;
        const date = document.getElementById('wasteDate').value || new Date().toISOString().split('T')[0];
        const qty = document.getElementById('wasteQty').value;
        const remark = document.getElementById('wasteRemark').value;

        if (!item || !qty) {
            alert("សូមជ្រើសរើស Item និងបញ្ចូលចំនួន Waste Qty!");
            return;
        }

        wasteStocks.push({ date, itemName: item, qty, remark });
        localStorage.setItem('wasteStocks', JSON.stringify(wasteStocks));
        renderWasteTable();
        updateDashboard();

        document.getElementById('wasteQty').value = '';
        document.getElementById('wasteRemark').value = '';
    };
}

function renderWasteTable() {
    const tbody = document.getElementById('tblWasteStock');
    if (!tbody) return;
    tbody.innerHTML = '';

    wasteStocks.forEach((w, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${w.itemName}</strong></td>
                <td><span style="color: red; font-weight: bold;">${w.qty}</span></td>
                <td>${w.remark}</td>
            </tr>
        `;
    });
}

// ==========================================
// Purchases Order & Dropdowns
// ==========================================
const btnFilterPurchases = document.getElementById('btnFilterPurchases');
if (btnFilterPurchases) {
    btnFilterPurchases.onclick = () => { renderPurchasesTable(); };
}

function renderPurchasesTable() {
    const selectedMonth = document.getElementById('purchaseMonth') ? document.getElementById('purchaseMonth').value : '';
    const selectedDay = document.getElementById('purchaseDay') ? String(document.getElementById('purchaseDay').value).padStart(2, '0') : '01';
    
    if (!selectedMonth || !selectedDay) return;

    const targetDate = `${selectedMonth}-${selectedDay}`;
    const tbody = document.getElementById('tblPurchases');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach((prod, idx) => {
        const totalIn = stockTransactions
            .filter(t => t.itemName === prod.name && t.type === 'IN' && t.date <= targetDate)
            .reduce((sum, t) => sum + Number(t.qty), 0);

        const totalOut = stockTransactions
            .filter(t => t.itemName === prod.name && t.type === 'OUT' && t.date <= targetDate)
            .reduce((sum, t) => sum + Number(t.qty), 0);

        const currentStock = totalIn - totalOut;
        const recommendedQty = currentStock < 5 ? (10 - currentStock) : 0;

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${prod.name}</strong></td>
                <td>${currentStock > 0 ? currentStock : 0}</td>
                <td><span style="color: ${recommendedQty > 0 ? 'red' : 'green'}; font-weight: bold;">${recommendedQty}</span></td>
            </tr>
        `;
    });
}

function populateSelectDropdowns() {
    const sioSelect = document.getElementById('sioItemSelect');
    const wasteSelect = document.getElementById('wasteItemSelect');

    if (!sioSelect || !wasteSelect) return;

    sioSelect.innerHTML = '<option value="">Select Item</option>';
    wasteSelect.innerHTML = '<option value="">Select Item</option>';

    products.forEach(p => {
        sioSelect.innerHTML += `<option value="${p.name}">${p.name}</option>`;
        wasteSelect.innerHTML += `<option value="${p.name}">${p.name}</option>`;
    });
}