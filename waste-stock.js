/**
 * Plugin Name: Waste Stock Module
 * Description: គ្រប់គ្រងស្តុកខូច/ផុតកំណត់/បាត់បង់ (Injects UI & CSS directly)
 */

(function () {
    let wasteTransactions = JSON.parse(localStorage.getItem('wasteTransactions')) || [];

    // 1. Inject CSS សម្រាប់ Waste Stock ចូលទៅក្នុង <head>
    function injectWasteStyles() {
        if (document.getElementById('waste-stock-styles')) return;

        const style = document.createElement('style');
        style.id = 'waste-stock-styles';
        style.textContent = `
            #wasteStockSection {
                background: #ffffff !important;
                border-radius: 12px !important;
                padding: 24px !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
                border: 1px solid #e2e8f0 !important;
                margin-top: 20px !important;
                font-family: 'Segoe UI', Tahoma, sans-serif !important;
            }

            #wasteStockSection h3 {
                font-size: 1.35rem !important;
                color: #991b1b !important;
                margin-bottom: 20px !important;
                font-weight: 700 !important;
            }

            #wasteStockSection #wasteStockForm {
                background: #fff5f5 !important;
                padding: 20px !important;
                border-radius: 10px !important;
                border: 1px solid #fed7d7 !important;
                margin-bottom: 25px !important;
            }

            #wasteStockSection .form-row {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 16px !important;
                align-items: flex-end !important;
            }

            #wasteStockSection .form-group {
                flex: 1 !important;
                min-width: 180px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
            }

            #wasteStockSection .form-group label {
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #7f1d1d !important;
            }

            #wasteStockSection .form-group input, 
            #wasteStockSection .form-group select {
                padding: 10px 14px !important;
                border: 1px solid #fca5a5 !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                outline: none !important;
                background-color: #ffffff !important;
                height: 42px !important;
                box-sizing: border-box !important;
            }

            #wasteStockSection #btnSubmitWaste {
                height: 42px !important;
                padding: 0 24px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #ffffff !important;
                background-color: #dc2626 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }

            #wasteStockSection #btnSubmitWaste:hover {
                background-color: #b91c1c !important;
            }

            #wasteStockSection .badge-waste {
                background-color: #fee2e2 !important;
                color: #991b1b !important;
                padding: 6px 14px !important;
                border-radius: 20px !important;
                font-weight: 700 !important;
                font-size: 12px !important;
                display: inline-block !important;
            }

            #wasteStockSection .data-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 12px !important;
                font-size: 14px !important;
                background: #ffffff !important;
            }

            #wasteStockSection .data-table th {
                background-color: #f1f5f9 !important;
                color: #334155 !important;
                font-weight: 600 !important;
                text-align: left !important;
                padding: 14px 16px !important;
                border-bottom: 2px solid #e2e8f0 !important;
            }

            #wasteStockSection .data-table td {
                padding: 14px 16px !important;
                border-bottom: 1px solid #f1f5f9 !important;
                color: #334155 !important;
            }

            #wasteStockSection .btn-delete {
                background-color: #fff1f2 !important;
                color: #e11d48 !important;
                border: 1px solid #fecdd3 !important;
                padding: 6px 14px !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. ភ្ជាប់ Event ទៅ Menu Waste Stocks ក្នុង Settings Modal
    function setupWasteMenuItem() {
        const modalContent = document.querySelector('#settingsModal .modal-content');
        if (!modalContent) return;

        const subMenu = modalContent.querySelector('.sub-menu');
        if (subMenu) {
            const links = subMenu.querySelectorAll('li a');
            links.forEach(a => {
                if (a.textContent.trim() === 'Waste Stocks') {
                    a.id = 'btnNavWasteStock';
                    a.href = '#';
                }
            });
        }
    }

    // 3. Inject UI Section សម្រាប់ Waste Stock
    function injectWasteUISection() {
        const mainContainer = document.querySelector('main.container');
        if (!mainContainer || document.getElementById('wasteStockSection')) return;

        const section = document.createElement('section');
        section.id = 'wasteStockSection';
        section.className = 'section-card';
        section.innerHTML = `
            <h3>🗑️ គ្រប់គ្រងស្តុកខូច/បាត់បង់ (Waste Stocks)</h3>

            <form id="wasteStockForm" class="form-card">
                <div class="form-row">
                    <div class="form-group">
                        <label for="wasteProduct">ជ្រើសរើស ទំនិញ:</label>
                        <select id="wasteProduct" required>
                            <option value="">-- ជ្រើសរើស Product --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="wasteQty">ចំនួនខូច (Qty):</label>
                        <input type="number" id="wasteQty" step="any" placeholder="0" required min="0.1">
                    </div>
                    <div class="form-group">
                        <label for="wasteReason">មូលហេតុនៃការខូច/បាត់បង់:</label>
                        <select id="wasteReason" required>
                            <option value="Expired">ផុតកំណត់ (Expired)</option>
                            <option value="Damaged">បាក់បែក/ខូចខាត (Damaged)</option>
                            <option value="Lost">បាត់បង់ (Lost)</option>
                            <option value="Other">ផ្សេងៗ (Other)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="wasteNote">ចំណាំបន្ថែម:</label>
                        <input type="text" id="wasteNote" placeholder="ឧ. កំពប់ ឬ ធ្លាក់បែក...">
                    </div>
                    <div class="form-group btn-align">
                        <button type="submit" id="btnSubmitWaste">💾 រក្សាទុក Waste Stock</button>
                    </div>
                </div>
            </form>

            <h4 style="margin: 20px 0 10px 0;">ប្រវត្តិទំនិញខូច (Waste Logs)</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>កាលបរិច្ឆេទ</th>
                        <th>ឈ្មោះទំនិញ</th>
                        <th>ចំនួនខូច</th>
                        <th>មូលហេតុ</th>
                        <th>ចំណាំ</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="wasteTableBody"></tbody>
            </table>
        `;
        mainContainer.appendChild(section);
    }

    // 4. បើកបង្ហាញ Section Waste Stock
    function openWasteModule() {
        document.querySelectorAll('.section-card').forEach(s => s.classList.remove('active'));
        const welcomeView = document.getElementById('welcomeView');
        if (welcomeView) welcomeView.style.display = 'none';
        
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';

        const wasteStockSection = document.getElementById('wasteStockSection');
        if (wasteStockSection) wasteStockSection.classList.add('active');

        populateWasteProductDropdown();
        renderWasteTable();
    }

    // 5. កំណត់ Events
    function setupWasteEvents() {
        const btnNavWasteStock = document.getElementById('btnNavWasteStock');
        const wasteForm = document.getElementById('wasteStockForm');

        if (btnNavWasteStock) {
            btnNavWasteStock.addEventListener('click', (e) => {
                e.preventDefault();
                openWasteModule();
            });
        }

        if (wasteForm) {
            wasteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const productId = document.getElementById('wasteProduct').value;
                const qty = parseFloat(document.getElementById('wasteQty').value);
                const reason = document.getElementById('wasteReason').value;
                const note = document.getElementById('wasteNote').value;

                const products = JSON.parse(localStorage.getItem('products')) || [];
                const prod = products.find(p => (p.id && p.id === productId) || p.name === productId);

                const newWaste = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleString('km-KH'),
                    productId: productId,
                    productName: prod ? prod.name : productId,
                    qty: qty,
                    reason: reason,
                    note: note
                };

                wasteTransactions.unshift(newWaste);
                localStorage.setItem('wasteTransactions', JSON.stringify(wasteTransactions));
                
                wasteForm.reset();
                renderWasteTable();
                alert('បានរក្សាទុកទិន្នន័យ Waste Stock រួចរាល់!');
            });
        }
    }

    function populateWasteProductDropdown() {
        const wasteProductSelect = document.getElementById('wasteProduct');
        if (!wasteProductSelect) return;

        const products = JSON.parse(localStorage.getItem('products')) || [];
        wasteProductSelect.innerHTML = '<option value="">-- ជ្រើសរើស Product --</option>';

        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id || p.name;
            opt.textContent = `${p.name} (${p.category})`;
            wasteProductSelect.appendChild(opt);
        });
    }

    function renderWasteTable() {
        const wasteTableBody = document.getElementById('wasteTableBody');
        if (!wasteTableBody) return;

        wasteTableBody.innerHTML = '';
        if (wasteTransactions.length === 0) {
            wasteTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">មិនទាន់មានប្រវត្តិទំនិញខូចនៅឡើយទេ</td></tr>`;
            return;
        }

        wasteTransactions.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.date}</td>
                <td><strong>${item.productName}</strong></td>
                <td><span class="badge-waste">${item.qty}</span></td>
                <td>${item.reason}</td>
                <td>${item.note || '-'}</td>
                <td>
                    <button type="button" onclick="deleteWasteItem('${item.id}')" class="btn-delete">Delete</button>
                </td>
            `;
            wasteTableBody.appendChild(tr);
        });
    }

    window.deleteWasteItem = function(id) {
        if (confirm('តើអ្នកពិតជាចង់លុបកំណត់ត្រានេះមែនទេ?')) {
            wasteTransactions = wasteTransactions.filter(item => item.id !== id);
            localStorage.setItem('wasteTransactions', JSON.stringify(wasteTransactions));
            renderWasteTable();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectWasteStyles();
        setupWasteMenuItem();
        injectWasteUISection();
        setupWasteEvents();
    });

})();