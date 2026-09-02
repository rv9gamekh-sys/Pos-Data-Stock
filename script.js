// ==========================================
// 1. កន្លែងត្រូវដាក់ URL ពី Google Apps Script
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwJdxbfKRpGgtnx3D5wPEKsorVxpH91bQVNil3wGM4m02WhlZfmST6vYHQE72S4uAnhew/exec";

// ==========================================
// 2. ការកំណត់អថេរ និងទាញទិន្នន័យ
// ==========================================
let products = JSON.parse(localStorage.getItem('products')) || [];

const btnProductList = document.getElementById('btnProductList');
const productSection = document.getElementById('productManagement');
const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const editIndexInput = document.getElementById('editIndex');
const btnSubmitProduct = document.getElementById('btnSubmitProduct');
const btnCancelEdit = document.getElementById('btnCancelEdit');

// បង្ហាញផ្ទាំង Product
if (btnProductList) {
    btnProductList.addEventListener('click', (e) => {
        e.preventDefault();
        productSection.classList.add('active');
        renderProducts();
    });
}

// បង្ហាញទិន្នន័យក្នុងតារាង
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

// ពេលចុចប៊ូតុង "បន្ថែម Product"
if (productForm) {
    productForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const editIdx = editIndexInput.value;
        const pName = document.getElementById('pName').value;
        const pCategory = document.getElementById('pCategory').value;
        const pUnit = document.getElementById('pUnit').value;
        const pPrice = document.getElementById('pPrice').value;

        if (editIdx === '') {
            // បង្កើត Product ថ្មី
            const newProduct = {
                id: Date.now().toString(),
                name: pName,
                category: pCategory,
                unit: pUnit,
                price: pPrice
            };
            products.push(newProduct);

            // 🚀 បាញ់ទិន្នន័យទៅ Google Sheets
            saveProductToGoogleSheets(newProduct);
        } else {
            // កែប្រែ Product ចាស់
            products[editIdx].name = pName;
            products[editIdx].category = pCategory;
            products[editIdx].unit = pUnit;
            products[editIdx].price = pPrice;
        }

        localStorage.setItem('products', JSON.stringify(products));
        productForm.reset();
        editIndexInput.value = '';
        renderProducts();
    });
}

// មុខងារសម្រាប់បាញ់ទិន្នន័យទៅ Google Sheets
function saveProductToGoogleSheets(productData) {
    if (!API_URL || API_URL.includes("សូមលុបអក្សរខ្មែរនេះចោល")) {
        console.log("បងមិនទាន់បានដាក់ API URL ទេ!");
        return;
    }

    const payload = {
        action: "addProduct",
        id: productData.id,
        name: productData.name,
        category: productData.category,
        unit: productData.unit,
        price: productData.price
    };

    fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // សំខាន់សម្រាប់អោយ Web ឆ្លងទៅ Google បាន
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => {
        alert("✅ ទិន្នន័យបានបញ្ជូនទៅកាន់ Google Sheet ជោគជ័យ!");
    })
    .catch(err => console.error("ជួបបញ្ហា:", err));
}
