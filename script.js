// ==========================================
// 1. Google Apps Script Configuration
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwJdxbfKRpGgtnx3D5wPEKsorVxpH91bQVNil3wGM4m02WhlZfmST6vYHQE72S4uAnhew/exec";

// ==========================================
// 2. Data State & Variable Initializations
// ==========================================
let products = JSON.parse(localStorage.getItem('products')) || [];
let dailyStockData = JSON.parse(localStorage.getItem('dailyStockData')) || {};

const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const settingsModal = document.getElementById('settingsModal');

const btnDashboardHome = document.getElementById('btnDashboardHome');
const btnDashboardNav = document.getElementById('btnDashboardNav');
const btnProductList = document.getElementById('btnProductList');
const btnDailyStock = document.getElementById('btnDailyStock');
const btnWeeklyReport = document.getElementById('btnWeeklyReport');
const btnMonthlyReport = document.getElementById('btnMonthlyReport');

const welcomeView = document.getElementById('welcomeView');
const productSection = document.getElementById('productManagement');
const dailyStockSection = document.getElementById('dailyStockManagement');
const reportsSection = document.getElementById('reportsManagement');

const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const editIndexInput = document.getElementById('editIndex');
const btnSubmitProduct = document.getElementById('btnSubmitProduct');
const btnCancelEdit = document.getElementById('btnCancelEdit');

// ==========================================
// 3. Modal Control (Settings) & Navigation
// ==========================================
// ⚙️ មុខងារបើក/បិទ Settings Modal
if (btnOpenSettings) {
    btnOpenSettings.onclick = function() {
        if (settingsModal) settingsModal.style.display = 'block';
    };
}

if (btnCloseSettings) {
    btnCloseSettings.onclick = function() {
        if (settingsModal) settingsModal.style.display = 'none';
    };
}

// ចុចក្រៅ Modal ឱ្យវាបិទវិញ
window.onclick = function(event) {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
};

function hideAllSections() {
    if (welcomeView) welcomeView.style.display = 'none';
    if (productSection) productSection.classList.remove('active');
    if (dailyStockSection) dailyStockSection.classList.remove('active');
    if (reportsSection) reportsSection.classList.remove('active');
    if (settingsModal) settingsModal.style.display = 'none';
}

function showDashboard() {
    hideAllSections();
    if (welcomeView) welcomeView.style.display = 'block';
}

if (btnDashboardHome) btnDashboardHome.addEventListener('click', showDashboard);
if (btnDashboardNav) btnDashboardNav.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });

if (btnProductList) {
    btnProductList.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        if (productSection) productSection.classList.add('active');
        renderProducts();
    });
}

if (btnDailyStock) {
    btnDailyStock.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        if (dailyStockSection) dailyStockSection.classList.add('active');
    });
}

if (btnWeeklyReport) {
    btnWeeklyReport.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        if (reportsSection) reportsSection.classList.add('active');
    });
}

if (btnMonthlyReport) {
    btnMonthlyReport.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        if (reportsSection) reportsSection.classList.add('active');
    });
}

// ==========================================
// 4. Product Management & Sync Logic
// ==========================================
function renderProducts() {
    if (!productTableBody) return;
    productTableBody.innerHTML = '';

    if (products.length === 0) {
        productTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">មិនទាន់មាន Product នៅឡើយទេ</td></tr>`;
        return;
    }

    products.forEach((prod, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${prod.name}</strong></td>
            <td>${prod.category}</td>
            <td>${prod.unit}</td>
            <td>$${parseFloat(prod.price || 0).toFixed(2)}</td>
            <td>
                <button type="button" onclick="editProduct(${index})" class="btn-edit">Edit</button>
                <button type="button" onclick="deleteProduct(${index})" class="btn-delete">Delete</button>
            </td>
        `;
        productTableBody.appendChild(tr);
    });
}

function editProduct(index) {
    const prod = products[index];
    document.getElementById('pName').value = prod.name;
    document.getElementById('pCategory').value = prod.category;
    document.getElementById('pUnit').value = prod.unit;
    document.getElementById('pPrice').value = prod.price;

    if (editIndexInput) editIndexInput.value = index;
    if (btnSubmitProduct) btnSubmitProduct.textContent = '✏️ រក្សាការកែប្រែ';
    if (btnCancelEdit) btnCancelEdit.style.display = 'inline-block';
}

function resetProductForm() {
    if (productForm) productForm.reset();
    if (editIndexInput) editIndexInput.value = '';
    if (btnSubmitProduct) btnSubmitProduct.textContent = '➕ បន្ថែម Product';
    if (btnCancelEdit) btnCancelEdit.style.display = 'none';
}

if (btnCancelEdit) btnCancelEdit.addEventListener('click', resetProductForm);

if (productForm) {
    productForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const editIdx = editIndexInput ? editIndexInput.value : '';
        const pName = document.getElementById('pName').value;
        const pCategory = document.getElementById('pCategory').value;
        const pUnit = document.getElementById('pUnit').value;
        const pPrice = document.getElementById('pPrice').value;

        if (editIdx !== '') {
            // Edit
            products[editIdx].name = pName;
            products[editIdx].category = pCategory;
            products[editIdx].unit = pUnit;
            products[editIdx].price = pPrice;
        } else {
            // Add New
            const newProduct = {
                id: Date.now().toString(),
                name: pName,
                category: pCategory,
                unit: pUnit,
                price: pPrice
            };
            products.push(newProduct);
            saveProductToGoogleSheets(newProduct);
        }

        localStorage.setItem('products', JSON.stringify(products));
        resetProductForm();
        renderProducts();
    });
}

function saveProductToGoogleSheets(productData) {
    if (!API_URL || API_URL.includes("សូមដាក់")) return;

    // ផ្ញើ លេខរៀង (rowNum) ជំនួស ID វិញ
    const payload = {
        action: "addProduct",
        rowNum: products.length, // លេខរៀង (N)
        name: productData.name,
        category: productData.category,
        unit: productData.unit,
        price: productData.price
    };

    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => alert("✅ បានបន្ថែម Product ចូល Google Sheet រួចរាល់!"))
    .catch(err => console.error("Error:", err));
}

function deleteProduct(index) {
    if (confirm('តើអ្នកប្រាកដថាចង់លុប Product នេះទេ?')) {
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
    }
}

// ដំណើរការពេលបើក Web ដំបូង
document.addEventListener("DOMContentLoaded", function() {
    showDashboard();
});