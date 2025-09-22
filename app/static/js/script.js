// Simple menu switch logic
const links = document.querySelectorAll('.sidebar nav a');
const mainContent = document.getElementById('main-content');


// Menampilkan hasil respon dari server ke elemen #outputKiri.
document.addEventListener("DOMContentLoaded", () => {
  const selectOlt = document.getElementById("oltGponMaster");
  const outputKiri = document.getElementById("outputKiri");

  if (!selectOlt) {
    console.error("Element #oltGponMaster tidak ditemukan!");
    return;
  }

  selectOlt.addEventListener("change", async () => {
    const selectedId = selectOlt.value;
    if (!selectedId) return;

    outputKiri.textContent = "# Menghubungkan ke OLT...";

    try {
      const response = await fetch("/api/telnet_olt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id_olt: selectedId })
      });

      const data = await response.json();
      outputKiri.textContent = data.output || "# Gagal mengambil data dari OLT.";
    } catch (error) {
      outputKiri.textContent = "# Terjadi kesalahan saat koneksi.";
    }
  });
});


// Kode ini membuat agar ketika user klik menu, menu yang aktif akan berganti
links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const menu = link.getAttribute('data-menu');
      renderPage(menu);
    });
  });

// Ambil semua checkbox submenu
const submenus = document.querySelectorAll('.has-submenu input[type="checkbox"]');

submenus.forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      // tutup semua submenu lain
      submenus.forEach(other => {
        if (other !== checkbox) other.checked = false;
      });
    }
  });
});


    
// Fungsi render halaman
function renderPage(page) {
  switch(page) {
    case 'dashboard':
      mainContent.innerHTML = `<h1>Dashboard</h1>`;
      break;
    case 'oltDataMaster':
      renderOLTPage();
      break;
    case 'oltDataUpdate':
      renderOLTUpdate();
      break;
    case 'oltDataGpon':
      renderSpeedAndVendorSection();
      break;
    case 'oltConfigPSB':
      renderConfigPSBSection();
      break;
    case 'report':            
      showReport();           
      break;
    default:
      mainContent.innerHTML = `<h1>Dashboard</h1>`;
  }
}

// Memasang event handler untuk menangani interaksi pengguna di form update.
function renderOLTUpdate() {
  mainContent.innerHTML = `
    <!-- Form update dan tabel -->
  `;
  setupUpdateFormHandler();
  loadOLTData();
  loadPOPOptions();
  setupUpdateFormHandler();
}

// ---------------------------- INPUT DATA OLT ------------------------------
  function renderOLTPage() { 
    mainContent.innerHTML = `
    <h1>Optical Line Terminal</h1>
    <div class="layout-container">
    <!-- Kolom Kiri: Tabel -->
    <div class="card form-card">
      <form id="oltFormAdd">
        <div class="form-group">
          <label for="ip_address">IP Address:</label>
          <input type="text" id="ip_address" name="ip_address" placeholder="192.168.1.1" required>
        </div>

        <div class="form-group">
          <label for="vlan">VLAN:</label>
          <input type="text" id="vlan" name="vlan" placeholder="Contoh: 100" required>
        </div>

        <div class="form-group">
          <label for="jenisOlt">Jenis OLT:</label>
          <input type="text" id="jenisOlt" name="jenis_olt" placeholder="Contoh: Huawei MA5600T" required>
        </div>

        <div class="form-group">
          <label for="alamatPop">Alamat POP:</label>
          <input type="text" id="alamatPop" name="alamat_pop" placeholder="Contoh: Jl. Telekomunikasi No. 1" required>
        </div>

        <div class="form-group">
          <label for="username">Username (Telnet OLT):</label>
          <input type="text" id="username" name="username_telnet" placeholder="Contoh: admin" required>
        </div>

        <div class="form-group">
          <label for="password">Password (Telnet OLT):</label>
          <input type="password" id="password" name="password_telnet" required>
        </div>

      <button type="submit" class="tombol-simpan">Simpan</button>
      </form>
    </div>

    <!-- Kolom Kanan: Tabel -->
      <div class="card table-card">
        <h2>Daftar OLT</h2>
        <table id="oltTable">
          <thead>
            <tr>
              <th>IP</th>
              <th>VLAN</th>
              <th>Jenis</th>
              <th>Alamat</th>
            </tr>
          </thead>
          <tbody>
            <!-- Akan diisi oleh JavaScript -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Setelah DOM siap, panggil fungsi yang pasang event listener & fetch data
  setupFormHandler();
  loadOLTData();

const oltForm = document.getElementById('oltFormAdd');
  if (!oltForm) {
    console.error('Form oltFormAdd tidak ditemukan di DOM!');
    return;
  }

  oltForm.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      ip_address: oltForm.elements['ip_address'].value,
      vlan: oltForm.elements['vlan'].value,
      jenis_olt: oltForm.elements['jenis_olt'].value,
      alamat_pop: oltForm.elements['alamat_pop'].value,
      username_telnet: oltForm.elements['username_telnet'].value,
      password_telnet: oltForm.elements['password_telnet'].value,
    };

    try {
      const response = await fetch('/api/add_olt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Data OLT berhasil disimpan');
        oltForm.reset();
        loadOLTData();
      } else {
        if (result.message !== 'Data tidak lengkap') {
          alert('Gagal menyimpan data: ' + (result.message || 'Unknown error'));
        }
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan data: ' + error.message);
    }
  });
}

// ---------------------------- UPDATE DATA OLT ------------------------------
function renderOLTUpdate() {
  mainContent.innerHTML = `
    <h1>Update OLT</h1>
    <div class="layout-container">
    <div class="card form-card">
      <form id="oltFormUpdate">

        <div class="form-group">
          <input type="hidden" id="idOlt" name="idOlt" />
        </div>

        <div class="form-group">
          <label for="popSelect">POP:</label>
          <select id="popSelect" name="pop" required>
            <option value="">-- Pilih POP --</option>
            <!-- Opsi kota akan diisi dari database -->
          </select>
        </div>

        <div class="form-group">
          <label for="ipAddress">IP Address:</label>
          <input type="text" id="ipAddress" name="ipAddress" placeholder="192.168.1.1" required>
        </div>

        <div class="form-group">
          <label for="vlan">VLAN:</label>
          <input type="text" id="vlan" name="vlan" placeholder="Contoh: 100" required>
        </div>

        <div class="form-group">
          <label for="jenisOlt">Jenis OLT:</label>
          <input type="text" id="jenisOlt" name="jenisOlt" placeholder="Contoh: Huawei MA5600T" required>
        </div>

        <div class="form-group">
          <label for="username">Username (Telnet OLT):</label>
          <input type="text" id="username" name="username" placeholder="Contoh: admin" required>
        </div>

        <div class="form-group">
          <label for="password">Password (Telnet OLT):</label>
          <input type="password" id="password" name="password" required>
        </div>

      <button type="submit" class="tombol-simpan">Simpan</button>
      </form>
    </div>

    <!-- Kolom Kanan: Tabel -->
      <div class="card table-card">
        <h2>Daftar OLT</h2>
        <table id="oltTable">
          <thead>
            <tr>
              <th>IP</th>
              <th>VLAN</th>
              <th>Jenis</th>
              <th>Alamat</th>
            </tr>
          </thead>
          <tbody>
            <!-- Akan diisi oleh JavaScript -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadOLTData();
  loadPOPOptions();
  setupUpdateFormHandler();
}

async function loadOLTGponOptions() {
  try {
    const res = await fetch('/api/list_olt');
    const data = await res.json();

    const select = document.getElementById('oltGponMaster');
    const outputKiri = document.getElementById('outputKanan');
    if (!select || !outputKiri) return;

    // Kosongkan dulu
    select.innerHTML = `<option value="">-- Pilih OLT --</option>`;

    // Isi opsi dari data JSON
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id_olt;
      option.textContent = item.alamat_pop;
      select.appendChild(option);
    });

    // Event listener untuk SELECT
    select.addEventListener('change', async (event) => {
      const selectedId = event.target.value;
      if (!selectedId) return;

      outputKiri.textContent = "# Menghubungkan ke OLT...";

      try {
        const response = await fetch("/api/telnet_olt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id_olt: selectedId })
        });

        const result = await response.json();
        outputKiri.textContent = result.output || "# Gagal mengambil data dari OLT.";
      } catch (error) {
        outputKiri.textContent = "# Terjadi kesalahan saat koneksi.";
        console.error(error);
      }
    });

  } catch (err) {
    console.error('Gagal memuat data OLT:', err);
  }
}

// Panggil saat halaman siap
window.addEventListener('DOMContentLoaded', loadOLTGponOptions);
  function setupFormHandler() {
    const oltForm = document.getElementById('oltFormAdd');
    oltForm.addEventListener('submit', async e => {
      e.preventDefault();

      const data = {
        ip_address: oltForm.ipAddress.value,
        vlan: oltForm.vlan.value,
        jenis_olt: oltForm.jenisOlt.value,
        alamat_pop: oltForm.alamatPop.value,
        username_telnet: oltForm.username.value,
        password_telnet: oltForm.password.value,
      };

      try {
        const response = await fetch('/api/add_olt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // wajib JSON
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          alert('Data OLT berhasil disimpan');
          oltForm.reset();
          loadOLTData();
        } else {
          alert('Gagal menyimpan data: ' + (result.message || 'Unknown error'));
        }
      } catch (error) {
        alert('Error saat menyimpan data: ' + error.message);
        console.error(error);
      }
    });
  }

  // Setup handler submit untuk update data
  function setupUpdateFormHandler() {
    const oltFormUpdate = document.getElementById('oltFormUpdate');
    oltFormUpdate.addEventListener('submit', async e => {
      e.preventDefault();
      // Ambil data dan kirim update POST...
      // ...
      loadOLTData();
    });
  }

  async function loadOLTData() {
  try {
    const res = await fetch('/api/list_olt');
    const data = await res.json();
    const table = document.getElementById('oltTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(olt => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${olt.ip_address}</td>
        <td>${olt.vlan}</td>
        <td>${olt.jenis_olt}</td>
        <td>${olt.alamat_pop}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error memuat data OLT:', err);
  }
  }

  let popData = [];
  async function loadPOPOptions() {
  try {
    const res = await fetch('/api/list_olt');
    const data = await res.json();

    const select = document.getElementById('popSelect');
    if (!select) return;

    select.innerHTML = `<option value="">-- Pilih POP --</option>`;

    const popSet = new Set();

    data.forEach(item => {
      if (!popSet.has(item.alamat_pop)) {
        popSet.add(item.alamat_pop);

        const option = document.createElement('option');
        option.value = item.alamat_pop;
        option.textContent = item.alamat_pop;
        select.appendChild(option);
      }
    });

    // Event listener saat POP dipilih
    select.addEventListener('change', (event) => {
      const selectedPOP = event.target.value;
      const selectedData = data.find(item => item.alamat_pop === selectedPOP);

      if (selectedData) {
        document.getElementById('ipAddress').value = selectedData.ip_address || '';
        document.getElementById('vlan').value = selectedData.vlan || '';
        document.getElementById('jenisOlt').value = selectedData.jenis_olt || '';
        document.getElementById('username').value = selectedData.username_telnet || '';
        document.getElementById('password').value = selectedData.password_telnet || '';
        document.getElementById('idOlt').value = selectedData.id_olt || '';  // penting untuk update
      }
    });

    } catch (err) {
      console.error('Gagal memuat data POP:', err);
    }
  }

    function handlePOPChange(event) {
      const selectedPOP = event.target.value;
      const selectedData = popData.find(item => item.alamat_pop === selectedPOP);

      // Jika ada data yang cocok, isi input
      if (selectedData) {
        document.getElementById('ipAddress').value = selectedData.ip_address || '';
        document.getElementById('vlan').value = selectedData.vlan || '';
        document.getElementById('jenisOlt').value = selectedData.jenis_olt || '';
        document.getElementById('username').value = selectedData.username_telnet || '';
        document.getElementById('password').value = selectedData.password_telnet || '';
      } else {
        // Jika kosong atau tidak cocok, kosongkan input
        document.getElementById('ipAddress').value = '';
        document.getElementById('vlan').value = '';
        document.getElementById('jenisOlt').value = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
      }
    }

// Panggil saat halaman dimuat
window.addEventListener('DOMContentLoaded', loadPOPOptions);
  function setupUpdateFormHandler() {
    const updateForm = document.getElementById('oltFormUpdate');
    if (!updateForm) return;

    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(updateForm); // Ambil semua field dari form langsung

      try {
        const response = await fetch('/api/update_olt', {
          method: 'POST',
          body: formData, // Tidak perlu headers, browser akan handle multipart/form-data
        });

        const result = await response.json();

        if (response.ok) {
          alert('Data OLT berhasil diperbarui');
          updateForm.reset();
          loadOLTData();
        } else {
          alert('Gagal memperbarui data: ' + result.error || result.message);
        }
      } catch (error) {
        alert('Error saat memperbarui data: ' + error.message);
        console.error(error);
      }
    });
  }

// ---------------------------- IMPORT PROFILE ------------------------------

// ---------------------------- IMPORT PROFILE ------------------------------
function renderSpeedAndVendorSection() {
  mainContent.innerHTML = `
    <h1>Import Profile ONT</h1>
    <div class="layout-container">

      <!-- Kolom Kiri -->
      <div class="card form-card">
        <form id="oltFormAdd">
          <div class="form-group">
            <select id="oltGponMaster" name="olt" required>
              <option value="">-- Pilih OLT --</option>
              <!-- Opsi akan diisi dari database -->
            </select>
          </div>

          <!-- Vendor Modem -->
          <div class="vendor-filter-container">
            <h2 class="filter-title">Vendor Modem</h2>
            <div class="form-group checkbox-group">
              <label><input type="checkbox" name="vendor" value="ALL"> ALL</label>
              <label><input type="checkbox" name="vendor" value="ZTE"> ZTE</label>
              <label><input type="checkbox" name="vendor" value="HUAWEI"> HUAWEI</label>
              <label><input type="checkbox" name="vendor" value="FIBERHOME"> FIBERHOME</label>
            </div>
          </div>
          <button class="tombol-simpan">Proses</button>
        </form>

        <!-- Output CLI Kiri -->
        <div class="cli-output">
          <pre><code id="outputKiri"># Output command akan tampil di sini...</code></pre>
        </div>
      </div>

      <!-- Kolom Kanan -->
      <div class="card table-card">
        <div class="bandwidth-input-container">
          <label for="uploadOLT">Upload Speed (Mbps)</label>
          <input type="number" id="uploadOLT" name="uploadOLT" placeholder="Upload Mbps" required>

          <label for="downloadOLT">Download Speed (Mbps)</label>
          <input type="number" id="downloadOLT" name="downloadOLT" placeholder="Download Mbps" required>
        </div>
        <button class="tombol-simpan">Proses</button>
        <div class="cli-output">
          <pre><code id="outputKanan"># Output command akan tampil di sini...</code></pre>
        </div>
      </div>

    </div>
  `;

  // Memanggil fungsi untuk mengisi opsi OLT dari backend
  loadOLTGponOptions();

// ------------------------ SUPPORT MODEM ---------------------------
  const oltSelect = document.getElementById('oltGponMaster');
  const outputKiri = document.getElementById('outputKiri');

  oltSelect.addEventListener('change', async () => {
  const selectedOltId = oltSelect.value;

  if (!selectedOltId) {
    outputKiri.textContent = 'Silakan pilih OLT untuk melihat informasi ONT.';
    return;
  }

  outputKiri.textContent = '🔄 Mengambil data ONT dari OLT...';

  try {
    const response = await fetch('/api/show_onu_type_print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_olt: selectedOltId })
    });

    const result = await response.json();
    outputKiri.textContent = result.output || '❌ Tidak ada output dari server.';
  } catch (error) {
    console.error(error);
    outputKiri.textContent = '❌ Gagal mengambil data dari server.';
  }
});

//--------------------------- (TELNET UPLOAD DOWNLOAD)  
 
  const rightButton = document.querySelector('.table-card .tombol-simpan');
  const uploadInput = document.getElementById('uploadOLT');
  const downloadInput = document.getElementById('downloadOLT');
  const outputKanan = document.getElementById('outputKanan');

  rightButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const selectedOltId = document.getElementById('oltGponMaster').value;
    const uploadValue = uploadInput.value;
    const downloadValue = downloadInput.value;

    if (!selectedOltId) {
      outputKanan.textContent = 'Silakan pilih OLT terlebih dahulu.';
      return;
    }

    if (!uploadValue || isNaN(uploadValue)) {
      outputKanan.textContent = 'Input upload speed harus berupa angka.';
      return;
    }

    if (!downloadValue || isNaN(downloadValue)) {
      outputKanan.textContent = 'Input download speed harus berupa angka.';
      return;
    }
  
    // Upload profile names (distinct)
    const uploadProfileNameFixed = `UP-${uploadValue}MB-OECFIX`;
    const uploadProfileNameMbw = `UP-${uploadValue}MB-OECMBW`;  
    const uploadFixedValue = uploadValue * 1024; // atau rumus fixed lainnya

    // Download profile name
    const downloadProfileName = `DOWN-${downloadValue}MB-OEC`;
    const pir = downloadValue * 1024;
    const sir = pir / 2;

    outputKanan.textContent = `Mengirim perintah ke OLT...`;

    try {
      // Upload - TCONT Type 1 (Fixed)
      const responseUploadFixed = await fetch('/api/send_tcont_command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_olt: selectedOltId,
          profileName: uploadProfileNameFixed,
          fixedValue: uploadFixedValue,
           mode: 'fixed' // 👈 tambahkan ini
        })
      });
      const resultUploadFixed = await responseUploadFixed.json();

      // Upload - TCONT Type 3 (MBW)
      const responseUploadMbw = await fetch('/api/send_tcont_command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_olt: selectedOltId,
          profileName: uploadProfileNameMbw,
          fixedValue: uploadFixedValue, // atau bisa juga kirim sir/pir, sesuai backend
          mode: 'mbw' // 👈 tambahkan ini
        })
      });
      const resultUploadMbw = await responseUploadMbw.json();

      // Download - Traffic Profile
      const responseDownload = await fetch('/api/send_tcont_command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_olt: selectedOltId,
          profileName: downloadProfileName,
          pir: pir,
          sir: sir
        })
      });
      const resultDownload = await responseDownload.json();

      outputKanan.textContent = `
      📤 Upload Profile
============================================================================
      ${resultUploadFixed.output || '❌ Tidak ada output dari server.'}

📥 Download Profile
============================================================================
      ${resultDownload.output || '❌ Tidak ada output dari server.'}
      `.trim();
      
      // ----------------- JALANKAN DATA INSERT --------------------
      // const profileList = [
      //   uploadProfileNameFixed,  // UP-xxMB-OECFIX
      //   uploadProfileNameMbw,    // UP-xxMB-OECMBW
      //   downloadProfileName      // DOWN-xxMB-OEC
      // ];

      // Insert semua ke database
      // const insertMessage = await insertPaketProfiles(selectedOltId, profileList);

      // ----------------- BATAS DATA INSERT --------------------
      outputKanan.textContent += `

      🗃️ Simpan ke Database
      ============================================================================
      ${insertMessage}
      `;

    } catch (error) {
      outputKanan.textContent = 'Gagal koneksi ke server.';
      console.error(error);
    }
  });

}

// ---------------------------- INSERT PAKET ------------------------------

// async function insertPaketProfiles(id_olt, profileNames = []) {
//   try {
//     const response = await fetch('/api/insert_limitasi_batch', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         id_olt,
//         profiles: profileNames
//       })
//     });

//     const result = await response.json();

//     if (response.ok) {
//       return result.message;
//     } else {
//       return `❌ Gagal insert: ${result.error}`;
//     }
//   } catch (error) {
//     console.error('❌ Gagal koneksi:', error);
//     return '❌ Gagal koneksi saat insert batch ke database.';
//   }
// }

// ------------------------ CONFIG PSB -------------------------------

async function renderConfigPSBSection() {
  mainContent.innerHTML = `
    <h1>Form Config PSB</h1>
    <div class="layout-container">
      <!-- Kolom Kiri -->
      <div class="card form-card">
        <form id="configPsbForm">
          <!-- Select OLT -->
          <div class="form-group">
            <label for="oltSelect">Pilih OLT</label>
            <select id="oltSelect" name="olt" required>
              <option value="">Pilih OLT</option>
            </select>
          </div>

          <div class="form-group">
            <label for="snSelect">Pilih Serial Number (SN) ONT:</label>
            <select id="snSelect" name="sn" required>
              <option value="">Pilih SN</option>
              <!-- Opsi SN diisi lewat JS -->
            </select>
          </div>
    
          <!-- Select Jenis Modem -->
          <div class="form-group">
            <label for="jenisModem">Jenis Modem</label>
            <select id="jenisModem" name="jenisModem" required>
              <option value="">Pilih Modem</option>
            </select>
          </div>

          <!-- Upload & Download Speed -->
          <div class="form-group horizontal-group">
            <div class="form-subgroup">
              <label for="uploadSpeed">Upload Speed (Mbps)</label>
              <select id="uploadSpeed" name="uploadSpeed" required>
                <option value="">Profile Tcont</option>
              </select>
            </div>
            <div class="form-subgroup">
              <label for="downloadSpeed">Download Speed (Mbps)</label>
              <select id="downloadSpeed" name="downloadSpeed" required>
                <option value="">Profile Trafick</option>
              </select>
            </div>
          </div>

          <!-- Nama Pelanggan -->
          <div class="form-group">
            <label for="namaPelanggan">Nama Pelanggan</label>
            <input type="text" id="namaPelanggan" name="namaPelanggan" placeholder="Nama Pelanggan" required>
          </div>

          <!-- PPPoE Username -->
          <div class="form-group">
            <label for="pppoeUsername">PPPoE Username</label>
            <input type="text" id="pppoeUsername" name="pppoeUsername" placeholder="PPPoE Username" required>
          </div>

          <!-- PPPoE Password -->
          <div class="form-group">
            <label for="pppoePassword">PPPoE Password</label>
            <input type="text" id="pppoePassword" name="pppoePassword" placeholder="PPPoE Password" required>
          </div>

          <div class="form-group">
            <label>Opsi Port LAN:</label>
            <div class="lan-options">
              <input type="radio" id="lockAllPorts" name="lanOption" value="lock">
              <label for="lockAllPorts">LOCK</label>

              <input type="radio" id="openAllPorts" name="lanOption" value="open">
              <label for="openAllPorts">UNLOCK</label>
            </div>
          </div>

          <!-- Alamat -->
          <div class="form-group full-width-textarea">
            <label for="alamatPelanggan">Alamat</label>
            <textarea id="alamatPelanggan" name="alamatPelanggan" placeholder="Alamat lengkap..." rows="4" required></textarea>
          </div>

          <button class="tombol-simpan">Proses</button>
        </form>
      </div>

      <!-- Kolom Kanan -->
      <div class="card table-card">
        <!-- Masih kosong -->

        <!-- Tambah di HTML card kanan -->
        <div class="card" id="hasilCard" style="white-space:pre-wrap; padding:1rem;">
          Hasil config akan tampil di sini...
        </div>

        <!-- tambahkan div ini untuk card kanan -->
        <div id="cardKanan"></div>

      </div>
    </div>
  `;

  // variabel untuk mapping SN -> Port OLT
  let snToPort = {};

  // Muat daftar OLT
  try {
    const res = await fetch('/api/list_olt');
    const data = await res.json();
    const select = document.getElementById('oltSelect');
    select.innerHTML = `<option value="">-- Pilih OLT --</option>`;
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id_olt;
      option.textContent = `${item.alamat_pop} - ${item.ip_address}`;
      option.dataset.jenis = item.jenis_olt;
      option.dataset.vlan = item.vlan;
      select.appendChild(option);
    });

    // Handler saat user pilih OLT
    select.addEventListener('change', async (event) => {
      const id_olt = event.target.value;
      const selectedOption = event.target.selectedOptions[0];
      const jenis_olt = selectedOption ? selectedOption.dataset.jenis : '';

      const jenisModemSelect = document.getElementById('jenisModem');
      const uploadSelect = document.getElementById('uploadSpeed');
      const downloadSelect = document.getElementById('downloadSpeed');
      const snSelect = document.getElementById('snSelect');

      jenisModemSelect.innerHTML = `<option value="">Memuat data ONU type...</option>`;
      uploadSelect.innerHTML = `<option value="">Memuat profile upload...</option>`;
      downloadSelect.innerHTML = `<option value="">Memuat profile download...</option>`;
      snSelect.innerHTML = `<option value="">Memuat SN...</option>`;

      if (!id_olt) return;

      try {
        // profiles dan ONU types
        const res = await fetch('/api/show_profiles_and_onu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_olt })
        });
        const result = await res.json();
        if (!res.ok) {
          alert(result.error || 'Gagal ambil data');
          return;
        }

        // isi jenis modem
        jenisModemSelect.innerHTML = `<option value="">-- Pilih Jenis Modem --</option>`;
        result.onu_types.forEach(type => {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          jenisModemSelect.appendChild(option);
        });

        // isi upload profiles
        uploadSelect.innerHTML = `<option value="">-- Profile Tcont --</option>`;
        result.upload_profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile;
          option.textContent = profile;
          uploadSelect.appendChild(option);
        });

        // isi download profiles
        downloadSelect.innerHTML = `<option value="">-- Profile Trafick --</option>`;
        result.download_profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile;
          option.textContent = profile;
          downloadSelect.appendChild(option);
        });

        // SN + Port OLT berdasarkan jenis_olt
        const snRes = await fetch('/api/show_uncfg_onu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_olt, jenis_olt })
        });
        const snResult = await snRes.json();

        if (snRes.ok) {
          snSelect.innerHTML = `<option value="">-- Pilih SN --</option>`;
          snToPort = {}; // reset mapping
          snResult.sn_list.forEach((sn, i) => {
            const option = document.createElement('option');
            option.value = sn;
            option.textContent = sn;
            snSelect.appendChild(option);
            snToPort[sn] = snResult.index_list[i]; // buat mapping
          });

          // tampilkan daftar SN + Port OLT di card kanan
          const tableCard = document.querySelector('.table-card');
          let html = `<h3>Daftar SN & Port OLT (OnuIndex)</h3><ul>`;
          snResult.index_list.forEach((idx, i) => {
            html += `<li><strong>${snResult.sn_list[i]}</strong> ➡️ Port: ${idx}</li>`;
          });
          html += `</ul>`;
          tableCard.innerHTML = html;

        } else {
          alert(snResult.error || 'Gagal ambil SN');
        }

      } catch (err) {
        console.error(err);
      }
    });

    // handler saat user pilih SN tertentu
    document.getElementById('snSelect').addEventListener('change', (event) => {
      const selectedSn = event.target.value;
      if (!selectedSn) return;
      const port = snToPort[selectedSn] || '(port tidak ditemukan)';

      // tampilkan port untuk SN terpilih di card kanan
      const tableCard = document.querySelector('.table-card');
      tableCard.innerHTML = `
        <h3>Informasi SN Terpilih</h3>
        <p><strong>SN:</strong> ${selectedSn}</p>
        <p><strong>Port:</strong> ${port}</p>
      `;
    });

  } catch (err) {
    console.error('Gagal memuat daftar OLT:', err);
  }

// ------------------ SELECTED SN -----------------------

// handler saat user pilih SN tertentu
document.getElementById('snSelect').addEventListener('change', async (event) => {
  const selectedSn = event.target.value;
  if (!selectedSn) return;
  const portWithIndex = snToPort[selectedSn]; // contoh "1/3/3:1"
  const portOnly = portWithIndex.split(':')[0]; // contoh "1/3/3"

  // tampilkan loading awal di card kanan
  const tableCard = document.querySelector('.table-card');
  tableCard.innerHTML = `
    <h3>Informasi SN Terpilih</h3>
    <p><strong>SN:</strong> ${selectedSn}</p>
    <p><strong>Port:</strong> ${portWithIndex}</p>
    <p>Memeriksa slot kosong...</p>
  `;

  const oltSelect = document.getElementById('oltSelect');
  const id_olt = oltSelect.value;
  const jenis_olt = oltSelect.selectedOptions[0].dataset.jenis;

  try {
    const res = await fetch('/api/check_empty_onu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_olt, jenis_olt, port_olt: portOnly })
    });
    const data = await res.json();
    if (res.ok) {
      tableCard.innerHTML = `
        <h3>Informasi SN Terpilih</h3>
        <p><strong>SN:</strong> ${selectedSn}</p>
        <p><strong>Port:</strong> ${portWithIndex}</p>
        <p><strong>ONU berikutnya:</strong> ${data.next_onu || 'penuh'}</p>
        <small style="color:#888">Slot terpakai: ${data.used_onu.join(', ')}</small>
      `;
    } else {
      tableCard.innerHTML += `<p style="color:red">${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    tableCard.innerHTML += `<p style="color:red">Gagal memeriksa slot kosong</p>`;
  }
});

// ------------------------ MAPPING SN --------------------------------

// --- Saat load SN list dari backend ---
let snInfoMap = {}; // mapping sn → {port_base, next_onu}

async function loadSNList(idOlt, jenisOlt) {
  const res = await fetch('/api/show_uncfg_onu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_olt: idOlt, jenis_olt: jenisOlt })
  });
  const data = await res.json();

  const snSelect = document.getElementById('snSelect');
  snSelect.innerHTML = '<option value="">-- Pilih SN --</option>';
  snInfoMap = {};

  data.sn_list.forEach(item => {
    // backend harus kirimkan port_index & next_onu juga
    snInfoMap[item.sn] = {
      port_base: item.port_index,
      next_onu: item.next_onu
    };
    const option = document.createElement('option');
    option.value = item.sn;
    option.textContent = `${item.sn} (${item.port_index}:${item.next_onu})`;
    snSelect.appendChild(option);
  });
}

// --- Saat pilih SN ---
document.getElementById('snSelect').addEventListener('change', (event) => {
  const selectedSn = event.target.value;
  if (!selectedSn) return;

  const info = snInfoMap[selectedSn];
  if (!info) return;

  // gabungkan port_base dan next_onu jadi "1/3/3:16"
  window.currentPortWithIndex = `${info.port_base}:${info.next_onu}`;

  // tampilkan info di card kanan
  const infoCard = document.getElementById('infoCard');
  if (infoCard) {
    infoCard.innerHTML = `
      <p><strong>Port:</strong> ${info.port_base}</p>
      <p><strong>ONU berikutnya:</strong> ${info.next_onu || 'penuh'}</p>
    `;
  }
});

// ------------------------ TOMBOL PROSES ------------------------------

document.getElementById('configPsbForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const oltSelect = document.getElementById('oltSelect');
    const id_olt = oltSelect.value;
    const jenis_olt = oltSelect.selectedOptions[0].dataset.jenis;
    const selectedSn = document.getElementById('snSelect').value;

    const infoCard = document.querySelector('.table-card');
    let port_base = '';
    let onu_num = '';

    if (infoCard) {
      const pList = infoCard.querySelectorAll('p');
      pList.forEach(p => {
        const text = p.textContent;
        if (text.includes('Port:')) {
          port_base = text.split('Port:')[1].trim();
        }
        if (text.includes('ONU berikutnya:')) {
          onu_num = text.split('ONU berikutnya:')[1].trim();
          if (onu_num === 'penuh') onu_num = '';
        }
      });
    }

    // ambil nilai radio LOCK/UNLOCK LAN
    const lockValue = document.querySelector('input[name="lanOption"]:checked')?.value || '';

    const payload = {
      id_olt,
      jenis_olt,
      port_base,
      onu_num,
      jenis_modem: document.getElementById('jenisModem').value,
      sn: selectedSn,
      nama_pelanggan: document.getElementById('namaPelanggan').value,
      alamat: document.getElementById('alamatPelanggan').value,
      upload_profile: document.getElementById('uploadSpeed').value,
      download_profile: document.getElementById('downloadSpeed').value,
      vlan: oltSelect.selectedOptions[0].dataset.vlan || '',
      pppoe_username: document.getElementById('pppoeUsername').value,
      pppoe_password: document.getElementById('pppoePassword').value,
      lock: lockValue   // ini yang dikirim: "lock" atau "open"
    };

    // tampilkan payload
    infoCard.innerHTML = `
      <h3>Mengirim Data Config PSB...</h3>
      <pre>${JSON.stringify(payload, null, 2)}</pre>
    `;

    try {
      const res = await fetch('/api/config_onu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        infoCard.innerHTML = `
          <h3>Hasil Config dari OLT</h3>
          <p>Kode PSB: <strong>${data.kode_psb}</strong></p>
          <pre>${data.output}</pre>
        `;
      } else {
        infoCard.innerHTML += `<p style="color:red">Gagal config: ${data.error || 'Unknown error'}</p>`;
      }
    } catch (err) {
      console.error(err);
      infoCard.innerHTML += `<p style="color:red">Error koneksi ke server</p>`;
    }
  });
}

function showReport() {
  mainContent.innerHTML = `
    <div class="report-container">
      <h1>Report</h1>

      <div class="card">
        <div class="form-group">
          <input type="text" id="searchReport" placeholder="Ketik kata kunci...">
        </div>

        <table id="reportTable">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Alamat</th>
              <th>Sn</th>
              <th>Port</th>
              <th>Onu</th>
              <th>VLAN</th>
              <th>Upload</th>
              <th>Download</th>
              <th>Username</th>
              <th>Password</th>
              <th>Lan</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

        <div id="pagination" class="pagination-container"></div>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('searchReport');
  let rowsData = [];
  const rowsPerPage = 10;
  let currentPage = 1;

  async function loadReportData() {
    try {
      const response = await fetch('/api/get_report_data');
      const data = await response.json();
      rowsData = data;

      renderTableRows(rowsData);
      displayPage(currentPage);
    } catch (error) {
      console.error('Gagal load report:', error);
    }
  }

  function renderTableRows(data) {
    const tbody = document.querySelector('#reportTable tbody');
    tbody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.nama_pelanggan || ''}</td>
        <td>${row.alamat || ''}</td>
        <td>${row.sn || ''}</td>
        <td>${row.port_base || ''}</td>
        <td>${row.onu_num || ''}</td>
        <td>${row.vlan || ''}</td>
        <td>${row.upload_profile || ''}</td>
        <td>${row.download_profile || ''}</td>
        <td>${row.pppoe_username || ''}</td>
        <td>${row.pppoe_password || ''}</td>
        <td>${row.lan_lock || ''}</td>
        <td>${row.created_at || ''}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function displayPage(page) {
    const tbody = document.querySelector('#reportTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    rows.forEach((row, index) => {
      row.style.display = (index >= (page-1)*rowsPerPage && index < page*rowsPerPage) ? '' : 'none';
    });

    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.disabled = page === 1;
    prevBtn.addEventListener('click', () => {
      currentPage--;
      displayPage(currentPage);
    });
    paginationContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === page) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentPage = i;
        displayPage(currentPage);
      });
      paginationContainer.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.disabled = page === totalPages;
    nextBtn.addEventListener('click', () => {
      currentPage++;
      displayPage(currentPage);
    });
    paginationContainer.appendChild(nextBtn);
  }

  searchInput.addEventListener('keyup', () => {
    const filter = searchInput.value.toLowerCase();
    const filteredData = rowsData.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(filter))
    );
    renderTableRows(filteredData);
    currentPage = 1;
    displayPage(currentPage);
  });

  loadReportData();
}


