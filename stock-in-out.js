/**
 * Plugin Name: Stock In & Stock Out Module
 * Description: Inject UI and CSS directly inside JS
 */

(function () {
    let stockTransactions = JSON.parse(localStorage.getItem('stockTransactions')) || [];

    // 1. Inject CSS ចូលទៅក្នុង <head> ដោយស្វ័យប្រវត្តិ
    function injectStyles() {
        if (document.getElementById('stock-in-out-styles')) return;

        const style = document.createElement('style');
        style.id = 'stock-in-out-styles';
        style.textContent = `
            #stockInOutSection {
                background: #ffffff !important;
                border-radius: 12px !important;
                padding: 24px !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
                border: 1px solid #e2e8f0 !important;
                margin-top: 20px !important;
                font-family: 'Segoe UI', Tahoma, sans-serif !important;
            }

            #stockInOutSection h3 {
                font-size: 1.35rem !important;
                color: #1e293b !important;
                margin-bottom: 20px !important;
                font-weight: 700 !important;
            }

            #stockInOutSection .tab-container {
                display: flex !important;
                gap: 8px !important;
                background-color: #f1f5f9 !important;
                padding: 6px !important;
                border-radius: 10px !important;
                margin-bottom: 24px !important;
                width: fit-content !important;
                border-bottom: none !important;
            }

            #stockInOutSection .tab-btn {
                padding: 10px 22px !important;
                border: none !important;
                background: transparent !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #64748b !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                transition: all 0.25s ease !important;
            }

            #stockInOutSection .tab-btn:hover {
                color: #0f172a !important;
            }

            #stockInOutSection .tab-btn.active {
                background-color: #ffffff !important;
                color: #2563eb !important;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08) !important;
                border-bottom: none !important;
            }

            #stockInOutSection #stockInOutForm {
                background: #f8fafc !important;
                padding: 20px !important;
                border-radius: 10px !important;
                border: 1px solid #e2e8f0 !important;
                margin-bottom: 25px !important;
            }

            #stockInOutSection .form-row {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 16px !important;
                align-items: flex-end !important;
            }

            #stockInOutSection .form-group {
                flex: 1 !important;
                min-width: 180px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
            }

            #stockInOutSection .form-group label {
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #475569 !important;
            }

            #stockInOutSection .form-group input, 
            #stockInOutSection .form-group select {
                padding: 10px 14px !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                outline: none !important;
                background-color: #ffffff !important;
                height: 42px !important;
                box-sizing: border-box !important;
            }

            #stockInOutSection #btnSubmitSIO {
                height: 42px !important;
                padding: 0 24px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #ffffff !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }

            #stockInOutSection .badge-in {
                background-color: #dcfce7 !important;
                color: #15803d !important;
                padding: 6px 14px !important;
                border-radius: 20px !important;
                font-weight: 700 !important;
                font-size: 12px !important;
                display: inline-block !important;
            }

            #stockInOutSection .badge-out {
                background-color: #fee2e2 !important;
                color: #b91c1c !important;
                padding: 6px 14px !important;
                border-radius: 20px !important;
                font-weight: 700 !important;
                font-size: 12px !important;
                display: inline-block !important;
            }

            #stockInOutSection .data-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 12px !important;
                font-size: 14px !important;
                background: #ffffff !important;
            }

            #stockInOutSection .data-table th {
                background-color: #f1f5f9 !important;
                color: #334155 !important;
                font-weight: 600 !important;
                text-align: left !important;
                padding: 14px 16px !important;
                border-bottom: 2px solid #e2e8f0 !important;
            }

            #stockInOutSection .data-table td {
                padding: 14px 16px !important;
                border-bottom: 1px solid #f1f5f9 !important;
                color: #334155 !important;
            }

            #stockInOutSection .btn-delete {
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

    // 2. កែសម្រួល Menu
    function setupMenuItems() {
        const modalContent = document.querySelector('#settingsModal .modal-content');
        if (!modalContent) return;

        const subMenu = modalContent.querySelector('.sub-menu');
        if (subMenu) {
            const links = subMenu.querySelectorAll('li a');
            let foundFirst = false;

            links.forEach(a => {
                const text = a.textContent.trim();
                if (text === 'Stock In' || text === 'Stock Out' || text === 'Stock In/Out') {
                    if (!foundFirst) {
                        a.textContent = 'Stock In/Out';
                        a.id = 'btnNavStockInOut';
                        a.href = '#';
                        foundFirst = true;
                    } else {
                        const li = a.parentElement;
                        if (li) li.remove();
                    }
                }
            });
        }
    }

    // 3. Inject UI Section
    function injectUISection() {
        const mainContainer = document.querySelector('main.container');
        if (!mainContainer || document.getElementById('stockInOutSection')) return;

        const section = document.createElement('section');
        section.id = 'stockInOutSection';
        section.className = 'section-card';
        section.innerHTML = `
            <h3>📥📤 គ្រប់គ្រងស្តុក ចូល/ចេញ (Stock In / Stock Out)</h3>
            
            <div class="tab-container">
                <button type="button" class="tab-btn active" id="tabStockIn">📥 នាំចូល (Stock In)</button>
                <button type="button" class="tab-btn" id="tabStockOut">📤 នាំចេញ (Stock Out)</button>
            </div>

            <form id="stockInOutForm" class="form-card">
                <input type="hidden" id="sioType" value="IN">
                <div class="form-row">
                    <div class="form-group">
                        <label for="sioProduct">ជ្រើសរើស ទំនិញ:</label>
                        <select id="sioProduct" required>
                            <option value="">-- ជ្រើសរើស Product --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="sioQty">ចំនួន (Qty):</label>
                        <input type="number" id="sioQty" step="any" placeholder="0" required min="0.1">
                    </div>
                    <div class="form-group">
                        <label for="sioNote">ចំណាំ/មូលហេតុ:</label>
                        <input type="text" id="sioNote" placeholder="ឧ. ទិញថែម ឬ លក់ចេញ/ខូច...">
                    </div>
                    <div class="form-group btn-align">
                        <button type="submit" id="btnSubmitSIO" class="btn-primary">💾 រក្សាទុក Stock In</button>
                    </div>
                </div>
            </form>

            <h4 style="margin: 20px 0 10px 0;">ប្រវត្តិប្រតិបត្តិការ (Transaction Logs)</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>កាលបរិច្ឆេទ</th>
                        <th>ប្រភេទ</th>
                        <th>ឈ្មោះទំនិញ</th>
                        <th>ចំនួន</th>
                        <th>ចំណាំ</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="sioTableBody"></tbody>
            </table>
        `;
        mainContainer.appendChild(section);
    }

    function openStockModule(defaultType = 'IN') {
        document.querySelectorAll('.section-card').forEach(s => s.classList.remove('active'));
        const welcomeView = document.getElementById('welcomeView');
        if (welcomeView) welcomeView.style.display = 'none';
        
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';

        const stockInOutSection = document.getElementById('stockInOutSection');
        if (stockInOutSection) stockInOutSection.classList.add('active');

        switchTab(defaultType);
        populateProductDropdown();
        renderSIOTable();
    }

    function switchTab(type) {
        const tabStockIn = document.getElementById('tabStockIn');
        const tabStockOut = document.getElementById('tabStockOut');
        const sioType = document.getElementById('sioType');
        const btnSubmitSIO = document.getElementById('btnSubmitSIO');

        if (type === 'IN') {
            tabStockIn.classList.add('active');
            tabStockOut.classList.remove('active');
            sioType.value = 'IN';
            btnSubmitSIO.textContent = '💾 រក្សាទុក Stock In';
            btnSubmitSIO.style.backgroundColor = '#2563eb';
        } else {
            tabStockOut.classList.add('active');
            tabStockIn.classList.remove('active');
            sioType.value = 'OUT';
            btnSubmitSIO.textContent = '💾 រក្សាទុក Stock Out';
            btnSubmitSIO.style.backgroundColor = '#dc2626';
        }
    }

    function setupModuleEvents() {
        const btnNavStockInOut = document.getElementById('btnNavStockInOut');
        const tabStockIn = document.getElementById('tabStockIn');
        const tabStockOut = document.getElementById('tabStockOut');
        const sioForm = document.getElementById('stockInOutForm');

        if (btnNavStockInOut) {
            btnNavStockInOut.addEventListener('click', (e) => {
                e.preventDefault();
                openStockModule('IN');
            });
        }

        if (tabStockIn) tabStockIn.addEventListener('click', () => switchTab('IN'));
        if (tabStockOut) tabStockOut.addEventListener('click', () => switchTab('OUT'));

        if (sioForm) {
            sioForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const productId = document.getElementById('sioProduct').value;
                const qty = parseFloat(document.getElementById('sioQty').value);
                const note = document.getElementById('sioNote').value;
                const type = document.getElementById('sioType').value;

                const products = JSON.parse(localStorage.getItem('products')) || [];
                const prod = products.find(p => (p.id && p.id === productId) || p.name === productId);

                const newTransaction = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleString('km-KH'),
                    type: type,
                    productId: productId,
                    productName: prod ? prod.name : productId,
                    qty: qty,
                    note: note
                };

                stockTransactions.unshift(newTransaction);
                localStorage.setItem('stockTransactions', JSON.stringify(stockTransactions));
                
                sioForm.reset();
                renderSIOTable();
                alert(`បានរក្សាទុកប្រតិបត្តិការ Stock ${type} ដោយជោគជ័យ!`);
            });
        }
    }

    function populateProductDropdown() {
        const sioProductSelect = document.getElementById('sioProduct');
        if (!sioProductSelect) return;

        const products = JSON.parse(localStorage.getItem('products')) || [];
        sioProductSelect.innerHTML = '<option value="">-- ជ្រើសរើស Product --</option>';

        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id || p.name;
            opt.textContent = `${p.name} (${p.category})`;
            sioProductSelect.appendChild(opt);
        });
    }

    function renderSIOTable() {
        const sioTableBody = document.getElementById('sioTableBody');
        if (!sioTableBody) return;

        sioTableBody.innerHTML = '';
        if (stockTransactions.length === 0) {
            sioTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">មិនទាន់មានប្រតិបត្តិការនៅឡើយទេ</td></tr>`;
            return;
        }

        stockTransactions.forEach((item, index) => {
            const tr = document.createElement('tr');
            const badgeClass = item.type === 'IN' ? 'badge-in' : 'badge-out';
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.date}</td>
                <td><span class="${badgeClass}">${item.type}</span></td>
                <td><strong>${item.productName}</strong></td>
                <td>${item.qty}</td>
                <td>${item.note || '-'}</td>
                <td>
                    <button type="button" onclick="deleteSIOItem('${item.id}')" class="btn-delete">Delete</button>
                </td>
            `;
            sioTableBody.appendChild(tr);
        });
    }

    window.deleteSIOItem = function(id) {
        if (confirm('តើអ្នកពិតជាចង់លុបប្រតិបត្តិការនេះមែនទេ?')) {
            stockTransactions = stockTransactions.filter(item => item.id !== id);
            localStorage.setItem('stockTransactions', JSON.stringify(stockTransactions));
            renderSIOTable();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles(); // រុញ CSS ចូល head ភ្លាមៗ
        setupMenuItems();
        injectUISection();
        setupModuleEvents();
    });

})();