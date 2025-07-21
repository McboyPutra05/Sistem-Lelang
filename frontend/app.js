// ===================================================================================
// BAGIAN 1: KONFIGURASI DASAR & INISIALISASI
// ===================================================================================

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// DOM Elements
const mainContent = document.getElementById('main-content');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const addItemModal = document.getElementById('add-item-modal');
const bidModal = document.getElementById('bid-modal');
const confirmModal = document.getElementById('confirm-modal');
const mobileMenu = document.getElementById('mobile-menu');

// ===================================================================================
// BAGIAN 2: FUNGSI BANTUAN (SESSION & API HELPERS)
// ===================================================================================

function getSession() {
    return {
        token: localStorage.getItem('authToken'),
        user: JSON.parse(localStorage.getItem('currentUser'))
    };
}

function saveSession(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

function getAuthHeaders() {
    const { token } = getSession();
    if (!token) return { 'Accept': 'application/json' };
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    };
}

function getImageUrl(filename) {
        return `http://127.0.0.1:8000/storage/items/${filename}`;
}

function isAuctionEnded(endTime) {
    return new Date(endTime) < new Date();
}


// ===================================================================================
// BAGIAN 3: FUNGSI KOMUNIKASI API
// ===================================================================================

async function apiFetchItems() {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) throw new Error('Gagal memuat data lelang dari server.');
    return await response.json();
}

async function apiFetchItem(id) {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error('Item tidak ditemukan.');
    return await response.json();
}

async function apiLogin(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login gagal.');
    return data;
}

async function apiRegister(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
        const errorMessages = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
        throw new Error(errorMessages || 'Registrasi gagal.');
    }
    return data;
}

async function apiLogout() {
    const headers = getAuthHeaders();
    if(!headers.Authorization) return;
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: headers
    });
}

async function apiAddItem(formData) {
    const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
    });
    const data = await response.json();
    if (!response.ok) {
        const errorMessages = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
        throw new Error(errorMessages || 'Gagal menambah barang.');
    }
    return data;
}

async function apiPlaceBid(itemId, amount) {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/bids`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
    const data = await response.json();
    if (!response.ok) {
        const errorMessages = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
        throw new Error(errorMessages || 'Gagal mengajukan penawaran.');
    }
    return data;
}

async function apiDeleteItem(itemId) {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Gagal menghapus barang.');
    return data;
}

async function apiUpdateItemStatus(itemId, status) {
    const response = await fetch(`${API_BASE_URL}/items/${itemId}/status`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Gagal mengubah status.');
    return data;
}

async function fetchUserProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Gagal mengambil profil pengguna');
    const user = await response.json();
    saveSession(getSession().token, user);
    return user;
}

async function apiFetchItemDetails(id) {
    const response = await fetch(`${API_BASE_URL}/auctions/${id}`);
    if (!response.ok) {
        throw new Error('Gagal mengambil detail lelang');
    }
    return await response.json();
}



// ===================================================================================
// BAGIAN 4: EVENT HANDLERS (Fungsi yang menangani aksi pengguna)
// ===================================================================================

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    errorElement.classList.add('hidden');

    try {
        const data = await apiLogin(username, password);
        saveSession(data.token, data.user);
        hideAllModals();
        updateUI();
        await loadPage('home');
        await fetchUserProfile();
        showToast(`Selamat datang kembali, ${data.user.username}!`, 'success');
    } catch (err) {
        errorElement.textContent = err.message;
        errorElement.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const errorElement = document.getElementById('register-error');
    errorElement.classList.add('hidden');

    try {
        const data = await apiRegister({ username, email, password, role });
        hideAllModals();
        showToast(data.message || 'Registrasi berhasil! Silakan login.', 'success');
        showModal(loginModal);
    } catch (err) {
        errorElement.textContent = err.message;
        errorElement.classList.remove('hidden');
    }
}

function logout() {
    showConfirmModal('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar?', 'warning', async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error('API logout gagal, tetap lanjutkan proses logout di sisi klien.', error);
        } finally {
            clearSession();
            updateUI();
            await loadPage('home');
            showToast('Anda telah berhasil keluar', 'info');
        }
    });
}

async function handleAddItem(e) {
    e.preventDefault();
    const errorElement = document.getElementById('add-item-error');
    errorElement.classList.add('hidden');

    const formData = new FormData();
    formData.append('name', document.getElementById('item-name').value);
    formData.append('description', document.getElementById('item-description').value);
    formData.append('starting_price', document.getElementById('item-starting-price').value);
    formData.append('end_date', document.getElementById('item-end-date').value);
    
    const imageFile = document.getElementById('item-image-file').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    } else {
        errorElement.textContent = 'Gambar barang wajib diunggah.';
        errorElement.classList.remove('hidden');
        return;
    }

    try {
        await apiAddItem(formData);
        hideAllModals();
        await loadPage('items');
        showToast('Barang berhasil ditambahkan!', 'success');
    } catch (err) {
        errorElement.textContent = err.message;
        errorElement.classList.remove('hidden');
    }
}

async function handleBid(e) {
    e.preventDefault();
    const itemId = document.getElementById('bid-item-id').value;
    const amount = document.getElementById('bid-amount').value;
    const errorElement = document.getElementById('bid-error');
    errorElement.classList.add('hidden');

    try {
        await apiPlaceBid(itemId, amount);
        hideAllModals();
        await viewAuctionDetails(parseInt(itemId));
        showToast('Penawaran Anda berhasil diajukan!', 'success');
    } catch(err) {
        errorElement.textContent = err.message;
        errorElement.classList.remove('hidden');
    }
}

function handleDeleteItem(itemId) {
    showConfirmModal('Hapus Barang', 'Apakah Anda yakin ingin menghapus barang ini? Aksi ini tidak bisa dibatalkan.', 'danger', async () => {
        try {
            await apiDeleteItem(itemId);
            showToast('Barang berhasil dihapus.', 'success');
            await loadPage('items');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function handleToggleAuctionStatus(itemId, newStatus) {
    const action = newStatus === 'closed' ? 'Tutup' : 'Buka';
    showConfirmModal(`${action} Lelang`, `Apakah Anda yakin ingin ${action.toLowerCase()} lelang ini?`, 'warning', async () => {
        try {
            await apiUpdateItemStatus(itemId, newStatus);
            showToast(`Lelang berhasil di-${action.toLowerCase()}.`, 'success');
            
            const detailPageActive = document.getElementById('back-btn');
            if (detailPageActive) {
                await viewAuctionDetails(itemId);
            } else {
                await loadPage('items');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

// ===================================================================================
// BAGIAN 5: FUNGSI RENDER TAMPILAN (UI & Page Loading)
// ===================================================================================

function updateUI() {
    const { user } = getSession();
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const loggedOutElements = document.querySelectorAll('.logged-out-only');
    const adminStaffElements = document.querySelectorAll('.admin-staff-only');

    if (user && user.id) {
        loggedInElements.forEach(el => el.classList.remove('hidden'));
        loggedOutElements.forEach(el => el.classList.add('hidden'));
        
        document.getElementById('username-display').textContent = user.username;
        document.getElementById('user-initial').textContent = user.username.charAt(0).toUpperCase();
        
        const roleBadge = document.getElementById('role-badge');
        roleBadge.textContent = user.role;
        
        const roleClasses = {
            administrator: 'bg-red-100 text-red-800',
            petugas: 'bg-blue-100 text-blue-800',
            masyarakat: 'bg-green-100 text-green-800'
        };
        roleBadge.className = `px-2 py-1 text-xs rounded-full ${roleClasses[user.role] || roleClasses.masyarakat}`;

        if (user.role === 'administrator' || user.role === 'petugas') {
            adminStaffElements.forEach(el => el.style.display = 'block');
        } else {
            adminStaffElements.forEach(el => el.style.display = 'none');
        }
    } else {
        loggedInElements.forEach(el => el.classList.add('hidden'));
        loggedOutElements.forEach(el => el.classList.remove('hidden'));
        adminStaffElements.forEach(el => el.style.display = 'none');
    }
}

async function loadPage(page) {
    const { user } = getSession();
    
    if ((page === 'items' || page === 'reports') && (!user || (user.role !== 'administrator' && user.role !== 'petugas'))) {
        showToast('Anda tidak memiliki izin untuk mengakses halaman ini', 'error');
        await loadPage('home');
        return;
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('text-indigo-600', link.dataset.page === page);
        link.classList.toggle('font-semibold', link.dataset.page === page);
    });
    
    mobileMenu.classList.add('hidden');
    mainContent.innerHTML = `<div class="text-center py-12"><p>Loading content...</p></div>`; // Loading indicator
    mainContent.classList.add('opacity-0');

    document.querySelectorAll('.countdown').forEach(el => {
        if(el.timerId) clearInterval(el.timerId);
    });

    setTimeout(async () => {
          try {
              switch (page) {
                  case 'home': await renderHomePage(); break;
                  case 'auctions': await renderAuctionsPage(); break;
                  case 'items': await renderItemsPage(); break;
                  case 'reports': await renderReportsPage(); break;
                  case 'profile': renderProfilePage(); break;
                  case 'my-offer': renderMyOfferPage(); break;
                  default: await renderHomePage();
              }
              startAuctionTimers();
          } catch (error) {
              mainContent.innerHTML = `<div class="text-center py-10"><p class="text-red-500">${error.message}</p><button onclick="loadPage('${page}')" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Coba Lagi</button></div>`;
          } finally {
            mainContent.classList.remove('opacity-0');
        }
    }, 200);
}

async function renderHomePage() {
    const { user } = getSession();
    const items = await apiFetchItems();
    const openItems = items.filter(item => item.status === 'open');
    const sortedItems = [...openItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    let html = `
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-8 mb-12 shadow-lg">
            <div class="max-w-3xl mx-auto text-center">
                <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">Kumpulan Barang Lelang Kualitas Terbaik Hanya di BELANG</h1>
                <p class="text-xl mb-8 opacity-90">Platform utama untuk lelang online. Temukan koleksi langka, barang antik, dan banyak lagi.</p>
                ${!user ? 
                    `<div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button id="home-login-btn" class="bg-white text-indigo-600 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors duration-300 font-medium"><i class="fas fa-sign-in-alt mr-2"></i> Login</button>
                        <button id="home-register-btn" class="bg-indigo-500 text-white px-8 py-3 rounded-md hover:bg-indigo-400 transition-colors duration-300 border border-white font-medium"><i class="fas fa-user-plus mr-2"></i> Register</button>
                    </div>` : 
                    `<div class="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg p-4 inline-block"><p class="text-xl">Welcome back, <span class="font-semibold">${user.username}</span>!</p></div>`
                }
            </div>
        </div>
        <div class="mb-12">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Lelang Unggulan</h2>
                <a href="#" id="view-all-auctions-btn" class="text-indigo-600 hover:text-indigo-800 transition-colors duration-300 flex items-center">View All <i class="fas fa-arrow-right ml-2"></i></a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    `;

    sortedItems.slice(0, 3).forEach(item => {
    html += `
        <div class="auction-card bg-white rounded-xl shadow-md overflow-hidden">
            <div class="relative">
               <img src="${getImageUrl(item.image_url)}" alt="${item.name}" class="w-full h-56 object-cover">
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">${item.name}</h3>
                <div class="flex justify-between items-center mb-4">
                    <span>Current Bid:</span>
                    <span class="text-indigo-600 font-bold">Rp ${parseFloat(item.current_price).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center mb-4">
                    <span>Time Left:</span>
                    <span class="countdown text-orange-500 font-medium" data-end="${item.end_date}"></span>
                </div>
                <button class="view-auction-btn w-full bg-indigo-600 text-white py-3 rounded-md" data-id="${item.id}">
                    <i class="fas fa-gavel mr-2"></i> Lihat Lelang
                </button>
            </div>
        </div>`;
});
html += `</div></div>`;
mainContent.innerHTML = html;


    document.querySelectorAll('.view-auction-btn').forEach(btn => btn.addEventListener('click', (e) => viewAuctionDetails(parseInt(e.currentTarget.dataset.id))));
    document.getElementById('view-all-auctions-btn')?.addEventListener('click', (e) => { e.preventDefault(); loadPage('auctions'); });
    document.getElementById('home-login-btn')?.addEventListener('click', () => showModal(loginModal));
    document.getElementById('home-register-btn')?.addEventListener('click', () => showModal(registerModal));
}

// GANTI KESELURUHAN FUNGSI renderProfilePage DI FILE app.js ANDA DENGAN INI

function renderProfilePage(inEditMode = false) {
    const { user } = getSession();
    if (!user) {
        loadPage('home'); // Jika tidak ada user, kembali ke home
        return;
    }

    let html = '';

    if (inEditMode) {
        // ===================================
        // MODE EDIT (FORM DITAMPILKAN)
        // ===================================
        html = `
        <div class="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-lg">
            <h1 class="text-3xl font-bold mb-6 text-center text-indigo-700">Edit Profil Pengguna</h1>
            <form id="profile-form" class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-700 font-semibold">Username</label>
                        <input type="text" value="${user.username}" class="w-full px-4 py-2 border rounded bg-gray-100" disabled>
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold">Nama Lengkap</label>
                        <input type="text" name="name" value="${user.name || ''}" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold">Alamat</label>
                        <input type="text" name="address" value="${user.address || ''}" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold">No. KTP</label>
                        <input type="text" name="ktp" value="${user.ktp || ''}" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold">Bio</label>
                        <textarea name="bio" rows="3" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400">${user.bio || ''}</textarea>
                    </div>
                </div>
                <div class="flex flex-col items-center space-y-4">
                    <img src="${user.photo || 'https://via.placeholder.com/150'}" alt="Foto Profil" class="rounded-full w-32 h-32 object-cover border">
                    <label class="block text-gray-700 font-semibold">Ganti Foto Profil</label>
                    <input type="file" name="photo" accept="image/*" class="text-sm text-gray-600">
                </div>
                <div class="col-span-2 text-center mt-4">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded">Simpan Perubahan</button>
                    <button type="button" id="cancel-edit-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded ml-2">Batal</button>
                </div>
            </form>
        </div>`;
    } else {
        // ===================================
        // MODE LIHAT (HANYA TEKS BIASA)
        // ===================================
        html = `
        <div class="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-lg">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-indigo-700">Profil Pengguna</h1>
                <button id="edit-profile-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded">Edit Profil</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1 flex flex-col items-center">
                    <img src="${user.photo || 'https://via.placeholder.com/150'}" alt="Foto Profil" class="rounded-full w-40 h-40 object-cover border-4 border-indigo-200">
                    <h2 class="text-2xl font-bold mt-4">${user.name || user.username}</h2>
                    <p class="text-gray-500">${user.email}</p>
                </div>
                <div class="md:col-span-2 space-y-4 pt-4">
                    <div><label class="block text-sm font-medium text-gray-500">Username</label><p class="text-lg text-gray-800">${user.username}</p></div>
                    <div><label class="block text-sm font-medium text-gray-500">Alamat</label><p class="text-lg text-gray-800">${user.address || '-'}</p></div>
                    <div><label class="block text-sm font-medium text-gray-500">No. KTP</label><p class="text-lg text-gray-800">${user.ktp || '-'}</p></div>
                    <div><label class="block text-sm font-medium text-gray-500">Bio</label><p class="text-lg text-gray-800">${user.bio || '-'}</p></div>
                </div>
            </div>
        </div>`;
    }
    
    // LANGKAH 1: Tampilkan HTML ke halaman
    mainContent.innerHTML = html;

    // LANGKAH 2: PASANG EVENT LISTENER SETELAH HTML ADA
    if (inEditMode) {
        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            // formData.append('_method', 'PUT');

            try {
                const response = await fetch(`${API_BASE_URL}/profile/update`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: formData
                });
                const data = await response.json();
                if (!response.ok) {
                    const errorMessages = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
                    throw new Error(errorMessages || 'Gagal menyimpan profil');
                }
                
                saveSession(localStorage.getItem('authToken'), data.user);
                renderProfilePage(false); // Balik ke mode lihat
                updateUI();
                showToast('Profil berhasil diperbarui!', 'success');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
        
        document.getElementById('cancel-edit-btn').addEventListener('click', () => renderProfilePage(false));
    } else {
        document.getElementById('edit-profile-btn').addEventListener('click', () => renderProfilePage(true));
    }
}

// GANTI SELURUH FUNGSI renderMyOfferPage LAMA ANDA DENGAN INI

// GANTI SELURUH FUNGSI renderMyOfferPage DI app.js ANDA DENGAN INI

async function renderMyOfferPage() {
    try {
        // PERBAIKAN 1: Menggunakan API_BASE_URL dan getAuthHeaders() yang benar
        const response = await fetch(`${API_BASE_URL}/offers/user`, {
            headers: getAuthHeaders() 
        });

        if (!response.ok) {
            throw new Error('Gagal mengambil data penawaran dari server.');
        }

        const offers = await response.json();

        let tableRows = '';
        if (offers.length > 0) {
            offers.forEach(offer => {
                // PERBAIKAN 2: Logika untuk menentukan warna dan teks badge status
                const statusClasses = {
                    'Menang': 'bg-green-100 text-green-800',
                    'Memimpin': 'bg-blue-100 text-blue-800',
                    'Kalah': 'bg-red-100 text-red-800'
                };
                const statusClass = statusClasses[offer.status] || 'bg-gray-100 text-gray-800';

                tableRows += `
                    <tr class="border-t ${offer.status === 'Menang' ? 'font-bold' : ''}">
                        <td class="p-4 flex items-center space-x-4">
                            <img src="${getImageUrl(offer.item.image_url)}" alt="${offer.item.name}" class="w-16 h-16 object-cover rounded-md" style="background-color: #eee;">
                            <div>
                                <p class="font-semibold">${offer.item.name}</p>
                                <p class="text-xs text-gray-500">Lelang berakhir: ${new Date(offer.item.end_date).toLocaleDateString('id-ID')}</p>
                            </div>
                        </td>
                        <td class="p-4 text-gray-800">Rp ${parseFloat(offer.amount).toLocaleString('id-ID')}</td>
                        <td class="p-4 text-gray-600">${new Date(offer.created_at).toLocaleString('id-ID')}</td>
                        <td class="p-4 text-center">
                           <span class="px-3 py-1 text-sm rounded-full ${statusClass}">${offer.status}</span>
                        </td>
                    </tr>`;
            });
        } else {
            tableRows = `<tr><td colspan="4" class="text-center py-16 text-gray-500">
                <i class="fas fa-search-dollar text-4xl mb-2"></i>
                <p>Anda belum pernah melakukan penawaran.</p>
            </td></tr>`;
        }

        mainContent.innerHTML = `
            <div class="max-w-6xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg animate-fade-in">
                <h1 class="text-3xl font-bold mb-6 text-gray-800">Riwayat Penawaran Saya</h1>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm sm:text-base">
                        <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th class="p-4 text-left">Barang</th>
                                <th class="p-4 text-left">Jumlah Penawaran</th>
                                <th class="p-4 text-left">Tanggal</th>
                                <th class="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">${tableRows}</tbody>
                    </table>
                </div>
            </div>`;

    } catch (error) {
        mainContent.innerHTML = `<div class="text-center py-12 text-red-500 font-semibold">${error.message}</div>`;
    }
}

async function renderAuctionsPage() {
    const items = await apiFetchItems();

    let html = `
        <div class="mb-8"><h1 class="text-3xl font-bold">Browse Auctions</h1></div>
        <div id="auctions-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    `;

    items.forEach(item => {
        const ended = isAuctionEnded(item.end_date);
        const status = ended ? 'closed' : item.status;
        const statusClass = status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

        html += `
            <div class="auction-item auction-card bg-white rounded-xl shadow-md overflow-hidden" data-status="${status}" data-name="${item.name.toLowerCase()}">
                <div class="relative">
                    <img src="${getImageUrl(item.image_url)}" alt="${item.name}" class="w-full h-48 object-cover">
                    <span class="absolute top-3 left-3 px-2 py-1 text-xs rounded-full ${statusClass}">${status}</span>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">${item.name}</h3>
                    <div class="flex justify-between items-center mb-2">
                        <span>Current Bid:</span>
                        <span class="text-indigo-600 font-bold">Rp${parseFloat(item.current_price).toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <span>Time Left:</span>
                        <span class="countdown text-orange-500 font-medium" data-end="${item.end_date}"></span>
                    </div>
                    ${!ended && status === 'open' ? `
                        <button class="view-auction-btn w-full bg-indigo-600 text-white py-2 rounded-md" data-id="${item.id}">
                            <i class="fas fa-gavel mr-2"></i> View Auction
                        </button>
                    ` : `
                        <div class="text-center text-sm text-red-500 font-semibold">Lelang Ditutup</div>
                    `}
                </div>
            </div>`;
    });

    html += `</div>`;
    mainContent.innerHTML = html;

    // 🧠 Penting! Tambahkan listener setelah tombol ditampilkan
    document.querySelectorAll('.view-auction-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            viewAuctionDetails(id);
        });
    });
}

async function renderItemsPage() {
    const items = await apiFetchItems();
    let tableRows = '';
    items.forEach(item => {
        const formattedDate = new Date(item.end_date).toLocaleString();
        const statusClass = item.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        tableRows += `
            <tr class="item-row" data-status="${item.status}" data-name="${item.name.toLowerCase()}">
                <td class="px-6 py-4"><div class="flex items-center"><div class="flex-shrink-0 h-12 w-12"><img class="h-12 w-12 rounded-lg object-cover" src="${getImageUrl(item.image_url)}" alt=""></div><div class="ml-4"><div class="text-sm font-medium">${item.name}</div></div></div></td>
                <td class="px-6 py-4"><div class="text-sm">Rp ${parseFloat(item.current_price).toLocaleString()}</div></td>
                <td class="px-6 py-4"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${item.status}</span></td>
                <td class="px-6 py-4 text-sm">${formattedDate}</td>
                <td class="px-6 py-4 text-sm">${item.bids ? item.bids.length : 0}</td>
                <td class="px-6 py-4 text-sm font-medium"><div class="flex space-x-3">
                    <button class="text-indigo-600 hover:text-indigo-900 view-item-btn" data-id="${item.id}"><i class="fas fa-eye"></i></button>
                    <button class="text-red-600 hover:text-red-900 close-auction-btn" data-id="${item.id}" data-status="closed"><i class="fas fa-times-circle"></i></button>
                    <button class="text-gray-600 hover:text-gray-900 delete-item-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </div></td>
            </tr>`;
    });

    mainContent.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Item Management</h1>
            <button id="add-item-btn" class="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"><i class="fas fa-plus mr-2"></i> Add New Item</button>
        </div>
        <div class="bg-white rounded-xl shadow-md overflow-hidden"><div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50"><tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bids</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody>
            </table>
        </div></div>`;
    
    document.getElementById('add-item-btn').addEventListener('click', () => showModal(addItemModal));
    document.querySelectorAll('.view-item-btn').forEach(btn => btn.addEventListener('click', (e) => viewAuctionDetails(parseInt(e.currentTarget.dataset.id))));
    document.querySelectorAll('.delete-item-btn').forEach(btn => btn.addEventListener('click', (e) => handleDeleteItem(parseInt(e.currentTarget.dataset.id))));
    document.querySelectorAll('.close-auction-btn').forEach(btn => btn.addEventListener('click', (e) => handleToggleAuctionStatus(parseInt(e.currentTarget.dataset.id), 'closed')));
}

// GANTI FUNGSI renderReportsPage DENGAN YANG INI
async function renderReportsPage() {
    const items = await apiFetchItems();
    const totalItems = items.length;
    const openAuctions = items.filter(item => item.status === 'open').length;
    const totalBids = items.reduce((sum, item) => sum + (item.bids ? item.bids.length : 0), 0);
    const totalRevenue = items.reduce((sum, item) => item.status === 'closed' && item.bids && item.bids.length > 0 ? sum + parseFloat(item.current_price) : sum, 0);

    mainContent.innerHTML = `
        <div class="mb-8"><h1 class="text-3xl font-bold">Laporan & Analitik</h1></div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-md p-6">Total Barang: <b class="text-2xl">${totalItems}</b></div>
            <div class="bg-white rounded-xl shadow-md p-6">Lelang Dibuka: <b class="text-2xl">${openAuctions}</b></div>
            <div class="bg-white rounded-xl shadow-md p-6">Total Penawaran: <b class="text-2xl">${totalBids}</b></div>
            <div class="bg-white rounded-xl shadow-md p-6">Total Pendapatan: <b class="text-2xl">Rp ${totalRevenue.toLocaleString('id-ID')}</b></div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Unduh Laporan</h2>
            <button id="generate-report-btn" class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                <i class="fas fa-file-pdf mr-2"></i> Unduh Laporan Lelang (PDF)
            </button>
        </div>`;

    // Perbarui event listener untuk memanggil downloadPDF
    document.getElementById('generate-report-btn').addEventListener('click', () => {
        downloadPDF(items, 'laporan-lelang-belang.pdf');
    });
}

// GANTI SELURUH FUNGSI LAMA DENGAN FUNGSI BARU DI BAWAH INI
// GANTI LAGI FUNGSI viewAuctionDetails DENGAN VERSI FINAL DI BAWAH INI

async function viewAuctionDetails(id) {
    try {
        mainContent.innerHTML = `<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2">Memuat detail lelang...</p></div>`;
        const item = await apiFetchItem(id);
        const { user } = getSession();

        const ended = isAuctionEnded(item.end_date);
        const highestBidder = item.bids && item.bids.length > 0 ? item.bids[0].user.username : 'Belum ada';

        const canBid = user && user.role === 'masyarakat';
        
        const renderActionArea = () => {
            if (ended || item.status === 'closed') {
                return `
                <div class="bg-gray-100 p-6 rounded-lg text-center border-l-4 border-gray-500 animate-fade-in">
                    <i class="fas fa-lock text-3xl text-gray-400 mb-2"></i>
                    <p class="text-xl font-semibold text-gray-800">Lelang Telah Ditutup</p>
                    <p class="text-gray-600">Penawaran tidak dapat lagi diajukan untuk barang ini.</p>
                </div>`;
            }
            if (user) {
                if (canBid) {
                    return `
                    <form id="bid-form" class="space-y-4 animate-fade-in">
                        <h3 class="text-xl font-semibold text-gray-800">Ajukan Penawaran Anda</h3>
                        <div>
                            <label for="bid_amount" class="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                            <input type="number" id="bid_amount" name="bid_amount" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg" placeholder="Minimal Rp ${parseFloat(item.current_price + 1).toLocaleString('id-ID')}">
                        </div>
                        <button type="submit" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg text-lg font-semibold hover:shadow-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center">
                            <i class="fas fa-gavel mr-2"></i> Kirim Penawaran
                        </button>
                    </form>`;
                } else {
                    return `
                    <div class="bg-blue-50 p-6 rounded-lg text-center border-l-4 border-blue-400 animate-fade-in">
                        <i class="fas fa-info-circle text-3xl text-blue-500 mb-2"></i>
                        <p class="text-xl font-semibold text-blue-800">Mode Pengelola</p>
                        <p class="text-blue-700">Penawaran hanya dapat dilakukan oleh pengguna dengan peran masyarakat.</p>
                    </div>`;
                }
            } else {
                return `
                <div class="bg-yellow-50 p-6 rounded-lg text-center border-l-4 border-yellow-400 animate-fade-in">
                     <i class="fas fa-sign-in-alt text-3xl text-yellow-500 mb-2"></i>
                     <p class="text-xl font-semibold text-yellow-800 mb-3">Anda Belum Login</p>
                     <button id="login-for-bid-btn" class="bg-indigo-600 text-white px-8 py-2 rounded-md hover:bg-indigo-700 transition-colors">Login untuk Menawar</button>
                </div>`;
            }
        };

        const html = `
        <div class="max-w-7xl mx-auto animate-fade-in">
            <div class="mb-6">
                <button onclick="loadPage('auctions')" class="flex items-center text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors duration-300">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Kembali ke Daftar Lelang
                </button>
            </div>
            <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <div class="rounded-lg overflow-hidden">
                    <img src="${getImageUrl(item.image_url)}" alt="${item.name}" class="w-full h-full object-cover aspect-square">
                </div>
                <div class="flex flex-col">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">${item.name}</h1>
                    <p class="text-gray-600 mb-6 leading-relaxed">${item.description}</p>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-indigo-50 p-4 rounded-xl text-center">
                            <p class="text-sm text-indigo-800 font-semibold flex items-center justify-center"><i class="fas fa-tag mr-2"></i>Harga Saat Ini</p>
                            <p class="text-2xl font-bold text-indigo-600">Rp ${parseFloat(item.current_price).toLocaleString('id-ID')}</p>
                        </div>
                        <div class="bg-gray-100 p-4 rounded-xl text-center">
                            <p class="text-sm text-gray-600 flex items-center justify-center"><i class="fas fa-user-check mr-2"></i>Penawar Tertinggi</p>
                            <p class="text-xl font-semibold text-gray-800">${highestBidder}</p>
                        </div>
                    </div>
                    <div class="border-t border-b border-gray-200 py-4 mb-6">
                        <div class="flex justify-between items-center">
                            <p class="text-lg font-semibold text-gray-700">Waktu Tersisa:</p>
                            <div id="countdown-detail" class="countdown text-2xl font-bold ${ended ? 'text-gray-500' : 'text-red-600'}" data-end="${item.end_date}">
                                Memuat...
                            </div>
                        </div>
                    </div>
                    <div id="auction-action-area" class="mt-auto">
                        ${renderActionArea()}
                    </div>
                </div>
            </div>
        </div>
        `;
        mainContent.innerHTML = html;
        
        // =======================================================
        // PERBAIKAN ADA DI SINI:
        // Memanggil 'startAuctionTimers()' yang sudah ada
        // untuk mengaktifkan semua timer di halaman
        // =======================================================
        startAuctionTimers(); 

        const bidForm = document.getElementById('bid-form');
        if (bidForm) {
            bidForm.addEventListener('submit', (e) => submitBid(e, id));
        }
        const loginForBidBtn = document.getElementById('login-for-bid-btn');
        if(loginForBidBtn) {
            loginForBidBtn.addEventListener('click', () => showModal(loginModal));
        }

    } catch (error) {
        mainContent.innerHTML = `<div class="text-center py-12 text-red-500 font-semibold">${error.message}</div>`;
    }
}

// GANTI FUNGSI submitBid LAMA ANDA DENGAN YANG BARU INI

async function submitBid(event, auctionId) {
    event.preventDefault();

    const amount = document.getElementById('bid_amount').value;

    try {
        // Menggunakan fungsi apiPlaceBid yang sudah ada dan benar
        await apiPlaceBid(auctionId, amount);

        showToast('Penawaran Anda berhasil diajukan!', 'success');
        
        // Muat ulang halaman detail untuk melihat harga terbaru
        await viewAuctionDetails(auctionId); 

    } catch (err) {
        // Tampilkan error di bawah form, bukan dengan alert
        showToast(err.message || 'Gagal mengajukan penawaran.', 'error');
    }
}

// ===================================================================================
// BAGIAN 6: FUNGSI BANTUAN UI LAINNYA (TIDAK BERUBAH)
// ===================================================================================

function showModal(modal) {
    hideAllModals();
    modal.classList.remove('hidden');
    setTimeout(() => {
        const modalContent = modal.querySelector('div.bg-white');
        modalContent.classList.add('animate-slide-up');
    }, 10);
}

function hideAllModals() {
    document.querySelectorAll('.fixed.inset-0').forEach(modal => {
        if(modal.id !== 'toast') modal.classList.add('hidden');
    });
    document.querySelectorAll('form').forEach(form => form.reset());
    document.querySelectorAll('.text-red-500.mb-4').forEach(error => error.classList.add('hidden'));
}

function showConfirmModal(title, message, type, confirmAction) {
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmIcon = document.getElementById('confirm-icon');
    const confirmButton = document.getElementById('confirm-action');
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    if (type === 'danger') {
        confirmIcon.innerHTML = `<i class="fas fa-trash-alt text-red-600"></i>`;
        confirmButton.className = 'px-4 py-2 bg-red-600 text-white rounded-md';
    } else {
        confirmIcon.innerHTML = `<i class="fas fa-exclamation-triangle text-yellow-600"></i>`;
        confirmButton.className = 'px-4 py-2 bg-yellow-600 text-white rounded-md';
    }
    confirmButton.onclick = () => { hideAllModals(); confirmAction(); };
    showModal(confirmModal);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600',
    };
    const typeIcons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle',
    }
    toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-md shadow-lg transform transition-all duration-300 translate-y-full opacity-0 flex items-center ${typeClasses[type]}`;
    toastIcon.innerHTML = `<i class="fas ${typeIcons[type]}"></i>`;
    toastMessage.textContent = message;
    toast.classList.remove('translate-y-full', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
    }, 3000);
}

function startAuctionTimers() {
    document.querySelectorAll('.countdown').forEach(element => {
        const endDateStr = element.dataset.end;
        if (!endDateStr) return;
        if (element.timerId) clearInterval(element.timerId);
        
        const endDate = new Date(endDateStr);
        const updateTimer = () => {
            const timeLeft = getTimeLeft(endDate);
            element.textContent = timeLeft;
            if (timeLeft === 'Ended') clearInterval(element.timerId);
        };
        updateTimer();
        element.timerId = setInterval(updateTimer, 1000);
    });
}

function getTimeLeft(endDate) {
    // ... (fungsi getTimeLeft dari kode sebelumnya)
    const now = new Date();
    const timeLeft = new Date(endDate) - now;
    if (timeLeft <= 0) return 'Ended';
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// TAMBAHKAN FUNGSI BARU INI
function downloadPDF(data, filename) {
    if (data.length === 0) {
        showToast('Tidak ada data untuk dijadikan laporan.', 'warning');
        return;
    }

    // Buat elemen tabel sementara di luar layar untuk dicetak
    const tableContainer = document.createElement('div');
    tableContainer.style.position = 'absolute';
    tableContainer.style.left = '-9999px';
    tableContainer.style.padding = '20px';
    tableContainer.style.fontFamily = 'sans-serif';
    tableContainer.style.fontSize = '12px';

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ddd;">Nama Barang</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Harga Akhir</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Jumlah Tawaran</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Tanggal Berakhir</th>
        </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.status}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">Rp ${parseFloat(item.current_price).toLocaleString('id-ID')}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.bids ? item.bids.length : 0}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.end_date).toLocaleString('id-ID')}</td>
            </tr>
        `;
    });
    table.appendChild(tbody);
    
    const reportTitle = document.createElement('h1');
    reportTitle.innerText = 'Laporan Lelang - BELANG';
    reportTitle.style.marginBottom = '20px';

    tableContainer.appendChild(reportTitle);
    tableContainer.appendChild(table);
    document.body.appendChild(tableContainer);

    // Gunakan html2canvas untuk mengubah tabel HTML menjadi gambar
    html2canvas(tableContainer).then(canvas => {
        document.body.removeChild(tableContainer); // Hapus tabel sementara
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        // Buat dokumen PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const width = pdfWidth - 40; // Kurangi margin
        const height = width / ratio;

        pdf.addImage(imgData, 'PNG', 20, 20, width, height);
        pdf.save(filename);
        showToast('Laporan PDF berhasil dibuat!', 'success');
    }).catch(err => {
        showToast('Gagal membuat laporan PDF.', 'error');
        console.error(err);
        document.body.removeChild(tableContainer);
    });
}


// ===================================================================================
// BAGIAN 7: EVENT LISTENER UTAMA
// ===================================================================================

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    loadPage('home');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage(e.currentTarget.dataset.page);
        });
    });

    document.getElementById('login-btn')?.addEventListener('click', () => showModal(loginModal));
    document.getElementById('register-btn')?.addEventListener('click', () => showModal(registerModal));
    document.getElementById('logout-btn').addEventListener('click', logout);

    document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('user-dropdown').classList.toggle('hidden');
    });

    document.querySelector('[data-page="profile"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        loadPage('profile');
    document.getElementById('user-dropdown')?.classList.add('hidden');  
    });

    document.querySelector('[data-page="my-offer"]')?.addEventListener('click', (e) => {
        e.preventDefault();
    loadPage('my-offer');
    document.getElementById('user-dropdown')?.classList.add('hidden');
    });

    document.addEventListener('click', () => document.getElementById('user-dropdown').classList.add('hidden'));

    document.getElementById('switch-to-register').addEventListener('click', () => { hideAllModals(); showModal(registerModal); });
    document.getElementById('switch-to-login').addEventListener('click', () => { hideAllModals(); showModal(loginModal); });
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);
    document.getElementById('bid-form').addEventListener('submit', handleBid);
    
    document.getElementById('mobile-menu-btn').addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    window.addEventListener('click', (e) => { if (e.target.classList.contains('fixed')) hideAllModals(); });
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', hideAllModals));
});