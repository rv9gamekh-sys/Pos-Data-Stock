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

    // Set Default Month on Purchases
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    document.getElementById('purchaseMonth').value = currentMonth;
    renderPurchasesTable();

    // Auto-fill saved URL in settings
    const savedUrl = localStorage.getItem('webAppUrl') || '';
    if (document.getElementById('settingAppUrl')) {
        document.getElementById('settingAppUrl').value = savedUrl;
    }
});

function getApiUrl() {
    return localStorage.getItem('webAppUrl') || '';
}

// ==========================================
// Navigation & Toggle Menu Logic
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

    // ⚙️ 1. ចុច Settings ទើបលោត Menu និង Modal ឡើងមក
    document.getElementById('btnOpenSettings').onclick = () => {
        document.getElementById('settingsMenuContainer').style.display = 'block'; // បង្ហាញ Menu
        document.getElementById('settingsModal').style.display = 'flex'; // បើក Modal
    };
    
    document.getElementById('btnCloseSettings').onclick = () => {
        document.getElementById('settingsModal').style.display = 'none';
    };
}

function showView(viewId) {
    document.getElementById(viewId).classList.add('active');
}

function updateDashboard() {
    document.getElementById('dashTotalItems').innerText = products.length;

    const today = new Date().toISOString().split('T')[0];
    const todayIn = stockTransactions
        .filter(t => t.type === 'IN' && t.date === today)
        .reduce((sum, t) => sum + Number(t.qty), 0);
    document.getElementById('dashStockIn').innerText = todayIn;

    const todayWaste = wasteStocks
        .filter(w => w.date === today)
        .reduce((sum, w) => sum + Number(w.qty), 0);
    document.getElementById('dashWaste').innerText = todayWaste;
}

// ==========================================
// Product Management
// ==========================================
function renderProducts() {
    const tbody = document.getElementById('tblProductList');
    tbody.innerHTML = '';

    products.forEach((prod, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${prod.name}</strong></td>
                <td>${prod.category}</td>
                <td>${prod.unit}</td>
                <td>$${parseFloat(prod.price || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editProduct(${idx})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${idx})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function openProductModal() {
    document.getElementById('modalTitle').innerText = "Add Item";
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
    document.getElementById('editItemIndex').value = '';
}

document.getElementById('productForm').onsubmit = function (e) {
    e.preventDefault();
    const editIdx = document.getElementById('editItemIndex').value;
    const newProduct = {
        name: document.getElementById('pName').value,
        category: document.getElementById('pCategory').value,
        unit: document.getElementById('pUnit').value,
        price: document.getElementById('pPrice').value
    };

    if (editIdx !== "") {
        products[editIdx] = newProduct;
    } else {
        products.push(newProduct);
        saveProductToGoogleSheets(newProduct);
    }

    localStorage.setItem('products', JSON.stringify(products));
    closeProductModal();
    renderProducts();
    populateSelectDropdowns();
    updateDashboard();
};

function editProduct(idx) {
    const prod = products[idx];
    document.getElementById('pName').value = prod.name;
    document.getElementById('pCategory').value = prod.category;
    document.getElementById('pUnit').value = prod.unit;
    document.getElementById('pPrice').value = prod.price;
    document.getElementById('editItemIndex').value = idx;
    document.getElementById('modalTitle').innerText = "Edit Item";
    document.getElementById('productModal').style.display = 'flex';
}

function saveProductToGoogleSheets(productData) {
    const url = getApiUrl();
    if (!url) return;

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "addProduct",
            name: productData.name,
            category: productData.category,
            unit: productData.unit,
            price: productData.price
        })
    }).then(() => alert("✅ បានបន្ថែម Product ចូល Google Sheet រួចរាល់!"))
      .catch(err => console.error(err));
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
// Daily Stock & Stock In/Out
// ==========================================
function renderDailyStockTable() {
    const tbody = document.getElementById('tblDailyStock');
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

document.getElementById('btnSaveDailyStock').onclick = function () {
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

document.getElementById('btnAddStockInOut').onclick = function () {
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

function renderStockInOutTable() {
    const tbody = document.getElementById('tblStockInOut');
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

document.getElementById('btnAddWaste').onclick = function () {
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

function renderWasteTable() {
    const tbody = document.getElementById('tblWasteStock');
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
// 🛒 2. Purchases Order (Filter Day & Month)
// ==========================================
document.getElementById('btnFilterPurchases').onclick = () => {
    renderPurchasesTable();
};

function renderPurchasesTable() {
    const selectedMonth = document.getElementById('purchaseMonth').value;
    const selectedDay = String(document.getElementById('purchaseDay').value).padStart(2, '0');
    
    if (!selectedMonth || !selectedDay) return;

    const targetDate = `${selectedMonth}-${selectedDay}`; // Formats: YYYY-MM-DD
    const tbody = document.getElementById('tblPurchases');
    tbody.innerHTML = '';

    products.forEach((prod, idx) => {
        // គណនា Stock In រហូតដល់ថ្ងៃជ្រើសរើស
        const totalIn = stockTransactions
            .filter(t => t.itemName === prod.name && t.type === 'IN' && t.date <= targetDate)
            .reduce((sum, t) => sum + Number(t.qty), 0);

        // គណនា Stock Out រហូតដល់ថ្ងៃជ្រើសរើស
        const totalOut = stockTransactions
            .filter(t => t.itemName === prod.name && t.type === 'OUT' && t.date <= targetDate)
            .reduce((sum, t) => sum + Number(t.qty), 0);

        const currentStock = totalIn - totalOut;
        const recommendedQty = currentStock < 5 ? (10 - currentStock) : 0; // ឧទាហរណ៍ Threshold < 5

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

// ==========================================
// Settings Actions
// ==========================================
document.getElementById('btnSaveApiUrl').onclick = () => {
    const url = document.getElementById('settingAppUrl').value.trim();
    localStorage.setItem('webAppUrl', url);
    alert('✅ បានរក្សាទុក Google Web App URL រួចរាល់!');
};

document.getElementById('btnAddCategory').onclick = () => {
    const input = document.getElementById('newCategoryInput');
    const val = input.value.trim();
    if (val) {
        let categories = JSON.parse(localStorage.getItem('categories')) || ['Fruit', 'Powder', 'Syrup', 'Milk'];
        if (!categories.includes(val)) categories.push(val);
        localStorage.setItem('categories', JSON.stringify(categories));
        input.value = '';
        alert(`✅ បានបន្ថែម Category: ${val}`);
    }
};

document.getElementById('btnAddUnit').onclick = () => {
    const input = document.getElementById('newUnitInput');
    const val = input.value.trim();
    if (val) {
        let units = JSON.parse(localStorage.getItem('units')) || ['kg', 'g', 'can', 'bottle', 'pack'];
        if (!units.includes(val)) units.push(val);
        localStorage.setItem('units', JSON.stringify(units));
        input.value = '';
        alert(`✅ បានបន្ថែម Unit: ${val}`);
    }
};

document.getElementById('btnResetData').onclick = () => {
    if (confirm('⚠️ តើអ្នកប្រាកដថាចង់ Reset ទិន្នន័យ Stock ទាំងអស់ឡើងវិញ?')) {
        localStorage.clear();
        location.reload();
    }
};

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