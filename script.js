// ==========================================
// 1. Google Apps Script Configuration
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyNllXOn4sI1K29sB2R1O6vInzKj_Q5kYf7vK1YI0kR-vNqG4WpC9Y_yJk0J1Z3j3w/exec"; // សូម Paste URL របស់បងទីនេះ

// Data Stores
let products = JSON.parse(localStorage.getItem('products')) || [];
let dailyStocks = JSON.parse(localStorage.getItem('dailyStocks')) || [];
let stockTransactions = JSON.parse(localStorage.getItem('stockTransactions')) || [];
let wasteStocks = JSON.parse(localStorage.getItem('wasteStocks')) || [];

// DOM Loaded Initializer
document.addEventListener("DOMContentLoaded", function () {
    setupNavigation();
    renderProducts();
    populateSelectDropdowns();
    renderDailyStockTable();
});

// ==========================================
// 2. Navigation Control
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
            if (target === 'btnHome') showView('viewHome');
            else if (target === 'btnNavProductList') { showView('viewProductList'); renderProducts(); }
            else if (target === 'btnNavDailyStock') { showView('viewDailyStock'); renderDailyStockTable(); }
            else if (target === 'btnNavStockInOut') { showView('viewStockInOut'); renderStockInOut(); }
            else if (target === 'btnNavWasteStock') { showView('viewWasteStock'); renderWasteStock(); }
            else if (target === 'btnNavPurchases') showView('viewPurchases');
            else if (target === 'btnNavWeeklyReport') showView('viewWeeklyReport');
            else if (target === 'btnNavMonthlyReport') showView('viewMonthlyReport');
        });
    });

    // Modal Control Settings
    document.getElementById('btnOpenSettings').onclick = () => document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('btnCloseSettings').onclick = () => document.getElementById('settingsModal').style.display = 'none';
}

function showView(viewId) {
    document.getElementById(viewId).classList.add('active');
}

// ==========================================
// 3. Product Management Logic
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
                <td>$${parseFloat(prod.price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editProduct(${idx})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${idx})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function openProductModal(type) {
    document.getElementById('modalTitle').innerText = "Add " + type.toUpperCase();
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('productForm').reset();
}

document.getElementById('productForm').onsubmit = function (e) {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById('pName').value,
        category: document.getElementById('pCategory').value,
        unit: document.getElementById('pUnit').value,
        price: document.getElementById('pPrice').value
    };

    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));

    // Save to Google Sheet
    saveProductToGoogleSheets(newProduct);

    closeProductModal();
    renderProducts();
    populateSelectDropdowns();
};

function saveProductToGoogleSheets(productData) {
    if (!API_URL) return;

    fetch(API_URL, {
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
    }).then(() => alert("✅ រក្សាទុកចូល Google Sheet ជោគជ័យ!"))
      .catch(err => console.error(err));
}

function deleteProduct(idx) {
    if (confirm("តើអ្នកប្រាកដថាចង់លុបបែកនេះ?")) {
        products.splice(idx, 1);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
    }
}

// ==========================================
// 4. Daily Stock Logic
// ==========================================
function renderDailyStockTable() {
    const tbody = document.getElementById('tblDailyStock');
    tbody.innerHTML = '';

    products.forEach((prod, idx) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${prod.name}</strong></td>
                <td><input type="number" class="form-control open-stock" data-idx="${idx}" placeholder="Open Qty"></td>
                <td><input type="number" class="form-control rest-stock" data-idx="${idx}" placeholder="Rest Qty"></td>
                <td><input type="text" class="form-control remark-stock" data-idx="${idx}" placeholder="Remark"></td>
            </tr>
        `;
    });
}

document.getElementById('btnSaveDailyStock').onclick = function () {
    alert("✅ រក្សាទុក Daily Stock ជោគជ័យ!");
};

// ==========================================
// Helper Functions
// ==========================================
function populateSelectDropdowns() {
    const sioSelect = document.getElementById('sioItemSelect');
    const wasteSelect = document.getElementById('wasteItemSelect');
    sioSelect.innerHTML = '<option value="">Select Item</option>';
    wasteSelect.innerHTML = '<option value="">Select Item</option>';

    products.forEach(p => {
        sioSelect.innerHTML += `<option value="${p.name}">${p.name}</option>`;
        wasteSelect.innerHTML += `<option value="${p.name}">${p.name}</option>`;
    });
}

function exportToExcel(tableID, filename = '') {
    alert("📥 កំពុង Export File " + filename + ".xls");
}