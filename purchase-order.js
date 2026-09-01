/**
 * Plugin Name: Purchase Order Module - Recommended Order Only
 * Features: Filter Buttons (Select Day, Select Month, Select Category) & Display Recommended Table
 */

(function () {

    function injectPurchaseStyles() {
        if (document.getElementById('purchase-order-styles')) return;

        const style = document.createElement('style');
        style.id = 'purchase-order-styles';
        style.textContent = `
            #purchaseOrderSection {
                background: #ffffff !important;
                border-radius: 12px !important;
                padding: 24px !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
                border: 1px solid #e2e8f0 !important;
                margin-top: 20px !important;
                font-family: 'Segoe UI', Tahoma, sans-serif !important;
            }

            #purchaseOrderSection h3 {
                font-size: 1.35rem !important;
                color: #0f766e !important;
                margin-bottom: 20px !important;
                font-weight: 700 !important;
            }

            /* Filter Buttons Box */
            .po-filter-card {
                background: #f8fafc !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 10px !important;
                padding: 16px !important;
                margin-bottom: 20px !important;
            }

            .filter-row {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 12px !important;
            }

            .filter-group {
                flex: 1 !important;
                min-width: 150px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 4px !important;
            }

            .filter-group label {
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #475569 !important;
            }

            .filter-group select, .filter-group input {
                padding: 8px 12px !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 6px !important;
                font-size: 13px !important;
                height: 38px !important;
                background-color: #ffffff !important;
                outline: none !important;
            }

            /* Recommendation Table Styling */
            .recommend-box {
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 10px !important;
                padding: 16px !important;
            }

            .table-recommend {
                width: 100% !important;
                border-collapse: collapse !important;
                font-size: 14px !important;
                background: #ffffff !important;
            }

            .table-recommend th, .table-recommend td {
                padding: 12px 16px !important;
                border-bottom: 1px solid #e2e8f0 !important;
                text-align: left !important;
            }

            .table-recommend th {
                background-color: #f1f5f9 !important;
                color: #334155 !important;
                font-weight: 600 !important;
            }
        `;
        document.head.appendChild(style);
    }

    function setupPurchaseMenuItem() {
        const modalContent = document.querySelector('#settingsModal .modal-content');
        if (!modalContent) return;

        const subMenu = modalContent.querySelector('.sub-menu');
        if (subMenu) {
            const links = subMenu.querySelectorAll('li a');
            links.forEach(a => {
                const text = a.textContent.trim();
                if (text === 'Purchases' || text === 'Purchase Order' || text === 'Purchase') {
                    a.id = 'btnNavPurchaseOrder';
                    a.href = '#';
                }
            });
        }
    }

    function injectPurchaseUISection() {
        const mainContainer = document.querySelector('main.container');
        if (!mainContainer || document.getElementById('purchaseOrderSection')) return;

        const section = document.createElement('section');
        section.id = 'purchaseOrderSection';
        section.className = 'section-card';
        section.innerHTML = `
            <h3>🛒 Display Recommended Order</h3>

            <!-- 1. Filter Buttons (Day, Month, Category) -->
            <div class="po-filter-card">
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="filterDay">1. Select Day / Sheet:</label>
                        <input type="date" id="filterDay">
                    </div>
                    <div class="filter-group">
                        <label for="filterMonth">2. Select Month of Sheet:</label>
                        <input type="month" id="filterMonth">
                    </div>
                    <div class="filter-group">
                        <label for="filterCategory">3. Select Category (Product List):</label>
                        <select id="filterCategory">
                            <option value="">-- All Categories --</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 2. Display Recommended Order Table -->
            <div class="recommend-box">
                <div id="recommendContainer">
                    <p style="margin:0; color:#666; font-size:13px;">កំពុងទាញយកទិន្នន័យ...</p>
                </div>
            </div>
        `;
        mainContainer.appendChild(section);
    }

    // Load Category Filter Options
    function populateCategoryDropdown() {
        const filterCategory = document.getElementById('filterCategory');
        if (!filterCategory) return;

        const products = JSON.parse(localStorage.getItem('products')) || [];
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

        filterCategory.innerHTML = '<option value="">-- All Categories --</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            filterCategory.appendChild(opt);
        });
    }

    // Render Table [ Nº | Items Name | Rest Stock | Recommend Order ]
    function renderRecommendedOrder() {
        const recommendContainer = document.getElementById('recommendContainer');
        if (!recommendContainer) return;

        const products = JSON.parse(localStorage.getItem('products')) || [];
        const selectedCategory = document.getElementById('filterCategory').value;

        // Filter តាម Category
        let filteredProducts = products.filter(p => {
            return selectedCategory ? (p.category === selectedCategory) : true;
        });

        if (filteredProducts.length === 0) {
            recommendContainer.innerHTML = `<p style="margin:0; color:#dc2626; font-size:13px;">ពុំមានទិន្នន័យទំនិញតាមលក្ខខណ្ឌជ្រើសរើសឡើយ</p>`;
            return;
        }

        let tableHtml = `
            <table class="table-recommend">
                <thead>
                    <tr>
                        <th style="width: 60px;">Nº</th>
                        <th>Items Name</th>
                        <th>Rest Stock</th>
                        <th>Recommend Order</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filteredProducts.forEach((p, index) => {
            const rest = parseFloat(p.restStock ?? p.qty ?? 0);
            const safety = parseFloat(p.safetyStock ?? p.minStock ?? 0);

            // គណនា Recommend Order
            let recommendQty = 0;
            if (safety > 0 && rest <= safety) {
                recommendQty = safety - rest;
            } else if (rest === 0) {
                recommendQty = safety > 0 ? safety : 10;
            }

            tableHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${p.name}</strong> ${p.category ? `<small style="color:#64748b;">(${p.category})</small>` : ''}</td>
                    <td><span style="color:${rest <= safety ? '#dc2626' : '#16a34a'}; font-weight:bold;">${rest}</span></td>
                    <td>
                        <strong style="color:${recommendQty > 0 ? '#059669' : '#64748b'};">
                            ${recommendQty > 0 ? '+' + recommendQty : '0'}
                        </strong>
                    </td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;
        recommendContainer.innerHTML = tableHtml;
    }

    function openPurchaseModule() {
        document.querySelectorAll('.section-card').forEach(s => s.classList.remove('active'));
        const welcomeView = document.getElementById('welcomeView');
        if (welcomeView) welcomeView.style.display = 'none';
        
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';

        const purchaseOrderSection = document.getElementById('purchaseOrderSection');
        if (purchaseOrderSection) purchaseOrderSection.classList.add('active');

        populateCategoryDropdown();
        renderRecommendedOrder();
    }

    function setupPOEvents() {
        const btnNavPurchaseOrder = document.getElementById('btnNavPurchaseOrder');
        const filterDay = document.getElementById('filterDay');
        const filterMonth = document.getElementById('filterMonth');
        const filterCategory = document.getElementById('filterCategory');

        if (btnNavPurchaseOrder) {
            btnNavPurchaseOrder.addEventListener('click', (e) => {
                e.preventDefault();
                openPurchaseModule();
            });
        }

        [filterDay, filterMonth, filterCategory].forEach(elem => {
            if (elem) {
                elem.addEventListener('change', () => {
                    renderRecommendedOrder();
                });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectPurchaseStyles();
        setupPurchaseMenuItem();
        injectPurchaseUISection();
        setupPOEvents();
    });

})();