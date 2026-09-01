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

const dsDaySelect = document.getElementById('dsDay');
const dsCategorySelect = document.getElementById('dsCategory');
const dailyStockForm = document.getElementById('dailyStockForm');
const dailyStockTableBody = document.getElementById('dailyStockTableBody');

const totalProductsCount = document.getElementById('totalProductsCount');
const dsTotalProductsCount = document.getElementById('dsTotalProductsCount');
const currentActiveDay = document.getElementById('currentActiveDay');

const reportTitleType = document.getElementById('reportTitleType');
const reportHeader = document.getElementById('reportHeader');
const groupWeekSelect = document.getElementById('groupWeekSelect');
const groupMonthSelect = document.getElementById('groupMonthSelect');

// Modal Control
if (btnOpenSettings) btnOpenSettings.onclick = () => settingsModal.style.display = 'block';
if (btnCloseSettings) btnCloseSettings.onclick = () => settingsModal.style.display = 'none';

// លាក់ Section ទាំងអស់
function hideAllSections() {
    if (welcomeView) welcomeView.style.display = 'none';
    if (productSection) productSection.classList.remove('active');
    if (dailyStockSection) dailyStockSection.classList.remove('active');
    if (reportsSection) reportsSection.classList.remove('active');
    if (settingsModal) settingsModal.style.display = 'none';
}

// ត្រឡប់ទៅ Dashboard Home
function showDashboard() {
    hideAllSections();
    if (welcomeView) welcomeView.style.display = 'block';
}

if (btnDashboardHome) btnDashboardHome.addEventListener('click', showDashboard);
if (btnDashboardNav) btnDashboardNav.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });

// Menu Product List
if (btnProductList) {
    btnProductList.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        productSection.classList.add('active');
        renderProducts();
    });
}

// Menu Daily Stock
if (btnDailyStock) {
    btnDailyStock.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        dailyStockSection.classList.add('active');
        renderDailyStockTable();
    });
}

// Menu Weekly Report
if (btnWeeklyReport) {
    btnWeeklyReport.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        reportsSection.classList.add('active');
        reportTitleType.textContent = 'Weekly Report';
        reportHeader.textContent = '📈 របាយការណ៍សង្ខេបប្រចាំសប្តាហ៍ (Weekly Report)';
        groupWeekSelect.style.display = 'flex';
        groupMonthSelect.style.display = 'none';
    });
}

// Menu Monthly Report
if (btnMonthlyReport) {
    btnMonthlyReport.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        reportsSection.classList.add('active');
        reportTitleType.textContent = 'Monthly Report';
        reportHeader.textContent = '📊 របាយការណ៍សង្ខេបប្រចាំខែ (Monthly Report)';
        groupWeekSelect.style.display = 'none';
        groupMonthSelect.style.display = 'flex';
    });
}

function updateDashboardCards() {
    if (totalProductsCount) totalProductsCount.textContent = products.length;
    if (dsTotalProductsCount) dsTotalProductsCount.textContent = products.length;
    if (currentActiveDay && dsDaySelect) currentActiveDay.textContent = `Day ${dsDaySelect.value || 1}`;
}

function renderProducts() {
    if (!productTableBody) return;
    productTableBody.innerHTML = '';

    if (products.length === 0) {
        productTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">មិនទាន់មាន Product នៅឡើយទេ</td></tr>`;
        updateDashboardCards();
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

    updateDashboardCards();
}

function editProduct(index) {
    const prod = products[index];
    document.getElementById('pName').value = prod.name;
    document.getElementById('pCategory').value = prod.category;
    document.getElementById('pUnit').value = prod.unit;
    document.getElementById('pPrice').value = prod.price;

    editIndexInput.value = index;
    btnSubmitProduct.textContent = '✏️ រក្សាការកែប្រែ';
    btnCancelEdit.style.display = 'inline-block';
}

function resetProductForm() {
    productForm.reset();
    editIndexInput.value = '';
    btnSubmitProduct.textContent = '➕ បន្ថែម Product';
    btnCancelEdit.style.display = 'none';
}

if (btnCancelEdit) btnCancelEdit.addEventListener('click', resetProductForm);

if (productForm) {
    productForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const editIdx = editIndexInput.value;
        const pName = document.getElementById('pName').value;
        const pCategory = document.getElementById('pCategory').value;
        const pUnit = document.getElementById('pUnit').value;
        const pPrice = document.getElementById('pPrice').value;

        if (editIdx !== '') {
            products[editIdx].name = pName;
            products[editIdx].category = pCategory;
            products[editIdx].unit = pUnit;
            products[editIdx].price = pPrice;
        } else {
            const newProduct = {
                id: Date.now().toString(),
                name: pName,
                category: pCategory,
                unit: pUnit,
                price: pPrice
            };
            products.push(newProduct);
        }

        localStorage.setItem('products', JSON.stringify(products));
        resetProductForm();
        renderProducts();
    });
}

function deleteProduct(index) {
    if (confirm('តើអ្នកប្រាកដថាចង់លុប Product នេះទេ?')) {
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
    }
}

function initDaysSelect() {
    if (!dsDaySelect) return;
    dsDaySelect.innerHTML = '';
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Day ${i}`;
        dsDaySelect.appendChild(option);
    }
}

function renderDailyStockTable() {
    if (!dailyStockTableBody) return;
    dailyStockTableBody.innerHTML = '';

    const selectedDay = parseInt(dsDaySelect.value) || 1;
    const selectedCategory = dsCategorySelect.value || 'All';

    updateDashboardCards();

    let filteredProducts = products;
    if (selectedCategory !== 'All') {
        filteredProducts = products.filter(p => p.category === selectedCategory);
    }

    filteredProducts.forEach((product, index) => {
        const dayData = (dailyStockData[selectedDay] && dailyStockData[selectedDay][product.id]) || {};

        let openStockValue = '';
        let isOpenDisabled = false;

        if (selectedDay === 1) {
            openStockValue = dayData.openStock !== undefined ? dayData.openStock : '';
            isOpenDisabled = false;
        } else {
            const prevDayData = (dailyStockData[selectedDay - 1] && dailyStockData[selectedDay - 1][product.id]) || {};
            openStockValue = prevDayData.restStock !== undefined ? prevDayData.restStock : 0;
            isOpenDisabled = true;
        }

        const restStockValue = dayData.restStock !== undefined ? dayData.restStock : '';
        const remarkValue = dayData.remark || '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${product.name}</strong></td>
            <td>${product.category}</td>
            <td>${product.unit}</td>
            <td>
                <input type="number" step="any" class="input-open" data-id="${product.id}" 
                    value="${openStockValue}" ${isOpenDisabled ? 'disabled' : ''}>
            </td>
            <td>
                <input type="number" step="any" class="input-rest" data-id="${product.id}" 
                    value="${restStockValue}">
            </td>
            <td>
                <input type="text" class="input-remark" data-id="${product.id}" 
                    value="${remarkValue}" placeholder="ចំណាំ...">
            </td>
        `;
        dailyStockTableBody.appendChild(row);
    });
}

if (dsDaySelect) dsDaySelect.addEventListener('change', renderDailyStockTable);
if (dsCategorySelect) dsCategorySelect.addEventListener('change', renderDailyStockTable);

if (dailyStockForm) {
    dailyStockForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const selectedDay = parseInt(dsDaySelect.value) || 1;

        if (!dailyStockData[selectedDay]) {
            dailyStockData[selectedDay] = {};
        }

        const rows = dailyStockTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const openInput = row.querySelector('.input-open');
            const restInput = row.querySelector('.input-rest');
            const remarkInput = row.querySelector('.input-remark');
            
            if (openInput && restInput) {
                const productId = openInput.getAttribute('data-id');
                const openVal = openInput.value !== '' ? parseFloat(openInput.value) : '';
                const restVal = restInput.value !== '' ? parseFloat(restInput.value) : '';

                dailyStockData[selectedDay][productId] = {
                    openStock: openVal,
                    restStock: restVal,
                    remark: remarkInput.value
                };
            }
        });

        localStorage.setItem('dailyStockData', JSON.stringify(dailyStockData));
        alert(`រក្សាទុកទិន្នន័យ Day ${selectedDay} បានជោគជ័យ!`);
        renderDailyStockTable();
    });
}

document.addEventListener("DOMContentLoaded", function() {
    initDaysSelect();
    showDashboard();
});